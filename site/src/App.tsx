// src/AppRoutes.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/routes/RequireAuth";
import Layout from "./routes/Layout";
import AuthForm from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Lazy pages

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* public */}
            <Route path="login" element={<AuthForm />} />

            {/* protected routes */}
            <Route
              path="projects"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />

            {/* 404 */}
            <Route path="*" element={<>Not found</>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
