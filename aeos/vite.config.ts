import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // OpenClaw (TypeScript/Node.js) — port 18789
      "/api/openclaw": { target: "http://localhost:18789", changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/openclaw/, "") },
      "/ws/openclaw":  { target: "ws://localhost:18789",   ws: true,           rewrite: (p) => p.replace(/^\/ws\/openclaw/, "") },
      // ZeroClaw (Rust) — port 3000
      "/api/zeroclaw": { target: "http://localhost:3000",  changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/zeroclaw/, "") },
      "/ws/zeroclaw":  { target: "ws://localhost:3000",    ws: true,           rewrite: (p) => p.replace(/^\/ws\/zeroclaw/, "") },
      // PicoClaw (Go) — port 18790
      "/api/picoclaw": { target: "http://localhost:18790", changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/picoclaw/, "") },
      "/ws/picoclaw":  { target: "ws://localhost:18790",   ws: true,           rewrite: (p) => p.replace(/^\/ws\/picoclaw/, "") },
      // Default → OpenClaw
      "/api": { target: "http://localhost:18789", changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") },
      "/ws":  { target: "ws://localhost:18789",   ws: true },
    },
  },
});
