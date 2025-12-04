import type { ViewMode } from '@/components/view-model';
import type { Project, Team } from './type';
import type { User } from './user';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  userProject: Project | undefined;
  userTeam: Team | undefined;
  refreshToken?: string;
  viewMode?: ViewMode;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken: string;
  company: unknown;
}
