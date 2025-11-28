import { useAppSelector } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export function RedirectIfAuth({ children }) {
  const auth = useAppSelector((s) => s.auth);

  if (auth.isAuthenticated) {
    if (auth.userTeam) {
      return <Navigate to="/team" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return children;
}
