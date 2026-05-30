# Phase 3: 動作確認とコミット

## 目的

Phase 1 / 2 の変更が両バグを解消することを実画面で確認し、変更をコミットする。

## 対象範囲

### 今回やること

- 型チェック（プラグイン / demo-app）。
- demo-app dev server を起動し、両バグの再現シナリオで動作確認する。
- 1〜2 件にまとめてコミットする。

### 今回やらないこと

- 自動テスト追加（CLAUDE.md の TODO に記載あり。本フェーズ外）。
- 既存スナップショットや他のシナリオの広範な regression テスト。

## 変更対象ファイル

- なし（Phase 1 / 2 の修正をコミットするのみ）。

## 実装ステップ

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行し通ることを確認。
2. `pnpm --filter demo-app exec tsc --noEmit` を実行し通ることを確認。
3. demo-app dev server を起動：`pnpm --filter demo-app dev`。
4. **bug 1 検証**：
   - ブラウザで dev server を開き、Inspector を有効化。
   - Hero セクションの `<p className="hero-sub">`（`Each variant is a real code change, ...` の段落）をクリック。`SourceLocation` が `src/components/Hero.tsx:12:...` を指していることを確認。
   - 指示欄に「文字を小さくしてオレンジ色にして」と入力して generate。
   - 3 案とも `hero-sub` 段落のみが変更されており、h1（`Click any UI element. ...`）が無傷であることを Next/Previous で全案確認。
5. **bug 2 検証**：
   - variant が previewing の状態のまま、別の UI 要素（例: CTA ボタン `See the demo`）をクリック。
   - エラーバナーに `Another session is already active.` が出ないこと、Hero 側のファイルが base に戻っていること、Panel が新しい source の情報に切り替わっていることを確認。
   - 新しい source で generate → preview → Next/Previous → Discard が全部動くことを確認。
   - 念のため Discard 後にさらに別要素を選んで start できることも確認。
6. **bug 2 race 検証**：
   - dev server を開き直すか Discard 済みの状態に戻す。
   - 1つ目の UI 要素をクリックした直後、session 表示が安定する前に別の UI 要素を素早くクリックする。
   - `Another session is already active.` が出ないこと、最終的に後からクリックした source の session が開始されることを確認。
7. dev server を停止。
8. 変更内容を `git status` / `git diff` で確認し、Phase 1（プロンプト）と Phase 2（useSession）を**まとめて 1 コミット**にする。理由：両方とも「クリック → 指示 → 確認」ループの再現性を担保する同一トピックの修正であり、CLAUDE.md のコミット粒度基準では「複数箇所にまたがる共通変更」に該当する。
9. コミットメッセージは日本語で 1〜2 文。例: `選択行外への波及とsource切替時のセッション競合を修正`。

## 完了条件

- [x] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` 成功。
- [x] `pnpm --filter demo-app exec tsc --noEmit` 成功。
- [ ] bug 1 検証（hero-sub のみ変更）が再現できる。未実施: `Hero.tsx` に既存未コミット変更があり、clean 制約により Hero の session start ができないため。
- [x] bug 2 検証（source 切替で 409 が出ない、Discard/Next/Previous が動く）が再現できる。`Masthead.tsx` の clean な要素で確認。
- [x] bug 2 race 検証（start 完了前の素早い source 切替でも 409 が出ない）が再現できる。`Masthead.tsx` の連続クリックで確認。
- [x] 変更をコミットする。

## 実施結果

- 型チェック:
  - `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`
  - `pnpm --filter demo-app exec tsc --noEmit`
- 実画面確認:
  - dev server: `http://localhost:5174/`
  - `Masthead.tsx` の要素切替で `Another session is already active.` が出ないことを確認。
  - start 直後の連続クリックで最終クリック側の session が開始されることを確認。
  - Generate 後に Next / Previous / Discard が動くことを確認。
  - Discard 後の console error がないことを確認。

## 検証方法

上の実装ステップ 1〜6 がそのまま検証手順。
