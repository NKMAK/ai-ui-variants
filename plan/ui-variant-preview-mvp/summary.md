# UI Variant Preview Agent MVP 実装計画

## 目的

「UIをクリックして、AIが作った複数のコード変更案を実画面で選べる」体験を end-to-end で成立させる。MVP では AI を mock にし、クリック→source location 取得→指示入力→Variant A/B/C 生成（mock）→main worktree への一時 patch 適用 → HMR で前へ/次へ切替 → 選んだ案を適用/破棄、までを動かす。

## 確定した設計判断（この計画の前提）

- **AI 出力形式**: `FileChange.edits`（search/replace ブロック）を採用。`fullContent` は使わない。
- **Variant 隔離**: `git worktree`（HEAD から add → 変更後コード書込 → `git diff` で patch 化 → remove）。temp dir 簡素化は採らない。
- **AI generator**: MVP は mock（`server/generator/mock.ts`）で切替・apply/discard のコア体験を固め、続けて **本番 generator を Claude Code headless（`claude -p --output-format json`）** で実装する（`server/generator/claude-code.ts`）。Anthropic API キー直叩きはせず、ローカルの Claude Code 認証を流用する。`VariantGenerator` interface で差し替え可能にし、plugin option で `mock | claude-code` を選ぶ。
  - 生成時は Claude にツールを与えず（`--allowedTools ""`）、ファイルを探索・書換させない。AI は「変更後コード（search/replace）」を JSON で返すテキスト生成に徹し、patch 化はサーバ側（`git diff`）が行う ＝ 仕様の不変条件「AI は diff を書かない」と一致。

仕様 v2 の不変条件（実装で崩さない）:

- **完全寄り制約**: セッション開始時、対象ファイルに未コミット変更があれば開始しない（worktree base = main 現状 = snapshot を一致させ patch を conflict なく当てる）。
- **AI は diff を書かない**: patch 化は `git diff` でサーバが決定論的に行う。
- **同一ファイル・構造を壊さない変更に限定**: text/label/props/className/size 等のみ（Fast Refresh 維持）。
- **rollback は base snapshot 中心**（`git reset` を使わない）。
- **単一セッション排他 + lock で逐次化**。
- **禁止ファイルは patch から機械チェック**（denylist）。

## 参照ドキュメント

| ドキュメント | 確認観点 |
| --- | --- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | 全体フロー・API 案・Session モデル・ガードレール・不変条件 |
| `.claude/tech/folder-structure.md` | ディレクトリ構成・パス基準（git root 相対 / アプリ相対⇔repo相対変換） |
| `.claude/tech/git-worktree.md` | worktree add/diff/remove 運用、patch が main に当たる条件 |
| `.claude/tech/ai-mock-generator.md` | generator interface・VariantOutput/FileChange 型・patch 検証 |
| `.claude/tech/vite.md` | `configureServer` middleware / `transformIndexHtml` overlay 注入 / `apply: "serve"` |
| `.claude/tech/hmr-fast-refresh.md` | preview = ファイル書換で自動 HMR、状態維持の条件 |
| `.claude/tech/data-ui-source.md` | `data-ui-source` 属性形式、デモは手書き、行番号ズレの扱い |
| `.claude/tech/shadow-dom.md` | overlay のスタイル隔離、HighlightBox 座標合わせ |
| `.claude/tech/preact.md` / `preact-signals.md` | overlay の Preact/Signals 構成 |

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細ファイル |
| --- | --- | --- | --- |
| 1 | モノレポ足場 + shared + demo-app | 完了 | [01-scaffold-shared-demo.md](01-scaffold-shared-demo.md) |
| 2 | Local Agent Server + plugin middleware | 完了 | [02-server/](02-server/summary.md) |
| 3 | Overlay 注入 + Inspector（クリック→source 表示） | 完了 | [03-overlay/](03-overlay/summary.md) |
| 4 | Panel 操作フロー（生成→切替→適用/破棄） | 完了 | [04-panel/](04-panel/summary.md) |
| 5 | 本番 generator（Claude Code headless） | 完了 | [05-claude-code-generator.md](05-claude-code-generator.md) |

積み上げ構造: **shared → server → client(inspector) → client(panel) → 本番 generator 差し替え**。Phase 4 までで mock による体験を完成させ、Phase 5 で generator を Claude Code headless に差し替える（interface は不変）。各フェーズ末に独立して検証できるマイルストーンを置く。

規模の大きい Phase 2/3/4 はフォルダにし、内部をサブタスク（`01-*.md`, `02-*.md`）へ分割した。**各サブタスクは単独で検証・コミットできる粒度**で、フォルダ内 `summary.md` がそのフェーズの目的・サブタスク一覧・完了条件を持つ。Phase 1/5 は小さいので 1 ファイルのまま。

## 設計方針（フェーズ横断の決め事）

- パッケージ名は `vite-plugin-ui-variants`、エクスポートは `uiVariants()`。
- API パスは `/__ui_agent/*`（`constants.ts` に集約）。
- `data-ui-source` 値はアプリルート相対（例 `src/components/SaveButton.tsx:2:5`）。`server/paths.ts` が repo 相対（例 `examples/demo-app/src/components/SaveButton.tsx`）へ変換。
- git 操作はすべて git root 基準（`git -C <repoRoot> ...`）。
- `.ui-agent/` は git root 直下・gitignore・実行時生成。
- overlay バンドルは plugin の virtual module として配信し、Vite が Preact JSX を変換する。

## スコープ外（MVP でやらない）

- Claude API 直叩き / Claude Agent SDK 版 generator（本命は Claude Code headless。これらは後続候補）
- `data-ui-source` のビルド時自動注入（demo はソースに手書き）
- 複数セッション同時実行 / 複数 dev server / 複数 iframe
- PR 作成 / デザイナー承認 / Storybook / visual regression
- 作業ツリー柔軟寄りモード（未コミット変更との共存）

## 完了条件

- [x] `pnpm install` が通り、`pnpm --filter demo-app dev` で demo-app が起動する
- [x] 各パッケージで `pnpm tsc --noEmit` が型エラーなく通る
- [x] ブラウザで overlay を ON にし、要素を hover で強調・クリックで source location を表示できる
- [x] 指示入力 → Variant A/B/C（mock）が生成され、patch が `git diff` で作られ検証を通る
- [x] 「前へ / 次へ」で main worktree のファイルが切り替わり、HMR で画面が更新され、form 入力など in-memory state が保たれる
- [x] 「適用」で選んだ patch だけが残り、「破棄」で base snapshot に戻る
- [x] 完全寄り制約（対象ファイルに未コミット変更があれば start 拒否）と単一セッション排他が機能する
- [x] Claude Code headless generator（`claude -p`）が指示から実際に Variant A/B/C（search/replace）を返し、patch 化・検証・preview まで通る
- [x] 各フェーズの変更がコミットされている

## 後続候補

- Claude Agent SDK 版 / Claude API 直叩き版 generator（`VariantGenerator` の別実装）
- `data-ui-source` のビルド時自動注入（Babel/SWC/Vite plugin）
- patch 適用後の `data-ui-source` 行番号の HMR 経由再注入
