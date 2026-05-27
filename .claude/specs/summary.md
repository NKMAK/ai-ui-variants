# specs サマリー

このフォルダにある仕様書ファイルの概要とパス一覧。

| ファイル | 概要 |
|---|---|
| [2026-05-27-v2-ui-variant-preview-agent-mvp.md](2026-05-27-v2-ui-variant-preview-agent-mvp.md) | **【最新】v2**。v1に[批判的レビュー](discussions/2026-05-27-mvp仕様-批判的レビュー.md)の結論を反映。確定3判断＝①完全寄り制約を整合性のため採用 ②AI出力をunified diff→「変更後コード」に変えpatch化はサーバ側で ③variantを同一ファイル・構造を壊さない変更に限定（Fast Refresh維持）。加えて単一セッション排他・エディタ衝突回避・source曖昧性の決め打ち・連打ロック・禁止ファイル機械チェックを明記。冒頭に目次あり。 |
| [2026-05-27-v1-ui-variant-preview-agent-mvp.md](2026-05-27-v1-ui-variant-preview-agent-mvp.md) | UI Variant Preview Agent MVP 仕様メモ（初版）。UIをクリック→source location特定→該当コードだけAIに渡し、Variant A/B/Cのdiffを生成。main worktreeに一時patch適用してHMRプレビューし、前へ/次へで切り替えて選んだ案だけ本ブランチに残す、という体験を定義。git worktreeの役割、base snapshotによるrollback、API案、ガードレール、実装ステップを含む。（v2に置き換え済み） |

## サブフォルダ

- [discussions/](discussions/) — 上記仕様に対する検討・議論・レビューの記録。概要は [discussions/summary.md](discussions/summary.md)。

---

最終更新: 2026-05-27
