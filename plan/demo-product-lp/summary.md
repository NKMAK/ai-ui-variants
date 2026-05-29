# Demo product landing page plan

## 目的

`examples/demo-app` を、UI Variant Preview Agent 自体を紹介する英語の product landing page に置き換え、GitHub Pages に公開でき、かつ overlay から LP の文言・CTA・見た目を編集対象として選べるデモ環境にする。

## 参照ドキュメント

| ドキュメント                                                  | 確認観点                                                                    |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | demo の役割、`data-ui-source` 手書き、同一ファイル・構造を壊さない変更制約  |
| `.claude/tech/folder-structure.md`                            | `examples/demo-app` の責務、monorepo 内のパス基準                           |
| `.claude/tech/react.md`                                       | demo app は React host app、Fast Refresh の状態維持を見せる preview surface |
| `.claude/tech/data-ui-source.md`                              | `data-ui-source` はアプリルート相対で手書き、クリック対象の設計             |
| `.claude/tech/hmr-fast-refresh.md`                            | variant で許可する変更タイプ、state を失わない設計                          |
| `examples/demo-app/src/App.tsx`                               | 現在の最小 demo 画面、state 維持用 input の存在                             |
| `examples/demo-app/src/components/SaveButton.tsx`             | 現在の唯一の `data-ui-source` 付き編集対象                                  |
| `examples/demo-app/vite.config.ts`                            | demo app の Vite 設定、GitHub Pages 用 `base` 追加候補                      |

## 現在地

- `examples/demo-app` は最小検証用の日本語画面で、LP としての情報設計・見た目はまだない。
- 編集対象は `SaveButton.tsx` のみで、実際に「LP の一部をクリックして変える」体験が弱い。
- `vite build` は存在するが、GitHub Pages 用の base path / deploy workflow / README 上の案内は未整備。
- generator は Claude Code headless を使う設定になっているため、demo LP は Claude が text/label/className 変更をしやすいファイル構成にしておく。

## 設計方針

- LP の表示文言はすべて英語にする。OSS として海外ユーザーに伝えることを優先する。
- LP はこのプロダクト自体を紹介する。中心メッセージは `Click UI. Generate code-backed variants. Preview and pick one.` に寄せる。
- 画面は「実際の編集対象」として作る。Hero、CTA、feature cards、workflow、demo panel、waitlist/contact form など、クリックして variant を作りたくなる単位に `data-ui-source` を付ける。
- `data-ui-source` は demo 専用に手書きする。値は `src/...` のアプリルート相対にする。
- Fast Refresh の状態維持デモのため、email input や small note input など in-memory state を残す。
- variant が安全に当たりやすいよう、主要 UI は同一ファイル内の text / className / props / style token 変更で完結する粒度にする。
- GitHub Pages 公開は static build を前提にする。ただし overlay / local agent は dev server 用なので、公開 LP では overlay の操作までは提供しない。公開 LP は product introduction、local dev は editable demo という役割分担にする。

## フェーズ一覧

| #   | フェーズ名                     | 状態 | 詳細ファイル                                                     |
| --- | ------------------------------ | ---- | ---------------------------------------------------------------- |
| 1   | LP 情報設計と編集対象設計      | 完了 | [01-content-and-edit-targets.md](01-content-and-edit-targets.md) |
| 2   | demo app の LP 実装            | 完了 | [02-demo-lp-implementation.md](02-demo-lp-implementation.md)     |
| 3   | GitHub Pages build/deploy 準備 | 完了 | [03-github-pages.md](03-github-pages.md)                         |
| 4   | 検証・ドキュメント・コミット   | 完了 | [04-verification-and-handoff.md](04-verification-and-handoff.md) |

## スコープ外

- 本番サイト向けの CMS / analytics / SEO 詳細設計。
- `data-ui-source` の自動注入。
- overlay を GitHub Pages 上で動かすこと。
- Claude generator 自体の改善。
- PR 作成。必要なら計画完了後に別タスクで扱う。

## 完了条件

- [x] `examples/demo-app` が英語の product landing page として成立している。
- [x] LP 内の主要な編集対象に `data-ui-source` が付いている（Masthead / Hero / PreviewCard / Workflow / Features / Playground / Footer の各コンポーネント）。
- [x] 入力欄などの state を保持したまま variant preview できる確認用 UI が残っている（`Playground.tsx` の email input、`PreviewCard.tsx` の active variant）。
- [x] `pnpm --filter demo-app build` が通る。
- [ ] `pnpm --filter demo-app dev` で overlay から LP 要素を選択できる（ブラウザ確認はユーザー側で実施）。
- [x] GitHub Pages 向け build/deploy の手順または workflow が整備されている（`build:pages` script、`.github/workflows/demo-pages.yml`、`vite.config.ts` の base 切替）。
- [x] 変更内容と検証方法が README または plan に残っている。
- [ ] 変更をコミットする。

## 実装メモ

- LP は editorial paper + brutalist mono の方向で構築（Fraunces 可変フォントの italic ヘッドライン、IBM Plex Mono のタグ、vermillion アクセント）。
- コンポーネントは `src/components/` に責務単位で分割（Masthead / Hero / PreviewCard / Workflow / Features / Playground / Footer）。各コンポーネントが自身の `data-ui-source` を持つ。
- `PreviewCard.tsx` は Variant A/B/C で見た目と text が切り替わる product mock を内蔵し、ツールの中心体験を hero で示す。
- `data-ui-source` の行番号は prettier 整形後の実位置に揃え済み。
- GitHub Pages 用 base path は `process.env.GITHUB_PAGES === "true"` で切替（`/ai-ui-variants/`）。Actions は `main` への push で発火。
- `SaveButton.tsx` は LP 化に伴い削除。`PreviewCard` の mock 表示内で参照されるパスは demo 用の架空ファイル名として残している。

## Claude 実装時の注意

- 実装前にこの plan と参照ドキュメントを読む。
- コード変更は `examples/demo-app` と必要な deploy/docs 周辺に限定する。
- `as any` を使わない。
- 既存の user changes を巻き戻さない。
- `data-ui-source` は必ず app root relative path にする。
- LP の visible copy は英語にする。
- 画面内に「使い方説明」を長々と置かず、product LP として自然に見せる。
- 完了時にこの `summary.md` のフェーズ状態と完了条件を更新する。
