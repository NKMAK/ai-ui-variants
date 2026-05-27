# git worktree（variant分離 / patch化）

## 役割

AIの複数案（Variant A/B/C）を**安全に分離して生成・保持**する作業場所。preview表示用ではない。
各worktreeに「変更後コード」を書き込み、`git diff` で決定論的にpatch化する。

## なぜ採用したか

- AIにmainを直接書かせず、案ごとに隔離したい。
- 仕様の核心: worktreeは **mainの最新commitを基準**に作る。完全寄り制約（対象ファイルがclean）により `main現状 = commit = worktree base` が一致し、`git diff` で得たpatchが **conflictなくmainに当たる**。
- AIはdiffを書かない（行番号ズレで間違える）。**patch化はサーバ側の責務** → worktreeに書いて `git diff` させるのが最も確実。

## このプロジェクトでの使い方

`server/worktree.ts`（概念）:

```bash
# session開始時: 各variant用worktreeを最新commitから作成
git -C <repoRoot> worktree add .ui-agent/worktrees/<sid>/variant-a HEAD

# AIの変更後コードを variant-a worktree に書き込んだ後、patch化
git -C .ui-agent/worktrees/<sid>/variant-a diff > .ui-agent/sessions/<sid>/patches/variant-a.patch
```

- patchは `Variant.patchPath` に保存。
- preview/apply時は **main worktree** に対して `base snapshot復元 → patch適用`。
- discard/apply完了後は `git worktree remove` で掃除。

## 注意点

- **monorepo全体のworktree**になる（サブディレクトリ単位ではない）。patchのパスはrepo root相対（`examples/demo-app/src/...`）。`paths.ts` でアプリ相対から変換する（[folder-structure.md](folder-structure.md)）。
- 簡素化の代替: MVPはビルド・型検証をしないため、worktreeの代わりに **temp dirにファイルをコピー→書換→`git diff --no-index`** でもpatchは作れる。仕様も「実装簡素化の選択肢」として残している。本設計は分離の明快さでworktreeを採る。
- patch検証は別責務 → [ai-mock-generator.md](ai-mock-generator.md) / `patch.ts`（denylist・ファイル数・行数）。

## 関連

- [pnpm-monorepo.md](pnpm-monorepo.md)
- [ai-mock-generator.md](ai-mock-generator.md)
- 仕様: ../specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md
