# @preact/signals（overlayの状態管理）

## 役割

overlay全体の状態（インスペクタON/OFF、選択中source、指示テキスト、variant一覧、currentIndex、loading/error）を1か所で持ち、各コンポーネントから購読する。

## なぜ採用したか

- overlayはネストしたコンポーネント（Panel → VariantViewer → VariantNav …）にまたがって同じ状態を読む。propバケツリレーを避けたい。
- signalsは **Preact公式**で、参照しているコンポーネントだけを再描画する（粒度が細かく速い）。
- Context + useReducerより記述が短く、MVPの規模に合う。

## このプロジェクトでの使い方

`client/store/overlayStore.ts`（概念）:

```ts
import { signal, computed } from "@preact/signals"
import type { Session, Variant, SourceLocation } from "../../shared/types"

export const inspecting = signal(false)
export const selected   = signal<SourceLocation | null>(null)
export const instruction = signal("")
export const variants   = signal<Variant[]>([])
export const currentIndex = signal(0)
export const status     = signal<"idle" | "generating" | "previewing" | "error">("idle")

export const currentVariant = computed(() => variants.value[currentIndex.value] ?? null)
```

- コンポーネントは `variants.value` / `currentVariant.value` を読むだけ。更新は hooks（`useVariants` 等）が signal に代入する。
- 「前へ/次へ」は `currentIndex.value++ / --` し、`useVariants` がそれを見て preview APIを呼ぶ。

## 注意点

- 状態の**書き込みは hooks 層に寄せる**（コンポーネントから直接signalを書き換えない方が追いやすい）。
- サーバ側の真実（applied/discarded等のSessionステータス）と signal がズレないよう、API応答で signal を上書きする。

## 関連

- [preact.md](preact.md)
- [folder-structure.md](folder-structure.md) — hooks / store の分離
