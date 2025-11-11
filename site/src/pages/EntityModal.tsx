import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EntityType = "epic" | "story" | "task" | "bug";

export type FormDataShape = {
  name: string;
  description: string;
  creator: string; // required
  priority: Priority;
  dueDate: string | null; // ISO date string or null (YYYY-MM-DD for input)
  createdAt?: string | null; // readonly display (ISO string)
};

export type EntityModalSingleStateProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: EntityType;
  mode?: "create" | "edit";
  initial?: Partial<FormDataShape> & { id?: number | string };
  context?: {
    projectId?: number | string;
    epicId?: number | string;
    storyId?: number | string;
  };
  onSubmit?: (payload: FormDataShape) => Promise<any> | any;
  onUpdate?: (
    id: string | number,
    payload: FormDataShape
  ) => Promise<any> | any;
  onSuccess?: (res?: any) => void;
};

export default function EntityModalSingleState({
  open,
  onOpenChange,
  type,
  mode = "create",
  initial,
  context,
  onSubmit,
  onUpdate,
  onSuccess,
}: EntityModalSingleStateProps) {
  const emptyState: FormDataShape = {
    name: "",
    description: "",
    creator: "",
    priority: "MEDIUM",
    dueDate: null,
    createdAt: null,
  };

  const [form, setForm] = useState<FormDataShape>({ ...emptyState });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sync initial values into single state when modal opens or initial changes
  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        creator: initial?.creator ?? "",
        priority: (initial?.priority as Priority) ?? "MEDIUM",
        dueDate: initial?.dueDate ? initial.dueDate.split("T")[0] : null,
        createdAt: initial?.createdAt ?? null,
      });
      setError(null);
    }
  }, [open, initial]);

  // single-field updater
  const setField = <K extends keyof FormDataShape>(
    key: K,
    value: FormDataShape[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  // simple validation
  function validate() {
    if (!form.creator?.trim()) return "Creator is required";
    if (!form.name?.trim()) return "Name is required";
    return null;
  }

  // parent handlers expected to handle server calls (create/update)
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    // prepare payload; convert date to ISO or null
    const payload: FormDataShape = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : null,
    };

    try {
      setSubmitting(true);
      let result;
      if (mode === "create") {
        if (!onSubmit) throw new Error("onSubmit handler required for create");
        result = await onSubmit({ ...payload });
      } else {
        const id = (initial as any)?.id;
        if (!id) throw new Error("initial.id required for update mode");
        if (!onUpdate) throw new Error("onUpdate handler required for edit");
        result = await onUpdate(id, { ...payload });
      }
      onOpenChange(false);
      onSuccess?.(result);
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? `Create ${type}` : `Edit ${type}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="grid gap-3">
          {/* Creator (required) */}
          <div>
            <label className="text-sm mb-1 block">Creator *</label>
            <Input
              value={form.creator}
              onChange={(e) => setField("creator", e.target.value)}
              placeholder="Creator (required)"
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm mb-1 block">Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder={`${type} name`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm mb-1 block">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Description (optional)"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm mb-1 block">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setField("priority", e.target.value as Priority)}
              className="w-full input"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Due date */}
          <div>
            <label className="text-sm mb-1 block">Due date</label>
            <input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => setField("dueDate", e.target.value ?? null)}
              className="w-full input"
            />
          </div>

          {/* CreatedAt (read-only in edit mode) */}
          {mode === "edit" && form.createdAt && (
            <div>
              <label className="text-sm mb-1 block">Created at</label>
              <Input
                value={new Date(form.createdAt).toLocaleString()}
                readOnly
              />
            </div>
          )}

          {error && <div className="text-destructive text-sm">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
