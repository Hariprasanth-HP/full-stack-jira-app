import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { TeamSelect } from './team-select';

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          <TeamSelect />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
