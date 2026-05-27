# HMR / React Fast Refresh（preview切替）

## 役割

variant切替（前へ/次へ）で、**画面の見た目だけを更新し、in-memory state（form入力など）は保つ**仕組み。

## なぜ採用したか

- preview用の別dev serverを立てない（仕様の設計判断1）。「今見ている画面」をそのまま使うので、URL・auth・localStorage・form stateを引き継げる。
- Vite + `@vitejs/plugin-react` のFast Refreshは、**同一ファイル内のコンポーネント変更**ならstateを維持して差し替える。これが体験の核。

## このプロジェクトでの使い方

- preview = サーバが **main worktreeの対象ファイルを書き換える**だけ。Viteのファイル監視がHMRを自動発火する（手動 `server.ws.send` は基本不要）。
- 切替手順（ロック下で逐次化）:
  1. main worktreeの対象ファイルを base snapshot へ戻す
  2. 選択variantのpatchを適用（＝ファイル書込）
  3. Viteが該当モジュールをHMR
  4. `currentIndex` 更新

## 注意点（state維持の条件）

Fast Refreshが効く＝stateが残るのは **同一ファイル内・構造を壊さない**変更のみ。次はフルリロードを誘発しstateを失う:

- import追加 / 削除
- hooks の構造変更（数・順序が変わる）
- export形状の変更 / 別ファイルへの波及

→ だからvariant生成を「text/label/props/className/size等の見た目変更」に縛る（仕様の設計判断3）。

その他:

- patch適用でファイル内容が変わると `data-ui-source` の**行番号がズレる**。1セッション内のpreview切替は問題ないが、apply後に再クリックする前にはHMR経由で属性を再注入させる（[data-ui-source.md](data-ui-source.md)）。
- 連打対策: 切替はセッションロックで逐次化（処理中は拒否 or 最新のみ反映）。

## 関連

- [vite.md](vite.md)
- [react.md](react.md)
- [data-ui-source.md](data-ui-source.md)
