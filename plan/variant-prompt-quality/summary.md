# Variant プロンプト品質改善

## ゴール

1指示 → 生成される3案 **すべてが採用に値する完成度** で、かつ **デザインの方向性が異なる** こと。
「最小変更／忠実だから簡素」のような退屈な案を排除し、曖昧な指示はその幅を多様性として使う。具体的な指示なら AI が独自軸の提案を 1 つ足す。

## 状態

| フェーズ                                      | 状態                                            |
| --------------------------------------------- | ----------------------------------------------- |
| 現状調査・原因仮説                            | 完了（[findings.md](findings.md) §1〜3）        |
| プロンプト書き換えドラフト                    | 完了・適用済み（[findings.md](findings.md) §4） |
| `.ui-variants/claude-code-prompt.md` 書き換え | 完了                                            |
| `default-prompt.md` 整合化                    | 完了                                            |
| Playwright 検証ハーネス                       | 完了                                            |
| before / after 実機比較                       | after 実機採取は完了・before 比較は未実施       |
| commit                                        | **未着手**                                      |

## 重要な前提

- demo-app は `.ui-variants/claude-code-prompt.md` を使う。`packages/.../default-prompt.md` を編集しても demo-app には**影響しない**
- 直近コミット `f80acf3`（default-prompt.md への Variant strategy 追加）は demo-app の精度に**影響していない**。「精度が落ちた」事象との因果は技術的に成立しない可能性が高い
- ただし「既存プロンプトに 3 案分岐の指示が一切ない」のは事実で、これが品質問題の根本原因と推定

## 次の一手

[findings.md §6](findings.md) の順で再開。
