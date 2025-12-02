// hooks/useactivity.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// activity shape (matches Prisma model)
export interface activity {
  id: number;
  name: string;
  about: string;
  createdAt: string;
  creatorId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createactivityApi(payload: {
  creatorId: number;
  name: string;
  about?: string;
}) {
  return apiPost<{ success: boolean; data: activity }>(`/activity`, payload);
}

export async function updateactivityApi(payload: {
  activityId: number;
  name?: string;
  about?: string;
}) {
  return apiPatch<{ success: boolean; data: activity }>(
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
  return useQuery<activity, Error>({
    queryKey: ["activity"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: activity }>(
        `/activity?userId=${id}`
      );
      if (!res || !res.success)
        throw new Error("Failed to fetch project activity");
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

type CreateactivityPayload = {
  projectId: number;
  name: string;
  about?: string;
  // any other fields you pass to create the activity
};

/* ---------- hook ---------- */
export function useFetchactivitiesFromTask() {
  return useMutation<activity, Error, CreateactivityPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreateactivityPayload) => {
      return getactivityFromTaskApi(payload.taskId);
    },
  });
}

export function useFetchactivity() {
  return useMutation<activity, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getactivityApi(payload.id);
    },
  });
}
export function fetchactivities(id?: number | string) {
  return useQuery<activity, Error>({
    queryKey: ["activity"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: activity }>(
        `/activity/${id}`
      );
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
// Create activity
export function useCreateactivity() {
  return useMutation({
    mutationFn: (payload) => createactivityApi(payload),
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
