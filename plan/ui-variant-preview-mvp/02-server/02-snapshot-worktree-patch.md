# Phase 2 / サブタスク 2: snapshot + worktree + patch

## 目的

base snapshot の保存/復元、git worktree への変更後コード書込と `git diff` による patch 化、patch 適用と検証（denylist・ファイル数・行数）を実装する。

## 前提（subagent 向け・必読）

- Phase 2 / #1 完了済み: `server/paths.ts`（`resolveRepoRoot` / `appToRepoPath` / `uiAgentDir` / `sessionDir` / `patchesDir` / `worktreeDir`）、`server/generator/{types,mock}.ts` がある。
- 読む: `.claude/tech/git-worktree.md`（worktree add/diff/remove、patch が main に当たる条件）、`.claude/tech/ai-mock-generator.md`（patch 検証の責務）、仕様の「Base Snapshot」「制約・ガードレール」。
- 不変条件: git 操作はすべて `git -C <repoRoot>`。AI は diff を書かない（patch 化は `git diff` でサーバが決定論的に行う）。禁止ファイルは patch から機械チェック（denylist。自己申告に頼らない）。rollback は base snapshot 中心（`git reset` を使わない）。

## 対象範囲

- 今回やること: `snapshot.ts` / `worktree.ts` / `patch.ts`
- 今回やらないこと: session/router/plugin（#3）。これらの関数は #3 から呼ばれる。

## 変更対象ファイル（すべて新規）

| パス | 役割 |
| --- | --- |
| `src/server/snapshot.ts` | base snapshot 保存/復元 |
| `src/server/worktree.ts` | worktree add/remove・変更後コード書込・`git diff` |
| `src/server/patch.ts` | `git apply`・touchedFiles 抽出・denylist/数/行数検証 |

## 実装ステップ

1. `snapshot.ts`:
   - `saveSnapshot(repoRoot, repoRelFiles: string[]): Record<string,string>` … 各ファイルを読み `{ repoRel: content }` を返す。
   - `restoreSnapshot(repoRoot, snapshot: Record<string,string>): void` … Record の内容で各ファイルを上書きする。
2. `worktree.ts`:
   - `createWorktrees(repoRoot, sid, variantIds: string[]): void` … 各 variant に `git -C <repoRoot> worktree add <worktreeDir> HEAD`。
   - `applyChangesAndDiff(repoRoot, worktreePath, changes: FileChange[]): string` … `changes[].edits` を worktree 内の該当ファイルに search/replace 適用 → `git -C <worktreePath> diff` の標準出力を patch 文字列で返す。search が見つからない/一意でない場合はそのファイルを失敗として扱い、呼び出し側が variant を `failed` にできるようにエラー or 空を返す。
   - `removeWorktrees(repoRoot, sid): void` … `git -C <repoRoot> worktree remove --force <worktreeDir>` を各 variant に。
3. `patch.ts`:
   - `extractTouchedFiles(patch: string): string[]` … diff ヘッダ（`diff --git a/... b/...` / `+++ b/...`）から変更ファイルを抽出。
   - `validatePatch(patch: string): { ok: boolean; reason?: string }` … `DENYLIST` 該当・touchedFiles 数 > `MAX_FILES`・追加削除行数 > `MAX_DIFF_LINES` を NG。
   - `applyPatch(repoRoot, patchPath: string): void` … `git -C <repoRoot> apply <patchPath>`。
4. git コマンドは `node:child_process` の `execFileSync`（または Promise 化した `execFile`）で実行し、`as any` を使わない。
5. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行する。
6. コミットする（「なぜ」: snapshot/worktree/patch の git 操作コアを用意）。

## 完了条件

- [x] `saveSnapshot` / `restoreSnapshot` がファイル内容を Record で往復できる
- [x] `createWorktrees` → `applyChangesAndDiff` → `removeWorktrees` で patch 文字列が得られる
- [x] search 不一致のとき variant を失敗にできる戻り（エラー or 空）になっている
- [x] `validatePatch` が denylist / ファイル数 / 行数で NG を返す
- [x] `applyPatch` が patch を main worktree に当てられる
- [x] `pnpm tsc --noEmit` が通り、コミット済み

## 検証方法

`.ui-agent/` を実際に使う簡易確認（demo の SaveButton を対象に）:

```bash
# 一時セッション id を sX として手で worktree を作り diff を取る流れを再現
node -e '...'   # もしくは #3 結線後に curl で間接検証
git -C . worktree list   # add した worktree が見え、remove 後に消えることを確認
```

単体で完結しづらい関数は、#3（router 結線）後の curl 検証で実地確認する。本サブタスクでは tsc 通過と、worktree add/remove が手元で成功することを最低限確認する。
