# Bug Fix: Session 競合と選択行制約強化

## 目的

「UIを選択し直すと `Another session is already active.` で詰まる」「選択行ではなく別の要素まで変更される」2つのバグを直し、クリック → 指示 → 確認のループを再現性のあるものにする。

## 参照ドキュメント

| ドキュメント | 確認観点 |
| --- | --- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | 単一セッション排他制約、source 切り替え時の期待挙動、選択行の扱い |
| `plan/session-discard-and-target-line-fix/summary.md` | 直前に同種バグへ入れた修正の範囲（重複しないように） |

## 現在地

直近コミット `1ed1cc2` で discard の `finally` 化と `CodeRange.selectedLine` 追加までは入っているが、別経路で同じ症状が残っている：

- **bug 1（選択行が無視される）**: demo-app は `.ui-variants/claude-code-prompt.md` のカスタムプロンプトを使っており、`default-prompt.md` 側に入れた選択行優先ルールが**反映されていない**。さらに既存ルールも "Prefer" と弱く、`±25 行` の code range から AI が自由に対象を選べる。
- **bug 2（セッション競合）**: `useSession` は `selectedSource` が変わるたび `postStart` するだけで、サーバ側で活きている前セッションを `discard` しない。前セッションが残った状態で start するため `ConflictError` になり、クライアント側は `sessionId=null` で Next/Previous も Discard も動かない詰み状態になる。
- **bug 2 の致命的な注意点**: `postStart` 完了前に別要素をクリックすると、クライアントは古い session id をまだ知らないため、単に effect 開始時の `sessionId` を discard するだけでは取り逃がす。古い `postStart` が後から成功した場合は、その session id を即 discard し、次の start はその後に進める必要がある。

## 設計方針

### bug 1: 選択行制約の強化

- `default-prompt.md` と `.ui-variants/claude-code-prompt.md` の双方を更新する（同期は手動で良い、両ファイルとも今回触る）。
- ルールを "Prefer" から強制ルールに変える。具体的には「変更は `selectedLine` の上下 2 行以内に限る」「selectedLine 自体に編集可能な text/props/className が無い場合のみ、その直上または直下の 1〜2 行に拡張可」「広域の text/heading に飛ぶことは禁止」を明文化する。
- ユーザー指示が曖昧（例: 「文字を小さくしてオレンジ色にして」）でも選択行を強制対象にする。

### bug 2: source 切り替え時に前セッションを discard

- `useSession` 内で session lifecycle を直列化する。新しい `selectedSource` で `postStart` を発行する前に、前の start/discard 遷移が完了し、前セッションまたはキャンセル済み start が作った stale session があれば**サーバ側を解放済み**であることを保証する。
- effect cleanup はキャンセル印を立てるだけにし、discard/start の副作用は直列化された lifecycle 本体に集約する。
- variant state（`variants` / `currentIndex`）は source 切り替え時にもリセットする（古い variant を新しい source 用 panel に持ち越さない）。
- 念のため、`postStart` で `ConflictError` を受けた場合は `sessionError` に出すだけで、UI はリセット済み状態を維持。

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細ファイル |
| --- | --- | --- | --- |
| 1 | プロンプトの選択行制約強化（bug 1） | 完了 | `01-prompt-selected-line-constraint.md` |
| 2 | source 切り替え時の前セッション discard（bug 2） | 完了 | `02-discard-previous-session-on-source-change.md` |
| 3 | 動作確認とコミット | 完了（Hero 固有確認は既存 dirty のため未実施） | `03-verify-and-commit.md` |

## スコープ外

- サーバ側 `/session/start` への `force` フラグ追加。今回は client 側で discard → start の順序を守ることで対処する。
- 複数ファイルにまたがる variant（仕様 v2 で禁止）に関するルール変更。
- mock generator の挙動修正（既に直っているため触らない）。

## 完了条件

- [ ] demo-app の Hero `<p className="hero-sub">`（line 12）をクリックして「文字を小さくしてオレンジ色にして」と指示すると、3 案とも `hero-sub` 周辺だけが変更される（h1 は触られない）。未実施: `examples/demo-app/src/components/Hero.tsx` に既存の未コミット変更があり、仕様 v2 の clean 制約により Hero の session start が拒否されるため。
- [x] variant 表示中に別の UI 要素をクリックすると、前セッションが自動 discard され新しいセッションが開始する（`Another session is already active.` が出ない）。`Masthead.tsx` の clean な要素で確認。
- [x] session start 完了前に素早く別の UI 要素をクリックしても、stale session が残らず新しいセッションが開始する。`Masthead.tsx` の連続クリックで確認。
- [x] 別要素切替後、Discard / Next / Previous が正常に動く。`Masthead.tsx` で Generate 後に確認。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が通る。
- [x] `pnpm --filter demo-app exec tsc --noEmit` が通る。
- [x] 変更をコミットする（コミットメッセージは日本語、「なぜ」を一言）。

## 検証メモ

- `examples/demo-app/src/components/Hero.tsx` には作業開始時点から `hero-bordered` の未コミット変更があったため、Hero 固有の実画面生成確認は未実施。既存変更は戻していない。
- clean な `src/components/Masthead.tsx` で、source 切替、start 前の連続クリック、Generate / Next / Previous / Discard を確認。
- Discard 後に `useVariants` と `useSession` が同じ session を二重 discard しないことも確認（console error なし）。
