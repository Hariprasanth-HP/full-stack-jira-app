"use client";

import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  type Icon,
} from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ProjectDeleteDialog } from "./project-form";
import { useContext, useState } from "react";
import { useDispatch } from "react-redux";
import { setProject } from "@/slices/authSlice";
import { SideBarContext } from "@/contexts/sidebar-context";

export function NavProjects({ items, setItems, onDelete }: { items: any[] }) {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const [itemData, setItemData] = useState(undefined);
  const dispatch = useDispatch();
  const { setSelectedProject } = useContext(SideBarContext);
  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            return (
              <SidebarMenuItem
                key={item.name}
                onClick={() => {
                  setSelectedProject(item);
                  setTimeout(() => dispatch(setProject({ project: item })), 0);
                }}
              >
                <SidebarMenuButton asChild>
                  <a href={"#"}>
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      className="data-[state=open]:bg-accent rounded-sm"
                    >
                      <IconDots />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-24 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemData(item);
                        setOpen(true);
                      }}
                    >
                      <IconTrash />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          })}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <IconDots className="text-sidebar-foreground/70" />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <ProjectDeleteDialog
        open={open}
        setOpen={setOpen}
        onSubmit={async () => {
          await onDelete(itemData.id);
          setItems((prev) => prev.filter((p) => p.id !== itemData.id));
          localStorage.removeItem("project");
          setOpen(false);
        }}
      />
    </>
  );
}
