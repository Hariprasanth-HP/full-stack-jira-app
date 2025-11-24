import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Loader2 } from "lucide-react";

export function ProjectDialog({ onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation errors for each field
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {}
  );
  // General server / submit error
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    else if (name.trim().length > 50)
      newErrors.name = "Name must be 50 characters or less.";

    if (description && description.length > 400)
      newErrors.description = "Description must be 400 characters or less.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setLoading(true);
    try {
      // allow caller to throw for server-side errors
      (await onSubmit?.({
        name: name.trim(),
        description: description.trim(),
      })) ?? Promise.resolve();
      setSuccessMessage("Saved successfully.");
      // optional: clear form after success
      setName("");
      setDescription("");
    } catch (err: any) {
      // err could be an Error or a plain object from fetch
      const message =
        err?.message ||
        (typeof err === "string"
          ? err
          : "An unexpected error occurred. Please try again.");
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  // Clear related errors on change
  const handleNameChange = (v: string) => {
    setName(v);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
    if (serverError) setServerError(null);
  };
  const handleDescriptionChange = (v: string) => {
    setDescription(v);
    if (errors.description)
      setErrors((prev) => ({ ...prev, description: undefined }));
    if (serverError) setServerError(null);
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create your project here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6">
          {/* server / submit error */}
          {serverError && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-destructive">
              {serverError}
            </div>
          )}

          {successMessage && (
            <div className="rounded-md border border-success/20 bg-success/5 p-3 text-success">
              {successMessage}
            </div>
          )}

          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Team name..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the team..."
              rows={6}
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "desc-error" : undefined}
            />
            {errors.description && (
              <p id="desc-error" className="text-sm text-destructive mt-1">
                {errors.description}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
