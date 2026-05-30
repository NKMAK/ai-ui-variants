/** @jsxImportSource preact */
import { useVariants } from "../../hooks/useVariants.ts";
import { Button } from "../ui/Button.tsx";

export function PanelActions() {
  const variants = useVariants();

  return (
    <div className="panel-actions">
      <Button
        variant="primary"
        disabled={!variants.canApply}
        onClick={() => {
          void variants.apply();
        }}
      >
        Apply current
      </Button>
      <Button
        variant="ghost"
        disabled={variants.busy}
        onClick={() => {
          void variants.discard();
        }}
      >
        Discard
      </Button>
    </div>
  );
}
