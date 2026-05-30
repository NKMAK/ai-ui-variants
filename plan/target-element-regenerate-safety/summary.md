# Target Element Regenerate Safety

## 目的

クリックした JSX 要素の外側へ variant が広がることを機械的に防ぎ、2回目の修正で前回案を残したまま追加される誤操作を減らす。

## 参照ドキュメント

| ドキュメント                                                  | 確認観点                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | 同一ファイル・構造を壊さない変更、base snapshot 中心の preview/apply/discard                      |
| `.claude/tech/data-ui-source.md`                              | JSX intrinsic element に `data-ui-source` を注入し、UI クリックから source line/column を得る前提 |
| `.claude/tech/ai-mock-generator.md`                           | AI は search/replace を返し、server が patch 化・機械チェックする前提                             |
| `plan/regenerate-refine-variants/summary.md`                  | `replace` と `refine` の意味、現在の UI 操作分岐                                                  |

## 設計方針

- session 開始時に `data-ui-source` の line/column から対象 JSX element の行範囲を抽出し、`CodeRange` に保持する。
- generator prompt には code window とは別に target element range を渡し、変更対象をその範囲へ限定する。
- server 側で生成 patch の変更行を検査し、target element range 外を触る variant は `failed` にする。
- 既存 variant がある状態では、主ボタンを base から作り直す操作にし、現在案へ追加する操作は副ボタンにする。
- デモの `Playground.tsx` の textarea に inline style を持たせ、style を variant で差し替えるクリック対象にする（意図はコメントで明記する）。

## スコープ外

- AST-aware rewrite や自動修復。
- 複数要素をまたぐ意図的なデザイン変更。
- refine 機能そのものの削除。

## フェーズ一覧

| #   | フェーズ名                                   | 状態   | 詳細ファイル名 |
| --- | -------------------------------------------- | ------ | -------------- |
| 1   | Target range guard and safer regeneration UI | 完了   | summary.md     |

## 完了条件

- [x] `CodeRange` が target element の開始/終了行を持つ。
- [x] 生成 patch が target element range 外を触った場合に `failed` になる。
- [x] target range 検査はファイル別にスコープし、target file 以外の hunk を誤って範囲判定しない。
- [x] target element が見つからずフォールバックした場合に warn を出して可視化する。
- [x] 既存 variant 後の主操作が base からの作り直しになり、実行中の操作ボタンにスピナーが出る。
- [x] `Playground.tsx` の textarea に意図を明記した inline style クリック対象がある。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を通す。
- [x] `pnpm --filter demo-app exec tsc --noEmit` を通す。
- [x] `git diff --check` を通す。
- [x] 変更をコミットする。
