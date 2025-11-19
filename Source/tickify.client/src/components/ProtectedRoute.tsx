import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import { canAccessRoute, getRedirectPath, type UserRole } from "../types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const isAuthenticated = authService.isAuthenticated();
    
    // Determine user role
    let userRole: UserRole = "guest";
    if (isAuthenticated) {
      const user = authService.getCurrentUser();
      userRole = (user?.role?.toLowerCase() as UserRole) || "user";
    }

    // Check if user can access this route
    const hasAccess = canAccessRoute(currentPath, userRole);

    if (!hasAccess) {
      const redirectPath = getRedirectPath(currentPath);
      
      // Save the attempted URL for redirect after login
      if (redirectPath === "/login") {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
      
      navigate(redirectPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}
