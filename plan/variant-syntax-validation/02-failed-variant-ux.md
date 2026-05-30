# Failed Variant UX

## 目的

`failed` variant が含まれる生成結果でも、ユーザーが有効案と失敗理由を理解でき、壊れた案を preview/apply できない状態にする。

## 対象範囲

今回やること:

- `failed` variant を表示上で確認できるようにする。
- navigation / current variant の扱いを `ready` variant 優先に整える。
- 有効 variant が0件のときのエラー表示を改善する。

今回やらないこと:

- 失敗 variant の修復ボタン。
- failed variant だけを再生成する機能。
- 複雑な一覧 UI。

## 変更対象ファイル

| ファイル | 変更内容 |
| --- | --- |
| `packages/vite-plugin-ui-variants/src/client/hooks/useVariants.ts` | 生成後の `currentIndex` と no-ready message を調整 |
| `packages/vite-plugin-ui-variants/src/client/components/VariantViewer/index.tsx` | failed variant の理由と ready/failed 件数を表示 |
| `packages/vite-plugin-ui-variants/src/client/components/VariantViewer/style.css` | failed summary / status 表示の最小スタイル |

## 実装ステップ

1. `useVariants.ts` の `syncVariants()` を見直し、`nextIndex < 0` の場合は最初の previewable variant の index を優先する。
2. previewable variant がない場合は `currentIndex` を 0 にして、最初の failed variant を表示できるようにする。
3. `generate()` で `firstReadyVariant === undefined` の場合、`sessionError` を `No previewable variants were generated.` などにし、失敗理由は `VariantViewer` 側で見せる。
4. `VariantViewer/index.tsx` で ready / failed 件数を計算して meta に出す。例: `0 ready / 3 failed`。
5. `currentVariant.status === "failed"` の場合は title / description に加え、`error` を目立つが小さめのエリアで表示する。
6. `VariantNav` は既存通り previewable variant だけを移動対象にする。failed しかない場合は Previous / Next を disabled にする。
7. `PanelActions` の Apply は `currentVariant` が存在するだけで有効になっているため、必要なら `currentVariant.status` が `ready` / `previewing` の場合だけ有効にするよう調整する。

## 完了条件

- [ ] failed variant が含まれても overlay panel が壊れない。
- [ ] failed variant の `error` が UI に表示される。
- [ ] ready variant がある場合は failed variant を飛ばして最初の ready variant が preview される。
- [ ] ready variant が0件の場合、最初の failed variant と失敗理由が表示される。
- [ ] failed variant は preview/apply できない。

## 検証方法

- `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`
- `pnpm --filter demo-app exec tsc --noEmit`
- ブラウザまたは API で失敗 variant を返すケースを確認し、panel 上で理由が表示されることを確認する。
