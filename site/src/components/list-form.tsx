import React, { useContext, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Your Field helpers
import { Field, FieldGroup, FieldLabel } from './ui/field';
import { useCreatelist } from '@/lib/api/list';
import { useAppSelector } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SideBarContext } from '@/contexts/sidebar-context';
import type { List } from '@/types/type';

/** Form data type */
type FormData = {
  name: string;
};

export default function CreateListForm({
  initial = {
    name: '',
  },
  onCancel,
  setShowListDialog,
}: {
  initial?: Partial<FormData>;
  onCancel?: () => void;
  setShowListDialog?: React.Dispatch<React.SetStateAction<boolean>>;
  onCreate?: (data: FormData) => Promise<void> | void;
}) {
  const { setListForTableState } = useContext(SideBarContext)!;
  const createList = useCreatelist();
  const [formData, setFormData] = useState<FormData>({
    name: initial.name ?? '',
  });
  const auth = useAppSelector((s) => s.auth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setFormData((s) => ({ ...s, [k]: v }));

  const validate = (): boolean => {
    if (!formData.name.trim()) {
      setError('List name is required.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (auth?.userProject?.id) {
        const { data } = await createList.mutateAsync({
          ...formData,
          projectId: auth.userProject.id!,
        });
        toast.success('List created successfully');
        setListForTableState((prev: List[]) => [...prev, data]);
        setShowListDialog?.(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='w-full max-w-xl bg-card text-card-foreground rounded-md'
    >
      <div className='px-6 py-4 border-b'>
        <h3 className='text-lg font-semibold text-center'>Create a list</h3>
      </div>

      <div className='p-6 space-y-6'>
        {/* FieldGroup for List name */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor='list-name'>List name</FieldLabel>
            <Input
              id='list-name'
              placeholder='e.g., Development'
              value={formData.name}
              onChange={(e) => update('name', e.target.value)}
              aria-invalid={!!error}
            />
            {error && (
              <p className='text-sm text-destructive mt-1' role='alert'>
                {error}
              </p>
            )}
          </Field>
        </FieldGroup>

        {/* Roadmap toggle */}
      </div>

      <Separator />

      <div className='px-6 py-4 flex items-center justify-end gap-3'>
        <Button
          variant='ghost'
          type='button'
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button type='submit' disabled={loading}>
          {loading ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : null}
          Create
        </Button>
      </div>
    </form>
  );
}
