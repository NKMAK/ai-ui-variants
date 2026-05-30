/** @jsxImportSource preact */
import { selectedSource, sessionError, sessionId } from "../../store/overlayStore.ts";

type SourceLocationProps = {
  embedded?: boolean;
};

export function SourceLocation({ embedded = false }: SourceLocationProps) {
  const source = selectedSource.value;

  if (source === null) {
    return null;
  }

  const error = sessionError.value;
  const status = error ?? (sessionId.value === null ? "Starting session..." : null);

  return (
    <section
      className={embedded ? "source-location is-embedded" : "source-location"}
      aria-live="polite"
    >
      <div className="source-location__label">Selected source</div>
      <div className="source-location__path">
        {source.file}:{source.line}:{source.column}
      </div>
      {status === null ? null : (
        <div
          className={
            error ? "source-location__status is-error" : "source-location__status"
          }
        >
          {status}
        </div>
      )}
    </section>
  );
}
