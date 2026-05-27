# Preact（overlay UI / 注入側）

## 役割

overlay（インスペクタ + 操作パネル）を作るUIライブラリ。
ページに注入され、Shadow DOM内で動く。ホストアプリのReact（[react.md](react.md)）とは完全に独立。

## なぜ採用したか

- overlayは「指示入力・前へ/次へ・loading/error」と**それなりに状態を持つ対話UI**。vanillaだと状態管理が辛い。
- Preactは **約3KB**。注入バンドルとして軽い。
- JSX + hooks でReactとほぼ同じ書き心地 → 学習コスト最小。
- 独自バンドルにPreactを同梱するので、ホストのReactと**版数衝突しない**（vanillaを選ぶ動機だった衝突懸念が消える）。

## このプロジェクトでの使い方

- `client/index.tsx` が Shadow DOM を生成し、そこへ `render(<App/>, shadowRoot)`。
- コンポーネントは `client/components/<Name>/` にフォルダ単位で配置（co-locate styles + `index.ts`）。
- 状態は [@preact/signals](preact-signals.md) で集中管理。
- Viteのpreact設定（`@preact/preset-vite` か esbuild の `jsxImportSource: "preact"`）で overlay バンドルだけPreactにコンパイルする。

```tsx
// client/index.tsx（概念）
import { render } from "preact"
import { App } from "./App"

const host = document.createElement("div")
host.id = "__ui_agent_root"
document.body.appendChild(host)
const shadow = host.attachShadow({ mode: "open" })
render(<App />, shadow)
```

## 注意点

- overlayバンドルは **デモ/ホスト側のJSX設定と分離**する（ホストはReact、overlayはPreact）。混ざるとJSXのimport sourceが衝突する。
- DOM計測（hover強調の枠など）はホストのlayoutを読むだけにとどめ、ホストDOMを書き換えない。

## 関連

- [preact-signals.md](preact-signals.md)
- [shadow-dom.md](shadow-dom.md)
- [react.md](react.md) — ホスト側との違い
