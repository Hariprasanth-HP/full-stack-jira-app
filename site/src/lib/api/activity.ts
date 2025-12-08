// hooks/useactivity.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient'; // implement if not present
import type { Activity } from '@/types/type';

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createActivityApi(payload: Partial<Activity>) {
  return apiPost<{ success: boolean; data: Activity }>(`/activity`, payload);
}

export async function updateactivityApi(payload: {
  activityId: number;
  name?: string;
  about?: string;
}) {
  return apiPatch<{ success: boolean; data: Activity }>(
    `/activity/${payload.activityId}`,
    payload
  );
}

export async function deleteactivityApi(activityId: number) {
  return apiDelete<{ success: boolean }>(`/activity/${activityId}`);
}

export async function getactivityFromTaskApi(taskId: number) {
  return apiGet<{ success: boolean }>(`/activity?taskId=${taskId}`);
}

export async function getactivityApi(id: number) {
  return apiGet<{ success: boolean }>(`/activity/${id}`);
}

export async function getactivitiesFromUserApi(payload: any) {
  return apiPost<{ success: boolean }>(`/activity/user`, payload);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchactivities(id) {
  return useQuery<Activity, Error>({
    queryKey: ['activity'],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: Activity }>(
        `/activity?userId=${id}`
      );
      if (!res || !res.success)
        throw new Error('Failed to fetch project activity');
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}
export function useFetchUseractivities() {
  return useMutation<activity, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getactivitiesFromUserApi(payload);
    },
  });
}

/* ---------- types ---------- */
type activity = {
  id: number | string;
  name: string;
  about?: string;
  createdAt?: string;
  creatorId?: number;
  // add any other fields your API returns
};
type ActivitiesApiRes = { success: boolean; data: Activity[] };
type ActivityApiRes = { success: boolean; data: Activity };

/* ---------- hook ---------- */
export function useFetchactivitiesFromTask() {
  return useMutation<ActivitiesApiRes, Error, Partial<Activity>>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: Partial<Activity>) => {
      return getactivityFromTaskApi(payload.id!);
    },
  });
}

export function useFetchactivity() {
  return useMutation<ActivityApiRes, Error, Partial<Activity>>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: Partial<Activity>) => {
      return getactivityApi(payload.id!);
    },
  });
}
export function fetchactivities(id?: number | string) {
  return useQuery<ActivitiesApiRes, Error>({
    queryKey: ['activity'],
    queryFn: async () => {
      if (!id) throw new Error('No project id');
      const res = await apiGet<{ success: boolean; data: Activity }>(
        `/activity/${id}`
      );
      if (!res || !res.success) throw new Error('Failed to fetch project');
      return res.data;
    },
    enabled: !!id,
  });
}
// Create activity
export function useCreateactivity() {
  return useMutation({
    mutationFn: (payload: Partial<Activity>) => createActivityApi(payload),
  });
}

// Update activity
export function useUpdateactivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      activityId: number;
      name?: string;
      about?: string;
      creatorId?: number;
    }) =>
      updateactivityApi({
        activityId: payload.activityId,
        name: payload.name,
        about: payload.about,
      }),
  });
}

// Delete activity
export function useDeleteactivity() {
  return useMutation({
    mutationFn: (payload: { activityId: number; creatorId: number }) =>
      deleteactivityApi(payload.activityId),
  });
}
