import { PreviewCard } from "./PreviewCard";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <p className="eyebrow" data-ui-source="src/components/Hero.tsx:7:9">
          // vite plugin · click → variant → pick
        </p>
        <h1 className="hero-title" data-ui-source="src/components/Hero.tsx:10:9">
          Click any UI element. <em>See three AI rewrites</em> in the screen you are
          already using.
        </h1>
        <p className="hero-sub" data-ui-source="src/components/Hero.tsx:14:9">
          Each variant is a real code change, applied via Fast Refresh. No mockups, no
          second window — your URL, auth, and form state stay put while you compare.
        </p>
        <div className="hero-ctas">
          <button
            type="button"
            className="cta cta-primary"
            data-ui-source="src/components/Hero.tsx:19:11"
          >
            See the demo
            <span className="arrow" aria-hidden>
              →
            </span>
          </button>
          <button
            type="button"
            className="cta cta-ghost"
            data-ui-source="src/components/Hero.tsx:29:11"
          >
            Read the spec
          </button>
        </div>
        <ul className="hero-meta">
          <li>
            <span>01</span> Vite plugin
          </li>
          <li>
            <span>02</span> React + HMR
          </li>
          <li>
            <span>03</span> Git worktree
          </li>
        </ul>
      </div>
      <PreviewCard />
    </section>
  );
}
