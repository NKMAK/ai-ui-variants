# フェーズ2: server（options.model 配線 + defaultModel 公開 + GET /config）

## 目的

vite.config の `uiVariants({ model })` を既定モデルとして配線し（優先順位: options.model > env > DEFAULT_MODEL）、解決後の既定モデルと一覧を返す `GET <API_BASE>/config` を追加する。

## 対象範囲

- やること: `UiVariantsOptions.model` 追加、generator への配線、`VariantGenerator.defaultModel` 公開、`/config` エンドポイント、`ConfigResponse` 型、`API_ENDPOINTS.config`。
- やらないこと: client 側の取得・描画（フェーズ3）。

## 変更対象ファイル

- `packages/vite-plugin-ui-variants/src/shared/types.ts`
- `packages/vite-plugin-ui-variants/src/constants.ts`
- `packages/vite-plugin-ui-variants/src/server/generator/types.ts`
- `packages/vite-plugin-ui-variants/src/server/generator/claude-code.ts`
- `packages/vite-plugin-ui-variants/src/server/generator/mock.ts`
- `packages/vite-plugin-ui-variants/src/server/router.ts`

## 実装ステップ

1. `shared/types.ts` の `UiVariantsOptions` に `model?: string;` を追加する（`appRoot` などと並べる）。
2. `shared/types.ts` に `ConfigResponse` 型を追加する（`ModelOption` を `./models.ts` から import）:
   ```ts
   import type { ModelOption } from "./models.ts";

   export type ConfigResponse = {
     ok: true;
     defaultModel: string;
     availableModels: ModelOption[];
   };
   ```
3. `constants.ts` の `API_ENDPOINTS` に `config: \`${API_BASE}/config\`,` を追加する。
4. `generator/types.ts` の `VariantGenerator` interface に `readonly defaultModel: string;` を追加する。
5. `generator/mock.ts` の `MockGenerator` に `readonly defaultModel = "mock";` を追加する（クラスフィールド）。
6. `generator/claude-code.ts` を更新する:
   - `ClaudeCodeGeneratorOptions` に `model?: string;` を追加する。
   - `resolveClaudeModel()` を `resolveClaudeModel(optionModel?: string)` に変更し、`optionModel?.trim() || process.env[CLAUDE_MODEL_ENV]?.trim() || DEFAULT_MODEL` の優先順位で返す（空文字は無効扱い）。
   - private `#model` を **public `readonly defaultModel: string`** に置き換え（interface 充足）、constructor で `this.defaultModel = resolveClaudeModel(options.model);` を設定する。`generate` 内の `resolveRequestedModel(input.model, this.#model)` は `this.defaultModel` 参照に変更する。`#runClaude` の `this.#model` 参照も同様に置換する。
7. `router.ts` の `createGenerator` で `new ClaudeCodeGenerator({ ... , model: options.model })` を渡す。
8. `router.ts` の `handleRequest` に `GET /config` 分岐を追加する（他分岐と同じ形式）:
   ```ts
   if (method === "GET" && matches(segments, ["config"])) {
     sendJson<ConfigResponse>(res, 200, {
       ok: true,
       defaultModel: generator.defaultModel,
       availableModels: AVAILABLE_MODELS,
     });
     return;
   }
   ```
   - `ConfigResponse` と `AVAILABLE_MODELS` を import する（`AVAILABLE_MODELS` は `../shared/models.ts`）。
   - `generator` は既に `handleRequest` 引数にあるためそのまま使う。配置は他の GET 分岐付近で良い。

## 完了条件

- [ ] `uiVariants({ model: "claude-opus-4-8" })` 指定時、`ClaudeCodeGenerator.defaultModel` が `claude-opus-4-8` になる。
- [ ] `options.model` 未指定 + env 設定時は env 値、両方未指定なら `DEFAULT_MODEL` になる。
- [ ] `GET <API_BASE>/config` が `{ ok, defaultModel, availableModels }` を返す。
- [ ] `VariantGenerator` 実装（Claude/Mock）が `defaultModel` を持つ。
- [ ] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が成功する。

## 検証方法

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`。
2. demo-app を `uiVariants({ generator: "claude-code", model: "claude-opus-4-8" })` で起動し、`curl http://localhost:<port>/__ui_agent/config` が `defaultModel: "claude-opus-4-8"` を返すこと（env 未設定時）。
