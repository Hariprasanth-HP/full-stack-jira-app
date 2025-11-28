import { DataTable } from "@/components/data-table";
import { IconFolderCode } from "@tabler/icons-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import React, { Fragment, useContext, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Trash } from "lucide-react";
import { useAppSelector } from "@/hooks/useAuth";
import { ProjectDialog } from "@/components/project-form";
import { Input } from "@/components/ui/input";
import { SideBarContext } from "@/contexts/sidebar-context";
import { DrawerInfo } from "@/components/task-drawer-form";
import AddTaskForm from "@/components/task-form";
import { AddTaskDialog } from "@/components/add-task-form";

export default function Page() {
  // task list from server (react-query hook)
  const auth = useAppSelector((s) => s.auth);
  // local UI state used by the table
  const {
    settaskForTableState,
    setListForTableState,
    setSelectedProject,
    usersList,
    projectsState,
    listForTable,
    team,
    handleCreateProject,
    refetchProject,
    taskForTableState,
    selectedProject,
    isLoading,
  } = useContext(SideBarContext);
  const taskForTable = useMemo(
    () => taskForTableState ?? [],
    [taskForTableState]
  );
  const [taskOpen, setTaskOpen] = useState(false);
  const [task, setTask] = useState(undefined);
  const [subTaskOpen, setSubTaskOpen] = useState(false);

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskData, setTaskData] = useState({});
  const [subTask, setSubTask] = React.useState<{
    id: number;
    name: string;
  } | null>(null);
  // Create helpers
  const columns = React.useMemo<ColumnDef<any, any>[]>(
    () => [
      // EXPAND / CHILDREN column (unchanged)
      {
        id: "stories",
        header: "Children",
        cell: ({ row }) => {
          const depth = row.depth;
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTaskDialog(true);
                  }}
                  title="Delete Task"
                  className="text-primary"
                >
                  <Edit className="h-4 w-4" />
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
            return <div className="flex items-center gap-2"></div>;
          }

          // deeper rows -> show edit/delete for items (assumes __kind exists for tasks/bugs)
          if (row.depth === 2) {
            const taskOrBug = row.original;
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
    []
  );
  console.log("taskForTabletaskForTable", taskForTable, taskForTableState);

  async function onRowClick(e, row) {
    await setTask(row.original);

    setTaskOpen(true);
  }
  async function onSubTaskClick(subTask: { id: number; name: string }) {
    setSubTask(subTask);
    setSubTaskOpen(true);
  }
  return (
    <>
      {isLoading ? (
        <div className="bg-primary text-primary-foreground flex size-6 w-[100%] h-[100%] items-center justify-center rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !projectsState || !projectsState.length ? (
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
                  refetch={refetchProject}
                />
              </div>
            </EmptyContent>
          </Empty>
        </div>
      ) : !selectedProject ? (
        <>No Projects selected</>
      ) : listForTable && listForTable?.length ? (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* <SectionCards /> */}
              <div className="px-4 lg:px-6">
                {/* <ChartAreaInteractive /> */}
              </div>
              <>
                <Input value={"Untitled List"} />
                <DataTable
                  data={taskForTable.filter((task) => !task.listId) ?? []}
                  columns={columns}
                  onRowClick={onRowClick}
                />
              </>
              {listForTable.map((list) => {
                const taskData = taskForTable.filter(
                  (task) => task.listId === list.id
                );
                return (
                  <>
                    <Input value={list.name} />
                    <DataTable
                      data={taskData ?? []}
                      columns={columns}
                      onRowClick={onRowClick}
                    />
                  </>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <>
            <Input value={"Untitled List"} />
            <DataTable
              data={taskForTable.filter((task) => !task.listId) ?? []}
              columns={columns}
              onRowClick={onRowClick}
            />
          </>
        </>
      )}
      <DrawerInfo
        open={taskOpen}
        task={task}
        setOpen={setTaskOpen}
        onSubTaskClick={onSubTaskClick}
        subTask={subTask}
        setSubTask={setSubTask}
        subTaskOpen={subTaskOpen}
        setSubTaskOpen={setSubTaskOpen}
      />
      <AddTaskDialog
        showTaskDialog={showTaskDialog}
        setShowTaskDialog={setShowTaskDialog}
        setTaskData={setTaskData}
        taskData
      />
    </>
  );
}
