# Phase 2: demo app LP implementation

## 目的

`examples/demo-app` を、英語の product landing page として見栄えがあり、overlay から複数箇所を編集できる demo に置き換える。

## 対象範囲

今回やること:

- React component と CSS を実装する。
- 主要な LP 要素に `data-ui-source` を付ける。
- state 維持確認用の input を残す。
- demo app として過度に複雑にせず、単一画面で完結させる。

今回やらないこと:

- overlay / server / generator の実装変更。
- GitHub Pages workflow の追加。
- 外部画像や重い UI ライブラリの追加。

## 変更対象ファイル

- `examples/demo-app/src/App.tsx`
- `examples/demo-app/src/main.tsx`（必要な CSS import がある場合のみ）
- `examples/demo-app/src/App.css` または `examples/demo-app/src/styles.css`（新規追加する場合）
- `examples/demo-app/src/components/SaveButton.tsx`（不要なら削除、使うなら英語 CTA へ変更）

## 実装ステップ

1. `examples/demo-app/src/App.tsx` の日本語 demo copy を英語 LP に置き換える。
2. 必要に応じて `examples/demo-app/src/App.css` を追加し、`main.tsx` または `App.tsx` から import する。
3. Header / Hero / Workflow / Feature cards / Editable demo / Footer を実装する。
4. Hero には product name が first viewport で明確に見えるようにする。
5. `data-ui-source` を主要要素に付ける。例:
   - `data-ui-source="src/App.tsx:XX:YY"` on hero headline wrapper.
   - `data-ui-source="src/App.tsx:XX:YY"` on CTA buttons.
   - `data-ui-source="src/App.tsx:XX:YY"` on each workflow or feature card.
6. state 維持確認用に `useState` を使う email input または note input を残す。placeholder も英語にする。
7. `SaveButton.tsx` を残す場合は product LP 内の CTA component として英語化する。不要なら import とファイルを削除する。
8. CSS は responsive にする。mobile で文字やボタンがはみ出さないようにする。
9. 色は単一色に寄せすぎない。productivity tool として落ち着いた配色にしつつ、CTA と preview panel にアクセントを分ける。

## 完了条件

- [ ] LP の visible copy がすべて英語になっている。
- [ ] Hero / Workflow / Feature cards / Editable demo / Footer が表示される。
- [ ] 主要要素に `data-ui-source` が付いている。
- [ ] state 維持確認用 input が機能している。
- [ ] mobile / desktop で大きな崩れがない。

## 検証方法

- `pnpm --filter demo-app exec tsc --noEmit`
- `pnpm --filter demo-app dev`
- ブラウザで desktop と mobile 幅を確認する。
- overlay を ON にして、Hero headline / CTA / card / form CTA をクリックし source location が出ることを確認する。
