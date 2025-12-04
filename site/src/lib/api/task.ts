// hooks/usetask.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient'; // implement if not present
import type { Task } from '@/types/type';

/**
 * API response shapes
 */
type TaskApiResSingle = { success: boolean; data: Task };
type TaskApiResList = { success: boolean; data: Task[] };
type GenericSuccess = { success: boolean };

/* --- API helpers (tiny wrappers) --- */
/* adjust paths to match your server routes */

export async function createtaskApi(payload: {
  projectId: number;
  name: string;
  description?: string;
}) {
  return apiPost<TaskApiResSingle>(`/task`, payload);
}

export async function updatetaskApi(payload: {
  taskId: number;
  name?: string;
  description?: string;
}) {
  // use taskId consistently
  return apiPatch<TaskApiResSingle>(`/task/${payload.taskId}`, payload);
}

export async function deletetaskApi(taskId: number) {
  return apiDelete<GenericSuccess>(`/task/${taskId}`);
}

export async function getTaskFromProjectApi(projectId: number) {
  return apiGet<TaskApiResList>(`/task?projectId=${projectId}`);
}

export async function getTaskApi(id: number) {
  return apiGet<TaskApiResSingle>(`/task/get/${id}`);
}

/* --- React Query hooks / helpers --- */

/* Fetch single task by id (query) */
export function useFetchtasks(id?: number | string) {
  return useQuery<Task, Error>({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) throw new Error('No task id provided');
      const res = await apiGet<TaskApiResSingle>(`/task/${id}`);
      if (!res || !res.success) throw new Error('Failed to fetch project task');
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useFetchtasksFromProject() {
  return useMutation<TaskApiResList, Error, { projectId: number }>({
    mutationFn: async (payload) => {
      // ensure projectId is present
      if (typeof payload.projectId !== 'number') {
        throw new Error('projectId is required');
      }
      return getTaskFromProjectApi(payload.projectId);
    },
  });
}

/* Fetch single task (mutation-style hook in your original code).
   Kept as mutation to match original pattern.
*/
export function useFetchtask() {
  return useMutation<TaskApiResSingle, Error, { id: number }>({
    mutationFn: async (payload) => {
      if (typeof payload.id !== 'number') {
        throw new Error('id is required');
      }
      return getTaskApi(payload.id);
    },
  });
}

export function useCreatetask() {
  return useMutation<
    TaskApiResSingle,
    Error,
    {
      projectId: number;
      name: string;
      description?: string;
      creator?: string;
    }
  >({
    mutationFn: (payload) => createtaskApi(payload),
  });
}

/* Update task */
export function useUpdatetask() {
  return useMutation<
    TaskApiResSingle,
    Error,
    {
      taskId: number;
      name?: string;
      description?: string;
      projectId?: number;
    }
  >({
    mutationFn: (payload) => updatetaskApi(payload),
  });
}

/* Delete task */
export function useDeletetask() {
  return useMutation<
    GenericSuccess,
    Error,
    { taskId: number; projectId?: number }
  >({
    mutationFn: (payload) => {
      if (typeof payload.taskId !== 'number') {
        throw new Error('taskId is required');
      }
      return deletetaskApi(payload.taskId);
    },
  });
}
