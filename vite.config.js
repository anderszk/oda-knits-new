import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const allowedHosts = (process.env.ALLOWED_HOSTS || "localhost")
  .split(/[,\s]+/)
  .filter(Boolean);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    hmr: {
      host: "localhost",
      clientPort: process.env.HMR_CLIENT_PORT ? Number(process.env.HMR_CLIENT_PORT) : 8000,
    },
    watch: {
      usePolling: process.env.VITE_USE_POLLING === "true",
      interval: 250,
    },
    proxy: {
      "/api": process.env.BACKEND_PROXY_TARGET || "http://localhost:8000",
    },
  },
  preview: {
    allowedHosts,
  },
});
