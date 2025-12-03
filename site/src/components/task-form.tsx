import React, { useContext, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { SideBarContext } from "@/contexts/sidebar-context";
import { useCreatetask, useUpdatetask } from "@/lib/api/task";
import { toast } from "sonner";
import { useFetchlistsFromProject } from "@/lib/api/list";
import { useAppSelector } from "@/hooks/useAuth";
import { useGenerateResults } from "@/lib/api/generate";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Label } from "recharts";

/** Types */
type Project = { id: number; name: string; short?: string };
type ListItem = { id: number; name: string };
type User = { id: number; name: string; initials?: string };
type TaskRef = { id: number; name: string };

// Matches the Prisma schema fields for Task
type FormData = {
  name: string; // maps to Task.name
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null; // ISO date string
  parentTaskId: number | null;
  projectId: number;
  listId: number | null;
  assignedById: number | null;
  assigneeId: number | null;
};
export default function AddTaskForm({
  projects = [
    { id: 1, name: "Demo Project", short: "DP" },
    { id: 2, name: "Website Redesign", short: "WR" },
  ],
  lists = [
    { id: 1, name: "Untitled List" },
    { id: 2, name: "Backlog" },
  ],
  parentTasks = [],
  setTaskData,
  taskData = {},
  setShowTaskDialog,
  type,
  status,
}: {
  projects?: Project[];
  lists?: ListItem[];
  parentTasks?: TaskRef[]; // optional list of tasks to choose a parent from
  setTaskData?: (d: any) => void;
  taskData?: Partial<FormData>;
  setShowTaskDialog?: () => void;
}) {
  const auth = useAppSelector((s) => s.auth);

  const [loading, setLoading] = useState(false);
  const {
    usersList,
    projectsState,
    listForTable,
    settaskForTableState,
    selectedProject,
    statuses,
  } = useContext(SideBarContext);
  const [listState, setListState] = useState(() => listForTable);
  const [selectedStatusId, setSelectedStatusId] = useState(
    statuses.length > 0 ? () => statuses?.[0] : undefined
  );
  const initialFormData = useMemo(() => {
    return {
      name: "",
      description: null,
      priority: "MEDIUM",
      dueDate: null,
      parentTaskId: null,
      projectId: selectedProject?.id ?? null,
      listId: null,
      assignedById: auth?.user?.id ?? null,
      assigneeId: null,
      statusId: status?.id ?? selectedStatusId?.id ?? null,
    };
  }, [selectedProject?.id, auth?.user?.id, selectedStatusId?.id, status]);
  const fetchList = useFetchlistsFromProject();
  const [formData, setFormData] = useState<FormData>(
    Object.keys(taskData).length > 0
      ? ({
          name: (taskData as any).name ?? "",
          id: (taskData as any).id ?? "",
          description: (taskData as any).description ?? null,
          priority: (taskData as any).priority ?? "MEDIUM",
          dueDate: (taskData as any).dueDate ?? null,
          parentTaskId: (taskData as any).parentTaskId ?? null,
          projectId: (taskData as any).projectId ?? projects[0]?.id ?? 1,
          listId: (taskData as any).listId ?? lists[0]?.id ?? null,
          assignedById: (taskData as any).assignedById ?? null,
          assigneeId: (taskData as any).assigneeId ?? null,
          statusId: (taskData as any).statusId ?? null,
        } as FormData)
      : initialFormData
  );
  const update = async <K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) => {
    if (key === "projectId") {
      const { data } = await fetchList.mutateAsync({ projectId: value });
      setListState(data ?? []);
    }
    setFormData((s) => ({ ...s, [key]: value }));
  };
  const createTask = useCreatetask();
  const updateTask = useUpdatetask();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // send payload matching the Prisma Task schema
      const payload = {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate,
        parentTaskId: formData.parentTaskId,
        projectId: formData.projectId,
        listId: formData.listId,
        assignedById: formData.assignedById,
        assigneeId: formData.assigneeId,
        statusId: formData.statusId,
      };
      if (type === "edit" && formData && (formData as any).id) {
        const { data } = await updateTask.mutateAsync(formData);
        if (data) {
          toast.success("Updated Successfully");
          setFormData(initialFormData);
          settaskForTableState((prev) => {
            if (data.parentTaskId) {
              return {
                ...prev,
                subTasks: prev.subTasks.map((t) =>
                  t.id === data.id ? data : t
                ),
              };
            }
            return prev.map((t) => (t.id === data.id ? data : t));
          });
          setShowTaskDialog && setShowTaskDialog(false);
        }
      } else {
        const { data } = await createTask.mutateAsync(payload);
        if (data) {
          toast.success("Task created");
          settaskForTableState((prev) => [...prev, data]);
          setFormData(initialFormData);
          setShowTaskDialog && setShowTaskDialog(false);
        }
      }
    } catch (err) {
      console.error("Submit error", err);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };
  console.log("formDataformData", status, formData, initialFormData, statuses);
  const [generativeDes, setGenerativeDes] = useState("");
  const [generatedResult, setGeneratedResult] = useState("");

  const generateData = useGenerateResults(); // mutation
  const isLoading = generateData.isPending; // track API loading state

  const handleGenerate = async () => {
    try {
      const { data } = await generateData.mutateAsync({
        prompt: generativeDes,
      });

      // Back-end returns: { ok, model, text }
      const resultText = data?.text || "";

      setGeneratedResult(resultText);
      setFormData((prev) => {
        return {
          ...prev,
          description: resultText,
        };
      });
    } catch (err) {
      console.error("Error generating:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-card p-6 rounded-md text-card-foreground overflow-auto"
    >
      <FieldGroup>
        {/* Task Name */}

        <div className="space-y-4">
          <Label htmlFor="task-generative-overview">Task Details</Label>

          <div className="flex gap-2">
            <Input
              id="task-generative-overview"
              placeholder="Give your task details"
              value={generativeDes}
              onChange={(e) => setGenerativeDes(e.target.value)}
              className="flex-1"
            />

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!generativeDes || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>

          {generatedResult && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Generated Result</h3>
                <p className="text-sm">{generatedResult}</p>
              </CardContent>
            </Card>
          )}
        </div>
        <Field>
          <FieldLabel htmlFor="task-name">Task Name *</FieldLabel>
          <Input
            id="task-name"
            placeholder="Give your task a name"
            value={formData.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </Field>
        {/* Description */}
        <Field>
          <FieldLabel htmlFor="description">Task Description</FieldLabel>
          <Textarea
            id="description"
            placeholder="About this task..."
            rows={5}
            value={formData.description ?? ""}
            onChange={(e) => update("description", e.target.value || null)}
          />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          {/* Project */}
          <Field>
            <FieldLabel htmlFor="project">Project *</FieldLabel>
            <Select
              value={String(formData.projectId)}
              onValueChange={(v) => update("projectId", Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projectsState.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback>
                          {p?.short ?? p.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* List */}
          <Field>
            <FieldLabel htmlFor="list">List</FieldLabel>
            <Select
              value={formData.listId ? String(formData.listId) : null}
              onValueChange={(v) => update("listId", v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select list" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key={"untitled_List"} value={null}>
                  Untitled List
                </SelectItem>
                {listState.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="statusId">Status</FieldLabel>
            <Select
              value={formData.statusId ? String(formData.statusId) : null}
              onValueChange={(v) => update("statusId", v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select statusId" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {/* Priority */}
          <Field>
            <FieldLabel htmlFor="priority">Priority *</FieldLabel>
            <Select
              value={formData.priority}
              onValueChange={(v) =>
                update("priority", v as FormData["priority"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="due-date">Due date</FieldLabel>
            <Input
              id="due-date"
              type="date"
              value={formData.dueDate ?? ""}
              onChange={(e) => update("dueDate", e.target.value || null)}
            />
          </Field>

          <Field>
            <FieldLabel>Parent task</FieldLabel>
            <Select
              value={
                formData.parentTaskId
                  ? String(formData.parentTaskId)
                  : undefined
              }
              onValueChange={(v) =>
                update("parentTaskId", v ? Number(v) : null)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select parent task (optional)" />
              </SelectTrigger>
              <SelectContent>
                {parentTasks.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Assignee</FieldLabel>
            <Select
              value={
                formData.assigneeId ? String(formData.assigneeId) : undefined
              }
              onValueChange={(v) => update("assigneeId", v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {usersList.map((u: User) => (
                  <SelectItem key={u.userId} value={String(u.userId)}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback>
                          {u?.initials ?? u.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{u.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Assigned By</FieldLabel>
            <p>{auth.user.name}</p>
          </Field>
        </div>
        <div className="flex flex-row w-[100%] justify-end">
          <Button type="submit" disabled={loading}>
            {loading
              ? type === "edit"
                ? "Updating"
                : "Creating"
              : type === "edit"
              ? "Update"
              : "Create"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
