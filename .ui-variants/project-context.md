# Project context for UI variants

- The demo app is a small React app.
- Source location metadata (`data-ui-source`) is auto-injected by the dev plugin at transform time. It does not appear in the source files, so never reference it in search/replace text.
- Keep generated variants scoped to the selected component and selected code range.
- Prefer visible UI changes that can be previewed without adding imports or changing component structure.
- Current styling surfaces are existing CSS classes defined in `examples/demo-app/src/App.css` and Tailwind utility classes already present in the selected JSX.
- Tailwind utilities are allowed when editing JSX that already uses Tailwind utility classes, but arbitrary new semantic class names are not safe unless `App.css` already defines them.
- Do not add new CSS class names such as `hero-bordered` unless that exact class already exists in `App.css` or the selected JSX. A new class without CSS has no visible effect.
