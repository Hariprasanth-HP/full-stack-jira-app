import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "../apiClient";

// src/lib/api/Kanban.ts
export type KanbanTargetType = "EPIC" | "STORY" | "Kanban" | "Kanban";

export interface CreateKanbanPayload {
  content: string;
  authorId: number;
  targetType: KanbanTargetType;
  targetId: number;
  parentId?: number;
}

export async function createKanbanApi(payload: CreateKanbanPayload) {
  return apiPost<{ success: boolean; data: CreateKanbanPayload }>(
    `/kanban`,
    payload
  );
}

export async function deleteKanbanApi(KanbanId: number) {
  return apiDelete<{ success: boolean }>(`/Kanban/${KanbanId}`);
}

export async function updateKanbanApi(payload: {
  id: number;
  position?: string;
  status?: string;
}) {
  console.log("paaaaaayyyyyyyyy", payload);

  return apiPatch<{ success: boolean; data: any }>(
    `/kanban/${payload.id}`,
    payload
  );
}

export async function getKanbanApi(epicId: number) {
  return apiGet<{ success: boolean }>(`/kanban/${epicId}`);
}

export function useCreateKanban() {
  return useMutation({
    mutationFn: (payload: CreateKanbanPayload) => createKanbanApi(payload),
  });
}
export function useFetchKanbanfromtarget() {
  return useMutation<Kanban, Error, CreateKanbanPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: { epicId: number }) => {
      return getKanbanApi(payload.epicId);
    },
  });
}

// Update Kanban
export function useUpdateKanban() {
  return useMutation({
    mutationFn: (payload: any) => {
      return updateKanbanApi(payload);
    },
  });
}
export function useDeleteKanban() {
  return useMutation({
    mutationFn: (payload: { KanbanId: number }) =>
      deleteKanbanApi(payload.KanbanId),
  });
}
