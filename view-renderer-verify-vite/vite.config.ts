import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Bundled deps (reports-setup, form-builder) include uuid's Node rng
      // which imports crypto.randomFillSync. Redirect to a browser-safe shim.
      crypto: path.resolve(__dirname, "src/crypto-shim.ts"),
    },
  },
  server: {
    proxy: {
      // Proxy PWA so the iframe loads same-origin (avoids CORS issues with Flutter WASM/assets)
      "/pwa": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/pwa/, ""),
        ws: true,
      },
    },
  },
});
