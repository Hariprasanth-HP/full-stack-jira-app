// src/AppRoutes.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type JSX,
} from "react";
import { Routes, Route } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useAppDispatch, useAppSelector } from "@/hooks/useAuth";
import { logout, setProject } from "@/slices/authSlice";
import { toast } from "sonner";
import { useCreateProject, useProjects } from "@/lib/api/projects";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import AppErrorBoundary from "@/error-boundary/error-boundary";
import { RequireAuth } from "./RequireAuth";
import Page from "@/pages/Dashboard/page";
import { SideBarContext } from "@/contexts/sidebar-context";
import { useFetchlistsFromProject } from "@/lib/api/list";
import { useFetchteam } from "@/lib/api/team";
import { useFetchtasksFromProject } from "@/lib/api/task";
import { useFetchmembersFromTeam } from "@/lib/api/member";
import { useStatuses } from "@/lib/api/status";

// types generated from your Prisma schema (drop-in file)
import type {
  Project,
  Team,
  TeamMember,
  List,
  Task,
  TaskStatus,
  SidebarContextValue,
} from "@/types/type";
import type { AuthState } from "@/types/auth";

/**
 * Assumptions about external hooks (adjust if your hooks have different signatures):
 *
 * - useProjects(teamId?: number | null)
 *     -> returns { data: Project[] | undefined, isLoading: boolean, error?: any, refetch: () => void }
 *
 * - useCreateProject()
 *     -> returns a react-query mutation with mutateAsync(payload) returning created Project
 *
 * - useStatuses(projectId?: number)
 *     -> returns { data: TaskStatus[] | undefined, isLoading: boolean }
 *
 * - useFetchteam()
 *     -> returns a mutation object: mutateAsync({ id }) => { data: Team }
 *
 * - useFetchmembersFromTeam()
 *     -> returns a mutation object: mutateAsync({ teamId }) => { data: TeamMember[] }
 *
 * - useFetchlistsFromProject(project?: Project)
 *     -> returns a mutation object: mutateAsync({ projectId }) => { data: List[] }
 *
 * - useFetchtasksFromProject()
 *     -> returns a mutation object: mutateAsync({ projectId }) => { data: Task[] }
 *
 * If a hook's return shape differs, update the usage accordingly.
 */

export default function ProtectedRoutes(): JSX.Element {
  const { theme } = useTheme();

  // auth slice
  const auth = useAppSelector((s: { auth: AuthState }) => s.auth);
  const dispatch = useAppDispatch();

  // Projects list (from server) for user's team
  const projectsQuery = useProjects({ id: auth.userTeam?.id });
  const projects: Project[] = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data]
  );
  const projectsLoading = projectsQuery.isLoading ?? false;

  // statuses for selected project
  const statusesQuery = useStatuses(auth.userProject?.id);
  const statuses = statusesQuery.data;

  // Mutations / helper API hooks (assumed shapes)
  const createProject = useCreateProject();
  const fetchTeam = useFetchteam();
  const fetchMembers = useFetchmembersFromTeam();
  const fetchLists = useFetchlistsFromProject();
  const fetchTasks = useFetchtasksFromProject();

  // UI/local state (typed)
  const [projectsState, setProjectsState] = useState<Project[]>([]);
  const [usersList, setUsersList] = useState<TeamMember[]>([]);
  const [listForTableState, setListForTableState] = useState<List[]>([]);
  const [taskForTableState, settaskForTableState] = useState<Task[]>([]);

  // Selected project & team managed locally (keeps UI independent of auth until dispatch)
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(
    auth?.userProject ?? undefined
  );
  const [selectedTeam, setSelectedTeam] = useState<Team | undefined>(
    () => auth.userTeam ?? undefined
  );

  // Derived memos
  const listForTable = useMemo(
    () => listForTableState ?? [],
    [listForTableState]
  );

  // Logout helper
  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    toast.info("Logged Out successfully");
  }, [dispatch]);

  // ---- Sync server projects into local projectsState ----
  useEffect(() => {
    if (projects && projects.length > 0) {
      setProjectsState(projects);
    } else {
      setProjectsState([]);
    }
  }, [projects]);

  // ---- On mount: fetch team details and members (if auth.userTeam exists) ----
  useEffect(() => {
    let mounted = true;

    async function bootTeamAndMembers() {
      if (!auth.userTeam?.id) return;

      try {
        // fetch fresh team data
        const teamRes = await fetchTeam.mutateAsync({ id: auth.userTeam.id });
        if (mounted && teamRes?.data) {
          setSelectedTeam(teamRes.data);
        }

        // fetch members
        const membersRes = await fetchMembers.mutateAsync({
          teamId: auth.userTeam.id,
        });
        if (mounted && membersRes?.data) {
          setUsersList(membersRes.data);
        }

        // reconcile stored project in localStorage (if any)
        const existingProjectStr = localStorage.getItem("project");
        if (existingProjectStr && mounted) {
          try {
            const parsedProject = JSON.parse(existingProjectStr) as Project;
            if (parsedProject?.teamId !== auth.userTeam.id) {
              localStorage.removeItem("project");
              setSelectedProject(undefined);
            }
          } catch {
            localStorage.removeItem("project");
            setSelectedProject(undefined);
          }
        }
      } catch (e) {
        // log but don't block
        // console.error("bootTeamAndMembers error", e);
      }
    }

    bootTeamAndMembers();

    return () => {
      mounted = false;
    };
    // run only when auth.userTeam changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userTeam?.id]);

  // ---- Keep selectedProject in sync with auth.userProject (auth is the source-of-truth) ----
  useEffect(() => {
    setSelectedProject(auth.userProject ?? undefined);
  }, [auth.userProject]);

  // ---- When selectedProject changes -> fetch lists & tasks for it ----
  useEffect(() => {
    let mounted = true;

    async function loadProjectData(project?: Project) {
      if (!project?.id) {
        // clear UI data when there's no selected project
        settaskForTableState([]);
        setListForTableState([]);
        return;
      }

      try {
        const [tasksRes, listsRes] = await Promise.all([
          fetchTasks.mutateAsync({ projectId: project.id }),
          fetchLists.mutateAsync({ projectId: project.id }),
        ]);

        if (!mounted) return;

        if (tasksRes?.data) {
          settaskForTableState(tasksRes.data);
        } else {
          settaskForTableState([]);
        }

        if (listsRes?.data) {
          setListForTableState(listsRes.data);
        } else {
          setListForTableState([]);
        }
      } catch (e) {
        // swallow or log; you may want to expose UI toast here
        // console.error("loadProjectData error", e);
      }
    }

    loadProjectData(selectedProject);

    return () => {
      mounted = false;
    };
    // include selectedProject.id so effect re-runs when project changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id]);

  // Create project handler (uses createProject mutation)
  const handleCreateProject = useCallback(
    async (projectPayload: Partial<Project>) => {
      if (!auth.userTeam?.id) {
        toast.error("Cannot create project: missing team");
        return;
      }
      try {
        const payload = {
          ...projectPayload,
          teamId: auth.userTeam.id,
        } as Partial<Project> & {
          teamId: number;
        };
        const created = await createProject.mutateAsync(payload);
        const createdProject: Project =
          (created && (created as any).data) ?? (created as Project);
        setSelectedProject(createdProject);
        setTimeout(() => dispatch(setProject({ project: createdProject })), 0);
        toast.success("Project created successfully");
        return createdProject;
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to create project");
      }
    },
    [auth.userTeam?.id, createProject, dispatch]
  );

  // Refetch projects convenience wrapper
  const refetchProjects = useCallback(() => {
    projectsQuery.refetch?.();
  }, [projectsQuery]);

  // Build SidebarContext value (typed)
  const sidebarContextValue: SidebarContextValue = useMemo(() => {
    return {
      settaskForTableState,
      setListForTableState,
      setSelectedProject,
      selectedProject,
      usersList,
      projectsState,
      listForTable,
      taskForTableState,
      team: selectedTeam as Team, // selectedTeam could be undefined initially
      handleCreateProject,
      refetchProject: refetchProjects,
      isLoading: projectsLoading,
      setProjectsState,
      statuses,
    } as SidebarContextValue;
  }, [
    selectedProject,
    usersList,
    projectsState,
    listForTable,
    taskForTableState,
    selectedTeam,
    handleCreateProject,
    refetchProjects,
    projectsLoading,
    setProjectsState,
    statuses,
  ]);

  return (
    <ThemeProvider defaultTheme={theme} storageKey="vite-ui-theme">
      <AppErrorBoundary>
        <SideBarContext.Provider value={sidebarContextValue}>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset className="m-0 ">
              <SiteHeader logout={handleLogout} projects={projectsState} />
              <Routes>
                <Route
                  path="/:id"
                  element={
                    <RequireAuth>
                      <Page />
                    </RequireAuth>
                  }
                />
              </Routes>
            </SidebarInset>
          </SidebarProvider>
        </SideBarContext.Provider>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
