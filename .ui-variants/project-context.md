# Project context for UI variants

- The demo app is a small React app.
- Source location metadata (`data-ui-source`) is auto-injected by the dev plugin at transform time. It does not appear in the source files, so never reference it in search/replace text.
- Keep generated variants scoped to the selected component and selected code range.
- Prefer visible UI changes that can be previewed without adding imports or changing component structure.
