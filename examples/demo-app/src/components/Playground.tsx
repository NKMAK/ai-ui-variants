import { useState, type FormEvent } from "react";

export function Playground() {
  const [email, setEmail] = useState("");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setSubmittedAt(new Date().toLocaleTimeString());
  };

  return (
    <section className="band" id="playground">
      <div className="playground-grid">
        <div className="playground-copy">
          <p className="section-eyebrow">// playground</p>
          <h2
            className="section-title"
            data-ui-source="src/components/Playground.tsx:18:11"
          >
            This page <em>is</em> the demo.
          </h2>
          <p
            className="section-lead"
            data-ui-source="src/components/Playground.tsx:24:11"
          >
            Run it locally with the overlay on, then click any of the highlighted
            elements. The form below stays as you switch variants — React Fast Refresh
            keeps the state across patches.
          </p>
          <ul>
            <li>Hero headline · click and rewrite the lead.</li>
            <li>Workflow cards · try a tighter, sharper tone.</li>
            <li>Feature titles · explore alternative voicings.</li>
            <li>The CTA below · A/B/C in three keystrokes.</li>
          </ul>
        </div>

        <form className="signup" onSubmit={handleSubmit}>
          <div className="signup-head">
            <h3>Stay in the loop.</h3>
            <span className="chip">no spam</span>
          </div>
          <p>
            Drop an email and we will ping you when the public beta opens. The input is
            stateful — variant switching will not clear it.
          </p>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="you@studio.dev"
              autoComplete="email"
            />
          </label>
          <button
            type="submit"
            className="cta cta-primary"
            data-ui-source="src/components/Playground.tsx:59:11"
          >
            Notify me
            <span className="arrow" aria-hidden>
              ↗
            </span>
          </button>
          <div className="state-readout">
            <strong>state</strong>
            <code>{email || "—"}</code>
            {submittedAt && <span>· submitted {submittedAt}</span>}
          </div>
        </form>
      </div>
    </section>
  );
}
