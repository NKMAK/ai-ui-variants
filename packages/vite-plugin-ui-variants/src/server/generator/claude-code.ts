import { spawn } from "node:child_process";

import type { FileChange, FileEdit, VariantOutput } from "../../shared/types.ts";
import { buildPrompt } from "./prompt.ts";
import type { GenerateVariantsInput, VariantGenerator } from "./types.ts";

const CLAUDE_TIMEOUT_MS = 180_000;
const CLAUDE_MAX_BUFFER = 1024 * 1024 * 10;

type ClaudeCodeGeneratorOptions = {
  cwd: string;
};

export class ClaudeCodeGenerator implements VariantGenerator {
  readonly #cwd: string;

  constructor(options: ClaudeCodeGeneratorOptions) {
    this.#cwd = options.cwd;
  }

  async generate(input: GenerateVariantsInput): Promise<VariantOutput[]> {
    const prompt = buildPrompt(input);
    const { stdout } = await this.#runClaude(prompt);
    const resultText = extractClaudeResult(stdout);
    const parsed = parseVariantOutputs(resultText);
    const filtered = parsed.filter((variant) =>
      variant.changes.every((change) => change.file === input.selectedSource.file),
    );

    if (filtered.length === 0) {
      throw new Error("Claude Code returned no variants for the selected file.");
    }

    return filtered.slice(0, input.count);
  }

  async #runClaude(prompt: string): Promise<{ stdout: string }> {
    return runClaudeProcess(prompt, this.#cwd);
  }
}

function runClaudeProcess(prompt: string, cwd: string): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
        "claude",
        ["-p", prompt, "--output-format", "json", "--allowedTools", ""],
        {
          cwd,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      settle(reject, new Error(`Claude Code timed out after ${CLAUDE_TIMEOUT_MS}ms.`));
    }, CLAUDE_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;

      if (stdout.length > CLAUDE_MAX_BUFFER) {
        child.kill("SIGTERM");
        settle(reject, new Error("Claude Code output exceeded max buffer."));
      }
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      settle(reject, normalizeClaudeError(error));
    });

    child.on("close", (code, signal) => {
      if (settled) {
        return;
      }

      if (code === 0) {
        settle(resolve, { stdout });
        return;
      }

      const detail = stderr.trim() || `Claude Code exited with code ${code ?? signal}.`;
      settle(reject, new Error(detail));
    });

    function settle<T>(fn: (value: T) => void, value: T): void {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      fn(value);
    }
  });
}

function extractClaudeResult(stdout: string): string {
  const trimmed = stdout.trim();

  if (trimmed.length === 0) {
    throw new Error("Claude Code returned empty output.");
  }

  const wrapper: unknown = parseJson(trimmed);

  if (wrapper === null) {
    return trimmed;
  }

  const result =
    Array.isArray(wrapper) ? findResultField(wrapper) : getResultField(wrapper);

  if (typeof result === "string") {
    return result;
  }

  throw new Error("Claude Code JSON output did not include a string result field.");
}

function parseVariantOutputs(text: string): VariantOutput[] {
  const jsonText = extractJsonArrayText(text);
  const parsed: unknown = JSON.parse(jsonText);

  if (!Array.isArray(parsed)) {
    throw new Error("Claude Code result must be a JSON array.");
  }

  const outputs = parsed.map(parseVariantOutput).filter((item) => item !== null);

  if (outputs.length === 0) {
    throw new Error("Claude Code returned no valid variants.");
  }

  return outputs;
}

function parseVariantOutput(value: unknown): VariantOutput | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = value.title;
  const description = value.description;
  const changes = value.changes;

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    !Array.isArray(changes)
  ) {
    return null;
  }

  const parsedChanges = changes.map(parseFileChange).filter((item) => item !== null);

  if (parsedChanges.length === 0) {
    return null;
  }

  return {
    title,
    description,
    changes: parsedChanges,
  };
}

function parseFileChange(value: unknown): FileChange | null {
  if (!isRecord(value)) {
    return null;
  }

  const file = value.file;
  const edits = value.edits;

  if (typeof file !== "string" || !Array.isArray(edits)) {
    return null;
  }

  const parsedEdits = edits.map(parseFileEdit).filter((item) => item !== null);

  if (parsedEdits.length === 0) {
    return null;
  }

  return { file, edits: parsedEdits };
}

function parseFileEdit(value: unknown): FileEdit | null {
  if (!isRecord(value)) {
    return null;
  }

  const search = value.search;
  const replace = value.replace;

  if (
    typeof search !== "string" ||
    search.length === 0 ||
    typeof replace !== "string"
  ) {
    return null;
  }

  return { search, replace };
}

function extractJsonArrayText(text: string): string {
  const startIndex = text.indexOf("[");

  if (startIndex < 0) {
    throw new Error("Claude Code result did not contain a JSON array.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (char === undefined) {
      break;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;

      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error("Claude Code result contained an incomplete JSON array.");
}

function parseJson(text: string): unknown | null {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function findResultField(events: unknown[]): unknown {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const result = getResultField(events[index]);

    if (typeof result === "string") {
      return result;
    }
  }

  return undefined;
}

function getResultField(value: unknown): unknown {
  if (!isRecord(value)) {
    return undefined;
  }

  return value.result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeClaudeError(error: unknown): Error {
  if (!isRecord(error)) {
    return new Error("Claude Code failed.");
  }

  const code = error.code;
  const stderr = error.stderr;
  const message = error.message;

  if (code === "ENOENT") {
    return new Error("Claude CLI was not found in PATH.");
  }

  const details =
    typeof stderr === "string" && stderr.trim().length > 0
      ? stderr.trim()
      : typeof message === "string"
        ? message
        : "Claude Code failed.";

  return new Error(details);
}
