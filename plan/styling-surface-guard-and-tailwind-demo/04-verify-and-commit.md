# Phase 4: 実画面検証とコミット

## 目的

prompt guardrail と Tailwind pilot が、ツールの中心体験を壊さずに動くことを確認してコミットする。

## 対象範囲

### 今回やること

- 型チェック、lint、format check を実行する。
- demo-app dev server で Tailwind の反映と generator 挙動を確認する。
- plan の状態・完了条件を実態に合わせて更新する。
- 変更をコミットする。

### 今回やらないこと

- PR 作成。
- 全コンポーネントの Tailwind 移行。
- UI library adapter の設計。

## 変更対象ファイル

- `plan/styling-surface-guard-and-tailwind-demo/summary.md`
- `plan/styling-surface-guard-and-tailwind-demo/01-styling-surface-guardrail.md`
- `plan/styling-surface-guard-and-tailwind-demo/02-tailwind-pilot-setup.md`
- `plan/styling-surface-guard-and-tailwind-demo/03-hero-tailwind-pilot.md`
- `plan/styling-surface-guard-and-tailwind-demo/04-verify-and-commit.md`

## 実装ステップ

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行する。
2. `pnpm --filter demo-app exec tsc --noEmit` を実行する。
3. `pnpm lint` を実行する。
4. `pnpm format:check` を実行する。
5. `pnpm --filter demo-app dev` を起動する。
6. ブラウザで Hero の外枠が Tailwind utility で表示されることを確認する。
7. Inspector を ON にし、Hero section をクリックする。
8. 「外枠を少し目立たせて」のような指示で Generate し、未知 className だけを足す variant が出ないことを確認する。
9. 可能なら Tailwind utility の既存値変更（例: border color / border width）として variant が出ることを確認する。
10. variant 表示後の Next / Previous / Discard が動くことを確認する。
11. dev server を停止する。
12. plan の状態と完了条件を実態に合わせて更新する。
13. `git status` / `git diff` / `git diff --cached` で、意図しないファイルが入っていないことを確認する。
14. コミットする。コミットメッセージ例: `未知のstyling hook生成を防ぎTailwind pilotを追加`

## 完了条件

- [x] plugin 型チェックが成功する。
- [x] demo-app 型チェックが成功する。
- [x] lint が成功する。
- [ ] format check が成功する。
- [x] Hero の外枠が Tailwind utility で表示される。
- [ ] ツール経由の生成で `hero-bordered` のような未知 className が出ない。
- [ ] Next / Previous / Discard が動く。
- [ ] plan が完了状態に更新されている。
- [x] 変更がコミットされている。

## 検証方法

- `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`
- `pnpm --filter demo-app exec tsc --noEmit`
- `pnpm lint`
- `pnpm format:check`
- `pnpm --filter demo-app dev`
