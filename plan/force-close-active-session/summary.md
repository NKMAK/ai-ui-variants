# force-close-active-session

## 目的

`Another session is already active.` で overlay が詰まった場合に、ユーザーが画面上から現在の active session を破棄して再試行できるようにする。

## 参照ドキュメント

| ファイル | 確認観点 |
| --- | --- |
| `.claude/specs/summary.md` | 最新仕様 v2 と単一セッション排他の位置づけ |
| `.claude/tech/summary.md` | Browser Overlay / Local Agent Server / shared 型の責務分離 |
| `.claude/tech/preact-signals.md` | overlay の signal 中心状態管理 |

## 設計方針

- `Another session is already active.` が表示されている場合だけ、隣に小さめの復旧ボタンを出す。
- client が session id を知らない詰まり方に対応するため、server に active session を破棄する endpoint を追加する。
- 破棄処理は既存 `discardSession` と同じ snapshot restore / worktree cleanup / releaseSession の経路を使い、rollback 不変条件を崩さない。
- active session が存在しない場合は成功扱いで `session: null` を返し、UI 側は error と選択状態をクリアする。

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細ファイル |
| --- | --- | --- | --- |
| 1 | API と UI の復旧ボタン実装 | 進行中 | `summary.md` |

## 実装ステップ

1. `packages/vite-plugin-ui-variants/src/shared/types.ts` に active session discard response 型を追加する。
2. `packages/vite-plugin-ui-variants/src/server/router.ts` に `POST /__ui_agent/session/discard-active` を追加し、既存 `discardSession` を active session id に対して呼ぶ。
3. `packages/vite-plugin-ui-variants/src/client/api/client.ts` に `postDiscardActive()` を追加する。
4. `packages/vite-plugin-ui-variants/src/client/components/SourceLocation/index.tsx` で対象エラー時だけ小さい `Close session` ボタンを表示し、成功時は `sessionError` / `sessionId` / `selectedSource` / variant state をクリアする。
5. `packages/vite-plugin-ui-variants/src/client/components/SourceLocation/style.css` で error text とボタンを横並びにし、狭い幅では折り返す。
6. 型チェックと差分チェックを実行する。

## 完了条件

- [x] `Another session is already active.` の隣に小さめの session close ボタンが出る。
- [x] ボタン押下で active session を既存 discard 経路により破棄できる。
- [x] active session がない場合も UI が復旧状態に戻る。
- [x] `pnpm --filter vite-plugin-ui-variants build` が成功する。
- [x] `git diff --check` が成功する。
- [ ] 変更をコミットする。

## 検証メモ

- `pnpm --filter vite-plugin-ui-variants build`
- `git diff --check`
- `pnpm --filter demo-app dev -- --host 127.0.0.1` を起動し、`POST /__ui_agent/session/start` → `POST /__ui_agent/session/discard-active` が `discarded` を返すことを確認。
- active session がない状態の `POST /__ui_agent/session/discard-active` が `{"ok":true,"session":null}` を返すことを確認。
