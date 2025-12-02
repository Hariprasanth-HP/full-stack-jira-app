"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddTaskForm from "./task-form";
import { useDeletetask } from "@/lib/api/task";

export function AddTaskDialog({
  showTaskDialog,
  setShowTaskDialog,
  setTaskData,
  taskData,
  type,
  settaskForTableState,
  status,
}: {
  showTaskDialog: boolean;
  setShowTaskDialog: (v: boolean) => void;
  setTaskData: (data: any) => void;
  taskData: any;
}) {
  return (
    <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
      <DialogContent className="sm:max-w-[70%] sm:max-h-[90%] overflow-auto">
        <DialogHeader>
          <DialogTitle>{type === "edit" ? "Edit" : "Create"} Task</DialogTitle>
          <DialogDescription>
            Anyone with the link will be able to view this file.
          </DialogDescription>
        </DialogHeader>
        <AddTaskForm
          setShowTaskDialog={setShowTaskDialog}
          setTaskData={setTaskData}
          taskData={taskData}
          type={type}
          settaskForTableState={settaskForTableState}
          status={status}
        />
      </DialogContent>
    </Dialog>
  );
}

type Props = {
  showTaskDialog: boolean;
  setShowTaskDialog: (v: boolean) => void;
  setTaskData: (data: any) => void;
  taskData: any;
};

export default function DeleteTaskDialog({
  showTaskDialog,
  setShowTaskDialog,
  setTaskData,
  taskData,
  settaskForTableState,
}: Props) {
  // Replace this with your actual delete hook / mutation
  const deleteTask = useDeletetask?.() ?? {
    mutate: (id: any, opts?: any) => Promise.resolve(),
  };

  const handleConfirm = async () => {
    try {
      // assume taskData has an `id` field — adapt if your shape differs
      await deleteTask.mutate(
        { id: taskData?.id },
        {
          onSuccess: () => {
            setShowTaskDialog(false);
            setTaskData(null);
            settaskForTableState((prev) => {
              return prev
                .map((task) => {
                  // Case: remove subTask from its parent
                  if (
                    taskData.parentTaskId &&
                    task.id === taskData.parentTaskId
                  ) {
                    return {
                      ...task,
                      subTasks: task.subTasks.filter(
                        (t) => t.id !== taskData.id
                      ),
                    };
                  }

                  // Otherwise return the task (maybe filtered later)
                  return task;
                })
                .filter((task) => task.id !== taskData.id); // Remove the actual task
            });
          },
        }
      );
    } catch (err) {
      // handle error as needed
      console.error("Failed to delete task", err);
      setShowTaskDialog(false);
    }
  };

  const handleCancel = () => {
    setShowTaskDialog(false);
  };

  return (
    <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
      <DialogContent className="sm:max-w-[70%] sm:max-h-[90%] overflow-auto">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this task? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col items-center gap-4">
          <p className="text-sm text-center">
            {taskData?.name ? (
              <>
                Task: <strong>{taskData.name}</strong>
              </>
            ) : (
              "No task selected"
            )}
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Yes, delete
            </button>

            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 rounded-md border"
            >
              No, cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
