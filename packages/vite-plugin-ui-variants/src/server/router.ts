import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";

import type { ViteDevServer } from "vite";

import type {
  ApiErrorResponse,
  ApplyVariantResponse,
  DiscardSessionResponse,
  GenerateMode,
  GenerateVariantsRequest,
  GenerateVariantsResponse,
  GetSessionResponse,
  PreviewVariantResponse,
  Session,
  SourceLocation,
  StartSessionResponse,
  UiVariantsOptions,
  Variant,
} from "../shared/types.ts";
import { ClaudeCodeGenerator } from "./generator/claude-code.ts";
import { MockGenerator } from "./generator/mock.ts";
import type { VariantGenerator } from "./generator/types.ts";
import { applyPatch, applyPatchContent, validatePatch } from "./patch.ts";
import { SourcePathError, patchesDir, resolveRepoRoot, worktreeDir } from "./paths.ts";
import {
  ConflictError,
  NotFoundError,
  getActiveSession,
  persistSession,
  refreshSessionCodeRange,
  releaseSession,
  restoreSessionSnapshot,
  startSession,
  withSessionLock,
  type SessionContext,
  type SessionState,
} from "./session.ts";
import {
  applyChangesAndDiff,
  createWorktrees,
  removePatches,
  removeWorktrees,
} from "./worktree.ts";

type NextFunction = (error?: unknown) => void;
type Handler = (req: IncomingMessage, res: ServerResponse, next: NextFunction) => void;

type StartBody = SourceLocation | { source: SourceLocation };
type GenerateBody = Partial<GenerateVariantsRequest>;

export function createRouter(
  server: ViteDevServer,
  options: UiVariantsOptions = {},
): Handler {
  const appRoot = options.appRoot ?? server.config.root;
  const repoRoot = resolveRepoRoot(appRoot);
  const context: SessionContext = { appRoot, repoRoot };
  const generator = createGenerator(options, repoRoot);

  return (req, res, next) => {
    void handleRequest(req, res, context, generator).catch((error: unknown) => {
      if (error instanceof ConflictError) {
        sendJson(res, 409, { ok: false, error: error.message });
        return;
      }

      if (error instanceof NotFoundError) {
        sendJson(res, 404, { ok: false, error: error.message });
        return;
      }

      if (error instanceof SourcePathError) {
        sendJson(res, 400, { ok: false, error: error.message });
        return;
      }

      if (error instanceof Error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }

      next(error);
    });
  };
}

function createGenerator(
  options: UiVariantsOptions,
  repoRoot: string,
): VariantGenerator {
  if (options.generator === "claude-code") {
    return new ClaudeCodeGenerator({
      cwd: repoRoot,
      promptTemplatePath: options.promptTemplatePath,
      promptContextPaths: options.promptContextPaths,
    });
  }

  return new MockGenerator();
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  context: SessionContext,
  generator: VariantGenerator,
): Promise<void> {
  const method = req.method ?? "GET";
  const segments = getPathSegments(req);

  if (method === "POST" && matches(segments, ["session", "start"])) {
    const body = await readJsonBody<StartBody>(req);
    const source = normalizeStartBody(body);
    const state = startSession(context, source);
    sendJson<StartSessionResponse>(res, 200, {
      ok: true,
      session: state.session,
    });
    return;
  }

  if (method === "GET" && segments[0] === "session" && segments.length === 2) {
    const session = getActiveSession();

    if (session === null || session.id !== segments[1]) {
      sendJson<GetSessionResponse>(res, 200, { ok: true, session: null });
      return;
    }

    sendJson<GetSessionResponse>(res, 200, { ok: true, session });
    return;
  }

  if (
    method === "POST" &&
    segments[0] === "session" &&
    segments[2] === "generate-variants" &&
    segments.length === 3
  ) {
    const sessionId = requiredSegment(segments[1], "sessionId");
    const body = await readJsonBody<GenerateBody>(req);
    const generateBody = normalizeGenerateBody(body);
    const session = await generateVariants(
      context,
      generator,
      sessionId,
      generateBody.instruction,
      generateBody.count,
      generateBody.mode,
    );
    sendJson<GenerateVariantsResponse>(res, 200, {
      ok: true,
      session,
      variants: session.variants,
    });
    return;
  }

  if (
    method === "POST" &&
    segments[0] === "session" &&
    segments[2] === "preview" &&
    segments.length === 4
  ) {
    const sessionId = requiredSegment(segments[1], "sessionId");
    const variantId = requiredSegment(segments[3], "variantId");
    const { session, variant } = await previewVariant(context, sessionId, variantId);
    sendJson<PreviewVariantResponse>(res, 200, {
      ok: true,
      session,
      currentVariant: variant,
    });
    return;
  }

  if (
    method === "POST" &&
    segments[0] === "session" &&
    segments[2] === "apply" &&
    segments.length === 4
  ) {
    const sessionId = requiredSegment(segments[1], "sessionId");
    const variantId = requiredSegment(segments[3], "variantId");
    const { session, variant } = await applyVariant(context, sessionId, variantId);
    sendJson<ApplyVariantResponse>(res, 200, {
      ok: true,
      session,
      appliedVariant: variant,
    });
    return;
  }

  if (
    method === "POST" &&
    segments[0] === "session" &&
    segments[2] === "discard" &&
    segments.length === 3
  ) {
    const sessionId = requiredSegment(segments[1], "sessionId");
    const session = await discardSession(context, sessionId);
    sendJson<DiscardSessionResponse>(res, 200, {
      ok: true,
      session,
    });
    return;
  }

  sendJson<ApiErrorResponse>(res, 404, {
    ok: false,
    error: "Unknown UI agent endpoint.",
  });
}

async function generateVariants(
  context: SessionContext,
  generator: VariantGenerator,
  sessionId: string,
  instruction: string,
  count: number,
  mode: GenerateMode,
): Promise<Session> {
  return withSessionLock(context, sessionId, async (state) => {
    state.session.status = "generating";
    state.session.instruction = instruction;
    persistSession(context.repoRoot, state.session);

    try {
      const seedPatch = prepareGenerationBase(context, state, mode);
      const outputs = await generator.generate({
        instruction,
        selectedSource: {
          ...state.session.source,
          file: state.repoRelFiles[0] ?? state.session.source.file,
        },
        codeRange: state.codeRange,
        count,
      });
      const variants: Variant[] = outputs.map((output, index) => ({
        ...output,
        id: `variant-${index + 1}`,
        status: "pending",
      }));

      createWorktrees(
        context.repoRoot,
        sessionId,
        variants.map((variant) => variant.id),
        seedPatch,
      );
      fs.mkdirSync(patchesDir(context.repoRoot, sessionId), { recursive: true });

      for (const variant of variants) {
        try {
          const patch = applyChangesAndDiff(
            context.repoRoot,
            worktreeDir(context.repoRoot, sessionId, variant.id),
            variant.changes,
          );
          const patchPath = path.join(
            patchesDir(context.repoRoot, sessionId),
            `${variant.id}.patch`,
          );
          fs.writeFileSync(patchPath, patch, "utf8");

          const validation = validatePatch(patch);

          if (validation.ok) {
            variant.status = "ready";
            variant.patchPath = patchPath;
          } else {
            variant.status = "failed";
            variant.error = validation.reason;
          }
        } catch (error: unknown) {
          variant.status = "failed";
          variant.error =
            error instanceof Error ? error.message : "Unknown variant error.";
        }
      }

      state.session.variants = variants;
      state.session.currentIndex = -1;
      state.session.status = variants.some((variant) => variant.status === "ready")
        ? "ready"
        : "failed";
      persistSession(context.repoRoot, state.session);
    } catch (error: unknown) {
      state.session.status = "failed";
      persistSession(context.repoRoot, state.session);
      throw error;
    }

    return state.session;
  });
}

function prepareGenerationBase(
  context: SessionContext,
  state: SessionState,
  mode: GenerateMode,
): string | undefined {
  if (mode === "replace") {
    restoreSessionSnapshot(context, state);
    removeWorktrees(context.repoRoot, state.session.id);
    removePatches(context.repoRoot, state.session.id);
    refreshSessionCodeRange(context, state);
    return undefined;
  }

  const variant = getReadyOrPreviewingVariant(
    state.session,
    requiredCurrentVariantId(state.session),
  );
  const seedPatch = fs.readFileSync(requiredPatchPath(variant), "utf8");

  restoreSessionSnapshot(context, state);
  applyPatchContent(context.repoRoot, seedPatch);
  refreshSessionCodeRange(context, state);
  removeWorktrees(context.repoRoot, state.session.id);
  removePatches(context.repoRoot, state.session.id);

  return seedPatch;
}

async function previewVariant(
  context: SessionContext,
  sessionId: string,
  variantId: string,
): Promise<{ session: Session; variant: Variant }> {
  return withSessionLock(context, sessionId, (state) => {
    const variant = getReadyVariant(state.session, variantId);
    restoreSessionSnapshot(context, state);
    applyPatch(context.repoRoot, requiredPatchPath(variant));

    state.session.variants = state.session.variants.map((item) => ({
      ...item,
      status:
        item.id === variant.id
          ? "previewing"
          : item.status === "previewing"
            ? "ready"
            : item.status,
    }));
    state.session.currentIndex = state.session.variants.findIndex(
      (item) => item.id === variant.id,
    );
    state.session.status = "previewing";
    persistSession(context.repoRoot, state.session);

    return {
      session: state.session,
      variant: getReadyOrPreviewingVariant(state.session, variantId),
    };
  });
}

async function applyVariant(
  context: SessionContext,
  sessionId: string,
  variantId: string,
): Promise<{ session: Session; variant: Variant }> {
  return withSessionLock(context, sessionId, (state) => {
    const variant = getReadyOrPreviewingVariant(state.session, variantId);
    restoreSessionSnapshot(context, state);
    applyPatch(context.repoRoot, requiredPatchPath(variant));

    state.session.variants = state.session.variants.map((item) => ({
      ...item,
      status: item.id === variant.id ? "applied" : item.status,
    }));
    state.session.currentIndex = state.session.variants.findIndex(
      (item) => item.id === variant.id,
    );
    state.session.status = "applied";
    persistSession(context.repoRoot, state.session);
    removeWorktrees(context.repoRoot, sessionId);
    releaseSession(sessionId);

    return {
      session: state.session,
      variant: getAppliedVariant(state.session, variantId),
    };
  });
}

async function discardSession(
  context: SessionContext,
  sessionId: string,
): Promise<Session> {
  return withSessionLock(context, sessionId, (state) => {
    try {
      restoreSessionSnapshot(context, state);
      state.session.status = "discarded";
      persistSession(context.repoRoot, state.session);
    } finally {
      try {
        removeWorktrees(context.repoRoot, sessionId);
      } finally {
        releaseSession(sessionId);
      }
    }

    return state.session;
  });
}

function getReadyVariant(session: Session, variantId: string): Variant {
  const variant = getReadyOrPreviewingVariant(session, variantId);

  if (variant.status !== "ready" && variant.status !== "previewing") {
    throw new ConflictError(`Variant is not ready: ${variantId}`);
  }

  return variant;
}

function getReadyOrPreviewingVariant(session: Session, variantId: string): Variant {
  const variant = session.variants.find((item) => item.id === variantId);

  if (variant === undefined) {
    throw new NotFoundError(`Variant not found: ${variantId}`);
  }

  if (variant.status !== "ready" && variant.status !== "previewing") {
    throw new ConflictError(`Variant is not previewable: ${variantId}`);
  }

  return variant;
}

function getAppliedVariant(session: Session, variantId: string): Variant {
  const variant = session.variants.find((item) => item.id === variantId);

  if (variant === undefined) {
    throw new NotFoundError(`Variant not found: ${variantId}`);
  }

  return variant;
}

function requiredPatchPath(variant: Variant): string {
  if (variant.patchPath === undefined) {
    throw new ConflictError(`Variant has no patch: ${variant.id}`);
  }

  return variant.patchPath;
}

function requiredCurrentVariantId(session: Session): string {
  const variant = session.variants[session.currentIndex];

  if (variant === undefined) {
    throw new ConflictError("No current variant to refine.");
  }

  return variant.id;
}

function getPathSegments(req: IncomingMessage): string[] {
  const url = new URL(req.url ?? "/", "http://localhost");
  return url.pathname.split("/").filter(Boolean);
}

function matches(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((segment, index) => segment === expected[index])
  );
}

function requiredSegment(segment: string | undefined, name: string): string {
  if (segment === undefined) {
    throw new NotFoundError(`Missing ${name}.`);
  }

  return segment;
}

function normalizeStartBody(body: StartBody): SourceLocation {
  const source = "source" in body ? body.source : body;

  if (
    typeof source.file !== "string" ||
    typeof source.line !== "number" ||
    typeof source.column !== "number"
  ) {
    throw new Error("Invalid source location.");
  }

  return source;
}

function normalizeGenerateBody(body: GenerateBody): {
  instruction: string;
  count: number;
  mode: GenerateMode;
} {
  const mode = body.mode ?? "replace";

  if (mode !== "replace" && mode !== "refine") {
    throw new Error("Invalid generate mode.");
  }

  return {
    instruction: body.instruction ?? "",
    count: body.count ?? 3,
    mode,
  };
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

function sendJson<T>(res: ServerResponse, statusCode: number, body: T): void {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
