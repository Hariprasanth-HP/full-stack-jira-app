"use client";

import { useContext, useState } from "react";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
import { PlusIcon } from "lucide-react";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
import { DashBoardContext } from "@/contexts/dashboard-context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useParams } from "react-router-dom";
import { SideBarContext } from "@/contexts/sidebar-context";
import { useAppSelector } from "@/hooks/useAuth";
import { TabsContent } from "@radix-ui/react-tabs";
export function NavTeam() {
  const [showListDialog, setShowListDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const { team, usersList } = useContext(SideBarContext);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src={team.avatar} alt={team.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{team.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {team.email}
                  </span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              //   side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={team.avatar} alt={team.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{team.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {team.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setShowTaskDialog(true)}>
                  <IconUserCircle />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconCreditCard />
                  Billing
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <IconLogout />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="sm:max-w-[90%] sm:max-h-[95%] overflow-auto ">
          <DialogHeader>
            <DialogTitle>Manage team</DialogTitle>
          </DialogHeader>
          <ManageTeam />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ManageTeam({ setShowManageTeam }) {
  const { id: teamId } = useParams();
  const auth = useAppSelector((s) => s.auth);
  const team = auth.userTeam;
  return (
    <>
      <div className="flex h-full">
        <div className="flex-1 px-8 py-6 overflow-auto">
          <div className="flex flex-col  gap-4">
            <h2 className="text-2xl font-semibold">{team.name}</h2>
            <Tabs defaultValue="add" className="ml-6">
              <TabsList className="bg-transparent p-0">
                <TabsTrigger value="add" className="text-sm">
                  Add Members
                </TabsTrigger>
                <TabsTrigger value="members" className="text-sm">
                  Manage Members (1)
                </TabsTrigger>
              </TabsList>
              <TabsContent value="add">
                <div className="mt-6 border-t border-slate-700 pt-6">
                  {/* Invite form - 3 columns grid similar to screenshot */}
                  <h3 className="text-xs uppercase text-slate-300 font-semibold">
                    Add people to your workspace
                  </h3>

                  <div className="grid grid-cols-12 gap-4 mt-4 items-start">
                    <div className="col-span-6">
                      <Label className="text-slate-300">Email Address</Label>
                      <div className="space-y-3 mt-2">
                        <Input placeholder="email@example.com" />
                        <Input placeholder="email@example.com" />
                        <Input placeholder="email@example.com" />
                      </div>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-slate-300">Name (optional)</Label>
                      <div className="space-y-3 mt-2">
                        <Input placeholder="" />
                        <Input placeholder="" />
                        <Input placeholder="" />
                      </div>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-slate-300">Role</Label>
                      <div className="space-y-3 mt-2">
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Member" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Member" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Member" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button variant="default" >Add to Workspace</Button>
                  </div>
                  <div className="h-40" />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
