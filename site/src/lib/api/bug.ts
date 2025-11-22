// hooks/usebug.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// bug shape (matches Prisma model)
export interface bug {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  storyId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createbugApi(payload: {
  storyId: number;
  name: string;
  description?: string;
}) {
  return apiPost<{ success: boolean; data: bug }>(`/bug/create`, payload);
}

export async function updatebugApi(payload: {
  bugId: number;
  name?: string;
  description?: string;
}) {
  return apiPatch<{ success: boolean; data: bug }>(
    `/bug/${payload.bugId}`,
    payload
  );
}

export async function deletebugApi(bugId: number) {
  return apiDelete<{ success: boolean }>(`/bug/${bugId}`);
}

export async function getbugFromStoryApi(storyId: number) {
  return apiGet<{ success: boolean }>(`/bug/${storyId}`);
}

export async function getbugApi(id: number) {
  return apiGet<{ success: boolean }>(`/bug/get/${id}`);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchBugs(id) {
  return useQuery<bug, Error>({
    queryKey: ["bug"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: bug }>(`/bug/${id}`);
      if (!res || !res.success) throw new Error("Failed to fetch project bug");
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

/* ---------- types ---------- */
type bug = {
  id: number | string;
  name: string;
  description?: string;
  createdAt?: string;
  storyId?: number;
  // add any other fields your API returns
};

type CreatebugPayload = {
  storyId: number;
  name: string;
  description?: string;
  // any other fields you pass to create the bug
};

/* ---------- hook ---------- */
export function useFetchbugFromStory() {
  return useMutation<bug, Error, CreatebugPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreatebugPayload) => {
      return getbugFromStoryApi(payload.storyId);
    },
  });
}

export function useFetchbug() {
  return useMutation<bug, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getbugApi(payload.id);
    },
  });
}
export function fetchbugs(id?: number | string) {
  return useQuery<bug, Error>({
    queryKey: ["bug"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: bug }>(`/bug/${id}`);
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
// Create bug
export function useCreatebug() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      storyId: number;
      name: string;
      description?: string;
      creator?: string;
    }) => createbugApi(payload),
    onMutate: async (payload) => {
      // Optional optimistic update: snapshot and insert
      await qc.cancelQueries(["epics", payload.storyId]);
      const previous = qc.getQueryData<bug[]>(["bug", payload.storyId]);
      // create a placeholder bug id (negative temp id)
      const tempbug: bug = {
        id: Date.now() * -1,
        name: payload.name,
        description: payload.description ?? "",
        createdAt: new Date().toISOString(),
        storyId: payload.storyId,
      };
      qc.setQueryData<bug[]>(["bug", payload.storyId], (old) =>
        old ? [tempbug, ...old] : [tempbug]
      );
      return { previous };
    },
    onError: (_err, payload, context: any) => {
      // rollback
      qc.setQueryData(["bug", payload.storyId], context?.previous ?? []);
    },
    onSettled: (_data, _err, variables) => {
      // Invalidate both bug list for that project and the epics list (if it contains bug)
      qc.invalidateQueries(["bug", variables.storyId]);
      qc.invalidateQueries(["epics"]);
    },
  });
}

// Update bug
export function useUpdatebug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      bugId: number;
      name?: string;
      description?: string;
      storyId?: number;
    }) =>
      updatebugApi({
        bugId: payload.bugId,
        name: payload.name,
        description: payload.description,
      }),
    onMutate: async (payload) => {
      // optimistic update: update bug in project bug cache if available
      if (payload.storyId) {
        await qc.cancelQueries(["bug", payload.storyId]);
        const prev = qc.getQueryData<bug[]>(["bug", payload.storyId]);
        qc.setQueryData<bug[]>(["bug", payload.storyId], (old) =>
          old
            ? old.map((e) =>
                e.id === payload.bugId
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
        return { previous: prev, storyId: payload.storyId };
      }
      return {};
    },
    onError: (err, payload: any, context: any) => {
      if (context?.storyId) {
        qc.setQueryData(["bug", context.storyId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      if (variables.storyId) {
        qc.invalidateQueries(["bug", variables.storyId]);
      }
      qc.invalidateQueries(["epics"]);
    },
  });
}

// Delete bug
export function useDeletebug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { bugId: number; storyId: number }) =>
      deletebugApi(payload.bugId),
    onMutate: async (payload) => {
      await qc.cancelQueries(["bug", payload.storyId]);
      const previous = qc.getQueryData<bug[]>(["bug", payload.storyId]);
      qc.setQueryData<bug[]>(["bug", payload.storyId], (old) =>
        old ? old.filter((e) => e.id !== payload.bugId) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      // rollback
      if (context?.previous) {
        qc.setQueryData(["bug"], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries(["bug", variables.storyId]);
      qc.invalidateQueries(["epics"]);
    },
  });
}
