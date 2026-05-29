# ai-ui-variants

UI をクリックしてソース位置を特定し、AI が作った複数の UI 変更案を実画面で preview しながら選ぶための Vite plugin 実験プロジェクトです。

中心の体験は、クリックした UI に対して `Variant A / B / C` を生成し、「前へ / 次へ」で見比べ、良い案だけを作業ツリーへ残すことです。

## Packages

| Path                                | Role                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `packages/vite-plugin-ui-variants/` | Vite plugin 本体。overlay 注入、local server、variant 生成、patch preview を担当 |
| `examples/demo-app/`                | 動作確認用の React + Vite demo app                                               |
| `.ui-variants/`                     | Claude Code generator 用の prompt/context 設定                                   |

## Setup

```bash
pnpm install
```

## Demo

`examples/demo-app` は、このプロダクト自体を紹介する英語の product landing page を兼ねた editable demo です。役割は次の2つに分かれます:

- **Local editable demo**: `pnpm --filter demo-app dev` で起動し、overlay を ON にすると Hero / CTA / workflow card / feature card / Playground の form CTA など、`data-ui-source` 付きの主要要素をクリックして variant 生成・preview できます。
- **Public landing page (GitHub Pages)**: `pnpm --filter demo-app build:pages` または `.github/workflows/demo-pages.yml` 経由で static build され、GitHub Pages 配下 `/ai-ui-variants/` で公開されます。公開版は LP 表示のみで、local agent overlay は動きません。

```bash
# local editable demo（overlay 操作可能）
pnpm --filter demo-app dev

# GitHub Pages 用 static build（base path = /ai-ui-variants/）
pnpm --filter demo-app build:pages
pnpm --filter demo-app preview
```

## Generator

`uiVariants()` の既定 generator は `mock` です。Claude Code を使う場合は demo app の Vite config のように明示します。

```ts
uiVariants({
  generator: "claude-code",
  promptTemplatePath: ".ui-variants/claude-code-prompt.md",
  promptContextPaths: [".ui-variants/project-context.md"],
});
```

Claude Code generator は `claude -p <prompt> --output-format json --allowedTools "" --model <model>` を local Node process から実行します。Claude に tools は渡さず、AI は search/replace JSON だけを返します。patch 化と preview/apply/discard は server 側が担当します。

## Prompt Customization

Claude Code に渡す prompt は `.ui-variants/claude-code-prompt.md` で編集できます。`{{userInstruction}}` や `{{codeRangeJson}}` などの placeholder は server 側で埋め込まれます。

Tailwind や design rule などの追加ドキュメントを渡したい場合は、Markdown ファイルを作り、`promptContextPaths` に追加します。現在の例は `.ui-variants/project-context.md` です。

## Model

Claude Code の model は環境変数で指定できます。

```bash
UI_VARIANTS_CLAUDE_MODEL=opus pnpm --filter demo-app dev
```

未指定の場合は `claude-haiku-4-5` を使います。

## Checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
```
