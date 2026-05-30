import { useState } from "react";

export function Playground() {
  const [note, setNote] = useState("");

  return (
    <section className="band" id="playground">
      <div className="playground-grid">
        <div className="playground-copy">
          <p className="section-eyebrow">// playground</p>
          <h2 className="section-title">
            Try it <em>on this very page</em>.
          </h2>
          <p className="section-lead">
            Clone the repo, run <code>pnpm --filter demo-app dev</code>, and turn the
            overlay on. Then click any of the elements listed below — variants will land
            right here, in the page you are reading.
          </p>
          <ul>
            <li>
              <strong>01 Hero headline</strong> · rewrite the lead.
            </li>
            <li>
              <strong>02 Workflow cards</strong> · try a tighter, sharper tone.
            </li>
            <li>
              <strong>03 Feature titles</strong> · explore alternative voicings.
            </li>
            <li>
              <strong>04 Footer tag</strong> · flip through variants in a keystroke.
            </li>
          </ul>
        </div>

        <div className="scratchpad">
          <div className="scratchpad-head">
            <h3>Scratchpad.</h3>
            <span className="chip">stateful</span>
          </div>
          <p>
            Type something here, then trigger a variant on any element. Your text — and
            the cursor position — survive the swap.
          </p>
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              // inline style を持つクリック対象。overlay でこの textarea を選び、
              // border 色や radius を variant で差し替えるデモ用ターゲット。
              style={{ border: "2px solid #FF8C00", borderRadius: "12px" }}
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              placeholder="A title idea. A todo. Anything that should outlive a variant swap."
              rows={4}
            />
          </label>
          <div className="state-readout">
            <strong>state</strong>
            <code>{note.length} chars</code>
            {note.length > 0 && <span>· preserved across variants</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
