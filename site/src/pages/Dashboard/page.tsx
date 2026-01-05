import React, { useContext, useMemo, useState } from 'react';
import { IconFolderCode } from '@tabler/icons-react';
import { Edit, Loader2, Trash } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Row } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useAppSelector } from '@/hooks/useAuth';
import { SideBarContext } from '@/contexts/sidebar-context';
import { DrawerInfo } from '@/components/task-drawer-form';
import { ProjectDialog } from '@/components/project-form';
import DeleteTaskDialog, { AddTaskDialog } from '@/components/add-task-form';
import { ViewMode, type Task } from '@/types/type';
import KanbanFromData from '@/components/kanban-view';
import { useCreatetask } from '@/lib/api/task';

export interface List {
  id: number;
  name: string;
}

/* -----------------------------------------------------
 📄 Page Component
----------------------------------------------------- */

export default function Page() {
  const auth = useAppSelector((s) => s.auth);

  const {
    setTaskForTableState,
    projectsState,
    listForTable,
    handleCreateProject,
    refetchProject,
    taskForTableState,
    selectedProject,
    isLoading,
    statuses,
  } = useContext(SideBarContext)!;

  /* ------------------ UI State ------------------ */
  const [taskOpen, setTaskOpen] = useState(false);

  const [subTaskOpen, setSubTaskOpen] = useState(false);
  const [subTask, setSubTask] = useState<Task | undefined>(undefined);

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showTaskDelete, setShowTaskDelete] = useState(false);
  const [taskData, setTaskData] = useState<Task | undefined>(undefined);
  const createTask = useCreatetask();

  const taskForTable: Task[] = useMemo(
    () => taskForTableState ?? [],
    [taskForTableState]
  );

  /* -----------------------------------------------------
   📌 Table Columns
  ----------------------------------------------------- */

  const columns = useMemo<ColumnDef<Task>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ getValue }) => (
          <span className='font-medium'>{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ getValue }): React.ReactNode => {
          const v = getValue() as string | null;

          return (
            <p className='text-xs text-muted-foreground'>
              {v || <span className='text-muted'>No description</span>}
            </p>
          );
        },
      },
      {
        accessorKey: 'creator',
        header: 'Creator',
        cell: ({ getValue }) => getValue() ?? '—',
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => (
          <span className='uppercase text-sm font-semibold'>
            {(getValue() as string) ?? 'UNKNOWN'}
          </span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due',
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? new Date(v).toLocaleDateString() : '—';
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original as Task | undefined;

          return (
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                title='Edit Task'
                onClick={(e) => {
                  e.stopPropagation();
                  setTaskData(item);
                  setShowTaskDialog(true);
                }}
                className='text-primary'
              >
                <Edit className='h-4 w-4' />
              </Button>

              <Button
                variant='ghost'
                size='sm'
                title='Delete Task'
                onClick={(e) => {
                  e.stopPropagation();
                  setTaskData(item);
                  setShowTaskDelete(true);
                }}
                className='text-destructive'
                disabled={item?.subTasks?.length !== 0}
              >
                <Trash className='h-4 w-4' />
              </Button>
            </div>
          );
        },
      },
    ];
  }, []);

  /* -----------------------------------------------------
   📌 Handlers
  ----------------------------------------------------- */

  function handleRowClick(_event: unknown, row: Row<Task>) {
    setTaskData(row.original as Task);
    setTaskOpen(true);
  }

  function handleSubTaskClick(st: Task) {
    setSubTask(st);
    setSubTaskOpen(true);
  }

  /* -----------------------------------------------------
   🚦 Render States
  ----------------------------------------------------- */

  if (isLoading) {
    return (
      <div className='flex w-full h-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!projectsState?.length) {
    return (
      <div className='flex flex-col items-center justify-center flex-1'>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <IconFolderCode />
            </EmptyMedia>
            <EmptyTitle>No Projects Yet</EmptyTitle>
            <EmptyDescription>
              You haven’t created any projects yet. Start by creating one.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ProjectDialog
              onSubmit={handleCreateProject}
              refetch={refetchProject}
            />
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (!selectedProject) {
    return <>No project selected</>;
  }

  /* -----------------------------------------------------
   📋 Main Render
  ----------------------------------------------------- */
  const handleChange = (updated: Task[]) => {
    // Persist updated tasks to your API/Prisma here
    console.log('kanban changed -> persist these tasks:', updated);
    setTaskForTableState(updated);
  };
  console.log('taskForTable', taskForTable);

  return (
    <>
      {auth.viewMode === ViewMode.KANBAN ? (
        <>
          <KanbanFromData
            statuses={statuses}
            tasks={taskForTable}
            onChange={handleChange}
            open={taskOpen}
            task={taskData}
            setTask={setTaskData}
            setOpen={setTaskOpen}
            setTaskForTableState={setTaskForTableState}
          />
        </>
      ) : (
        <>
          <div className='flex flex-col flex-1 gap-4 py-4'>
            {/* Untitled List Group */}
            <Input value='Untitled List' readOnly />
            <DataTable
              data={taskForTable.filter((t) => !t.listId)}
              columns={columns}
              onRowClick={handleRowClick}
            />

            {/* Project Lists */}
            {listForTable?.map((list: List) => {
              const listTasks = taskForTable.filter(
                (t) => t.listId === list.id
              );

              return (
                <div key={list.id} className='flex flex-col gap-2'>
                  <Input value={list.name} readOnly />
                  <DataTable
                    data={listTasks}
                    columns={columns}
                    onRowClick={handleRowClick}
                  />
                </div>
              );
            })}
          </div>

          {/* Drawer / Dialogs */}
        </>
      )}
      <AddTaskDialog
        showTaskDialog={showTaskDialog}
        setShowTaskDialog={setShowTaskDialog}
        taskData={taskData}
        setTaskData={setTaskData}
        setTaskForTableState={setTaskForTableState}
        type='edit'
      />
      <DrawerInfo
        open={taskOpen}
        task={taskData}
        setTask={setTaskData}
        setOpen={setTaskOpen}
        userId={auth.user?.id}
        taskId={taskData?.id}
        setTaskForTableState={setTaskForTableState}
        onSubTaskClick={handleSubTaskClick}
        subTask={subTask}
        setSubTask={setSubTask}
        subTaskOpen={subTaskOpen}
        setSubTaskOpen={setSubTaskOpen}
        parentId={null}
        statuses={statuses}
        setShowTaskDelete={setShowTaskDelete}
        createTask={createTask}
      />

      <DeleteTaskDialog
        showTaskDelete={showTaskDelete}
        setShowTaskDelete={setShowTaskDelete}
        taskData={taskData}
        setTaskData={setTaskData}
        setTaskForTableState={setTaskForTableState}
        setTaskOpen={setTaskOpen}
      />
    </>
  );
}
