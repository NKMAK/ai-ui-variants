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

- **dev 時に自動注入**する。`uiVariants()` plugin の `transform` フックが、host app 配下の `.tsx` / `.jsx` の JSX intrinsic element に `data-ui-source="src/...:line:column"` を Babel AST で付与する。
- 手書きはしない（ソースに残さない）。
- 大文字 custom component は対象外。小文字の intrinsic element だけが対象。
- `apply: "serve"` を維持しているので本番ビルドには注入されない。
- パスは**アプリルート相対**で持つ。サーバが `paths.ts` で repo相対へ変換しgit操作する。

## 実装メモ

- 注入処理: `packages/vite-plugin-ui-variants/src/transform/dataUiSource.ts`（`@babel/parser` / `traverse` / `generator` / `types`）。
- パス正規化と対象判定: `packages/vite-plugin-ui-variants/src/transform/path.ts`。`server.config.root` 配下の `.tsx` / `.jsx` のみ対象。
- plugin 自身の overlay TSX（`packages/vite-plugin-ui-variants/src/client/`）は app root 外なので skip される。追加防御として client パスを path helper でも除外している。
- server 側でも `SourceLocation.file` が app root / repo root 外へ出ないことを `assertSafeAppRelPath` で検証し、forged request で任意ファイルを開けないようにしている（拒否時は 400）。
- 初期実装は `map: null`。sourcemap が必要になれば Babel generator の sourcemap 返却へ切り替える。
- プラグイン登録順の制約: `@vitejs/plugin-react` も `enforce: "pre"` で transform を登録するため、`uiVariants()` を `react()` より **前** に並べる必要がある（同じ enforce 内では配列順）。

## クリック対象の決め打ち（仕様）

- `data-ui-source` は最終的にDOMを出した **intrinsic要素の定義位置**を指す。
- 「定義を変えたいのか/呼び出し元か」は曖昧だが、MVPは **定義位置を主**、呼び出し元(caller)は判明すればcontextに添えるだけ。

## 注意点

- patch適用でファイル内容が変わると**行番号がズレる**。1セッション内のpreview切替中は元属性で問題ないが、apply後にHMRが走れば transform が再実行されて再注入される（[hmr-fast-refresh.md](hmr-fast-refresh.md)）。
- 自動注入は **dev時のみ**（本番ビルドに残さない）。

## TODO

- [ ] auto 注入の e2e / 回帰テストを用意する。host app の `.tsx` 入力に対する transform 出力の固定スナップショット、overlay TSX 除外、server の path 拒否を機械的に守る。

## 関連

- [hmr-fast-refresh.md](hmr-fast-refresh.md)
- [react.md](react.md)
- [vite.md](vite.md)
