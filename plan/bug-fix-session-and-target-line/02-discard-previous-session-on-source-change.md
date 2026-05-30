# Phase 2: source 切り替え時の前セッション discard（bug 2）

## 目的

`selectedSource` が別の要素に切り替わった瞬間に、サーバ側で活きている前セッションを `postDiscard` で解放してから新しい `postStart` を投げる。これにより `Another session is already active.` で詰む状態を消す。

重要: `postStart` 完了前に別要素へ切り替わるケースも同じバグを起こす。クライアントはまだ session id を持っていないが、サーバ側では古い session が作成済みになりうるため、キャンセル済み start の成功レスポンスから得た session id も必ず discard する。

## 対象範囲

### 今回やること

- `useSession` フックを書き換え、source 切替時に「前セッションがあれば discard → 新 source で start」の順で実行する。
- start/discard の session lifecycle を `useRef` に保持した Promise chain で直列化し、前の start が完了する前に次の start が走らないようにする。
- source 切替時に variant state（`variants` / `currentIndex` / `busy`）もリセットする。
- `postStart` の `ConflictError`（409）受領時のフォールバック（エラー表示のみで UI を壊さない）を明確化する。

### 今回やらないこと

- サーバ側 `/session/start` の force replace 化。サーバの単一セッション排他制約（仕様 v2 不変条件）は触らない。
- preview 中のファイル状態のロールバックは `discardSession` 既存ロジックに任せる（snapshot 復元はサーバ側で実施済み）。
- `useVariants` の `discard()` ロジック自体の変更（panel の閉じるボタンから呼ばれる経路には影響させない）。

## 変更対象ファイル

- `packages/vite-plugin-ui-variants/src/client/hooks/useSession.ts`（既存・書き換え）

## 実装ステップ

1. [useSession.ts](packages/vite-plugin-ui-variants/src/client/hooks/useSession.ts) の import に以下を追加する：
   - `useRef` を `preact/hooks` から
   - `postDiscard` を `../api/client.ts` から
   - `resetVariantState` を `../store/overlayStore.ts` から
2. `useSession()` の先頭で lifecycle 管理用 ref を用意する：
   - `activeSessionIdRef = useRef<string | null>(null)`：サーバ側で現在 active とみなす session id。
   - `transitionRef = useRef<Promise<void>>(Promise.resolve())`：start/discard 遷移を直列化する Promise chain。
3. `useEffect` 内では毎回 UI state を先にリセットする：
   - `sessionId.value = null`
   - `sessionError.value = null`
   - `resetVariantState()`
   - `let cancelled = false`
4. effect ごとの遷移を `transitionRef.current` の後ろに積む：
   1. 直前の遷移完了を待つ。
   2. `activeSessionIdRef.current` があれば `await postDiscard(...).catch(() => undefined)` し、成功/失敗にかかわらず ref を `null` にする。
   3. `source === null` または `cancelled === true` ならここで終了する。
   4. `postStart(source)` を呼ぶ。
   5. `postStart` が成功したら：
      - `cancelled === true` の場合は、返ってきた `response.session.id` を `await postDiscard(...).catch(() => undefined)` して stale session を残さず終了する。
      - `cancelled === false` の場合だけ `activeSessionIdRef.current` と `sessionId.value` に `response.session.id` を入れ、`sessionError.value = null` にする。
   6. `postStart` が `ok: false` の場合は、`cancelled === false` の時だけ `sessionError.value = response.error` を設定する。
   7. fetch 例外も同様に、`cancelled === false` の時だけ従来の error message を設定する。
5. `transitionRef.current` には、例外で chain が切れないよう `transition.catch(() => undefined)` を代入する。
6. cleanup 関数では `cancelled = true` のみ（discard は直列化された遷移本体が責任を持つ）。
7. import 整理：未使用 import を残さない。

## 補足設計判断

- 「source 切替時に前セッションを discard」する責任は `useSession` 側に置く。`useInspector` 側で `selectedSource.value = source;` した瞬間に発火する責務分離（useInspector は DOM クリック → source 設定、useSession は source 変化 → サーバ同期）。
- `postDiscard` は fire-and-forget にしない。source を閉じるだけのパスでも、直後に別 source が選ばれる可能性があるため、同じ Promise chain の中で順番に処理する。
- `discard` 失敗時もユーザーに見せるエラーは出さない。理由：別 source へ移った時点でユーザーの意図は新セッション開始であり、前セッションの後始末失敗はノイズになるため。サーバ側でセッションが残っていれば、次の `postStart` で 409 が出てユーザーに通知される。
- キャンセル済み `postStart` が成功レスポンスを返した場合、その session は UI に反映しないがサーバ側には active として残る。ここを discard しないと次の start が 409 になるため、成功レスポンスから得た id を必ず discard する。

## 完了条件

- [x] `useSession.ts` で `selectedSource` が変わった時、前の active session があれば `postDiscard` を await してから `postStart` を投げる実装になっている。
- [x] start/discard 遷移が Promise chain で直列化され、前の `postStart` 完了前に次の `postStart` が走らない。
- [x] キャンセル済み `postStart` が成功した場合、その stale session id を `postDiscard` してから終了する。
- [x] `selectedSource === null`（panel close）パスでも前セッションを同じ chain 上で discard する。
- [x] source 切替時に `resetVariantState()` が呼ばれている。
- [x] cleanup 関数は `cancelled = true` のみで、新たな副作用を持たない。

## 実施結果

- `useRef` で `activeSessionIdRef` と `transitionRef` を持ち、discard/start を Promise chain で直列化した。
- キャンセル済み `postStart` が成功した場合は、返ってきた session id を UI に反映せず `postDiscard` するようにした。
- `useVariants.discard()` など別経路ですでに session が解放された後は、`useSession` が同じ session を二重 discard しないようにした。

## 検証方法

- `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` でビルド通過確認。
- 実動作確認は Phase 3。
