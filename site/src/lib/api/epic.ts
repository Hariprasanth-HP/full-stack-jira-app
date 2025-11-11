// hooks/useEpics.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// Epic shape (matches Prisma model)
export interface Epic {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  projectId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createEpicApi(payload: {
  projectId: number;
  name: string;
  description?: string;
}) {
  return apiPost<{ success: boolean; data: Epic }>(`/epic/create`, payload);
}

export async function updateEpicApi(payload: {
  epicId: number;
  name?: string;
  description?: string;
}) {
  return apiPatch<{ success: boolean; data: Epic }>(
    `/epics/${payload.epicId}`,
    payload
  );
}

export async function deleteEpicApi(epicId: number) {
  return apiDelete<{ success: boolean }>(`/epic/${epicId}`);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchEpics(id) {
  return useQuery<Epic, Error>({
    queryKey: ["epic"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: Epic }>(`/epic/${id}`);
      if (!res || !res.success)
        throw new Error("Failed to fetch project epics");
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useFetchEpic(id?: number | string) {
  return useQuery<Epic, Error>({
    queryKey: ["epic"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: Epic }>(`/epic/${id}`);
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
// Create Epic
export function useCreateEpic() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      projectId: number;
      name: string;
      description?: string;
      creator?: string;
    }) => createEpicApi(payload),
    onMutate: async (payload) => {
      // Optional optimistic update: snapshot and insert
      await qc.cancelQueries(["projects", payload.projectId]);
      const previous = qc.getQueryData<Epic[]>(["epics", payload.projectId]);
      // create a placeholder epic id (negative temp id)
      const tempEpic: Epic = {
        id: Date.now() * -1,
        name: payload.name,
        description: payload.description ?? "",
        createdAt: new Date().toISOString(),
        projectId: payload.projectId,
      };
      qc.setQueryData<Epic[]>(["epics", payload.projectId], (old) =>
        old ? [tempEpic, ...old] : [tempEpic]
      );
      return { previous };
    },
    onError: (_err, payload, context: any) => {
      // rollback
      qc.setQueryData(["epics", payload.projectId], context?.previous ?? []);
    },
    onSettled: (_data, _err, variables) => {
      // Invalidate both epics list for that project and the projects list (if it contains epics)
      qc.invalidateQueries(["epics", variables.projectId]);
      qc.invalidateQueries(["projects"]);
    },
  });
}

// Update Epic
export function useUpdateEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      epicId: number;
      name?: string;
      description?: string;
      projectId?: number;
    }) =>
      updateEpicApi({
        epicId: payload.epicId,
        name: payload.name,
        description: payload.description,
      }),
    onMutate: async (payload) => {
      // optimistic update: update epic in project epics cache if available
      if (payload.projectId) {
        await qc.cancelQueries(["epics", payload.projectId]);
        const prev = qc.getQueryData<Epic[]>(["epics", payload.projectId]);
        qc.setQueryData<Epic[]>(["epics", payload.projectId], (old) =>
          old
            ? old.map((e) =>
                e.id === payload.epicId
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
        return { previous: prev, projectId: payload.projectId };
      }
      return {};
    },
    onError: (err, payload: any, context: any) => {
      if (context?.projectId) {
        qc.setQueryData(["epics", context.projectId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      if (variables.projectId) {
        qc.invalidateQueries(["epics", variables.projectId]);
      }
      qc.invalidateQueries(["projects"]);
    },
  });
}

// Delete Epic
export function useDeleteEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { epicId: number; projectId: number }) =>
      deleteEpicApi(payload.epicId),
    onMutate: async (payload) => {
      await qc.cancelQueries(["epics", payload.projectId]);
      const previous = qc.getQueryData<Epic[]>(["epics", payload.projectId]);
      qc.setQueryData<Epic[]>(["epics", payload.projectId], (old) =>
        old ? old.filter((e) => e.id !== payload.epicId) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      // rollback
      if (context?.previous) {
        qc.setQueryData(["epics"], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries(["epics", variables.projectId]);
      qc.invalidateQueries(["projects"]);
    },
  });
}
