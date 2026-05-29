# UI Variant Preview Agent

Webアプリ上のUIをクリックし、そのソースコード位置を特定して、AIに最小限のコード範囲だけを渡す開発支援ツール。AIは複数の修正案を `Variant A / B / C` として生成し、ユーザーは現在見ている画面上で「前へ / 次へ」で切り替えながら確認し、良い案だけを本来の作業ツリーへ適用する。

> 中心価値: **UIをクリックして、AIが作った複数のコード変更案を実画面で選べる。**

**現状: MVP 実装中**。`packages/vite-plugin-ui-variants/`（shared / server / client / plugin entry）と `examples/demo-app/` の足場まで実装済み。残タスク・引き継ぎは `plan/ui-variant-preview-mvp/` を参照。実装前には必ず仕様（`.claude/specs/`）と技術ドキュメント（`.claude/tech/`）を参照すること。

## 技術スタック

| 領域 | 技術 |
| --- | --- |
| モノレポ | pnpm workspace（`packages/` + `examples/`） |
| 言語 | TypeScript（`tsconfig.base.json` を各パッケージが extends） |
| ツール本体 | Vite plugin（`configureServer` middleware + `transformIndexHtml` で overlay 注入 + HMR トリガー） |
| Overlay UI（注入側） | Preact + `@preact/signals` / Shadow DOM でスタイル隔離 |
| デモアプリ（ホスト側） | React（Fast Refresh で状態維持する preview surface） |
| Variant 生成・隔離 | git worktree + `git diff` で patch 化 |
| AI Patch Generator | 最初は mock、後で Claude API 化 |

3コンポーネント（Browser Overlay / Local Agent Server / AI Patch Generator）と担当技術の対応は `.claude/tech/summary.md` を参照。

## コマンド

| コマンド | 用途 |
| --- | --- |
| `pnpm install` | 依存インストール |
| `pnpm --filter demo-app dev` | デモアプリの Vite dev server 起動（overlay 動作確認） |
| `pnpm --filter demo-app build` | デモアプリのビルド（`tsc --noEmit && vite build`） |
| `pnpm --filter vite-plugin-ui-variants build` | プラグイン本体の型チェック（現状は `tsc --noEmit`） |
| `pnpm lint` | 全パッケージで `tsc --noEmit`（root scripts の `lint`） |

## ディレクトリ構造

詳細とパス基準の約束は `.claude/tech/folder-structure.md` を正とする。要点のみ：

| パス | 役割 |
| --- | --- |
| `packages/vite-plugin-ui-variants/` | ツール本体（3コンポーネントを内包する Vite plugin） |
| `packages/vite-plugin-ui-variants/src/shared/` | server/client 共有の型・定数（`types.ts`） |
| `packages/vite-plugin-ui-variants/src/server/` | Local Agent Server（session・snapshot・worktree・patch・generator。Node 側） |
| `packages/vite-plugin-ui-variants/src/client/` | Browser Overlay（Preact、Shadow DOM に注入。ブラウザ側） |
| `packages/vite-plugin-ui-variants/src/index.ts` | plugin entry（middleware 登録 + overlay 注入） |
| `examples/demo-app/` | デモ用 Vite + React アプリ（preview surface） |
| `.ui-agent/` | セッション作業領域（実行時生成・**gitignore**。sessions/ と worktrees/） |
| `.claude/specs/` | 仕様書（何を作るか・どう動くべきか） |
| `.claude/tech/` | 技術選定ドキュメント |
| `.claude/skills/` | プロジェクト用 Skill |

### パス基準（monorepo 固有・重要）

- git 操作はすべて **git root（= monorepo root）基準**（`git -C <repoRoot> ...`）。
- `data-ui-source` は **アプリルート相対**（例 `src/components/SaveButton.tsx`）。server の `paths.ts` が **アプリ相対 → repo相対** に変換し、patch が main worktree に素直に当たるようにする。
- `.ui-agent/` は git root 直下に置き gitignore する。

## ドキュメント参照方法

詳細仕様・技術判断が必要になったら以下の手順で参照する：

1. **仕様**（何を作るか）が必要 → `.claude/specs/summary.md` を読んで該当ファイルを特定する。最新版は **v2**（`2026-05-27-v2-ui-variant-preview-agent-mvp.md`）。冒頭の「v1からの変更点」だけで差分が分かる。
2. **技術**（どう実装するか）が必要 → `.claude/tech/summary.md` を読んで該当ファイルを特定する。
3. 検討経緯・賛否・レビュー結果が必要 → `.claude/specs/discussions/` を参照する。
4. 必要なドキュメントのみ読み込み、コンテキストを温存する。

## summary の運用ルール

`.claude/specs/summary.md` と `.claude/tech/summary.md` は、各フォルダのファイル一覧と概要を保つインデックス。

- 仕様・技術ドキュメントを **追加・更新したら必ず該当の summary.md を更新する**。
- 仕様を改訂するときは **新しいバージョンのファイルを作る**（古い版は残す）。summary では最新版を **【最新】** と明示し、旧版には「（vN に置き換え済み）」と注記する。
- 検討中の議論・レビューは `specs/` ではなく `specs/discussions/` に置く。

## 実装計画の保存先

実装計画は `/impl-plan` スキルを使い `plan/[機能名]/` に作成する。フォーマット・必須セクション・粒度の基準は `/impl-plan` を参照。

- 単純なタスクは `summary.md` 1本、複数フェーズは `summary.md` + `01-*.md`, `02-*.md`。
- タスク完了時は `summary.md` のフェーズ一覧の「状態」を「完了」に更新する。
- 完了条件には必ずコミットを含めること（例: `- [ ] 変更をコミットする`）。
- コードを書く前の計画作成は必須ではない。ただし、サブエージェントに任せる・セッションをまたぐ・ユーザーが明示した場合は Markdown で残す。

> **注意: `EnterPlanMode`（スーパーパワーツール）はプロジェクト外（`~/.claude/plans/`）に保存される。このプロジェクトでは `EnterPlanMode` を使わず、`/impl-plan` スキルで `plan/` に保存すること。**

## 行動原則

- 3ステップ以上のタスクは Plan モード（`/impl-plan`）で開始する。
- **設計判断が含まれるタスクは必ず Plan モードで開始する**（ステップ数が少なくても）。
- 動作を証明できるまでタスクを完了とマークしない。
- コードを読まずに書かない。
- 変更は必要な箇所のみ。影響範囲を最小化する。
- コンテキスト圧迫やタスクに関係のないノイズが多ければセッション切り替えを提案する。
- 不明点がある場合は都度、必ず `AskUserQuestion` でユーザーに確認する。

### Plan 必須の判断基準

以下のいずれかに該当する場合は、ステップ数にかかわらず Plan モードで開始する：

| 状況 | 例 |
| --- | --- |
| 「何を作るか」がまだ確定していない | shared 型設計、API パス設計、overlay の画面設計 |
| 設計ミスの手戻りコストが高い | session/snapshot/patch の処理フロー、git worktree 運用 |
| 複数ファイルをまたいで依存関係がある | shared → server → client → plugin entry の積み上げ構造 |
| ユーザーの「はい」が実装承認か設計承認か不明確 | 迷ったら Plan |

## コーディングスタイル

- `as any` を使用しない。
- 過剰なエラーハンドリングは不要（システム境界のみバリデーション）。
- `const` を使う。
- server/client 共有の型・定数は `src/shared/` に集約する（`as any` 回避と整合性のため）。

## このツール固有の不変条件（実装時に必ず守る）

仕様 v2 の確定設計判断。実装でこれを崩さないこと：

- **完全寄り制約**: セッション開始時、対象ファイルに未コミット変更があれば**開始しない**（worktree base = main 現状 = snapshot を一致させ、patch が conflict なく当たることを保証するため）。
- **AI は diff を書かない**: AI には「変更後のコード（全文 or 検索置換ブロック）」を返させ、**patch 化は `git diff` でサーバ側が決定論的に行う**。
- **同一ファイル・構造を壊さない変更に限定**: import 追加・hooks 構造変更・別ファイル波及は Fast Refresh をフルリロードに落とし状態を失わせる。text/label/props/className/size 等に限定する。
- **rollback は `git reset` ではなく base snapshot 中心**（ユーザーの作業を消さない）。
- **単一セッション排他 + lock で逐次化**（連打競合・複数 UI 同時編集を防ぐ）。
- **禁止ファイルは patch から機械チェック**（denylist。AI の自己申告に頼らない）。

## ブランチ・PR 方針

- **作業ブランチ:** `develop` で開発する。
- **PR の向き先:** `main` ブランチへ PR を作成する。
- **PR の粒度:** 機能単位で 1 PR。
- **PR 作成:** `gh` CLI を使う（例: `gh pr create --base main`）。タイトルは日本語可。本文に変更概要とテスト方法を簡潔に記載する。

## コミット方針

- コミットメッセージは日本語でよい。変更の「なぜ」を一言添える。
- Agent にタスクを委譲した場合も、結果を検証してから自分でコミットする。

### コミット粒度の基準

| 変更の種類 | 粒度 |
| --- | --- |
| 新機能・コンポーネント単位の大きな改修 | 1機能 = 1コミット |
| 複数箇所にまたがる共通変更（shared 型・定数・共有ロジック） | まとめて1コミット |
| ドキュメント・設定のみの変更 | まとめて1コミット |
| 小さいバグ修正・テキスト変更 | まとめて1コミット |

1コミットに異なる「なぜ」が必要になったら分割のサイン。

## Skills の活用

開発者は Skills を実験的に試したい意向がある。タスクに有益そうな Skill があれば積極的に作成する。

プロジェクト固有 Skill（`.claude/skills/`）：

| Skill | 用途 |
| --- | --- |
| `/impl-plan` | 実装計画を `plan/[機能名]/` に作成する |
| `subagent-exec` | 作成済みの計画をサブエージェントに順次実行させる（コンテキスト節約） |
| `file-placement` | shared / server / client / components など、新規ファイルの置き場を判断する |

## サブエージェント活用方針

| エージェント | 用途 |
| --- | --- |
| `Explore` | コードベース探索・ファイル検索・調査タスク全般 |
| `Plan` | 実装計画の設計・アーキテクチャ検討 |
| `general-purpose` | 上記に収まらない複数ステップの調査・実装 |

**委任ルール：**

- 調査タスク（ファイル探索・仕様確認・コード理解）は積極的にサブエージェントへ委任し、メインのコンテキストを温存する。
- 実装タスクは詳細な Plan がすでに存在し、サブエージェントが単独で実装できると判断できる場合に委任する（`subagent-exec` 参照）。
- ユーザーとの対話・方針決定はメインで行う。
- タスクの複雑さに応じてモデルを使い分ける。
