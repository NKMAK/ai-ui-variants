# Generation Usage And Model Plan

## 目的

UI Variant Preview の生成結果に使用 token 数と使用 model を表示し、パネルから Claude Code model を generation ごとに変更できるようにする。

## 参照ドキュメント

| ドキュメント                                                  | 確認観点                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | 生成 API と session/variant フロー                        |
| `.claude/tech/ai-mock-generator.md`                           | Claude Code generator の model 指定と generator interface |
| `plan/prompt-customization/summary.md`                        | 既存の `UI_VARIANTS_CLAUDE_MODEL` 指定方針                |

## フェーズ一覧

| #   | フェーズ名                       | 状態 | 詳細ファイル |
| --- | -------------------------------- | ---- | ------------ |
| 1   | Usage metadata and model control | 完了 | `summary.md` |

## 設計方針

- `GenerateVariantsRequest.model` は任意入力にし、未指定なら既存の環境変数/既定 model 解決を使う。
- generator の戻り値を `outputs + metadata` に拡張し、mock generator は usage なし・model `mock` として扱う。
- Claude Code の JSON wrapper から `usage` や `total_usage` などの token 情報を保守的に抽出し、取れない場合は UI に token 行を出さない。
- Session に `generation` metadata を保存し、generate/preview 後もパネル上の model/usage 表示が残るようにする。
- Model 入力は free text にして、Claude Code CLI が受け付ける最新 model 名へ追従できるようにする。

## 完了条件

- [x] パネルから model を変更して generate / regenerate / refine に渡せる。
- [x] 使用 model がパネルに表示される。
- [x] Claude Code JSON に token usage が含まれる場合、token 数がパネルに表示される。
- [x] mock generator でも既存の生成フローが壊れない。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が成功する。
- [x] `pnpm --filter demo-app exec tsc --noEmit` が成功する。
- [x] 変更をコミットする。

## 検証メモ

- Playwright MCP で demo app を開き、Inspector 有効化後のパネルに `Model` 入力が表示されることを確認。
- 実 generation は Claude Code CLI と token 消費を伴うため、今回のブラウザ検証では実行していない。
