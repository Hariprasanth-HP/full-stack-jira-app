// src/slices/projectsSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Project } from "../types/project";
import * as projectsApi from "../lib/api/projects";
import type { AppDispatch, RootState } from "../store";

/** Slice state */
interface ProjectsState {
  items: Project[];
  current?: Project | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ProjectsState = {
  items: [],
  current: null,
  status: "idle",
  error: null,
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    fetchStart(state) {
      state.status = "loading";
      state.error = null;
    },
    fetchSuccess(state, action: PayloadAction<Project[]>) {
      state.status = "succeeded";
      state.items = action.payload;
      state.error = null;
    },
    fetchFailure(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    createStart(state) {
      state.status = "loading";
      state.error = null;
    },
    createSuccess(state, action: PayloadAction<Project>) {
      state.status = "succeeded";
      // add new project at the top
      state.items = [action.payload, ...state.items];
      state.error = null;
    },
    createFailure(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    updateStart(state) {
      state.status = "loading";
      state.error = null;
    },
    updateSuccess(state, action: PayloadAction<Project>) {
      state.status = "succeeded";
      const updated = action.payload;
      state.items = state.items.map((p) => (p.id === updated.id ? updated : p));
      // if current is the updated project, update it too
      if (state.current && state.current.id === updated.id)
        state.current = updated;
      state.error = null;
    },
    updateFailure(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    deleteStart(state) {
      state.status = "loading";
      state.error = null;
    },
    deleteSuccess(state, action: PayloadAction<number>) {
      state.status = "succeeded";
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.current && state.current.id === action.payload)
        state.current = null;
    },
    deleteFailure(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },

    setCurrentProject(state, action: PayloadAction<Project | null>) {
      state.current = action.payload;
    },

    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchStart,
  fetchSuccess,
  fetchFailure,
  createStart,
  createSuccess,
  createFailure,
  updateStart,
  updateSuccess,
  updateFailure,
  deleteStart,
  deleteSuccess,
  deleteFailure,
  setCurrentProject,
  clearError,
} = projectsSlice.actions;

export default projectsSlice.reducer;

/* -----------------------
   Async action creators
   ----------------------- */

/** Fetch all projects */
export function loadProjects() {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(fetchStart());
      const projects = await projectsApi.fetchProjects();
      dispatch(fetchSuccess(projects));
    } catch (err: any) {
      const message = err?.message ?? "Failed to fetch projects";
      dispatch(fetchFailure(message));
      throw err;
    }
  };
}

export function fetchProject() {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(fetchStart());
      const projects = await projectsApi.fetchProject();
      dispatch(fetchSuccess(projects));
    } catch (err: any) {
      const message = err?.message ?? "Failed to fetch projects";
      dispatch(fetchFailure(message));
      throw err;
    }
  };
}
/** Create project */
export function createProject(payload: { name: string; description?: string }) {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(createStart());
      const project = await projectsApi.createProject(payload);
      dispatch(createSuccess(project));
      return project;
    } catch (err: any) {
      const message = err?.message ?? "Failed to create project";
      dispatch(createFailure(message));
      throw err;
    }
  };
}

/** Update project */
export function editProject(id: number, payload: Partial<Project>) {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(updateStart());
      const updated = await projectsApi.updateProject(id, payload);
      dispatch(updateSuccess(updated));
      return updated;
    } catch (err: any) {
      const message = err?.message ?? "Failed to update project";
      dispatch(updateFailure(message));
      throw err;
    }
  };
}

/** Delete project */
export function removeProject(id: number) {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(deleteStart());
      await projectsApi.deleteProject(id);
      dispatch(deleteSuccess(id));
    } catch (err: any) {
      const message = err?.message ?? "Failed to delete project";
      dispatch(deleteFailure(message));
      throw err;
    }
  };
}

/* -----------------------
   Selectors
   ----------------------- */
export const selectProjects = (state: RootState) => state.projects.items;
export const selectProjectsStatus = (state: RootState) => state.projects.status;
export const selectCurrentProject = (state: RootState) =>
  state.projects.current;
export const selectProjectsError = (state: RootState) => state.projects.error;
