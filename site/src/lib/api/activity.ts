// hooks/useactivity.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient'; // implement if not present
import type { Activity } from '@/types/type';

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

type ActivitiesApiRes = { success: boolean; data: Activity[] };
type ActivityApiRes = { success: boolean; data: Activity };
export async function createActivityApi(payload: Partial<Activity>) {
  return apiPost<{ success: boolean; data: Activity }>(`/activity`, payload);
}

export async function updateactivityApi(payload: {
  activityId: number;
  name?: string;
  about?: string;
}) {
  return apiPatch<ActivityApiRes>(`/activity/${payload.activityId}`, payload);
}

export async function deleteactivityApi(activityId: number) {
  return apiDelete<{ success: boolean }>(`/activity/${activityId}`);
}

export async function getactivityFromTaskApi(taskId: number) {
  return apiGet<ActivitiesApiRes>(`/activity?taskId=${taskId}`);
}

export async function getactivityApi(id: number) {
  return apiGet<ActivityApiRes>(`/activity/${id}`);
}

export async function getActivitiesFromUserApi(payload: unknown) {
  return apiPost<ActivitiesApiRes>(`/activity/user`, payload);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchactivities(id: number) {
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
  return useMutation<ActivitiesApiRes, Error, unknown>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: unknown) => {
      return getActivitiesFromUserApi(payload);
    },
  });
}

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
export function useFetchActivities(id?: number | string) {
  return useQuery<Activity, Error>({
    queryKey: ['activity', id],
    queryFn: async () => {
      if (!id) throw new Error('No project id');

      const res = await apiGet<ActivityApiRes>(`/activity/${id}`);

      if (!res || !res.success) throw new Error('Failed to fetch project');

      return res.data; // Activity
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
