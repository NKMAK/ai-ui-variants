# UI Variant Preview Agent MVP 仕様メモ

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
AIが Variant A/B/C の unified diff を生成
↓
各diffを現在のmain画面に一時適用してHMR preview
↓
「前へ / 次へ」で切り替える
↓
選んだdiffだけ本ブランチへ適用
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

- `react-dev-inspector`
  - ReactコンポーネントをクリックしてIDE上の該当ソースへジャンプできる
  - `data-inspector-*` のような属性をDOMに注入する思想が近い
- `LocatorJS`
  - UIからコード位置を開く系
- `click-to-component`
  - React向けのclick-to-source
- `Stagewise`
  - ブラウザ上のUI要素を選択し、AI agentに文脈を渡して修正する方向で近い
- `Onlook`
  - visual editor + AI code edit寄り
- `Frontman`
  - 実行中アプリの要素をクリックし、自然言語指示から実コード編集へつなぐ方向で近い

### 差別化の方向

単なる `UI → source code jump` では差別化しにくい。  
`react-dev-inspector` などでほぼ満たされる。

差別化は次の方向に置く:

```text
UIをクリックして、AIが作った複数のコード変更案を実画面で選べる
```

英語表現:

```text
Click a UI element. Generate code-backed variants. Preview and pick one.
```

日本語表現:

```text
UIをクリックして、AIが作った複数の修正案を画面で選ぶ。
```

---

## MVPスコープ

### やること

- 既存の `localhost:3000` など、ユーザーが今見ているmain画面上でUIをクリック
- source locationを取得
- 該当コード周辺だけAIに渡す
- AIが複数のunified diffを生成
- 各variantは `git worktree` 上で生成・保持
- preview時は現在のmain worktreeに一時的にpatchを当てる
- HMR / Fast Refreshで画面上の見た目を切り替える
- 「前へ / 次へ」でvariantを切り替える
- 「この案を適用」で選んだpatchだけmain worktreeに残す
- 「破棄」でbase状態に戻す

### やらないこと

初期MVPでは以下は不要:

- 関連Storybookの探索
- 関連testの探索
- DOM snapshot
- props収集
- computed style収集
- デザイナー承認フロー
- PR作成
- 自動マージ
- 複数dev server / 複数iframe preview
- Storybook連携
- visual regression test連携

---

## なぜpreview用URLを分けないか

一度は `preview worktree` を別portで立てる案を検討したが、UX上の問題がある。

問題:

```text
main画面でUIをクリックして指示
↓
previewは別URL / 別worktree
↓
ログイン状態、route、localStorage、画面状態、入力内容などの引き継ぎが面倒
```

したがってMVPでは、**現在ユーザーが見ているmain画面をそのままpreview surfaceにする**。

つまり:

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
  main worktree
  localhost:3000 が見ている場所

.ui-agent/worktrees/session-123/
  variant-a/
  variant-b/
  variant-c/
```

各variant worktreeでAIがコードを書く。

```text
variant-a に案Aを書き込む
variant-b に案Bを書き込む
variant-c に案Cを書き込む
```

その後、各variantからpatchを作る。

```bash
git -C .ui-agent/worktrees/session-123/variant-a diff > .ui-agent/sessions/session-123/variant-a.patch
git -C .ui-agent/worktrees/session-123/variant-b diff > .ui-agent/sessions/session-123/variant-b.patch
git -C .ui-agent/worktrees/session-123/variant-c diff > .ui-agent/sessions/session-123/variant-c.patch
```

preview時だけmain worktreeにpatchを一時適用する。

---

## 最終アーキテクチャ

```text
Browser Overlay / Inspector UI
  - UI選択
  - 指示入力
  - Variant表示
  - 前へ / 次へ
  - この案を適用
  - 破棄

Dev Server Plugin / Local Agent Server
  - source location取得
  - 対象コード範囲抽出
  - AI用context生成
  - git worktree作成
  - AIにvariant生成を依頼
  - diff検証
  - main worktreeへの一時patch適用
  - snapshot復元
  - apply / discard

AI Patch Generator
  - instruction + code contextを受け取る
  - Variant A/B/Cのunified diffを返す
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

例:

```html
<button data-ui-source="src/components/SaveButton.tsx:42:5">
  保存
</button>
```

意味:

```text
file: src/components/SaveButton.tsx
line: 42
column: 5
```

React/JSXのビルド時・開発時に自動付与する。  
手動では付けない。

候補:

- `react-dev-inspector` を利用・参考にする
- Babel plugin / SWC plugin / Vite pluginで独自に注入
- intrinsic elementにだけ付与するところから始める

---

## data-ui-sourceの考え方

`data-ui-source` は標準機能ではなく、独自の開発用メタデータ。

目的:

```text
DOM要素に「このUIはどのファイルの何行目から来たか」という名札を付ける
```

JSからは次のように読める。

```ts
const source = element.dataset.uiSource
```

MVPでは以下の形式でよい。

```text
file:line:column
```

例:

```text
src/pages/users/UserDetail.tsx:88:14
```

---

## AIに渡すcontext

MVPでは最小限にする。

渡すもの:

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

callerSource:
  file: src/features/user/UserForm.tsx
  line: 88
  column: 10
  optional: true

instruction:
  "このボタンをもう少し目立たせて"

constraints:
  - 変更は対象ファイル中心
  - 1variantあたりdiffは小さく
  - API / DB / auth / package.json / lockfileは触らない
  - 3案出す
  - unified diffで返す
```

不要:

```text
関連story
関連test
DOM snapshot
props
computed style
```

---

## Variant生成

AIには3つの修正案を作らせる。

例:

```text
Variant A:
<Button variant="primary"> に変更

Variant B:
文言を「保存する」に変更し、size="lg" を追加

Variant C:
classNameに強調用のTailwind classを追加
```

返却形式は構造化する。

```ts
type Variant = {
  id: string
  title: string
  description: string
  diff: string
  status: "pending" | "ready" | "previewing" | "applied" | "failed"
}
```

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
  patchPath: string
  status: "pending" | "ready" | "previewing" | "applied" | "failed"
}

type Session = {
  id: string
  selectedSource: SourceLocation
  instruction: string
  baseSnapshot: Record<string, string>
  variants: Variant[]
  currentIndex: number
  touchedFiles: string[]
  createdAt: string
}
```

---

## Base Snapshot

`git reset --hard` はユーザーの未コミット変更を消す危険がある。  
そのため、セッション開始時に対象ファイルの内容をsnapshotとして保存する。

```ts
type BaseSnapshot = Record<string, string>
```

例:

```ts
const baseSnapshot = {
  "src/components/SaveButton.tsx": originalContent,
  "src/features/user/UserForm.tsx": originalCallerContent
}
```

variant切り替え時は必ず:

```text
base snapshotから対象ファイルを復元
↓
選択中variantのpatchを適用
```

---

## Variant切り替えの内部処理

### Variant Aをpreview

```text
1. main worktreeの対象ファイルをbase snapshotへ戻す
2. variant-a.patchをmain worktreeへ適用
3. localhost:3000のHMR / Fast Refreshで画面更新
4. currentIndex = 0
```

### 次へ

```text
1. main worktreeの対象ファイルをbase snapshotへ戻す
2. 次variantのpatchをmain worktreeへ適用
3. HMR / Fast Refresh
4. currentIndexを更新
```

### 前へ

```text
1. main worktreeの対象ファイルをbase snapshotへ戻す
2. 前variantのpatchをmain worktreeへ適用
3. HMR / Fast Refresh
4. currentIndexを更新
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

Local Agent Server / Dev Server PluginにAPIを用意する。

```text
POST /__ui_agent/session/start
POST /__ui_agent/session/:id/generate-variants
POST /__ui_agent/session/:id/preview/:variantId
POST /__ui_agent/session/:id/apply/:variantId
POST /__ui_agent/session/:id/discard
GET  /__ui_agent/session/:id
```

### session start

```http
POST /__ui_agent/session/start
```

```json
{
  "file": "src/components/SaveButton.tsx",
  "line": 42,
  "column": 5
}
```

### generate variants

```http
POST /__ui_agent/session/:id/generate-variants
```

```json
{
  "instruction": "このボタンをもう少し目立たせて",
  "count": 3
}
```

### preview

```http
POST /__ui_agent/session/:id/preview/variant-b
```

内部処理:

```text
restore base snapshot
apply variant-b.patch to main worktree
trigger HMR via file changes
```

### apply

```http
POST /__ui_agent/session/:id/apply/variant-b
```

内部処理:

```text
restore base snapshot
apply selected variant patch to main worktree
mark session applied
```

### discard

```http
POST /__ui_agent/session/:id/discard
```

内部処理:

```text
restore base snapshot
mark session discarded
cleanup temporary worktrees
```

---

## File/Directory構成案

```text
my-app/
  src/
  package.json
  vite.config.ts

  .ui-agent/
    sessions/
      session-123/
        session.json
        base/
          src/components/SaveButton.tsx
        patches/
          variant-a.patch
          variant-b.patch
          variant-c.patch

    worktrees/
      session-123/
        variant-a/
        variant-b/
        variant-c/
```

---

## 制約・ガードレール

MVPでは安全のため制約を強くする。

### 変更対象制限

- 対象ファイルは最大2〜3ファイル
- diffは1variantあたり最大100行程度
- 対象UIに近いファイル中心
- 変更禁止ファイルを設定する

禁止例:

```text
package.json
pnpm-lock.yaml
yarn.lock
package-lock.json
.env
.env.*
auth関連
billing関連
database migration
infra
CI設定
```

### 作業ツリー制限

最初は以下のどちらかを選ぶ。

#### 安全寄り

セッション開始時に対象ファイルがcleanであることを要求する。

```text
対象ファイルに未コミット変更がある場合は警告して開始しない
```

#### 柔軟寄り

対象ファイルのsnapshotを保存し、その範囲だけ復元する。  
ただし、ユーザーの既存未コミット変更とAI preview変更が混ざるリスクがある。

MVPでは安全寄りがよい。

---

## 対応する修正タイプ

MVPで対応しやすいもの:

```text
- text変更
- label変更
- button文言変更
- props変更
- variant変更
- size変更
- className変更
- Tailwind class変更
- icon変更
- 軽いレイアウト変更
```

MVPで避けるもの:

```text
- API変更
- DB変更
- 認可変更
- 課金変更
- 状態管理の大規模変更
- 複数画面にまたがる変更
- 複雑なフォームロジック変更
```

---

## 実装ステップ

### Step 1: source location取得

- `react-dev-inspector` を調査・利用する
- もしくはBabel/Vite pluginで `data-ui-source` を注入する
- クリックされたDOMから `data-ui-source` を取得する

### Step 2: Overlay UI

- クリックしたUIのsource locationを表示
- 指示入力欄を出す
- variant一覧と前へ/次へUIを出す

### Step 3: Local Agent Server

- session作成
- base snapshot保存
- code range抽出
- AI用context生成

### Step 4: Variant生成

- `git worktree` を3つ作る
- AIにvariantごとの差分を生成させる
- 各worktreeにpatchを適用
- diffを保存する

### Step 5: Preview切り替え

- main worktreeをbase snapshotへ戻す
- 選択variantのpatchをmainに適用
- HMRで画面更新
- 前へ/次へで繰り返す

### Step 6: Apply / Discard

- Apply: 選択patchをmainに残す
- Discard: base snapshotへ戻す
- session cleanup

---

## 重要な設計判断

### 1. preview用dev serverは立てない

理由:

- main画面の状態を引き継ぐのが面倒
- route / auth / localStorage / form state がズレる
- UXが悪い

### 2. main worktreeを一時的に汚す

理由:

- 現在見ている画面上でpreviewするため
- 既存のHMR / Fast Refreshをそのまま使える
- URLやブラウザ状態を維持できる

### 3. git worktreeはAI作業用

理由:

- variant A/B/Cを安全に分離できる
- mainに直接AI変更を書かせない
- 選んだvariantだけpatchとして取り出せる

### 4. rollbackはgit resetではなくsnapshot中心

理由:

- ユーザーの作業を消さないため
- 対象ファイルだけ安全に戻すため

---

## Codexに実装してほしい最初のMVP

まずは以下を実装する。

```text
1. data-ui-source属性を持つDOM要素をクリックできるoverlay
2. クリックされたsource locationを取得
3. 指示入力UIを表示
4. Local Agent Serverへ送信
5. 対象ファイルのbase snapshotを保存
6. 仮のVariant A/B/C patchを読み込む、またはAI生成部分はmockでもよい
7. 前へ/次へでmain worktreeにpatchを差し替え適用
8. HMRで画面が変わることを確認
9. Applyで選択patchを残す
10. Discardでbase snapshotへ戻す
```

最初はAI統合をmockにしてよい。  
まずは「patchを切り替えて現在画面にHMR previewする」体験を成立させる。

---

## まず作るべき最小デモ

### 入力

既存のReact component:

```tsx
export function SaveButton() {
  return (
    <button data-ui-source="src/components/SaveButton.tsx:2:5">
      保存
    </button>
  )
}
```

### Variant patches

Variant A:

```diff
- 保存
+ 保存する
```

Variant B:

```diff
- <button data-ui-source="src/components/SaveButton.tsx:2:5">
+ <button data-ui-source="src/components/SaveButton.tsx:2:5" className="font-bold">
```

Variant C:

```diff
- <button data-ui-source="src/components/SaveButton.tsx:2:5">
+ <button data-ui-source="src/components/SaveButton.tsx:2:5" className="px-4 py-2">
```

### 期待動作

```text
localhost:3000上でボタンをクリック
↓
Variant panel表示
↓
次へを押す
↓
main worktree上のファイルがVariant Bに切り替わる
↓
HMRで画面更新
↓
前へを押す
↓
Variant Aに戻る
↓
この案を適用
↓
選んだ変更だけがファイルに残る
```

---

## 将来フェーズ

MVP後に追加する候補:

- AI本番統合
- PR作成
- Storybook preview
- visual regression
- デザイナー承認
- GitHub auto-merge
- 複数UI要素選択
- 変更リスク分類
- CODEOWNERS連携
- Cursor / Claude Code / Codex / GitHub Copilot Agent連携
- React以外への対応
- Tailwind class専用のvariant生成
- GitHub issue化
- browser extension化

---

## 現時点の結論

MVPの最適形は以下。

```text
既存のlocalhost:3000をそのまま使う
↓
クリックしたUIからsource locationを取得
↓
AIはgit worktree上でVariant A/B/Cを作る
↓
main worktreeへ一時patch適用してHMR preview
↓
前へ/次へでpatchを差し替える
↓
選んだ案だけmainに残す
```

この構成なら、

- 画面状態を維持できる
- HMRを使える
- AIの複数案を安全に分離できる
- ユーザーは同じ画面上で選べる
- PRやデザイナー承認なしでもMVP価値がある

最初の価値はこれ:

```text
UIをクリックして、AIが作った複数のコード変更案を実画面で選べる。
```
