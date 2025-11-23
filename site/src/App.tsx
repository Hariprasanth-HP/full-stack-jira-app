// src/AppRoutes.tsx
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Page from "./pages/Dashboard/page";
import SignupPage from "./pages/signup/signup";
import LoginPage from "./pages/login/page";
import { RequireAuth } from "./routes/RequireAuth";
import { RedirectIfAuth } from "./routes/RedirectIfAuthenticated";

// Lazy pages

export default function AppRoutes() {
  // const = useAuth
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <Routes>
          <Route
            path="/signup"
            element={
              <RedirectIfAuth>
                <SignupPage />
              </RedirectIfAuth>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectIfAuth>
                <LoginPage />
              </RedirectIfAuth>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Page />
              </RequireAuth>
            }
          >
            <Route path="login" element={<>Login</>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
