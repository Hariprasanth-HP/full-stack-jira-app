// hooks/usetask.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// task shape (matches Prisma model)
export interface task {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  projectId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createtaskApi(payload: {
  projectId: number;
  name: string;
  description?: string;
}) {
  return apiPost<{ success: boolean; data: task }>(`/task`, payload);
}

export async function updatetaskApi(payload: {
  taskId: number;
  name?: string;
  description?: string;
}) {
  console.log("ppppppppppp", payload);

  return apiPatch<{ success: boolean; data: task }>(
    `/task/${payload.id}`,
    payload
  );
}

export async function deletetaskApi(taskId: number) {
  return apiDelete<{ success: boolean }>(`/task/${taskId}`);
}

export async function getTaskFromProjectApi(projectId: number) {
  return apiGet<{ success: boolean }>(`/task?projectId=${projectId}`);
}

export async function getTaskApi(id: number) {
  return apiGet<{ success: boolean }>(`/task/get/${id}`);
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
type Task = {
  id: number | string;
  name: string;
  description?: string;
  createdAt?: string;
  projectId?: number;
  // add any other fields your API returns
};

type CreatetaskPayload = {
  projectId: number;
  name: string;
  description?: string;
  // any other fields you pass to create the task
};

/* ---------- hook ---------- */
export function useFetchtasksFromProject() {
  return useMutation<task, Error, CreatetaskPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreatetaskPayload) => {
      return getTaskFromProjectApi(payload.projectId);
    },
  });
}

export function useFetchtask() {
  return useMutation<task, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getTaskApi(payload.id);
    },
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
  return useMutation({
    mutationFn: (payload: {
      projectId: number;
      name: string;
      description?: string;
      creator?: string;
    }) => createtaskApi(payload),
  });
}

// Update task
export function useUpdatetask() {
  return useMutation({
    mutationFn: (payload: {
      taskId: number;
      name?: string;
      description?: string;
      projectId?: number;
    }) => updatetaskApi(payload),
  });
}

// Delete task
export function useDeletetask() {
  return useMutation({
    mutationFn: (payload: { taskId: number; projectId: number }) =>
      deletetaskApi(payload.id),
  });
}
