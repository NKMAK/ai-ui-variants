import { execFileSync } from "node:child_process";
import path from "node:path";

const UI_AGENT_DIR = ".ui-agent";

export function resolveRepoRoot(cwd: string): string {
  return execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
}

export function appToRepoPath(
  appRel: string,
  appRoot: string,
  repoRoot: string,
): string {
  const absoluteAppFile = path.resolve(appRoot, appRel);
  return path.relative(repoRoot, absoluteAppFile);
}

export class SourcePathError extends Error {}

export function assertSafeAppRelPath(
  appRel: string,
  appRoot: string,
  repoRoot: string,
): void {
  if (typeof appRel !== "string" || appRel.length === 0) {
    throw new SourcePathError("Source path is empty.");
  }

  if (path.isAbsolute(appRel)) {
    throw new SourcePathError(`Source path must be app-relative: ${appRel}`);
  }

  if (appRel.includes("\\")) {
    throw new SourcePathError(`Source path must use POSIX separators: ${appRel}`);
  }

  const normalizedAppRoot = path.resolve(appRoot);
  const normalizedRepoRoot = path.resolve(repoRoot);
  const absoluteAppFile = path.resolve(normalizedAppRoot, appRel);
  const appRelative = path.relative(normalizedAppRoot, absoluteAppFile);

  if (
    appRelative === "" ||
    appRelative.startsWith("..") ||
    path.isAbsolute(appRelative)
  ) {
    throw new SourcePathError(`Source path escapes app root: ${appRel}`);
  }

  const repoRelative = path.relative(normalizedRepoRoot, absoluteAppFile);

  if (
    repoRelative === "" ||
    repoRelative.startsWith("..") ||
    path.isAbsolute(repoRelative)
  ) {
    throw new SourcePathError(`Source path escapes repo root: ${appRel}`);
  }
}

export function uiAgentDir(repoRoot: string): string {
  return path.join(repoRoot, UI_AGENT_DIR);
}

export function sessionDir(repoRoot: string, sid: string): string {
  return path.join(uiAgentDir(repoRoot), "sessions", sid);
}

export function patchesDir(repoRoot: string, sid: string): string {
  return path.join(sessionDir(repoRoot, sid), "patches");
}

export function worktreeDir(repoRoot: string, sid: string, variantId: string): string {
  return path.join(uiAgentDir(repoRoot), "worktrees", sid, variantId);
}
