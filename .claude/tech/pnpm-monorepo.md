# pnpm workspace (monorepo)

## 役割

リポジトリを「ツール本体」と「デモアプリ」に分けて管理する。

```text
packages/vite-plugin-ui-variants   # 配布する本体
examples/demo-app                  # 動作確認用のVite+Reactアプリ
```

## なぜ採用したか

- ツール（plugin）とデモ（アプリ）の **境界を明確化**したい。単一パッケージだと両者が混ざり、後で配布・Next.js対応する際に分離コストがかかる。
- デモアプリは `vite-plugin-ui-variants` を **workspace参照**（`workspace:*`）で使える。npm publish前から `import { uiVariants } from 'vite-plugin-ui-variants'` が通る。
- pnpmはworkspace + symlinkの扱いが堅実で、worktree（[git-worktree.md](git-worktree.md)）と併用してもnode_modulesが素直。

## このプロジェクトでの使い方

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "examples/*"
```

- root `package.json` は `private: true`。共通devツール（typescript等）をrootに置く。
- デモアプリの `package.json` で `"vite-plugin-ui-variants": "workspace:*"` を依存に入れる。
- 起動は `pnpm --filter demo-app dev`（または root scriptでラップ）。

## 注意点

- **git worktreeはmonorepo全体**のworktreeになる（サブディレクトリ単位ではない）。worktree内でも `pnpm install` 済みのnode_modulesが要る場合があるが、MVPはビルド・型検証をしないため、worktreeは「変更後コードを書いて `git diff` する」用途に限定すれば追加installは不要。
- patchのパスは **repo root相対**になる。詳細は [folder-structure.md](folder-structure.md) のパス約束を参照。

## 関連

- [git-worktree.md](git-worktree.md)
- [vite.md](vite.md)
