import { useAppSelector } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import React from 'react';

export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const auth = useAppSelector((s: any) => s.auth);

  if (auth.isAuthenticated) {
    if (auth.userTeam) {
      return <Navigate to="/team" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return children;
}
