import * as React from 'react';
import { NavProjects } from '@/components/nav-projects';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavTeam } from './nav-team';
import { SideBarContext } from '@/contexts/sidebar-context';
import { useDeleteProject } from '@/lib/api/projects';
import { toast } from 'sonner';
import { IconInnerShadowTop } from '@tabler/icons-react';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { projectsState, setProjectsState } = React.useContext(SideBarContext)!;

  const deleteProject = useDeleteProject();
  async function onDelete(id: number) {
    // Implement the delete functionality here
    await deleteProject.mutateAsync({ id });
    toast.success('Project deleted successfully');
  }

  return (
    <>
      <Sidebar collapsible='offcanvas' {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className='data-[slot=sidebar-menu-button]:!p-1.5'
              >
                <a href='#'>
                  <IconInnerShadowTop className='!size-5' />
                  <span className='text-base font-semibold'>Sprinta</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain />
          <NavProjects
            items={projectsState}
            onDelete={onDelete}
            setItems={setProjectsState}
          />
        </SidebarContent>
        <SidebarFooter>
          <NavTeam />
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
