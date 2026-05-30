# Styling Surface Guard And Tailwind Demo

## 目的

AI が `hero-bordered` のような効かない styling hook を発明しないようにしつつ、demo-app の一部コンポーネントを Tailwind CSS でも編集できる pilot surface にする。

## 参照ドキュメント

| ドキュメント                                                  | 確認観点                                                                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                   | 同一ファイル・構造を壊さない変更、既存未コミット変更を戻さない、plan 更新とコミット                              |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | `className / Tailwind class / props / variant / size` は対応範囲だが、import・構造変更・複数ファイル波及は避ける |
| `.claude/tech/ai-mock-generator.md`                           | Claude Code prompt / project context / search-replace JSON の境界                                                |
| `.claude/tech/hmr-fast-refresh.md`                            | Fast Refresh 維持のための同一ファイル・構造維持制約                                                              |
| `plan/prompt-customization/summary.md`                        | host app 側の `promptTemplatePath` / `promptContextPaths` による context 注入                                    |
| Tailwind CSS official Vite installation docs                  | Tailwind v4 の Vite plugin 導入手順（`tailwindcss`, `@tailwindcss/vite`, `@import "tailwindcss";`）              |

## 現在地

- `examples/demo-app/src/components/Hero.tsx` の `hero-bordered` は削除済み。Hero section は既存 `hero` class と Tailwind utility (`border border-[var(--line-strong)]`) の併用になっている。
- default prompt と demo prompt に、未定義 className / 未知 props / 未知 token を発明しない汎用 styling surface guardrail を追加済み。
- demo-app は通常 CSS (`examples/demo-app/src/App.css`) を残したまま Tailwind v4 Vite plugin を導入済み。
- prompt customization はすでにあり、`.ui-variants/project-context.md` を Claude Code generator に渡せる。

## 設計方針

- ライブラリ固有名ではなく **known styling surface** という抽象ルールで縛る。
- styling hook は `className`、inline `style`、UI library の visual props、`variant` / `size` / `color`、theme token、design token、Tailwind utility などを含むものとして定義する。
- AI は「選択行周辺に既にある styling hook」または「project context に明示された styling surface」だけを変更できる。
- CSS class 管理、Tailwind、UI library のどれでも同じルールが効くようにし、Tailwind や Chakra などの固有名は default prompt に直書きしない。
- Tailwind は demo-app の pilot として導入する。まず `Hero.tsx` を対象にし、全画面移行はしない。
- CSS 追加や別ファイル編集が必要な指示は、MVP の通常 generator では safe variant とみなさず、返す variant 数を減らす。

## フェーズ一覧

| #   | フェーズ名                         | 状態   | 詳細ファイル                      |
| --- | ---------------------------------- | ------ | --------------------------------- |
| 1   | styling surface guardrail の明文化 | 完了   | `01-styling-surface-guardrail.md` |
| 2   | Tailwind CSS pilot 導入            | 完了   | `02-tailwind-pilot-setup.md`      |
| 3   | Hero の Tailwind pilot 移行        | 完了   | `03-hero-tailwind-pilot.md`       |
| 4   | 実画面検証とコミット               | 進行中 | `04-verify-and-commit.md`         |

## スコープ外

- UI ライブラリ固有の adapter 実装。
- CSS / Tailwind / UI library の自動検出。
- 複数ファイル編集を許可する generator mode。
- demo-app 全体の Tailwind 移行。
- server 側 `/session/start` や `useVariants` lifecycle の変更。

## 完了条件

- [x] default prompt と demo prompt に、未知の styling hook を発明しない汎用ルールが入っている。
- [x] `.ui-variants/project-context.md` に demo-app の styling surface が明記されている。
- [x] Tailwind CSS が demo-app の Vite pipeline に入っている。
- [x] `Hero.tsx` の pilot 範囲が Tailwind utility で表現され、未定義 className (`hero-bordered`) が残っていない。
- [x] Tailwind 化していない既存 CSS が壊れていない。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が通る。
- [x] `pnpm --filter demo-app exec tsc --noEmit` が通る。
- [ ] `pnpm lint` と `pnpm format:check` が通る。
- [ ] demo-app dev server で Hero の見た目と variant 生成を確認する。
- [x] 変更をコミットする。

## 検証メモ

- `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`: 成功。
- `pnpm --filter demo-app exec tsc --noEmit`: 成功。
- `pnpm lint`: 成功。`pnpm --filter demo-app build` 後に生成された `examples/demo-app/dist/` は lint 対象になって失敗するため削除して再実行した。
- `pnpm --filter demo-app build`: 成功。
- `curl http://localhost:5174/src/App.css`: Tailwind v4 CSS と `.border`, `.border-[var(--line-strong)]` の生成を確認。
- `curl http://localhost:5174/src/components/Hero.tsx`: `className="hero border border-[var(--line-strong)]"` と `data-ui-source` 注入を確認。
- `pnpm dlx playwright screenshot --channel chrome`: desktop (`/tmp/ai-ui-variants-hero-desktop.png`) と mobile (`/tmp/ai-ui-variants-hero-mobile.png`) で Hero の表示を確認。
- Playwright script: `.hero` の computed style が `1px solid rgba(20, 18, 15, 0.28)` になっていることを確認。
- Playwright script: Inspector ON 後に Hero をクリックし、overlay panel が `src/components/Hero.tsx:5:5` を選択しつつ、未コミット対象ファイルの clean-file guard で session start が `409` になることを確認。
- `pnpm format:check`: 失敗。今回触っていない既存ファイル 8 件（`PreviewCard.tsx`, `dataUiSource.ts`, 既存 plan docs など）の Prettier 差分が残っている。
- Playwright MCP: 既存ブラウザインスタンスのロックで起動できず、`pnpm dlx playwright` と一時ディレクトリの Playwright script で代替。
- ツール経由の variant 生成: 未実施。対象ファイルに未コミット変更がある状態では session start の clean-file guard に止められるため、コミット後または一時的な別ブランチで確認する。

## 後続候補

- project context を手書きではなく app 側設定から生成する。
- Tailwind / CSS Modules / UI library ごとに styling surface context を分ける。
- 複数ファイル編集 OK の advanced mode を別途設計する。
