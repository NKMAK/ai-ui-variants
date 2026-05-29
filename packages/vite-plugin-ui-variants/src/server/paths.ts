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
