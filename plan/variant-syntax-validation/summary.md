# Variant Syntax Validation

## 目的

生成された variant を preview/apply 可能にする前に TSX/JSX 構文検証を通し、壊れた variant は画面を壊さず `failed` として理由を表示する。

## 現在地

- `generateVariants()` は generator output を worktree に反映し、`git diff` patch を作ってから `validatePatch()` で denylist / file count / diff size を検証している。
- `VariantStatus` にはすでに `failed` があり、`Variant.error` も共有型に存在する。
- client は `failed` variant を preview 対象から外せるが、現在の `currentIndex` 初期値と表示は「最初の要素が表示対象」という前提が残っている。
- 今回の `>> WORKFLOW <<<` のような JSX text 内の未エスケープ `<` は、Vite plugin の `data-ui-source` transform が parse する段階で dev server error になる。

## 参照ドキュメント

| ドキュメント | 確認観点 |
| --- | --- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | AI は diff を書かない、patch 化は server 側、同一ファイル・構造を壊さない変更に限定する不変条件 |
| `.claude/tech/ai-mock-generator.md` | generator output、patch 化、機械的 validation の位置づけ |
| `.claude/tech/git-worktree.md` | worktree 隔離生成と `git diff` patch 化の流れ |
| `.claude/tech/typescript.md` | shared 型の配置と server/client 分離 |
| `.claude/tech/preact-signals.md` | overlay 側の signal state と variant 表示状態 |

## 設計方針

- 構文検証は Local Agent Server 側で行う。preview endpoint に到達する前に失敗を確定し、main worktree に壊れた patch を当てない。
- `@babel/parser` を使って、変更後 worktree 上の `.tsx` / `.jsx` ファイルを parse する。`typescript` と `jsx` plugin を有効にし、既存の `data-ui-source` transform と近い条件にする。
- `validatePatch()` は patch 文字列の機械チェックとして残し、構文検証は別関数に分ける。候補名は `validateChangedFiles()` または `validateVariantFiles()`。
- 無効 variant は破棄せず `status: "failed"` と `error` を持たせて返す。ユーザーが「生成されたが無効だった」ことを理解できる UX にする。
- `ready` variant が1件以上あれば最初の `ready` を自動 preview する。0件なら session は `failed` になり、client は失敗理由一覧を表示する。

## スコープ外

- TypeScript 型チェック全体の実行。
- runtime error / React render error の検知。
- AI 出力の自動エスケープや AST-aware rewrite。
- generator prompt の大幅改修。

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細 |
| --- | --- | --- | --- |
| 1 | Server-side syntax validation | 完了 | `01-server-syntax-validation.md` |
| 2 | Failed variant UX | 完了 | `02-failed-variant-ux.md` |
| 3 | Verification and docs | 完了 | `03-verification-and-docs.md` |

## 完了条件

- [x] 生成後の `.tsx` / `.jsx` 変更ファイルが Babel parse で検証される。
- [x] JSX 構文エラーを含む variant は `failed` になり、preview/apply できない。
- [x] 有効 variant が残っている場合は最初の有効 variant が preview される。
- [x] 有効 variant が0件の場合、UI に失敗理由が表示される。
- [ ] 今回の `>> WORKFLOW <<<` 相当の fixture / 手順で dev server error を起こさず失敗表示になることを確認する。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を通す。
- [x] `pnpm --filter demo-app exec tsc --noEmit` を通す。
- [x] `git diff --check` を通す。
- [x] 変更をコミットする。

## 後続候補

- TypeScript semantic check のオプション化。
- JSX text replacement を server 側で安全に entity / expression 化する AST-aware edit。
- preview 後の runtime error boundary / Vite error overlay 連携。
