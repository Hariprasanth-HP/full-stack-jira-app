// src/AppRoutes.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type JSX,
} from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useAppDispatch, useAppSelector } from '@/hooks/useAuth';
import { logout, setProject } from '@/slices/authSlice';
import { toast } from 'sonner';
import {
  useCreateProject,
  useProjects,
  type CreateProjectPayload,
} from '@/lib/api/projects';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import AppErrorBoundary from '@/error-boundary/error-boundary';
import { RequireAuth } from './RequireAuth';
import Page from '@/pages/Dashboard/page';
import { SideBarContext } from '@/contexts/sidebar-context';
import { useFetchlistsFromProject } from '@/lib/api/list';
import { useFetchteam } from '@/lib/api/team';
import { useFetchtasksFromProject } from '@/lib/api/task';
import { useFetchmembersFromTeam } from '@/lib/api/member';
import { useStatuses } from '@/lib/api/status';

// types generated from your Prisma schema (drop-in file)
import type {
  Project,
  Team,
  TeamMember,
  List,
  Task,
  SidebarContextValue,
} from '@/types/type';
import type { AuthState } from '@/types/auth';
export default function ProtectedRoutes(): JSX.Element {
  const { theme } = useTheme();

  const auth = useAppSelector((s: { auth: AuthState }) => s.auth);
  const dispatch = useAppDispatch();

  const projectsQuery = useProjects({ id: auth.userTeam?.id });
  const projects: Project[] = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data]
  );
  const projectsLoading = projectsQuery.isLoading ?? false;

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
  const [taskForTableState, setTaskForTableState] = useState<Task[]>([]);

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
    toast.info('Logged Out successfully');
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
        const { data } = await fetchTeam.mutateAsync({ id: auth.userTeam.id });
        if (mounted && data) {
          setSelectedTeam(data);
        }

        // fetch members
        const { data: memberData } = await fetchMembers.mutateAsync({
          teamId: auth.userTeam.id,
        });
        if (mounted && memberData) {
          setUsersList(memberData);
        }

        // reconcile stored project in localStorage (if any)
        const existingProjectStr = localStorage.getItem('project');
        if (existingProjectStr && mounted) {
          try {
            const parsedProject = JSON.parse(existingProjectStr) as Project;
            if (parsedProject?.teamId !== auth.userTeam.id) {
              localStorage.removeItem('project');
              setSelectedProject(undefined);
            }
          } catch {
            localStorage.removeItem('project');
            setSelectedProject(undefined);
          }
        }
      } catch (e) {
        void e;
      }
    }

    bootTeamAndMembers();

    return () => {
      mounted = false;
    };
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
        setTaskForTableState([]);
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
          setTaskForTableState(tasksRes.data);
        } else {
          setTaskForTableState([]);
        }

        if (listsRes?.data) {
          setListForTableState(listsRes.data);
        } else {
          setListForTableState([]);
        }
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        void e;
      }
    }

    loadProjectData(selectedProject);

    return () => {
      mounted = false;
    };
    // include selectedProject.id so effect re-runs when project changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id]);

  const handleCreateProject = useCallback(
    async (projectPayload: Partial<Project>): Promise<Project | undefined> => {
      const teamId = auth.userTeam?.id;
      if (!teamId) {
        toast.error('Cannot create project: missing team');
        return;
      }

      // Build a well-typed payload so the mutation's input type matches
      const payload: CreateProjectPayload = {
        // prefer explicit fields instead of spreading unknown Partial<Project>
        name: (projectPayload.name as string) ?? 'Untitled project',
        description: projectPayload.description,
        creatorId: (projectPayload.creatorId as number) ?? auth.user?.id ?? 0,
        teamId,
      };

      try {
        const createdProject = await createProject.mutateAsync(payload);

        // createdProject is typed Project thanks to unwrap above
        setSelectedProject(createdProject);
        // dispatch synchronously — no need for setTimeout
        dispatch(setProject({ userProject: createdProject }));

        toast.success('Project created successfully');
        return createdProject;
      } catch (err: unknown) {
        const message =
          typeof err === 'object' && err !== null && 'message' in err
            ? String(err.message)
            : 'Failed to create project';

        toast.error(message);
        return;
      }
    },
    [auth.userTeam?.id, auth.user?.id, createProject, dispatch]
  );

  // Refetch projects convenience wrapper
  const refetchProjects = useCallback(() => {
    projectsQuery.refetch?.();
  }, [projectsQuery]);

  // Build SidebarContext value (typed)
  const sidebarContextValue: SidebarContextValue = useMemo(() => {
    return {
      setTaskForTableState,
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
    <ThemeProvider defaultTheme={theme} storageKey='vite-ui-theme'>
      <AppErrorBoundary>
        <SideBarContext.Provider value={sidebarContextValue}>
          <SidebarProvider
            style={
              {
                '--sidebar-width': 'calc(var(--spacing) * 72)',
                '--header-height': 'calc(var(--spacing) * 12)',
              } as React.CSSProperties
            }
          >
            <AppSidebar variant='inset' />
            <SidebarInset className='m-0 '>
              <SiteHeader logout={handleLogout} projects={projectsState} />
              <Routes>
                <Route
                  path='/:id'
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
