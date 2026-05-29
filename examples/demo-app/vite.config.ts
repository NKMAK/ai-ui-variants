import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { uiVariants } from "vite-plugin-ui-variants";

const isPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isPages ? "/ai-ui-variants/" : "/",
  plugins: [
    uiVariants({
      generator: "claude-code",
      promptTemplatePath: ".ui-variants/claude-code-prompt.md",
      promptContextPaths: [".ui-variants/project-context.md"],
    }),
    react(),
  ],
});
