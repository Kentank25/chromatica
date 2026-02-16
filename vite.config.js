import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      lucide: path.resolve(
        __dirname,
        "node_modules/lucide/dist/esm/lucide/src/lucide.js",
      ),
    },
  },
});
