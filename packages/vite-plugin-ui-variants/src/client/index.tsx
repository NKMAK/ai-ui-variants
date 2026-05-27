/** @jsxImportSource preact */
import { render } from "preact";

import { App } from "./App.tsx";
import inspectorCss from "./components/Inspector/style.css?raw";
import toggleCss from "./components/InspectorToggle/style.css?raw";
import sourceLocationCss from "./components/SourceLocation/style.css?raw";
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
  style.textContent = `${themeCss}\n${inspectorCss}\n${sourceLocationCss}\n${toggleCss}`;
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
