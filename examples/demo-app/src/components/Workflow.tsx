export function Workflow() {
  return (
    <section className="band deep" id="workflow">
      <div className="deep-inner">
        <p className="section-eyebrow">// workflow</p>
        <h2 className="section-title" data-ui-source="src/components/Workflow.tsx:6:9">
          Four steps, <em>one screen</em>, zero context switches.
        </h2>
        <ol className="steps">
          <li className="step" data-ui-source="src/components/Workflow.tsx:10:11">
            <span className="step-num">01</span>
            <h3>Click</h3>
            <p>
              Pick a button, a heading, a card. The overlay reads{" "}
              <code>data-ui-source</code> and resolves the exact file and line.
            </p>
          </li>
          <li className="step" data-ui-source="src/components/Workflow.tsx:18:11">
            <span className="step-num">02</span>
            <h3>Generate</h3>
            <p>
              The local agent ships the minimum code range to Claude and asks for three
              variants — text, className, props only.
            </p>
          </li>
          <li className="step" data-ui-source="src/components/Workflow.tsx:26:11">
            <span className="step-num">03</span>
            <h3>Preview</h3>
            <p>
              Each variant lands in a <code>git worktree</code>. Fast Refresh swaps the
              screen in place. Your input state stays put.
            </p>
          </li>
          <li className="step" data-ui-source="src/components/Workflow.tsx:34:11">
            <span className="step-num">04</span>
            <h3>Apply</h3>
            <p>
              Pick the one that stuck. It is committed to your main worktree as a plain
              diff. Discard the rest.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}
