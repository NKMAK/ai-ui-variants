import { signal } from "@preact/signals";

import type { GenerateMode, SourceLocation, Variant } from "../../shared/types.ts";

export const enabled = signal(false);
export const selectedSource = signal<SourceLocation | null>(null);
export const hoveredRect = signal<DOMRect | null>(null);
export const selectedRect = signal<DOMRect | null>(null);
export const sessionId = signal<string | null>(null);
export const sessionError = signal<string | null>(null);
export const variants = signal<Variant[]>([]);
export const currentIndex = signal(0);
export const busy = signal(false);
// Tracks the active generate mode so only the clicked action shows a spinner.
export const busyMode = signal<GenerateMode | null>(null);

export function toggleInspector(): void {
  enabled.value = !enabled.value;
}

export function resetVariantState(): void {
  variants.value = [];
  currentIndex.value = 0;
  busy.value = false;
  busyMode.value = null;
}
