# Phase 2 / サブタスク 1: paths + generator(mock)

## 目的

パス変換ユーティリティ（アプリ相対⇔repo相対・`.ui-agent/` パス組み立て）と、固定 3 案（search/replace）を返す mock generator を実装する。

## 前提（subagent 向け・必読）

- Phase 1 完了済み: `src/shared/types.ts` に `SourceLocation` / `FileChange`（`file` + `edits:{search;replace}[]`）/ `VariantOutput` / `Variant` / `Session`、`src/constants.ts` に `API_BASE` / `DENYLIST` / `MAX_FILES` / `MAX_DIFF_LINES` がある。
- 読む: `.claude/tech/folder-structure.md`（パス基準: git 操作は git root 相対、`data-ui-source` はアプリ相対）、`.claude/tech/ai-mock-generator.md`（`VariantGenerator` interface・型）。
- 不変条件: AI は diff を書かない（変更後コードを返すだけ）。同一ファイル・構造を壊さない変更に限定。

## 対象範囲

- 今回やること: `paths.ts` / `generator/types.ts` / `generator/mock.ts`
- 今回やらないこと: snapshot/worktree/patch（#2）、session/router/plugin（#3）

## 変更対象ファイル（すべて新規）

| パス | 役割 |
| --- | --- |
| `packages/vite-plugin-ui-variants/src/server/paths.ts` | repoRoot 解決・アプリ相対→repo相対・`.ui-agent/` パス組み立て |
| `packages/vite-plugin-ui-variants/src/server/generator/types.ts` | `VariantGenerator` interface |
| `packages/vite-plugin-ui-variants/src/server/generator/mock.ts` | 固定 3 案（search/replace）を返す |

## 実装ステップ

1. `server/paths.ts`:
   - `resolveRepoRoot(cwd): string` … `git -C <cwd> rev-parse --show-toplevel`。
   - `appToRepoPath(appRel, appRoot, repoRoot): string` … アプリ相対（例 `src/components/SaveButton.tsx`）を repo 相対（例 `examples/demo-app/src/components/SaveButton.tsx`）へ変換。`appRoot` は plugin option（既定で Vite の `config.root`）から渡される想定で引数に取る。
   - `uiAgentDir(repoRoot)` / `sessionDir(repoRoot, sid)` / `patchesDir(repoRoot, sid)` / `worktreeDir(repoRoot, sid, variantId)` を `path.join` で組み立てる。
2. `server/generator/types.ts`: `ai-mock-generator.md` の `VariantGenerator` を定義する。`generate(input: { instruction; selectedSource; codeRange; callerSource?; count }): Promise<VariantOutput[]>`。型は `shared/types.ts` から import（重複定義しない）。
3. `server/generator/mock.ts`: `MockGenerator implements VariantGenerator` を作る。`selectedSource.file` に対し固定 3 案を `VariantOutput[]` で返す。各案は `changes:[{ file, edits:[{search, replace}] }]`。例: A=文言「保存」→「保存する」、B=`className` 追加で強調、C=`className` でサイズ変更。search 文字列は demo の `SaveButton.tsx` に一意に存在する原文に合わせる。`as any` を使わない。
4. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行する。
5. コミットする（「なぜ」: パス変換と mock generator を用意し server コアの土台を作る）。

## 完了条件

- [x] `paths.ts` が repoRoot 解決とアプリ相対→repo相対変換を提供する
- [x] `MockGenerator` が 3 件の `VariantOutput`（search/replace）を返す
- [x] `pnpm tsc --noEmit` が通る
- [x] コミット済み

## 検証方法

```bash
pnpm --filter vite-plugin-ui-variants exec tsc --noEmit
```

型チェックが通ること。mock の戻り値が `VariantOutput[]` で、各 `changes[].edits[].search` が demo の `SaveButton.tsx` の実テキストに一致することを目視確認する（実際の patch 化検証は #2・#3 で行う）。
