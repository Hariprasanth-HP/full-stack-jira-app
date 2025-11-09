import type { User } from "./user";

export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  creatorId: number | null;
  creator?: User;
}
