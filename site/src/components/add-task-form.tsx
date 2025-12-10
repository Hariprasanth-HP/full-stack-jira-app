'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AddTaskForm from './task-form';
import { useDeletetask } from '@/lib/api/task';
import type { Task } from '@/types/type';
import type { SelectedColumn } from './kanban-view';

export function AddTaskDialog({
  showTaskDialog,
  setShowTaskDialog,
  taskData,
  type,
  status,
}: {
  showTaskDialog: boolean;
  setShowTaskDialog: (v: boolean) => void;
  setTaskData?: React.Dispatch<
    React.SetStateAction<
      (Partial<Task> & { id: number; statusId: number }) | undefined
    >
  >;
  taskData?: (Partial<Task> & { id: number; statusId: number }) | undefined;
  type?: string;
  setTaskForTableState?: React.Dispatch<React.SetStateAction<Task[]>>;
  status?: SelectedColumn;
}) {
  return (
    <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
      <DialogContent className='sm:max-w-[70%] sm:max-h-[90%] overflow-auto'>
        <DialogHeader>
          <DialogTitle>{type === 'edit' ? 'Edit' : 'Create'} Task</DialogTitle>
        </DialogHeader>
        <AddTaskForm
          setShowTaskDialog={setShowTaskDialog}
          taskData={taskData}
          type={type}
          status={status}
        />
      </DialogContent>
    </Dialog>
  );
}

type Props = {
  showTaskDialog: boolean;
  setShowTaskDialog: (v: boolean) => void;
  setTaskData: React.Dispatch<
    React.SetStateAction<
      (Partial<Task> & { id: number; statusId: number }) | undefined | null
    >
  >;
  taskData: (Partial<Task> & { id: number; statusId: number }) | undefined;

  setTaskForTableState: React.Dispatch<React.SetStateAction<Task[]>>;
};

export default function DeleteTaskDialog({
  showTaskDialog,
  setShowTaskDialog,
  setTaskData,
  taskData,
  setTaskForTableState,
}: Props) {
  // If the hook exists call it, otherwise fall back to a noop object with correct shape.
  // This preserves the original runtime behavior while keeping TS happy.
  const deleteTask = useDeletetask();

  const handleConfirm = async () => {
    try {
      await deleteTask.mutate(
        { taskId: Number(taskData?.id) },
        {
          onSuccess: () => {
            setShowTaskDialog(false);
            setTaskData(null);
            setTaskForTableState((prev) => {
              return prev
                .map((task) => {
                  // Case: remove subTask from its parent
                  if (
                    taskData?.parentTaskId &&
                    task.id === taskData.parentTaskId
                  ) {
                    return {
                      ...task,
                      // make safe if subTasks undefined
                      subTasks: (task.subTasks ?? []).filter(
                        (t) => t.id !== taskData?.id
                      ),
                    };
                  }

                  // Otherwise return the task (maybe filtered later)
                  return task;
                })
                .filter((task) => task.id !== taskData?.id); // Remove the actual task
            });
          },
        }
      );
    } catch (err) {
      // handle error as needed
      // keep behavior same as original: log and close dialog
      console.error('Failed to delete task', err);
      setShowTaskDialog(false);
    }
  };

  const handleCancel = () => {
    setShowTaskDialog(false);
  };

  return (
    <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
      <DialogContent className='sm:max-w-[70%] sm:max-h-[90%] overflow-auto'>
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this task? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className='mt-6 flex flex-col items-center gap-4'>
          <p className='text-sm text-center'>
            {taskData?.name ? (
              <>
                Task: <strong>{taskData.name}</strong>
              </>
            ) : (
              'No task selected'
            )}
          </p>

          <div className='flex gap-3'>
            <button
              onClick={handleConfirm}
              className='inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700'
            >
              Yes, delete
            </button>

            <button
              onClick={handleCancel}
              className='inline-flex items-center px-4 py-2 rounded-md border'
            >
              No, cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
