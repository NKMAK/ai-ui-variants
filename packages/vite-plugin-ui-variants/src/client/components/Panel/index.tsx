/** @jsxImportSource preact */
import type { ComponentChildren, JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { busy, selectedSource } from "../../store/overlayStore.ts";
import { Button } from "../ui/Button.tsx";

type PanelProps = {
  children: ComponentChildren;
  onClose: () => void;
};

type PanelPosition = {
  left: number;
  top: number;
};

type DragState = {
  offsetX: number;
  offsetY: number;
};

export function Panel({ children, onClose }: PanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const dragState = dragStateRef.current;
      const panel = panelRef.current;

      if (dragState === null || panel === null) {
        return;
      }

      setPosition(
        clampPanelPosition(
          {
            left: event.clientX - dragState.offsetX,
            top: event.clientY - dragState.offsetY,
          },
          panel,
        ),
      );
    };

    const stopDragging = (): void => {
      dragStateRef.current = null;
    };

    const handleResize = (): void => {
      const panel = panelRef.current;

      if (panel === null) {
        return;
      }

      setPosition((currentPosition) => {
        if (currentPosition === null) {
          return currentPosition;
        }

        return clampPanelPosition(currentPosition, panel);
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (selectedSource.value === null) {
    return null;
  }

  const panelStyle: JSX.CSSProperties | undefined =
    position === null
      ? undefined
      : {
          left: `${position.left}px`,
          top: `${position.top}px`,
        };

  const handleDragStart = (event: JSX.TargetedPointerEvent<HTMLElement>): void => {
    const target = event.target;
    const panel = panelRef.current;

    if (
      !(target instanceof Element) ||
      target.closest("button") !== null ||
      panel === null
    ) {
      return;
    }

    const rect = panel.getBoundingClientRect();

    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setPosition(clampPanelPosition({ left: rect.left, top: rect.top }, panel));
  };

  return (
    <section
      ref={panelRef}
      className={position === null ? "ui-agent-panel" : "ui-agent-panel is-positioned"}
      style={panelStyle}
      aria-label="UI variant preview"
    >
      <PanelHeader onClose={onClose} onDragStart={handleDragStart} />
      <div className="ui-agent-panel__body">{children}</div>
    </section>
  );
}

type PanelHeaderProps = {
  onClose: () => void;
  onDragStart: (event: JSX.TargetedPointerEvent<HTMLElement>) => void;
};

export function PanelHeader({ onClose, onDragStart }: PanelHeaderProps) {
  return (
    <header className="ui-agent-panel__header" onPointerDown={onDragStart}>
      <div>
        <h2 className="ui-agent-panel__title">UI Variant Preview</h2>
      </div>
      <Button variant="ghost" disabled={busy.value} onClick={onClose}>
        Close
      </Button>
    </header>
  );
}

function clampPanelPosition(
  position: PanelPosition,
  panel: HTMLElement,
): PanelPosition {
  const rect = panel.getBoundingClientRect();
  const margin = 8;
  const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

  return {
    left: Math.min(Math.max(position.left, margin), maxLeft),
    top: Math.min(Math.max(position.top, margin), maxTop),
  };
}
