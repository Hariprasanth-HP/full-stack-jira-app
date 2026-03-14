import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: true,
    theme: "light",
    activeProjectId: null,
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
    setActiveProject(state, action) {
      state.activeProjectId = action.payload;
    },
  },
});

export const { toggleSidebar, setTheme, setActiveProject } = uiSlice.actions;
export default uiSlice.reducer;
