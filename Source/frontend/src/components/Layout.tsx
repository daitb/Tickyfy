import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useNavigateAdapter } from "../hooks/useNavigateAdapter";

export function Layout() {
  const { handleNavigate } = useNavigateAdapter();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onNavigate={handleNavigate}
        currentPage=""
        isAuthenticated={false}
        userRole="user"
        onSearchOpenChange={() => {}}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
