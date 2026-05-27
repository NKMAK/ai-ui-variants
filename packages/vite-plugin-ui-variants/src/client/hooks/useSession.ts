import { useEffect } from "preact/hooks";

import { postStart } from "../api/client.ts";
import {
  selectedSource,
  sessionError,
  sessionId,
} from "../store/overlayStore.ts";

export function useSession(): void {
  const source = selectedSource.value;

  useEffect(() => {
    if (source === null) {
      sessionId.value = null;
      sessionError.value = null;
      return;
    }

    let cancelled = false;
    sessionId.value = null;
    sessionError.value = null;

    void postStart(source).then(
      (response) => {
        if (cancelled) {
          return;
        }

        if (response.ok) {
          sessionId.value = response.session.id;
          sessionError.value = null;
          return;
        }

        sessionError.value = response.error;
      },
      (error: unknown) => {
        if (cancelled) {
          return;
        }

        sessionError.value =
          error instanceof Error ? error.message : "Failed to start session.";
      },
    );

    return () => {
      cancelled = true;
    };
  }, [source]);
}
