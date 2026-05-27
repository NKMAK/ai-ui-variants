# TypeScript

## 役割

monorepo全体の実装言語。server（Node）・client（Preact）・shared（共有型）すべてTSで書く。

## なぜ採用したか

- server↔client間で `Session` / `Variant` / `VariantOutput` などの型を **共有**したい。`shared/types.ts` を1か所に置き、両側がimportする。
- AI generator を後でmock→Claude APIに差し替える際、`generator/types.ts` のinterfaceで境界を固定できる。
- patch検証・パス変換など壊れると痛いロジックを、型で守りたい。

## このプロジェクトでの使い方

- `tsconfig.base.json` を root に置き、各パッケージが `extends` する。
- `strict: true`。
- 共有型は `packages/vite-plugin-ui-variants/src/shared/types.ts` に集約し、server/clientの両方から相対importする。
- ビルドは各環境のバンドラに任せる（serverはVite/tsx経由、clientはVite、デモはVite）。MVPでは `tsc` での型検証は任意（仕様上ビルド・型検証はpreviewの前提にしない）。

## 注意点

- server層は Node API（`fs` / `child_process`）を使う。client層はブラウザのみ。**両者を同じファイルに混ぜない**（shared以外は環境を跨がない）。
- 仕様の `VariantOutput` / `FileChange` 型はそのまま `shared/types.ts` に写す（AIの返却フォーマットの正）。

## 関連

- [folder-structure.md](folder-structure.md) — shared/server/client のレイヤー分け
- [ai-mock-generator.md](ai-mock-generator.md) — generator interface
