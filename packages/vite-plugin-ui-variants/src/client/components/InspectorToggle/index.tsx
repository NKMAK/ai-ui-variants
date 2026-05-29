/** @jsxImportSource preact */
import { enabled, toggleInspector } from "../../store/overlayStore.ts";

export function InspectorToggle() {
  const isEnabled = enabled.value;

  return (
    <button
      type="button"
      className={isEnabled ? "inspector-toggle is-enabled" : "inspector-toggle"}
      aria-pressed={isEnabled}
      aria-label={isEnabled ? "UI inspector on" : "UI inspector off"}
      onClick={toggleInspector}
    >
      <span className="inspector-toggle__status" aria-hidden="true" />
      <span className="inspector-toggle__label">
        {isEnabled ? "Inspector On" : "Inspector Off"}
      </span>
    </button>
  );
}
