import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../apiClient";

// src/lib/api/comment.ts
export type CommentTargetType = "EPIC" | "STORY" | "TASK" | "comment";

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

export function useCreateComment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => createCommentApi(payload),
    onMutate: async (payload) => {
      // Optional optimistic update: snapshot and insert
      await qc.cancelQueries(["epics", payload.targetId]);
      const previous = qc.getQueryData<comment[]>([
        "comment",
        payload.targetId,
      ]);
      // create a placeholder comment id (negative temp id)
      const tempcomment: comment = {
        id: Date.now() * -1,
        name: payload.name,
        description: payload.description ?? "",
        createdAt: new Date().toISOString(),
        targetId: payload.targetId,
      };
      qc.setQueryData<comment[]>(["comment", payload.targetId], (old) =>
        old ? [tempcomment, ...old] : [tempcomment]
      );
      return { previous };
    },
    onError: (_err, payload, context: any) => {
      // rollback
      qc.setQueryData(["comment", payload.targetId], context?.previous ?? []);
    },
    onSettled: (_data, _err, variables) => {
      // Invalidate both comment list for that project and the epics list (if it contains comment)
      qc.invalidateQueries(["comment", variables.targetId]);
      qc.invalidateQueries(["epics"]);
    },
  });
}
