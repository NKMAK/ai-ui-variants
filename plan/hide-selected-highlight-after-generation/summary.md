# バリアント生成完了後に選択要素のフォーカス青枠を消す

## 目的

インスペクターで対象 UI を選択した直後に表示される青いフォーカス枠（`inspector-highlight is-selected`）が、AI によるバリアント生成完了後もそのまま残ってしまい、生成結果の確認時に視覚的なノイズになる。

バリアントが生成された段階で青い選択枠だけを非表示にし、生成結果を素のままプレビューできる状態にする。

## 現状把握（実装前メモ）

- 青枠の描画: [packages/vite-plugin-ui-variants/src/client/components/Inspector/index.tsx](packages/vite-plugin-ui-variants/src/client/components/Inspector/index.tsx) が `selectedRect` を参照して `inspector-highlight is-selected` を描画。
- `selectedRect` の更新: [packages/vite-plugin-ui-variants/src/client/hooks/useInspector.ts](packages/vite-plugin-ui-variants/src/client/hooks/useInspector.ts) が click / scroll / resize で `selectedSource` に紐付く要素の `getBoundingClientRect()` を再計算しており、`selectedSource` が残っている限り `selectedRect` も維持される。
- なぜ `selectedSource` を消せないか: パネル上部の [SourceLocation](packages/vite-plugin-ui-variants/src/client/components/SourceLocation/index.tsx) が「どのソースに対する提案か」を表示するためにこの値を使うので、生成完了タイミングでクリアしてしまうと表示が崩れる。

→ 「`selectedSource` は維持しつつ、selected highlight だけ描画停止する」分岐を入れるのが副作用が一番小さい。

## 設計方針

選択枠の描画可否を、現在のバリアント状態から導出する：

- バリアント未生成（`variants.length === 0`）→ 青枠を表示（従来通り、選択中の UI を示す）
- バリアント生成済み（`variants.length > 0`）→ 青枠を非表示（生成結果のプレビューを邪魔しない）
- discard などで `variants` が空に戻れば自然に青枠が復活する（追加状態を持たない＝整合性ハック不要）

ホバー枠（`is-hovered`）はユーザー要望の対象外なので触らない。インスペクター ON で別要素にホバーしたときは引き続き水色枠を出す。生成中（`busy`）の挙動も従来どおりで OK（生成中はまだ `variants.length === 0` のままなので青枠は出続け、生成完了で消える挙動になる）。

実装は `Inspector` コンポーネント側で `variants` signal を読み、selected の分岐だけを差し替える。`overlayStore` への signal 追加・`useInspector` 側の変更は不要。

## 参照ドキュメント

| ファイル | 確認観点 |
| --- | --- |
| `.claude/specs/summary.md` | UI variant 生成・プレビューのライフサイクル仕様の最新版を特定 |
| `.claude/tech/summary.md` | overlay の構成（Preact + signals + Shadow DOM）に関する技術ドキュメント所在 |

> どちらも軽く確認し、本変更が仕様・技術ドキュメント側の更新を伴うかを判断する。今回は内部挙動の微調整なので恐らく不要だが、`Inspector` の描画条件が仕様に明記されていれば追記する。

## フェーズ一覧

| # | フェーズ名 | 状態 | 詳細ファイル |
| --- | --- | --- | --- |
| 1 | Inspector の selected 描画条件にバリアント状態を加える | 完了 | （本ファイル内に統合） |

単一フェーズなのでフェーズ詳細ファイルは作らず、本 summary に実装ステップを併記する。

## 実装ステップ

1. [Inspector/index.tsx](packages/vite-plugin-ui-variants/src/client/components/Inspector/index.tsx) に `variants` signal を import する。
2. `Inspector` 関数内で `const hasVariants = variants.value.length > 0;` を計算する。
3. selected highlight の描画分岐を `isVisibleRect(selected) && !hasVariants` に変更する。
4. 早期 return の条件もこれに合わせて更新する（hover も selected も描かないケース判定）。例: `if (!isVisibleRect(hover) && (!isVisibleRect(selected) || hasVariants)) return null;`
5. `pnpm --filter vite-plugin-ui-variants build` を実行し型エラーが無いことを確認する。
6. `pnpm --filter demo-app dev` でデモアプリを起動し検証する。

## 検証方法

1. `pnpm --filter demo-app dev` を起動。
2. インスペクターを ON にし、`examples/demo-app/src/components/Hero.tsx` の任意要素（例: 見出し）をクリック。
3. 青い選択枠が出ることを確認。
4. instruction 入力欄に修正指示（例: 「文字色を赤に」）を入れ生成を実行。
5. 生成完了直後に青枠が消えていることを確認。プレビューには選択枠が乗らない。
6. パネルの discard を押し、`variants` が空に戻った状態で再度青枠（選択中なら）が復活するか、または期待どおり消えたままかを確認（仕様: discard 時は `selectedSource` も `null` になるので青枠も自然に消える）。
7. 生成中（`busy=true`）の状態では青枠が出続けていることを別ケースで確認（生成が走っている間に対象 UI を見失わないため）。
8. ホバー枠（水色）は従来どおり別要素に乗せたとき表示されることを確認。

## 完了条件

- [x] [Inspector/index.tsx](packages/vite-plugin-ui-variants/src/client/components/Inspector/index.tsx) で `variants.length > 0` のとき selected highlight が描画されない。
- [x] `pnpm --filter vite-plugin-ui-variants build` が成功する。
- [ ] 上記「検証方法」の手順で、生成完了タイミングで青枠が消える挙動を目視確認した。
- [ ] discard 後、再選択で青枠が復活する（または `selectedSource` が消えて青枠も消える）挙動が破綻していない。
- [ ] ホバー枠（水色）の表示・非表示が従来どおり動作する。
- [x] 変更をコミットする（メッセージ例: 「バリアント生成後は選択要素の青枠を非表示にする」）。

## スコープ外

- ホバー枠（`is-hovered`）の挙動変更。
- パネル側の `SourceLocation` 表示・`selectedSource` のライフサイクル変更。
- 生成中インジケーターの追加・改善。
- `useInspector` の内部状態（`selectedElement`）構造の見直し。
