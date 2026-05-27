import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { FileChange, FileEdit } from "../shared/types.ts";
import { uiAgentDir, worktreeDir } from "./paths.ts";

export function createWorktrees(
  repoRoot: string,
  sid: string,
  variantIds: string[],
): void {
  for (const variantId of variantIds) {
    const targetDir = worktreeDir(repoRoot, sid, variantId);
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    execFileSync("git", ["-C", repoRoot, "worktree", "add", targetDir, "HEAD"], {
      stdio: "pipe",
    });
  }
}

export function applyChangesAndDiff(
  repoRoot: string,
  worktreePath: string,
  changes: FileChange[],
): string {
  const fileContents = new Map<string, string>();

  for (const change of changes) {
    const filePath = path.join(worktreePath, change.file);
    const currentContent =
      fileContents.get(change.file) ?? fs.readFileSync(filePath, "utf8");
    const nextContent = applyEdits(currentContent, change.edits);

    fileContents.set(change.file, nextContent);
  }

  for (const [repoRelFile, content] of fileContents) {
    const filePath = path.join(worktreePath, repoRelFile);
    fs.writeFileSync(filePath, content, "utf8");
  }

  return execFileSync("git", ["-C", worktreePath, "diff"], {
    encoding: "utf8",
  });
}

export function removeWorktrees(repoRoot: string, sid: string): void {
  const sessionWorktreeDir = path.join(uiAgentDir(repoRoot), "worktrees", sid);

  if (!fs.existsSync(sessionWorktreeDir)) {
    return;
  }

  for (const variantId of fs.readdirSync(sessionWorktreeDir)) {
    const targetDir = path.join(sessionWorktreeDir, variantId);

    if (!fs.statSync(targetDir).isDirectory()) {
      continue;
    }

    execFileSync(
      "git",
      ["-C", repoRoot, "worktree", "remove", "--force", targetDir],
      { stdio: "pipe" },
    );
  }
}

function applyEdits(content: string, edits: FileEdit[]): string {
  let nextContent = content;

  for (const edit of edits) {
    const occurrenceCount = countOccurrences(nextContent, edit.search);

    if (occurrenceCount === 0) {
      throw new Error("Search text was not found in target file.");
    }

    if (occurrenceCount > 1) {
      throw new Error("Search text matched multiple locations in target file.");
    }

    nextContent = nextContent.replace(edit.search, edit.replace);
  }

  return nextContent;
}

function countOccurrences(content: string, search: string): number {
  if (search.length === 0) {
    throw new Error("Search text must not be empty.");
  }

  return content.split(search).length - 1;
}
