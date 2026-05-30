export function Features() {
  return (
    <section className="band" id="features">
      <p className="section-eyebrow">// features</p>
      <h2 className="section-title">
        Built for the loop between <em>idea</em> and <em>diff</em>.
      </h2>
      <div className="features-grid">
        <article className="feature">
          <span className="feature-num">F · 01</span>
          <h3>
            Pick from the <em>rendered UI</em>
          </h3>
          <p>
            Click the element you actually see — a button, a heading, a card. No
            jumping to the editor to find the file. The overlay resolves the click
            back to the exact source location for you.
          </p>
          <span className="feature-tag">click to select</span>
        </article>
        <article className="feature">
          <span className="feature-num">F · 02</span>
          <h3>
            Multiple variants, <em>side by side</em>
          </h3>
          <p>
            Ask once, get several alternatives. Flip between them right in the
            running app and judge them where they will actually live — not in an
            isolated preview canvas.
          </p>
          <span className="feature-tag">compare in place</span>
        </article>
        <article className="feature">
          <span className="feature-num">F · 03</span>
          <h3>
            Your app <em>keeps running</em>
          </h3>
          <p>
            Form values, scroll position, open modals, the route you are on — all
            preserved while you switch variants. No reload, no re-login, no
            re-navigating to the screen you were tuning.
          </p>
          <span className="feature-tag">state survives</span>
        </article>
        <article className="feature">
          <span className="feature-num">F · 04</span>
          <h3>
            Apply as a <em>plain diff</em>
          </h3>
          <p>
            Keep the variant you like; the rest disappear. Changes land in your
            working tree as a normal git diff — never auto-committed, easy to
            review, trivial to undo.
          </p>
          <span className="feature-tag">no auto-commit</span>
        </article>
      </div>
    </section>
  );
}
