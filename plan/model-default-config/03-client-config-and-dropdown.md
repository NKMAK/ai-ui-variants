# フェーズ3: client（/config 取得 + ドロップダウン動的描画 + 既定可視化）

## 目的

オーバーレイ初期化時に `GET /config` を取得し、モデルドロップダウンを `availableModels` から動的描画する。既定 option に解決後の実モデル名を表示し、未選択でもどのモデルが使われるかが見えるようにする。

## 対象範囲

- やること: config 取得 API、store signal 追加、初期化時 fetch、`InstructionInput` の動的描画 + 既定可視化。
- やらないこと: server 側（フェーズ2 で完了済み）。

## 変更対象ファイル

- `packages/vite-plugin-ui-variants/src/client/api/client.ts`
- `packages/vite-plugin-ui-variants/src/client/store/overlayStore.ts`
- `packages/vite-plugin-ui-variants/src/client/App.tsx`
- `packages/vite-plugin-ui-variants/src/client/components/InstructionInput/index.tsx`

## 実装ステップ

1. `api/client.ts` に config 取得関数を追加する:
   ```ts
   import { API_BASE, API_ENDPOINTS } from "../../constants.ts";
   // ...既存 import に ConfigResponse を追加（../../shared/types.ts）

   export async function getConfig(): Promise<ApiResponse<ConfigResponse>> {
     const response = await fetch(API_ENDPOINTS.config);
     return (await response.json()) as ApiResponse<ConfigResponse>;
   }
   ```
   （`API_ENDPOINTS` は既に import 済み。`API_BASE` 追加は不要なら省く。）
2. `store/overlayStore.ts` に signal を追加する:
   ```ts
   import type { ModelOption } from "../../shared/models.ts";
   export const defaultModel = signal<string | null>(null);
   export const availableModels = signal<ModelOption[]>([]);
   ```
3. `App.tsx` のマウント時に一度だけ config を取得し signal を更新する（`preact/hooks` の `useEffect`、依存配列 `[]`）。`ok` のときのみ `defaultModel.value` / `availableModels.value` を設定する。App が関数コンポーネントであることを確認し、既存の import 形式に合わせる。
4. `InstructionInput/index.tsx` のドロップダウンを動的描画に置き換える（前段の未コミットのハードコード option を削除）:
   - `import { availableModels, defaultModel } from "../../store/overlayStore.ts";` を追加。
   - 既定 option:
     ```tsx
     <option value="">
       {defaultModel.value === null
         ? "Default"
         : `Default (${defaultModel.value})`}
     </option>
     ```
   - 一覧:
     ```tsx
     {availableModels.value.map((m) => (
       <option key={m.id} value={m.id}>
         {`${m.id} (${m.description})`}
       </option>
     ))}
     ```
   - `value={model}` / `onChange` の既存ロジックは維持する。

## 完了条件

- [ ] オーバーレイ表示時に `/config` が取得され、ドロップダウンが `availableModels` から描画される。
- [ ] 既定 option に解決後の実モデル名（例 `Default (claude-haiku-4-5)`）が表示される。
- [ ] モデルを選んで Generate でき、`model` がリクエストに乗る（既存 `selectedModel` 経路）。
- [ ] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` と `pnpm lint` が成功する。

## 検証方法

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` と `pnpm lint`。
2. `pnpm --filter demo-app dev` 起動 → 要素クリック → パネルの Model ドロップダウンに既定モデル名と一覧が出ることを確認。
3. モデルを切り替えて Generate し、変更案が生成されること（mock generator でも可。mock の場合 `Default (mock)` 表示で問題なし）。
