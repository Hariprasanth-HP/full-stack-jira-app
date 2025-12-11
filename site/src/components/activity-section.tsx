/**
 * v0 by Vercel.
 * @see https://v0.app/t/b8nBtqXPupB
 * Documentation: https://v0.app/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useCreateactivity, useUpdateactivity } from '@/lib/api/activity';
import { useState } from 'react';
import type { Activity } from '@/types/type';
import { Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export default function ActivityComp({
  userId,
  taskId,
  parentId,
  activities,
  setActivities,
}: {
  userId?: number;
  taskId?: number;
  parentId?: number;
  activities?: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}) {
  const createActivity = useCreateactivity();
  const updateActivity = useUpdateactivity();
  const [description, setDescription] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [editDescriptionError, setEditDescriptionError] = useState('');
  const [editActivity, setEditActivity] = useState<Activity | undefined>(
    undefined
  );

  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const handleCreateActivity = async () => {
    try {
      if (!description.trim()) {
        setDescriptionError('Activity description cannot be empty.');
        return;
      }
      setDescriptionError('');

      const { data } = await createActivity.mutateAsync({
        description,
        userId: userId!,
        taskId: taskId!,
        parentId: parentId,
        kind: 'COMMENT',
      });
      if (data) {
        setActivities?.([data, ...(activities || [])]);
        setDescription('');
      }
      // handle success (e.g., show a toast, clear form, etc.)
    } catch (error) {
      // handle error (e.g., show error message)
      void error;
    }
  };
  const handleUpdateActivity = async () => {
    try {
      if (!editDesc.trim()) {
        setEditDescriptionError('Comment cannot be empty.');
        return;
      }

      const { data } = await updateActivity.mutateAsync({
        id: editActivity?.id,
        description: editDesc,
      });
      if (data) {
        setActivities?.((prev: Activity[]) => {
          return prev.map((act) => {
            if (act.id === data.id) {
              return data;
            }
            return act;
          });
        });
        setEditDesc('');
        setShowActivityDialog(false);
      }
      // handle success (e.g., show a toast, clear form, etc.)
    } catch (error) {
      // handle error (e.g., show error message)
      void error;
    }
  };

  return (
    <div className='mx-auto max-w-2xl space-y-8 py-8 h-[100%]'>
      <div className='space-y-4'>
        <h2 className='text-2xl font-bold'>Activities</h2>
        <CommentForm
          description={description}
          setDescription={setDescription}
          descriptionError={descriptionError}
          onSubmit={handleCreateActivity}
        />
      </div>
      <div className='space-y-6 overflow-auto h-[80%] '>
        {activities && activities.length > 0 ? (
          <>
            {activities.map((activity) => {
              return (
                <div className='flex items-start gap-4'>
                  <Avatar className='h-10 w-10 border'>
                    <AvatarImage
                      src='/placeholder-user.jpg'
                      alt={activity?.user?.email}
                    />
                    <AvatarFallback>
                      {activity?.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className='grid gap-1.5 w-full'>
                    <div className='flex items-center gap-2 w-full'>
                      <div className='font-medium'>{activity?.user?.name}</div>
                      <div className='text-xs text-muted-foreground'>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </div>
                      {activity.kind === 'COMMENT' && (
                        <Button
                          variant='ghost'
                          size='sm'
                          title='Delete Task'
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditActivity(activity);
                            setEditDesc(activity.description!);
                            setShowActivityDialog(true);
                          }}
                          className='ml-auto'
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                      )}
                    </div>

                    <div className='text-sm text-muted-foreground'>
                      {activity.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <p className='text-sm text-muted-foreground'>No activities yet.</p>
        )}
      </div>
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className='sm:max-w-[40%] h-[20%] overflow-auto flex flex-col justify-center items-center'>
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
          </DialogHeader>
          <CommentForm
            description={editDesc}
            setDescription={setEditDesc}
            descriptionError={editDescriptionError}
            onSubmit={handleUpdateActivity}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CommentFormProps {
  description: string;
  setDescription: (v: string) => void;
  descriptionError?: string | null;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export function CommentForm({
  description,
  setDescription,
  descriptionError,
  onSubmit,
  submitLabel = 'Submit',
  loading = false,
}: CommentFormProps) {
  return (
    <div className='w-full  space-y-2'>
      <div className='grid h-full gap-2'>
        <Textarea
          name='description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Write your activity...'
          className='resize-none rounded-md border border-input bg-background p-3 text-sm shadow-sm'
        />
        {descriptionError && (
          <p className='text-sm text-destructive'>{descriptionError}</p>
        )}
      </div>

      <div className='flex justify-end'>
        <Button
          className='justify-center'
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
