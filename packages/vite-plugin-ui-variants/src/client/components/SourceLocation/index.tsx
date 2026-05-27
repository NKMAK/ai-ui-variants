/** @jsxImportSource preact */
import {
  selectedSource,
  sessionError,
  sessionId,
} from "../../store/overlayStore.ts";

export function SourceLocation() {
  const source = selectedSource.value;

  if (source === null) {
    return null;
  }

  const id = sessionId.value;
  const error = sessionError.value;

  return (
    <section className="source-location" aria-live="polite">
      <div className="source-location__label">Selected source</div>
      <div className="source-location__path">
        {source.file}:{source.line}:{source.column}
      </div>
      <div className={error ? "source-location__status is-error" : "source-location__status"}>
        {error ?? (id === null ? "Starting session..." : `Session ${id}`)}
      </div>
    </section>
  );
}
