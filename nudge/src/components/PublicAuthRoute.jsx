import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SessionSpinner from "./auth/SessionSpinner";

/** Auth screens: hide while session is being validated; redirect if already signed in. */
export default function PublicAuthRoute({ children }) {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <SessionSpinner />;
  }
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return children;
}
