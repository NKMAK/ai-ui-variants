# AI Patch Generator（mockから開始）

## 役割

instruction + code context を受け取り、**Variant A/B/Cの「変更後コード」**を返すモジュール。
MVPでは固定patchを返すmockにし、後でClaude APIに差し替える。

## なぜmockから始めるか

- 仕様の「Codexに実装してほしい最初のMVP」が、まず「patchを切り替えて現在画面にHMR previewする」体験の成立を求めている。
- AIの当たり外れに依存せず、**preview切替・apply・discardのコア体験**を先に固められる。
- generatorをinterface化しておけば、mock→本番の差し替えがlocalで完結する。

## 重要: AIはdiffを書かない

- unified diffは行番号・context行のズレでLLMが最も間違える（仕様の設計判断5）。
- AIは**変更後コード**（全文 or 検索置換ブロック）を返す。**patch化（`git diff`）はサーバ側**が決定論的に行う（[git-worktree.md](git-worktree.md)）。

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
- 将来 `claude.ts`: Claude API（claude-opus等）で同interfaceを実装。

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
