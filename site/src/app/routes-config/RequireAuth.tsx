// src/routes/RequireAuth.tsx

import type React from "react";
import type { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAuth";

export const RequireAuth: React.FC<{ children: JSX.Element }> = ({
	children,
}) => {
	const auth = useAppSelector((s: any) => s.auth);
	const location = useLocation();
	console.log("auth", auth);
	if (!auth.isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return children;
};
