/** @jsxImportSource preact */
import { render } from "preact";

import { App } from "./App.tsx";
import instructionInputCss from "./components/InstructionInput/style.css?raw";
import inspectorCss from "./components/Inspector/style.css?raw";
import toggleCss from "./components/InspectorToggle/style.css?raw";
import panelCss from "./components/Panel/style.css?raw";
import panelActionsCss from "./components/PanelActions/style.css?raw";
import sourceLocationCss from "./components/SourceLocation/style.css?raw";
import uiCss from "./components/ui/style.css?raw";
import variantViewerCss from "./components/VariantViewer/style.css?raw";
import themeCss from "./styles/theme.css?raw";

const ROOT_ID = "__ui_agent_root";

function mountOverlay(): void {
  if (document.getElementById(ROOT_ID) !== null) {
    return;
  }

  const host = document.createElement("div");
  host.id = ROOT_ID;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = [
    themeCss,
    inspectorCss,
    sourceLocationCss,
    toggleCss,
    uiCss,
    panelCss,
    instructionInputCss,
    variantViewerCss,
    panelActionsCss,
  ].join("\n");
  shadow.appendChild(style);

  const appRoot = document.createElement("div");
  appRoot.id = "ui-agent-app";
  shadow.appendChild(appRoot);

  render(<App />, appRoot);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountOverlay, { once: true });
} else {
  mountOverlay();
}
