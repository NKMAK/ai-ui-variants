# Phase 1: プロンプトの選択行制約強化（bug 1）

## 目的

`selectedLine` の上下 2 行以内のみを編集対象とする強制ルールをプロンプトに明文化し、曖昧な指示でも選択行から外れた要素（h1 など）が変更されないようにする。

## 対象範囲

### 今回やること

- `default-prompt.md` のルールを強化する。
- `.ui-variants/claude-code-prompt.md`（demo-app 側のカスタムプロンプト）を同じ内容に揃える。

### 今回やらないこと

- code range の幅（現状 ±25 行）の変更。範囲を狭めるとプロンプトの「context として周辺を見せる」役割が損なわれるため、プロンプト側のルールで縛る。
- selectedLine のフォーマット変更（`codeRangeJson` に既に入っている）。
- mock generator や Claude Code generator のコード変更。

## 変更対象ファイル

- `packages/vite-plugin-ui-variants/src/server/generator/default-prompt.md`（既存・更新）
- `.ui-variants/claude-code-prompt.md`（既存・更新）

## 実装ステップ

1. `packages/vite-plugin-ui-variants/src/server/generator/default-prompt.md` の Rules セクションで、既存の以下行を置換する：
   - `- Prefer the selected line, or the nearest editable text/props/className immediately around it.`
   - 置換後（強制ルール化）:
     ```
     - The change MUST target the `selectedLine` in the code range. If the `selectedLine` itself has no editable text/props/className, expand outward by at most 2 lines (selectedLine ± 2). Lines outside this window MUST NOT be modified.
     - Even when the user instruction is ambiguous (e.g. "make the text smaller and orange"), interpret it as applying to the `selectedLine` only. Never apply it to headings, paragraphs, or props located further away in the code range.
     ```
   - 直後に元からある `- Keep changes small and safe for Fast Refresh.` 以降は変更しない。
2. `.ui-variants/claude-code-prompt.md` についても、Rules セクションを `default-prompt.md` と完全に同期する。具体的には：
   - 既存の `- Use search/replace edits only. Do not output diffs.` の後ろに、step 1 で追加した 2 行のルールを挿入する（カスタム側には現在 selected-line 関連ルールが一切無いので新規追加扱い）。
   - ファイル内の他のルール順序・文言はそのまま保つ。
3. 両ファイルの末尾セクション（`Selected source:` / `User instruction:` / `Code range:`）は変更しない。`codeRangeJson` に `selectedLine` が含まれていることはコミット `1ed1cc2` で確認済み。

## 完了条件

- [x] `default-prompt.md` の Rules に「selectedLine ± 2 行以内のみ編集可能」「曖昧な指示でも選択行を対象にする」の 2 行が追加されている。
- [x] `.ui-variants/claude-code-prompt.md` に同じ 2 行が追加されている。
- [x] Rules セクションの他の行が壊れていない（diff で目視確認）。

## 実施結果

- `default-prompt.md` と `.ui-variants/claude-code-prompt.md` に、`selectedLine +/- 2` の強制ルールと曖昧な指示でも選択行だけに適用するルールを追加した。
- 既存の search/replace、Fast Refresh、同一ファイル制約のルールは維持した。

## 検証方法

- `git diff -- packages/vite-plugin-ui-variants/src/server/generator/default-prompt.md .ui-variants/claude-code-prompt.md` で意図通りの差分のみであることを確認。
- 実際の動作確認は Phase 3 でまとめて行う（プロンプトだけでは動作テストできないため）。
