# Phase 1: モノレポ足場 + shared + demo-app

## 目的

pnpm workspace の足場・共有型/定数・デモアプリを用意し、`pnpm --filter demo-app dev` で `data-ui-source` 付きの画面が起動する状態を作る。

## 対象範囲

### 今回やること

- pnpm workspace ルート（`package.json` / `pnpm-workspace.yaml` / `tsconfig.base.json` / `.gitignore`）
- `vite-plugin-ui-variants` パッケージの足場と `shared/types.ts` / `constants.ts`
- `examples/demo-app` の最小 Vite + React アプリ（`SaveButton` に `data-ui-source` 手書き）
- demo-app の初期状態を **コミット**（Phase 2 の clean チェックに必要）

### 今回やらないこと

- plugin の middleware / overlay 注入（Phase 2・3）
- server ロジック（Phase 2）
- overlay UI（Phase 3・4）
- `vite.config.ts` への `uiVariants()` 登録（Phase 2 で追加）

## 変更対象ファイル（すべて新規）

| パス | 役割 |
| --- | --- |
| `package.json` | workspace root（private, scripts: lint 等の置き場） |
| `pnpm-workspace.yaml` | `packages/*` と `examples/*` を登録 |
| `tsconfig.base.json` | 共通 TS 設定（strict, moduleResolution: Bundler 等） |
| `.gitignore` | `node_modules/` / `.ui-agent/` / `dist/` を除外 |
| `packages/vite-plugin-ui-variants/package.json` | name=`vite-plugin-ui-variants`, peer: vite |
| `packages/vite-plugin-ui-variants/tsconfig.json` | base を extends |
| `packages/vite-plugin-ui-variants/src/shared/types.ts` | 共有型 |
| `packages/vite-plugin-ui-variants/src/constants.ts` | API パス / denylist / 制約値 |
| `examples/demo-app/package.json` | react, react-dom, vite, @vitejs/plugin-react |
| `examples/demo-app/tsconfig.json` | base を extends, jsx: react-jsx |
| `examples/demo-app/index.html` | エントリ HTML |
| `examples/demo-app/vite.config.ts` | `react()` のみ（uiVariants は Phase 2） |
| `examples/demo-app/src/main.tsx` | createRoot → `<App/>` |
| `examples/demo-app/src/App.tsx` | 入力欄（状態維持確認用）+ `<SaveButton/>` |
| `examples/demo-app/src/components/SaveButton.tsx` | `data-ui-source` 手書きの button |

## 実装ステップ

1. `pnpm-workspace.yaml` を作成し `packages/*` と `examples/*` を登録する。
2. ルート `package.json`（private, `"packageManager"`, scripts）を作成する。
3. `tsconfig.base.json` を作成する（`strict: true`, `noUncheckedIndexedAccess: true`, `moduleResolution: "Bundler"`, `target: "ES2022"`, `verbatimModuleSyntax` は使わず import type を徹底）。
4. `.gitignore` に `node_modules/`・`.ui-agent/`・`dist/`・`*.log` を記載する。
5. `packages/vite-plugin-ui-variants/package.json` を作成する（`type: "module"`, `main`/`exports` は src を指す MVP 構成、peerDependencies に `vite`、devDependencies に `preact`/`@preact/signals` は Phase 3 で追加予定としてコメント可だがここでは最小）。
6. `packages/vite-plugin-ui-variants/tsconfig.json` を作成し base を extends する。
7. `src/shared/types.ts` に仕様 v2 の型を定義する: `SourceLocation` / `FileChange`（`file` + `edits: {search; replace}[]`） / `VariantOutput` / `Variant`（`status: "pending"|"ready"|"previewing"|"applied"|"failed"`, `patchPath`） / `Session`（`baseSnapshot: Record<string,string>`, `variants`, `currentIndex`, `locked`, `status`, `createdAt`） / API のリクエスト・レスポンス型。`as any` を使わない。
8. `src/constants.ts` に `API_BASE = "/__ui_agent"` と各エンドポイントパス、`DENYLIST`（package.json / lockfile / .env* / auth / billing / migration / infra / CI のパターン）、`MAX_FILES = 3`、`MAX_DIFF_LINES = 100` を定義する。
9. `examples/demo-app/package.json` を作成する（react, react-dom, vite, @vitejs/plugin-react, typescript）。
10. `examples/demo-app/tsconfig.json`・`index.html`・`vite.config.ts`（`react()` のみ）を作成する。
11. `examples/demo-app/src/components/SaveButton.tsx` を作成する。`<button data-ui-source="src/components/SaveButton.tsx:N:C">保存</button>`（行番号・列番号は実ファイルに合わせる）。
12. `examples/demo-app/src/App.tsx` に「状態維持確認用の `<input>`（useState）」と `<SaveButton/>` を置く。`main.tsx` で createRoot する。
13. リポジトリルートで `pnpm install` を実行する。
14. `pnpm --filter demo-app dev` を起動し、ブラウザで画面表示を確認する。
15. 各パッケージで `pnpm tsc --noEmit` を実行し型エラーがないことを確認する。
16. ここまでを 1 コミットする（「なぜ」: MVP の足場と clean な base を用意）。

## 完了条件

- [x] `pnpm install` が成功する
- [x] `pnpm --filter demo-app dev` で SaveButton と input が表示される
- [x] SaveButton の DOM に正しい `data-ui-source` が付いている（DevTools で確認）
- [x] `shared/types.ts` / `constants.ts` が `pnpm tsc --noEmit` を通る
- [x] demo-app と足場が clean な状態でコミットされている

## 検証方法

```bash
pnpm install
pnpm --filter demo-app dev   # ブラウザで localhost:xxxx を開き SaveButton/input を確認
# 別ターミナルで
pnpm --filter vite-plugin-ui-variants exec tsc --noEmit
pnpm --filter demo-app exec tsc --noEmit
git status   # clean を確認
```

DevTools で `<button data-ui-source="...">` の属性値が `src/components/SaveButton.tsx:行:列` になっていることを確認する。
