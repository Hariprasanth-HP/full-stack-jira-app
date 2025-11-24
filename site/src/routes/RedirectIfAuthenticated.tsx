import { useAppSelector } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export function RedirectIfAuth({ children }: { children: JSX.Element }) {
  const auth = useAppSelector((s) => s.auth);

  if (auth.isAuthenticated) {
    if (auth.userTeam) {
      return <Navigate to="/team" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return children;
}
