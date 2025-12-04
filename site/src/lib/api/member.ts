// hooks/usemember.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient'; // implement if not present
import type { TeamMember } from '@/types/type';

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes

type MemberApiRes = { success: boolean; data: TeamMember[] };

export async function createMembersApi(payload: any) {
  return apiPost<MemberApiRes>(`/member/${payload.teamId}`, {
    members: payload.members,
  });
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

export async function getMemberFromTeamApi(teamId: number) {
  return apiGet<{ success: boolean; data: member }>(`/member?teamId=${teamId}`);
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
    queryKey: ['member'],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: member }>(
        `/member?teamId=${id}`
      );
      if (!res || !res.success)
        throw new Error('Failed to fetch project member');
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}
export function useFetchUsermembers() {
  return useMutation<MemberApiRes, Error, any>({
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
  teamId: number;
  name?: string;
  about?: string;
  // any other fields you pass to create the member
};

/* ---------- hook ---------- */
export function useFetchmembersFromTeam() {
  return useMutation<MemberApiRes, Error, CreatememberPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreatememberPayload) => {
      return getMemberFromTeamApi(payload.teamId);
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
    queryKey: ['member'],
    queryFn: async () => {
      if (!id) throw new Error('No project id');
      const res = await apiGet<{ success: boolean; data: member }>(
        `/member/${id}`
      );
      if (!res || !res.success) throw new Error('Failed to fetch project');
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
