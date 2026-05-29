export function Features() {
  return (
    <section className="band" id="features">
      <p className="section-eyebrow">// features</p>
      <h2 className="section-title" data-ui-source="src/components/Features.tsx:5:9">
        Built for the loop between <em>idea</em> and <em>diff</em>.
      </h2>
      <div className="features-grid">
        <article className="feature" data-ui-source="src/components/Features.tsx:9:9">
          <span className="feature-num">F · 01</span>
          <h3>
            Source-aware <em>by construction</em>
          </h3>
          <p>
            Every editable element carries data-ui-source. The overlay sends the
            smallest possible code range — not the whole file, not the whole screen.
          </p>
          <span className="feature-tag">data-ui-source</span>
        </article>
        <article className="feature" data-ui-source="src/components/Features.tsx:20:9">
          <span className="feature-num">F · 02</span>
          <h3>Code-backed variants</h3>
          <p>
            Claude returns search-and-replace blocks. The server turns them into git
            diffs deterministically. The model never writes the patch itself.
          </p>
          <span className="feature-tag">git diff · search/replace</span>
        </article>
        <article className="feature" data-ui-source="src/components/Features.tsx:29:9">
          <span className="feature-num">F · 03</span>
          <h3>Worktree-safe</h3>
          <p>
            Each variant lives in its own git worktree. Rollback is a snapshot reset,
            not git reset — your in-flight work stays untouched.
          </p>
          <span className="feature-tag">git worktree</span>
        </article>
        <article className="feature" data-ui-source="src/components/Features.tsx:38:9">
          <span className="feature-num">F · 04</span>
          <h3>
            Fast Refresh <em>keeps the state</em>
          </h3>
          <p>
            Variants are limited to same-file text, className, and props. React Fast
            Refresh swaps the module without remounting — form values and routes
            survive.
          </p>
          <span className="feature-tag">react fast refresh</span>
        </article>
      </div>
    </section>
  );
}
