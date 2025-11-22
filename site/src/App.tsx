// src/AppRoutes.tsx
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Page from "./pages/Dashboard/page";
import SignupPage from "./pages/signup/signup";

// Lazy pages

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<SignupPage />} />

          <Route path="/" element={<Page />}>
            {/* public */}
            <Route path="login" element={<>Login</>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
