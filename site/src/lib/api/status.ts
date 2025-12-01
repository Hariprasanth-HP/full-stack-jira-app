// hooks/useStatus.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient";

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
export async function createStatusApi(payload: {
  projectId: number;
  name: string;
  color?: string;
  sortOrder?: number | null;
  about?: string;
}) {
  const res = await apiPost<ApiResponse<Status>>("/status", payload);
  if (!res || !res.success)
    throw new Error(res?.error ?? "Create status failed");
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
    throw new Error(res?.error ?? "Update status failed");
  return res.data;
}

export async function deleteStatusApi(statusId: number) {
  const res = await apiDelete<ApiResponse<null>>(`/status/${statusId}`);
  if (!res || !res.success)
    throw new Error(res?.error ?? "Delete status failed");
  return res;
}

export async function getStatusFromProjectApi(projectId: number) {
  const res = await apiGet<ApiResponse<Status[]>>(
    `/status?projectId=${projectId}`
  );
  if (!res || !res.success)
    throw new Error(res?.error ?? "Fetch statuses failed");
  return res.data;
}

/* ---------- Query keys ---------- */
const statusKeys = {
  all: ["statuses"] as const,
  byProject: (projectId: number | string) =>
    [...statusKeys.all, "byProject", projectId] as const,
  detail: (statusId: number | string) =>
    [...statusKeys.all, "detail", statusId] as const,
};

/* ---------- Hooks ---------- */

/** Fetch statuses for a project */
export function useStatuses(
  projectId?: number | string,
  options?: { enabled?: boolean }
) {
  return useQuery<Status[], Error>({
    queryKey: statusKeys.byProject(projectId ?? "unknown"),
    queryFn: async () => {
      if (!projectId) throw new Error("No projectId provided");
      return getStatusFromProjectApi(Number(projectId));
    },
    enabled: !!projectId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 2, // 2 minutes default
  });
}

/** Fetch single status by id (optional) */
export function useStatus(statusId?: number | string) {
  return useQuery<Status, Error>({
    queryKey: statusKeys.detail(statusId ?? "unknown"),
    queryFn: async () => {
      if (!statusId) throw new Error("No statusId provided");
      const res = await apiGet<ApiResponse<Status>>(`/status/${statusId}`);
      if (!res || !res.success)
        throw new Error(res?.error ?? "Failed to fetch status");
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      if (!projectId)
        throw new Error("projectId is required for creating a status");
      return createStatusApi({ projectId, ...payload });
    },
    onSuccess: (newStatus) => {
      // Invalidate & refetch statuses for the project
      qc.invalidateQueries(statusKeys.byProject(newStatus.projectId));
    },
  });
}

/**
 * Update a status and invalidate both the project's status list and the status detail
 */
export function useUpdateStatus() {
  const qc = useQueryClient();

  return useMutation<
    Status,
    Error,
    {
      statusId: number;
      name?: string;
      color?: string;
      sortOrder?: number | null;
      about?: string | null;
    }
  >(
    async (payload) => {
      return updateStatusApi({
        statusId: payload.statusId,
        name: payload.name,
        color: payload.color,
        sortOrder: payload.sortOrder ?? null,
        about: payload.about ?? null,
      });
    },
    {
      onSuccess: (updated) => {
        // Invalidate list for the project
        qc.invalidateQueries(statusKeys.byProject(updated.projectId));
        // Invalidate the detail cache for this status
        qc.invalidateQueries(statusKeys.detail(updated.id));
      },
    }
  );
}

/**
 * Delete a status and invalidate the project's status list.
 * Useful to pass { onSuccess } or rely on default invalidation.
 */
export function useDeleteStatus() {
  const qc = useQueryClient();

  return useMutation<void, Error, { statusId: number; projectId?: number }>(
    async (payload) => {
      await deleteStatusApi(payload.statusId);
      return;
    },
    {
      onSuccess: (_data, variables) => {
        if (variables?.projectId) {
          qc.invalidateQueries(statusKeys.byProject(variables.projectId));
        } else {
          // If projectId not supplied, invalidate all statuses queries
          qc.invalidateQueries(statusKeys.all);
        }
      },
    }
  );
}

/* ---------- Optional: example optimistic update (commented) ----------
You can implement optimistic updates in the create/update/delete hooks using onMutate,
onError and onSettled. Example skeleton:

onMutate: async (newStatus) => {
  await qc.cancelQueries(statusKeys.byProject(projectId));
  const previous = qc.getQueryData<Status[]>(statusKeys.byProject(projectId));
  qc.setQueryData(statusKeys.byProject(projectId), (old = []) => [...old, tempStatus]);
  return { previous };
},
onError: (_err, _vars, context) => {
  qc.setQueryData(statusKeys.byProject(projectId), context?.previous ?? []);
},
onSettled: () => qc.invalidateQueries(statusKeys.byProject(projectId))

Uncomment and tune if you want immediate UI updates before the server confirms.
-------------------------------------------------------------------------- */

export default {
  useStatuses,
  useStatus,
  useCreateStatus,
  useUpdateStatus,
  useDeleteStatus,
};
