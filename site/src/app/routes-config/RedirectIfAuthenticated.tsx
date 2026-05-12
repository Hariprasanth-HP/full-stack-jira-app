import type React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAuth";

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
