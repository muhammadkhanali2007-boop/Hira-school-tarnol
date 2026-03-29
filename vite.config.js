import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admission: resolve(__dirname, "admission.html"),
        about: resolve(__dirname, "about.html"),
        classes: resolve(__dirname, "classes.html"),
        gallery: resolve(__dirname, "gallery.html"),
        contact: resolve(__dirname, "contact.html"),
      },
    },
  },
});
