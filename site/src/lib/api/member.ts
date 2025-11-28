// hooks/usemember.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch, apiDelete, apiGet } from "@/lib/apiClient"; // implement if not present

// member shape (matches Prisma model)
export interface member {
  id: number;
  name: string;
  about: string;
  createdAt: string;
  creatorId: number;
}

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

export async function createMembersApi(payload: any) {
  return apiPost<{ success: boolean; data: member }>(`/member/${payload.teamId}`,{members: payload.members});
}

export async function updatememberApi(payload: {
  memberId: number;
  name?: string;
  about?: string;
}) {
  return apiPatch<{ success: boolean; data: member }>(
    `/member/${payload.memberId}`,
    payload
  );
}

export async function deletememberApi(memberId: number) {
  return apiDelete<{ success: boolean }>(`/member/${memberId}`);
}

export async function getmemberFromStoryApi(creatorId: number) {
  return apiGet<{ success: boolean }>(`/member/${creatorId}`);
}

export async function getmemberApi(id: number) {
  return apiGet<{ success: boolean }>(`/member/${id}`);
}

export async function getmembersFromUserApi(payload: any) {
  return apiPost<{ success: boolean }>(`/member/user`, payload);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchmembers(id) {
  return useQuery<member, Error>({
    queryKey: ["member"],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: member }>(
        `/member?teamId=${id}`
      );
      if (!res || !res.success) throw new Error("Failed to fetch project member");
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}
export function useFetchUsermembers() {
  return useMutation<member, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getmembersFromUserApi(payload);
    },
  });
}

/* ---------- types ---------- */
type member = {
  id: number | string;
  name: string;
  about?: string;
  createdAt?: string;
  creatorId?: number;
  // add any other fields your API returns
};

type CreatememberPayload = {
  projectId: number;
  name: string;
  about?: string;
  // any other fields you pass to create the member
};

/* ---------- hook ---------- */
export function useFetchmembersFromProject() {
  return useMutation<member, Error, CreatememberPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreatememberPayload) => {
      return getmemberFromStoryApi(payload.projectId);
    },
  });
}

export function useFetchmember() {
  return useMutation<member, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getmemberApi(payload.id);
    },
  });
}
export function fetchmembers(id?: number | string) {
  return useQuery<member, Error>({
    queryKey: ["member"],
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: member }>(`/member/${id}`);
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
  });
}
// Create member
export function useCreatemembers() {
  return useMutation({
    mutationFn: (payload: {
      creatorId: number;
      name: string;
      about?: string;
    }) => createMembersApi(payload),
  });
}

// Update member
export function useUpdatemember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      memberId: number;
      name?: string;
      about?: string;
      creatorId?: number;
    }) =>
      updatememberApi({
        memberId: payload.memberId,
        name: payload.name,
        about: payload.about,
      }),
  });
}

// Delete member
export function useDeleteMember() {
  return useMutation({
    mutationFn: (payload: { memberId: number }) =>
      deletememberApi(payload.memberId),
  });
}
