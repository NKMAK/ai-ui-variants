export function Safety() {
  return (
    <section className="band" id="safety">
      <p className="section-eyebrow">// safety</p>
      <h2 className="section-title">
        Narrow by design. <em>Safe</em> by default.
      </h2>
      <p className="section-lead">
        The point isn&apos;t to let a model loose on your repo. Variant generation is
        deliberately small and guarded, so an experiment never costs you the work already
        on your screen.
      </p>
      <div className="safety-grid">
        <article className="safety-item">
          <span className="safety-num">S · 01</span>
          <h3>The model never writes the patch</h3>
          <p>
            It returns the changed code only. The server diffs it with <code>git</code>{" "}
            deterministically — so what lands on disk is auditable, not hallucinated.
          </p>
        </article>
        <article className="safety-item">
          <span className="safety-num">S · 02</span>
          <h3>Clean-tree start</h3>
          <p>
            A session won&apos;t begin if the target file has uncommitted changes. Base
            snapshot, worktree, and patch target stay aligned.
          </p>
        </article>
        <article className="safety-item">
          <span className="safety-num">S · 03</span>
          <h3>Denylisted paths</h3>
          <p>
            Patches touching lockfiles, <code>.env</code>, auth, billing, migrations, or
            CI config are rejected mechanically — not by the model&apos;s good intentions.
          </p>
        </article>
        <article className="safety-item">
          <span className="safety-num">S · 04</span>
          <h3>Snapshot rollback</h3>
          <p>
            Discard restores from the base snapshot, not <code>git reset</code>. Your
            other in-flight work is never destroyed.
          </p>
        </article>
        <article className="safety-item">
          <span className="safety-num">S · 05</span>
          <h3>One session at a time</h3>
          <p>
            Sessions are serialized behind a lock, so rapid clicks and concurrent edits
            can&apos;t race each other into a conflict.
          </p>
        </article>
        <article className="safety-item">
          <span className="safety-num">S · 06</span>
          <h3>Hard limits</h3>
          <p>
            At most three files and a hundred diff lines per variant. Same-file,
            structure-preserving edits only — never a sprawling refactor.
          </p>
        </article>
      </div>
      <div className="req-chips" aria-label="Requirements">
        <span className="req-label">runs on</span>
        <span className="req-chip">Vite plugin</span>
        <span className="req-chip">React + Fast Refresh</span>
        <span className="req-chip">a git repo</span>
        <span className="req-chip">dev mode only</span>
      </div>
    </section>
  );
}
