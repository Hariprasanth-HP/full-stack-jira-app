// src/AppRoutes.tsx
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/routes/RequireAuth";
import Layout from "./routes/Layout";
import AuthForm from "./pages/Login";
import Projects from "./pages/projects";
import ProjectsPage from "./pages/projectList";
import KanbanPage from "./pages/Kanban";
import EpicForm from "./pages/CommonForm";

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
              path="/"
              element={
                <RequireAuth>
                  <ProjectsPage />
                </RequireAuth>
              }
            />
            <Route
              path="project/:id"
              element={
                <RequireAuth>
                  <Projects />
                </RequireAuth>
              }
            />
            <Route
              path="epic/:id"
              element={
                <RequireAuth>
                  <KanbanPage />
                </RequireAuth>
              }
            />
            <Route
              path="details/:type/:id"
              element={
                <RequireAuth>
                  <EpicForm />
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
