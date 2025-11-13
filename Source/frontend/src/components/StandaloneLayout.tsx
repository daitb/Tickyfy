import { Outlet } from "react-router-dom";

export function StandaloneLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
