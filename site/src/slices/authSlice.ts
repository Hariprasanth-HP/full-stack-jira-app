import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from '../types/auth';
import type { User } from '@/types/user';
import { ViewMode } from '@/types/type';

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  status: 'idle',
  error: null,
  userTeam: JSON.parse(localStorage.getItem('team') || 'null'),
  userProject: JSON.parse(localStorage.getItem('project') || 'null'),
  viewMode: localStorage.getItem('view')
    ? JSON.parse(localStorage.getItem('view')! ?? null)
    : ViewMode.LIST,
};

interface SetAuthPayload {
  token: string | null;
  user?: User | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<SetAuthPayload>) {
      state.token = action.payload.token ?? null;
      state.user = action.payload.user ?? null;
      state.isAuthenticated = !!action.payload.token;
      if (action.payload.token)
        localStorage.setItem('token', action.payload.token);
      else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      if (action.payload.user)
        localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginStart(state) {
      state.status = 'loading';
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<Partial<AuthState>>) {
      state.status = 'succeeded';
      const user = action.payload.user;
      state.user = user!;
      state.token = action.payload.token!;
      state.isAuthenticated = true;
      state.userTeam = action.payload.userTeam;
      localStorage.setItem('token', action.payload.token!);
      localStorage.setItem('user', JSON.stringify(user));

      document.cookie = `refreshToken=${
        action.payload.refreshToken
      }; Path=/; Max-Age=${60 * 60 * 24 * 7}`;
    },
    setTeam(state, action: PayloadAction<Partial<AuthState>>) {
      const team = action.payload.userTeam;
      state.userTeam = team;
      state.userProject = null;
      localStorage.setItem('team', JSON.stringify(team));
      localStorage.removeItem('project');
    },
    setProject(state, action: PayloadAction<Partial<AuthState>>) {
      const project = action.payload.userProject;
      state.userProject = project;
      localStorage.setItem('project', JSON.stringify(project));
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
      localStorage.setItem('view', JSON.stringify(action.payload));
    },
    clearTeamAndProject(state) {
      state.userProject = null;
      state.userTeam = null;
      localStorage.removeItem('team');
      localStorage.removeItem('project');
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setAuth,
  setTeam,
  setProject,
  clearTeamAndProject,
  setViewMode,
} = authSlice.actions;
export default authSlice.reducer;
