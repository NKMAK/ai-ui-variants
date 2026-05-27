# Phase 4: Panel 操作フロー（生成→切替→適用/破棄）

## 目的

指示入力から Variant 生成・前へ/次への HMR 切替・適用/破棄までを overlay の Panel に結線し、「UIをクリックして AI の複数案を実画面で選べる」体験を end-to-end で完成させる（generator は mock）。

## 対象範囲

### 今回やること

- ロジック層: api/client への generate/preview/apply/discard 追加、store 拡張、`useVariants`（生成・切替・適用・破棄・連打ロック）
- UI 層: `ui/`（Button/Spinner）・`Panel`・`InstructionInput`・`VariantViewer`（前へ/次へ）・`PanelActions`（適用/破棄）

### 今回やらないこと

- Claude 統合（mock のまま。Phase 5）
- patch 適用後の `data-ui-source` 行番号再注入

## サブタスク一覧

| # | サブタスク | 状態 | 依存 | 並列可否 | ファイル |
| --- | --- | --- | --- | --- | --- |
| 1 | store + api + useVariants（ロジック層） | 完了 | Phase 3 | 単独委任可 | [01-store-api-hooks.md](01-store-api-hooks.md) |
| 2 | Panel UI 群 + App 組み込み（e2e） | 完了 | #1 | 単独委任可 | [02-components.md](02-components.md) |

**実行順**: 1 → 2（直列）。#2 は #1 の `useVariants` と store を UI に結線する。

## 参照（全サブタスク共通）

- 仕様: 「UI 体験」「Variant 切り替えの内部処理」「Variant 生成」、`.claude/tech/hmr-fast-refresh.md`（状態維持の条件・連打ロック）
- 不変条件: 同一ファイル・構造を壊さない変更で Fast Refresh を維持／preview 切替は逐次化（連打ロック）

## フェーズ完了条件

- [x] クリック後、指示入力 →「生成」で Variant A/B/C が表示される
- [x] 「次へ / 前へ」で main worktree のファイルが切り替わり HMR で画面更新される
- [x] 切替中も demo-app の `<input>` の値（in-memory state）が保たれる
- [x] 連打しても逐次化され壊れない（`busy` 中の操作が無視される）
- [x] 「適用」で選んだ変更だけが残り、「破棄」で base に戻る（`git status` clean）
- [x] `pnpm tsc --noEmit` が通り、各サブタスクがコミットされている

## 検証方法（フェーズ結合確認 = #2 完了時）

```bash
pnpm --filter demo-app dev
```

ブラウザで: `<input>` に入力 → ON → SaveButton クリック → 指示「目立たせて」→「生成」で Variant 1/3 → 「次へ」で見た目変化・`<input>` 値が保たれる → 連打しても壊れない → 「適用」で `git status` にその変更が残る / 「破棄」で clean に戻る → apply/discard 後 `git worktree list` に残骸なし。
