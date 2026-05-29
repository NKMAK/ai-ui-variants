/** @jsxImportSource preact */
import { useVariants } from "../../hooks/useVariants.ts";
import { Button } from "../ui/Button.tsx";

export function VariantViewer() {
  const variants = useVariants();
  const currentVariant = variants.currentVariant;

  if (currentVariant === null) {
    return (
      <section className="variant-viewer" aria-live="polite">
        <div className="variant-viewer__empty">No variants yet</div>
      </section>
    );
  }

  return (
    <section className="variant-viewer" aria-live="polite">
      <div className="variant-viewer__meta">
        Variant {variants.currentIndex + 1} / {variants.variants.length}
      </div>
      <h3 className="variant-viewer__title">{currentVariant.title}</h3>
      <p className="variant-viewer__description">{currentVariant.description}</p>
      {currentVariant.error ? (
        <p className="variant-viewer__error">{currentVariant.error}</p>
      ) : null}
      <VariantNav />
    </section>
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
