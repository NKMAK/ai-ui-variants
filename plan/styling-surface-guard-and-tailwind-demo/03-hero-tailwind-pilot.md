# Phase 3: Hero の Tailwind pilot 移行

## 目的

現在問題になっている Hero を pilot として、未定義 className ではなく実際に効く Tailwind utility で小さな見た目変更ができる状態にする。

## 対象範囲

### 今回やること

- `Hero.tsx` の `hero-bordered` を消す。
- Hero の外枠に相当する見た目を Tailwind utility で直接表現する。
- 既存の `hero` / `hero-text` / `hero-title` / `hero-sub` などの CSS class は一度に全撤去しない。
- AI variant が Tailwind utility を使いやすいよう、pilot 範囲を selectedLine 周辺に留める。

### 今回やらないこと

- `Hero.tsx` 全体を完全 Tailwind 化する。
- `App.css` の Hero 関連 class を全削除する。
- pseudo element `.hero::before` を Tailwind へ移すために JSX 構造を変える。
- `PreviewCard` など別コンポーネントを同時に Tailwind 化する。

## 変更対象ファイル

- `examples/demo-app/src/components/Hero.tsx`
- `.ui-variants/project-context.md`

## 実装ステップ

1. `examples/demo-app/src/components/Hero.tsx` の現在の未コミット差分を確認し、ユーザー由来の変更を戻さない前提で作業する。
2. `<section className="hero hero-bordered">` を、既存 `hero` class と Tailwind utility の併用へ置き換える。
3. Tailwind utility は、外枠が実際に見える最小セットにする。例: `border border-[var(--line-strong)]`。
4. 必要なら角丸や余白なども Tailwind utility で追加するが、既存 `.hero` の grid / padding / pseudo element を壊さない。
5. `.ui-variants/project-context.md` に、demo-app では Tailwind utility が使えるが、未知の任意 className は引き続き禁止と書く。
6. `rg -n "hero-bordered|\\.hero-bordered" .` を実行し、未定義 className が残っていないことを確認する。
7. `pnpm --filter demo-app exec tsc --noEmit` を実行する。

## 完了条件

- [x] `hero-bordered` が `Hero.tsx` から消えている。
- [x] Hero の外枠が Tailwind utility によって実画面で効いている。
- [x] 既存 Hero レイアウトが大きく崩れていない。
- [x] `.ui-variants/project-context.md` が Tailwind utility と未知 className の違いを説明している。

## 検証方法

- `rg -n "hero-bordered|\\.hero-bordered" .`
- `pnpm --filter demo-app exec tsc --noEmit`
- demo-app dev server で Hero の外枠が表示されることを確認する。
- ツール経由で Hero section を選び、「外枠を少し目立たせて」などを試し、Tailwind utility の既存 className 変更として variant が出ることを確認する。
