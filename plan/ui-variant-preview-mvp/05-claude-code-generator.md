# Phase 5: 本番 generator（Claude Code headless）

## 目的

mock を Claude Code headless（`claude -p`）の本番 generator に差し替え、実際の指示から Variant A/B/C（search/replace）を生成して patch 化・検証・preview まで通す。Anthropic API キー直叩きはせず、ローカルの Claude Code 認証を流用する。

## 対象範囲

### 今回やること

- `server/generator/claude-code.ts`（`VariantGenerator` 実装、`claude -p --output-format json` を子プロセス実行）
- generator のプロンプト構築（codeRange + 制約 + 出力スキーマ）と JSON パース
- plugin option `generator: "mock" | "claude-code"` による切替（既定は `mock`）
- `claude` CLI 未検出・タイムアウト・パース失敗時のフォールバック

### 今回やらないこと

- Claude Agent SDK 版・Claude API 直叩き版（後続候補）
- generate のストリーミング表示（完了待ちでよい）
- mock の削除（テスト・オフライン用に残す）

## 前提

- 実行環境の PATH に `claude` CLI が存在し、ログイン済み（`claude -p "ping"` が応答する）。
- 生成は **ツールなし**（`--allowedTools ""`）で行い、Claude にファイル探索・書換をさせない。AI は変更後コード（search/replace）を JSON で返すだけで、patch 化は既存の worktree フロー（Phase 2）が担う。

## 変更対象ファイル

| パス | 区分 | 役割 |
| --- | --- | --- |
| `src/server/generator/claude-code.ts` | 新規 | Claude Code headless generator |
| `src/server/generator/prompt.ts` | 新規 | 生成プロンプト + 出力スキーマ文字列の組み立て |
| `src/index.ts` | 変更 | `generator` option を受け取り mock/claude-code を選択 |
| `src/shared/types.ts` | 変更 | `UiVariantsOptions.generator?: "mock" \| "claude-code"` を追加 |
| `packages/vite-plugin-ui-variants/package.json` | 変更（任意） | engines / README にローカル `claude` CLI 前提を明記 |

## 実装ステップ

1. `shared/types.ts` の `UiVariantsOptions` に `generator?: "mock" | "claude-code"`（既定 `"mock"`）を追加する。
2. `server/generator/prompt.ts`: `buildPrompt(input)` を実装する。`instruction`・`codeRange.content`・`selectedSource`・制約（同一ファイル・構造を壊さない／import追加やhooks変更を禁止／3案／search 文字列は codeRange 内に一意に存在する原文）を含め、**出力は JSON 配列のみ**（`VariantOutput[]` 相当: `id,title,description,changes:[{file,edits:[{search,replace}]}]`）と明示する。余計な前置き・コードフェンスを出さないよう指示する。
3. `server/generator/claude-code.ts`: `VariantGenerator` を実装する。
   - `node:child_process` の `execFile`（Promise 化）で `claude -p <prompt> --output-format json --allowedTools ""` を実行する。`cwd` は repoRoot、`maxBuffer` を十分に確保、タイムアウト（例 60s）を設定する。
   - `--output-format json` の外側ラッパ（Claude Code の result オブジェクト）から最終テキスト（`result` フィールド）を取り出す。
   - 最終テキストを `VariantOutput[]` として `JSON.parse` する。前後の非 JSON やコードフェンスが混入した場合に備え、最初の `[` 〜 対応する `]` を抽出してからパースする小さなサニタイズを入れる。
   - パース結果を検証する（配列であること、各要素に `changes[].edits` があること、`count` 件に満たなければ得られた分だけ返す）。
4. 各 variant の `changes[].file` が `selectedSource.file`（とせいぜい caller）に限定されているかを軽くチェックし、外れるものは除外する（patch 検証 = Phase 2 の `patch.ts` でも denylist/数/行数を機械チェックするので二重防御）。
5. CLI 未検出（ENOENT）・タイムアウト・JSON パース失敗時は、エラーを記録し `generate-variants` のレスポンスでその旨を返す（MVP では mock へのフォールバックはせず、明示エラー表示にとどめる。フォールバック要否は検証後に判断）。
6. `src/index.ts` で `options.generator` を見て `MockGenerator` か `ClaudeCodeGenerator` を注入する。既定は `mock`。
7. `pnpm tsc --noEmit` を実行する。
8. demo-app の `vite.config.ts` を一時的に `uiVariants({ generator: "claude-code" })` にして dev を起動し、実生成を検証する（下記）。検証後、既定（mock）に戻すか option を明示するかを決める。
9. 1 コミットする（「なぜ」: 本番 generator をローカル Claude Code 流用で実装し、実指示から variant 生成を成立）。

## 完了条件

- [x] `generator: "claude-code"` で SaveButton に「目立たせて」と指示すると、実際に 3 案（search/replace）が返る
- [x] 返った変更が worktree に反映され `git diff` で patch 化され、Phase 2 の検証（denylist/数/行数）を通る
- [x] preview で画面が切り替わり、前へ/次へが機能する
- [x] `claude` CLI 未検出・タイムアウト・パース失敗が握りつぶされず、エラーとして表示される
- [x] 生成時に Claude がファイルを書換しない（`--allowedTools ""`、対象ファイルの `git status` が generate 単体では変化しない）
- [x] `generator` 既定が `mock` のままで、mock 経路も従来どおり動く
- [x] `pnpm tsc --noEmit` が通る
- [x] 変更がコミットされている

## 検証方法

```bash
# 前提確認
claude -p "say ok" --output-format json   # 応答すること

# demo-app/vite.config.ts を uiVariants({ generator: "claude-code" }) にして
pnpm --filter demo-app dev
```

ブラウザで:

1. overlay ON → SaveButton クリック → 指示「このボタンを目立たせて」→「生成」
2. Variant 1/3〜3/3 が title/description 付きで表示されることを確認
3. 前へ/次へで実際に見た目が変わることを確認
4. generate 直後に `git status` を見て、対象ファイルが generate 単体では変化していない（patch 適用は preview 時のみ）ことを確認
5. `claude` を PATH から外した状態で生成 → エラー表示されること（握りつぶさない）を確認

## この計画の位置づけ

Phase 4 までで mock による end-to-end 体験が完成している。本フェーズは `VariantGenerator` interface の実装を差し替えるだけで、session/snapshot/worktree/patch/preview のフロー（Phase 2）と overlay（Phase 3・4）には手を入れない。これにより「ローカルの Claude が実際に複数案を作る」状態へ到達する。
