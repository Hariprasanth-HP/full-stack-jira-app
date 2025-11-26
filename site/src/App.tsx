// src/AppRoutes.tsx
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Page from "./pages/Dashboard/page";
import SignupPage from "./pages/signup/signup";
import LoginPage from "./pages/login/page";
import { RequireAuth } from "./routes/RequireAuth";
import { RedirectIfAuth } from "./routes/RedirectIfAuthenticated";
import TeamPage from "./pages/company/page";
import NotFoundPage from "./components/not-found";
import AppErrorBoundary from "./error-boundary/error-boundary";
import { ManageTeam } from "./components/nav-team";
import { ThemeProvider } from "./components/theme-provider";
  import { useTheme } from "./components/theme-provider";
import AppRoutes from "./routes";

// Lazy pages

export default function App() {
  const {theme} = useTheme();
  return (
    <ThemeProvider defaultTheme={theme} storageKey="vite-ui-theme">
    <AppErrorBoundary>
     <AppRoutes/>
    </AppErrorBoundary>
    </ThemeProvider>
  );
}
