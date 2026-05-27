# data-ui-source（UI→ソース位置の対応付け）

## 役割

クリックされたDOM要素から「どのファイルの何行目か」を引くための属性。

```html
<button data-ui-source="src/components/SaveButton.tsx:42:5">保存</button>
```

→ `file: src/components/SaveButton.tsx / line: 42 / column: 5`

## なぜこの方式か

- UI→source jump系（react-dev-inspector / LocatorJS等）と同じく、DOMに位置情報を持たせるのが確実。
- overlayのクリックハンドラは `event.target.closest("[data-ui-source]")` を読むだけでよい。

## このプロジェクトでの使い方

- **MVPデモ**: `examples/demo-app` のコンポーネントに**手書き**する（仕様の最小デモ。デモ専用の説明用）。
- **本番**: ソースに残さず**ビルド時・開発時に自動注入**する。候補:
  - `react-dev-inspector` を利用/参考
  - Babel / SWC / Vite plugin で intrinsic要素に注入（まずintrinsicだけから）
- パスは**アプリルート相対**で持つ。サーバが `paths.ts` で repo相対へ変換しgit操作する。

## クリック対象の決め打ち（仕様）

- `data-ui-source` は最終的にDOMを出した **intrinsic要素の定義位置**を指す。
- 「定義を変えたいのか/呼び出し元か」は曖昧だが、MVPは **定義位置を主**、呼び出し元(caller)は判明すればcontextに添えるだけ。

## 注意点

- patch適用でファイル内容が変わると**行番号がズレる**。1セッション内のpreview切替中は元属性で問題ないが、apply後の再クリック前にHMR経由で再注入する（[hmr-fast-refresh.md](hmr-fast-refresh.md)）。
- 自動注入は **dev時のみ**（本番ビルドに残さない）。

## 関連

- [hmr-fast-refresh.md](hmr-fast-refresh.md)
- [react.md](react.md)
- [vite.md](vite.md)
