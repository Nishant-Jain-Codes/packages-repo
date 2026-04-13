import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Convai signed URL — same path the package calls at runtime
      "/api/convai": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
