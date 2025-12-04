// src/lib/api/projects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import type { Project } from '@/types/type';

/**
 * API response wrapper assumed:
 * { success: boolean; data: T; error?: string }
 * Adjust `unwrap` if your apiClient returns a different shape.
 */
type ApiResp<T> = { success: boolean; data: T; error?: string };

function unwrap<T>(res: ApiResp<T> | null | undefined): T {
  if (!res || !res.success) {
    throw new Error(res?.error ?? 'API request failed');
  }
  return res.data;
}

/* ---------- Query key helpers ---------- */
export const PROJECTS_KEY = ['projects'] as const;
export const PROJECT_BY_TEAM_KEY = (teamId: number | string) =>
  [...PROJECTS_KEY, 'byTeam', teamId] as const;
export const PROJECT_KEY = (id: number | string) =>
  [...PROJECTS_KEY, 'detail', id] as const;

/* ---------- Hooks ---------- */

/**
 * Fetch projects for a team
 * - team can be undefined (hook will be disabled)
 * - keeps previous data while refetching
 */
export function useProjects(team?: { id?: number | undefined }) {
  return useQuery<Project[], Error>({
    queryKey: PROJECT_BY_TEAM_KEY(team?.id ?? 'unknown'),
    queryFn: async () => {
      if (!team?.id) return [];
      const res = await apiGet<ApiResp<Project[]>>(
        `/project?teamId=${team.id}`
      );
      return unwrap(res);
    },
    enabled: !!team?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Fetch single project by id
 */
export function useProject(id?: number | string) {
  return useQuery<Project, Error>({
    queryKey: PROJECT_KEY(id ?? 'undefined'),
    queryFn: async () => {
      if (!id) throw new Error('No project id');
      const res = await apiGet<ApiResp<Project>>(`/project/get/${id}`);
      return unwrap(res);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/* ---------- Mutations ---------- */

/**
 * Create project
 * - invalidates project list for the team on success
 */ // types (adjust names as needed)
export type CreateProjectPayload = {
  name: string;
  description?: string;
  creatorId: number;
  teamId: number; // required for create
};

/* ---------- hook ---------- */
export function useCreateProject() {
  const qc = useQueryClient();

  return useMutation<Project, Error, CreateProjectPayload>({
    mutationFn: async (payload) => {
      const res = await apiPost<ApiResp<Project>>('/project', payload);
      return unwrap(res); // returns Project
    },
    onSuccess: (created) => {
      if (created?.teamId) {
        qc.invalidateQueries(PROJECT_BY_TEAM_KEY(created.teamId));
      }
      qc.invalidateQueries(PROJECTS_KEY);
    },
  });
}

/**
 * Update project
 * - payload: { id, payload }
 * - invalidates project detail + team list
 */
export function useUpdateProject() {
  const qc = useQueryClient();

  return useMutation<Project, Error, { id: number; payload: Partial<Project> }>(
    {
      mutationFn: async ({ id, payload }) => {
        const res = await apiPut<ApiResp<Project>>(`/project/${id}`, payload);
        return unwrap(res);
      },
      onSuccess: (updated) => {
        // Invalidate detail cache
        qc.invalidateQueries(PROJECT_KEY(updated.id));
        // Invalidate team list cache if we know the team
        if (updated.teamId)
          qc.invalidateQueries(PROJECT_BY_TEAM_KEY(updated.teamId));
        // Also invalidate global projects key
        qc.invalidateQueries(PROJECTS_KEY);
      },
    }
  );
}

/**
 * Delete project
 * - optimistic update pattern: remove from team list immediately, rollback on error
 */
export function useDeleteProject() {
  const qc = useQueryClient();

  return useMutation<number, Error, { id: number; teamId?: number }>({
    mutationFn: async ({ id }) => {
      const res = await apiDelete<ApiResp<{ message?: string }>>(
        `/project/${id}`
      );
      if (!res || !res.success) throw new Error(res?.error ?? 'Delete failed');
      return id;
    },
    onMutate: async ({ id, teamId }) => {
      // Cancel outgoing refetches and snapshot previous
      await qc.cancelQueries(PROJECT_BY_TEAM_KEY(teamId ?? 'unknown'));

      const previous = qc.getQueryData<Project[]>(
        PROJECT_BY_TEAM_KEY(teamId ?? 'unknown')
      );

      // Optimistically remove the project from cached list
      if (previous) {
        qc.setQueryData<Project[]>(
          PROJECT_BY_TEAM_KEY(teamId ?? 'unknown'),
          previous.filter((p) => p.id !== id)
        );
      }

      return { previous, teamId };
    },
    onError: (err, variables, context: any) => {
      // rollback
      if (context?.previous) {
        qc.setQueryData(
          PROJECT_BY_TEAM_KEY(context.teamId ?? 'unknown'),
          context.previous
        );
      }
    },
    onSettled: (data, err, variables) => {
      // Always invalidate to make sure server is source of truth
      if (variables.teamId)
        qc.invalidateQueries(PROJECT_BY_TEAM_KEY(variables.teamId));
      qc.invalidateQueries(PROJECTS_KEY);
    },
  });
}
