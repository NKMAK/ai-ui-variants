/** @jsxImportSource preact */
import type { TokenUsage } from "../../../shared/types.ts";

import { useVariants } from "../../hooks/useVariants.ts";
import { Button } from "../ui/Button.tsx";

export function VariantViewer() {
  const variants = useVariants();
  const currentVariant = variants.currentVariant;

  if (currentVariant === null) {
    return null;
  }

  const isFailed = currentVariant.status === "failed";

  return (
    <section className="variant-viewer" aria-live="polite">
      <div className="variant-viewer__meta">
        <span>
          Variant {variants.currentIndex + 1} / {variants.variants.length}
        </span>
        <span className="variant-viewer__counts">
          {variants.readyCount} ready / {variants.failedCount} failed
        </span>
      </div>
      <GenerationMeta />
      <h3 className="variant-viewer__title">
        {currentVariant.title}
        {isFailed ? <span className="variant-viewer__badge">failed</span> : null}
      </h3>
      <p className="variant-viewer__description">{currentVariant.description}</p>
      {currentVariant.error ? (
        <p className="variant-viewer__error">{currentVariant.error}</p>
      ) : null}
      <VariantNav />
    </section>
  );
}

function GenerationMeta() {
  const variants = useVariants();
  const generation = variants.generation;

  if (generation === null) {
    return null;
  }

  const tokenSummary = formatTokenUsage(generation.tokenUsage);

  return (
    <div className="variant-viewer__generation">
      <span>{generation.model}</span>
      {tokenSummary === null ? null : <span>{tokenSummary}</span>}
    </div>
  );
}

function VariantNav() {
  const variants = useVariants();

  return (
    <div className="variant-viewer__nav">
      <Button
        variant="ghost"
        disabled={variants.busy || !variants.canGoPrev}
        onClick={() => {
          void variants.goPrev();
        }}
      >
        Previous
      </Button>
      <Button
        variant="ghost"
        disabled={variants.busy || !variants.canGoNext}
        onClick={() => {
          void variants.goNext();
        }}
      >
        Next
      </Button>
    </div>
  );
}

function formatTokenUsage(usage: TokenUsage | undefined): string | null {
  if (usage === undefined) {
    return null;
  }

  if (usage.totalTokens !== undefined) {
    return `${formatNumber(usage.totalTokens)} tokens`;
  }

  if (usage.inputTokens !== undefined || usage.outputTokens !== undefined) {
    return `${formatNumber(usage.inputTokens ?? 0)} in / ${formatNumber(
      usage.outputTokens ?? 0,
    )} out`;
  }

  return null;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
