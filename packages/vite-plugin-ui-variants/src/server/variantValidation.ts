import fs from "node:fs";
import path from "node:path";

import { parse } from "@babel/parser";

import { extractTouchedFiles } from "./patch.ts";

export type SyntaxValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };

const JSX_EXTENSIONS = new Set([".tsx", ".jsx"]);

export function validateChangedFiles(
  worktreeRoot: string,
  patch: string,
): SyntaxValidationResult {
  const touchedFiles = extractTouchedFiles(patch);

  for (const repoRelFile of touchedFiles) {
    const ext = path.extname(repoRelFile).toLowerCase();

    if (!JSX_EXTENSIONS.has(ext)) {
      continue;
    }

    const absPath = path.join(worktreeRoot, repoRelFile);

    if (!fs.existsSync(absPath)) {
      continue;
    }

    const code = fs.readFileSync(absPath, "utf8");

    try {
      parse(code, {
        sourceType: "module",
        allowReturnOutsideFunction: true,
        plugins: ["jsx", "typescript"],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        reason: `JSX syntax error in ${repoRelFile}: ${message}`,
      };
    }
  }

  return { ok: true };
}
