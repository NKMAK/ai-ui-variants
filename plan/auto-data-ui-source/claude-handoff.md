# Auto data-ui-source Injection 実装プロンプト

`/Users/nakamuraakira/program/web/ai-ui-variants` で作業してください。

まず必ず以下を読んでください。

- `AGENTS.md`
- `.claude/specs/summary.md`
- `.claude/tech/summary.md`
- `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md`
- `.claude/tech/data-ui-source.md`
- `.claude/tech/vite.md`
- `.claude/tech/folder-structure.md`
- `plan/auto-data-ui-source/summary.md`
- `plan/auto-data-ui-source/01-babel-transform.md`
- `plan/auto-data-ui-source/02-remove-manual-attributes.md`
- `plan/auto-data-ui-source/03-verification-and-docs.md`

今回やること:

`data-ui-source` の手書きをなくし、Vite dev server 上で JSX intrinsic element に dev 時だけ自動注入してください。計画は `plan/auto-data-ui-source/` を正とし、Phase 1 -> Phase 2 -> Phase 3 の順に実装してください。

絶対に守ること:

- 実装前に計画ファイルを読み、設計を勝手に変えない。
- `data-ui-source` は app root 相対 path として扱う。
- transform 対象は host app root 配下の `.tsx` / `.jsx` だけに限定する。
- plugin 自身の overlay TSX、monorepo 内の別 package、`/@fs` 経由の app root 外ファイルには注入しない。
- 属性値に絶対パス、`..`、OS依存 separator を入れない。POSIX の app root 相対 path にする。
- server 側でも `SourceLocation.file` が app root 外へ出ないことを検証し、forged request で任意ファイルを開けないようにする。
- React plugin より前に JSX を処理するため、`uiVariants()` plugin に `enforce: "pre"` を追加する。
- `apply: "serve"` を維持し、本番 build には注入しない。
- `as any` は使わない。
- 既存の unrelated change は戻さない。

実装の主な流れ:

1. `packages/vite-plugin-ui-variants` に Babel 依存を追加する。
   - `@babel/parser`
   - `@babel/traverse`
   - `@babel/generator`
   - `@babel/types`
   - plugin 実行時に必要なので `dependencies` に入れる。
2. `packages/vite-plugin-ui-variants/src/transform/path.ts` を作る。
   - Vite module id から query/hash を除去する。
   - `/@fs/` prefix を正規化する。
   - `server.config.root` 配下の `.tsx` / `.jsx` だけに app root 相対 POSIX path を返す。
   - app root 外なら `null` を返して transform しない。
3. `packages/vite-plugin-ui-variants/src/transform/dataUiSource.ts` を作る。
   - Babel parser/traverse/generator で JSX AST を処理する。
   - 小文字の JSX intrinsic element だけに `data-ui-source="src/...:line:column"` を追加する。
   - 大文字 custom component は対象外。
   - 既に `data-ui-source` がある場合は二重注入しない。
   - 初期実装は `map: null` でよい。ただし Phase 3 で HMR / error overlay / stack trace を確認する。
4. `packages/vite-plugin-ui-variants/src/index.ts` に `configResolved` と `transform` hook を追加する。
5. `packages/vite-plugin-ui-variants/src/server/paths.ts` と `session.ts` に source path validation を追加する。
   - 絶対パスを拒否。
   - `..` で app root 外へ出る path を拒否。
   - repo root 外になる path を拒否。
6. demo app の手書き `data-ui-source` を削除する。
   - `examples/demo-app/src/components/Masthead.tsx`
   - `examples/demo-app/src/components/Hero.tsx`
   - `examples/demo-app/src/components/PreviewCard.tsx`
   - `examples/demo-app/src/components/Workflow.tsx`
   - `examples/demo-app/src/components/Features.tsx`
   - `examples/demo-app/src/components/Playground.tsx`
   - `examples/demo-app/src/components/Footer.tsx`
7. demo の説明文、`.ui-variants/project-context.md`、generator prompt/context を手書き属性前提から自動注入前提へ更新する。
8. `packages/vite-plugin-ui-variants/src/server/generator/mock.ts` の search/replace から手書き `data-ui-source` 前提をなくす。
9. docs と plan を更新する。
   - `.claude/tech/data-ui-source.md`
   - `.claude/tech/vite.md`
   - `.claude/tech/summary.md`
   - `plan/demo-product-lp/summary.md`
   - `plan/auto-data-ui-source/*.md`

検証してください:

- `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`
- `pnpm --filter demo-app exec tsc --noEmit`
- `pnpm lint`
- `git diff --check`
- `pnpm --filter demo-app dev`
- ブラウザで overlay ON、Hero headline / CTA / Workflow card / Feature card / Playground button をクリックし、source location が表示されること。
- session start が自動注入された app root 相対 path で成功すること。
- direct API で `../package.json` や絶対パスなど app root 外 source path を渡し、server が拒否すること。
- 手書き `data-ui-source` なしで variant generate まで進み、mock / configured generator が失敗しないこと。
- transformed module を確認し、plugin overlay TSX に `data-ui-source` が注入されていないこと。
- React Fast Refresh が継続し、sourcemap なしでも error overlay / stack trace に致命的な問題がないこと。
- クリック粒度が core 体験として破綻していないこと。問題が大きければ overlay 側粒度調整を別 plan に切り出す。

完了条件:

- `plan/auto-data-ui-source/summary.md` の完了条件をすべて満たす。
- Phase 1 / 2 / 3 のチェックボックスと状態を更新する。
- 関連 docs が現在地に同期されている。
- 変更を日本語メッセージでコミットする。

注意:

- `.github/workflows/demo-pages.yml` に既存の未コミット変更がある場合、それは別件なので触らない。
- コミット対象は今回の実装に必要なファイルだけにする。
