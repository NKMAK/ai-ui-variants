# Code style tooling

## 目的

Prettier と ESLint を導入し、TypeScript/React/Preact コードの型チェックとは別に、format と lint を機械的に確認できる状態にする。

## 参照ドキュメント

| ドキュメント                 | 確認観点                                          |
| ---------------------------- | ------------------------------------------------- |
| `AGENTS.md`                  | `as any` 禁止、既存パターン優先、必要範囲のみ変更 |
| `.claude/tech/typescript.md` | TypeScript と shared/server/client の分離方針     |
| `README.md`                  | 開発コマンドの記載更新                            |

## フェーズ一覧

| #   | フェーズ名             | 状態 | 詳細ファイル |
| --- | ---------------------- | ---- | ------------ |
| 1   | Prettier + ESLint 導入 | 完了 | `summary.md` |

## 設計方針

- Prettier は format のみを担当する。
- ESLint は TypeScript/React hooks/React refresh の静的チェックを担当し、format とは競合させない。
- root scripts に `format` / `format:check` / `lint` / `typecheck` を分けて置く。
- 既存コードは Prettier で一括整形する。

## 完了条件

- [x] Prettier 設定が追加されている
- [x] ESLint flat config が追加されている
- [x] root scripts で format/lint/typecheck を実行できる
- [x] `pnpm format:check` が通る
- [x] `pnpm lint` が通る
- [x] `pnpm typecheck` が通る
- [x] 変更をコミットする
