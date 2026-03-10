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
    chunkSizeWarningLimit: 1000, // Tăng ngưỡng warning lên 1000 kB
    rollupOptions: {
      onwarn(warning, warn) {
        // Bỏ qua cảnh báo về PURE annotation từ SignalR
        if (
          warning.code === "INVALID_ANNOTATION" &&
          warning.message.includes("signalr")
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/") || id.includes("node_modules/scheduler/")) {
            return "vendor-react";
          }
          // Radix UI
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          // Charts (tách riêng recharts vì khá lớn)
          if (id.includes("node_modules/recharts")) {
            return "vendor-recharts";
          }
          if (id.includes("node_modules/d3-") || id.includes("node_modules/victory-vendor")) {
            return "vendor-charts";
          }
          // i18n
          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) {
            return "vendor-i18n";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns") || id.includes("node_modules/react-date-range") || id.includes("node_modules/react-day-picker")) {
            return "vendor-date";
          }
          // Forms
          if (id.includes("node_modules/react-hook-form") || id.includes("node_modules/zod") || id.includes("node_modules/@hookform/")) {
            return "vendor-forms";
          }
          // Real-time / communication
          if (id.includes("node_modules/@microsoft/signalr")) {
            return "vendor-signalr";
          }
          // Icons
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // Other vendor libs
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
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
