import fs from "node:fs/promises";
import path from "node:path";

import type { GenerateVariantsInput } from "./types.ts";

const DEFAULT_PROMPT_TEMPLATE_PATH = path.resolve(
  import.meta.dirname,
  "default-prompt.md",
);

export type BuildPromptOptions = {
  cwd: string;
  promptTemplatePath?: string;
  promptContextPaths?: string[];
};

export async function buildPrompt(
  input: GenerateVariantsInput,
  options: BuildPromptOptions,
): Promise<string> {
  const templatePath =
    options.promptTemplatePath === undefined
      ? DEFAULT_PROMPT_TEMPLATE_PATH
      : resolvePromptPath(options.cwd, options.promptTemplatePath);
  const [template, promptContext] = await Promise.all([
    fs.readFile(templatePath, "utf8"),
    readPromptContext(options.cwd, options.promptContextPaths ?? []),
  ]);

  return renderPrompt(template, input, promptContext);
}

async function readPromptContext(cwd: string, paths: string[]): Promise<string> {
  if (paths.length === 0) {
    return "(none)";
  }

  const chunks = await Promise.all(
    paths.map(async (contextPath) => {
      const resolvedPath = resolvePromptPath(cwd, contextPath);
      const content = await fs.readFile(resolvedPath, "utf8");
      const displayPath = path.isAbsolute(contextPath)
        ? contextPath
        : contextPath.replaceAll(path.sep, "/");

      return [`--- ${displayPath} ---`, content.trim()].join("\n");
    }),
  );

  return chunks.join("\n\n");
}

function renderPrompt(
  template: string,
  input: GenerateVariantsInput,
  promptContext: string,
): string {
  const selectedSourceJson = JSON.stringify(input.selectedSource, null, 2);
  const codeRangeJson = JSON.stringify(
    {
      file: input.codeRange.file,
      startLine: input.codeRange.startLine,
      endLine: input.codeRange.endLine,
      content: input.codeRange.content,
    },
    null,
    2,
  );

  return applyReplacements(template, {
    variantCount: String(input.count),
    targetFile: input.selectedSource.file,
    promptContext,
    selectedSourceJson,
    userInstruction: input.instruction,
    codeRangeJson,
  }).trim();
}

function applyReplacements(
  template: string,
  replacements: Record<string, string>,
): string {
  let rendered = template;

  for (const [key, value] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }

  return rendered;
}

function resolvePromptPath(cwd: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd, inputPath);
}
