import { useNavigate } from "react-router-dom";

/**
 * Custom hook to replace the old onNavigate pattern
 * Use this in components instead of onNavigate prop
 */
export function useAppNavigate() {
  const navigate = useNavigate();

  const navigateTo = (page: string, id?: string) => {
    let path = `/${page}`;

    // Handle special routes with parameters
    if (id) {
      if (page === "event-detail") {
        path = `/event/${id}`;
      } else if (page === "order-detail") {
        path = `/order/${id}`;
      } else if (page === "ticket-detail") {
        path = `/ticket/${id}`;
      } else if (page === "transfer-ticket") {
        path = `/transfer-ticket/${id}`;
      } else if (page === "event-analytics") {
        path = `/event-analytics/${id}`;
      }
    }

    navigate(path);
    window.scrollTo(0, 0);
  };

  return navigateTo;
}
