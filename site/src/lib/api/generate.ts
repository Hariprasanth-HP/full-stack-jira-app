// hooks/useactivity.ts
import { useMutation } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function generateResultsAPI(payload: { prompt?: string }) {
  return apiPost<{ success: boolean; data: activity }>(`/generate`, payload);
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

// Create activity
export function useGenerateResults() {
  return useMutation({
    mutationFn: (payload) => generateResultsAPI(payload),
  });
}
