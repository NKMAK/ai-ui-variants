# Phase 1: Server API と worktree cleanup/refine seed

## 目的

`generate-variants` に `replace` / `refine` mode を追加し、既存 worktree 衝突を防ぎながら、preview 中の UI を土台にした cumulative patch を生成できるようにする。

## 対象範囲

### 今回やること

- shared 型に `GenerateMode` と generate request body の型を追加する。
- server の `generateVariants` に mode 分岐を追加する。
- 生成前に既存 worktree / patch を cleanup する。
- `refine` では現在 variant の patch を seed として各 worktree に適用してから AI 変更を反映する。
- seed 適用後のファイル内容から generator 用 `codeRange` を再抽出する。

### 今回やらないこと

- Overlay UI のボタン追加。
- mock / Claude generator の出力仕様変更。
- apply/discard の外部 API パス変更。

## 変更対象ファイル

- `packages/vite-plugin-ui-variants/src/shared/types.ts`
- `packages/vite-plugin-ui-variants/src/server/router.ts`
- `packages/vite-plugin-ui-variants/src/server/session.ts`
- `packages/vite-plugin-ui-variants/src/server/worktree.ts`
- `packages/vite-plugin-ui-variants/src/server/patch.ts`

## 実装ステップ

1. `types.ts` に `GenerateMode = "replace" | "refine"` を追加し、generate request body が `instruction` / `count` / `mode` を持てるようにする。
2. `router.ts` の request body normalize で `mode` を読み取り、未指定時は既存互換として `replace` にする。
3. `patch.ts` に patch 文字列を一時ファイル経由または stdin 経由で適用する helper を追加する。
4. `worktree.ts` に session patch directory を消す cleanup helper、または `router.ts` から安全に patch files を削除する処理を追加する。
5. `worktree.ts` に worktree 作成後の seed patch 適用処理を追加する。
6. `session.ts` に seed 適用後の対象ファイルから `CodeRange` を再抽出する helper を追加する。
7. `router.ts` の `generateVariants` で、生成開始時に `status:"generating"` にする前後の失敗時復旧を整理する。
8. `replace` mode では `restoreSessionSnapshot` -> cleanup -> base codeRange で generator -> worktree 作成 -> diff 生成、の順にする。
9. `refine` mode では現在 variant を取得し、seed patch を退避してから `restoreSessionSnapshot` -> seed patch を main に適用 -> seed codeRange 抽出 -> cleanup -> worktree 作成 -> 各 worktree に seed patch 適用 -> diff 生成、の順にする。
10. 生成成功時は既存どおり `variants` / `currentIndex:-1` / `status` を更新し、client 側の first ready preview に任せる。
11. 生成失敗時は `status:"failed"` と error を保存し、lock が解除されることを確認する。

## 完了条件

- [x] 同じ session で `mode:"replace"` を連続実行しても `worktree add ... already exists` が起きない。
- [x] `mode:"refine"` は current variant がない場合に 409 を返す。
- [x] `mode:"refine"` で生成された patch は seed patch を含む cumulative patch になる。
- [x] `apply` / `discard` は既存 API のまま動く。
- [x] `as any` を使わない。

## 検証方法

```bash
pnpm --filter vite-plugin-ui-variants exec tsc --noEmit
```

手動 API 確認:

1. session start。
2. `generate-variants` に `{ "instruction": "...", "mode": "replace" }` を送る。
3. preview する。
4. 同じ session に再度 `{ "instruction": "...", "mode": "replace" }` を送り、worktree 衝突がないことを確認する。
5. preview した状態で `{ "instruction": "...", "mode": "refine" }` を送り、patch が累積変更になっていることを確認する。
6. `git worktree list` で apply/discard 後の残骸がないことを確認する。
