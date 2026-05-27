# UI Variant Preview Agent MVP 仕様メモ（v2）

> **v2の位置づけ**: [v1](2026-05-27-v1-ui-variant-preview-agent-mvp.md) に対する[批判的レビュー](discussions/2026-05-27-mvp仕様-批判的レビュー.md)の結論を反映した改訂版。基本コンセプトはv1のまま。変更点は次節「v1からの変更点」に集約する。

## 目次

- [v1からの変更点（v2での決定事項）](#v1からの変更点v2での決定事項) ← **まずここだけ読めば差分が分かる**
- [目的](#目的)
- [コアコンセプト](#コアコンセプト)
- [重要な前提](#重要な前提)
- [既存ツールとの差分](#既存ツールとの差分)
- [MVPスコープ](#mvpスコープ)
- [なぜpreview用URLを分けないか](#なぜpreview用urlを分けないか)
- [git worktreeの役割](#git-worktreeの役割)
- [最終アーキテクチャ](#最終アーキテクチャ)
- [UI体験](#ui体験)
- [source locationの取得](#source-locationの取得)
- [AIに渡すcontext](#aiに渡すcontext)
- [Variant生成](#variant生成)
- [Sessionモデル](#sessionモデル)
- [Base Snapshot](#base-snapshot)
- [Variant切り替えの内部処理](#variant切り替えの内部処理)
- [API案](#api案)
- [File/Directory構成案](#filedirectory構成案)
- [制約・ガードレール](#制約ガードレール)
- [対応する修正タイプ](#対応する修正タイプ)
- [実装ステップ](#実装ステップ)
- [重要な設計判断](#重要な設計判断)
- [Codexに実装してほしい最初のMVP](#codexに実装してほしい最初のmvp)
- [まず作るべき最小デモ](#まず作るべき最小デモ)
- [将来フェーズ](#将来フェーズ)
- [現時点の結論](#現時点の結論)

---

## v1からの変更点（v2での決定事項）

レビューの「実装前に決めるべき3点」＋High/Medium論点を反映。

### 確定した3つの設計判断

1. **完全寄り制約を「整合性のため」として採用する**（レビュー論点1・4・5を一括解消）
   - セッション開始時、対象ファイルに未コミット変更があれば**開始しない**。
   - 理由はUX安全だけでなく**整合性の担保**。worktreeはcommit基準で作られるため、対象ファイルがclean（＝commitと一致）であって初めて、worktree由来のpatchがmainに素直に当たる。

2. **AIの出力を unified diff から「変更後のコード（全文 or 検索置換ブロック）」に変える**（論点2）
   - unified diffは行番号・context行のズレでLLMが最も間違えやすい。
   - AIには「変更後のコード」を返させ、**patch化はこちら側で決定論的に行う**（worktreeに書き込み→`git diff`）。

3. **variant生成を「同一ファイル・構造を壊さない」変更に縛る**（論点3）
   - import追加・hooks構造変更・別ファイル波及はFast Refreshをフルリロードに落とし、画面のin-memory state（form入力など）を失わせる。
   - text/label/props/className/size等の**同一ファイル内の見た目変更**に限定し、状態維持を担保する。

### その他の明記事項（High / Medium）

- **単一セッション排他**: main worktreeは1つ。同時に複数UIをいじれない。MVPは1セッションのみ受け付ける。
- **エディタ衝突回避**: セッション中は対象ファイルをエディタで編集しない前提を完全寄り制約に含める。
- **source曖昧性の決め打ち**: クリック対象は「定義位置を主、呼び出し元(caller)はcontextとして添えるだけ」とする。
- **連打競合の防止**: preview切替はセッション単位でロックし、逐次化（処理中は次を受けない／最新のみ反映）する。
- **禁止ファイルは機械チェック**: 変更後コードから生成したpatchの`touchedFiles`をdenylistで機械的に弾く（AIの自己申告に頼らない）。
- **demoのdata-ui-source手書きはデモ専用**: 本番は**ビルド時注入**でソースに残さない。最小デモで手書きしているのは説明用。

---

## 目的

Webアプリ上のUIをクリックし、そのUIが定義されているソースコード位置を特定したうえで、AIに最小限のコード範囲だけを渡す。
AIは複数の修正案を `Variant A / B / C` として生成し、ユーザーは現在見ている画面上で「前へ / 次へ」で案を切り替えながら確認し、良い案だけを本来の作業ツリーへ適用する。

最終的な狙いは、AIにリポジトリ全体を探索させるのではなく、ユーザーがクリックしたUIを起点に、対象コード範囲を絞って安全にUI修正を行うこと。

---

## コアコンセプト

```text
UIをクリック
↓
source locationを特定
↓
該当コード範囲だけAIに渡す
↓
AIが Variant A/B/C の「変更後コード」を生成（→こちらでpatch化）
↓
各patchを現在のmain画面に一時適用してHMR preview
↓
「前へ / 次へ」で切り替える
↓
選んだpatchだけ本ブランチへ適用
```

---

## 重要な前提

このツールは任意のWebサイト向けではなく、自分たちのWebアプリ向けに作る。

前提:

- アプリのソースコードを持っている
- dev環境で使う
- 最初はReact系を想定
- Vite / Next.js などのdev server上で動作する
- 本番環境では使わない
- UI要素とソースコード位置の対応付けはビルド時・開発時のinstrumentationで行う

---

## 既存ツールとの差分

### 既存で近いもの

- `react-dev-inspector` — ReactコンポーネントをクリックしてIDE上の該当ソースへジャンプ。`data-inspector-*` 属性をDOMに注入する思想が近い
- `LocatorJS` — UIからコード位置を開く系
- `click-to-component` — React向けのclick-to-source
- `Stagewise` — ブラウザ上のUI要素を選択し、AI agentに文脈を渡して修正する方向で近い
- `Onlook` — visual editor + AI code edit寄り
- `Frontman` — 実行中アプリの要素をクリックし、自然言語指示から実コード編集へつなぐ方向で近い

### 差別化の方向

単なる `UI → source code jump` では差別化しにくい（`react-dev-inspector` などでほぼ満たされる）。差別化は次に置く:

```text
UIをクリックして、AIが作った複数のコード変更案を実画面で選べる
Click a UI element. Generate code-backed variants. Preview and pick one.
```

---

## MVPスコープ

### やること

- 既存の `localhost:3000` など、ユーザーが今見ているmain画面上でUIをクリック
- source locationを取得
- 該当コード周辺だけAIに渡す
- AIが複数の「変更後コード」を生成 → こちら側で`git diff`してpatch化
- 各variantは `git worktree` 上で生成・保持
- preview時は現在のmain worktreeに一時的にpatchを当てる
- HMR / Fast Refreshで画面上の見た目を切り替える（※同一ファイル内変更に限り状態維持）
- 「前へ / 次へ」でvariantを切り替える（逐次化・ロックあり）
- 「この案を適用」で選んだpatchだけmain worktreeに残す
- 「破棄」でbase状態に戻す

### やらないこと

初期MVPでは以下は不要:

- 関連Storybookの探索 / 関連testの探索
- DOM snapshot / props収集 / computed style収集
- デザイナー承認フロー / PR作成 / 自動マージ
- 複数dev server / 複数iframe preview
- Storybook連携 / visual regression test連携
- **複数セッション同時実行**（v2で明記：MVPは単一セッション排他）

---

## なぜpreview用URLを分けないか

`preview worktree` を別portで立てる案はUX上の問題がある（main画面のログイン状態・route・localStorage・画面状態・入力内容の引き継ぎが面倒）。

したがってMVPでは、**現在ユーザーが見ているmain画面をそのままpreview surfaceにする**。

```text
main worktree
  = UIをクリックする場所
  = 指示を書く場所
  = variant previewする場所
  = 最終的に選んだ案を残す場所
```

---

## git worktreeの役割

`git worktree` はpreview表示用ではなく、AIが複数案を安全に生成・保持するために使う。

```text
my-app/
  main worktree            # localhost:3000 が見ている場所
.ui-agent/worktrees/session-123/
  variant-a/  variant-b/  variant-c/
```

各variant worktreeで、AIが返した**変更後コードを書き込む**。その後、各worktreeで`git diff`してpatchを作る。

```bash
# AIの返した変更後コードを variant-a worktree に書き込んだ後
git -C .ui-agent/worktrees/session-123/variant-a diff > .ui-agent/sessions/session-123/patches/variant-a.patch
git -C .ui-agent/worktrees/session-123/variant-b diff > .ui-agent/sessions/session-123/patches/variant-b.patch
git -C .ui-agent/worktrees/session-123/variant-c diff > .ui-agent/sessions/session-123/patches/variant-c.patch
```

> **整合性の鍵（v2）**: worktreeはmainの**最新commitを基準**に作る。完全寄り制約により対象ファイルはcleanなので、main worktreeの現在内容＝commit内容＝worktreeのbaseとなり、`git diff`で得たpatchがmainに**conflictなく当たる**。

> **補足（worktree要否）**: MVPではビルド・型検証をしないため、worktreeは必須ではなく「変更後コード→`git diff`」を一時ディレクトリで行う簡素化も可。本仕様はvariant分離の明快さを優先してworktreeを採用するが、実装簡素化の選択肢として残す。

preview時だけmain worktreeにpatchを一時適用する。

---

## 最終アーキテクチャ

```text
Browser Overlay / Inspector UI
  - UI選択 / 指示入力 / Variant表示
  - 前へ / 次へ / この案を適用 / 破棄

Dev Server Plugin / Local Agent Server
  - source location取得
  - 対象コード範囲抽出
  - AI用context生成
  - git worktree作成
  - AIにvariant生成を依頼（変更後コードを受け取る）
  - 変更後コードをworktreeに書き込み → git diff でpatch化
  - patch検証（禁止ファイルdenylist・対象ファイル数・diff行数）
  - main worktreeへの一時patch適用（セッションロックで逐次化）
  - snapshot復元 / apply / discard

AI Patch Generator
  - instruction + code contextを受け取る
  - Variant A/B/Cの「変更後コード（全文 or 検索置換ブロック）」を返す
  - ※unified diffは生成しない（patch化はサーバ側の責務）
```

---

## UI体験

### 基本フロー

1. ユーザーは既存の `localhost:3000` を見ている
2. 拡張機能またはoverlayをONにする
3. UI要素をクリック
4. ツールがsource locationを表示
5. ユーザーが修正指示を書く
6. AIが3案を生成
7. 画面右下などにvariant操作パネルを表示
8. `前へ / 次へ` でvariantを切り替える
9. HMRで現在の画面が切り替わる
10. 良い案で `この案を適用`
11. 不要なら `破棄`

### Overlay UI例

```text
┌─────────────────────────────────┐
│ UI Variant Preview              │
│                                 │
│ src/components/Button.tsx:42    │
│                                 │
│ 指示:                            │
│ このボタンをもう少し目立たせて      │
│                                 │
│ Variant 2 / 3                   │
│ size="lg" を追加し、primary化      │
│                                 │
│ [← 前へ] [次へ →]                │
│                                 │
│ [この案を適用] [破棄]             │
└─────────────────────────────────┘
```

---

## source locationの取得

UI要素に `data-*` 属性としてソース位置を埋め込む。

```html
<button data-ui-source="src/components/SaveButton.tsx:42:5">保存</button>
```

```text
file: src/components/SaveButton.tsx / line: 42 / column: 5
```

React/JSXのビルド時・開発時に自動付与する。手動では付けない。

候補:

- `react-dev-inspector` を利用・参考にする
- Babel plugin / SWC plugin / Vite pluginで独自に注入
- intrinsic elementにだけ付与するところから始める

> **クリック対象の決め打ち（v2）**: `data-ui-source` は最終的にDOMを出した**intrinsic要素の定義位置**を指す。「定義を変えたいのか／呼び出し元を変えたいのか」は曖昧だが、MVPでは**定義位置を主**とし、呼び出し元(caller)は判明すればcontextに添えるだけにする。

> **行番号ズレ（v2注記）**: patch適用でファイル内容が変わると `data-ui-source` の行番号が古くなる。1セッション内は問題ないが、apply後に再クリックする前にはHMR経由で属性を再注入させる。

---

## AIに渡すcontext

MVPでは最小限にする。

```yaml
selectedSource:
  file: src/components/SaveButton.tsx
  line: 42
  column: 5

codeRange:
  file: src/components/SaveButton.tsx
  startLine: 30
  endLine: 80
  content: "<該当コード周辺>"

callerSource:        # 判明すればcontextとして添えるだけ（変更対象は定義側が主）
  file: src/features/user/UserForm.tsx
  line: 88
  column: 10
  optional: true

instruction: "このボタンをもう少し目立たせて"

constraints:
  - 変更は対象ファイル中心（同一ファイル内で完結させる）
  - 構造を壊さない（import追加・hooks構造変更・別ファイル波及を避ける＝Fast Refresh維持）
  - 1variantあたりの変更は小さく（最大100行程度）
  - API / DB / auth / package.json / lockfileは触らない
  - 3案出す
  - 出力は「変更後のコード（全文 or 検索置換ブロック）」で返す（unified diffにしない）
```

不要: 関連story / 関連test / DOM snapshot / props / computed style

---

## Variant生成

AIには3つの修正案を、それぞれ**変更後コード**として作らせる。

```text
Variant A: <Button variant="primary"> に変更
Variant B: 文言を「保存する」に変更し、size="lg" を追加
Variant C: classNameに強調用のTailwind classを追加
```

AIの返却（構造化）:

```ts
type VariantOutput = {
  id: string
  title: string
  description: string
  // unified diffではなく、変更後の内容。どちらかの形式を採用:
  //  (a) 変更後のファイル全文（対象ファイルごと）
  //  (b) 検索置換ブロック（search/replace）
  changes: FileChange[]
}

type FileChange = {
  file: string
  // (a)を採るなら fullContent、(b)を採るなら edits を使う
  fullContent?: string
  edits?: { search: string; replace: string }[]
}
```

サーバ側でこの`changes`をworktreeに反映し、`git diff`で**patchを決定論的に生成**する。生成したpatchは`Variant.patchPath`に保存する。

---

## Sessionモデル

```ts
type SourceLocation = {
  file: string
  line: number
  column: number
}

type Variant = {
  id: string
  title: string
  description: string
  patchPath: string   // サーバ側で git diff から生成した patch
  status: "pending" | "ready" | "previewing" | "applied" | "failed"
}

type Session = {
  id: string
  selectedSource: SourceLocation
  instruction: string
  baseSnapshot: Record<string, string>
  variants: Variant[]
  currentIndex: number
  locked: boolean         // v2: preview切替の逐次化用ロック
  createdAt: string
}
```

> **単一セッション排他（v2）**: サーバはアクティブなSessionを同時に1つしか持たない。新規startは既存セッションがapplied/discardedになってから受け付ける。

---

## Base Snapshot

`git reset --hard` はユーザーの未コミット変更を消す危険がある。そのため、セッション開始時に対象ファイルの内容をsnapshotとして保存する。

```ts
type BaseSnapshot = Record<string, string>

const baseSnapshot = {
  "src/components/SaveButton.tsx": originalContent,
  "src/features/user/UserForm.tsx": originalCallerContent
}
```

variant切り替え時は必ず: `base snapshotから対象ファイルを復元 → 選択中variantのpatchを適用`。

> **完全寄り制約との関係（v2）**: 完全寄りにより、ここでsnapshotする対象ファイルはcommitとも一致している。よってsnapshot復元・patch適用・最終applyのいずれも、未コミット変更と混ざらず安全に行える。

---

## Variant切り替えの内部処理

すべての切替・適用は**セッションロック下で逐次実行**する（`locked=true`の間は新規リクエストを拒否、または最新のみ反映）。

### preview（A / 前へ / 次へ 共通）

```text
1. session.locked を確認（処理中なら拒否 or 最新で置換）
2. main worktreeの対象ファイルをbase snapshotへ戻す
3. 対象variantのpatchをmain worktreeへ適用
4. localhost:3000のHMR / Fast Refreshで画面更新
5. currentIndex を更新
```

### この案を適用

```text
1. main worktreeの対象ファイルをbase snapshotへ戻す
2. 選択中variantのpatchをmain worktreeへ適用
3. sessionをappliedとして終了
4. 一時worktreeを削除してよい
```

### 破棄

```text
1. main worktreeの対象ファイルをbase snapshotへ戻す
2. sessionをdiscardedとして終了
3. 一時worktreeを削除
```

---

## API案

```text
POST /__ui_agent/session/start
POST /__ui_agent/session/:id/generate-variants
POST /__ui_agent/session/:id/preview/:variantId
POST /__ui_agent/session/:id/apply/:variantId
POST /__ui_agent/session/:id/discard
GET  /__ui_agent/session/:id
```

### session start

```json
POST /__ui_agent/session/start
{ "file": "src/components/SaveButton.tsx", "line": 42, "column": 5 }
```

内部: 対象ファイルがcleanかチェック（未コミット変更があれば**409等で拒否**）→ base snapshot保存 → アクティブセッションが既にあれば拒否（単一セッション排他）。

### generate variants

```json
POST /__ui_agent/session/:id/generate-variants
{ "instruction": "このボタンをもう少し目立たせて", "count": 3 }
```

内部: AIから変更後コードを受け取る → worktreeに反映 → `git diff`でpatch化 → **patch検証**（禁止ファイルdenylist・対象ファイル数≤2〜3・diff≤100行）→ NGならそのvariantをfailedに。

### preview

```text
POST /__ui_agent/session/:id/preview/variant-b
内部: (lock) restore base snapshot → apply variant-b.patch → trigger HMR
```

### apply

```text
POST /__ui_agent/session/:id/apply/variant-b
内部: restore base snapshot → apply selected patch → mark applied → cleanup worktrees
```

### discard

```text
POST /__ui_agent/session/:id/discard
内部: restore base snapshot → mark discarded → cleanup temporary worktrees
```

---

## File/Directory構成案

```text
my-app/
  src/  package.json  vite.config.ts
  .ui-agent/
    sessions/session-123/
      session.json
      base/src/components/SaveButton.tsx
      patches/variant-a.patch  variant-b.patch  variant-c.patch
    worktrees/session-123/
      variant-a/  variant-b/  variant-c/
```

---

## 制約・ガードレール

MVPでは安全のため制約を強くする。

### 変更対象制限

- 対象ファイルは最大2〜3ファイル
- diffは1variantあたり最大100行程度
- 対象UIに近いファイル中心、**同一ファイル内で完結を優先**
- 変更禁止ファイルを設定し、**patch検証で機械的に弾く**（v2）

禁止例:

```text
package.json / pnpm-lock.yaml / yarn.lock / package-lock.json
.env / .env.* / auth関連 / billing関連
database migration / infra / CI設定
```

### 作業ツリー制限 — 完全寄りで確定（v2）

セッション開始時に対象ファイルが**cleanであることを要求する**。未コミット変更があれば警告して開始しない。

```text
対象ファイルに未コミット変更がある → 開始を拒否
セッション中はその対象ファイルをエディタで編集しない（外部変更衝突を避ける）
```

> v1にあった「柔軟寄り（未コミット変更と混ぜてsnapshot復元）」はMVPでは**採用しない**。整合性（worktree base一致）とエディタ衝突回避のため、完全寄りに一本化する。柔軟寄りは将来フェーズの検討事項。

---

## 対応する修正タイプ

MVPで対応しやすいもの（いずれも**同一ファイル内・構造を壊さない**＝Fast Refresh維持）:

```text
text / label / button文言 / props / variant / size /
className / Tailwind class / icon / 軽いレイアウト変更
```

MVPで避けるもの（フルリロード誘発・波及大）:

```text
API変更 / DB変更 / 認可変更 / 課金変更 /
状態管理の大規模変更 / 複数画面にまたがる変更 / 複雑なフォームロジック変更 /
import追加・hooks構造変更などFast Refreshをフルリロードに落とす変更
```

---

## 実装ステップ

### Step 1: source location取得
- `react-dev-inspector` を調査・利用、もしくはBabel/Vite pluginで `data-ui-source` を注入
- クリックされたDOMから `data-ui-source` を取得

### Step 2: Overlay UI
- source locationを表示 / 指示入力欄 / variant一覧と前へ・次へUI

### Step 3: Local Agent Server
- session作成（**cleanチェック＋単一セッション排他**）/ base snapshot保存 / code range抽出 / AI用context生成

### Step 4: Variant生成
- `git worktree` を3つ作る
- AIに**変更後コード**を生成させる → worktreeに反映 → `git diff`でpatch化 → **patch検証**
- patchを保存

### Step 5: Preview切り替え
- （ロック下で）main worktreeをbase snapshotへ戻す → 選択patchを適用 → HMRで画面更新 → 前へ/次へで繰り返す

### Step 6: Apply / Discard
- Apply: 選択patchをmainに残す / Discard: base snapshotへ戻す / session cleanup

---

## 重要な設計判断

### 1. preview用dev serverは立てない
main画面の状態（route / auth / localStorage / form state）引き継ぎが面倒でUXが悪い。

### 2. main worktreeを一時的に汚す
現在見ている画面上でpreviewするため。既存のHMR / Fast Refreshをそのまま使え、URL・ブラウザ状態を維持できる。
※ただし**状態維持はFast Refreshが成立する変更（同一ファイル内）に限る**（v2明確化）。

### 3. git worktreeはAI作業用
variant A/B/Cを安全に分離。mainに直接AI変更を書かせず、選んだvariantだけpatchとして取り出す。

### 4. rollbackはgit resetではなくsnapshot中心
ユーザーの作業を消さず、対象ファイルだけ安全に戻す。

### 5. AIはdiffを書かない（v2新規）
unified diffはLLMが間違えやすい。AIは「変更後コード」を返し、patch化（`git diff`）はサーバ側で決定論的に行う。

### 6. 完全寄り＝整合性の担保（v2新規）
対象ファイルcleanを要求するのは、UX安全に加えて「worktree base＝main現状＝snapshot」を一致させ、patchがconflictなく当たることを保証するため。

---

## Codexに実装してほしい最初のMVP

最初はAI統合をmockにしてよい。まずは「patchを切り替えて現在画面にHMR previewする」体験を成立させる。

```text
1. data-ui-source属性を持つDOM要素をクリックできるoverlay
2. クリックされたsource locationを取得
3. 指示入力UIを表示
4. Local Agent Serverへ送信
5. 対象ファイルのbase snapshotを保存（cleanチェック込み）
6. 仮のVariant A/B/C patchを読み込む（AI生成部分はmockでよい）
7. 前へ/次へでmain worktreeにpatchを差し替え適用（ロックで逐次化）
8. HMRで画面が変わることを確認
9. Applyで選択patchを残す
10. Discardでbase snapshotへ戻す
```

---

## まず作るべき最小デモ

### 入力（※デモ専用に手書き。本番はビルド時注入でソースに残さない）

```tsx
export function SaveButton() {
  return (
    <button data-ui-source="src/components/SaveButton.tsx:2:5">
      保存
    </button>
  )
}
```

### Variant patches（mock）

```diff
# Variant A
- 保存
+ 保存する
```
```diff
# Variant B
- <button data-ui-source="src/components/SaveButton.tsx:2:5">
+ <button data-ui-source="src/components/SaveButton.tsx:2:5" className="font-bold">
```
```diff
# Variant C
- <button data-ui-source="src/components/SaveButton.tsx:2:5">
+ <button data-ui-source="src/components/SaveButton.tsx:2:5" className="px-4 py-2">
```

### 期待動作

```text
localhost:3000上でボタンをクリック → Variant panel表示 → 次へ →
main worktree上のファイルがVariant Bに切り替わる → HMRで画面更新 →
前へ → Variant Aに戻る → この案を適用 → 選んだ変更だけがファイルに残る
```

---

## 将来フェーズ

MVP後に追加する候補:

- AI本番統合 / PR作成 / Storybook preview / visual regression
- デザイナー承認 / GitHub auto-merge / 複数UI要素選択 / 変更リスク分類
- CODEOWNERS連携 / 各種AI Agent連携（Cursor / Claude Code / Codex / GitHub Copilot）
- React以外への対応 / Tailwind class専用variant生成 / GitHub issue化 / browser extension化
- **作業ツリー柔軟寄りモード**（未コミット変更と共存）
- **複数セッション同時実行**

---

## 現時点の結論

```text
既存のlocalhost:3000をそのまま使う
↓
クリックしたUIからsource locationを取得（定義位置が主）
↓
AIはgit worktree上でVariant A/B/Cの「変更後コード」を作る → サーバがpatch化・検証
↓
main worktreeへ一時patch適用してHMR preview（ロックで逐次化）
↓
前へ/次へでpatchを差し替える
↓
選んだ案だけmainに残す
```

この構成なら、画面状態を維持でき（同一ファイル変更時）、HMRを使え、AIの複数案を安全に分離でき、ユーザーは同じ画面上で選べる。PRやデザイナー承認なしでもMVP価値がある。

最初の価値はこれ:

```text
UIをクリックして、AIが作った複数のコード変更案を実画面で選べる。
```
