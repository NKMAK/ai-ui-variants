# Phase 2: demo 手書き属性の撤去

## 目的

demo app の手書き `data-ui-source` を削除し、自動注入だけで overlay が動く状態にする。

## 対象範囲

- 今回やること:
  - `examples/demo-app/src/components/*` の手書き `data-ui-source` を削除する。
  - demo 内の説明文で「各要素が手書き属性を持つ」ように読める文言を、自動注入前提へ更新する。
  - generator prompt/context が手書き属性を前提にしていないか確認し、必要箇所を更新する。
  - mock generator の search/replace から手書き `data-ui-source` 前提をなくす。
- 今回やらないこと:
  - LP の情報設計やデザイン変更。
  - overlay UI の表示変更。

## 変更対象ファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `examples/demo-app/src/components/Masthead.tsx` | 変更 | 手書き `data-ui-source` 削除 |
| `examples/demo-app/src/components/Hero.tsx` | 変更 | 手書き `data-ui-source` 削除 |
| `examples/demo-app/src/components/PreviewCard.tsx` | 変更 | 手書き `data-ui-source` 削除 |
| `examples/demo-app/src/components/Workflow.tsx` | 変更 | 手書き `data-ui-source` 削除と必要な文言更新 |
| `examples/demo-app/src/components/Features.tsx` | 変更 | 手書き `data-ui-source` 削除と必要な文言更新 |
| `examples/demo-app/src/components/Playground.tsx` | 変更 | 手書き `data-ui-source` 削除 |
| `examples/demo-app/src/components/Footer.tsx` | 変更 | 手書き `data-ui-source` 削除 |
| `.ui-variants/project-context.md` | 変更 | 自動注入前提の context に更新が必要か確認 |
| `packages/vite-plugin-ui-variants/src/server/generator/mock.ts` | 変更 | 手書き `data-ui-source` を含む search/replace を属性なしソース前提へ更新 |

## 実装ステップ

1. `rg -n "data-ui-source" examples/demo-app/src .ui-variants` を実行し、手書き属性と説明文を洗い出す。
2. `examples/demo-app/src/components/Masthead.tsx` から `data-ui-source` 属性だけを削除する。
3. `examples/demo-app/src/components/Hero.tsx` から `data-ui-source` 属性だけを削除する。
4. `examples/demo-app/src/components/PreviewCard.tsx` から `data-ui-source` 属性だけを削除する。
5. `examples/demo-app/src/components/Workflow.tsx` から `data-ui-source` 属性を削除し、必要なら `The overlay reads data-ui-source` の説明を「dev transform が source location を埋め込む」趣旨へ更新する。
6. `examples/demo-app/src/components/Features.tsx` から `data-ui-source` 属性を削除し、必要なら `Every editable element carries data-ui-source` の説明を「dev transform adds source metadata」趣旨へ更新する。
7. `examples/demo-app/src/components/Playground.tsx` から `data-ui-source` 属性だけを削除する。
8. `examples/demo-app/src/components/Footer.tsx` から `data-ui-source` 属性だけを削除する。
9. `packages/vite-plugin-ui-variants/src/server/generator/mock.ts` を確認し、search/replace が `data-ui-source` 付き JSX を探している場合は、手書き属性なしの実ソースに合う search/replace へ更新する。
10. `.ui-variants/project-context.md` と generator prompt を確認し、手書き属性前提の記述があれば自動注入前提へ更新する。
11. `rg -n "data-ui-source" examples/demo-app/src packages/vite-plugin-ui-variants/src/server/generator .ui-variants` を実行し、説明文以外の手書き属性前提が残っていないことを確認する。

## 完了条件

- [ ] demo component ソースに手書き `data-ui-source` 属性が残っていない。
- [ ] demo の画面文言が手書き属性を正として説明していない。
- [ ] mock generator が手書き `data-ui-source` を含む search/replace に依存していない。
- [ ] 自動注入後も overlay が source location を取得できる。

## 検証方法

1. `rg -n "data-ui-source=" examples/demo-app/src packages/vite-plugin-ui-variants/src/server/generator` が 0 件であることを確認する。
2. `pnpm --filter demo-app exec tsc --noEmit`
3. dev server 上で Hero headline / Workflow card / Feature card / Playground button をクリックし、source location が表示されることを確認する。
4. representative UI で variant generate まで進め、mock / configured generator が手書き属性なしの code range で失敗しないことを確認する。
