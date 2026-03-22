import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SessionSpinner from "./auth/SessionSpinner";

/**
 * Renders children only when the server has confirmed the session (not localStorage alone).
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return <SessionSpinner />;
  }
  if (!isAuthenticated) {
    return (
      <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
    );
  }
  return children;
}
