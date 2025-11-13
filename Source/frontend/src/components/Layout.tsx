import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={(page) => (window.location.href = `/${page}`)} />
      <main className="flex-1">{children}</main>
      <Footer onNavigate={(page) => (window.location.href = `/${page}`)} />
    </div>
  );
}
