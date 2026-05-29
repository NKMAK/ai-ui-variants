# Phase 3: 検証と handoff

## 目的

Regenerate / Refine current の end-to-end 動作を API とブラウザの両方で確認し、残った制約や次の改善点を引き継げる状態にする。

## 対象範囲

### 今回やること

- 型チェックと差分チェックを実行する。
- API レベルで replace / refine を確認する。
- ブラウザで実際の overlay flow を確認する。
- plan の状態を完了に更新する。
- コミットする。

### 今回やらないこと

- PR 作成。
- visual regression の自動化。
- 複数ブラウザ検証。

## 変更対象ファイル

- `plan/regenerate-refine-variants/summary.md`
- `plan/regenerate-refine-variants/01-server-generate-modes.md`
- `plan/regenerate-refine-variants/02-overlay-actions.md`
- `plan/regenerate-refine-variants/03-verification-and-handoff.md`
- 必要なら handoff メモ。

## 実装ステップ

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行する。
2. `pnpm --filter demo-app exec tsc --noEmit` を実行する。
3. `git diff --check` を実行する。
4. demo app dev server を起動する。
5. API またはブラウザ操作で initial generate -> preview -> regenerate -> preview -> refine current -> apply を確認する。
6. 別 session で initial generate -> preview -> refine current -> discard を確認する。
7. `git worktree list` で `.ui-agent/worktrees/<session>` の残骸がないことを確認する。
8. `git status --short` で意図した差分だけ残っていることを確認する。
9. plan のフェーズ状態と完了条件を更新する。
10. 変更をコミットする。

## 完了条件

- [x] 型チェックが通る。
- [x] `git diff --check` が通る。
- [x] regenerate で worktree 衝突が再発しない。
- [x] refine current で累積 patch が apply される。
- [x] discard で base snapshot に戻る。
- [x] apply/discard 後に worktree 残骸がない。
- [x] plan の状態が更新されている。
- [x] コミット済み。

## 検証方法

```bash
pnpm --filter vite-plugin-ui-variants exec tsc --noEmit
pnpm --filter demo-app exec tsc --noEmit
git diff --check
git worktree list
git status --short
```
