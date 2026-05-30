import { PreviewCard } from "./PreviewCard";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <p className="eyebrow">// vite plugin · click → variant → pick</p>
        <h1 className="hero-title">
          Click any UI element. <em>See three AI rewrites</em> in the screen you are
          already using.
        </h1>
        <p className="hero-sub">
          Each variant is a real code change, applied via Fast Refresh. No mockups, no
          second window — your URL, auth, and form state stay put while you compare. Other
          click-to-source tools jump you to the editor; this one rewrites, in place.
        </p>
        <div className="hero-ctas">
          <a className="cta cta-primary" href="#playground">
            See the demo
            <span className="arrow" aria-hidden>
              →
            </span>
          </a>
          <a
            className="cta cta-ghost"
            href="https://github.com/NKMAK/ai-ui-variants#readme"
          >
            Read the docs
          </a>
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
