import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldGroup, FieldLabel } from "./ui/field";

/** Types */
type Project = { id: number; name: string; short?: string };
type ListItem = { id: number; name: string };
type User = { id: number; name: string; initials?: string };
type Tag = { id: number; name: string };

type FormData = {
  generatedPrompt: string;
  taskName: string;
  description: string;
  projectId: number | null;
  listId: number | null;
  status: string;
  startDate: string | null; // ISO date
  dueDate: string | null; // ISO date
  tagIds: number[]; // multi-select
  assigneeIds: number[]; // multi-select
  addAtTop: boolean;
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
  statuses = ["To Do", "In Progress", "Done"],
  tags = [
    { id: 1, name: "Bug" },
    { id: 2, name: "High Priority" },
  ],
  assignees = [
    { id: 1, name: "Alice", initials: "A" },
    { id: 2, name: "Bob", initials: "B" },
  ],
}: {
  projects?: Project[];
  lists?: ListItem[];
  statuses?: string[];
  tags?: Tag[];
  assignees?: User[];
}) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    generatedPrompt: "",
    taskName: "",
    description: "",
    projectId: projects[0]?.id ?? null,
    listId: lists[0]?.id ?? null,
    status: statuses[0] ?? "To Do",
    startDate: null,
    dueDate: null,
    tagIds: [],
    assigneeIds: [],
    addAtTop: false,
  });

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((s) => ({ ...s, [key]: value }));
  };

  const toggleInArray = (arrKey: "tagIds" | "assigneeIds", id: number) => {
    setFormData((s) => {
      const arr = s[arrKey];
      const present = arr.includes(id);
      return {
        ...s,
        [arrKey]: present ? arr.filter((x) => x !== id) : [...arr, id],
      } as FormData;
    });
  };

  const handleGenerate = async () => {
    // Example: generate description using AI (stubbed)
    setGenerating(true);
    try {
      // stub: pretend fetch
      await new Promise((r) => setTimeout(r, 900));
      const gen = `Generated task details for prompt: ${
        formData.generatedPrompt || "quick task"
      } `;
      update("description", gen);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Replace with your API call
      // await api.createTask(formData)
      console.log("Captured form data:", formData);

      // show simple success or reset
      // reset form or keep values
      // setFormData(initialState) // if you want to clear
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-card p-6 rounded-md text-card-foreground overflow-auto"
    >
      <FieldGroup>
        {/* Task Name */}
        <Field>
          <FieldLabel htmlFor="task-name">Task Name *</FieldLabel>
          <Input
            id="task-name"
            placeholder="Give your task a name"
            value={formData.taskName}
            onChange={(e) => update("taskName", e.target.value)}
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
            value={formData.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          {/* Project */}
          <Field>
            <FieldLabel htmlFor="project">Project *</FieldLabel>
            <Select
              value={
                formData.projectId ? String(formData.projectId) : undefined
              }
              onValueChange={(v) => update("projectId", v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback>
                          {p.short ?? p.name.slice(0, 2)}
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
            <FieldLabel htmlFor="list">List *</FieldLabel>
            <Select
              value={formData.listId ? String(formData.listId) : undefined}
              onValueChange={(v) => update("listId", v ? Number(v) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select list" />
              </SelectTrigger>
              <SelectContent>
                {lists.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Status */}
          <Field>
            <FieldLabel htmlFor="status">Status *</FieldLabel>
            <Select
              value={formData.status}
              onValueChange={(v) => update("status", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="start-date">Start date</FieldLabel>
            <Input
              id="start-date"
              type="date"
              value={formData.startDate ?? ""}
              onChange={(e) => update("startDate", e.target.value || null)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="due-date">Due date</FieldLabel>
            <Input
              id="due-date"
              type="date"
              value={formData.dueDate ?? ""}
              onChange={(e) => update("dueDate", e.target.value || null)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Tags</FieldLabel>
            <div className="flex gap-2 flex-wrap mt-2">
              {tags.map((t) => {
                const active = formData.tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`px-3 py-1 rounded-md text-sm border ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent"
                    }`}
                    onClick={() => toggleInArray("tagIds", t.id)}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field>
            <FieldLabel>Assignees</FieldLabel>
            <div className="flex gap-2 flex-wrap mt-2">
              {assignees.map((u) => {
                const active = formData.assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm border ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-transparent"
                    }`}
                    onClick={() => toggleInArray("assigneeIds", u.id)}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback>
                        {u.initials ?? u.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </FieldGroup>
    </form>
  );
}
