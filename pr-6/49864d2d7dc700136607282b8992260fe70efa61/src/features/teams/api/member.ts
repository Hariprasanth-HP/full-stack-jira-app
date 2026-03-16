// hooks/usemember.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient';
import type { TeamMember } from '@/types/type';

/* ---------- Types ---------- */

type MemberRes = { success: boolean; data: TeamMember };
type MembersRes = { success: boolean; data: TeamMember[]; added?: number };
type SimpleRes = { success: boolean };

/* ---------- API helpers (typed) ---------- */

export async function createMembersApi(payload: CreateMembersPayload) {
  // expects: { success: boolean; data: Member[] } OR adjust if API returns different shape
  return apiPost<MembersRes>(`/member/${payload.teamId}`, {
    members: payload.members,
    // creatorId: payload.creatorId,
  });
}

export async function updateMemberApi(payload: {
  memberId: number;
  name?: string;
  about?: string;
}) {
  return apiPatch<MemberRes>(`/member/${payload.memberId}`, payload);
}

export async function deleteMemberApi(memberId: number) {
  return apiDelete<SimpleRes>(`/member/${memberId}`);
}

/**
 * Get members for a team.
 * Some backends return an array for `data` when fetching by team.
 */
export async function getMembersFromTeamApi(teamId: number) {
  return apiGet<MembersRes>(`/member?teamId=${teamId}`);
}

/** Get a single member by id */
export async function getMemberApi(id: number) {
  return apiGet<MemberRes>(`/member/${id}`);
}

/** Get members associated with a user (body POST payload) */
export async function getMembersFromUserApi(payload: { userId: number }) {
  return apiPost<MembersRes>(`/member/user`, payload);
}

/* ---------- React Query hooks ---------- */

/** Fetch a single member by id */
export function useFetchMember(id?: number | string) {
  return useQuery<TeamMember, Error>({
    queryKey: ['member', id],
    queryFn: async () => {
      if (!id) throw new Error('No member id provided');
      const res = await getMemberApi(Number(id));
      if (!res || !res.success) throw new Error('Failed to fetch member');
      return res.data;
    },
    enabled: !!id,
  });
}

/** Fetch members for a team (returns Member[]) */
export function useFetchMembersForTeam(teamId?: number) {
  return useQuery<TeamMember[], Error>({
    queryKey: ['members', 'team', teamId],
    queryFn: async () => {
      if (!teamId) throw new Error('No team id provided');
      const res = await getMembersFromTeamApi(teamId);
      if (!res || !res.success) throw new Error('Failed to fetch team members');
      return res.data;
    },
    enabled: !!teamId,
    staleTime: 0,
  });
}

/** Fetch members for the current user via POST (mutation-style) */
export function useFetchUserMembers() {
  return useMutation<TeamMember[], Error, { userId: number }>({
    mutationFn: async (payload) => {
      const res = await getMembersFromUserApi(payload);
      if (!res || !res.success)
        throw new Error('Failed to fetch members for user');
      return res.data;
    },
  });
}
type CreateMembersPayload = {
  teamId: number;
  members: { email: string; name: string | null; role: string }[];
};
/** Create members (for a team) */
export function useCreateMembers() {
  const qc = useQueryClient();
  return useMutation<MembersRes, Error, CreateMembersPayload>({
    mutationFn: (payload) => createMembersApi(payload),
    onSuccess: () => {
      // invalidate team members list so UI refetches
      qc.invalidateQueries({ queryKey: ['members', 'team'] });
    },
  });
}

/** Update a member */
export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation<
    MemberRes,
    Error,
    { memberId: number; name?: string; about?: string }
  >({
    mutationFn: (payload) => updateMemberApi(payload),
    onSuccess: (res) => {
      // res.data is the updated member; invalidate affected queries
      if (res?.data?.id != null) {
        qc.invalidateQueries({ queryKey: ['member', res.data.id] });
        qc.invalidateQueries({ queryKey: ['members', 'team'] }); // if team list should refresh
      }
    },
  });
}

/** Delete a member */
export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation<SimpleRes, Error, { memberId: number }>({
    mutationFn: ({ memberId }) => deleteMemberApi(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', 'team'] });
    },
  });
}
