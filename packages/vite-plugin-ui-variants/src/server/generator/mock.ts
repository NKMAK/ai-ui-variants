import type { VariantOutput } from "../../shared/types.ts";
import type { GenerateVariantsInput, VariantGenerator } from "./types.ts";

export class MockGenerator implements VariantGenerator {
  async generate(input: GenerateVariantsInput): Promise<VariantOutput[]> {
    const file = input.selectedSource.file;
    const content = input.codeRange.content;
    const preferredIndex = input.codeRange.selectedLine - input.codeRange.startLine;
    const targetStartIndex =
      input.codeRange.targetStartLine - input.codeRange.startLine;
    const targetEndIndex = input.codeRange.targetEndLine - input.codeRange.startLine;
    const candidate = pickTextChange(content, {
      preferredIndex,
      targetStartIndex,
      targetEndIndex,
    });

    if (candidate === null) {
      return [];
    }

    const variants: VariantOutput[] = [
      {
        title: "Variant A",
        description: "短く言い換える",
        changes: [
          {
            file,
            edits: [
              {
                search: candidate.original,
                replace: candidate.shorter,
              },
            ],
          },
        ],
      },
      {
        title: "Variant B",
        description: "強めに言い切る",
        changes: [
          {
            file,
            edits: [
              {
                search: candidate.original,
                replace: candidate.bolder,
              },
            ],
          },
        ],
      },
      {
        title: "Variant C",
        description: "丁寧に補足する",
        changes: [
          {
            file,
            edits: [
              {
                search: candidate.original,
                replace: candidate.softer,
              },
            ],
          },
        ],
      },
    ];

    return variants.slice(0, input.count);
  }
}

type TextChangeCandidate = {
  original: string;
  shorter: string;
  bolder: string;
  softer: string;
};

const TEXT_LINE_PATTERN = /^(\s*)([^\s<>{}][^<>{}]*?)$/;

function pickTextChange(
  content: string,
  options: {
    preferredIndex: number;
    targetStartIndex: number;
    targetEndIndex: number;
  },
): TextChangeCandidate | null {
  const lines = content.split("\n");

  for (const lineIndex of lineIndexesByDistance(lines.length, options.preferredIndex)) {
    if (lineIndex < options.targetStartIndex || lineIndex > options.targetEndIndex) {
      continue;
    }

    const rawLine = lines[lineIndex];

    if (rawLine === undefined) {
      continue;
    }

    const match = TEXT_LINE_PATTERN.exec(rawLine);

    if (match === null) {
      continue;
    }

    const text = (match[2] ?? "").trim();

    if (text.length < 3) {
      continue;
    }

    if (text.startsWith("//") || text.startsWith("import")) {
      continue;
    }

    if (text.includes("=") || text.includes('"') || text.includes("`")) {
      continue;
    }

    const original = rawLine;
    const indent = match[1] ?? "";

    return {
      original,
      shorter: `${indent}${shorten(text)}`,
      bolder: `${indent}${embolden(text)}`,
      softer: `${indent}${soften(text)}`,
    };
  }

  return null;
}

function lineIndexesByDistance(length: number, preferredIndex: number): number[] {
  if (length <= 0) {
    return [];
  }

  const clampedIndex = Math.min(Math.max(preferredIndex, 0), length - 1);
  const indexes: number[] = [clampedIndex];

  for (let distance = 1; indexes.length < length; distance += 1) {
    const after = clampedIndex + distance;
    const before = clampedIndex - distance;

    if (after < length) {
      indexes.push(after);
    }

    if (before >= 0) {
      indexes.push(before);
    }
  }

  return indexes;
}

function shorten(text: string): string {
  return text.length > 24 ? `${text.slice(0, 20).trimEnd()}.` : `${text}.`;
}

function embolden(text: string): string {
  return text.endsWith(".") ? text.slice(0, -1) : `${text}!`;
}

function soften(text: string): string {
  return `${text}（試作）`;
}
