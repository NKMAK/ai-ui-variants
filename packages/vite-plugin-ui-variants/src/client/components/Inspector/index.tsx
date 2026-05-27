/** @jsxImportSource preact */
import { hoveredRect } from "../../store/overlayStore.ts";

export function Inspector() {
  const rect = hoveredRect.value;

  if (rect === null || rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return (
    <div
      className="inspector-highlight"
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
