// hooks/uselist.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// list shape (matches Prisma model)
export interface List {
  id: number;
  name: string;
  projectId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createlistApi(payload: {
  projectId: number;
  name: string;
}) {
  return apiPost<{ success: boolean; data: list }>(`/list`, payload);
}

export async function updatelistApi(payload: { listId: number; name: string }) {
  return apiPatch<{ success: boolean; data: list }>(
    `/list/${payload.listId}`,
    payload
  );
}

export async function deletelistApi(listId: number) {
  return apiDelete<{ success: boolean }>(`/list/${listId}`);
}

export async function getlistFromProjectApi(projectId: number) {
  return apiGet<{ success: boolean }>(`/list?projectId=${projectId}`);
}

export async function getlistApi(id: number) {
  return apiGet<{ success: boolean }>(`/list/get/${id}`);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchlists(id) {
  return useQuery<list, Error>({
    queryKey: ["list"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: list }>(
        `/list?projectId=${id}`
      );
      if (!res || !res.success) throw new Error("Failed to fetch project list");
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

/* ---------- types ---------- */
type list = {
  id: number | string;
  name: string;
  about?: string;
  createdAt?: string;
  projectId?: number;
  // add any other fields your API returns
};

type CreatelistPayload = {
  projectId: number;
  name: string;
  about?: string;
  // any other fields you pass to create the list
};

/* ---------- hook ---------- */
export function useFetchlistsFromProject() {
  return useMutation<list, Error, CreatelistPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreatelistPayload) => {
      return getlistFromProjectApi(payload.projectId);
    },
  });
}

export function useFetchlist() {
  return useMutation<list, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getlistApi(payload.id);
    },
  });
}
export function fetchlists(id?: number | string) {
  return useQuery<list, Error>({
    queryKey: ["list"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: list }>(`/list/${id}`);
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      listId: number;
      name?: string;
      about?: string;
      projectId?: number;
    }) =>
      updatelistApi({
        listId: payload.listId,
        name: payload.name,
        about: payload.about,
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
