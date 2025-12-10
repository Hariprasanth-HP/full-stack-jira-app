import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FolderPlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

type ProjectPayload = { name: string; description?: string };

type ProjectDialogProps = {
  onSubmit?: (payload: ProjectPayload) => Promise<unknown> | unknown;
  refetch?: () => void;
};

export function ProjectDialog({ onSubmit, refetch }: ProjectDialogProps) {
  // form state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // validation state
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {}
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setErrors({});
    setServerError(null);
  }, []);

  const validate = useCallback(() => {
    const next: typeof errors = {};

    if (!name.trim()) next.name = 'Name is required.';
    else if (name.trim().length > 50)
      next.name = 'Name must be 50 characters or less.';

    if (description && description.length > 400)
      next.description = 'Description must be 400 characters or less.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, description]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setServerError(null);

      if (!validate()) return;

      setLoading(true);
      try {
        const project = await Promise.resolve(
          onSubmit?.({ name: name.trim(), description: description.trim() })
        );
        if (project) {
          resetForm();
          refetch?.();
          setOpen(false);
        }
      } catch (err: unknown) {
        let message: string;
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        } else {
          message = 'An unexpected error occurred. Please try again.';
        }

        setServerError(message);
      } finally {
        setLoading(false);
      }
    },
    [name, description, onSubmit, refetch, resetForm, validate]
  );

  const handleNameChange = useCallback(
    (v: string) => {
      setName(v);
      if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
      if (serverError) setServerError(null);
    },
    [errors.name, serverError]
  );

  const handleDescriptionChange = useCallback(
    (v: string) => {
      setDescription(v);
      if (errors.description)
        setErrors((p) => ({ ...p, description: undefined }));
      if (serverError) setServerError(null);
    },
    [errors.description, serverError]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => (val ? setOpen(true) : setOpen(val))}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <FolderPlus className='h-5 w-5' />
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create Project</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create your project here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='grid gap-6'>
          <div className='grid gap-3'>
            <Label htmlFor='project-name'>Name</Label>
            <Input
              id='project-name'
              placeholder='Team name...'
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id='name-error' className='text-sm text-destructive mt-1'>
                {errors.name}
              </p>
            )}
          </div>

          <div className='grid gap-3'>
            <Label htmlFor='project-desc'>Description</Label>
            <Textarea
              id='project-desc'
              placeholder='Describe the team...'
              rows={6}
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'desc-error' : undefined}
            />
            {errors.description && (
              <p id='desc-error' className='text-sm text-destructive mt-1'>
                {errors.description}
              </p>
            )}
          </div>

          {serverError && (
            <p className='text-sm text-destructive'>{serverError}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant='outline'
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </DialogClose>

            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProjectDeleteDialogProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSubmit: () => void | Promise<void>;
};

export function ProjectDeleteDialog({
  open,
  setOpen,
  onSubmit,
}: ProjectDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            project and remove your data from the project.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              try {
                await Promise.resolve(onSubmit());
                setOpen(false);
              } catch {
                // Ideally wire this up to a notification system
                // For now we just close and rely on the caller to surface errors.
                setOpen(false);
              }
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
