import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";

import type { SourceLocation, Session } from "../shared/types.ts";
import type { CodeRange } from "./generator/types.ts";
import { appToRepoPath, assertSafeAppRelPath, sessionDir } from "./paths.ts";
import { restoreSnapshot, saveSnapshot } from "./snapshot.ts";

type TraverseFn = typeof import("@babel/traverse").default;

const traverse: TraverseFn =
  (_traverse as unknown as { default?: TraverseFn }).default ??
  (_traverse as TraverseFn);

export type SessionContext = {
  appRoot: string;
  repoRoot: string;
};

export type SessionState = {
  session: Session;
  repoRelFiles: string[];
  codeRange: CodeRange;
};

export class ConflictError extends Error {}

export class NotFoundError extends Error {}

let activeSession: SessionState | null = null;

export function getActiveSession(): Session | null {
  return activeSession?.session ?? null;
}

export function getSessionState(sessionId: string): SessionState {
  if (activeSession?.session.id !== sessionId) {
    throw new NotFoundError(`Session not found: ${sessionId}`);
  }

  return activeSession;
}

export function startSession(
  context: SessionContext,
  source: SourceLocation,
): SessionState {
  if (activeSession !== null) {
    throw new ConflictError("Another session is already active.");
  }

  assertSafeAppRelPath(source.file, context.appRoot, context.repoRoot);
  const repoRelFile = appToRepoPath(source.file, context.appRoot, context.repoRoot);
  assertCleanFiles(context.repoRoot, [repoRelFile]);

  const id = `session-${randomUUID()}`;
  const baseSnapshot = saveSnapshot(context.repoRoot, [repoRelFile]);
  const codeRange = extractCodeRange(
    context.repoRoot,
    repoRelFile,
    source.line,
    source.column,
  );
  const session: Session = {
    id,
    source,
    instruction: "",
    baseSnapshot,
    variants: [],
    currentIndex: -1,
    locked: false,
    status: "idle",
    createdAt: new Date().toISOString(),
  };

  fs.mkdirSync(sessionDir(context.repoRoot, id), { recursive: true });

  activeSession = {
    session,
    repoRelFiles: [repoRelFile],
    codeRange,
  };
  persistSession(context.repoRoot, session);

  return activeSession;
}

export async function withSessionLock<T>(
  context: SessionContext,
  sessionId: string,
  fn: (state: SessionState) => Promise<T> | T,
): Promise<T> {
  const state = getSessionState(sessionId);

  if (state.session.locked) {
    throw new ConflictError("Session is locked by another operation.");
  }

  state.session.locked = true;
  persistSession(context.repoRoot, state.session);

  try {
    return await fn(state);
  } finally {
    state.session.locked = false;
    persistSession(context.repoRoot, state.session);
  }
}

export function restoreSessionSnapshot(
  context: SessionContext,
  state: SessionState,
): void {
  restoreSnapshot(context.repoRoot, state.session.baseSnapshot);
}

export function refreshSessionCodeRange(
  context: SessionContext,
  state: SessionState,
): CodeRange {
  const repoRelFile = state.repoRelFiles[0];

  if (repoRelFile === undefined) {
    throw new ConflictError("Session has no target file.");
  }

  state.codeRange = extractCodeRange(
    context.repoRoot,
    repoRelFile,
    state.session.source.line,
    state.session.source.column,
  );

  return state.codeRange;
}

export function releaseSession(sessionId: string): void {
  if (activeSession?.session.id === sessionId) {
    activeSession = null;
  }
}

export function persistSession(repoRoot: string, session: Session): void {
  fs.mkdirSync(sessionDir(repoRoot, session.id), { recursive: true });
  fs.writeFileSync(
    path.join(sessionDir(repoRoot, session.id), "session.json"),
    `${JSON.stringify(session, null, 2)}\n`,
    "utf8",
  );
}

export function extractCodeRange(
  repoRoot: string,
  repoRelFile: string,
  line: number,
  column: number,
): CodeRange {
  const content = fs.readFileSync(path.join(repoRoot, repoRelFile), "utf8");
  const lines = content.split("\n");
  const startLine = Math.max(1, line - 25);
  const endLine = Math.min(lines.length, line + 25);
  const selectedLines = lines.slice(startLine - 1, endLine);
  const targetRange = findTargetElementRange(content, line, column);

  return {
    file: repoRelFile,
    startLine,
    endLine,
    selectedLine: line,
    targetStartLine: targetRange.startLine,
    targetEndLine: targetRange.endLine,
    content: selectedLines.join("\n"),
  };
}

function findTargetElementRange(
  content: string,
  line: number,
  column: number,
): { startLine: number; endLine: number } {
  try {
    const ast = parse(content, {
      sourceType: "module",
      allowReturnOutsideFunction: true,
      plugins: ["jsx", "typescript"],
    });
    let targetRange: { startLine: number; endLine: number } | null = null;

    traverse(ast, {
      JSXElement(nodePath) {
        const loc = nodePath.node.loc;
        const openingStart = nodePath.node.openingElement.loc?.start;

        if (
          loc == null ||
          openingStart === undefined ||
          openingStart.line !== line ||
          openingStart.column + 1 !== column
        ) {
          return;
        }

        targetRange = {
          startLine: loc.start.line,
          endLine: loc.end.line,
        };
        nodePath.stop();
      },
    });

    if (targetRange !== null) {
      return targetRange;
    }
  } catch {
    // Fall back to a tight line window if the file is temporarily unparsable.
  }

  return {
    startLine: Math.max(1, line - 2),
    endLine: line + 2,
  };
}

function assertCleanFiles(repoRoot: string, repoRelFiles: string[]): void {
  for (const repoRelFile of repoRelFiles) {
    const status = execFileSync(
      "git",
      ["-C", repoRoot, "status", "--porcelain", "--", repoRelFile],
      { encoding: "utf8" },
    );

    if (status.trim().length > 0) {
      throw new ConflictError(`Target file has uncommitted changes: ${repoRelFile}`);
    }
  }
}
