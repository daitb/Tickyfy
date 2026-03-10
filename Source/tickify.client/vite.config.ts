import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
    outDir: "build",
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === "INVALID_ANNOTATION" &&
          warning.message.includes("signalr")
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks: {
          // React ecosystem - bundle cùng nhau
          "vendor-react": [
            "react",
            "react-dom",
            "react-router-dom",
            "react/jsx-runtime",
          ],
          // Radix UI
          "vendor-radix": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          // Recharts
          "vendor-recharts": ["recharts"],
          // Date utilities
          "vendor-date": ["date-fns", "react-date-range", "react-day-picker"],
          // Forms
          "vendor-forms": ["react-hook-form", "zod"],
          // i18n
          "vendor-i18n": ["i18next", "react-i18next"],
          // SignalR
          "vendor-signalr": ["@microsoft/signalr"],
          // Icons
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:5179",
    },
  },
});
