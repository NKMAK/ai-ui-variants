import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { uiVariants } from "vite-plugin-ui-variants";

export default defineConfig({
  plugins: [
    react(),
    uiVariants({
      generator: "claude-code",
      promptTemplatePath: ".ui-variants/claude-code-prompt.md",
      promptContextPaths: [".ui-variants/project-context.md"],
    }),
  ],
});
