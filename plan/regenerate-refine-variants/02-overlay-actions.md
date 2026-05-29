# Phase 2: Overlay UI と client hook

## 目的

Overlay の指示入力に `Generate` / `Regenerate` / `Refine current` を配置し、ユーザーが「元から作り直す」と「表示中の案を直す」を迷わず選べるようにする。

## 対象範囲

### 今回やること

- client API に generate mode を渡せるようにする。
- `useVariants` に `generate` / `regenerate` / `refineCurrent` 相当の操作を用意する。
- `InstructionInput` の button set を英語文言に変更する。
- `PanelActions` の apply/discard 文言を英語に寄せる。
- variant がないとき、あるとき、current variant がないときの disabled state を整理する。

### 今回やらないこと

- アイコン追加や大きな visual redesign。
- Variant 履歴や refinement chain の表示。
- source selection flow の変更。

## 変更対象ファイル

- `packages/vite-plugin-ui-variants/src/client/api/client.ts`
- `packages/vite-plugin-ui-variants/src/client/hooks/useVariants.ts`
- `packages/vite-plugin-ui-variants/src/client/components/InstructionInput/index.tsx`
- `packages/vite-plugin-ui-variants/src/client/components/InstructionInput/style.css`
- `packages/vite-plugin-ui-variants/src/client/components/PanelActions/index.tsx`
- 必要なら `packages/vite-plugin-ui-variants/src/client/components/PanelActions/style.css`

## 実装ステップ

1. `client.ts` の `postGenerate` に `mode` 引数を追加し、body に含める。
2. `useVariants.ts` で `generate(instruction, mode, count)` の内部関数を作り、公開 API として `generateInitial` / `regenerate` / `refineCurrent` を返す。
3. `useVariants.ts` に `hasVariants` / `canRefineCurrent` / `canRegenerate` を追加し、UI 側の disabled 判定を単純にする。
4. `InstructionInput/index.tsx` で variant 未生成時は `Generate` を表示する。
5. `InstructionInput/index.tsx` で variant 生成後は `Regenerate` と `Refine current` を並べる。
6. `Refine current` は current variant がない、または busy、または instruction が空のとき disabled にする。
7. `Regenerate` は session があり instruction が空でないとき押せるようにする。
8. `InstructionInput/style.css` で 2 button layout が狭い幅でも崩れないようにする。
9. `PanelActions/index.tsx` の文言を `Apply current` / `Discard` に変更する。

## 完了条件

- [x] 初回は `Generate` のみ表示される。
- [x] 生成後は `Regenerate` と `Refine current` が表示される。
- [x] `Regenerate` は base から作り直す。
- [x] `Refine current` は現在 preview 中の見た目を土台にする。
- [x] busy 中は関連ボタンが disabled になる。
- [x] 狭い panel 幅でもボタンの文字がはみ出さない。

## 検証方法

```bash
pnpm --filter vite-plugin-ui-variants exec tsc --noEmit
pnpm --filter demo-app exec tsc --noEmit
```

ブラウザ確認:

1. demo app を開き、overlay を ON にする。
2. UI 要素をクリックし、指示を入力する。
3. `Generate` で variant を生成する。
4. `Next` / `Previous` で preview を切り替える。
5. 追加指示を入力し、`Refine current` で現在表示中の UI から追加案が作られることを確認する。
6. `Regenerate` で元の base から別案が作られることを確認する。
7. `Apply current` / `Discard` が期待どおり動くことを確認する。
