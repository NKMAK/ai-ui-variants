# Draggable English Panel Plan

## 目的

UI Variant Preview の操作パネルをヘッダーのドラッグで任意位置へ動かせるようにし、パネル内の表示文言を英語に統一しつつ、操作に不要な session id や空の variant 表示を削除する。

## 参照ドキュメント

| ドキュメント                                                  | 確認観点                                    |
| ------------------------------------------------------------- | ------------------------------------------- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | Overlay UI の役割、Variant 表示・操作フロー |
| `.claude/tech/preact.md`                                      | Overlay が Preact で独立実装されること      |
| `.claude/tech/preact-signals.md`                              | Overlay の共有状態管理方針                  |
| `.claude/tech/shadow-dom.md`                                  | Shadow DOM 内でスタイルを完結させること     |

## フェーズ一覧

| #   | フェーズ名       | 状態 | 詳細ファイル名 |
| --- | ---------------- | ---- | -------------- |
| 1   | Panel UX cleanup | 完了 | `summary.md`   |

## 設計方針

- パネル位置は `Panel` コンポーネント内のローカル state で持ち、選択 source や session のドメイン状態には混ぜない。
- ドラッグ開始はパネルヘッダーのポインター操作に限定し、ボタン操作はドラッグ開始扱いにしない。
- 画面外へ完全に出ないよう、ドラッグ中と viewport resize 時に座標を viewport 内へ clamp する。
- session id は UI 上に出さず、session 開始中やエラーだけを必要に応じて表示する。
- variant 未生成時の専用枠は表示せず、指示入力と action だけを残す。

## 完了条件

- [x] パネルをドラッグで移動できる。
- [x] パネル内の日本語表示が英語になっている。
- [x] session id と `No variants yet` 相当の空表示がパネルから消えている。
- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が成功する。
- [x] `pnpm --filter demo-app exec tsc --noEmit` が成功する。
- [x] 変更範囲の `git diff --check` が成功する。
- [x] 変更をコミットする。

## 検証メモ

- Playwright MCP で demo app を開き、Inspector を有効化してパネル表示を確認。
- パネルヘッダーをドラッグし、画面上の別位置へ移動できることを確認。
- 全体の `git diff --check` は既存の `examples/demo-app/src/components/Footer.tsx` 末尾空白で失敗するため、今回の変更範囲に限定して確認。
