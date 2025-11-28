// src/routes/RequireAuth.tsx
import { useAppSelector } from "@/hooks/useAuth";
import React, { type JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

export const RequireAuth: React.FC<{ children: JSX.Element }> = ({
  children,
}) => {
  const auth = useAppSelector((s) => s.auth);
  const location = useLocation();
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } 

  return children;
};
