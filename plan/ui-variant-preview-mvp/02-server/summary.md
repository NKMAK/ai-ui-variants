# Phase 2: Local Agent Server + plugin middleware

## 目的

`/__ui_agent/*` を処理する Local Agent Server を Vite plugin の middleware として実装し、curl で session start → generate → preview → apply/discard の一連が動く状態を作る（overlay なしで server を検証）。

## 対象範囲

### 今回やること

- パス変換（アプリ相対⇔repo相対）と mock generator（search/replace）
- base snapshot 保存/復元、git worktree での patch 化、patch 適用/検証
- 単一セッション排他・lock・clean チェック・codeRange 抽出
- API ルーティングと plugin entry（`configureServer`）の結線

### 今回やらないこと

- overlay 注入（`transformIndexHtml`）と overlay UI（Phase 3・4）
- Claude API / Claude Code 実装（mock のみ。Phase 5 で差し替え）
- patch 適用後の `data-ui-source` 行番号再注入

## サブタスク一覧

| # | サブタスク | 状態 | 依存 | 並列可否 | ファイル |
| --- | --- | --- | --- | --- | --- |
| 1 | paths + generator(mock) | 未着手 | Phase 1 | 単独委任可 | [01-paths-generator-mock.md](01-paths-generator-mock.md) |
| 2 | snapshot + worktree + patch | 未着手 | #1（paths） | 単独委任可 | [02-snapshot-worktree-patch.md](02-snapshot-worktree-patch.md) |
| 3 | session + router + plugin entry | 未着手 | #1, #2 | 単独委任可（結線） | [03-session-router-plugin.md](03-session-router-plugin.md) |

**実行順**: 1 → 2 → 3（直列）。#2 は #1 の `paths.ts`、#3 は #1/#2 の全関数に依存するため並列はしない。各サブタスクは単独で subagent に委任でき、完了ごとに tsc → コミット。

## 参照（全サブタスク共通）

- 仕様: `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md`（API 案・Session モデル・Base Snapshot・Variant 切り替えの内部処理・制約/ガードレール）
- `.claude/tech/folder-structure.md`（パス基準）、`git-worktree.md`、`ai-mock-generator.md`、`vite.md`
- 不変条件: 完全寄り制約 / AI は diff を書かない / 単一セッション排他 + lock / 禁止ファイル機械チェック（`CLAUDE.md` 参照）

## フェーズ完了条件

- [ ] `POST /session/start` が clean 時に成功し、未コミット変更がある対象ファイルでは 409 で拒否される
- [ ] アクティブセッション中の 2 件目 start が排他で拒否される
- [ ] `generate-variants` が 3 案を返し、各 patch が `.ui-agent/sessions/<sid>/patches/` に生成される
- [ ] denylist 該当・ファイル数超過・行数超過の patch が `failed` になる
- [ ] `preview` で demo-app の対象ファイルが書き換わり、HMR が発火する
- [ ] `apply` で選択 patch が残り worktree が掃除される / `discard` で base に戻る
- [ ] `pnpm tsc --noEmit` が通り、各サブタスクがコミットされている

## 検証方法（フェーズ結合確認 = サブタスク #3 完了時）

```bash
pnpm --filter demo-app dev    # 起動したまま別ターミナルで
BASE=http://localhost:5173/__ui_agent   # 実ポートに合わせる

# start（clean 時 → id。未コミット変更ありで再実行 → 409）
curl -s -X POST $BASE/session/start -H 'content-type: application/json' \
  -d '{"file":"src/components/SaveButton.tsx","line":2,"column":5}'
# generate（3 案・patch 生成）
curl -s -X POST $BASE/session/<id>/generate-variants -H 'content-type: application/json' \
  -d '{"instruction":"このボタンを目立たせて","count":3}'
# preview（対象ファイルが変わる）→ apply / discard
curl -s -X POST $BASE/session/<id>/preview/<variantId>
curl -s -X POST $BASE/session/<id>/apply/<variantId>
curl -s -X POST $BASE/session/<id>/discard
git worktree list   # apply/discard 後に残骸がないこと
```
