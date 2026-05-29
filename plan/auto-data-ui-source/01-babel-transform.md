# Phase 1: Babel transform 基盤

## 目的

`uiVariants()` の Vite transform で host app の JSX intrinsic element に `data-ui-source` を自動注入する。

## 対象範囲

- 今回やること:
  - plugin package に Babel AST 操作用の依存を追加する。
  - `src/server` / `src/client` とは別に、plugin transform 用の小さな helper を追加する。
  - `.tsx` / `.jsx` の intrinsic element に `data-ui-source` を追加する。
  - host app root 配下だけを変換し、app root 相対 path を使う。
  - server 側でも app root 外参照を拒否する。
- 今回やらないこと:
  - custom component の caller source 推定。
  - JSX 以外のテンプレート言語対応。
  - variant 生成 prompt の変更。

## 変更対象ファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `packages/vite-plugin-ui-variants/package.json` | 変更 | Babel 依存を追加 |
| `pnpm-lock.yaml` | 変更 | 依存追加に伴う lock 更新 |
| `packages/vite-plugin-ui-variants/src/index.ts` | 変更 | Vite `transform` hook を追加 |
| `packages/vite-plugin-ui-variants/src/server/paths.ts` | 変更 | app root 外参照を拒否する path validation を追加 |
| `packages/vite-plugin-ui-variants/src/server/session.ts` | 変更 | session start 時に source path validation を使う |
| `packages/vite-plugin-ui-variants/src/transform/dataUiSource.ts` | 新規 | JSX AST への `data-ui-source` 注入ロジック |
| `packages/vite-plugin-ui-variants/src/transform/path.ts` | 新規 | id から app root 相対 path を作る helper |

## 実装ステップ

1. `pnpm --filter vite-plugin-ui-variants add @babel/parser @babel/traverse @babel/generator @babel/types` を実行する。これらは plugin 実行時に必要なので `dependencies` に入れる。
2. `packages/vite-plugin-ui-variants/src/transform/path.ts` を作成し、Vite module id から query/hash を除去し、必要なら `/@fs/` prefix を正規化したうえで絶対パス化する。
3. path helper は `server.config.root` 配下のファイルだけに app root 相対 POSIX path を返す。`path.relative(appRoot, absoluteFile)` が `..` で始まる、絶対パスのまま、または `.tsx` / `.jsx` 以外の場合は `null` を返して transform しない。
4. app root 相対 path は `/` 区切りに固定し、絶対パス・`..`・Windows separator を属性値に出さない。
5. plugin 自身の overlay TSX は `server.config.root` 外なので原則 skip される。追加の防御として `/packages/vite-plugin-ui-variants/src/client/` も対象外にする。
6. `packages/vite-plugin-ui-variants/src/transform/dataUiSource.ts` を作成し、`injectDataUiSource(code, options)` を実装する。
7. Babel parser は `sourceType: "module"` と `plugins: ["jsx", "typescript"]` を使う。`.jsx` でも `typescript` plugin を有効にして構文差で壊れないことを優先する。
8. `JSXOpeningElement` を走査し、`JSXIdentifier` かつ先頭が小文字の element だけを intrinsic とみなす。
9. 既に `data-ui-source` 属性を持つ場合は何もしない。
10. `path.node.loc?.start` から line / column を取得し、column は 1-based にして `appRelPath:line:column` を入れる。
11. Babel generator で code を返し、初期実装では `map: null` とする。sourcemap を返さない影響は Phase 3 で HMR / error overlay / stack trace を確認する。
12. `packages/vite-plugin-ui-variants/src/index.ts` で `configResolved` により `appRoot` と `repoRoot` を保持し、`transform(code, id)` から helper を呼ぶ。
13. `uiVariants()` の plugin object に `enforce: "pre"` を追加し、React plugin より前に JSX を処理する。React plugin が JSX を変換した後の code は対象にしない。
14. `apply: "serve"` は維持し、dev server でのみ transform が動くことを明示する。
15. `packages/vite-plugin-ui-variants/src/server/paths.ts` に source path validation helper を追加し、`SourceLocation.file` が絶対パス、`..` で app root 外へ出る path、repo root 外 path の場合は拒否する。
16. `packages/vite-plugin-ui-variants/src/server/session.ts` の session start 経路で validation 済みの path だけを `appToRepoPath` へ渡す。

## 完了条件

- [ ] `.tsx` / `.jsx` の小文字 JSX 要素に `data-ui-source` が自動注入される。
- [ ] 大文字 custom component には注入されない。
- [ ] 既存の手書き `data-ui-source` は二重化されない。
- [ ] host app root 外の TSX / JSX、特に plugin overlay 側の Preact TSX には注入されない。
- [ ] 自動注入される path は POSIX の app root 相対で、絶対パス・`..`・OS依存 separator を含まない。
- [ ] server 側で app root 外の source path が拒否される。
- [ ] TypeScript compile error がない。

## 検証方法

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`
2. `pnpm --filter demo-app exec tsc --noEmit`
3. `pnpm --filter demo-app dev` を起動し、ブラウザ DevTools で `examples/demo-app/src/components/*` の小文字 DOM に `data-ui-source` が付いていることを確認する。
4. `curl` または browser DevTools で transformed module を確認し、`src/components/Hero.tsx:...` のような app root 相対 path になっていることを確認する。
5. transformed module を確認し、`packages/vite-plugin-ui-variants/src/client` 由来の overlay module に `data-ui-source` が注入されていないことを確認する。
6. `../package.json` や絶対パスを含む source location で session start を直接叩き、server が拒否することを確認する。
