'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanItemProps,
} from '@/components/ui/shadcn-io/kanban';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUpdatetask } from '@/lib/api/task';
import { toast } from 'sonner';
import { Edit2Icon, PlusCircleIcon } from 'lucide-react';
import CreateStatusForm from './create-status-form';
import { AddTaskDialog } from './add-task-form';
import { debounce } from 'lodash';
import type { Priority, Task, TaskStatus } from '@/types/type';
import type { Status } from '@/lib/api/status';

export type User = {
  id: number;
  name: string;
  image?: string | null;
};

/**
 * Props for the Kanban component
 */
type Props = {
  projectId?: number;
  open: boolean;
  statuses: TaskStatus[] | undefined; // TaskStatus rows for the project
  tasks: Task[]; // Task rows for the project
  task: Task | undefined; // Task rows for the project
  /**
   * onChange will be called when the Kanban data changes (for example: card moved to another column).
   * It receives the updated Task[] (with statusId updated) so you can persist changes to your backend.
   */
  onChange?: (updatedTasks: Task[]) => void;

  // additional callbacks used by this component (present in your implementation)
  setTask: React.Dispatch<React.SetStateAction<Task | undefined>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setTaskForTableState: React.Dispatch<React.SetStateAction<Task[]>>;
};

/**
 * Internal types used for Kanban items/columns coming from the Kanban provider
 */
type KanbanColumn = {
  id: string;
  name: string;
  color?: string;
};

type KanbanItem = {
  id: string | number;
  name?: string;
  description?: string | null;
  createdAt?: Date | string;
  priority?: Priority;
  dueDate?: Date | string | null;
  parentTaskId?: number | null;
  projectId?: number | undefined;
  listId?: number | null;
  assignedById?: number | null;
  assignedBy?: User | null;
  assigneeId?: number | null;
  assignee?: User | null;
  activities?: unknown[];
  statusId?: string | number | null;
  column?: string | null;
};

/**
 * selected column type — kept permissive because we set it from UI column props
 * while sometimes using TaskStatus objects. This avoids forcing logic changes.
 */
export type SelectedColumn = Partial<TaskStatus> & {
  id?: number;
  name?: string;
  color?: string;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

type LocalTask = Omit<Task, 'id' | 'statusId'> & {
  id: string; // prefixed id used by kanban UI
  statusId: string | null; // string key or null
  column: string | null; // same as statusId for convenience
} & Partial<KanbanItemProps>; // add any optional Kanban props if needed

/**
 * KanbanFromData - uses provided statuses & tasks (no faker)
 */
export default function KanbanFromData({
  statuses,
  tasks,
  onChange,
  setTask,
  setOpen,
  setTaskForTableState,
}: Props): React.ReactElement {
  // Keep a local copy so the Kanban library can mutate / reorder; synchronize when props change.
  const [localTasks, setLocalTasks] = useState<LocalTask[]>(() =>
    (tasks ?? []).map((t): LocalTask => {
      // destructure to avoid spreading original id/statusId which have different types
      const { id: originalId, statusId: originalStatusId, ...rest } = t as Task;
      return {
        ...rest,
        id: `task-${originalId}`, // guaranteed string
        statusId:
          originalStatusId == null ? null : `status-${originalStatusId}`,
        column: originalStatusId == null ? null : `status-${originalStatusId}`,
      } as LocalTask;
    })
  );

  // sync when parent provides new tasks
  // -- in your useEffect (normalize incoming tasks)
  useEffect(() => {
    setLocalTasks(
      (tasks ?? []).map((t): LocalTask => {
        const {
          id: originalId,
          statusId: originalStatusId,
          ...rest
        } = t as Task;
        return {
          ...rest,
          id: `task-${originalId}`,
          statusId:
            originalStatusId == null ? null : `status-${originalStatusId}`,
          column:
            originalStatusId == null ? null : `status-${originalStatusId}`,
        } as LocalTask;
      })
    );
  }, [tasks]);

  const [columnData, setColumnData] = useState<TaskStatus[]>([]);

  useEffect(() => {
    if (statuses) {
      setColumnData(statuses);
    }
  }, [statuses]);
  const columns = useMemo(
    () =>
      columnData?.map((s: Status) => ({
        id: `status-${s.id}`, // << prefix here
        name: s.name,
        color: s.color ?? '#6B7280',
      })),
    [columnData, statuses]
  );
  const [selectedColumn, setSelectedColumn] = useState<
    SelectedColumn | undefined
  >(undefined);

  const updateTask = useUpdatetask();
  const [showStatusDialog, setShowStatusDialog] = useState<boolean>(false);
  const [showTaskDialog, setShowTaskDialog] = useState<boolean>(false);

  const parseTaskId = (pref: string | number): number =>
    typeof pref === 'string' && pref.startsWith('task-')
      ? Number(pref.replace(/^task-/, ''))
      : Number(pref);

  const parseStatusId = (col: string | number | null): number | null =>
    col == null
      ? null
      : typeof col === 'string' && col.startsWith('status-')
        ? Number(col.replace(/^status-/, ''))
        : Number(col);

  return (
    <>
      <KanbanProvider
        columns={columns}
        data={localTasks}
        onDataChange={async (newData: KanbanItem[]) => {
          try {
            // Map newData -> numeric mapped tasks (same as earlier mapping)
            const mapped: Task[] = newData.map((d: KanbanItem) => {
              const parsedId = parseTaskId(d.id);
              const parsedStatusId = parseStatusId(d.column ?? null);
              const existing = localTasks.find((t) =>
                typeof t.id === 'string'
                  ? t.id === d.id
                  : Number(t.id) === parsedId
              );
              return {
                id: parsedId,
                name: d.name ?? existing?.name ?? 'Untitled',
                description: existing?.description ?? d.description ?? '',
                createdAt: existing?.createdAt ?? d.createdAt ?? new Date(),
                priority: (existing?.priority ??
                  d.priority ??
                  'MEDIUM') as Priority,
                dueDate: existing?.dueDate ?? d.dueDate ?? null,
                parentTaskId: existing?.parentTaskId ?? null,
                projectId: existing?.projectId ?? undefined,
                listId: existing?.listId ?? null,
                assignedById: existing?.assignedById ?? null,
                assignedBy: existing?.assignedBy ?? null,
                assigneeId: existing?.assigneeId ?? null,
                assignee: existing?.assignee ?? null,
                activities: existing?.activities ?? [],
                statusId: parsedStatusId,
              } as Task;
            });

            // 1) Set local UI immediately (prefixed form for Kanban)
            const localized: LocalTask[] = mapped.map(
              (t) =>
                ({
                  ...t,
                  id: `task-${t.id}`,
                  column: t.statusId == null ? null : `status-${t.statusId}`,
                  statusId: t.statusId == null ? null : `status-${t.statusId}`,
                }) as LocalTask
            );
            setLocalTasks(localized);

            // 2) Persist changes: find tasks whose status changed relative to previous localTasks
            // create a map of previous statusId by numeric id
            const prevMap = new Map<number, number | null>();
            localTasks.forEach((lt) => {
              const numeric = parseTaskId(lt.id);
              const prevStatus =
                lt.statusId == null ? null : parseStatusId(lt.statusId);
              prevMap.set(numeric, prevStatus);
            });

            // For each changed task, call API individually (optimistic + rollback on that single task)
            for (const t of mapped) {
              const prevStatus = prevMap.get(Number(t.id)) ?? null;
              const newStatus = t.statusId ?? null;
              if (prevStatus === newStatus) continue;

              const debouncedUpdate = debounce(
                async () => {
                  try {
                    const { data } = await updateTask.mutateAsync(t);

                    if (data) {
                      toast.success('Updated Successfully');
                      onChange?.(mapped);
                    } else {
                      console.error(
                        '[onDataChange] failed to persist task move',
                        {
                          taskId: t.id,
                        }
                      );

                      setLocalTasks((cur: LocalTask[]) =>
                        cur.map((lt) => {
                          const numeric = parseTaskId(lt.id); // number | null

                          // If this isn't the task we care about, return it unchanged
                          if (numeric === null || numeric !== t.id) return lt;

                          // Otherwise return a new object with updated fields
                          const newStatus =
                            prevStatus == null ? null : `status-${prevStatus}`;

                          return {
                            ...lt,
                            column: newStatus,
                            statusId: newStatus,
                          } as LocalTask;
                        })
                      );

                      alert(`Failed to move "${t.name}". Changes reverted.`);
                    }
                  } catch (e) {
                    console.error('debouncedUpdate error:', e);
                  }
                },
                300 // debounce time (ms)
              );
              debouncedUpdate();
            }

            // 3) Notify parent with canonical numeric tasks (mapped)
          } catch (err) {
            console.error('[onDataChange] mapping error', { err, newData });
          }
          setOpen(false);
        }}
      >
        {(column: KanbanColumn) => (
          <KanbanBoard id={column.id} key={column.id}>
            <KanbanHeader>
              <div className='flex items-center gap-2'>
                <div
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: column.color }}
                />
                <span>{column.name}</span>
                <div className='flex items-center gap-2 ml-auto'>
                  <Edit2Icon
                    onClick={() => {
                      setShowStatusDialog(true);
                      setSelectedColumn({
                        ...column,
                        id: parseStatusId(column.id)!,
                      });
                    }}
                    className='w-4  h-4 text-muted-foreground opacity-10 hover:opacity-100 transition-opacity'
                  />
                  <PlusCircleIcon
                    onClick={() => {
                      setShowTaskDialog(true);
                      setSelectedColumn({
                        ...column,
                        id: parseStatusId(column.id)!,
                      });
                    }}
                    className='w-4 h-4 pointer hover:opacity-100 transition-opacity'
                  />
                </div>
              </div>
            </KanbanHeader>

            <KanbanCards id={column.id}>
              {(task: LocalTask) => {
                // Render each task card
                const createdAt = task.createdAt
                  ? new Date(task.createdAt)
                  : null;
                const dueDate = task.dueDate
                  ? new Date(task.dueDate as string | Date)
                  : null;

                return (
                  <KanbanCard
                    column={column.id}
                    id={String(task.id)!}
                    key={task.id}
                    name={task.name}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.stopPropagation();
                      setTask({
                        ...task,
                        id: parseTaskId(task.id),
                        statusId: parseStatusId(String(task.statusId)),
                      });
                      setOpen(true);
                    }}
                  >
                    <div className='flex items-start justify-between gap-2  '>
                      <div className='flex flex-col gap-1 min-w-0'>
                        <p className='m-0 flex-1 font-medium text-sm truncate'>
                          {task.name}
                        </p>
                        {task.description && (
                          <p className='m-0 text-xs text-muted-foreground overflow-auto'>
                            {task.description}
                          </p>
                        )}

                        <div className='mt-1 flex items-center gap-2'>
                          {task.priority && (
                            <span className='rounded-md px-2 py-0.5 text-[10px] font-medium border'>
                              {task.priority}
                            </span>
                          )}
                          {dueDate && (
                            <span className='text-[11px] text-muted-foreground'>
                              Due {shortDateFormatter.format(dueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {task.assignee && (
                        <Avatar className='h-6 w-6 shrink-0'>
                          <AvatarFallback>
                            {task.assignee.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    <p className='m-0 text-muted-foreground text-xs mt-2'>
                      {createdAt
                        ? `Created: ${shortDateFormatter.format(createdAt)}`
                        : 'Created: —'}{' '}
                      {dueDate && <>— {dateFormatter.format(dueDate)}</>}
                    </p>
                  </KanbanCard>
                );
              }}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
      <CreateStatusForm
        openDialog={showStatusDialog}
        initialData={selectedColumn}
        setOpenDialog={setShowStatusDialog}
        onSuccess={() => setShowStatusDialog(false)}
        onCancel={() => setShowStatusDialog(false)}
        setColumnData={setColumnData}
      />
      <AddTaskDialog
        showTaskDialog={showTaskDialog}
        setShowTaskDialog={setShowTaskDialog}
        setTaskForTableState={setTaskForTableState}
        status={selectedColumn}
      />
    </>
  );
}
