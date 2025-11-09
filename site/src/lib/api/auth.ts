import { apiPost } from "../apiClient";
import type {
  LoginPayload,
  SignupPayload,
  AuthResponse,
} from "../../types/auth";
import type { ApiResponse } from "../../types/api";
import { loginFailure, loginStart, loginSuccess } from "@/slices/authSlice";
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

export const loginUser =
  (payload: LoginPayload) => async (dispatch: AppDispatch) => {
    try {
      dispatch(loginStart());
      const res = await authApi.login(payload); // API call
      console.log("actionaction", res);

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
      dispatch(loginSuccess(res.data)); // reuse loginSuccess (token + user)
    } catch (err: any) {
      dispatch(loginFailure(err.message || "Signup failed"));
    }
  };
