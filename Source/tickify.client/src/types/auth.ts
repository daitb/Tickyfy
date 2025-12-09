export type UserRole = "guest" | "user" | "organizer" | "staff" | "admin";

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  redirectTo?: string; // Where to redirect if unauthorized
}

// Define route permissions
export const routePermissions: RoutePermission[] = [
  // Public routes - accessible to everyone including guests
  { path: "/", allowedRoles: ["guest", "user", "organizer", "staff", "admin"] },
  { path: "/home", allowedRoles: ["guest", "user", "organizer", "staff", "admin"] },
  { path: "/listing", allowedRoles: ["guest", "user", "organizer", "staff", "admin"] },
  { path: "/event/:eventId", allowedRoles: ["guest", "user", "organizer", "staff", "admin"] },
  { path: "/event-reviews", allowedRoles: ["guest", "user", "organizer", "staff", "admin"] },
  { path: "/login", allowedRoles: ["guest"] },
  { path: "/register", allowedRoles: ["guest"] },
  { path: "/forgot-password", allowedRoles: ["guest"] },
  { path: "/reset-password", allowedRoles: ["guest"] },
  { path: "/email-verification", allowedRoles: ["guest", "user", "organizer", "staff", "admin"] },

  // User-only routes (authenticated users)
  { path: "/cart", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/checkout", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/success", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/my-tickets", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/order/:orderId", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/ticket/:ticketId", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/transfer-ticket/:ticketId", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/wishlist", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/waitlist", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/user-profile", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/notifications", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/notification-preferences", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/password-change", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/seat-selection", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/review-submission", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
  { path: "/refund-request", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },

  // Organizer routes
  { path: "/organizer-wizard", allowedRoles: ["organizer", "admin"], redirectTo: "/login" },
  { path: "/organizer-dashboard", allowedRoles: ["organizer", "admin"], redirectTo: "/login" },
  { path: "/event-management", allowedRoles: ["organizer", "admin"], redirectTo: "/login" },
  { path: "/event-analytics/:eventId", allowedRoles: ["organizer", "admin"], redirectTo: "/login" },
  { path: "/edit-event", allowedRoles: ["organizer", "admin"], redirectTo: "/login" },
  { path: "/promo-codes", allowedRoles: ["organizer", "admin"], redirectTo: "/login" },
  { path: "/seat-map-builder", allowedRoles: ["organizer", "admin"], redirectTo: "/login" },

  // Staff routes (for event staff/scanners)
  { path: "/qr-scanner", allowedRoles: ["staff", "organizer", "admin"], redirectTo: "/login" },
  { path: "/scan-history", allowedRoles: ["staff", "organizer", "admin"], redirectTo: "/login" },

  // Admin-only routes
  { path: "/admin-dashboard", allowedRoles: ["admin"], redirectTo: "/login" },
  { path: "/user-management", allowedRoles: ["admin"], redirectTo: "/login" },

  // Become organizer route (for logged-in users only)
  { path: "/become-organizer", allowedRoles: ["user", "organizer", "staff", "admin"], redirectTo: "/login" },
];

// Helper function to check if a user can access a route
export function canAccessRoute(path: string, userRole: UserRole): boolean {
  const permission = routePermissions.find((p) => {
    // Convert route pattern to regex for matching
    const pattern = p.path.replace(/:[^/]+/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });

  // If no permission defined, allow access (for safety, could be changed to deny)
  if (!permission) return true;

  // Map backend roles to frontend roles (Customer -> user)
  let normalizedRole = userRole.toLowerCase();
  if (normalizedRole === "customer") {
    normalizedRole = "user";
  }

  return permission.allowedRoles.includes(normalizedRole as UserRole);
}

// Get redirect path for unauthorized access
export function getRedirectPath(path: string): string {
  const permission = routePermissions.find((p) => {
    const pattern = p.path.replace(/:[^/]+/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });

  return permission?.redirectTo || "/";
}
