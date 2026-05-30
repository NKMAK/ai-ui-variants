import type {
  GenerateMode,
  GenerationMetadata,
  Session,
  Variant,
} from "../../shared/types.ts";
import { postApply, postDiscard, postGenerate, postPreview } from "../api/client.ts";
import {
  busy,
  busyMode,
  currentIndex,
  generation,
  resetVariantState,
  selectedSource,
  sessionError,
  sessionId,
  variants,
} from "../store/overlayStore.ts";

const DEFAULT_VARIANT_COUNT = 3;

export type UseVariantsResult = {
  variants: Variant[];
  currentIndex: number;
  currentVariant: Variant | null;
  generation: GenerationMetadata | null;
  busy: boolean;
  busyMode: GenerateMode | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  hasVariants: boolean;
  readyCount: number;
  failedCount: number;
  canRegenerate: boolean;
  canRefineCurrent: boolean;
  canApply: boolean;
  generateInitial: (
    instruction: string,
    count?: number,
    model?: string,
  ) => Promise<void>;
  regenerate: (instruction: string, count?: number, model?: string) => Promise<void>;
  refineCurrent: (instruction: string, count?: number, model?: string) => Promise<void>;
  goPrev: () => Promise<void>;
  goNext: () => Promise<void>;
  preview: (variantId: string) => Promise<void>;
  apply: () => Promise<void>;
  discard: () => Promise<void>;
};

export function useVariants(): UseVariantsResult {
  const variantList = variants.value;
  const activeIndex = currentIndex.value;
  const isBusy = busy.value;
  const activeBusyMode = busyMode.value;
  const activeVariant = variantList[activeIndex] ?? null;

  return {
    variants: variantList,
    currentIndex: activeIndex,
    currentVariant: activeVariant,
    generation: generation.value,
    busy: isBusy,
    busyMode: activeBusyMode,
    canGoPrev: findPreviewableIndex(variantList, activeIndex, -1) !== null,
    canGoNext: findPreviewableIndex(variantList, activeIndex, 1) !== null,
    hasVariants: variantList.length > 0,
    readyCount: variantList.filter(isPreviewable).length,
    failedCount: variantList.filter((variant) => variant.status === "failed").length,
    canRegenerate: sessionId.value !== null && !isBusy,
    canRefineCurrent:
      sessionId.value !== null &&
      !isBusy &&
      activeVariant !== null &&
      isPreviewable(activeVariant),
    canApply: !isBusy && activeVariant !== null && isPreviewable(activeVariant),
    generateInitial: generateReplace,
    regenerate: generateReplace,
    refineCurrent: generateRefine,
    goPrev,
    goNext,
    preview,
    apply,
    discard,
  };
}

async function generateReplace(
  instruction: string,
  count = DEFAULT_VARIANT_COUNT,
  model?: string,
): Promise<void> {
  await generate(instruction, "replace", count, model);
}

async function generateRefine(
  instruction: string,
  count = DEFAULT_VARIANT_COUNT,
  model?: string,
): Promise<void> {
  await generate(instruction, "refine", count, model);
}

async function generate(
  instruction: string,
  mode: GenerateMode,
  count: number,
  model: string | undefined,
): Promise<void> {
  const activeSessionId = sessionId.value;

  if (activeSessionId === null) {
    sessionError.value = "No active session.";
    return;
  }

  busyMode.value = mode;

  try {
    await runExclusive(async () => {
      const response = await postGenerate(
        activeSessionId,
        instruction,
        count,
        mode,
        model,
      );

      if (!response.ok) {
        sessionError.value = response.error;
        return;
      }

      syncSessionState(response.session);

      const firstReadyVariant = response.variants.find(isPreviewable);

      if (firstReadyVariant === undefined) {
        sessionError.value = "No previewable variants were generated.";
        return;
      }

      await previewUnlocked(activeSessionId, firstReadyVariant.id);
    });
  } finally {
    busyMode.value = null;
  }
}

async function goPrev(): Promise<void> {
  const index = findPreviewableIndex(variants.value, currentIndex.value, -1);

  if (index === null) {
    return;
  }

  await preview(variants.value[index]?.id ?? "");
}

async function goNext(): Promise<void> {
  const index = findPreviewableIndex(variants.value, currentIndex.value, 1);

  if (index === null) {
    return;
  }

  await preview(variants.value[index]?.id ?? "");
}

async function preview(variantId: string): Promise<void> {
  const activeSessionId = sessionId.value;

  if (activeSessionId === null || variantId === "") {
    return;
  }

  await runExclusive(() => previewUnlocked(activeSessionId, variantId));
}

async function apply(): Promise<void> {
  const activeSessionId = sessionId.value;
  const activeVariant = variants.value[currentIndex.value];

  if (activeSessionId === null || activeVariant === undefined) {
    return;
  }

  await runExclusive(async () => {
    const response = await postApply(activeSessionId, activeVariant.id);

    if (!response.ok) {
      sessionError.value = response.error;
      return;
    }

    sessionId.value = null;
    sessionError.value = null;
    selectedSource.value = null;
    resetVariantState();
  });
}

async function discard(): Promise<void> {
  const activeSessionId = sessionId.value;

  if (activeSessionId === null) {
    sessionError.value = null;
    selectedSource.value = null;
    resetVariantState();
    return;
  }

  await runExclusive(async () => {
    const response = await postDiscard(activeSessionId);

    if (!response.ok) {
      sessionError.value = response.error;
      return;
    }

    sessionId.value = null;
    sessionError.value = null;
    selectedSource.value = null;
    resetVariantState();
  });
}

async function previewUnlocked(
  activeSessionId: string,
  variantId: string,
): Promise<void> {
  const response = await postPreview(activeSessionId, variantId);

  if (!response.ok) {
    sessionError.value = response.error;
    return;
  }

  syncSessionState(response.session);
  sessionError.value = null;
}

async function runExclusive(operation: () => Promise<void>): Promise<void> {
  if (busy.value) {
    return;
  }

  busy.value = true;

  try {
    await operation();
  } catch (error: unknown) {
    sessionError.value =
      error instanceof Error ? error.message : "Variant operation failed.";
  } finally {
    busy.value = false;
  }
}

function syncVariants(nextVariants: Variant[], nextIndex: number): void {
  variants.value = nextVariants;

  const requested = nextVariants[nextIndex];

  if (nextIndex >= 0 && requested !== undefined && isPreviewable(requested)) {
    currentIndex.value = nextIndex;
    return;
  }

  const firstPreviewable = nextVariants.findIndex(isPreviewable);

  if (firstPreviewable >= 0) {
    currentIndex.value = firstPreviewable;
    return;
  }

  currentIndex.value = nextVariants.length > 0 ? 0 : -1;
}

function syncSessionState(session: Session): void {
  generation.value = session.generation ?? null;
  syncVariants(session.variants, session.currentIndex);
}

function findPreviewableIndex(
  variantList: Variant[],
  fromIndex: number,
  direction: -1 | 1,
): number | null {
  for (
    let index = fromIndex + direction;
    index >= 0 && index < variantList.length;
    index += direction
  ) {
    const variant = variantList[index];

    if (variant !== undefined && isPreviewable(variant)) {
      return index;
    }
  }

  return null;
}

function isPreviewable(variant: Variant): boolean {
  return variant.status === "ready" || variant.status === "previewing";
}
