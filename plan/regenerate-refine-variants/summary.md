# Regenerate / Refine Variants

## 目的

プレビュー中の UI を確定適用せずに追加指示でブラッシュアップできるようにし、同時に「元の状態から新しく作り直す」操作も明確に分ける。

## 現在地

- 現状の `generate-variants` は同一 session / 同一 `variant-1` などの worktree path を再利用し、既存 worktree が残った状態で再生成すると `already exists` で失敗する。
- Overlay の指示入力は単一の `Generate` ボタンのみで、「既存案を捨てて作り直す」と「表示中の案を土台に修正する」を区別できない。
- `preview` / `apply` / `discard` は base snapshot を中心に動いているため、追加修正も最終的には base snapshot から適用できる cumulative patch として保持する必要がある。

## 参照ドキュメント

| ドキュメント                                                  | 確認観点                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | base snapshot、preview/apply/discard、単一セッションロック、Fast Refresh 制約 |
| `.claude/tech/git-worktree.md`                                | worktree の役割、patch 化、cleanup 方針                                       |
| `.claude/tech/hmr-fast-refresh.md`                            | main worktree を preview surface にする理由、状態維持の条件                   |
| `.claude/tech/ai-mock-generator.md`                           | AI は変更後コードを返し、patch 化はサーバ側で行う前提                         |
| `plan/ui-variant-preview-mvp/04-panel/summary.md`             | 既存 overlay 操作フロー、busy lock、検証観点                                  |

## 設計方針

### UI 文言

- `Generate`: 初回生成。variant がまだないときだけ主操作として使う。
- `Regenerate`: 既存 variant を捨て、base snapshot から新しい Variant A/B/C を作る。
- `Refine current`: 現在 preview 中の variant を土台に、追加指示で新しい Variant A/B/C を作る。
- `Apply current`: 現在 preview 中の variant を本来の作業ツリーに残す。
- `Discard`: session を破棄し、base snapshot に戻す。

### API モード

`POST /__ui_agent/session/:id/generate-variants` の body に `mode` を追加する。

```ts
type GenerateMode = "replace" | "refine";
```

- `replace`: base snapshot に戻し、既存 worktree / patch を cleanup してから生成する。
- `refine`: 現在 preview 中の patch を seed として保持し、seed patch + 追加変更を cumulative patch として生成する。

### refine の内部処理

`refine` は main worktree へ確定適用しない。処理中は次の順序を守る。

1. 現在の `currentVariant` が `ready` または `previewing` で、patch を持つことを確認する。
2. seed patch の内容をメモリに退避する。
3. main worktree を base snapshot に戻し、seed patch を再適用して「今表示している UI」を明示的に再現する。
4. seed 適用後の対象ファイルから generator 用 `codeRange` を再抽出する。
5. 既存 worktree / patch を cleanup する。
6. 新しい worktree を `HEAD` から作り、各 worktree に seed patch を先に適用する。
7. AI から返った変更後コードを seed 済み worktree に反映し、`git diff` で base からの cumulative patch を作る。
8. 生成後は最初の ready variant を preview し、従来どおり base snapshot -> cumulative patch の形で切り替える。

この形なら `apply` は選択した cumulative patch だけを main に残し、`discard` は常に base snapshot へ戻せる。

## スコープ外

- 複数世代の履歴表示や undo stack。
- refine 前後の variant lineage 表示。
- 同時に複数 session を扱う設計。
- AI が複数ファイルや構造変更を行う制約緩和。

## フェーズ一覧

| #   | フェーズ名                                 | 状態 | 詳細ファイル                                                     |
| --- | ------------------------------------------ | ---- | ---------------------------------------------------------------- |
| 1   | Server API と worktree cleanup/refine seed | 完了 | [01-server-generate-modes.md](01-server-generate-modes.md)       |
| 2   | Overlay UI と client hook                  | 完了 | [02-overlay-actions.md](02-overlay-actions.md)                   |
| 3   | 検証と handoff                             | 完了 | [03-verification-and-handoff.md](03-verification-and-handoff.md) |

## 完了条件

- [x] 初回は `Generate` で Variant A/B/C を作成できる。
- [x] preview 中に `Regenerate` を押すと、base snapshot から新しい variant が生成され、既存 worktree 衝突が起きない。
- [x] preview 中に `Refine current` を押すと、表示中の UI を土台に追加修正案が生成される。
- [x] refine 後の `Apply current` は累積変更だけを main worktree に残す。
- [x] refine 後の `Discard` は元の base snapshot に戻す。
- [x] apply/discard 後に `git worktree list` に `.ui-agent/worktrees/<session>` の残骸がない。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` と `pnpm --filter demo-app exec tsc --noEmit` が通る。
- [x] 変更をコミットする。
