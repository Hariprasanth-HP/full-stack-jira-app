import React, { useContext, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import {
  useCreateStatus,
  useUpdateStatus,
  type Status,
} from '@/lib/api/status';
import { useAppSelector } from '@/hooks/useAuth';
import { SideBarContext } from '@/contexts/sidebar-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SelectedColumn } from './kanban-view';

export default function CreateStatusForm({
  openDialog,
  setOpenDialog,
  onCancel = () => {},
  onSuccess,
  initialData,
}: {
  onCancel?: () => void;
  onSuccess?: () => void;
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  initialData?: SelectedColumn | undefined;
}) {
  const { statuses } = useContext(SideBarContext)!;

  const auth = useAppSelector((s) => s.auth);
  const projectId = auth?.userProject?.id;
  const isEditing = Boolean(initialData);
  const [formData, setFormData] = useState(
    initialData ?? {
      name: '',
      color: '#0ea5e9',
      sortOrder: null as number | null,
    }
  );
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  console.log('initialDatainitialData', initialData, formData);

  const [open, setOpen] = useState(openDialog);
  useEffect(() => {
    setOpen(openDialog);
  }, [openDialog]);
  const [error, setError] = useState('');
  const createStatus = useCreateStatus(projectId);
  const updateStatus = useUpdateStatus();
  console.log('updateStatus', updateStatus);

  // compute next sort order
  const nextSortOrder = React.useMemo(() => {
    if (!statuses || statuses.length === 0) return 0;

    const orders = statuses
      .map((s: Status) => s.sortOrder)
      .filter((v: unknown) => typeof v === 'number');

    if (orders.length === 0) return statuses.length;
    return Math.max(...orders) + 1;
  }, [statuses]);

  // single updater
  const update = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setError('Status name is required.');
      return;
    }

    if (isEditing) {
      try {
        await updateStatus.mutateAsync({
          name: formData.name.trim(),
          color: formData.color,
          statusId: formData.id!,
        });
        setTimeout(() => onSuccess?.(), 1000);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'message' in err) {
          setError((err as { message: string }).message);
        } else {
          setError('Failed to update status.');
        }
      }
    } else {
      try {
        await createStatus.mutateAsync({
          name: formData.name.trim(),
          color: formData.color,
          sortOrder: nextSortOrder,
        });

        setTimeout(() => onSuccess?.(), 1000);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'message' in err) {
          setError((err as { message: string }).message);
        } else {
          setError('Failed to create status.');
        }
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        setOpenDialog(val);
      }}
    >
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Update' : 'Create'} Status</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='w-full max-w-xl bg-card text-card-foreground rounded-md shadow-sm'
        >
          {/* Header */}
          {/* Body */}
          <div className='p-6 space-y-6'>
            {/* Name */}
            <div className='space-y-2'>
              <label htmlFor='status-name' className='text-sm font-medium'>
                Status name
              </label>

              <Input
                id='status-name'
                placeholder='e.g., Development, QA, Done'
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
              />

              {error && <p className='text-sm text-destructive'>{error}</p>}
            </div>

            {/* Color Picker */}
            <div className='space-y-2'>
              <label htmlFor='status-color' className='text-sm font-medium'>
                Status color
              </label>

              <input
                type='color'
                id='status-color'
                value={formData.color ?? ''}
                onChange={(e) => update('color', e.target.value)}
                className='h-10 w-16 rounded-md border cursor-pointer'
              />
            </div>

            {/* Sort Order (Automatic) */}
            {!isEditing && (
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  Sort Order (Auto-generated)
                </label>

                <Input
                  value={nextSortOrder}
                  disabled
                  className='opacity-70 cursor-not-allowed'
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Footer */}
          <div className='px-6 py-4 flex items-center justify-end gap-3'>
            <Button
              variant='ghost'
              onClick={() => {
                onCancel();
                setOpenDialog(false);
              }}
              type='button'
              disabled={createStatus.isPending || updateStatus?.isPending}
            >
              Cancel
            </Button>

            <Button
              type='submit'
              disabled={createStatus.isPending || updateStatus?.isPending}
            >
              {(createStatus.isPending || updateStatus?.isPending) && (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              )}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
