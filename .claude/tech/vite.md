# Vite

## 役割

dev基盤であり、ツール本体の**載せ場所**。次の4つをViteのplugin機構1つにまとめる。

1. **overlay注入** … `transformIndexHtml` で client バンドルの `<script>` を配信HTMLに差し込む
2. **Local Agent Server** … `configureServer` のmiddlewareで `/__ui_agent/*` を処理
3. **HMRトリガー** … patch適用＝対象ファイルの書き換え。Viteのファイル監視が自動でFast Refreshを発火
4. **data-ui-source 自動注入** … `transform` hook で `.tsx` / `.jsx` の JSX intrinsic element に dev 時だけ `data-ui-source` を付与

## なぜ採用したか

- plugin API（`configureServer` / `transformIndexHtml` / `transform`）で、**別プロセスのサーバを立てずに** middleware・overlay 注入・source 注入をすべて同居できる。
- React Fast Refresh（[hmr-fast-refresh.md](hmr-fast-refresh.md)）が標準で、仕様の「同一ファイル内変更で状態維持」を素直に満たす。

## このプロジェクトでの使い方

`packages/vite-plugin-ui-variants/src/index.ts`（概念）:

```ts
import type { Plugin } from "vite"

export function uiVariants(options?: UiVariantsOptions): Plugin {
  let appRoot = ""
  return {
    name: "ui-variants",
    apply: "serve",                 // dev時のみ
    enforce: "pre",                 // React plugin より前に JSX を処理する
    configResolved(config) {
      appRoot = options?.appRoot ?? config.root
    },
    transform(code, id) {
      // host app root 配下の .tsx / .jsx のみ対象。
      // 小文字 JSX intrinsic element に data-ui-source を付与する。
    },
    configureServer(server) {
      server.middlewares.use("/__ui_agent", createRouter(server, options))
    },
    transformIndexHtml() {
      return [{ tag: "script", attrs: { type: "module", src: "/@id/ui-variants/overlay" }, injectTo: "body" }]
    },
  }
}
```

デモアプリ `examples/demo-app/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react"
import { uiVariants } from "vite-plugin-ui-variants"

export default defineConfig({
  plugins: [
    uiVariants(),  // ← react() より前に置く
    react(),
  ],
})
```

## 注意点

- `apply: "serve"` を必ず付ける（本番ビルドには載せない＝仕様の「本番では使わない」）。
- `enforce: "pre"` を付ける。さらに `@vitejs/plugin-react` も `enforce: "pre"` で transform を登録しているため、同 enforce 内では**配列順**が優先される。`uiVariants()` を `react()` の **前** に並べないと、`data-ui-source` の行番号が Fast Refresh preamble 分ズレる。
- middlewareは `server.middlewares`（connect互換）。bodyパースは自前 or 軽量に行う。
- HMRは基本「ファイル書込で勝手に起きる」。必要時のみ `server.ws.send` で補助する。

## 関連

- [hmr-fast-refresh.md](hmr-fast-refresh.md)
- [preact.md](preact.md) — overlayバンドルの提供方法
- [git-worktree.md](git-worktree.md) — server層が使うpatch化
- [data-ui-source.md](data-ui-source.md) — auto 注入の詳細
