import { useEffect, useRef } from "preact/hooks";

import { postDiscard, postStart } from "../api/client.ts";
import {
  resetVariantState,
  selectedSource,
  sessionError,
  sessionId,
} from "../store/overlayStore.ts";

export function useSession(): void {
  const source = selectedSource.value;
  const activeSessionIdRef = useRef<string | null>(null);
  const transitionRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    const currentSessionId = sessionId.value;

    sessionId.value = null;
    sessionError.value = null;
    resetVariantState();

    const transition = transitionRef.current.then(async () => {
      const previousSessionId = activeSessionIdRef.current;

      if (previousSessionId !== null) {
        activeSessionIdRef.current = null;

        if (source !== null || currentSessionId === previousSessionId) {
          await postDiscard(previousSessionId).catch(() => undefined);
        }
      }

      if (source === null || cancelled) {
        return;
      }

      try {
        const response = await postStart(source);

        if (!response.ok) {
          if (!cancelled) {
            sessionError.value = response.error;
          }
          return;
        }

        if (cancelled) {
          await postDiscard(response.session.id).catch(() => undefined);
          return;
        }

        activeSessionIdRef.current = response.session.id;
        sessionId.value = response.session.id;
        sessionError.value = null;
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        sessionError.value =
          error instanceof Error ? error.message : "Failed to start session.";
      }
    });

    transitionRef.current = transition.catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [source]);
}
