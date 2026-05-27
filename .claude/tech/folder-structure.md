# フォルダ構成

monorepo全体のディレクトリ構成と、それぞれの役割。

```text
ai-ui-variants/                          # git root = monorepo root = patchの基準点
  package.json                           # workspace root (private)
  pnpm-workspace.yaml                    # packages/* と examples/* を登録
  tsconfig.base.json                     # 共通TS設定（各パッケージがextends）
  .gitignore                             # .ui-agent/ を除外

  .claude/
    specs/                               # 仕様メモ（v1/v2・レビュー）
    tech/                                # ← この技術ドキュメント

  .ui-agent/                             # セッション作業領域（gitignore・実行時生成）
    sessions/session-xxx/
      session.json                       # Sessionの状態
      base/...                           # base snapshot（対象ファイルの原本）
      patches/variant-a.patch ...        # server が git diff で生成したpatch
    worktrees/session-xxx/
      variant-a/  variant-b/  variant-c/ # AIの変更後コードを書き込む作業worktree

  packages/
    vite-plugin-ui-variants/             # ツール本体（3コンポーネントを内包）
      package.json
      src/
        index.ts                         # plugin entry: configureServer + transformIndexHtml
        constants.ts                     # APIパス(/__ui_agent/*) / denylist
        shared/
          types.ts                       # Session/Variant/SourceLocation/VariantOutput（server/client共有）

        server/                          # ② Local Agent Server（middleware）
          router.ts                      # __ui_agent/* のルーティング
          session.ts                     # 単一セッション排他 + lock（逐次化）
          snapshot.ts                    # base snapshot 保存/復元
          worktree.ts                    # git worktree作成 + git diff でpatch化
          patch.ts                       # patch適用 / 検証（denylist・ファイル数・行数）
          paths.ts                       # アプリ相対 ⇔ repo相対 のパス変換
          generator/
            types.ts                     # AI generator interface
            mock.ts                      # 固定 Variant A/B/C を返すmock

        client/                          # ① Browser Overlay（Preact, Shadow DOMに注入）
          index.tsx                      # entry: Shadow DOM生成 → render(<App/>)
          App.tsx                        # overlay全体を束ねるルート
          components/                    # コンポーネント=フォルダ（co-locate styles + index）
            InspectorToggle/             # ON/OFFフローティングボタン
            Inspector/                   # hover強調 + クリック捕捉（HighlightBox含む）
            Panel/                       # パネル外枠 + PanelHeader
            SourceLocation/              # file:line:col 表示
            InstructionInput/            # 指示textarea + 生成ボタン
            VariantViewer/               # "Variant 2/3" + 説明 + VariantNav（前へ/次へ）
            PanelActions/                # この案を適用 / 破棄
            ui/                          # 汎用プリミティブ（Button / Spinner）
          hooks/
            useInspector.ts              # hover/click → data-ui-source取得
            useSession.ts                # session start / 取得
            useVariants.ts               # generate / preview / 前へ次へ / apply / discard
          store/
            overlayStore.ts              # overlay状態を @preact/signals で集中管理
          api/
            client.ts                    # /__ui_agent/* fetch wrapper
          styles/
            theme.css                    # 色・余白トークン（Shadow root全体ベース）

  examples/
    demo-app/                            # ③ デモ用 Vite + React アプリ
      vite.config.ts                     # uiVariants() を登録
      index.html
      src/
        main.tsx
        components/SaveButton.tsx        # data-ui-source 手書き（デモ専用）
      package.json
```

## レイヤーの責務

| レイヤー | 場所 | 責務 |
|---|---|---|
| shared | `src/shared/` | server/client双方が使う型・定数 |
| server | `src/server/` | session・snapshot・worktree・patch・AI呼び出し（Node側） |
| client | `src/client/` | overlay UIとユーザー操作（ブラウザ側、Preact） |
| plugin entry | `src/index.ts` | 上記をViteに接続（middleware登録 + overlay注入） |

## パス基準の約束（monorepo固有）

- **git操作はすべて git root（=monorepo root）基準**。`git -C <repoRoot> ...` で実行。
- `data-ui-source` は **アプリルート相対**（例 `src/components/SaveButton.tsx`）。
- server の `paths.ts` が **アプリ相対 → repo相対**（例 `examples/demo-app/src/components/SaveButton.tsx`）へ変換し、patchがmain worktreeに素直に当たるようにする。
- `.ui-agent/` は git root直下に置き gitignore する。

詳細は [git-worktree.md](git-worktree.md) を参照。
