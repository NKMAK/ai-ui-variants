import { PreviewCard } from "./PreviewCard";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <p className="eyebrow" data-ui-source="src/components/Hero.tsx:7:9">
          // a vite plugin for click-to-variant editing
        </p>
        <h1 className="hero-title" data-ui-source="src/components/Hero.tsx:10:9">
          Preview <em>AI-made</em> UI changes
          <br />
          before they touch your <span className="ink-underline">worktree</span>.
        </h1>
        <p className="hero-sub" data-ui-source="src/components/Hero.tsx:15:9">
          Click an element. Generate three code-backed variants. Flip between them in
          the screen you are already using — then keep the one that stuck.
        </p>
        <div className="hero-ctas">
          <button
            type="button"
            className="cta cta-primary"
            style={{ background: 'linear-gradient(135deg, #1a0020 0%, #2d0040 100%)', color: '#ff00ff', boxShadow: '0 0 15px #ff00ff, 0 0 30px #ff00ff, 0 0 60px rgba(255,0,255,0.5), inset 0 0 20px rgba(255,0,255,0.1)', border: '2px solid #ff00ff', fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase', textShadow: '0 0 8px #ff00ff' }}
            data-ui-source="src/components/Hero.tsx:20:11"
          >
            ⚡ BOOT SEQUENCE
            <span className="arrow" aria-hidden>
              ◈
            </span>
          </button>
          <button
            type="button"
            className="cta cta-ghost"
            data-ui-source="src/components/Hero.tsx:30:11"
          >
            Read the spec
          </button>
        </div>
        <ul className="hero-meta">
          <li>
            <span>01</span> Vite plugin
          </li>
          <li>
            <span>02</span> Local-first
          </li>
          <li>
            <span>03</span> Git-native
          </li>
        </ul>
      </div>
      <PreviewCard />
    </section>
  );
}
