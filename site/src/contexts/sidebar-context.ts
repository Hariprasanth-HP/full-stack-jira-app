// sidebar-context.ts

import { createContext } from "react";
import type { SidebarContextValue } from "@/types/type";

export const SideBarContext = createContext<SidebarContextValue | undefined>(
	undefined,
);
