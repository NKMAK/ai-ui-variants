# Model Default Config Plan

## 目的

vite.config のプラグインオプション（= ファイル設定 `uiVariants({ model })`）で既定モデルを指定でき、それをデフォルトにする。あわせて、オーバーレイのモデルドロップダウンで「実際に使われる既定モデル」が常に見えるようにする。モデル一覧の情報源を `src/shared/` に一本化し、`GET <API_BASE>/config` 経由で `defaultModel` と `availableModels` を client に渡すことで、client ハードコード（古い一覧）の再発を防ぐ。

> 背景: 直近の `plan/model-dropdown-selector/` でドロップダウン一覧を最新世代（Opus 4.8 / Sonnet 4.6 / Haiku 4.5）へ更新済み。本計画はその続きで、既定モデルの「ファイル設定化」と「UI での可視化」を扱う。

## 確定した設計判断（ユーザー承認済み）

- **優先順位: ファイル設定 > env > 組み込み既定**。`options.model`（vite.config）→ `UI_VARIANTS_CLAUDE_MODEL`（env）→ shared の `DEFAULT_MODEL`。
- **モデル一覧は shared に一本化**し、`GET /config` 経由で client へ。client のハードコード一覧は廃止。
- パネル UI は英語のまま維持（既存方針踏襲）。

## 現状の未コミット変更（実装時に取り込む / 置き換える）

本計画の前段として以下が未コミットで存在する。各フェーズで shared 一本化へ畳み込むこと。

- `client/components/InstructionInput/index.tsx`: ドロップダウン option を最新モデルへ手書き更新済み。→ **フェーズ3で `availableModels` 動的描画に置き換える**。
- `server/generator/claude-code.ts`: `DEFAULT_CLAUDE_MODEL = "claude-haiku-4-5-20251001"` に更新済み。→ **フェーズ1/2で shared の `DEFAULT_MODEL` import に置き換え、ローカル定数を廃止する**。

## 参照ドキュメント

| ドキュメント | 確認観点 |
| --- | --- |
| `.claude/specs/summary.md` → 最新 v2 | 生成 API と overlay 操作フロー |
| `.claude/tech/summary.md` → ai-mock-generator | model override の優先順位 |
| `plan/model-dropdown-selector/summary.md` | 直近のドロップダウン実装 |

## 現状の配線（調査結果）

- `uiVariants(options)` → `createRouter(server, options)`（`src/index.ts:64`）→ `createGenerator(options, repoRoot)`（`router.ts:66,95`）→ `new ClaudeCodeGenerator({ cwd, promptTemplatePath, promptContextPaths })`。
- 既定モデル解決は `claude-code.ts` 内のみ: `resolveClaudeModel()` が `UI_VARIANTS_CLAUDE_MODEL`(env) → ローカル定数。リクエスト `model` が来れば `resolveRequestedModel` で最優先。
- client ドロップダウンは `InstructionInput`。`value=""` が「サーバ既定に委譲」。一覧はコンポーネント内ハードコード。client はサーバの解決後既定モデルを知る手段がない。
- ルータは `API_BASE`(`/__ui_agent`) 以下の path segments で分岐（`router.ts:116-220`）。`API_ENDPOINTS`(`constants.ts`) に `config` は無い。
- `VariantGenerator` interface（`generator/types.ts:31`）は `generate` のみ。Mock は `generation.model: "mock"`。
- client は Shadow DOM に `App` を render（`client/index.tsx:45`）。store は `client/store/overlayStore.ts` の signals。

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細ファイル | 委任 |
| --- | --- | --- | --- | --- |
| 1 | shared モデルカタログ一本化 | 未着手 | `01-shared-model-catalog.md` | 委任可能 |
| 2 | server: options.model 配線 + defaultModel 公開 + GET /config | 未着手 | `02-server-config-and-default.md` | 委任可能 |
| 3 | client: /config 取得 + ドロップダウン動的描画 + 既定可視化 | 未着手 | `03-client-config-and-dropdown.md` | 委任可能（UI 微調整あり） |

依存: 1 → 2 → 3 の順（shared 型を 2/3 が参照）。

## 完了条件

- [ ] vite.config の `uiVariants({ model: "..." })` で既定モデルを指定でき、ドロップダウン未選択時にそれが使われる。
- [ ] env `UI_VARIANTS_CLAUDE_MODEL` は `options.model` 未指定時のみ有効（優先順位どおり）。
- [ ] ドロップダウンの既定 option に解決後の実モデル名が表示される。
- [ ] ドロップダウンのモデル一覧が shared の `AVAILABLE_MODELS` から描画される（client ハードコード廃止）。
- [ ] `GET <API_BASE>/config` が `{ ok, defaultModel, availableModels }` を返す。
- [ ] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` と `pnpm lint` が成功する。
- [ ] 実画面でモデル選択 → 生成まで動作確認（mock generator で可）。
- [ ] 変更をコミットする。

## スコープ外

- AI 生成器の Claude API 化（別タスク）。
- モデルごとの料金・トークン上限の表示。
- セッション中のモデル切替の永続化（localStorage 等）。
