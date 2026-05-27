# React 18（デモアプリ / ホスト側）

## 役割

`examples/demo-app` の本体。**「ユーザーが今見ている画面」= preview surface** を提供する側。
overlay（[Preact](preact.md)）とは別物で、ここはホストアプリのReact。

## なぜ採用したか

- 仕様の前提が「最初はReact系 / Vite or Next.js dev server」。MVPはViteで最短のReact構成にする。
- React Fast Refresh により、対象ファイルの書き換えで **state を保ったまま** 画面が更新される（仕様の中核体験）。

## このプロジェクトでの使い方

- `@vitejs/plugin-react` を入れる（Fast Refreshが付く）。
- デモ用コンポーネントに `data-ui-source` を**手書き**する（[data-ui-source.md](data-ui-source.md)、本番はビルド時注入）。

```tsx
// examples/demo-app/src/components/SaveButton.tsx
export function SaveButton() {
  return (
    <button data-ui-source="src/components/SaveButton.tsx:2:5">
      保存
    </button>
  )
}
```

- form入力など in-memory state を持つUIをデモに含めると、「同一ファイル変更で状態維持」を実演できる。

## 注意点

- **overlayのPreactとReactを混同しない**。overlay は別ツリー・別ランタイムで Shadow DOM に隔離する（[shadow-dom.md](shadow-dom.md)）。両者は依存も別管理。
- variant生成は「同一ファイル内・構造を壊さない」変更に限る。import追加・hooks構造変更はFast Refreshをフルリロードに落とし、画面stateを失う（[hmr-fast-refresh.md](hmr-fast-refresh.md)）。

## 関連

- [vite.md](vite.md)
- [data-ui-source.md](data-ui-source.md)
- [hmr-fast-refresh.md](hmr-fast-refresh.md)
