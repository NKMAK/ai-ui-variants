# Phase 4 / サブタスク 2: Panel UI 群 + App 組み込み（e2e）

## 目的

指示入力・Variant 表示・前へ/次へ・適用/破棄の UI を Panel に組み立て、`useVariants` と結線して end-to-end の体験を完成させる。

## 前提（subagent 向け・必読）

- Phase 4 / #1 完了済み: `overlayStore.ts`（`variants`/`currentIndex`/`busy` 追加済み）、`api/client.ts`（generate/preview/apply/discard）、`hooks/useVariants.ts` がある。Phase 3 の overlay 足場（Shadow DOM・`SourceLocation`・`InspectorToggle`）がある。
- 読む: 仕様「UI 体験」「Overlay UI 例」。
- 不変条件: 同一ファイル・構造を壊さない変更で Fast Refresh 維持（mock もこの範囲）。`busy` 中は操作を無効化。

## 対象範囲

- 今回やること: `ui/`（Button/Spinner）・`Panel`・`InstructionInput`・`VariantViewer`・`PanelActions`・App 組み込み
- 今回やらないこと: Claude 統合（Phase 5）

## 変更対象ファイル

| パス | 区分 | 役割 |
| --- | --- | --- |
| `src/client/components/ui/` | 新規 | `Button`（primary/ghost）/ `Spinner` |
| `src/client/components/Panel/` | 新規 | パネル外枠 + `PanelHeader` |
| `src/client/components/InstructionInput/` | 新規 | 指示 textarea + 生成ボタン |
| `src/client/components/VariantViewer/` | 新規 | "Variant n/N" + 説明 + `VariantNav`（前へ/次へ） |
| `src/client/components/PanelActions/` | 新規 | この案を適用 / 破棄 |
| `src/client/App.tsx` | 変更 | Panel を組み込む |

## 実装ステップ

1. `components/ui/`: `Button`（`variant: "primary" | "ghost"`、`disabled`）と `Spinner` を Shadow DOM 内スタイルで作る。
2. `components/Panel/`: 仕様の overlay 例に沿った外枠 + `PanelHeader`（タイトル + 閉じる）。`selectedSource` があるときだけ表示する。
3. `components/InstructionInput/`: textarea +「生成」ボタン。`busy` 中は disabled、`useVariants().generate(instruction)` を呼ぶ。
4. `components/VariantViewer/`: `Variant {currentIndex+1} / {variants.length}` と `title`/`description` を表示。`VariantNav` の「← 前へ」「次へ →」で `goPrev`/`goNext`。端では disabled。
5. `components/PanelActions/`: 「この案を適用」→ `apply`、「破棄」→ `discard`。`busy` 中は disabled。
6. `App.tsx`: Panel に `PanelHeader` / `SourceLocation` / `InstructionInput` / `VariantViewer` / `PanelActions` を組み込む。
7. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行。
8. demo-app dev で e2e 検証し、コミットする（「なぜ」: 指示→生成→切替→適用/破棄を結線し MVP 体験を完成）。

## 完了条件

`04-panel/summary.md` の「フェーズ完了条件」を全て満たす:

- [x] 指示入力 →「生成」で Variant A/B/C 表示
- [x] 前へ/次へで HMR 切替、`<input>` 値が保たれる
- [x] 連打しても逐次化され壊れない
- [x] 適用でその変更だけ残る / 破棄で base に戻る
- [x] `pnpm tsc --noEmit` が通り、コミット済み

## 検証方法

`04-panel/summary.md` の「検証方法」の e2e 手順をそのまま実行する。特に:

- 「次へ」で見た目が変わり、demo-app の `<input>` の値が消えないこと（Fast Refresh 維持）
- 前へ/次へを素早く連打しても壊れず逐次反映されること
- 「適用」後に `git status` でその変更だけが残り、「破棄」後に clean に戻ること
