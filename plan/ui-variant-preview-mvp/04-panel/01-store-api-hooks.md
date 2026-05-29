# Phase 4 / サブタスク 1: store + api + useVariants（ロジック層）

## 目的

variant 生成・preview 切替・適用・破棄のロジックを、api client・store・`useVariants` フックとして実装する（UI は #2）。

## 前提（subagent 向け・必読）

- Phase 3 完了済み: `overlayStore.ts`（`enabled`/`selectedSource`/`hoveredRect`/`sessionId`）、`api/client.ts`（`postStart`）、`useSession`、inspector がある。Phase 2 の server が `generate-variants`/`preview`/`apply`/`discard` を提供。
- 読む: 仕様「Variant 切り替えの内部処理」「API 案」、`.claude/tech/hmr-fast-refresh.md`（preview = サーバのファイル書換で自動 HMR・連打ロック）。
- 不変条件: preview 切替は逐次化（`busy` 中は無視 or 最新のみ）。

## 対象範囲

- 今回やること: `api/client.ts` 追加・`overlayStore.ts` 追加・`hooks/useVariants.ts`
- 今回やらないこと: Panel UI 群（#2）

## 変更対象ファイル

| パス | 区分 | 役割 |
| --- | --- | --- |
| `src/client/api/client.ts` | 変更 | `postGenerate` / `postPreview` / `postApply` / `postDiscard` |
| `src/client/store/overlayStore.ts` | 変更 | `variants` / `currentIndex` / `busy` signals |
| `src/client/hooks/useVariants.ts` | 新規 | 生成・切替・適用・破棄ロジック |

## 実装ステップ

1. `api/client.ts` に追加: `postGenerate(sessionId, instruction, count)`・`postPreview(sessionId, variantId)`・`postApply(sessionId, variantId)`・`postDiscard(sessionId)`（いずれも `API_BASE` 基準の fetch）。
2. `overlayStore.ts` に追加: `variants = signal<Variant[]>([])`、`currentIndex = signal(0)`、`busy = signal(false)`。
3. `hooks/useVariants.ts`:
   - `generate(instruction)`: `busy` を立て `postGenerate` → `variants` セット → 先頭の `ready` variant を `preview` → `busy` を下げる。
   - `goPrev()` / `goNext()`: `currentIndex` を範囲内で増減（`failed` はスキップ）し、その variant を `preview`。
   - `preview(variantId)`: `busy` 中なら無視（連打ロック）。`postPreview` 完了で `busy` を下げる。HMR はサーバのファイル書換で自動発火するためクライアントは待つだけ。
   - `apply()`: 現在 variant を `postApply` → 終了状態へ（store リセット or applied 表示）。
   - `discard()`: `postDiscard` → store をリセット。
4. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行。
5. コミットする（「なぜ」: 生成・切替・適用/破棄のロジック層を用意）。

## 状態管理

`overlayStore.ts` に `variants` / `currentIndex` / `busy` を追加。`busy` が連打ロックの要。

## 完了条件

- [x] api client が generate/preview/apply/discard を提供する
- [x] `useVariants` が generate/goPrev/goNext/preview/apply/discard を提供する
- [x] `busy` による連打ロックが効く（処理中の操作は無視）
- [x] `pnpm tsc --noEmit` が通り、コミット済み

## 検証方法

```bash
pnpm --filter vite-plugin-ui-variants exec tsc --noEmit
```

型チェック通過。実地の動作確認は #2（UI 結線）後の e2e で行う。必要なら一時的にコンソールから `generate` を呼び `variants` に 3 件入ることを確認する。
