// sidebar-context.ts
import type { SidebarContextValue } from "@/types/type";
import { createContext } from "react";

export const SideBarContext = createContext<SidebarContextValue | undefined>(
  undefined
);
