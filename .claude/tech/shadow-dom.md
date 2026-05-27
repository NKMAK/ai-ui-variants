# Shadow DOM（overlayのスタイル隔離）

## 役割

overlay（Preact製パネル）を **ホストアプリと相互に干渉しない箱**に閉じ込める。

## なぜ採用したか

- overlayは任意のアプリに注入される。ホストのグローバルCSS（リセット・Tailwind・`* { box-sizing }` 等）が**overlayに漏れ込む**とレイアウトが崩れる。逆にoverlayのCSSがホストを汚すのも避けたい。
- Shadow DOMはスタイルscopeを物理的に分離する。`!important` 合戦やclass名衝突を回避できる。

## このプロジェクトでの使い方

- `client/index.tsx` で host `<div>` を作り `attachShadow({ mode: "open" })`。
- Preactの `render(<App/>, shadowRoot)` で shadow root 直下にマウント。
- スタイルは shadow root 内に注入する。方法は2択:
  - 各コンポーネントの `.css` を Vite の `?inline` で文字列取得し、`<style>` としてshadow rootに挿入
  - もしくは Constructable Stylesheet（`shadowRoot.adoptedStyleSheets`）
- `styles/theme.css` に色・余白トークンを置き、shadow root全体のベースにする。

```ts
const shadow = host.attachShadow({ mode: "open" })
const style = document.createElement("style")
style.textContent = theme + panelCss + /* ... */ ""
shadow.appendChild(style)
render(<App />, shadow)
```

## 注意点

- **hover強調の枠**（Inspectorの`HighlightBox`）はホスト要素の位置に重ねる必要がある。これは shadow 内に absolute/fixed で描き、`getBoundingClientRect()` でホスト要素の座標に合わせる（ホストDOMには触らない）。
- フォントはshadow内に継承されないことがある。必要なら明示指定する。
- `mode: "open"` にしておくとデバッグしやすい。

## 関連

- [preact.md](preact.md)
- [folder-structure.md](folder-structure.md) — Inspector / HighlightBox
