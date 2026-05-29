export function Masthead() {
  return (
    <header className="masthead">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          V
        </span>
        <span className="brand-name" data-ui-source="src/components/Masthead.tsx:8:9">
          UI Variant Preview Agent
        </span>
      </div>
      <nav className="nav-list" aria-label="Primary">
        <a href="#workflow">workflow</a>
        <a href="#features">features</a>
        <a href="#playground">playground</a>
      </nav>
      <div className="masthead-right">
        <span className="chip" data-ui-source="src/components/Masthead.tsx:18:9">
          v0.1 · MVP
        </span>
        <a
          className="ghost-cta"
          href="https://github.com/"
          data-ui-source="src/components/Masthead.tsx:21:9"
        >
          GitHub →
        </a>
      </div>
    </header>
  );
}
