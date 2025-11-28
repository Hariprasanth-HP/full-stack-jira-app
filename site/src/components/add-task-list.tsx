"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddTaskForm from "./task-form";
import CreateListForm from "./list-form";
import { AddTaskDialog } from "./add-task-form";

export function AddListOrTaskPopover() {
  const [showListDialog, setShowListDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskData, setTaskData] = useState({});
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label="Open menu">
            Add task/list
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setShowTaskDialog(true)}>
              Task
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowListDialog(true)}>
              List
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="sm:max-w-[40%] sm:max-h-[90%] overflow-auto">
          <CreateListForm setShowListDialog={setShowListDialog} />
        </DialogContent>
      </Dialog>
      <AddTaskDialog
        showTaskDialog={showTaskDialog}
        setShowTaskDialog={setShowTaskDialog}
        setTaskData={setTaskData}
        taskData
      />
    </>
  );
}
