# AI Patch Generator

## 役割

instruction + code context を受け取り、**Variant A/B/Cの「変更後コード」**を返すモジュール。
MVPの初期段階では固定patchを返すmockから始め、現在は `mock` と `claude-code` を plugin option で切り替える。

## なぜmockから始めるか

- 仕様の「Codexに実装してほしい最初のMVP」が、まず「patchを切り替えて現在画面にHMR previewする」体験の成立を求めている。
- AIの当たり外れに依存せず、**preview切替・apply・discardのコア体験**を先に固められる。
- generatorをinterface化しておけば、mock→本番の差し替えがlocalで完結する。

## 重要: AIはdiffを書かない

- unified diffは行番号・context行のズレでLLMが最も間違える（仕様の設計判断5）。
- AIは**変更後コード**（全文 or 検索置換ブロック）を返す。**patch化（`git diff`）はサーバ側**が決定論的に行う（[git-worktree.md](git-worktree.md)）。

## Claude Code generator

本番寄りの generator は `src/server/generator/claude-code.ts`。ローカルの Claude Code CLI を headless 実行し、Claude には tools を渡さず、search/replace JSON だけを返させる。

- 実行コマンド: `claude -p <prompt> --output-format json --allowedTools "" --model <model>`
- 既定 model: `claude-haiku-4-5`
- model override: generation request の `model` が最優先。未指定時は `UI_VARIANTS_CLAUDE_MODEL`、さらに未指定なら既定 model。
- usage metadata: Claude Code の JSON wrapper に token usage が含まれる場合、server が抽出して session に保存し、overlay に表示する。
- prompt assembly: `src/server/generator/prompt.ts`
- package default prompt: `src/server/generator/default-prompt.md`
- host app prompt override: plugin option `promptTemplatePath`
- host app context追加: plugin option `promptContextPaths`

demo app では次のファイルを Claude Code generator に渡す。

- `.ui-variants/claude-code-prompt.md`
- `.ui-variants/project-context.md`

UI変更案は text / label / props / className / size など、同一ファイル・構造を壊さない範囲に限定する。import追加・hooks構造変更・別ファイル波及は Fast Refresh の状態維持を壊しやすいため禁止寄りに扱う。

## interfaceと型

`server/generator/types.ts`（仕様の `VariantOutput` / `FileChange` を踏襲）:

```ts
type FileChange = {
  file: string
  fullContent?: string                       // (a) 変更後の全文
  edits?: { search: string; replace: string }[] // (b) 検索置換
}

type VariantOutput = {
  id: string
  title: string
  description: string
  changes: FileChange[]
}

interface VariantGenerator {
  generate(input: {
    instruction: string
    selectedSource: SourceLocation
    codeRange: { file: string; startLine: number; endLine: number; content: string }
    callerSource?: SourceLocation
    count: number
  }): Promise<VariantOutput[]>
}
```

- `mock.ts`: 固定のA/B/C（文言変更 / className追加 など）を返す。
- `claude-code.ts`: Claude Code headless でA/B/Cを生成する。既定 model は `claude-haiku-4-5`。
- 将来候補 `claude.ts`: Claude APIで同interfaceを実装。

## patch検証（generatorの後段・server責務）

変更後コード → worktree反映 → `git diff` → 次を機械チェック（NGはそのvariantをfailed）:

- **禁止ファイルdenylist**（`constants.ts`）: package.json / lockfile / .env* / auth / billing / migration / infra / CI
- **対象ファイル数** ≤ 2〜3
- **diff行数** ≤ 100行程度

AIの自己申告に頼らず、生成patchの `touchedFiles` で弾く（仕様）。

## 関連

- [git-worktree.md](git-worktree.md)
- [typescript.md](typescript.md) — 共有型
- 仕様: ../specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md
