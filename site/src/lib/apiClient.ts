// src/lib/apiClient.ts
import { store } from "../store";
import { setAuth } from "../slices/authSlice";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api";

// Internal refresh queue to avoid race conditions
let refreshingPromise: Promise<boolean> | null = null;

/**
 * Call /api/auth/refresh to get a new access token using the refresh cookie.
 * On success dispatches setAuth({ token, user }) and returns true.
 * On failure clears auth and returns false.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include", // IMPORTANT: send HttpOnly cookie
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        // refresh failed (revoked/expired)
        store.dispatch(setAuth({ token: null, user: null }));
        return false;
      }

      const json = await res.json().catch(() => null);
      const token = json?.token ?? null;
      const user = json?.user ?? null;

      if (token) {
        store.dispatch(setAuth({ token, user }));
        return true;
      } else {
        // server didn't return token -> treat as failed
        store.dispatch(setAuth({ token: null, user: null }));
        return false;
      }
    } catch (err) {
      console.error("refreshAccessToken error", err);
      store.dispatch(setAuth({ token: null, user: null }));
      return false;
    } finally {
      // clear the refreshing promise so next request can create a new one if needed
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

async function apiRequest<T = any>(
  path: string,
  method: Method = "GET",
  body?: unknown,
  opts?: { retry?: boolean; withAuth?: boolean }
): Promise<T> {
  const { retry = true, withAuth = true } = opts ?? {};

  const token = store.getState().auth?.token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (withAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include", // send cookies (refresh token cookie is HttpOnly)
  });

  // If request is unauthorized and retry is allowed, try refresh flow
  if (
    res.status === 401 &&
    retry &&
    !path?.includes("login") &&
    !path?.includes("signup") &&
    !path?.includes("logout")
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // retry original request once with new token
      const newToken = store.getState().auth?.token;
      const retryHeaders = { ...headers };
      if (withAuth && newToken)
        retryHeaders["Authorization"] = `Bearer ${newToken}`;

      const retryRes = await fetch(`${API_BASE}${path}`, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: "include",
      });

      if (!retryRes.ok) {
        const errBody = await safeParse(retryRes);
        throw new ApiError(
          retryRes.status,
          errBody?.error ?? errBody?.message ?? "Request failed after refresh"
        );
      }
      const parsed = await safeParse(retryRes);
      return parsed as T;
    } else {
      // refresh failed -> throw so app can redirect to login
      throw new ApiError(401, "Authentication required");
    }
  }

  if (!res.ok) {
    const errBody = await safeParse(res);
    throw new ApiError(
      res.status,
      errBody?.error ?? errBody?.message ?? "Request failed"
    );
  }

  return (await safeParse(res)) as T;
}

async function safeParse(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? "API Error");
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/* Convenience wrappers */
export async function apiGet<T = any>(
  path: string,
  opts?: { withAuth?: boolean }
) {
  return apiRequest<T>(path, "GET", undefined, {
    withAuth: opts?.withAuth ?? true,
  });
}
export async function apiPost<T = any>(
  path: string,
  body?: unknown,
  opts?: { withAuth?: boolean }
) {
  return apiRequest<T>(path, "POST", body, {
    withAuth: opts?.withAuth ?? true,
  });
}

export async function apiPatch<T = any>(
  path: string,
  body?: unknown,
  opts?: { withAuth?: boolean }
) {
  return apiRequest<T>(path, "PATCH", body, {
    withAuth: opts?.withAuth ?? true,
  });
}
export async function apiPut<T = any>(
  path: string,
  body?: unknown,
  opts?: { withAuth?: boolean }
) {
  return apiRequest<T>(path, "PUT", body, { withAuth: opts?.withAuth ?? true });
}
export async function apiDelete<T = any>(
  path: string,
  opts?: { withAuth?: boolean }
) {
  return apiRequest<T>(path, "DELETE", undefined, {
    withAuth: opts?.withAuth ?? true,
  });
}

/* Export error type so callers can inspect status */
export { ApiError };
