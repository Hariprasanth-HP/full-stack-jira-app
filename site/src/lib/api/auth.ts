import { apiPost } from "../apiClient";
import type {
  LoginPayload,
  SignupPayload,
  AuthResponse,
} from "../../types/auth";
import type { ApiResponse } from "../../types/api";
import {
  loginFailure,
  loginStart,
  loginSuccess,
  logout,
} from "@/slices/authSlice";
import type { AppDispatch } from "@/store";
import * as authApi from "../../lib/api/auth";

export async function login(
  payload: LoginPayload
): Promise<ApiResponse<AuthResponse>> {
  return apiPost<ApiResponse<AuthResponse>>("/auth/login", payload, {
    withAuth: true,
  });
}

export async function signup(
  payload: SignupPayload
): Promise<ApiResponse<AuthResponse>> {
  return apiPost<ApiResponse<AuthResponse>>("/auth/signup", payload, {
    withAuth: true,
  });
}

export async function logoutApi(payload: {
  refreshToken: string;
}): Promise<ApiResponse<AuthResponse>> {
  return apiPost<ApiResponse<AuthResponse>>("/auth/logout", payload, {
    withAuth: true,
  });
}

export const loginUser =
  (payload: LoginPayload) => async (dispatch: AppDispatch) => {
    try {
      dispatch(loginStart());
      const res = await authApi.login(payload); // API call
      dispatch(loginSuccess(res));
    } catch (err: any) {
      dispatch(loginFailure(err.message || "Login failed"));
    }
  };
export const signupUser =
  (payload: SignupPayload) => async (dispatch: AppDispatch) => {
    try {
      dispatch(loginStart());
      const res = await authApi.signup(payload);
      dispatch(loginSuccess(res)); // reuse loginSuccess (token + user)
    } catch (err: any) {
      dispatch(loginFailure(err.message || "Signup failed"));
    }
  };

// utils/cookies.ts
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}
// authThunks.ts

export const logoutUser = () => async (dispatch: AppDispatch) => {
  try {
    // ✅ Get refresh token from cookie
    const refreshToken = getCookie("refreshToken");
    if (!refreshToken) {
      console.warn("No refresh token found in cookies");
      dispatch(loginFailure("Logout failed , No refresh Token"));
      return;
    }

    // ✅ Send token in request body
    const res = await authApi.logoutApi({ refreshToken });

    // ✅ Clear local state
    dispatch(logout()); // this should reset your Redux state (user, token, etc.)

    // ✅ Clear the cookie client-side
    document.cookie = "refreshToken=; Path=/; Max-Age=0;";

    return res;
  } catch (err: any) {
    console.error("Logout error:", err);
    dispatch(loginFailure(err.message || "Logout failed"));
  }
};
