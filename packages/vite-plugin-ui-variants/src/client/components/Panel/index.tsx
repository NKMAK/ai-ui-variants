/** @jsxImportSource preact */
import type { ComponentChildren } from "preact";

import { busy, selectedSource } from "../../store/overlayStore.ts";
import { Button } from "../ui/Button.tsx";

type PanelProps = {
  children: ComponentChildren;
  onClose: () => void;
};

export function Panel({ children, onClose }: PanelProps) {
  if (selectedSource.value === null) {
    return null;
  }

  return (
    <section className="ui-agent-panel" aria-label="UI variant preview">
      <PanelHeader onClose={onClose} />
      <div className="ui-agent-panel__body">{children}</div>
    </section>
  );
}

type PanelHeaderProps = {
  onClose: () => void;
};

export function PanelHeader({ onClose }: PanelHeaderProps) {
  return (
    <header className="ui-agent-panel__header">
      <div>
        <h2 className="ui-agent-panel__title">UI Variant Preview</h2>
      </div>
      <Button variant="ghost" disabled={busy.value} onClick={onClose}>
        閉じる
      </Button>
    </header>
  );
}
