# Vite

## 役割

dev基盤であり、ツール本体の**載せ場所**。次の3つをViteのplugin機構1つにまとめる。

1. **overlay注入** … `transformIndexHtml` で client バンドルの `<script>` を配信HTMLに差し込む
2. **Local Agent Server** … `configureServer` のmiddlewareで `/__ui_agent/*` を処理
3. **HMRトリガー** … patch適用＝対象ファイルの書き換え。Viteのファイル監視が自動でFast Refreshを発火

## なぜ採用したか

- plugin API（`configureServer` / `transformIndexHtml`）で、**別プロセスのサーバを立てずに** middlewareとoverlay注入を同居できる。
- React Fast Refresh（[hmr-fast-refresh.md](hmr-fast-refresh.md)）が標準で、仕様の「同一ファイル内変更で状態維持」を素直に満たす。
- 仕様が候補に挙げる `Vite plugin で data-ui-source 注入` も同じplugin内に将来追加できる。

## このプロジェクトでの使い方

`packages/vite-plugin-ui-variants/src/index.ts`（概念）:

```ts
import type { Plugin } from "vite"

export function uiVariants(options?: UiVariantsOptions): Plugin {
  return {
    name: "ui-variants",
    apply: "serve",                 // dev時のみ
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
  plugins: [react(), uiVariants()],
})
```

## 注意点

- `apply: "serve"` を必ず付ける（本番ビルドには載せない＝仕様の「本番では使わない」）。
- middlewareは `server.middlewares`（connect互換）。bodyパースは自前 or 軽量に行う。
- HMRは基本「ファイル書込で勝手に起きる」。必要時のみ `server.ws.send` で補助する。

## 関連

- [hmr-fast-refresh.md](hmr-fast-refresh.md)
- [preact.md](preact.md) — overlayバンドルの提供方法
- [git-worktree.md](git-worktree.md) — server層が使うpatch化
