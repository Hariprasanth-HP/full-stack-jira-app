"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddTaskForm from "./task-form";

export function AddTaskDialog({
  showTaskDialog,
  setShowTaskDialog,
  setTaskData,
  taskData,
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
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Anyone with the link will be able to view this file.
          </DialogDescription>
        </DialogHeader>
        <AddTaskForm
          setShowTaskDialog={setShowTaskDialog}
          setTaskData={setTaskData}
          taskData={taskData}
        />
      </DialogContent>
    </Dialog>
  );
}
