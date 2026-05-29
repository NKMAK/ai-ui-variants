# Claude handoff: Demo product landing page

## Task

Implement the plan in `plan/demo-product-lp/` so that `examples/demo-app` becomes an English product landing page for UI Variant Preview Agent.

## Required reading

Read these first:

- `AGENTS.md`
- `plan/demo-product-lp/summary.md`
- `plan/demo-product-lp/01-content-and-edit-targets.md`
- `plan/demo-product-lp/02-demo-lp-implementation.md`
- `plan/demo-product-lp/03-github-pages.md`
- `plan/demo-product-lp/04-verification-and-handoff.md`
- `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md`
- `.claude/tech/react.md`
- `.claude/tech/data-ui-source.md`
- `.claude/tech/hmr-fast-refresh.md`

## Constraints

- Do not change overlay/server/generator behavior unless the plan explicitly requires it.
- Keep visible LP copy in English.
- Keep `data-ui-source` values app-root relative, for example `src/App.tsx:42:7`.
- Preserve the editable demo purpose: local dev should let the overlay select LP elements.
- GitHub Pages is for the static LP only. The local agent overlay is not expected to run on Pages.
- Do not use `as any`.
- Do not revert unrelated user changes.

## Suggested implementation order

1. Replace the simple Japanese demo with the English LP in `examples/demo-app`.
2. Add responsive styling.
3. Add or update GitHub Pages build/deploy support.
4. Run verification commands.
5. Update `plan/demo-product-lp/summary.md` statuses.
6. Commit the result.

## Verification

Run:

```bash
pnpm --filter demo-app exec tsc --noEmit
pnpm --filter demo-app build
git diff --check
```

Also manually verify:

- `pnpm --filter demo-app dev` opens the LP.
- The overlay can select hero, CTA, cards, and the editable demo area.
- Input state survives variant preview when only same-file visual/text changes are applied.
