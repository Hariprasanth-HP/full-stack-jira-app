import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "../apiClient";

// src/lib/api/comment.ts
export type CommentTargetType = "EPIC" | "STORY" | "comment" | "comment";

export interface CreateCommentPayload {
  content: string;
  authorId: number;
  targetType: CommentTargetType;
  targetId: number;
  parentId?: number;
}

export async function createCommentApi(payload: CreateCommentPayload) {
  return apiPost<{ success: boolean; data: CreateCommentPayload }>(
    `/comment`,
    payload
  );
}

export async function deleteCommentApi(commentId: number) {
  return apiDelete<{ success: boolean }>(`/comment/${commentId}`);
}

export async function updateCommentApi(payload: {
  id: number;
  name?: string;
  description?: string;
}) {
  return apiPatch<{ success: boolean; data: any }>(
    `/comment/${payload.id}`,
    payload
  );
}

export async function getCommentApi(id: number) {
  return apiGet<{ success: boolean }>(`/comment/${id}`);
}

export function useCreateComment() {
  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => createCommentApi(payload),
  });
}
export function useFetchCommentfromtarget() {
  return useMutation<Comment, Error, CreateCommentPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: { id: number }) => {
      return getCommentApi(payload.id);
    },
  });
}

// Update comment
export function useUpdateComment() {
  return useMutation({
    mutationFn: (payload: any) => {
      return updateCommentApi(payload);
    },
  });
}
export function useDeleteComment() {
  return useMutation({
    mutationFn: (payload: { commentId: number }) =>
      deleteCommentApi(payload.commentId),
  });
}
