# Phase 2 / サブタスク 3: session + router + plugin entry

## 目的

セッション管理（排他・lock・clean チェック・codeRange）と API ルーティング、plugin entry（`configureServer`）を結線し、curl で start→generate→preview→apply/discard を end-to-end で通す。

## 前提（subagent 向け・必読）

- Phase 2 / #1・#2 完了済み: `paths.ts` / `generator/{types,mock}.ts` / `snapshot.ts` / `worktree.ts` / `patch.ts` がある。
- 読む: 仕様の「API 案」「Session モデル」「Variant 切り替えの内部処理」「制約・ガードレール（完全寄り）」、`.claude/tech/vite.md`（`configureServer` / `apply: "serve"` / middleware の body parse）。
- 不変条件: 完全寄り制約（対象ファイルに未コミット変更があれば start しない）／単一セッション排他＋lock で逐次化／rollback は base snapshot 中心。

## 対象範囲

- 今回やること: `session.ts` / `router.ts` / `index.ts`（plugin entry）/ demo の `vite.config.ts` 登録 / package.json exports
- 今回やらないこと: overlay 注入・UI（Phase 3・4）、Claude 実装（Phase 5）

## 変更対象ファイル

| パス | 区分 | 役割 |
| --- | --- | --- |
| `src/server/session.ts` | 新規 | セッション状態・排他・lock・clean チェック・codeRange |
| `src/server/router.ts` | 新規 | API ルーティング・JSON body parse・エラー応答 |
| `src/index.ts` | 新規 | plugin entry（`configureServer`、`apply: "serve"`） |
| `examples/demo-app/vite.config.ts` | 変更 | `uiVariants()` を plugins に追加 |
| `packages/vite-plugin-ui-variants/package.json` | 変更 | exports に plugin entry を反映 |

## 実装ステップ

1. `session.ts`:
   - モジュールスコープに「アクティブセッション 1 つ」を保持（`Session | null`）。
   - `startSession(source: SourceLocation)`: 既存アクティブがあれば排他エラー。対象ファイル（定義側 + caller があれば追加）が clean か `git -C <repoRoot> status --porcelain <repoRel>` で確認、空でなければ拒否（完全寄り）。`saveSnapshot` を呼び、`session.json` を `sessionDir` に書く。
   - `extractCodeRange(repoRoot, repoRelFile, line)`: 定義行の周辺（±25 行程度）を `{ file, startLine, endLine, content }` で返す。
   - `withLock(fn)`: `session.locked` を立てて逐次化。処理中の新規要求は拒否（または最新のみ反映）。
2. `router.ts`: `createRouter(server, options)` を connect 互換ハンドラとして実装。ルート: `POST /session/start`・`POST /session/:id/generate-variants`・`POST /session/:id/preview/:variantId`・`POST /session/:id/apply/:variantId`・`POST /session/:id/discard`・`GET /session/:id`。JSON body をパースし各 server 関数へ委譲。clean 違反・排他違反は 409、未知セッションは 404、検証 NG は variant 単位で `failed`。
3. `generate-variants` 処理: mock generator（option 既定）で `VariantOutput[]` を取得 → `createWorktrees` → `applyChangesAndDiff` → patch を `patchesDir` に保存 → `validatePatch` で検証 → NG は `status:"failed"`、OK は `"ready"`。
4. `preview` 処理: `withLock` 下で `restoreSnapshot` → 対象 variant patch を `applyPatch` → `currentIndex` 更新（HMR は Vite のファイル監視が自動発火）。
5. `apply`: `restoreSnapshot` → 選択 patch 適用 → `status:"applied"` → `removeWorktrees`。`discard`: `restoreSnapshot` → `status:"discarded"` → `removeWorktrees`。いずれもアクティブセッションを解放（次の start を受け付ける）。
6. `index.ts`: `uiVariants(options?)` を実装。`name:"ui-variants"`、`apply:"serve"`、`configureServer(server)` で `server.middlewares.use(API_BASE, createRouter(server, options))`。`options.appRoot` 既定は `server.config.root`。
7. `examples/demo-app/vite.config.ts` の plugins に `uiVariants()` を追加する。
8. `package.json` の exports を plugin entry に合わせる。
9. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行する。
10. demo-app dev を起動し、`summary.md` の curl 手順で全エンドポイントを検証する。
11. `.ui-agent/` が gitignore され作業ツリーに残らないことを確認し、コミットする（「なぜ」: server を結線し patch 切替フローを成立）。

## 完了条件

`02-server/summary.md` の「フェーズ完了条件」を全て満たす:

- [x] start の clean チェック（409）・単一セッション排他（409）
- [x] generate で 3 案・patch 生成・検証（denylist/数/行数で `failed`）
- [x] preview で対象ファイル書換・HMR 発火
- [x] apply で patch 残存＋worktree 掃除 / discard で base 復元＋掃除
- [x] `pnpm tsc --noEmit` が通り、コミット済み

## 検証方法

`02-server/summary.md` の「検証方法（フェーズ結合確認）」の curl 手順をそのまま実行する。加えて:

- start を二重に投げて 2 件目が 409 で拒否されること
- SaveButton をコミットせず変更した状態で start が 409 になること
- apply / discard 後に `git worktree list` に残骸がないこと
