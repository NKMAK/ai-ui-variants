# Phase 3 / サブタスク 1: overlay 注入 + Shadow DOM + 足場 + Toggle

## 目的

plugin に overlay バンドルの注入（`transformIndexHtml` + virtual module）を追加し、Shadow DOM 内に Preact overlay を描画、ON/OFF トグルを表示する。store・api client・theme.css の足場も用意する。

## 前提（subagent 向け・必読）

- Phase 2 完了済み: `src/index.ts` に `uiVariants()` plugin（`configureServer` で `/__ui_agent` middleware 登録、`apply:"serve"`）がある。`src/shared/types.ts`・`src/constants.ts`（`API_BASE`）がある。
- 読む: `.claude/tech/vite.md`（`transformIndexHtml` の注入形・overlay 配信）、`.claude/tech/shadow-dom.md`（スタイル隔離・HighlightBox 座標）、`.claude/tech/preact.md`・`preact-signals.md`。
- 不変条件: overlay は Shadow DOM 内に隔離。ホストの React とは別バンドルで干渉させない。

## 対象範囲

- 今回やること: 注入の仕組み + Shadow DOM entry + App 骨格 + store/api/theme 足場 + InspectorToggle
- 今回やらないこと: hover/click 捕捉・source 表示・start（#2）

## 変更対象ファイル

| パス | 区分 | 役割 |
| --- | --- | --- |
| `packages/vite-plugin-ui-variants/package.json` | 変更 | deps に `preact` / `@preact/signals` |
| `packages/vite-plugin-ui-variants/tsconfig.json` | 変更 | `jsx:"react-jsx"`, `jsxImportSource:"preact"` |
| `src/index.ts` | 変更 | `resolveId`/`load`（virtual module）+ `transformIndexHtml` |
| `src/client/index.tsx` | 新規 | Shadow DOM 生成 → `render(<App/>)` |
| `src/client/App.tsx` | 新規 | overlay ルート（骨格: Toggle のみ） |
| `src/client/store/overlayStore.ts` | 新規 | `enabled` / `selectedSource` / `hoveredRect` / `sessionId` signals |
| `src/client/api/client.ts` | 新規 | `/__ui_agent/*` fetch wrapper（start のみ・#2 で利用） |
| `src/client/styles/theme.css` | 新規 | 色・余白トークン（Shadow root ベース） |
| `src/client/components/InspectorToggle/` | 新規 | ON/OFF フローティングボタン |

## 実装ステップ

1. `package.json` の deps に `preact` と `@preact/signals` を追加し `pnpm install`。
2. `tsconfig.json` に `jsx:"react-jsx"`, `jsxImportSource:"preact"` を設定。
3. `src/index.ts` に virtual module を追加: `resolveId(id)` が overlay 仮想 ID（例 `virtual:ui-variants-overlay`）を解決、`load(id)` が `src/client/index.tsx` を import する小さなエントリ文字列を返す（Vite が Preact JSX を変換して配信）。
4. `src/index.ts` に `transformIndexHtml()` を追加し `<script type="module" src="/@id/virtual:ui-variants-overlay">` を body に注入（`injectTo:"body"`）。
5. `src/client/index.tsx`: ホスト DOM に container を作り `attachShadow({mode:"open"})`、`theme.css` を `<style>` か constructable stylesheet で Shadow root に注入、`render(<App/>, shadowRoot)`。
6. `src/client/store/overlayStore.ts`: `enabled = signal(false)`、`selectedSource = signal<SourceLocation|null>(null)`、`hoveredRect = signal<DOMRect|null>(null)`、`sessionId = signal<string|null>(null)`（shared 型を import）。
7. `src/client/api/client.ts`: `postStart(source)` を `API_BASE` 基準で実装（fetch wrapper。#2 で呼ぶ。他エンドポイントは Phase 4 で追加）。
8. `src/client/components/InspectorToggle/`: クリックで `enabled` をトグルするフローティングボタン（co-locate: `index.tsx` + style）。
9. `src/client/App.tsx`: `InspectorToggle` のみ描画する骨格。
10. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行。
11. demo-app dev で overlay 描画と toggle を確認し、コミットする（「なぜ」: overlay 注入と Shadow DOM 基盤を成立）。

## 状態管理

`overlayStore.ts` の signals: `enabled` / `selectedSource` / `hoveredRect` / `sessionId`（#2・Phase 4 で参照）。

## 完了条件

- [ ] demo-app に overlay `<script>` が注入され Shadow DOM 配下に overlay が出る
- [ ] toggle で `enabled` が切り替わる
- [ ] ホスト CSS の影響を受けない（Shadow DOM 隔離）
- [ ] `pnpm tsc --noEmit` が通り、コミット済み

## 検証方法

```bash
pnpm --filter demo-app dev
```

ブラウザで toggle ボタンが表示され、クリックで状態が変わること。DevTools で overlay が Shadow root 内にあること、ホストの React DOM と分離していることを確認する。
