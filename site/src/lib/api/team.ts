// hooks/useteam.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiPatch, apiDelete, apiGet } from '@/lib/apiClient'; // implement if not present
import type { Team } from '@/types/type';

// --- API helpers (tiny wrappers) ---
// adjust paths to match your server routes
type TeamApiRes = { success: boolean; data: Team };
export async function createteamApi(payload: {
  creatorId: number;
  name: string;
  about?: string;
}) {
  return apiPost<TeamApiRes>(`/team`, payload);
}

export async function updateteamApi(payload: {
  teamId: number;
  name?: string;
  about?: string;
}) {
  return apiPatch<TeamApiRes>(`/team/${payload.teamId}`, payload);
}

export async function deleteteamApi(teamId: number) {
  return apiDelete<{ success: boolean }>(`/team/${teamId}`);
}

export async function getteamFromStoryApi(creatorId: number) {
  return apiGet<{ success: boolean }>(`/team/${creatorId}`);
}

export async function getteamApi(id: number) {
  return apiGet<TeamApiRes>(`/team/${id}`);
}

export async function getTeamsFromUserApi(payload: any) {
  return apiPost<{ success: boolean }>(`/team/user`, payload);
}

// --- React Query mutations ---

/* Fetch single project */
export function useFetchteams(id) {
  return useQuery<team, Error>({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await apiGet<TeamApiRes>(`/team?userId=${id}`);
      if (!res || !res.success) throw new Error('Failed to fetch project team');
      return res.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}
export function useFetchUserteams() {
  return useMutation<TeamApiRes, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getTeamsFromUserApi(payload);
    },
  });
}

/* ---------- types ---------- */
type team = {
  id: number | string;
  name: string;
  about?: string;
  createdAt?: string;
  creatorId?: number;
  // add any other fields your API returns
};

type CreateteamPayload = {
  projectId: number;
  name: string;
  about?: string;
  // any other fields you pass to create the team
};

/* ---------- hook ---------- */
export function useFetchteamsFromProject() {
  return useMutation<team, Error, CreateteamPayload>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: CreateteamPayload) => {
      return getteamFromStoryApi(payload.projectId);
    },
  });
}

export function useFetchteam() {
  return useMutation<TeamApiRes, Error, any>({
    // mutationFn now gets the full payload and calls the API
    mutationFn: async (payload: any) => {
      return getteamApi(payload.id);
    },
  });
}
export function fetchteams(id?: number | string) {
  return useQuery<team, Error>({
    queryKey: ['team'],
    queryFn: async () => {
      if (!id) throw new Error('No project id');
      const res = await apiGet<{ success: boolean; data: team }>(`/team/${id}`);
      if (!res || !res.success) throw new Error('Failed to fetch project');
      return res.data;
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
  const qc = useQueryClient();
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
