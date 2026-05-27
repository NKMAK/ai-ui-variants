/** @jsxImportSource preact */
import { Inspector } from "./components/Inspector/index.tsx";
import { InspectorToggle } from "./components/InspectorToggle/index.tsx";
import { InstructionInput } from "./components/InstructionInput/index.tsx";
import { Panel } from "./components/Panel/index.tsx";
import { PanelActions } from "./components/PanelActions/index.tsx";
import { SourceLocation } from "./components/SourceLocation/index.tsx";
import { VariantViewer } from "./components/VariantViewer/index.tsx";
import { useInspector } from "./hooks/useInspector.ts";
import { useSession } from "./hooks/useSession.ts";
import { useVariants } from "./hooks/useVariants.ts";

export function App() {
  useInspector();
  useSession();
  const variants = useVariants();

  return (
    <div className="ui-agent-root">
      <Inspector />
      <Panel
        onClose={() => {
          void variants.discard();
        }}
      >
        <SourceLocation embedded />
        <InstructionInput />
        <VariantViewer />
        <PanelActions />
      </Panel>
      <InspectorToggle />
    </div>
  );
}
