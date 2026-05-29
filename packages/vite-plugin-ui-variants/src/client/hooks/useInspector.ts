import { useEffect } from "preact/hooks";

import type { SourceLocation } from "../../shared/types.ts";
import {
  enabled,
  hoveredRect,
  selectedRect,
  selectedSource,
} from "../store/overlayStore.ts";

const SOURCE_SELECTOR = "[data-ui-source]";

export function useInspector(): void {
  const isEnabled = enabled.value;
  const source = selectedSource.value;

  useEffect(() => {
    if (source === null) {
      selectedRect.value = null;
    }
  }, [source]);

  useEffect(() => {
    if (!isEnabled) {
      hoveredRect.value = null;
      selectedRect.value = null;
      return;
    }

    let hoveredElement: Element | null = null;
    let selectedElement: Element | null = null;

    const updateHoveredRect = (): void => {
      hoveredRect.value = hoveredElement?.getBoundingClientRect() ?? null;
    };

    const updateSelectedRect = (): void => {
      if (selectedSource.value === null) {
        selectedElement = null;
        selectedRect.value = null;
        return;
      }

      selectedRect.value = selectedElement?.getBoundingClientRect() ?? null;
    };

    const updateRects = (): void => {
      updateHoveredRect();
      updateSelectedRect();
    };

    const handleMouseMove = (event: MouseEvent): void => {
      const target = event.target;
      hoveredElement =
        target instanceof Element ? target.closest(SOURCE_SELECTOR) : null;
      updateHoveredRect();
    };

    const handleClick = (event: MouseEvent): void => {
      const target = event.target;
      const sourceElement =
        target instanceof Element ? target.closest(SOURCE_SELECTOR) : null;

      if (sourceElement === null) {
        return;
      }

      const source = parseSourceLocation(sourceElement.getAttribute("data-ui-source"));

      if (source === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      selectedSource.value = source;
      hoveredElement = sourceElement;
      selectedElement = sourceElement;
      updateRects();
    };

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("scroll", updateRects, true);
    window.addEventListener("resize", updateRects);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", updateRects, true);
      window.removeEventListener("resize", updateRects);
      hoveredRect.value = null;
      selectedRect.value = null;
    };
  }, [isEnabled]);
}

function parseSourceLocation(value: string | null): SourceLocation | null {
  if (value === null) {
    return null;
  }

  const match = /^(.+):(\d+):(\d+)$/.exec(value);

  if (match === null) {
    return null;
  }

  const file = match[1];
  const lineText = match[2];
  const columnText = match[3];

  if (file === undefined || lineText === undefined || columnText === undefined) {
    return null;
  }

  const line = Number(lineText);
  const column = Number(columnText);

  if (file === "" || line < 1 || column < 1) {
    return null;
  }

  return { file, line, column };
}
