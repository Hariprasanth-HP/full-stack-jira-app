import React, { useContext, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useCreateStatus, useStatuses } from "@/lib/api/status";
import { useAppSelector } from "@/hooks/useAuth";
import { SideBarContext } from "@/contexts/sidebar-context";

export default function CreateStatusForm({
  onCancel,
  onSuccess,
}: {
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const { statuses } = useContext(SideBarContext);
  const auth = useAppSelector((s) => s.auth);
  const projectId = auth?.userProject?.id;
  const [formData, setFormData] = useState({
    name: "",
    color: "#0ea5e9",
    sortOrder: null as number | null,
  });

  const [error, setError] = useState("");
  const createStatus = useCreateStatus(projectId);

  // compute next sort order
  const nextSortOrder = React.useMemo(() => {
    if (!statuses || statuses.length === 0) return 0;

    const orders = statuses
      .map((s: any) => s.sortOrder)
      .filter((v: any) => typeof v === "number");

    if (orders.length === 0) return statuses.length;
    return Math.max(...orders) + 1;
  }, [statuses]);

  // single updater
  const update = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Status name is required.");
      return;
    }

    try {
      await createStatus.mutateAsync({
        name: formData.name.trim(),
        color: formData.color,
        sortOrder: nextSortOrder,
      });

      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? "Failed to create status.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl bg-card text-card-foreground rounded-md shadow-sm"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-center">Create Status</h3>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="status-name" className="text-sm font-medium">
            Status name
          </label>

          <Input
            id="status-name"
            placeholder="e.g., Development, QA, Done"
            value={formData.name}
            onChange={(e) => update("name", e.target.value)}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <label htmlFor="status-color" className="text-sm font-medium">
            Status color
          </label>

          <input
            type="color"
            id="status-color"
            value={formData.color}
            onChange={(e) => update("color", e.target.value)}
            className="h-10 w-16 rounded-md border cursor-pointer"
          />
        </div>

        {/* Sort Order (Automatic) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Sort Order (Auto-generated)
          </label>

          <Input
            value={nextSortOrder}
            disabled
            className="opacity-70 cursor-not-allowed"
          />
        </div>
      </div>

      <Separator />

      {/* Footer */}
      <div className="px-6 py-4 flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          onClick={onCancel}
          type="button"
          disabled={createStatus.isPending}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={createStatus.isPending}>
          {createStatus.isPending && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          Create
        </Button>
      </div>
    </form>
  );
}
