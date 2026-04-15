/**
 * Navigate to login route without forcing a full page reload.
 * This prevents static hosts from returning 404 on deep-link redirects.
 */
export function navigateToLogin(replace = true): void {
  const loginPath = "/login";

  if (window.location.pathname === loginPath) {
    return;
  }

  if (replace) {
    window.history.replaceState(null, "", loginPath);
  } else {
    window.history.pushState(null, "", loginPath);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
}
