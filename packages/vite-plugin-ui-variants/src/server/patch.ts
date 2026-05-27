import { execFileSync } from "node:child_process";
import path from "node:path";

import { DENYLIST, MAX_DIFF_LINES, MAX_FILES } from "../constants.ts";

export type PatchValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };

export function extractTouchedFiles(patch: string): string[] {
  const touchedFiles = new Set<string>();

  for (const line of patch.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
      const file = match?.[2] ?? match?.[1];

      if (file !== undefined) {
        touchedFiles.add(file);
      }
    }

    if (line.startsWith("+++ b/")) {
      touchedFiles.add(line.slice("+++ b/".length));
    }
  }

  return Array.from(touchedFiles);
}

export function validatePatch(patch: string): PatchValidationResult {
  const touchedFiles = extractTouchedFiles(patch);

  if (touchedFiles.length > MAX_FILES) {
    return {
      ok: false,
      reason: `Patch touches too many files: ${touchedFiles.length}.`,
    };
  }

  const deniedFile = touchedFiles.find(isDeniedFile);

  if (deniedFile !== undefined) {
    return {
      ok: false,
      reason: `Patch touches a denied file: ${deniedFile}.`,
    };
  }

  const diffLineCount = countChangedLines(patch);

  if (diffLineCount > MAX_DIFF_LINES) {
    return {
      ok: false,
      reason: `Patch is too large: ${diffLineCount} changed lines.`,
    };
  }

  return { ok: true };
}

export function applyPatch(repoRoot: string, patchPath: string): void {
  execFileSync("git", ["-C", repoRoot, "apply", patchPath], {
    stdio: "pipe",
  });
}

function countChangedLines(patch: string): number {
  return patch
    .split("\n")
    .filter(
      (line) =>
        (line.startsWith("+") && !line.startsWith("+++")) ||
        (line.startsWith("-") && !line.startsWith("---")),
    ).length;
}

function isDeniedFile(repoRelFile: string): boolean {
  const normalizedFile = normalizePath(repoRelFile);

  return DENYLIST.some((pattern) =>
    matchesDenyPattern(normalizedFile, pattern),
  );
}

function matchesDenyPattern(repoRelFile: string, pattern: string): boolean {
  const normalizedPattern = normalizePath(pattern);
  const fileName = path.posix.basename(repoRelFile);

  if (!normalizedPattern.includes("*")) {
    return repoRelFile === normalizedPattern || fileName === normalizedPattern;
  }

  if (normalizedPattern === ".env.*") {
    return fileName.startsWith(".env.");
  }

  if (
    normalizedPattern.startsWith("**/*") &&
    normalizedPattern.endsWith("*")
  ) {
    const needle = normalizedPattern.slice("**/*".length, -1).toLowerCase();
    return repoRelFile.toLowerCase().includes(needle);
  }

  if (
    normalizedPattern.startsWith("**/") &&
    normalizedPattern.endsWith("/**")
  ) {
    const directoryName = normalizedPattern.slice("**/".length, -"/**".length);
    return repoRelFile.split("/").includes(directoryName);
  }

  if (normalizedPattern.endsWith("/**")) {
    const directoryPrefix = normalizedPattern.slice(0, -"/**".length);
    return (
      repoRelFile === directoryPrefix ||
      repoRelFile.startsWith(`${directoryPrefix}/`)
    );
  }

  return false;
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
