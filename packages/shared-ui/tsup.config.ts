import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  // dts disabled until radix-ui TS2742 type portability issue is resolved
  // run `tsup --dts` manually or fix menubar.tsx type annotation before publishing
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  // tsup resolves paths from tsconfig.json automatically
});
