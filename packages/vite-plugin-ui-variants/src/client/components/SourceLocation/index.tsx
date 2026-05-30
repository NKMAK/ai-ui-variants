/** @jsxImportSource preact */
import { useState } from "preact/hooks";

import { postDiscardActive } from "../../api/client.ts";
import {
  resetVariantState,
  selectedSource,
  sessionError,
  sessionId,
} from "../../store/overlayStore.ts";

type SourceLocationProps = {
  embedded?: boolean;
};

const ACTIVE_SESSION_ERROR = "Another session is already active.";

export function SourceLocation({ embedded = false }: SourceLocationProps) {
  const [forceCloseBusy, setForceCloseBusy] = useState(false);
  const source = selectedSource.value;

  if (source === null) {
    return null;
  }

  const error = sessionError.value;
  const status = error ?? (sessionId.value === null ? "Starting session..." : null);
  const canForceClose = error === ACTIVE_SESSION_ERROR;

  const handleForceClose = (): void => {
    if (forceCloseBusy) {
      return;
    }

    setForceCloseBusy(true);

    void postDiscardActive()
      .then((response) => {
        if (!response.ok) {
          sessionError.value = response.error;
          return;
        }

        sessionId.value = null;
        sessionError.value = null;
        selectedSource.value = null;
        resetVariantState();
      })
      .catch((discardError: unknown) => {
        sessionError.value =
          discardError instanceof Error
            ? discardError.message
            : "Failed to close active session.";
      })
      .finally(() => {
        setForceCloseBusy(false);
      });
  };

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
        <div className="source-location__status-row">
          <div
            className={
              error ? "source-location__status is-error" : "source-location__status"
            }
          >
            {status}
          </div>
          {canForceClose ? (
            <button
              type="button"
              className="source-location__force-close"
              disabled={forceCloseBusy}
              onClick={handleForceClose}
            >
              {forceCloseBusy ? "Closing..." : "Close session"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
