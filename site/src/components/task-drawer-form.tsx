'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useUpdatetask } from '@/lib/api/task';
import { useFetchactivitiesFromTask } from '@/lib/api/activity';
import ActivityComp from './activity-section';
import type { Activity, Task } from '@/types/type';
import type { Status } from '@/lib/api/status';
import { useState, useEffect } from 'react';

/**
 * Props notes:
 * - onUpdate is optional. If provided it will be called with partial task updates: (patch) => Promise
 * - If onUpdate isn't provided the component will update locally only (useful for storybook/dev)
 */
export interface DrawerInfoProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  task?: Task | null;
  onEdit?: (task: Task) => void;
  onUpdate?: (patch: Partial<Task>) => Promise<unknown> | void;
  // passthroughs
  [k: string]: unknown;
  // explicit extras commonly used by the component
  onSubTaskClick?: (subTask: Task) => void;
  subTask?: Task | null;
  subTaskOpen?: boolean;
  setSubTaskOpen?: (v: boolean) => void;
  type?: string;
  setTask?: (updater: (prev: Task) => Task) => void;
  setSubTask?: (updater: (prev: Task) => Task) => void;
  setTaskForTableState?: (updater: (prev: Task[]) => Task[]) => void;
  statuses?: Status[];
  userId?: number;
}

export function DrawerInfo({
  open,
  setOpen,
  task,
  onEdit,
  onSubTaskClick,
  setTask,
  setTaskForTableState,
  statuses = [],
  ...rest
}: DrawerInfoProps) {
  // Local editable state (keeps the original task prop intact until we apply changes)
  const [localTask, setLocalTask] = useState<Task>(task!);
  const [activities, setActivities] = useState<Activity[]>([]);
  const fetchActivities = useFetchactivitiesFromTask();

  useEffect(() => {
    async function fetchActivitiesFromTask() {
      const { data } = await fetchActivities.mutateAsync({
        id: Number(task?.id),
      });
      if (data) {
        setActivities(data as Activity[]);
      }
    }
    fetchActivitiesFromTask();
    setLocalTask(task!);
  }, [task]);
  // which field is currently being edited
  const [editing, setEditing] = React.useState<string | null>(null);
  // small error holder
  const [_, setError] = React.useState<string | null>(null);
  // helper to format dates for display and for input[type=datetime-local]
  const fmt = (d?: string | Date | null) => {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleString();
  };
  const toDateTimeLocal = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000; //offset in ms
    const localISOTime = new Date(date.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };
  const fromDateTimeLocal = (v: string) => {
    if (!v) return null;
    // create Date assumed local
    return new Date(v);
  };

  const priorityBadge = (p?: Task['priority']) => {
    switch (p) {
      case 'HIGH':
        return <Badge variant='destructive'>High</Badge>;
      case 'LOW':
        return <Badge variant='secondary'>Low</Badge>;
      default:
        return <Badge>Medium</Badge>;
    }
  };
  const updateTask = useUpdatetask();

  // generic save handler: updates local state immediately and calls onUpdate if present
  async function applyPatch(patch: Partial<Task>) {
    // optimistic local merge
    setLocalTask((prev) => ({ ...prev, ...patch }));

    if (setTask) {
      setTask((prev: Task | null) => ({ ...(prev as Task), ...patch }));
    }

    if (setTaskForTableState) {
      // ensure setTaskForTableState is typed as React.Dispatch<React.SetStateAction<Task[]>>
      setTaskForTableState((prev: Task[]) =>
        prev.map((t) => (t.id === task?.id ? { ...t, ...patch } : t))
      );
    }

    try {
      // assume updateTask.mutateAsync returns Promise<UpdateTaskResponse>
      const { activity } = await updateTask.mutateAsync({
        ...patch,
        id: task?.id,
        assignedById: Number(rest.userId)!,
      }); // if necessary, cast the payload to the expected payload type

      // If an activity was returned, prepend it to activities using the prev state
      if (activity) {
        setActivities((prev) => [activity as Activity, ...prev]);
      }
    } catch (err: unknown) {
      // narrow unknown safely to get a message
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Failed to update';
      setError(message);
      // rollback naive: re-sync from original prop (consumer should re-fetch)
      setLocalTask(task!);
    }
  }

  if (!task) {
    return (
      <Drawer open={open}>
        <DrawerContent>
          <div className='mx-auto w-full max-w-lg p-6'>
            <DrawerHeader>
              <DrawerTitle>No task selected</DrawerTitle>
              <DrawerDescription>
                Select a task to view more details.
              </DrawerDescription>
            </DrawerHeader>

            <div className='py-6 text-sm text-muted-foreground'>
              No information available.
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant='outline' onClick={() => setOpen(false)}>
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  // shadcn-based inline components used for editing on double-click
  const InlineText: React.FC<{
    field: keyof Task | string;
    placeholder?: string;
    singleLine?: boolean;
  }> = ({ field, placeholder, singleLine = true }) => {
    const value = (localTask?.[field as keyof Task] ?? '') as string;

    const [val, setVal] = React.useState<string>(value);

    React.useEffect(() => {
      setVal((localTask?.[field as keyof Task] ?? '') as string);
    }, [editing]);

    return singleLine ? (
      <Input
        autoFocus
        onBlur={async () => {
          setEditing(null);
          if (val !== value) {
            await applyPatch({ [field]: val } as Partial<Task>);
          }
        }}
        value={val}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setVal(e.target.value)
        }
        onKeyDown={async (e: React.KeyboardEvent) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setVal(value);
            setEditing(null);
          }
        }}
        className='border-0 bg-transparent px-1 py-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-none outline-none'
        placeholder={placeholder}
      />
    ) : (
      <Textarea
        autoFocus
        onBlur={async () => {
          setEditing(null);
          if (val !== value)
            await applyPatch({ [field]: val } as Partial<Task>);
        }}
        value={val}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setVal(e.target.value)
        }
        placeholder={placeholder}
      />
    );
  };

  const InlineSelectPriority: React.FC = () => {
    const value = (localTask.priority as string) ?? 'MEDIUM';
    const [val, setVal] = React.useState<string>(value);
    return (
      <Select
        value={val}
        onValueChange={async (v: string) => {
          setVal(v);
          setEditing(null);
          if (v !== value)
            await applyPatch({ priority: v as unknown } as Partial<Task>);
        }}
      >
        <SelectTrigger aria-label='Priority' className='w-full'>
          <SelectValue placeholder='Select priority' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='LOW'>Low</SelectItem>
          <SelectItem value='MEDIUM'>Medium</SelectItem>
          <SelectItem value='HIGH'>High</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  const InlineSelectStatus: React.FC = () => {
    const value = String(localTask.statusId);
    const [val, setVal] = React.useState<string | null>(value);
    return (
      <Select
        value={val ?? undefined}
        onValueChange={async (v: string) => {
          setVal(v);
          setEditing(null);
          if (v !== value) {
            await applyPatch({
              statusId: Number(v) as unknown,
            } as Partial<Task>);
          }
        }}
      >
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Select status' />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((l) => (
            <SelectItem key={l.id} value={String(l.id)}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const InlineDateTime: React.FC<{ field: keyof Task }> = ({ field }) => {
    const current = localTask?.[field as keyof Task];
    const value = toDateTimeLocal(current as string | Date | null);
    const [val, setVal] = React.useState<string>(value);
    return (
      <Input
        type='date'
        autoFocus
        value={val}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setVal(e.target.value);
        }}
        onBlur={async () => {
          setEditing(null);
          const newDate = fromDateTimeLocal(val);
          if (String(newDate) !== String(current))
            await applyPatch({ [field]: newDate } as Partial<Task>);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  };

  const InlinePerson: React.FC<{ field: keyof Task }> = ({ field }) => {
    const current = localTask?.[field as keyof Task];
    const value: string = String(current);
    const [val, setVal] = React.useState<string>(value);
    React.useEffect(() => setVal(value), [editing]);
    return (
      <Input
        autoFocus
        value={val}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setVal(e.target.value)
        }
        onBlur={async () => {
          setEditing(null);
          if (val !== value)
            await applyPatch({
              [field]: val ? { name: val } : null,
            } as Partial<Task>);
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(null);
        }}
        placeholder='Type a name and blur to save'
      />
    );
  };
  const status = statuses?.find(
    (statusItem) => statusItem.id === Number(localTask.statusId)
  )?.name;

  return (
    <>
      <Drawer open={open} dismissible={true} onOpenChange={setOpen}>
        <DrawerContent className='!h-[95vh] !max-h-[95vh] !flex'>
          <div className=' !flex'>
            <div className='mx-auto w-[60%]  p-6'>
              <DrawerHeader>
                <div className='flex items-start justify-between gap-4 w-full'>
                  <div>
                    <DrawerTitle className='flex items-center gap-3'>
                      <div
                        className='mt-2 rounded-md border p-2 bg-muted/5 cursor-pointer'
                        onDoubleClick={() => setEditing('name')}
                      >
                        {editing === 'name' ? (
                          <InlineText field='name' />
                        ) : (
                          <div className='font-medium'>{localTask.name}</div>
                        )}
                      </div>
                      {priorityBadge(task.priority)}
                    </DrawerTitle>
                    <DrawerDescription className='mt-1'>
                      Created: {fmt(task.createdAt)}
                    </DrawerDescription>
                  </div>

                  <div className='flex items-center gap-2'>
                    {task.assignee ? (
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback>
                            {task.assignee.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='text-sm'>
                          <div className='font-medium'>
                            {task.assignee.name}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            Assignee
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='text-sm text-muted-foreground'>
                        Unassigned
                      </div>
                    )}
                  </div>
                </div>
              </DrawerHeader>

              <div className='mt-4 space-y-4 text-sm'>
                <section>
                  <Label>Description</Label>
                  <div
                    className='mt-2 rounded-md border p-4 bg-muted/5 cursor-pointer'
                    onDoubleClick={() => setEditing('description')}
                  >
                    {editing === 'description' ? (
                      <InlineText field='description' singleLine={false} />
                    ) : (
                      <div className='text-sm text-muted-foreground'>
                        {localTask.description ?? 'No description'}
                      </div>
                    )}
                  </div>
                </section>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label>Status</Label>
                    <div
                      className='mt-1'
                      onDoubleClick={() => setEditing('statusId')}
                    >
                      {editing === 'statusId' ? (
                        <InlineSelectStatus />
                      ) : (
                        <div className='font-medium'>{status ?? 'Open'}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <div
                      className='mt-1'
                      onDoubleClick={() => setEditing('priority')}
                    >
                      {editing === 'priority' ? (
                        <InlineSelectPriority />
                      ) : (
                        <div className='font-medium'>
                          {localTask.priority ?? 'Medium'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Due date</Label>
                    <div
                      className='mt-1'
                      onDoubleClick={() => setEditing('dueDate')}
                    >
                      {editing === 'dueDate' ? (
                        <InlineDateTime field='dueDate' />
                      ) : (
                        <div className='font-medium'>
                          {fmt(localTask.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Assigned to</Label>
                    <div
                      className='mt-1'
                      onDoubleClick={() => setEditing('assignee')}
                    >
                      {editing === 'assignee' ? (
                        <InlinePerson field='assignee' />
                      ) : (
                        <div className='font-medium'>
                          {localTask.assignee?.name ?? '—'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {!task.parentTaskId && (
                  <section>
                    <Label>Subtasks</Label>

                    <div className='mt-2 space-y-2'>
                      {/* Subtask List */}
                      {task.subTasks && task.subTasks.length ? (
                        <ul className='list-none space-y-1'>
                          {task.subTasks.map((s) => (
                            <li
                              key={s.id}
                              className='flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer'
                              onClick={() =>
                                onSubTaskClick && onSubTaskClick(s)
                              }
                            >
                              <div className='text-sm'>{s.name}</div>
                              <div className='text-xs text-muted-foreground'>
                                ID {s.id}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className='text-muted-foreground'>No subtasks</div>
                      )}

                      {/* ADD NEW SUBTASK INPUT - reuse shadcn Input */}
                      <div className='flex items-center gap-2 pt-2'>
                        <Input
                          placeholder='Add a subtask'
                          // controlled externally in original component — consumer can wire this in
                        />
                        <Button className='h-9'>+</Button>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <DrawerFooter>
                <div className='flex items-center gap-2 ml-auto'>
                  {onEdit && (
                    <Button onClick={() => onEdit(task)} variant='outline'>
                      Edit
                    </Button>
                  )}
                  <DrawerClose asChild>
                    <Button variant='secondary' onClick={() => setOpen(false)}>
                      Close
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </div>
            <div className='mx-auto w-[40%] p-6'>
              <ActivityComp
                activities={activities}
                setActivities={setActivities}
                {...rest}
                userId={rest.userId!}
                taskId={task.id}
                // activities props remain controlled by consumer
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
