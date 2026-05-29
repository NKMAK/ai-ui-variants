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

    void variants.generate(trimmedInstruction);
  };

  return (
    <form className="instruction-input" onSubmit={handleSubmit}>
      <label className="instruction-input__label" htmlFor="ui-agent-instruction">
        指示
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
        <Button variant="primary" type="submit" disabled={disabled}>
          {variants.busy ? <Spinner /> : null}
          生成
        </Button>
      </div>
    </form>
  );
}
