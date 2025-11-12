// hooks/usetask.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// task shape (matches Prisma model)
export interface task {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  storyId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createtaskApi(payload: {
  storyId: number;
  name: string;
  description?: string;
}) {
  return apiPost<{ success: boolean; data: task }>(`/task/create`, payload);
}

export async function updatetaskApi(payload: {
  taskId: number;
  name?: string;
  description?: string;
}) {
  return apiPatch<{ success: boolean; data: task }>(
    `/task/${payload.taskId}`,
    payload
  );
}

export async function deletetaskApi(taskId: number) {
  return apiDelete<{ success: boolean }>(`/task/${taskId}`);
}

export async function gettaskApi(storyId: number) {
  return apiGet<{ success: boolean }>(`/task/${storyId}`);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchtasks(id) {
  return useQuery<task, Error>({
    queryKey: ["task"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: task }>(`/task/${id}`);
      if (!res || !res.success) throw new Error("Failed to fetch project task");
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

/* ---------- types ---------- */
type task = {
  id: number | string;
  name: string;
  description?: string;
  createdAt?: string;
  storyId?: number;
  // add any other fields your API returns
};

type CreatetaskPayload = {
  storyId: number;
  name: string;
  description?: string;
  // any other fields you pass to create the task
};

/* ---------- hook ---------- */
export function useFetchtaskFromStory() {
  const qc = useQueryClient();

  return useMutation<task, Error, CreatetaskPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreatetaskPayload) => {
      return gettaskApi(payload.storyId);
    },

    onMutate: async (payload) => {
      // optimistic update: cancel outgoing queries and snapshot previous data
      await qc.cancelQueries(["tasks", payload.storyId]);

      const previous = qc.getQueryData<task[]>(["tasks", payload.storyId]);

      // create a temporary task (negative id to denote "temp")
      const temptask: task = {
        id: `temp-${Date.now()}`,
        name: payload.name,
        description: payload.description ?? "",
        createdAt: new Date().toISOString(),
        storyId: payload.storyId,
      };

      // insert temp task at the start of the tasks list for that epic
      qc.setQueryData<task[]>(["tasks", payload.storyId], (old = []) => [
        temptask,
        ...old,
      ]);

      // return context for possible rollback
      return { previous };
    },

    onError: (_err, payload, context: any) => {
      // rollback to previous state (if available)
      qc.setQueryData<task[]>(
        ["tasks", payload.storyId],
        context?.previous ?? []
      );
    },

    onSettled: (_data, _err, variables) => {
      // always refetch canonical data for that epic's tasks
      qc.invalidateQueries(["tasks", variables.storyId]);
      // If your epics list includes task counts or previews, you may also invalidate epics:
      qc.invalidateQueries(["epics"]);
    },
  });
}

export function useFetchtask(id?: number | string) {
  return useQuery<task, Error>({
    queryKey: ["task"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: task }>(`/task/${id}`);
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
export function fetchtasks(id?: number | string) {
  return useQuery<task, Error>({
    queryKey: ["task"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: task }>(`/task/${id}`);
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
// Create task
export function useCreatetask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      storyId: number;
      name: string;
      description?: string;
      creator?: string;
    }) => createtaskApi(payload),
    onMutate: async (payload) => {
      // Optional optimistic update: snapshot and insert
      await qc.cancelQueries(["epics", payload.storyId]);
      const previous = qc.getQueryData<task[]>(["task", payload.storyId]);
      // create a placeholder task id (negative temp id)
      const temptask: task = {
        id: Date.now() * -1,
        name: payload.name,
        description: payload.description ?? "",
        createdAt: new Date().toISOString(),
        storyId: payload.storyId,
      };
      qc.setQueryData<task[]>(["task", payload.storyId], (old) =>
        old ? [temptask, ...old] : [temptask]
      );
      return { previous };
    },
    onError: (_err, payload, context: any) => {
      // rollback
      qc.setQueryData(["task", payload.storyId], context?.previous ?? []);
    },
    onSettled: (_data, _err, variables) => {
      // Invalidate both task list for that project and the epics list (if it contains task)
      qc.invalidateQueries(["task", variables.storyId]);
      qc.invalidateQueries(["epics"]);
    },
  });
}

// Update task
export function useUpdatetask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      taskId: number;
      name?: string;
      description?: string;
      storyId?: number;
    }) =>
      updatetaskApi({
        taskId: payload.taskId,
        name: payload.name,
        description: payload.description,
      }),
    onMutate: async (payload) => {
      // optimistic update: update task in project task cache if available
      if (payload.storyId) {
        await qc.cancelQueries(["task", payload.storyId]);
        const prev = qc.getQueryData<task[]>(["task", payload.storyId]);
        qc.setQueryData<task[]>(["task", payload.storyId], (old) =>
          old
            ? old.map((e) =>
                e.id === payload.taskId
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
        qc.setQueryData(["task", context.storyId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      if (variables.storyId) {
        qc.invalidateQueries(["task", variables.storyId]);
      }
      qc.invalidateQueries(["epics"]);
    },
  });
}

// Delete task
export function useDeletetask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { taskId: number; storyId: number }) =>
      deletetaskApi(payload.taskId),
    onMutate: async (payload) => {
      await qc.cancelQueries(["task", payload.storyId]);
      const previous = qc.getQueryData<task[]>(["task", payload.storyId]);
      qc.setQueryData<task[]>(["task", payload.storyId], (old) =>
        old ? old.filter((e) => e.id !== payload.taskId) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      // rollback
      if (context?.previous) {
        qc.setQueryData(["task"], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries(["task", variables.storyId]);
      qc.invalidateQueries(["epics"]);
    },
  });
}
