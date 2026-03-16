// hooks/useteam.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient'; // implement if not present
import type { Team } from '@/types/type';

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes
type TeamApiRes = { success: boolean; data: Team[] };
type CreateTeamApiRes = { success: boolean; data: Team };
export async function createteamApi(payload: {
  creatorId: number;
  name: string;
  about?: string;
}) {
  return apiPost<CreateTeamApiRes>(`/team`, payload);
}

export async function updateteamApi(payload: {
  teamId: number;
  name?: string;
  about?: string;
}) {
  return apiPatch<CreateTeamApiRes>(`/team/${payload.teamId}`, payload);
}

export async function deleteteamApi(teamId: number) {
  return apiDelete<{ success: boolean }>(`/team/${teamId}`);
}

export async function getTeamsFromProject(creatorId: number) {
  return apiGet<TeamApiRes>(`/team/${creatorId}`);
}

export async function getTeamApi(id: number) {
  return apiGet<CreateTeamApiRes>(`/team/${id}`);
}

export async function getTeamsFromUserApi(payload: unknown) {
  return apiPost<TeamApiRes>(`/team/user`, payload);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchteams(id: number) {
  return useQuery<TeamApiRes, Error>({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await apiGet<TeamApiRes>(`/team?userId=${id}`);
      if (!res || !res.success) throw new Error('Failed to fetch project team');
      return res;
    },
    enabled: !!id,
    staleTime: 0,
  });
}
export function useFetchUserteams() {
  return useMutation<TeamApiRes, Error, unknown>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: unknown) => {
      return getTeamsFromUserApi(payload);
    },
  });
}

type CreateteamPayload = {
  projectId: number;
  name: string;
  about?: string;
  // any other fields you pass to create the team
};

/* ---------- hook ---------- */
export function useFetchteamsFromProject() {
  return useMutation<TeamApiRes, Error, CreateteamPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreateteamPayload) => {
      return getTeamsFromProject(payload.projectId);
    },
  });
}

export function useFetchteam() {
  return useMutation<CreateTeamApiRes, Error, { id: number }>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: { id: number }) => {
      return getTeamApi(payload.id);
    },
  });
}
export function useFetchTeams(id?: number | string) {
  return useQuery<TeamApiRes, Error>({
    queryKey: ['team'],
    queryFn: async () => {
      if (!id) throw new Error('No project id');
      const res = await apiGet<TeamApiRes>(`/team/${id}`);
      if (!res || !res.success) throw new Error('Failed to fetch project');
      return res;
    },
    enabled: !!id,
  });
}
// Create team
export function useCreateteam() {
  return useMutation({
    mutationFn: (payload: {
      creatorId: number;
      name: string;
      about?: string;
    }) => createteamApi(payload),
  });
}

// Update team
export function useUpdateteam() {
  return useMutation({
    mutationFn: (payload: {
      teamId: number;
      name?: string;
      about?: string;
      creatorId?: number;
    }) =>
      updateteamApi({
        teamId: payload.teamId,
        name: payload.name,
        about: payload.about,
      }),
  });
}

// Delete team
export function useDeleteteam() {
  return useMutation({
    mutationFn: (payload: { teamId: number; creatorId: number }) =>
      deleteteamApi(payload.teamId),
  });
}
