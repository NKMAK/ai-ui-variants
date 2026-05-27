# Phase 3 / サブタスク 2: Inspector（hover/click）+ source 表示 + start

## 目的

inspector ON 中の hover 強調（HighlightBox）とクリック捕捉を実装し、`data-ui-source` から source location を取得・表示し、session start を呼ぶ。

## 前提（subagent 向け・必読）

- Phase 3 / #1 完了済み: Shadow DOM 内に overlay が描画され、`overlayStore.ts`（`enabled`/`selectedSource`/`hoveredRect`/`sessionId`）、`api/client.ts`（`postStart`）、`InspectorToggle` がある。
- 読む: `.claude/tech/data-ui-source.md`（属性形式 `file:line:col`・`closest("[data-ui-source]")`）、`.claude/tech/shadow-dom.md`（HighlightBox はビューポート基準の `position:fixed`）、仕様「source location の取得」。
- 不変条件: クリック対象は intrinsic 要素の定義位置を主とする。

## 対象範囲

- 今回やること: `useInspector` / `Inspector`(HighlightBox) / `SourceLocation` / `useSession` / App 組み込み
- 今回やらないこと: 指示入力・variant 生成・適用/破棄（Phase 4）

## 変更対象ファイル

| パス | 区分 | 役割 |
| --- | --- | --- |
| `src/client/hooks/useInspector.ts` | 新規 | hover/click → `data-ui-source` 取得 |
| `src/client/components/Inspector/` | 新規 | hover 強調 + HighlightBox |
| `src/client/components/SourceLocation/` | 新規 | `file:line:col` 表示 |
| `src/client/hooks/useSession.ts` | 新規 | session start / 状態 |
| `src/client/App.tsx` | 変更 | useInspector + Inspector + SourceLocation を組み込む |

## 実装ステップ

1. `hooks/useInspector.ts`: `enabled` が true の間だけ document に mousemove/click リスナを張る。`event.target.closest("[data-ui-source]")` で要素を引き、hover 中は `getBoundingClientRect()` を `hoveredRect` に流す。click で `data-ui-source`（`file:line:col`）をパースして `selectedSource` にセットし、`preventDefault`/`stopPropagation` でホストのクリックを抑止する。`enabled` が false になったらリスナを外し `hoveredRect` をクリアする。
2. `components/Inspector/`: `hoveredRect` を購読し、`position:fixed` の HighlightBox を描く（Shadow DOM 内なのでホスト CSS 非干渉。座標はビューポート基準）。
3. `components/SourceLocation/`: `selectedSource` を `file:line:col` で表示する。
4. `hooks/useSession.ts`: `selectedSource` 確定時に `postStart` を呼び `sessionId` をセット。clean 違反（409）はエラー文言を表示する状態を持つ。
5. `App.tsx`: `useInspector()` を呼び、`Inspector`（HighlightBox）と `SourceLocation` を描画、`useSession` を結線する。
6. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行。
7. demo-app dev でブラウザ確認し、コミットする（「なぜ」: クリック→source 特定→start を成立）。

## 完了条件

- [ ] hover で対象要素に HighlightBox が重なる
- [ ] クリックで `file:line:col` が取得・表示される
- [ ] クリックで session start が呼ばれ `sessionId` が入る
- [ ] clean 違反（409）がエラー表示される
- [ ] `pnpm tsc --noEmit` が通り、コミット済み

## 検証方法

```bash
pnpm --filter demo-app dev
```

ブラウザで: ON → SaveButton hover で HighlightBox → クリックで `src/components/SaveButton.tsx:2:5` 表示 → Network で `POST /__ui_agent/session/start` 200・`sessionId` → SaveButton をコミットせず変更してクリックで 409 表示。
