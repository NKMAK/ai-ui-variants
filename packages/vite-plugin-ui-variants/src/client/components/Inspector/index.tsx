/** @jsxImportSource preact */
import { hoveredRect, selectedRect } from "../../store/overlayStore.ts";

export function Inspector() {
  const hover = hoveredRect.value;
  const selected = selectedRect.value;

  if (!isVisibleRect(hover) && !isVisibleRect(selected)) {
    return null;
  }

  return (
    <>
      {isVisibleRect(selected) ? (
        <HighlightBox rect={selected} className="inspector-highlight is-selected" />
      ) : null}
      {isVisibleRect(hover) ? (
        <HighlightBox rect={hover} className="inspector-highlight is-hovered" />
      ) : null}
    </>
  );
}

type HighlightBoxProps = {
  rect: DOMRect;
  className: string;
};

function HighlightBox({ rect, className }: HighlightBoxProps) {
  return (
    <div
      className={className}
      style={{
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      }}
      aria-hidden="true"
    />
  );
}

function isVisibleRect(rect: DOMRect | null): rect is DOMRect {
  return rect !== null && rect.width > 0 && rect.height > 0;
}
