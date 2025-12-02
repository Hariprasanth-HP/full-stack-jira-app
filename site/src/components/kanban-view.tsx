"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdatetask } from "@/lib/api/task";
import { toast } from "sonner";
import { Edit2Icon } from "lucide-react";
import CreateStatusForm from "./create-status-form";
import { ProjectDialog } from "./project-form";
import { Button } from "./ui/button";

/**
 * Types (mirror your Prisma schema shape; adapt if your real payload differs)
 */
export type TaskStatus = {
  id: number;
  name: string;
  color?: string | null;
  sortOrder?: number | null;
  createdAt?: string | Date;
  projectId?: number;
};

export type User = {
  id: number;
  name: string;
  image?: string | null;
};

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Task = {
  id: number;
  name: string;
  description?: string;
  createdAt?: string | Date;
  priority?: Priority;
  dueDate?: string | Date | null;
  parentTaskId?: number | null;
  projectId?: number;
  listId?: number | null;
  assignedById?: number | null;
  assignedBy?: User | null;
  assigneeId?: number | null;
  assignee?: User | null;
  comments?: any[];
  statusId?: number | null;
};

/**
 * Props for the Kanban component
 */
type Props = {
  projectId?: number;
  statuses: TaskStatus[]; // TaskStatus rows for the project
  tasks: Task[]; // Task rows for the project
  /**
   * onChange will be called when the Kanban data changes (for example: card moved to another column).
   * It receives the updated Task[] (with statusId updated) so you can persist changes to your backend.
   */
  onChange?: (updatedTasks: Task[]) => void;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/**
 * KanbanFromData - uses provided statuses & tasks (no faker)
 */
export default function KanbanFromData({
  statuses,
  tasks,
  onChange,
  open,
  task,
  setTask,
  setOpen,
}: Props) {
  // Keep a local copy so the Kanban library can mutate / reorder; synchronize when props change.
  const [localTasks, setLocalTasks] = useState<Task[]>(() => tasks ?? []);

  // sync when parent provides new tasks
  // -- in your useEffect (normalize incoming tasks)
  useEffect(() => {
    setLocalTasks(
      (tasks ?? []).map((t) => ({
        ...t,
        // prefix the task id so it can't be mistaken for a column id
        id: `task-${t.id}`,
        // don't call String() on null/undefined — keep column null if no status
        statusId: t.statusId == null ? null : `status-${t.statusId}`,
        column: t.statusId == null ? null : `status-${t.statusId}`,
      }))
    );
  }, [tasks]);

  // -- build columns with matching prefixed ids
  console.log("statuses", statuses);

  const [columnData, setColumnData] = useState([]);

  useEffect(() => {
    if (statuses) {
      setColumnData(statuses);
    }
  }, [statuses]);
  const columns = useMemo(
    () =>
      columnData?.map((s) => ({
        id: `status-${s.id}`, // << prefix here
        name: s.name,
        color: s.color ?? "#6B7280",
      })),
    [columnData, statuses]
  );
  const [selectedColumn, setSelectedColumn] = useState(undefined);
  console.log("kanbanData", localTasks);
  const updateTask = useUpdatetask();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const parseTaskId = (pref: string | number) =>
    typeof pref === "string" && pref.startsWith("task-")
      ? Number(pref.replace(/^task-/, ""))
      : Number(pref);

  const parseStatusId = (col: string | number | null) =>
    col == null
      ? null
      : typeof col === "string" && col.startsWith("status-")
      ? Number(col.replace(/^status-/, ""))
      : Number(col);
  const isDraggingRef = React.useRef(false);
  return (
    <>
      <KanbanProvider
        columns={columns}
        data={localTasks}
        onDataChange={async (newData: any[]) => {
          try {
            // Map newData -> numeric mapped tasks (same as earlier mapping)
            const mapped: Task[] = newData.map((d) => {
              const parsedId = parseTaskId(d.id);
              const parsedStatusId = parseStatusId(d.column ?? null);
              const existing = localTasks.find((t) =>
                typeof t.id === "string"
                  ? t.id === d.id
                  : Number(t.id) === parsedId
              );
              return {
                id: parsedId,
                name: d.name ?? existing?.name ?? "Untitled",
                description: existing?.description ?? d.description ?? "",
                createdAt: existing?.createdAt ?? d.createdAt ?? new Date(),
                priority: (existing?.priority ??
                  d.priority ??
                  "MEDIUM") as Priority,
                dueDate: existing?.dueDate ?? d.dueDate ?? null,
                parentTaskId: existing?.parentTaskId ?? null,
                projectId: existing?.projectId ?? undefined,
                listId: existing?.listId ?? null,
                assignedById: existing?.assignedById ?? null,
                assignedBy: existing?.assignedBy ?? null,
                assigneeId: existing?.assigneeId ?? null,
                assignee: existing?.assignee ?? null,
                comments: existing?.comments ?? [],
                statusId: parsedStatusId,
              } as Task;
            });

            // 1) Set local UI immediately (prefixed form for Kanban)
            const localized = mapped.map((t) => ({
              ...t,
              id: `task-${t.id}`,
              column: t.statusId == null ? null : `status-${t.statusId}`,
              statusId: t.statusId == null ? null : `status-${t.statusId}`,
            }));
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
              const prevStatus = prevMap.get(t.id) ?? null;
              const newStatus = t.statusId ?? null;
              if (prevStatus === newStatus) continue;
              console.log("prevStatusprevStatus", prevStatus, newStatus, t);

              setTimeout(async () => {
                const { data } = await updateTask.mutateAsync(t);
                if (data) {
                  toast.success("Updated Successfully");
                  onChange?.(mapped);
                } else {
                  console.error("[onDataChange] failed to persist task move", {
                    taskId: t.id,
                    err,
                  });
                  // rollback this task in localTasks: restore prevStatus
                  setLocalTasks((cur) =>
                    cur.map((lt) => {
                      const numeric = parseTaskId(lt.id);
                      if (numeric !== t.id) return lt;
                      return {
                        ...lt,
                        column:
                          prevStatus == null ? null : `status-${prevStatus}`,
                        statusId:
                          prevStatus == null ? null : `status-${prevStatus}`,
                      };
                    })
                  );
                  // show user feedback (replace with your toast/snackbar)
                  alert(
                    `Failed to move "${t.name}". Changes reverted. (${err.message})`
                  );
                }
              }, 1000); // yield to avoid blocking UI
            }

            // 3) Notify parent with canonical numeric tasks (mapped)
          } catch (err) {
            console.error("[onDataChange] mapping error", { err, newData });
          }
          setOpen(false);
        }}
      >
        {(column: { id: string; name: string; color?: string }) => (
          <KanbanBoard id={column.id} key={column.id}>
            <KanbanHeader>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span>{column.name}</span>
                <Edit2Icon
                  onClick={() => {
                    setShowStatusDialog(true);
                    setSelectedColumn({
                      ...column,
                      id: parseStatusId(column.id),
                    });
                  }}
                  className="w-4 ml-auto h-4 text-muted-foreground opacity-10 hover:opacity-100 transition-opacity"
                />
              </div>
            </KanbanHeader>

            <KanbanCards id={column.id}>
              {(task: Task & { column?: string }) => {
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
                    id={task.id}
                    key={task.id}
                    name={task.name}
                    onCardClick={(e) => {
                      e.stopPropagation(); // <- prevent parent handlers from stealing the click
                      setTask({ ...task, id: parseTaskId(task.id) });
                      setOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 ">
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="m-0 flex-1 font-medium text-sm truncate">
                          {task.name}
                        </p>
                        {task.description && (
                          <p className="m-0 text-xs text-muted-foreground truncate">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-1 flex items-center gap-2">
                          {task.priority && (
                            <span className="rounded-md px-2 py-0.5 text-[10px] font-medium border">
                              {task.priority}
                            </span>
                          )}
                          {dueDate && (
                            <span className="text-[11px] text-muted-foreground">
                              Due {shortDateFormatter.format(dueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {task.assignee && (
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={task.assignee.image ?? undefined} />
                          <AvatarFallback>
                            {task.assignee.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    <p className="m-0 text-muted-foreground text-xs mt-2">
                      {createdAt
                        ? `Created: ${shortDateFormatter.format(createdAt)}`
                        : "Created: —"}{" "}
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
        OnCancel={() => setShowStatusDialog(false)}
      />
    </>
  );
}
