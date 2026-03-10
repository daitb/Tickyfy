import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    outDir: "build",
  },
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:5179",
    },
  },
});
