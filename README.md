# ai-ui-variants

> Click a UI element, let AI generate multiple code-change variants, and preview them live — right on the screen you're looking at.

`ai-ui-variants` is an experimental [Vite](https://vitejs.dev/) plugin that turns "tweak this button / heading / card" into a tight loop:

1. **Click** a rendered element in your running app.
2. The plugin resolves it back to the exact source location.
3. AI generates several variants (`Variant A / B / C`) over a minimal slice of code.
4. **Preview** each variant live via HMR and step through them with *prev / next*.
5. **Apply** the one you like to your working tree — discard the rest.

The AI never writes diffs. It returns the changed code (as search/replace blocks); the server turns that into a patch deterministically with `git diff`, so changes apply cleanly to your real tree.

> **Status:** MVP / experimental. APIs and behavior may change.

## Demo

https://github.com/user-attachments/assets/c611c584-8342-41a0-9366-16d5588960c2


A public landing page (display only — the local agent overlay does not run there) is published via GitHub Pages:

👉 **https://nkmak.github.io/ai-ui-variants/**

To try the editable overlay, run the demo app locally (see [Quick start](#quick-start)).

## How it works

The tool is one Vite plugin wrapping three cooperating pieces:

```
┌─────────────────────┐     HTTP (/__ui_agent)      ┌──────────────────────┐
│  Browser Overlay     │ ─────────────────────────▶ │  Local Agent Server   │
│  (Preact + Shadow    │                            │  (Vite middleware)    │
│   DOM, injected)     │ ◀───────────────────────── │  session / snapshot / │
│  click → inspect →   │     variants, patches      │  worktree / patch     │
│  preview → apply     │                            │           │           │
└─────────────────────┘                            └───────────┼───────────┘
                                                                ▼
                                                    ┌──────────────────────┐
                                                    │  AI Patch Generator   │
                                                    │  mock | claude-code   │
                                                    └──────────────────────┘
```

- **Browser Overlay** — injected into the page, isolated in a Shadow DOM. Lets you pick an element, send an instruction, and flip through generated variants.
- **Local Agent Server** — Vite dev middleware mounted at `/__ui_agent`. Manages sessions, captures a base snapshot, isolates work in a `git worktree`, and builds/applies patches.
- **AI Patch Generator** — pluggable. Ships with a `mock` generator and a `claude-code` generator.

At build time, the plugin's `transform` hook auto-annotates intrinsic JSX elements with a `data-ui-source` attribute (app-root-relative path + line/column) so the overlay can map a click back to source.

## Requirements

This plugin targets a specific dev setup. Make sure your project meets all of these:

- **Node.js 20+**
- **Vite 7** (`vite@^7.0.0`, declared as a peer dependency)
- **React** via [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react) — the live-preview loop relies on Fast Refresh to keep component state across variants
- **A git repository** — variants are isolated with `git worktree` and turned into patches with `git diff`
- **Dev mode only** — the plugin runs under `vite` (`serve`); it is a no-op in production builds
- **[Claude Code](https://claude.com/claude-code) CLI** — required *only* when using `generator: "claude-code"` (the `claude` command must be on your `PATH`). The default `mock` generator needs nothing extra.

For the demo in this repo you'll also need [pnpm](https://pnpm.io/) (the monorepo's package manager).

## Setup

> **Note:** this package is not published to npm yet. For now, use it inside this repository (run the demo) or wire it into your own app via a workspace/local reference, as described below.

### 1. Clone and install

```bash
git clone https://github.com/NKMAK/ai-ui-variants.git
cd ai-ui-variants
pnpm install
```

### 2. Run the demo

```bash
pnpm --filter demo-app dev
```

Open the dev server URL, toggle the overlay on, and click an element marked with `data-ui-source` (Hero, CTA, feature cards, the Playground form, …) to generate and preview variants. This is the fastest way to see the full loop.

The demo is configured with the `claude-code` generator, so to actually generate variants you need the [Claude Code](https://claude.com/claude-code) CLI installed (see [Requirements](#requirements)). Switch the demo's `vite.config.ts` to `generator: "mock"` if you just want to try the overlay without a model.

### 3. Add it to your own app

Because the package isn't on npm, reference it locally. If your app lives in this monorepo, add it as a workspace dependency:

```jsonc
// your-app/package.json
{
  "dependencies": {
    "vite-plugin-ui-variants": "workspace:*"
  }
}
```

For an app outside the monorepo, point at a local path (or a git URL) instead:

```jsonc
{
  "dependencies": {
    "vite-plugin-ui-variants": "file:../ai-ui-variants/packages/vite-plugin-ui-variants"
  }
}
```

Run `pnpm install`, then register the plugin in your Vite config (see [Usage](#usage)).

### 4. Configure the generator (optional)

The default generator is `mock` and needs no setup. To use Claude Code, install the CLI, set `generator: "claude-code"`, and add the prompt files referenced by your config:

- `.ui-variants/claude-code-prompt.md` — prompt template (placeholders filled by the server)
- `.ui-variants/project-context.md` — extra context (design rules, Tailwind conventions, …)

You can copy this repo's `.ui-variants/` as a starting point. See [Generators](#generators) for details.

## Usage

Add the plugin to your Vite config. It **must come before `@vitejs/plugin-react`** in the array (so its `transform` runs first).

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { uiVariants } from "vite-plugin-ui-variants";

export default defineConfig({
  plugins: [
    uiVariants({
      generator: "claude-code",
      promptTemplatePath: ".ui-variants/claude-code-prompt.md",
      promptContextPaths: [".ui-variants/project-context.md"],
    }),
    react(),
  ],
});
```

The plugin only runs in `serve` (dev) mode.

### Options

| Option               | Type                      | Default     | Description                                                         |
| -------------------- | ------------------------- | ----------- | ------------------------------------------------------------------ |
| `generator`          | `"mock" \| "claude-code"` | `"mock"`    | Which variant generator to use.                                    |
| `appRoot`            | `string`                  | Vite `root` | App root used to normalize `data-ui-source` paths.                 |
| `promptTemplatePath` | `string`                  | built-in    | Prompt template for the `claude-code` generator.                   |
| `promptContextPaths` | `string[]`                | `[]`        | Extra Markdown files (design rules, Tailwind notes, …) to pass in. |

## Generators

### `mock` (default)

Returns canned variants. Useful for developing the overlay/server without calling a model.

### `claude-code`

Runs the [Claude Code](https://claude.com/claude-code) CLI from a local Node process:

```
claude -p <prompt> --output-format json --allowedTools "" --model <model>
```

No tools are granted to the model — it returns search/replace JSON only. Patch creation, preview, apply, and discard are all handled server-side.

#### Prompt customization

The prompt sent to Claude Code lives in `.ui-variants/claude-code-prompt.md`. Placeholders such as `{{userInstruction}}` and `{{codeRangeJson}}` are filled in by the server. To pass extra context (design rules, Tailwind conventions, …), add Markdown files and list them in `promptContextPaths`.

#### Model selection

Set the model via environment variable:

```bash
UI_VARIANTS_CLAUDE_MODEL=opus pnpm --filter demo-app dev
```

Defaults to `claude-haiku-4-5` when unset.

## Safety constraints

Variant generation is intentionally narrow and guarded:

- **Clean-tree requirement** — a session won't start if the target file has uncommitted changes (keeps base snapshot, worktree base, and patch target aligned).
- **Same-file, structure-preserving edits only** — text / label / props / className / size, etc. No import changes or cross-file ripples that would break Fast Refresh and lose state.
- **Denylist** — patches touching `package.json`, lockfiles, `.env*`, anything matching `*auth*` / `*billing*` / `*migration*`, `migrations/`, `infra/`, or `.github/` are rejected mechanically.
- **Limits** — at most `3` files and `100` diff lines per variant.
- **Single-session lock** — sessions are serialized to avoid concurrent-edit conflicts.
- **Snapshot-based rollback** — discard restores from the base snapshot rather than `git reset`, so your other work is never destroyed.

## Project structure

```
packages/
  vite-plugin-ui-variants/   # the plugin (overlay + local server + generators)
    src/
      shared/                # types shared between server & client
      server/                # session, snapshot, worktree, patch, generators (Node)
      client/                # browser overlay (Preact, Shadow DOM)
      transform/             # data-ui-source injection & path normalization
      index.ts               # plugin entry
examples/
  demo-app/                  # React + Vite demo app (also the landing page)
```

Runtime session data lives under `.ui-agent/` (gitignored).

## Scripts

| Command                              | Description                              |
| ------------------------------------ | ---------------------------------------- |
| `pnpm install`                       | Install dependencies                     |
| `pnpm --filter demo-app dev`         | Run the editable demo (overlay enabled)  |
| `pnpm --filter demo-app build:pages` | Static build for GitHub Pages            |
| `pnpm --filter demo-app preview`     | Preview the static build                 |
| `pnpm typecheck`                     | Type-check all packages (`tsc --noEmit`) |
| `pnpm lint`                          | Run ESLint                               |
| `pnpm format:check`                  | Check formatting with Prettier           |

## Tech stack

- **Monorepo:** pnpm workspaces (`packages/` + `examples/`)
- **Language:** TypeScript
- **Plugin host:** Vite dev middleware + `transformIndexHtml` injection + HMR
- **Overlay UI:** Preact + `@preact/signals`, isolated in a Shadow DOM
- **Demo app:** React (Fast Refresh keeps state across previews)
- **Variant isolation:** `git worktree` + `git diff`

## License

[MIT](./LICENSE) © NKMAK
