# Inspector selected focus

## 目的

Inspector mode でクリック選択した UI 要素を、hover が移動した後も画面上でフォーカス表示し続ける。

## 参照ドキュメント

| ドキュメント                     | 確認観点                                                       |
| -------------------------------- | -------------------------------------------------------------- |
| `.claude/specs/summary.md`       | 最新仕様 v2 の位置づけ                                         |
| `.claude/tech/summary.md`        | Browser Overlay の担当技術                                     |
| `.claude/tech/shadow-dom.md`     | HighlightBox は Shadow DOM 内に描き、ホスト DOM を書き換えない |
| `.claude/tech/preact-signals.md` | overlay 状態を signals に集約する                              |

## フェーズ一覧

| #   | フェーズ名                   | 状態 | 詳細ファイル |
| --- | ---------------------------- | ---- | ------------ |
| 1   | 選択済み要素のフォーカス表示 | 完了 | このファイル |

## 対象範囲

- `data-ui-source` 要素をクリックした後、選択済み要素の枠を固定表示する。
- hover 中の枠は既存のまま維持する。
- scroll / resize 時に選択済み要素の位置を更新する。
- ホスト DOM の class や style は変更しない。

## 変更対象ファイル

| ファイル                                                                     | 変更内容                             |
| ---------------------------------------------------------------------------- | ------------------------------------ |
| `packages/vite-plugin-ui-variants/src/client/store/overlayStore.ts`          | `selectedRect` signal を追加         |
| `packages/vite-plugin-ui-variants/src/client/hooks/useInspector.ts`          | 選択済み要素の参照と rect 更新を追加 |
| `packages/vite-plugin-ui-variants/src/client/components/Inspector/index.tsx` | hover 枠と selected 枠を描き分け     |
| `packages/vite-plugin-ui-variants/src/client/components/Inspector/style.css` | selected 枠のスタイル追加            |

## 実装ステップ

1. `overlayStore.ts` に `selectedRect` を追加する。
2. `useInspector.ts` でクリック時に選択済み要素を保持し、`selectedRect` を更新する。
3. `useInspector.ts` の cleanup / OFF 時に `selectedRect` もクリアする。
4. `Inspector/index.tsx` で `hoveredRect` と `selectedRect` をそれぞれ描画する。
5. `Inspector/style.css` に selected 用の強調スタイルを追加する。
6. TypeScript と diff check を実行する。
7. 変更をコミットする。

## 完了条件

- [x] overlay ON 中に要素を hover すると既存の hover 枠が出る。
- [x] 要素をクリックすると、選択済み要素のフォーカス枠が残る。
- [x] hover が別要素へ移っても選択済みフォーカス枠が維持される。
- [x] scroll / resize 後もフォーカス枠が対象位置に追従する。
- [x] TypeScript チェックが通る。
- [x] 変更をコミットする。

## 検証方法

- `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`
- `pnpm --filter demo-app exec tsc --noEmit`
- `git diff --check`
- 必要に応じて `pnpm --filter demo-app dev` で overlay を ON にし、LP 要素をクリックしてフォーカス枠を確認する。
