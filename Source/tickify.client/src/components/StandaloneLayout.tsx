import type { ReactNode } from "react";

interface StandaloneLayoutProps {
  children: ReactNode;
}

export function StandaloneLayout({ children }: StandaloneLayoutProps) {
  return <div className="min-h-screen">{children}</div>;
}
