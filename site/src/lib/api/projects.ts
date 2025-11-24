import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types/project";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";
// Define the shape of your user (should match your Prisma model)
export interface User {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  creatorId?: any[];
  user?: any;
  epics?: any[];
}

interface GetProjectsResponse {
  success: boolean;
  data: User[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/* Query keys */
const PROJECTS_KEY = ["project"];
const PROJECT_KEY = (id: number | string) => ["project", id];

/* Fetch all projects */
export function useProjects(team: any) {
  console.log("teamteam", team);

  return useQuery<Project[], Error>({
    queryKey: [...PROJECTS_KEY, team?.id],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: Project[] }>(
        `/project?teamId=${team.id}`
      );
      if (!res || !res.success) throw new Error("Failed to fetch projects");
      return res.data;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 10, // 2 minutes
    cacheTime: 1000 * 60 * 10,
  });
}

/* Fetch single project */
export function useProject(id?: number | string) {
  return useQuery<Project, Error>({
    queryKey: PROJECT_KEY(id ?? "undefined"),
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await apiGet<{ success: boolean; data: Project }>(
        `/project/get/${id}`
      );
      if (!res || !res.success) throw new Error("Failed to fetch project");
      return res.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/* Create project */
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      creatorId: number;
    }) => {
      const res = await apiPost<{ success: boolean; data: Project }>(
        "/project",
        payload
      );
      if (!res || !res.success) throw new Error("Create project failed");
      return res.data;
    },
  });
}

/* Update project */
export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<Project>;
    }) => {
      const res = await apiPut<{ success: boolean; data: Project }>(
        `/project/${id}`,
        payload
      );
      if (!res || !res.success) throw new Error("Update project failed");
      return res.data;
    },
  });
}

/* Delete project (with optimistic update example) */
export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiDelete<{ success: boolean; message?: string }>(
        `/project/${id}`
      );
      if (!res || !res.success)
        throw new Error(res?.message ?? "Delete failed");
      return id;
    },
  });
}
