import { PreviewCard } from "./PreviewCard";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <p className="eyebrow">// vite plugin · click → instruct → compare → apply</p>
        <h1 className="hero-title">
          Instruct Claude in your browser. <em>Compare UI variants in place.</em>
        </h1>
        <p className="hero-sub">
          Click a rendered element, tell the AI what to change, and flip through
          multiple variants live in the app you are already running. Keep the one
          that fits — your URL, auth, and form state stay put.
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
            href="https://github.com/NKMAK/claude-ui-variants#readme"
          >
            Read the docs
          </a>
        </div>
        <ul className="hero-meta">
          <li>
            <span>01</span> Pick in-browser
          </li>
          <li>
            <span>02</span> Compare variants
          </li>
          <li>
            <span>03</span> Apply to source
          </li>
        </ul>
      </div>
      <PreviewCard />
    </section>
  );
}
