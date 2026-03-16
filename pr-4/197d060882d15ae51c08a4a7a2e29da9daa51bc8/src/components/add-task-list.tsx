'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateListForm from '@/features/projects/components/list-form';
import { AddTaskDialog } from '@/features/projects/components/add-task-form';
import CreateStatusForm from '@/features/projects/components/create-status-form';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ListPlus } from 'lucide-react';
import type { Task } from '@/types/type';

export function AddListOrTaskPopover() {
  const [showListDialog, setShowListDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [taskData, setTaskData] = useState<Task | undefined>(undefined);  return (
    <>
      <DropdownMenu modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' aria-label='Open menu'>
                <ListPlus className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>

          <TooltipContent>
            <p>Add Task / List / Status</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent className='w-40' align='end'>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setShowTaskDialog(true)}>
              Task
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowListDialog(true)}>
              List
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowStatusDialog(true)}>
              Status
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className='sm:max-w-[40%] sm:max-h-[90%] overflow-auto'>
          <CreateListForm setShowListDialog={setShowListDialog} />
        </DialogContent>
      </Dialog>
      <CreateStatusForm
        openDialog={showStatusDialog}
        setOpenDialog={setShowStatusDialog}
        onSuccess={() => setShowStatusDialog(false)}
        onCancel={() => setShowStatusDialog(false)}
      />
      <AddTaskDialog
        showTaskDialog={showTaskDialog}
        setShowTaskDialog={setShowTaskDialog}
        setTaskData={setTaskData}
        taskData={taskData}
      />
    </>
  );
}
