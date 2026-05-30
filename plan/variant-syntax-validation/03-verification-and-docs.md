# Verification and Docs

## 目的

構文エラー variant が main worktree / Vite dev server を壊さず失敗として扱われることを、API とブラウザ表示で確認する。

## 対象範囲

今回やること:

- TypeScript / diff whitespace の検証。
- API flow で failed variant のレスポンスを確認。
- ブラウザで UI 表示と preview/apply ガードを確認。
- plan の状態を更新し、コミットする。

今回やらないこと:

- PR 作成。
- TypeScript semantic validation の追加。

## 変更対象ファイル

| ファイル | 変更内容 |
| --- | --- |
| `plan/variant-syntax-validation/summary.md` | フェーズ状態と完了条件を更新 |
| `plan/variant-syntax-validation/01-server-syntax-validation.md` | 実装後チェック更新 |
| `plan/variant-syntax-validation/02-failed-variant-ux.md` | 実装後チェック更新 |
| `plan/variant-syntax-validation/03-verification-and-docs.md` | 実装後チェック更新 |

## 実装ステップ

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行する。
2. `pnpm --filter demo-app exec tsc --noEmit` を実行する。
3. `git diff --check` を実行する。
4. `pnpm --filter demo-app dev` を起動する。既存ポートが埋まっている場合は Vite の表示 URL を使う。
5. overlay から `Workflow.tsx` の eyebrow 付近を選択し、`>> WORKFLOW <<<` 相当の JSX text が生成される指示を試す。
6. Vite error overlay ではなく UI agent panel 内の failed variant 表示になることを確認する。
7. ready variant が残るケースで、最初の ready variant が preview され、Previous / Next が failed variant を preview しないことを確認する。
8. failed しかないケースで Apply が押せないことを確認する。
9. `git status --short` で既存のユーザー変更と今回の変更を確認する。
10. plan の checkbox とフェーズ状態を更新する。
11. 変更をコミットする。

## 完了条件

- [ ] TypeScript check が通っている。
- [ ] `git diff --check` が通っている。
- [ ] API またはブラウザで JSX 構文エラー variant が `failed` として返ることを確認済み。
- [ ] ブラウザで failed variant の理由が表示されることを確認済み。
- [ ] ready variant の preview/apply 動線が壊れていないことを確認済み。
- [ ] plan の状態が実態に同期されている。
- [ ] 変更がコミットされている。
