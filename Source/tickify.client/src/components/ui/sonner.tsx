"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "hsl(240 10% 3.9%)",
          "--normal-border": "hsl(240 5.9% 90%)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
