// hooks/useStatus.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient';

/**
 * NOTE: apiPost/apiPatch/apiDelete/apiGet are assumed to:
 * - return an object shaped like { success: boolean; data: T; error?: string }
 * - throw on network failures
 *
 * Adjust the typing / unwrap logic below if your client returns a different shape.
 */

/* ---------- Types ---------- */
export type Status = {
  id: number;
  name: string;
  color?: string | null;
  sortOrder?: number | null;
  projectId: number;
  createdAt?: string;
  about?: string | null;
};

type ApiResponse<T> = { success: boolean; data: T; error?: string };

/* ---------- API helpers ---------- */
export async function createStatusApi(payload: Partial<Status>) {
  const res = await apiPost<ApiResponse<Status>>('/status', payload);
  if (!res || !res.success)
    throw new Error(res?.error ?? 'Create status failed');
  return res.data;
}

export async function updateStatusApi(payload: {
  statusId: number;
  name?: string;
  color?: string;
  sortOrder?: number | null;
  about?: string | null;
}) {
  const { statusId, ...rest } = payload;
  const res = await apiPatch<ApiResponse<Status>>(`/status/${statusId}`, rest);
  if (!res || !res.success)
    throw new Error(res?.error ?? 'Update status failed');
  return res.data;
}

export async function deleteStatusApi(statusId: number) {
  const res = await apiDelete<ApiResponse<null>>(`/status/${statusId}`);
  if (!res || !res.success)
    throw new Error(res?.error ?? 'Delete status failed');
  return res;
}

export async function getStatusFromProjectApi(projectId: number) {
  const res = await apiGet<ApiResponse<Status[]>>(
    `/status?projectId=${projectId}`
  );
  if (!res || !res.success)
    throw new Error(res?.error ?? 'Fetch statuses failed');
  return res.data;
}

/* ---------- Query keys ---------- */
const statusKeys = {
  all: ['statuses'] as const,
  byProject: (projectId: number | string) =>
    [...statusKeys.all, 'byProject', projectId] as const,
  detail: (statusId: number | string) =>
    [...statusKeys.all, 'detail', statusId] as const,
};

/* ---------- Hooks ---------- */

/** Fetch statuses for a project */
export function useStatuses(
  projectId?: number | string,
  options?: { enabled?: boolean }
) {
  return useQuery<Status[], Error>({
    queryKey: statusKeys.byProject(projectId ?? 'unknown'),
    queryFn: async () => {
      if (!projectId) throw new Error('No projectId provided');
      return getStatusFromProjectApi(Number(projectId));
    },
    enabled: !!projectId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 2, // 2 minutes default
  });
}

/** Fetch single status by id (optional) */
export function useStatus(statusId?: number | string) {
  return useQuery<Status, Error>({
    queryKey: statusKeys.detail(statusId ?? 'unknown'),
    queryFn: async () => {
      if (!statusId) throw new Error('No statusId provided');
      const res = await apiGet<ApiResponse<Status>>(`/status/${statusId}`);
      if (!res || !res.success)
        throw new Error(res?.error ?? 'Failed to fetch status');
      return res.data;
    },
    enabled: !!statusId,
  });
}

/* ---------- Mutations ---------- */

/**
 * Create a status and invalidate the project's status list.
 * Optionally accepts react-query mutation options via the returned object .mutateAsync / .mutate
 */
export function useCreateStatus(projectId?: number) {
  return useMutation({
    mutationFn: (payload: Partial<Status>) => {
      if (!projectId)
        throw new Error('projectId is required for creating a status');
      return createStatusApi({ projectId, ...payload });
    },
  });
}

/**
 * Update a status and invalidate both the project's status list and the status detail
 */
export function useUpdateStatus() {
  return useMutation({
    mutationFn: async (
      payload: Partial<Status> & { statusId?: number | null }
    ) => {
      return updateStatusApi({
        name: payload.name,
        color: payload.color!,
        statusId: payload.statusId! ?? null,
      });
    },
  });
}

/**
 * Delete a status and invalidate the project's status list.
 * Useful to pass { onSuccess } or rely on default invalidation.
 */ export function useDeleteStatus() {
  return useMutation({
    mutationFn: async ({ statusId }: { statusId: number }) => {
      await deleteStatusApi(statusId);
    },
  });
}

export default {
  useStatuses,
  useStatus,
  useCreateStatus,
  useUpdateStatus,
  useDeleteStatus,
};
