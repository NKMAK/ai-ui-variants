import { signal } from "@preact/signals";

import type { SourceLocation } from "../../shared/types.ts";

export const enabled = signal(false);
export const selectedSource = signal<SourceLocation | null>(null);
export const hoveredRect = signal<DOMRect | null>(null);
export const sessionId = signal<string | null>(null);

export function toggleInspector(): void {
  enabled.value = !enabled.value;
}
