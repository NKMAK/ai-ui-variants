# demo-app LP 魅力強化リライト

## 目的

`examples/demo-app`（＝GitHub Pages の LP）を、プロダクト（`ai-ui-variants`）の中身に正しく整合させ、最大の差別化である「安全性・信頼性」と「複数案を実画面で選べる」価値が伝わる LP に強化する。既存のエディトリアル調デザイン・構成・トーンは維持し、コピーとリンクと1セクション追加で仕上げる。

## 確定方針（ユーザー確認済み）

1. **魅力強化リライト**: 既存構成・トーン維持。事実誤り修正＋リンク修正＋安全性/差別化セクション追加。
2. **製品名は `ai-ui-variants` に統一**: LP の「UI Variant Preview Agent」表記を `ai-ui-variants` 主体に置換。
3. **実URLを設定**: GitHub=`https://github.com/NKMAK/ai-ui-variants`、See the demo=`#playground` アンカー、Read the spec=リポジトリの README/spec へ。

## 参照ドキュメント

| ファイル | 確認観点 |
|---|---|
| `README.md` | Safety constraints 章・Requirements 章・apply の正確な挙動・正式名称（ai-ui-variants）・GitHub Pages URL |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | apply は restore snapshot→apply patch（コミットしない）／差別化の方向（既存ツールは jump 止まり）／ガードレール詳細 |
| `examples/demo-app/src/App.css` | 流用するデザイントークン・既存クラス（band, band.deep, features-grid, steps, chip, feature-tag 等） |

## 事実ベースの修正点（LP→正）

| 箇所 | 現状（誤/弱） | 修正後 |
|---|---|---|
| Workflow step04 | "committed to your main worktree" | apply はコミットせず working tree に patch を当てるだけ → "applied to your working tree, as a plain diff" |
| Workflow step02 / Features F02 | 生成器を "Claude" 固定 | pluggable（デフォルト mock、claude-code はオプション）と分かる表現に緩める |
| Masthead brand / Footer | "UI Variant Preview Agent" | `ai-ui-variants`（必要に応じ副題で説明） |
| Masthead GitHub / Hero CTA | href 無し・`https://github.com/` プレースホルダ | 実URL |

## 追加する訴求（魅力の欠落補強）

- **安全性セクション新設**（最大の差別化）: AIはdiffを書かない・決定論的patch化／clean-tree制約／denylist／snapshotロールバック／単一セッションlock／3ファイル・100行制限。
- **差別化の一言**: react-dev-inspector 等は「ソースへジャンプ」止まり。本ツールは「複数案を実画面で選べる」。Hero または安全性セクションのリードに織り込む。
- **動作要件**: Vite plugin / React + Fast Refresh / git 必須 / dev 専用。安全性セクション内にコンパクトに同梱（肥大回避）。

## 設計方針（LP 構成）

セクション流れ: Hero(01) → Workflow(02) → Features(03) → **Safety(04・新設)** → Playground(05)。
- `hero::before` の番号を `"01 / 04"` → `"01 / 05"` に更新。
- Masthead nav に `safety` を追加（workflow / features / safety / playground）。
- Safety は既存 `band`（明色）で構成し、`features-grid` 風のグリッドかリスト＋脇に要件チップ群。新規クラスは最小限、既存トークン（--ink, --vermillion, --mono, feature-tag 等）を流用。
- 新規コンポーネント `Safety.tsx` を追加し `App.tsx` の Features と Playground の間に差し込む。

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細 |
|---|---|---|---|
| 1 | LP リライト＋安全性セクション追加 | 未着手 | 本 summary に手順を内包（単一フェーズ） |

## 実装ステップ

1. `examples/demo-app/src/components/Masthead.tsx` — brand-name を `ai-ui-variants` に、`brand-mark` は維持。nav に `<a href="#safety">safety</a>` を追加。GitHub リンクを `https://github.com/NKMAK/ai-ui-variants` に。`chip` の `v0.1 · MVP` は維持。
2. `examples/demo-app/src/components/Hero.tsx` — eyebrow/タイトル/sub のトーンは維持しつつ製品名整合。`See the demo` を `<a className="cta cta-primary" href="#playground">`、`Read the spec` を `<a className="cta cta-ghost" href="https://github.com/NKMAK/ai-ui-variants#readme">` に変更（button→anchor、`type` 削除、矢印 span 維持）。差別化の一文を sub か meta 近辺に軽く追加可。
3. `examples/demo-app/src/components/Workflow.tsx` — step02 の "Claude" を「pluggable な生成器（デフォルト mock）」が伝わる表現に。step04 の "committed to your main worktree" を "applied to your working tree as a plain diff. Discard the rest." に修正。
4. `examples/demo-app/src/components/Features.tsx` — F02 の "Claude returns…" を「the generator returns…（pluggable; mock by default, claude-code optional）」相当に緩める。F01/F03/F04 は事実整合を確認のうえ維持。
5. `examples/demo-app/src/components/Safety.tsx`（新規）— `<section className="band" id="safety">`。section-eyebrow `// safety`、section-title（例: "Narrow by design. Safe by default."）、リード文に差別化（jump 止まりのツールとの差）。グリッドで6項目（AIはdiffを書かない／clean-tree制約／denylist／snapshotロールバック／単一セッションlock／3ファイル・100行制限）。末尾に要件チップ群（Vite plugin · React + HMR · git repo · dev only）。intrinsic JSX のみ使用。
6. `examples/demo-app/src/App.tsx` — `Safety` を import し、`<Features />` と `<Playground />` の間に挿入。
7. `examples/demo-app/src/App.css` — `.hero::before` の content を `"01 / 05"` に更新。Safety 用クラス（`.safety-grid`, `.safety-item`, `.req-chips` 等）を既存トークンで追加。レスポンシブ（960px）で safety グリッドを1カラムに。
8. `examples/demo-app/src/components/Footer.tsx` — footer-meta の名称を `ai-ui-variants` に統一。footer-tag（Click. Compare. Pick.）は維持。
9. `pnpm --filter demo-app build` を実行し型・ビルド成功を確認。
10. 変更をコミット（develop ブランチ。なぜ＝LPが製品実態とズレ・魅力欠落していたため整合と訴求強化）。

## 完了条件

- [ ] LP の事実誤り（committed→applied、Claude固定→pluggable）が修正されている
- [ ] 製品名が `ai-ui-variants` に統一されている
- [ ] Masthead GitHub / Hero CTA が実URL・実アンカーで機能する
- [ ] 安全性セクションが追加され、要件と差別化が訴求されている
- [ ] `data-ui-source` 注入対象（intrinsic JSX）を壊していない（custom 大文字要素を増やしていない／既存属性二重化なし）
- [ ] `pnpm --filter demo-app build` が通る
- [ ] 変更をコミットした

## スコープ外

- 全面リデザイン（構成・配色・タイポの刷新）はしない。
- README / 仕様ファイル自体の改訂はしない（今回は LP のみ）。
- 実際の overlay 動作・サーバ実装には触れない。
