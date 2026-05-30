# Phase 1: styling surface guardrail の明文化

## 目的

Claude Code generator が未定義 className や未知 props/token を発明せず、現在の文脈で効くと確認できる styling hook だけを使うよう prompt/context を強化する。

## 対象範囲

### 今回やること

- package default prompt と demo app prompt に、ライブラリ非依存の styling surface ルールを追加する。
- `.ui-variants/project-context.md` に demo-app の現時点の styling surface を明記する。
- `hero-bordered` のような未定義 className が safe variant ではないことを prompt 上で明確にする。

### 今回やらないこと

- Tailwind 固有ルールを default prompt に直書きする。
- UI library 固有の prop 名を default prompt に列挙する。
- 生成後 patch を AST 解析して未知 className を機械検出する。

## 変更対象ファイル

- `packages/vite-plugin-ui-variants/src/server/generator/default-prompt.md`
- `.ui-variants/claude-code-prompt.md`
- `.ui-variants/project-context.md`

## 実装ステップ

1. `packages/vite-plugin-ui-variants/src/server/generator/default-prompt.md` の Rules に `styling hook` の定義を追加する。
2. 同じ Rules に「既知の styling hook だけ変更できる」ルールを追加する。
3. 同じ Rules に「未知 className / prop name / prop value / token / variant を追加しない」ルールを追加する。
4. 同じ Rules に「要求が未知の styling surface を必要とする場合は fewer variants を返す」ルールを追加する。
5. `.ui-variants/claude-code-prompt.md` に同じルールを同期する。
6. `.ui-variants/project-context.md` に、demo-app は当面 `App.css` の既存 class と、Phase 2 以降に導入する Tailwind utility を styling surface として扱う方針を書く。
7. `.ui-variants/project-context.md` に、Tailwind 導入前は新規 className を作っても CSS が存在しないため禁止、と明記する。
8. `git diff -- packages/vite-plugin-ui-variants/src/server/generator/default-prompt.md .ui-variants/claude-code-prompt.md .ui-variants/project-context.md` で差分を確認する。

## 完了条件

- [x] default prompt が Tailwind など特定技術に依存しない表現になっている。
- [x] demo prompt が default prompt と同じ guardrail を持っている。
- [x] `.ui-variants/project-context.md` が demo-app の styling surface を説明している。
- [x] `hero-bordered` と同種の未定義 className 追加が prompt 上で禁止されている。

## 検証方法

- `git diff` で prompt/context の文言だけが変わっていることを確認する。
- demo-app dev server で「外枠を囲って」のような指示を出し、未知 className だけを足す variant が出ないことを確認する。
