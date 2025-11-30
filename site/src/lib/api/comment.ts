// hooks/usecomment.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// comment shape (matches Prisma model)
export interface comment {
  id: number;
  name: string;
  about: string;
  createdAt: string;
  creatorId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createcommentApi(payload: {
  creatorId: number;
  name: string;
  about?: string;
}) {
  return apiPost<{ success: boolean; data: comment }>(`/comment`, payload);
}

export async function updatecommentApi(payload: {
  commentId: number;
  name?: string;
  about?: string;
}) {
  return apiPatch<{ success: boolean; data: comment }>(
    `/comment/${payload.commentId}`,
    payload
  );
}

export async function deletecommentApi(commentId: number) {
  return apiDelete<{ success: boolean }>(`/comment/${commentId}`);
}

export async function getcommentFromTaskApi(taskId: number) {
  return apiGet<{ success: boolean }>(`/comment?taskId=${taskId}`);
}

export async function getcommentApi(id: number) {
  return apiGet<{ success: boolean }>(`/comment/${id}`);
}

export async function getcommentsFromUserApi(payload: any) {
  return apiPost<{ success: boolean }>(`/comment/user`, payload);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchcomments(id) {
  return useQuery<comment, Error>({
    queryKey: ["comment"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: comment }>(
        `/comment?userId=${id}`
      );
      if (!res || !res.success)
        throw new Error("Failed to fetch project comment");
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}
export function useFetchUsercomments() {
  return useMutation<comment, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getcommentsFromUserApi(payload);
    },
  });
}

/* ---------- types ---------- */
type comment = {
  id: number | string;
  name: string;
  about?: string;
  createdAt?: string;
  creatorId?: number;
  // add any other fields your API returns
};

type CreatecommentPayload = {
  projectId: number;
  name: string;
  about?: string;
  // any other fields you pass to create the comment
};

/* ---------- hook ---------- */
export function useFetchcommentsFromTask() {
  return useMutation<comment, Error, CreatecommentPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreatecommentPayload) => {
      return getcommentFromTaskApi(payload.taskId);
    },
  });
}

export function useFetchcomment() {
  return useMutation<comment, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getcommentApi(payload.id);
    },
  });
}
export function fetchcomments(id?: number | string) {
  return useQuery<comment, Error>({
    queryKey: ["comment"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: comment }>(
        `/comment/${id}`
      );
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
// Create comment
export function useCreatecomment() {
  return useMutation({
    mutationFn: (payload) => createcommentApi(payload),
  });
}

// Update comment
export function useUpdatecomment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      commentId: number;
      name?: string;
      about?: string;
      creatorId?: number;
    }) =>
      updatecommentApi({
        commentId: payload.commentId,
        name: payload.name,
        about: payload.about,
      }),
  });
}

// Delete comment
export function useDeletecomment() {
  return useMutation({
    mutationFn: (payload: { commentId: number; creatorId: number }) =>
      deletecommentApi(payload.commentId),
  });
}
