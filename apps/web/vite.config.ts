import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  define: { __COMMIT__: JSON.stringify(process.env["SOURCE_COMMIT"] ?? "dev"), __VERSION__: JSON.stringify("0.0.0") },
  build: { outDir: "dist" },
});
