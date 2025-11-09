import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthResponse } from "../types/auth";
import type { User } from "@/types/user";

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  status: "idle",
  error: null,
};

interface SetAuthPayload {
  token: string | null;
  user?: User | null;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<SetAuthPayload>) {
      state.token = action.payload.token ?? null;
      state.user = action.payload.user ?? null;
      state.isAuthenticated = !!action.payload.token;
      if (action.payload.token)
        localStorage.setItem("token", action.payload.token);
      else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      if (action.payload.user)
        localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    loginStart(state) {
      state.status = "loading";
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<AuthResponse>) {
      state.status = "succeeded";
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setAuth } =
  authSlice.actions;
export default authSlice.reducer;
