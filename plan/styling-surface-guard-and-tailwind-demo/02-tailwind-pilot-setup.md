# Phase 2: Tailwind CSS pilot 導入

## 目的

demo-app に Tailwind CSS を導入し、既存 CSS と併存しながら一部コンポーネントだけ Tailwind utility で表現できる状態にする。

## 対象範囲

### 今回やること

- Tailwind CSS を demo-app の Vite pipeline に入れる。
- 既存 `App.css` を残し、Tailwind の import を追加する。
- Tailwind 導入に必要な package / lockfile / Vite config の変更を行う。

### 今回やらないこと

- demo-app 全体の CSS を Tailwind に置換する。
- overlay 側 Preact / Shadow DOM の CSS に Tailwind を適用する。
- Tailwind config を複雑に作り込む。

## 変更対象ファイル

- `examples/demo-app/package.json`
- `examples/demo-app/vite.config.ts`
- `examples/demo-app/src/App.css`
- `pnpm-lock.yaml`

## 実装ステップ

1. Tailwind 公式の Vite 導入手順を確認する。
2. `pnpm --filter demo-app add -D tailwindcss @tailwindcss/vite` を実行する。
3. `examples/demo-app/vite.config.ts` で `@tailwindcss/vite` を import する。
4. `examples/demo-app/vite.config.ts` の plugins に `tailwindcss()` を追加する。`uiVariants()` は `react()` より前に維持する。
5. `examples/demo-app/src/App.css` の先頭に `@import "tailwindcss";` を追加する。
6. 既存 `:root` CSS variables と既存 class 定義は削除しない。
7. `pnpm --filter demo-app exec tsc --noEmit` を実行する。
8. `pnpm --filter demo-app dev` で起動し、既存画面が崩れていないことを確認する。

## 完了条件

- [x] Tailwind package が demo-app に追加されている。
- [x] `vite.config.ts` に Tailwind Vite plugin が入っている。
- [x] `App.css` に Tailwind import が入っている。
- [x] 既存 CSS class ベースの画面が引き続き表示される。

## 検証方法

- `pnpm --filter demo-app exec tsc --noEmit`
- `pnpm --filter demo-app dev`
- ブラウザで Hero / Masthead / Workflow / Features / Playground の大きな崩れがないことを目視確認する。
