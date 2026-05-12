import type { Session } from "@supabase/supabase-js";
import * as authApi from "@/features/auth/api/auth";
import {
	loginFailure,
	loginStart,
	loginSuccess,
	logout,
} from "@/features/auth/stores/authSlice";
import { apiPost } from "@/lib/apiClient";
import type { AppDispatch } from "@/store";
import type { ApiResponse } from "@/types/api";
import type {
	AuthResponse,
	GoogleLoginPayload,
	LoginPayload,
	SignupPayload,
} from "@/types/auth";

export async function login(
	payload: LoginPayload,
): Promise<ApiResponse<AuthResponse>> {
	return apiPost<ApiResponse<AuthResponse>>("/auth/login", payload, {
		withAuth: true,
	});
}

export async function googleLogin(
	payload: GoogleLoginPayload,
): Promise<ApiResponse<AuthResponse>> {
	return apiPost<ApiResponse<AuthResponse>>("/auth/google/login", payload, {
		withAuth: true,
	});
}
export async function signup(
	payload: SignupPayload,
): Promise<ApiResponse<AuthResponse>> {
	return apiPost<ApiResponse<AuthResponse>>("/auth/signup", payload, {
		withAuth: true,
	});
}

export async function googleSignup(
	payload: GoogleLoginPayload,
): Promise<ApiResponse<AuthResponse>> {
	return apiPost<ApiResponse<AuthResponse>>("/google/signup", payload, {
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
			return { data: res, error: undefined };
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Login failed";
			dispatch(loginFailure(message));
			return { error: err };
		}
	};

export const googleLoginUser =
	(session: Session) => async (dispatch: AppDispatch) => {
		try {
			dispatch(loginStart());
			const payload = {
				token: session.access_token,
				email: session.user?.email!,
				supabaseId: session.user.id,
				name: session.user.user_metadata.full_name,
				picture: session.user.user_metadata.avatar_url,
				user: {
					id: session.user.id,
					email: session.user.email!,
					name: session.user.user_metadata.full_name,
					avatar: session.user.user_metadata.avatar_url,
					createdAt: new Date().toISOString(),
				},

				userTeam: null,
			};
			await authApi.googleLogin(payload); // API call

			dispatch(loginSuccess(payload));

			return { data: payload, error: undefined };
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Login failed";
			dispatch(loginFailure(message));
			return { error: err };
		}
	};
export const signupUser =
	(payload: SignupPayload) => async (dispatch: AppDispatch) => {
		try {
			dispatch(loginStart());
			const res = await authApi.signup(payload);
			dispatch(loginSuccess(res)); // reuse loginSuccess (token + user)
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Login failed";
			dispatch(loginFailure(message || "Signup failed"));
		}
	};
export const googleSignupUser =
	(session: {
		access_token: string;
		user: {
			id: string;
			email: string;
			user_metadata: {
				full_name: string;
				avatar_url: string;
			};
		};
	}) =>
	async (dispatch: AppDispatch) => {
		try {
			dispatch(loginStart());

			const payload = {
				email: session.user.email,
				name: session.user.user_metadata.full_name,
				picture: session.user.user_metadata.avatar_url,
				supabaseId: session.user.id,
			};

			const res = await authApi.googleSignup(payload);

			dispatch(loginSuccess(res));
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Login failed";

			dispatch(loginFailure(message));
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

		// ✅ Clear local state
		dispatch(logout()); // this should reset your Redux state (user, token, etc.)

		// ✅ Clear the cookie client-side
		document.cookie = "refreshToken=; Path=/; Max-Age=0;";
	} catch (err: unknown) {
		console.error("Logout error:", err);
		const message = err instanceof Error ? err.message : "Login failed";
		dispatch(loginFailure(message || "Logout failed"));
	}
};
