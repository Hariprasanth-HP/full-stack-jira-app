// hooks/uselist.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient'; // implement if not present
import type { List } from '@/types/type';

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes
type ListResData = { success: boolean; data: List[] };
type ListResDataSingle = { success: boolean; data: List };
export async function createlistApi(payload: {
  projectId: number;
  name: string;
}) {
  return apiPost<ListResDataSingle>(`/list`, payload);
}

export async function updateListApi(payload: UpdateListPayload) {
  return apiPatch<ListResData>(`/list/${payload.listId}`, payload);
}

export async function deletelistApi(listId: number) {
  return apiDelete<{ success: boolean }>(`/list/${listId}`);
}

export async function getListFromProjectApi(projectId: number) {
  return apiGet<ListResData>(`/list?projectId=${projectId}`);
}

export async function getListApi(id: number) {
  return apiGet<ListResDataSingle>(`/list/get/${id}`);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchlists(id: number) {
  return useQuery<ListResData, Error>({
    queryKey: ['list'],
    queryFn: async () => {
      const res = await apiGet<ListResData>(`/list?projectId=${id}`);
      if (!res || !res.success) throw new Error('Failed to fetch project list');
      return res;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

type CreateListPayload = {
  projectId: number;
  name: string;
  about?: string;
  // any other fields you pass to create the list
};
type UpdateListPayload = Partial<CreateListPayload> & {
  id?: number;
  listId?: number;
};

/* ---------- hook ---------- */
export function useFetchlistsFromProject() {
  return useMutation<ListResData, Error, UpdateListPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: UpdateListPayload) => {
      return getListFromProjectApi(payload.projectId!);
    },
  });
}

export function useFetchlist() {
  return useMutation<ListResDataSingle, Error, UpdateListPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: UpdateListPayload) => {
      return getListApi(payload.id!);
    },
  });
}
// Create list
export function useCreatelist() {
  return useMutation({
    mutationFn: (payload: { projectId: number; name: string }) =>
      createlistApi(payload),
  });
}

// Update list
export function useUpdatelist() {
  return useMutation({
    mutationFn: (payload: UpdateListPayload) =>
      updateListApi({
        listId: payload.listId!,
        name: payload.name!,
        about: payload.about!,
      }),
  });
}

// Delete list
export function useDeletelist() {
  return useMutation({
    mutationFn: (payload: { listId: number; projectId: number }) =>
      deletelistApi(payload.listId),
  });
}
