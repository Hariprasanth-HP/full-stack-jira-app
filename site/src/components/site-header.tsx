import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/hooks/useAuth";
import { setProject } from "@/slices/authSlice";
import { AddListOrTaskPopover } from "./add-task-list";
import { ModeToggle } from "./mode-toggle";
import { ProjectDialog } from "./project-form";
import { DashBoardContext } from "@/contexts/dashboard-context";
import { SideBarContext } from "@/contexts/sidebar-context";
export function SiteHeader({ logout, projects }) {
  const auth = useAppSelector((s) => s.auth);
  const { handleCreateProject, refetchProject } =
    React.useContext(SideBarContext);
  const [selectedProject, setSelectedProject] = React.useState(undefined);
  const dispatch = useAppDispatch();
  const handleChange = (value: string) => {
    const id = Number(value);
    const foundProject = projects.find((p) => Number(p.id) === id);
    setSelectedProject(foundProject);
    dispatch(setProject({ project: foundProject }));
  };

  React.useEffect(() => {
    if (auth.userProject) {
      setSelectedProject(auth.userProject);
    }
  }, [auth]);
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {projects && projects.length > 0 && (
          <>
            <Select onValueChange={handleChange} value={selectedProject?.id}>
              <SelectTrigger className="w-auto border-0 focus:ring-0 focus:outline-none shadow-none">
                <SelectValue placeholder="Select a Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => {
                  return (
                    <SelectItem value={project.id}>{project.name}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <ProjectDialog onSubmit={handleCreateProject} refetch={refetchProject} />
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {projects && projects.length > 0 && <AddListOrTaskPopover />}
          <ModeToggle />

          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:flex"
            onClick={logout}
          >
            Log Out
          </Button>
        </div>
      </div>
    </header>
  );
}
