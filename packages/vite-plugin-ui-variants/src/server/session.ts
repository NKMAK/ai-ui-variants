import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { SourceLocation, Session } from "../shared/types.ts";
import type { CodeRange } from "./generator/types.ts";
import { appToRepoPath, sessionDir } from "./paths.ts";
import { restoreSnapshot, saveSnapshot } from "./snapshot.ts";

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

  const repoRelFile = appToRepoPath(source.file, context.appRoot, context.repoRoot);
  assertCleanFiles(context.repoRoot, [repoRelFile]);

  const id = `session-${randomUUID()}`;
  const baseSnapshot = saveSnapshot(context.repoRoot, [repoRelFile]);
  const codeRange = extractCodeRange(context.repoRoot, repoRelFile, source.line);
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
): CodeRange {
  const content = fs.readFileSync(path.join(repoRoot, repoRelFile), "utf8");
  const lines = content.split("\n");
  const startLine = Math.max(1, line - 25);
  const endLine = Math.min(lines.length, line + 25);
  const selectedLines = lines.slice(startLine - 1, endLine);

  return {
    file: repoRelFile,
    startLine,
    endLine,
    content: selectedLines.join("\n"),
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
