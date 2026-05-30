# フェーズ1: shared モデルカタログ一本化

## 目的

モデル一覧と組み込み既定モデルを `src/shared/` に集約し、server/client がそこだけを参照するようにする。

## 対象範囲

- やること: shared にモデルカタログ（型・一覧・既定値）を新設し、`claude-code.ts` の既定値をそれに置き換える。
- やらないこと: `GET /config` 追加（フェーズ2）、client 描画変更（フェーズ3）。

## 変更対象ファイル

- 新規: `packages/vite-plugin-ui-variants/src/shared/models.ts`
- 変更: `packages/vite-plugin-ui-variants/src/server/generator/claude-code.ts`

## 実装ステップ

1. `src/shared/models.ts` を新規作成し、以下を export する:
   ```ts
   export type ModelOption = {
     id: string;
     label: string;
     description: string;
   };

   export const AVAILABLE_MODELS: ModelOption[] = [
     { id: "claude-opus-4-8", label: "Opus 4.8", description: "most capable" },
     { id: "claude-sonnet-4-6", label: "Sonnet 4.6", description: "balanced" },
     {
       id: "claude-haiku-4-5-20251001",
       label: "Haiku 4.5",
       description: "fast / low-cost",
     },
   ];

   // ファイル設定・env いずれも無いときの組み込み既定。
   export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
   ```
2. `claude-code.ts` 冒頭で `import { DEFAULT_MODEL } from "../../shared/models.ts";` を追加する。
3. `claude-code.ts` のローカル定数 `const DEFAULT_CLAUDE_MODEL = "claude-haiku-4-5-20251001";`（前段の未コミット変更で更新済み）を削除する。
4. `resolveClaudeModel()` 内の `DEFAULT_CLAUDE_MODEL` 参照を `DEFAULT_MODEL` に置き換える（※フェーズ2で `options.model` を引数に追加するため、ここでは既存シグネチャのまま定数置換だけ行う）。

## 完了条件

- [ ] `src/shared/models.ts` が存在し `ModelOption` / `AVAILABLE_MODELS` / `DEFAULT_MODEL` を export する。
- [ ] `claude-code.ts` がローカル既定定数を持たず `DEFAULT_MODEL` を参照する。
- [ ] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が成功する。

## 検証方法

```
pnpm --filter vite-plugin-ui-variants exec tsc --noEmit
```
で型エラーが無いこと。`grep -n "DEFAULT_CLAUDE_MODEL" packages/vite-plugin-ui-variants/src` がヒット0件であること。
