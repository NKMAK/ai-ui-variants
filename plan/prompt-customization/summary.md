# Prompt customization and Claude model option

## 目的

Claude Code generator の prompt をユーザーが Markdown として調整できるようにし、Claude Code に渡す model を環境変数で指定できるようにする。

## 参照ドキュメント

| ドキュメント | 確認観点 |
| --- | --- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | AI は diff を書かず、server 側で patch 化する不変条件 |
| `.claude/tech/ai-mock-generator.md` | generator interface と search/replace 出力の境界 |
| `plan/ui-variant-preview-mvp/05-claude-code-generator.md` | Claude Code headless generator の既存設計 |

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細ファイル |
| --- | --- | --- | --- |
| 1 | prompt 外部化と model 指定 | 完了 | `summary.md` |

## 設計方針

- 既定 prompt は package 内の Markdown ファイルに切り出す。
- host app 側から `promptTemplatePath` と `promptContextPaths` を渡せるようにし、Tailwind や design rule の Markdown を prompt に追加できるようにする。
- `promptContextPaths` は repo root 相対または絶対パスを受け付ける。
- Claude model は `UI_VARIANTS_CLAUDE_MODEL` を優先し、未指定なら `claude-sonnet-4-6` を渡す。
- `--allowedTools ""` は維持し、Claude Code に tools を渡さない。

## 完了条件

- [x] `prompt.ts` の固定本文が Markdown テンプレートに切り出されている
- [x] `promptTemplatePath` / `promptContextPaths` で外部 Markdown を読み込める
- [x] `UI_VARIANTS_CLAUDE_MODEL` で Claude Code の `--model` を変更できる
- [x] 未指定時に `claude-sonnet-4-6` が使われる
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が通る
- [x] `pnpm --filter demo-app exec tsc --noEmit` が通る
- [x] 変更をコミットする
