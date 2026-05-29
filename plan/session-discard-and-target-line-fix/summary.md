# Session Discard And Target Line Fix

## 目的

Discard 後に次の UI 編集を開始できない問題と、選択した行ではなく code range 内の先頭テキストが修正される問題を直す。

## 参照ドキュメント

| ドキュメント                                                  | 確認観点                                                   |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | 単一セッション排他、discard、選択 source の扱い            |
| `.claude/tech/data-ui-source.md`                              | `data-ui-source` の座標とクリック対象                      |
| `.claude/tech/git-worktree.md`                                | discard/apply 後の worktree cleanup                        |
| `.claude/tech/ai-mock-generator.md`                           | generator は小さな変更案を返し、patch 化は server 側で行う |

## 現在地

- `discardSession` は正常系では `releaseSession()` するが、snapshot 復元や worktree cleanup の途中例外で active session が残りうる。
- `MockGenerator` は `codeRange.content` の先頭から候補を選ぶため、`Hero.tsx:12:9` を選んでも範囲内で先に出る H1 テキストを変更しうる。
- Claude Code generator 向け prompt も選択行の強調が弱く、同じ誤選択を誘発しうる。

## フェーズ一覧

| #   | フェーズ名                  | 状態   | 詳細ファイル |
| --- | --------------------------- | ------ | ------------ |
| 1   | discard 解放保証            | 完了   | summary.md   |
| 2   | 選択行優先の generator 入力 | 完了   | summary.md   |
| 3   | 検証と計画更新              | 完了   | summary.md   |

## 実装方針

- `discardSession` は `finally` で cleanup と `releaseSession()` を実行し、破棄操作後に active session が残らないようにする。
- `CodeRange` に選択行情報を持たせ、mock generator は選択行から外側へ候補探索する。
- prompt の code range JSON に選択行を含め、選択行付近を優先するルールを明記する。

## 完了条件

- [x] discard 後に同じ dev server process で別 source の session start が 409 にならない。
- [x] `src/components/Hero.tsx:12:9` 相当の code range で mock generator が H1 ではなく hero-sub 側を候補にする。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が通る。
- [x] `pnpm --filter demo-app exec tsc --noEmit` が通る。
- [x] 変更をコミットする。
