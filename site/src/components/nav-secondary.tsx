"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SideBarContext } from "@/contexts/sidebar-context";

export function NavSecondary({
	...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	const navigate = useNavigate();
	const { team } = React.useContext(SideBarContext)!;
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem key={"team"}>
						<SidebarMenuButton asChild>
							<span onClick={() => navigate(`/team/${team?.id}`)}>
								Manage team
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
