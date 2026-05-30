# Model Dropdown Selector Plan

## 目的

UI Variant Preview の `Model` 入力を free text から dropdown に変更し、既定選択は `UI_VARIANTS_CLAUDE_MODEL` 相当の server default に任せる。

## 参照ドキュメント

| ドキュメント                                                  | 確認観点                         |
| ------------------------------------------------------------- | -------------------------------- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | 生成 API と overlay 操作フロー   |
| `.claude/tech/ai-mock-generator.md`                           | model override の優先順位        |
| `plan/generation-usage-and-model/summary.md`                  | 直近の model/usage metadata 実装 |

## フェーズ一覧

| #   | フェーズ名                 | 状態 | 詳細ファイル |
| --- | -------------------------- | ---- | ------------ |
| 1   | Dropdown UI implementation | 完了 | `summary.md` |

## 設計方針

- dropdown の default option は空文字にし、server 側で `UI_VARIANTS_CLAUDE_MODEL` -> 既定 model へ解決する既存挙動を維持する。
- option は Claude Code CLI に渡す model 名としてそのまま使える値にする。
- free text 入力をやめ、パネルの UI は英語のまま維持する。
- `examples/demo-app/src/components/Footer.tsx` の既存未コミット変更は触らない。

## 完了条件

- [x] `Model` が dropdown になる。
- [x] default option は server default / `UI_VARIANTS_CLAUDE_MODEL` に任せる挙動になる。
- [x] 選択 model が generate / regenerate / refine に渡る。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が成功する。
- [x] `pnpm --filter demo-app exec tsc --noEmit` が成功する。
- [x] 変更をコミットする。
