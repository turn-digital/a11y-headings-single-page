import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    ssr: {
      // Externalize Carbon to avoid CommonJS/ESM issues
      external: ["@carbon/react", "@carbon/icons-react", "@carbon/utilities"],
    },
    optimizeDeps: {
      include: ["@carbon/react", "@carbon/icons-react"],
    },
  },
});
