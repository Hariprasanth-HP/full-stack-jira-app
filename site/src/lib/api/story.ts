// hooks/usestorys.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// story shape (matches Prisma model)
export interface story {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  epicId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createStoryApi(payload: {
  epicId: number;
  name: string;
  description?: string;
}) {
  return apiPost<{ success: boolean; data: story }>(`/story/create`, payload);
}

export async function updatestoryApi(payload: {
  storyId: number;
  name?: string;
  description?: string;
}) {
  return apiPatch<{ success: boolean; data: story }>(
    `/storys/${payload.storyId}`,
    payload
  );
}

export async function deletestoryApi(storyId: number) {
  return apiDelete<{ success: boolean }>(`/story/${storyId}`);
}

export async function getstoryApi(epicId: number) {
  return apiGet<{ success: boolean }>(`/story/${epicId}`);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchstories(id) {
  return useQuery<story, Error>({
    queryKey: ["story"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: story }>(
        `/story/${id}`
      );
      if (!res || !res.success)
        throw new Error("Failed to fetch project storys");
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

/* ---------- types ---------- */
type Story = {
  id: number | string;
  name: string;
  description?: string;
  createdAt?: string;
  epicId?: number;
  // add any other fields your API returns
};

type CreateStoryPayload = {
  epicId: number;
  name: string;
  description?: string;
  // any other fields you pass to create the story
};

/* ---------- hook ---------- */
export function useFetchstoryFromEpic() {
  const qc = useQueryClient();

  return useMutation<Story, Error, CreateStoryPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreateStoryPayload) => {
      return getstoryApi(payload.epicId);
    },

    onMutate: async (payload) => {
      // optimistic update: cancel outgoing queries and snapshot previous data
      await qc.cancelQueries(["stories", payload.epicId]);

      const previous = qc.getQueryData<Story[]>(["stories", payload.epicId]);

      // create a temporary story (negative id to denote "temp")
      const tempStory: Story = {
        id: `temp-${Date.now()}`,
        name: payload.name,
        description: payload.description ?? "",
        createdAt: new Date().toISOString(),
        epicId: payload.epicId,
      };

      // insert temp story at the start of the stories list for that epic
      qc.setQueryData<Story[]>(["stories", payload.epicId], (old = []) => [
        tempStory,
        ...old,
      ]);

      // return context for possible rollback
      return { previous };
    },

    onError: (_err, payload, context: any) => {
      // rollback to previous state (if available)
      qc.setQueryData<Story[]>(
        ["stories", payload.epicId],
        context?.previous ?? []
      );
    },

    onSettled: (_data, _err, variables) => {
      // always refetch canonical data for that epic's stories
      qc.invalidateQueries(["stories", variables.epicId]);
      // If your epics list includes story counts or previews, you may also invalidate epics:
      qc.invalidateQueries(["epics"]);
    },
  });
}

export function useFetchstory(id?: number | string) {
  return useQuery<story, Error>({
    queryKey: ["story"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: story }>(
        `/story/${id}`
      );
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
export function fetchStories(id?: number | string) {
  return useQuery<story, Error>({
    queryKey: ["story"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: story }>(
        `/story/${id}`
      );
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
// Create story
export function useCreatestory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      epicId: number;
      name: string;
      description?: string;
      creator?: string;
    }) => createStoryApi(payload),
    onMutate: async (payload) => {
      // Optional optimistic update: snapshot and insert
      await qc.cancelQueries(["epics", payload.epicId]);
      const previous = qc.getQueryData<story[]>(["storys", payload.epicId]);
      // create a placeholder story id (negative temp id)
      const tempstory: story = {
        id: Date.now() * -1,
        name: payload.name,
        description: payload.description ?? "",
        createdAt: new Date().toISOString(),
        epicId: payload.epicId,
      };
      qc.setQueryData<story[]>(["storys", payload.epicId], (old) =>
        old ? [tempstory, ...old] : [tempstory]
      );
      return { previous };
    },
    onError: (_err, payload, context: any) => {
      // rollback
      qc.setQueryData(["storys", payload.epicId], context?.previous ?? []);
    },
    onSettled: (_data, _err, variables) => {
      // Invalidate both storys list for that project and the epics list (if it contains storys)
      qc.invalidateQueries(["storys", variables.epicId]);
      qc.invalidateQueries(["epics"]);
    },
  });
}

// Update story
export function useUpdatestory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      storyId: number;
      name?: string;
      description?: string;
      epicId?: number;
    }) =>
      updatestoryApi({
        storyId: payload.storyId,
        name: payload.name,
        description: payload.description,
      }),
    onMutate: async (payload) => {
      // optimistic update: update story in project storys cache if available
      if (payload.epicId) {
        await qc.cancelQueries(["storys", payload.epicId]);
        const prev = qc.getQueryData<story[]>(["storys", payload.epicId]);
        qc.setQueryData<story[]>(["storys", payload.epicId], (old) =>
          old
            ? old.map((e) =>
                e.id === payload.storyId
                  ? {
                      ...e,
                      ...(payload.name ? { name: payload.name } : {}),
                      ...(payload.description
                        ? { description: payload.description }
                        : {}),
                    }
                  : e
              )
            : old
        );
        return { previous: prev, epicId: payload.epicId };
      }
      return {};
    },
    onError: (err, payload: any, context: any) => {
      if (context?.epicId) {
        qc.setQueryData(["storys", context.epicId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      if (variables.epicId) {
        qc.invalidateQueries(["storys", variables.epicId]);
      }
      qc.invalidateQueries(["epics"]);
    },
  });
}

// Delete story
export function useDeletestory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { storyId: number; epicId: number }) =>
      deletestoryApi(payload.storyId),
    onMutate: async (payload) => {
      await qc.cancelQueries(["storys", payload.epicId]);
      const previous = qc.getQueryData<story[]>(["storys", payload.epicId]);
      qc.setQueryData<story[]>(["storys", payload.epicId], (old) =>
        old ? old.filter((e) => e.id !== payload.storyId) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      // rollback
      if (context?.previous) {
        qc.setQueryData(["storys"], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries(["storys", variables.epicId]);
      qc.invalidateQueries(["epics"]);
    },
  });
}
