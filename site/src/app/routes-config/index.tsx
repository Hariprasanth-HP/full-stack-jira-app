// src/AppRoutes.tsx
import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import TeamPage from "@/app/routes/company/page";
import LoginPage from "@/app/routes/login/page";
import SignupPage from "@/app/routes/signup/signup";
import NotFoundPage from "@/components/not-found";
import AuthCallback from "./callback";
import ProtectedRoutes from "./protectedRoutes";
import { RequireAuth } from "./RequireAuth";

export default function AppRoutes() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH}>
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/team" replace />} />

          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<AuthCallback />} />
          <Route
            path="/team"
            element={
              <RequireAuth>
                <TeamPage />
              </RequireAuth>
            }
          />
          <Route
            path="/team/*"
            element={
              <RequireAuth>
                <ProtectedRoutes />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
