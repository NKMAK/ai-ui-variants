# Auto data-ui-source Injection

## 目的

JSX の intrinsic element に dev 時だけ `data-ui-source` を自動注入し、demo / host app のソースから手書き `data-ui-source` をなくす。

## 現在地

- 仕様 v2 では `data-ui-source` は React/JSX のビルド時・開発時に自動付与し、手動では付けないと定義されている。
- 技術メモでは MVP demo の手書きは暫定扱いで、本番は Vite/Babel/SWC plugin による自動注入が正とされている。
- 現実の `uiVariants()` は `configureServer` と `transformIndexHtml` のみで、`.tsx` / `.jsx` への source 属性注入はまだ実装されていない。
- `examples/demo-app/src/components/*` には説明用に `data-ui-source` が手書きされている。

## 参照ドキュメント

| ドキュメント | 確認観点 |
| --- | --- |
| `.claude/specs/2026-05-27-v2-ui-variant-preview-agent-mvp.md` | source location は自動付与、クリック対象は intrinsic element の定義位置を主にする |
| `.claude/tech/data-ui-source.md` | app root 相対パス、dev 時のみ注入、行番号ズレの扱い |
| `.claude/tech/vite.md` | `uiVariants()` に Vite plugin 機能を集約し、`apply: "serve"` で dev 時のみ動かす |
| `.claude/tech/folder-structure.md` | `data-ui-source` は app root 相対、server で repo 相対へ変換する |
| `packages/vite-plugin-ui-variants/src/index.ts` | 既存 plugin entry。transform 追加先 |
| `packages/vite-plugin-ui-variants/src/client/hooks/useInspector.ts` | overlay が `[data-ui-source]` を読む既存契約 |
| `packages/vite-plugin-ui-variants/src/server/session.ts` | `SourceLocation.file` を app root 相対として扱う既存契約 |

## 設計方針

- `uiVariants()` に Vite `transform` hook を追加し、React plugin より前に `.tsx` / `.jsx` の JSX AST を書き換える。
- 対象は小文字の JSX intrinsic element のみとする。例: `div`, `button`, `span`, `article`, `h1`, `li`。
- 大文字の custom component は対象外にする。例: `Hero`, `Button`, `Masthead`。
- 既に `data-ui-source` を持つ要素には二重注入しない。
- 属性値は `src/components/Foo.tsx:line:column` の app root 相対にする。
- transform 対象は **host app root 配下のソースだけ** に限定する。plugin 自身の overlay TSX や monorepo 内の別 package は、`/@fs` 経由で読み込まれても注入しない。
- 属性値は絶対パス・`..`・OS依存 separator を含まない POSIX の app root 相対 path にする。
- server 側でも `SourceLocation.file` が app root 外へ出ないことを検証し、誤注入や forged request で任意ファイルを開かない。
- `apply: "serve"` を維持し、本番ビルドに `data-ui-source` を残さない。
- まずは Babel parser/traverse/generator で実装する。SWC への置き換えや sourcemap 精度改善は後続候補に回す。

## スコープ外

- custom component の caller source 自動推定。
- `data-ui-source` と同時に `callerSource` を DOM へ埋め込むこと。
- React 以外の Vue / Svelte 対応。
- 本番 build への source 属性注入。
- variant 生成の失敗率改善。これは別計画で扱う。

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細ファイル |
| --- | --- | --- | --- |
| 1 | Babel transform 基盤 | 未着手 | [01-babel-transform.md](01-babel-transform.md) |
| 2 | demo 手書き属性の撤去 | 未着手 | [02-remove-manual-attributes.md](02-remove-manual-attributes.md) |
| 3 | 検証とドキュメント同期 | 未着手 | [03-verification-and-docs.md](03-verification-and-docs.md) |

## 完了条件

- [ ] host app の `.tsx` / `.jsx` intrinsic element に dev 時だけ `data-ui-source` が自動注入される。
- [ ] `examples/demo-app/src/components/*` から手書き `data-ui-source` が削除されている。
- [ ] mock generator / prompt / demo context が手書き `data-ui-source` を search 対象にしていない。
- [ ] overlay ON 時に、手書きなしの Hero / Workflow / Features / Playground などをクリックして source location が表示される。
- [ ] session start が自動注入された app root 相対 path を受け取り、既存の server path 変換で対象ファイルを開ける。
- [ ] app root 外を指す source location は server 側で拒否される。
- [ ] 本番 build 相当の transform には注入されない方針が守られている。
- [ ] `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` が通る。
- [ ] `pnpm --filter demo-app exec tsc --noEmit` が通る。
- [ ] `pnpm lint` が通る。
- [ ] 変更をコミットする。

## 後続候補

- custom component の caller source を context として AI に渡す。
- 自動注入後の行番号ズレを検証し、apply 後の HMR 再注入確認を Playwright で固定する。
- `data-ui-source` が多すぎる場合の overlay 側クリック粒度調整。
