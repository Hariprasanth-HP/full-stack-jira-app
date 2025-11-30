"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import CommentComp from "./comment-section";
import { useFetchcommentsFromTask } from "@/lib/api/comment";
import { useCreatetask } from "@/lib/api/task";

type Task = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string | Date;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | Date | null;
  parentTaskId?: number | null;
  // optionally pass populated relations
  project?: { id: number; name: string };
  projectId?: number;
  list?: { id: number; name: string } | null;
  assignedBy?: { id: number; name: string; initials?: string } | null;
  assignee?: { id: number; name: string; initials?: string } | null;
  subTasks?: { id: number; name: string }[];
};

export function DrawerInfo({
  open,
  setOpen,
  task,
  onEdit,
  onSubTaskClick,
  subTask,
  subTaskOpen,
  setSubTaskOpen,
  type,
  setTask,
  setSubTask,
  settaskForTableState,
  ...rest
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  task?: Task | null;
  onEdit?: (task: Task) => void;
}) {
  if (!task) {
    // simple placeholder when no task provided
    return (
      <Drawer open={open}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg p-6">
            <DrawerHeader>
              <DrawerTitle>No task selected</DrawerTitle>
              <DrawerDescription>
                Select a task to view more details.
              </DrawerDescription>
            </DrawerHeader>

            <div className="py-6 text-sm text-muted-foreground">
              No information available.
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  const fmt = (d?: string | Date | null) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleString();
  };

  const priorityBadge = (p?: Task["priority"]) => {
    switch (p) {
      case "HIGH":
        return <Badge variant="destructive">High</Badge>;
      case "LOW":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge>Medium</Badge>;
    }
  };
  const fetchComment = useFetchcommentsFromTask();
  const [comments, setComments] = React.useState<any[]>([]);
  const fetchComments = async () => {
    try {
      const { data } = await fetchComment.mutateAsync?.({
        taskId: task?.id!,
      });
      setComments(data);
      console.log("comments", data);
    } catch (error) {}
  };
  console.log("tasktask", task);
  React.useEffect(() => {
    fetchComments();
  }, [task]);
  const createTask = useCreatetask();
  const [newSubTaskName, setNewSubTaskName] = React.useState("");
  const [subTaskEror, setSubTaskEror] = React.useState("");
  async function onAddSubTask(name) {
    // Make API call here
    if (!name.trim()) {
      setSubTaskEror("Subtask name cannot be empty");
      return;
    }
    const { data } = await createTask.mutateAsync({
      name: name.trim(),
      description: "",
      projectId: task?.projectId!,
      parentTaskId: task?.id!,
    });
    if (data) {
      setTask((prev) => ({
        ...prev,
        subTasks: [...prev.subTasks, data],
      }));
      settaskForTableState((prev) => {
        return prev.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              subTasks: [...t.subTasks, data],
            };
          }
          return t;
        });
      });
      setSubTaskEror("");
    }
    // Update task state
  }
  console.log("taskkkk", task);

  return (
    <>
      <Drawer open={open} dismissible={true} onOpenChange={setOpen}>
        <DrawerContent className="!h-[95vh] !max-h-[95vh] !flex">
          <div className=" !flex">
            <div className="mx-auto w-[60%]  p-6">
              <DrawerHeader>
                <div className="flex items-start justify-between gap-4 w-full">
                  <div>
                    <DrawerTitle className="flex items-center gap-3">
                      <span className="text-lg font-semibold">{task.name}</span>
                      {priorityBadge(task.priority)}
                    </DrawerTitle>
                    <DrawerDescription className="mt-1">
                      Created: {fmt(task.createdAt)}
                    </DrawerDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {task.assignee.initials ??
                              task.assignee.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <div className="font-medium">
                            {task.assignee.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Assignee
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Unassigned
                      </div>
                    )}
                  </div>
                </div>
              </DrawerHeader>

              <div className="mt-4 space-y-4 text-sm">
                <section>
                  <Label>Summary</Label>
                  <div className="mt-2 rounded-md border p-4 bg-muted/5">
                    {task.description ?? (
                      <span className="text-muted-foreground">
                        No description
                      </span>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Due date</Label>
                    <div className="mt-1 font-medium">{fmt(task.dueDate)}</div>
                  </div>

                  <div>
                    <Label>Project</Label>
                    <div className="mt-1 font-medium">
                      {task.project?.name ??
                        `Project ID ${task.projectId ?? "—"}`}
                    </div>
                  </div>

                  <div>
                    <Label>List</Label>
                    <div className="mt-1 font-medium">
                      {task.list?.name ?? "—"}
                    </div>
                  </div>

                  <div>
                    <Label>Parent task</Label>
                    <div className="mt-1 font-medium">
                      {task.parentTaskId ? `Task ID ${task.parentTaskId}` : "—"}
                    </div>
                  </div>

                  <div>
                    <Label>Assigned by</Label>
                    <div className="mt-1 font-medium">
                      {task.assignedBy ? task.assignedBy.name : "—"}
                    </div>
                  </div>

                  <div>
                    <Label>Created at</Label>
                    <div className="mt-1 font-medium">
                      {fmt(task.createdAt)}
                    </div>
                  </div>
                </div>

                <Separator />

                {!task.parentTaskId && (
                  <section>
                    <Label>Subtasks</Label>

                    <div className="mt-2 space-y-2">
                      {/* Subtask List */}
                      {task.subTasks && task.subTasks.length ? (
                        <ul className="list-none space-y-1">
                          {task.subTasks.map((s) => (
                            <li
                              key={s.id}
                              className="flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer"
                              onClick={() => onSubTaskClick(s)}
                            >
                              <div className="text-sm">{s.name}</div>
                              <div className="text-xs text-muted-foreground">
                                ID {s.id}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-muted-foreground">No subtasks</div>
                      )}

                      {/* ADD NEW SUBTASK INPUT */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={newSubTaskName}
                          onChange={(e) => setNewSubTaskName(e.target.value)}
                          placeholder="Add a subtask"
                          className="flex-1 rounded-md border px-3 py-2 text-sm"
                        />
                        {subTaskEror && (
                          <p className="text-sm text-destructive">
                            {subTaskEror}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            if (newSubTaskName.trim()) {
                              onAddSubTask(newSubTaskName); // ⬅️ API call handler
                              setNewSubTaskName(""); // clear input
                            }
                          }}
                          className="rounded-md border px-3 py-2 hover:bg-accent"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <DrawerFooter>
                <div className="flex items-center gap-2 ml-auto">
                  {onEdit && (
                    <Button onClick={() => onEdit(task)} variant="outline">
                      Edit
                    </Button>
                  )}
                  <DrawerClose asChild>
                    <Button variant="secondary" onClick={() => setOpen(false)}>
                      Close
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </div>
            <div className="mx-auto w-[40%] p-6">
              <CommentComp
                {...rest}
                taskId={task.id}
                comments={comments}
                setComments={setComments}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <DrawerInfo
        type="sub"
        open={subTaskOpen}
        setOpen={setSubTaskOpen}
        task={subTask}
        setTask={setSubTask}
        onSubTaskClick={onSubTaskClick}
        userId={rest.userId}
        taskId={rest.taskId}
        parentId={rest.parentTaskId}
      />
    </>
  );
}
