import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { uiVariants } from "vite-plugin-ui-variants";

const isPages = process.env.GITHUB_PAGES === "true";
const tailwindPlugin = tailwindcss() as unknown as PluginOption[];

export default defineConfig({
  base: isPages ? "/ai-ui-variants/" : "/",
  plugins: [
    uiVariants({
      generator: "claude-code",
      promptTemplatePath: ".ui-variants/claude-code-prompt.md",
      promptContextPaths: [".ui-variants/project-context.md"],
    }),
    ...tailwindPlugin,
    react(),
  ],
});
