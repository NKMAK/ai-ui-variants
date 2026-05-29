import { useState } from "react";

type Variant = "A" | "B" | "C";

const variantCopy: Record<Variant, string> = {
  A: "Save Draft",
  B: "Save & Publish",
  C: "Keep Changes",
};

const variantPatch: Record<Variant, string> = {
  A: '"Save Draft"',
  B: '"Save & Publish"',
  C: '"Keep Changes"',
};

export function PreviewCard() {
  const [active, setActive] = useState<Variant>("A");

  return (
    <aside className="preview-card" aria-label="Variant preview demo">
      <div className="preview-bar">
        <div className="dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <span className="preview-path">src/components/SaveButton.tsx</span>
      </div>
      <div className="preview-stage">
        <span className="preview-hint">Selected element</span>
        <div className="preview-mock">
          <button
            type="button"
            className={`mock-cta mock-cta-${active.toLowerCase()}`}
            data-ui-source="src/components/PreviewCard.tsx:33:11"
          >
            {variantCopy[active]}
          </button>
        </div>
        <div className="variant-switch">
          <span className="variant-label">Variant</span>
          <div className="variant-tabs" role="tablist">
            {(["A", "B", "C"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={active === v}
                className={`variant-tab ${active === v ? "active" : ""}`}
                onClick={() => setActive(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <pre className="diff-snippet">
          <span className="diff-context">// SaveButton.tsx</span>
          {"\n"}
          <span className="diff-minus">- &quot;Save&quot;</span>
          {"\n"}
          <span className="diff-plus">+ {variantPatch[active]}</span>
        </pre>
      </div>
    </aside>
  );
}
