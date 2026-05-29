# Phase 1: LP content and edit targets

## 目的

UI Variant Preview Agent の価値が英語圏の OSS ユーザーに伝わり、かつ variant preview の編集対象として自然にクリックできる LP 構成を決める。

## 対象範囲

今回やること:

- LP のセクション構成を決める。
- 各セクションでクリック可能にする `data-ui-source` 対象を決める。
- 英語コピーの初稿を作る。
- Fast Refresh の state 維持を見せる入力要素を残す位置を決める。

今回やらないこと:

- 実装コードを書く。
- GitHub Pages の workflow を作る。
- overlay / generator の内部仕様を変更する。

## 変更対象ファイル

- `examples/demo-app/src/App.tsx`
- `examples/demo-app/src/components/SaveButton.tsx`（削除または LP 用コンポーネントへ置き換え）
- 必要なら `examples/demo-app/src/components/*.tsx`

## 実装ステップ

1. `examples/demo-app/src/App.tsx` と `examples/demo-app/src/components/SaveButton.tsx` を読み、既存の state 維持 input と `data-ui-source` の使い方を確認する。
2. LP のセクションを次の構成で設計する。
   - Header: product name, GitHub link placeholder, primary CTA.
   - Hero: headline, short value proposition, CTA pair, compact product mock panel.
   - Problem/Solution: why click-to-variant matters.
   - Workflow: Click, Generate, Preview, Apply.
   - Feature cards: source-aware context, code-backed variants, local worktree safety, Fast Refresh preview.
   - Editable demo area: stateful input plus editable CTA/text targets.
   - Footer: OSS positioning and local-first note.
3. Visible copy をすべて英語で書く。候補:
   - Product name: `UI Variant Preview Agent`
   - Hero headline: `Preview AI-made UI changes before they touch your worktree.`
   - Subcopy: `Click an element, generate code-backed variants, and compare them in the screen you are already using.`
4. `data-ui-source` 対象を決める。最低限、hero headline、primary CTA、workflow cards、feature cards、demo form CTA の各単位をクリック対象にする。
5. `data-ui-source` の値は実装後の実ファイルパスと行番号に合わせる。行番号が多少ズレても file path が正しいことを優先し、実装後に再確認する。

## 完了条件

- [ ] LP のセクション構成が実装ステップに反映されている。
- [ ] 英語コピーの初稿が決まっている。
- [ ] `data-ui-source` を付ける対象が決まっている。
- [ ] Phase 2 に進める粒度になっている。

## 検証方法

- 計画レビューで、LP が product introduction と editable demo の両方を満たしているか確認する。
- 日本語の visible copy が残らない方針になっているか確認する。
