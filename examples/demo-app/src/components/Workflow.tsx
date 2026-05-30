export function Workflow() {
  return (
    <section className="band deep" id="workflow">
      <div className="deep-inner">
        <p className="section-eyebrow">// workflow</p>
        <h2 className="section-title">
          Four steps, <em>one screen</em>, zero context switches.
        </h2>
        <ol className="steps">
          <li className="step">
            <span className="step-num">01</span>
            <h3>Click</h3>
            <p>
              Pick a button, a heading, a card. The dev plugin auto-injects source
              metadata so the overlay can resolve the exact file and line.
            </p>
          </li>
          <li className="step">
            <span className="step-num">02</span>
            <h3>Generate</h3>
            <p>
              The local agent ships the minimum code range to a pluggable generator
              (mock by default; Claude Code is the only real model adapter today) and
              asks for three variants — text, className, props only.
            </p>
          </li>
          <li className="step">
            <span className="step-num">03</span>
            <h3>Preview</h3>
            <p>
              The selected patch is applied to your dev server. Fast Refresh swaps the
              screen in place — your input state stays put.
            </p>
          </li>
          <li className="step">
            <span className="step-num">04</span>
            <h3>Apply</h3>
            <p>
              Pick the one that stuck. It is applied to your working tree as a plain
              diff — never auto-committed. Discard the rest.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}
