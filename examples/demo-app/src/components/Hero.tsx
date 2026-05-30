import { PreviewCard } from "./PreviewCard";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <p className="eyebrow">// vite plugin · click → describe → pick</p>
        <h1 className="hero-title">
          Click a UI element. <em>Get three AI rewrites.</em>
        </h1>
        <p className="hero-sub">
          Say what to change, compare the variants in place, and keep the one that fits —
          without leaving the app you are already running. Your URL, auth, and form state
          stay put.
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
