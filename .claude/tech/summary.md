# tech サマリー

このフォルダにある技術ドキュメントの概要とパス一覧。

## 構成要素と担当技術

このツールの3コンポーネント（仕様「最終アーキテクチャ」）と、それを支える技術の対応:

| コンポーネント | 担当技術 |
|---|---|
| Browser Overlay / Inspector UI | [Preact](preact.md) + [Signals](preact-signals.md) / [Shadow DOM](shadow-dom.md) |
| Local Agent Server | [Vite](vite.md) middleware / [git worktree](git-worktree.md) |
| AI Patch Generator | [AI Patch Generator](ai-mock-generator.md)（mock / Claude Code headless） |

## ファイル一覧

| ファイル | 概要 |
|---|---|
| [folder-structure.md](folder-structure.md) | monorepo全体のディレクトリ構成と各ディレクトリの役割。パス基準（git root相対／アプリ相対⇔repo相対の変換）の約束も記載。 |
| [typescript.md](typescript.md) | 全体の実装言語。server/client/shared のレイヤー分けと、共有型を `shared/types.ts` に集約する方針。 |
| [pnpm-monorepo.md](pnpm-monorepo.md) | `packages/`（ツール本体）と `examples/`（デモ）を分ける理由と workspace 構成。 |
| [vite.md](vite.md) | dev基盤かつツール本体の載せ場所。`configureServer`(middleware)・`transformIndexHtml`(overlay注入)・`transform`(data-ui-source 自動注入)・HMRトリガーを1pluginに集約。`uiVariants()` は `react()` より前に並べる必要がある。 |
| [react.md](react.md) | デモアプリ（ホスト側）。preview surfaceを提供。Fast Refreshで状態維持。overlayのPreactとは別物。 |
| [preact.md](preact.md) | overlay UI（注入側）。約3KB・JSX/hooks・独自バンドルでホストReactと版数衝突しない。 |
| [preact-signals.md](preact-signals.md) | overlayの状態管理。ON/OFF・選択source・variant・currentIndex等を signal で集中管理。 |
| [shadow-dom.md](shadow-dom.md) | overlayのスタイル隔離。ホストCSSとの相互干渉を物理的に防ぐ。HighlightBoxの座標合わせ注意点。 |
| [git-worktree.md](git-worktree.md) | variantを隔離生成し `git diff` でpatch化。worktree base一致でconflictなく当たる。temp dir簡素化の代替も記載。 |
| [hmr-fast-refresh.md](hmr-fast-refresh.md) | preview切替の仕組み。ファイル書込で自動発火。状態維持が効く条件（同一ファイル・構造を壊さない）。 |
| [data-ui-source.md](data-ui-source.md) | UI→ソース位置の対応付け属性。dev 時に Vite `transform` hook が JSX intrinsic element へ自動注入する（手書きはなし）。server 側の path 検証と既知制約を含む。 |
| [ai-mock-generator.md](ai-mock-generator.md) | AIは「変更後コード」を返し、patch化はサーバ側。generator interface・型・Claude Code prompt/model指定・usage metadata・patch検証（denylist等）。 |

---

最終更新: 2026-05-30
