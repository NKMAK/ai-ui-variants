# Phase 3: Overlay 注入 + Inspector（クリック→source 表示）

## 目的

Preact + Shadow DOM の overlay を demo-app に注入し、ON/OFF・要素 hover 強調・クリックで `data-ui-source` を取得して source location を表示し、session start を呼ぶところまでを動かす。

## 対象範囲

### 今回やること

- plugin の overlay 注入（`transformIndexHtml` + virtual module）と overlay バンドル配信
- Shadow DOM 生成・signals store・api client・theme.css・ON/OFF トグル
- hover 強調（HighlightBox）・クリック捕捉・source location 表示・session start

### 今回やらないこと

- 指示入力・variant 生成・前へ/次へ・適用/破棄（Phase 4）
- patch 適用後の行番号再注入

## サブタスク一覧

| # | サブタスク | 状態 | 依存 | 並列可否 | ファイル |
| --- | --- | --- | --- | --- | --- |
| 1 | overlay 注入 + Shadow DOM + 足場 + Toggle | 完了 | Phase 2 | 単独委任可 | [01-injection-shadow-dom.md](01-injection-shadow-dom.md) |
| 2 | Inspector（hover/click）+ source 表示 + start | 完了 | #1 | 単独委任可 | [02-inspector-source.md](02-inspector-source.md) |

**実行順**: 1 → 2（直列）。#2 は #1 の Shadow DOM・store・api client 基盤に乗る。

## 参照（全サブタスク共通）

- 仕様: 「UI 体験」「source location の取得」、`.claude/tech/vite.md`・`shadow-dom.md`・`preact.md`・`preact-signals.md`・`data-ui-source.md`
- 不変条件: overlay は Shadow DOM でスタイル隔離（ホスト React と版数衝突しない）

## フェーズ完了条件

- [x] demo-app に overlay の `<script>` が注入され、Shadow DOM 配下に overlay が描画される
- [x] toggle で inspector の ON/OFF が切り替わる
- [x] hover で対象要素に HighlightBox が重なる（ホスト CSS の影響を受けない）
- [x] クリックで `data-ui-source` から `file:line:col` が取得・表示される
- [x] クリック時に session start が呼ばれ `sessionId` が入る（clean 違反は 409 表示）
- [x] `pnpm tsc --noEmit` が通り、各サブタスクがコミットされている

## 検証方法（フェーズ結合確認 = #2 完了時）

```bash
pnpm --filter demo-app dev
```

ブラウザで: toggle 表示 → ON → SaveButton に hover で HighlightBox → クリックで `src/components/SaveButton.tsx:2:5` 表示 → Network で `POST /__ui_agent/session/start` が 200・`sessionId` 取得 → SaveButton をコミットせず変更してクリックで 409 表示。
