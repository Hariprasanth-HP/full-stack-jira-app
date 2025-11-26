// src/AppRoutes.tsx
import { Suspense, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useAppDispatch, useAppSelector } from "@/hooks/useAuth";
import { logout } from "@/slices/authSlice";
import { toast } from "sonner";
import { useCreateProject, useProjects } from "@/lib/api/projects";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import AppErrorBoundary from "@/error-boundary/error-boundary";
import { RequireAuth } from "./RequireAuth";
import Page from "@/pages/Dashboard/page";
import { SideBarContext } from "@/contexts/sidebar-context";
import { useUsers } from "@/lib/api/user";
import { useFetchlistsFromProject } from "@/lib/api/list";
import { useFetchteam } from "@/lib/api/team";
import { useFetchtasksFromProject } from "@/lib/api/task";

// Lazy pages

export default function ProtectedRoutes() {
  const { theme } = useTheme();
  const auth = useAppSelector((s) => s.auth);

  const dispatch = useAppDispatch();
  async function handleLogout() {
    await dispatch(logout());
    toast.info("Logged Out successfully");
  }

  const [projectsState, setProjectsState] = useState([]);
  const { data, isLoading, error, refetch } = useProjects(auth.userTeam);
  const {
    data: usersList,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useUsers(auth.userTeam.id);
  const fetchLists = useFetchlistsFromProject(auth.userProject);
  const fetchTeam = useFetchteam();
  const fetchTasks = useFetchtasksFromProject();
  const createProject = useCreateProject();
  // local UI state used by the table
  const [listForTableState, setListForTableState] = useState([]);
  const [selectedProject, setSelectedProject] = useState(auth.userProject);
  const [selectedteam, setSelectedteam] = useState(auth.userTeam);

  useEffect(() => {
    async function fetchTeamData() {
      const { data } = await fetchTeam.mutateAsync({ id: auth.userTeam.id });
      if (data) {
        setSelectedteam(data);
        const existingProject = localStorage.getItem("project");
        if (existingProject) {
          const parsedProject = JSON.parse(existingProject);
          if (parsedProject.teamId !== data.id) {
            localStorage.removeItem("project");
            setSelectedProject(undefined);
          }
        }
      }
    }
    fetchTeamData();
  }, []);

  useEffect(() => {
    if (auth.userProject) {
      setSelectedProject(auth.userProject);
    }
  }, [auth.userProject]);

  useEffect(() => {
    if (data && data.length > 0) {
      setProjectsState(data);
    }
  }, [data]);

  useEffect(() => {
    if (selectedProject) {
      async function fetchTasksFunc() {
        const { data: tasks } = await fetchTasks.mutateAsync({
          projectId: selectedProject.id,
        });
        const { data: list } = await fetchLists.mutateAsync({
          projectId: selectedProject.id,
        });
        // settaskForTableState(tasks);
        setListForTableState(list);
      }
      fetchTasksFunc();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (data && data.length > 0) {
      setProjectsState(data);
    }
  }, [data]);
  const listForTable = useMemo(
    () => listForTableState ?? [],
    [listForTableState]
  );
  // Create helpers
  async function handleCreateProject(project) {
    const projectData = await createProject.mutateAsync({
      ...project,
      teamId: auth.userTeam.id,
    });
    setSelectedProject(projectData);
    setTimeout(() => dispatch(setProject({ project: projectData })), 0);
  }
  return (
    <ThemeProvider defaultTheme={theme} storageKey="vite-ui-theme">
      <AppErrorBoundary>
        <SideBarContext.Provider
          value={{
            //  settaskForTableState,
             setListForTableState,
            setSelectedProject,
            usersList,
            projectsState,
            listForTable,
            team: selectedteam,
            handleCreateProject,
            refetchProject: refetch,
          }}
        >
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
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
