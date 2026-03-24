import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SessionSpinner from "./auth/SessionSpinner";
import { isAdminLikeRole } from "../auth/roleAccess";

export default function AdminRoute({ children }) {
  const { user, refreshUser } = useAuth();
  const [resolvingRole, setResolvingRole] = useState(false);
  const hasKnownRole = user?.role != null && String(user.role).trim() !== "";
  const isAdmin = isAdminLikeRole(user?.role);
  useEffect(() => {
    if (hasKnownRole) {
      return;
    }
    let cancelled = false;
    setResolvingRole(true);
    void refreshUser()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) {
          setResolvingRole(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hasKnownRole, refreshUser]);
  if (resolvingRole) {
    return <SessionSpinner />;
  }
  if (!hasKnownRole) {
    // If role metadata is missing, allow route and let backend auth decide.
    return children;
  }
  if (!isAdmin) {
    return <Navigate to="/app/admin/insufficient" replace />;
  }
  return children;
}
