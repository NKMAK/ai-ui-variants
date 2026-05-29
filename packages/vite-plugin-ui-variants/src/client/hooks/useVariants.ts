import type { Variant } from "../../shared/types.ts";
import { postApply, postDiscard, postGenerate, postPreview } from "../api/client.ts";
import {
  busy,
  currentIndex,
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
  busy: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  generate: (instruction: string, count?: number) => Promise<void>;
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
  const activeVariant = variantList[activeIndex] ?? null;

  return {
    variants: variantList,
    currentIndex: activeIndex,
    currentVariant: activeVariant,
    busy: isBusy,
    canGoPrev: findPreviewableIndex(variantList, activeIndex, -1) !== null,
    canGoNext: findPreviewableIndex(variantList, activeIndex, 1) !== null,
    generate,
    goPrev,
    goNext,
    preview,
    apply,
    discard,
  };
}

async function generate(
  instruction: string,
  count = DEFAULT_VARIANT_COUNT,
): Promise<void> {
  const activeSessionId = sessionId.value;

  if (activeSessionId === null) {
    sessionError.value = "No active session.";
    return;
  }

  await runExclusive(async () => {
    const response = await postGenerate(activeSessionId, instruction, count);

    if (!response.ok) {
      sessionError.value = response.error;
      return;
    }

    syncVariants(response.variants, response.session.currentIndex);

    const firstReadyVariant = response.variants.find(isPreviewable);

    if (firstReadyVariant === undefined) {
      sessionError.value = "No ready variants were generated.";
      return;
    }

    await previewUnlocked(activeSessionId, firstReadyVariant.id);
  });
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

  syncVariants(response.session.variants, response.session.currentIndex);
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
  currentIndex.value = nextIndex >= 0 ? nextIndex : 0;
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
