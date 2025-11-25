import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconFolderCode } from "@tabler/icons-react";
import { ArrowUpRightIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDeletetask, useFetchtasksFromProject } from "@/lib/api/task";
import { useMutation } from "@tanstack/react-query";
import { FormMode } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Loader2, Trash } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAuth";
import { logout, setProject } from "@/slices/authSlice";
import { toast } from "sonner";
import { useCreateProject, useProjects } from "@/lib/api/projects";
import { ProjectDialog } from "@/components/project-form";
import { useFetchlistsFromProject } from "@/lib/api/list";
import { DashBoardContext } from "@/contexts/dashboard-context";

export default function Page() {
  // task list from server (react-query hook)
  const auth = useAppSelector((s) => s.auth);

  const deleteTask = useDeletetask();
  const { data, isLoading, error, refetch } = useProjects(auth.userTeam);
  const fetchLists = useFetchlistsFromProject(auth.userProject);

  const fetchTasks = useFetchtasksFromProject();
  const createProject = useCreateProject();
  // local UI state used by the table
  const [taskForTableState, settaskForTableState] = useState([]);
  const [listForTableState, setListForTableState] = useState([]);
  const [projectsState, setProjectsState] = useState([]);
  const [selectedProject, setSelectedProject] = useState(auth.userProject);

  useEffect(() => {
    if (selectedProject) {
      async function fetchTasksFunc() {
        const { data: tasks } = await fetchTasks.mutateAsync({
          projectId: selectedProject.id,
        });
        const { data: list } = await fetchLists.mutateAsync({
          projectId: selectedProject.id,
        });
        settaskForTableState(tasks);
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

  const taskForTable = useMemo(
    () => taskForTableState ?? [],
    [taskForTableState]
  );
  const listForTable = useMemo(
    () => listForTableState ?? [],
    [listForTableState]
  );
  console.log("list forta", listForTable, taskForTable);

  // Create helpers
  async function createEntityApi(
    type: "Task" | "story" | "task" | "bug",
    payload: any
  ) {
    switch (type) {
      case "Task":
        const { comment, ...rest } = payload;
        const { data } = await createTask.mutateAsync(rest);
        settaskForTableState((prev) => [...prev, data]);
        return;
    }
  }

  // Delete mapping
  async function deleteEntityApi(
    type: "Task" | "story" | "task" | "bug",
    id: string | number
  ) {
    try {
      const actions: {
        [K in "Task" | "story" | "task" | "bug"]?: () => Promise<any>;
      } = {
        task: () => deleteTask.mutateAsync({ taskId: id }),
      };

      const action = actions[type];
      if (!action)
        throw new Error(`Delete action for "${type}" is not implemented`);
      return await action();
    } catch (err) {
      console.error("deleteEntityApi error:", err);
      throw err;
    }
  }

  // Mutations used by modal create/update flows
  const createMutation = useMutation({
    mutationFn: ({
      type,
      payload,
    }: {
      type: "Task" | "story" | "task" | "bug";
      payload: any;
    }) =>
      createEntityApi(type, payload).then((res: any) => {
        // many mutateAsync hooks return the parsed JSON already; guard for both shapes
        if (res?.ok === false) throw new Error("Create failed");
        return res;
      }),
    onSuccess: () => qc.invalidateQueries(["task", projectId]),
    onSettled: () => {
      // modal will be closed by caller
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      type,
      id,
      payload,
    }: {
      type: "Task" | "story" | "task" | "bug";
      id: string | number;
      payload: any;
    }) => updateEntityApi(type, id, payload),
    onSuccess: () => qc.invalidateQueries(["task", projectId]),
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"Task" | "story" | "task" | "bug">(
    "Task"
  );
  const [modalMode, setModalMode] = useState<FormMode>(FormMode.CREATE);
  const [modalContext, setModalContext] = useState<any>(undefined);
  const [editingInitial, setEditingInitial] = useState<
    (Partial<any> & { id?: string | number }) | undefined
  >(undefined);

  // Table handlers
  function handleAdd(type: "Task" | "story" | "task" | "bug", ctx?: any) {
    setModalType(type);
    setModalMode(FormMode.CREATE);
    setModalContext(ctx);
    setEditingInitial(undefined);
    setModalOpen(true);
  }

  function handleEdit(
    type: "Task" | "story" | "task" | "bug",
    id?: string | number,
    ctx?: any
  ) {
    if (!id) return;
    let found: any = null;
    outer: for (const e of taskForTable) {
      if (String(e.id) === String(id) && type === "Task") {
        found = e;
        break;
      }
      for (const s of e.stories || []) {
        if (String(s.id) === String(id) && type === "story") {
          found = s;
          break outer;
        }
        for (const t of s.tasks || []) {
          if (String(t.id) === String(id) && type === "task") {
            found = t;
            break outer;
          }
        }
        for (const b of s.bugs || []) {
          if (String(b.id) === String(id) && type === "bug") {
            found = b;
            break outer;
          }
        }
      }
    }

    setModalType(type);
    setModalMode("edit");
    setModalContext(ctx);
    setEditingInitial(
      found
        ? {
            id: found.id,
            name: found.name,
            description: found.description,
            creator: found.creator,
            priority: found.priority,
            dueDate: found.dueDate,
            createdAt: found.createdAt,
            comments: found.comments,
          }
        : undefined
    );
    setModalOpen(true);
  }

  async function handleDelete(
    type: "Task" | "story" | "task" | "bug",
    id?: string | number
  ) {
    if (!id) return;
    if (!confirm(`Delete this ${type}? This cannot be undone.`)) return;
    try {
      await deleteEntityApi(type, id);
      qc.invalidateQueries(["task", projectId]);
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    }
  }

  async function onExpandTask(TaskId: string | number) {}

  const columns = React.useMemo<ColumnDef<any, any>[]>(
    () => [
      // EXPAND / CHILDREN column (unchanged)
      {
        id: "stories",
        header: "Children",
        cell: ({ row }) => {
          const depth = row.depth;
          const isExpanded = row.getIsExpanded();

          // ===== Task ROW =====
          //   if (depth === 0) {
          //     const Task = row.original as Task;
          //     const loading = !!loadingStoriesByTask?.[Task.id];

          //     const handleTaskExpand = async (e: React.MouseEvent) => {
          //       e.stopPropagation();
          //       if (isExpanded) {
          //         row.toggleExpanded();
          //         return;
          //       }
          //       if (Task.stories?.length > 0) {
          //         row.toggleExpanded();
          //         return;
          //       }
          //       await onExpandTask?.(Task.id);
          //       row.toggleExpanded();
          //     };

          //     return (
          //       <button
          //         onClick={handleTaskExpand}
          //         disabled={loading}
          //         className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted"
          //         aria-expanded={isExpanded}
          //         title={isExpanded ? "Collapse stories" : "Expand stories"}
          //       >
          //         {loading ? (
          //           <Loader2 className="h-4 w-4 animate-spin" />
          //         ) : isExpanded ? (
          //           "👇"
          //         ) : (
          //           "👉"
          //         )}
          //       </button>
          //     );
          //   }

          //   // ===== STORY ROW =====
          //   if (depth === 1) {
          //     const story = row.original as Story;
          //     const handleStoryExpand = async (e: React.MouseEvent) => {
          //       e.stopPropagation();
          //       console.log("storystorystory", story);

          //       await onExpandStory?.(story.id, row.original.TaskId);
          //       row.toggleExpanded();
          //     };

          //     return (
          //       <button
          //         onClick={handleStoryExpand}
          //         className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted"
          //         aria-expanded={isExpanded}
          //         title={isExpanded ? "Collapse story" : "Expand story"}
          //       >
          //         {isExpanded ? "🔽" : "▶️"}
          //       </button>
          //     );
          //   }

          // ===== DEEPER ROWS (tasks/bugs) =====
          return null;
        },
      },

      // ID
      {
        id: "id",
        accessorKey: "id",
        header: "ID",
        cell: (info) => (
          <span className="font-mono text-xs">{info.getValue()}</span>
        ),
        footer: (props) => props.column.id,
      },

      // Name
      {
        accessorKey: "name",
        id: "name",
        header: "Name",
        cell: (info) => <div className="font-medium">{info.getValue()}</div>,
        footer: (props) => props.column.id,
      },

      // Description
      {
        accessorKey: "description",
        id: "description",
        header: "Description",
        cell: (info) => (
          <div className="text-xs text-muted-foreground">
            {info.getValue() ?? (
              <span className="text-muted">No description</span>
            )}
          </div>
        ),
        footer: (props) => props.column.id,
      },

      // Creator
      {
        accessorKey: "creator",
        id: "creator",
        header: "Creator",
        cell: (info) => info.getValue() ?? "—",
        footer: (props) => props.column.id,
      },

      // Priority
      {
        accessorKey: "priority",
        id: "priority",
        header: "Priority",
        cell: (info) => (
          <span className="uppercase text-sm font-semibold">
            {info.getValue() ?? "UNKNOWN"}
          </span>
        ),
        footer: (props) => props.column.id,
      },

      // Due date (formatted)
      {
        id: "dueDate",
        accessorKey: "dueDate",
        header: "Due",
        cell: (info) => {
          const v = info.getValue();
          return v ? new Date(v as string).toLocaleDateString() : "—";
        },
        footer: (props) => props.column.id,
      },

      // Created at (formatted)
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Created",
        cell: (info) => {
          const v = info.getValue();
          return v ? new Date(v as string).toLocaleString() : "—";
        },
        footer: (props) => props.column.id,
      },

      // Project
      {
        id: "projectId",
        accessorKey: "projectId",
        header: "Project",
        cell: (info) => (info.getValue() ? String(info.getValue()) : "—"),
        footer: (props) => props.column.id,
      },

      // ADD / ACTIONS column (with Delete)
      {
        id: "addActions",
        header: "Actions",
        cell: ({ row }) => {
          // Task row -> single "Add story" + Delete
          if (row.depth === 0) {
            const Task = row.original as Task;
            return (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAdd?.("story", { TaskId: Task.id })}
                >
                  Add story
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete?.("Task", Task.id)}
                  title="Delete Task"
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            );
          }

          // Story row -> two buttons: Add Task, Add Bug + Delete
          if (row.depth === 1) {
            const story = row.original as Story;
            return (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAdd?.("task", { storyId: story.id })}
                >
                  Add Task
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAdd?.("bug", { storyId: story.id })}
                >
                  Add Bug
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete?.("story", story.id)}
                  title="Delete story"
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            );
          }

          // deeper rows -> show edit/delete for items (assumes __kind exists for tasks/bugs)
          if (row.depth === 2) {
            const taskOrBug = row.original;
            console.log("taskOrBugtaskOrBugtaskOrBug", taskOrBug);

            return (
              <Fragment>
                {taskOrBug.type ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete?.("bug", taskOrBug.id)}
                      title="Delete story"
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete?.("task", taskOrBug.id)}
                      title="Delete story"
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Fragment>
            );
          }
        },
        footer: (props) => props.column.id,
      },
    ],
    // dependencies: update columns if these change
    [onExpandTask, handleAdd, handleDelete, handleEdit]
  );

  async function handleCreateProject(project) {
    const projectData = await createProject.mutateAsync({
      ...project,
      teamId: auth.userTeam.id,
    });
    console.log("datadatadata", projectData);
    setSelectedProject(projectData);
    setTimeout(() => dispatch(setProject({ project: projectData })), 0);
  }
  const dispatch = useAppDispatch();
  async function handleLogout() {
    await dispatch(logout());
    toast.info("Logged Out successfully");
  }
  return (
    <DashBoardContext.Provider
      value={{ settaskForTableState, setListForTableState, setSelectedProject }}
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
          <SiteHeader
            logout={handleLogout}
            projects={projectsState}
            projectComp={
              <ProjectDialog onSubmit={handleCreateProject} refetch={refetch} />
            }
          />

          {isLoading ? (
            <div className="bg-primary text-primary-foreground flex size-6 w-[100%] h-[100%] items-center justify-center rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data || !data.length ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconFolderCode />
                  </EmptyMedia>
                  <EmptyTitle>No Projects Yet</EmptyTitle>
                  <EmptyDescription>
                    You haven&apos;t created any projects yet. Get started by
                    creating your first project.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className="flex gap-2">
                    <ProjectDialog
                      onSubmit={handleCreateProject}
                      refetch={refetch}
                    />
                  </div>
                </EmptyContent>
              </Empty>
            </div>
          ) : listForTable && listForTable?.length ? (
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {/* <SectionCards /> */}
                  <div className="px-4 lg:px-6">
                    {/* <ChartAreaInteractive /> */}
                  </div>
                  {listForTable.map((list) => {
                    return (
                      <DataTable data={taskForTable ?? []} columns={columns} />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}
        </SidebarInset>
      </SidebarProvider>
    </DashBoardContext.Provider>
  );
}
