/** @jsxImportSource preact */
import { Inspector } from "./components/Inspector/index.tsx";
import { InspectorToggle } from "./components/InspectorToggle/index.tsx";
import { SourceLocation } from "./components/SourceLocation/index.tsx";
import { useInspector } from "./hooks/useInspector.ts";
import { useSession } from "./hooks/useSession.ts";

export function App() {
  useInspector();
  useSession();

  return (
    <div className="ui-agent-root">
      <Inspector />
      <SourceLocation />
      <InspectorToggle />
    </div>
  );
}
