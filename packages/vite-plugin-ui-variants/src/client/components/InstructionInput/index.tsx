/** @jsxImportSource preact */
import { useState } from "preact/hooks";

import { sessionId } from "../../store/overlayStore.ts";
import { useVariants } from "../../hooks/useVariants.ts";
import { Button } from "../ui/Button.tsx";
import { Spinner } from "../ui/Spinner.tsx";

export function InstructionInput() {
  const [instruction, setInstruction] = useState("");
  const variants = useVariants();
  const trimmedInstruction = instruction.trim();
  const disabled =
    variants.busy || sessionId.value === null || trimmedInstruction.length === 0;

  const handleSubmit = (event: Event): void => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    submitInstruction(event, () => variants.generateInitial(trimmedInstruction));
  };

  const handleRegenerate = (event: Event): void => {
    if (disabled || !variants.canRegenerate) {
      return;
    }

    submitInstruction(event, () => variants.regenerate(trimmedInstruction));
  };

  const handleRefine = (event: Event): void => {
    if (disabled || !variants.canRefineCurrent) {
      return;
    }

    submitInstruction(event, () => variants.refineCurrent(trimmedInstruction));
  };

  return (
    <form className="instruction-input" onSubmit={handleSubmit}>
      <label className="instruction-input__label" htmlFor="ui-agent-instruction">
        Instruction
      </label>
      <textarea
        id="ui-agent-instruction"
        className="instruction-input__textarea"
        value={instruction}
        rows={4}
        disabled={variants.busy}
        onInput={(event) => {
          setInstruction(event.currentTarget.value);
        }}
      />
      <div className="instruction-input__actions">
        {variants.hasVariants ? (
          <>
            <Button
              variant="primary"
              disabled={disabled || !variants.canRegenerate}
              onClick={handleRegenerate}
            >
              {variants.busyMode === "replace" ? <Spinner /> : null}
              Regenerate
            </Button>
            <Button
              variant="ghost"
              disabled={disabled || !variants.canRefineCurrent}
              onClick={handleRefine}
            >
              {variants.busyMode === "refine" ? <Spinner /> : null}
              Refine current
            </Button>
          </>
        ) : (
          <Button variant="primary" type="submit" disabled={disabled}>
            {variants.busy ? <Spinner /> : null}
            Generate
          </Button>
        )}
      </div>
    </form>
  );
}

function submitInstruction(event: Event, action: () => Promise<void>): void {
  const form = event.currentTarget;

  if (!(form instanceof HTMLFormElement || form instanceof HTMLButtonElement)) {
    return;
  }

  const root = form.getRootNode();

  void action().finally(() => {
    blurActiveElement(root);
  });
}

function blurActiveElement(root: Node): void {
  if (!(root instanceof Document || root instanceof ShadowRoot)) {
    return;
  }

  const activeElement = root.activeElement;

  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}
