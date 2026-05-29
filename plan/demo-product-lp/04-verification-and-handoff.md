# Phase 4: verification, docs, and handoff

## 目的

Claude 実装後に、LP と editable demo が両方成立していることを確認し、計画状態・検証結果・コミットまで整える。

## 対象範囲

今回やること:

- TypeScript build と demo app build を確認する。
- overlay のクリック対象として LP が使えることを確認する。
- GitHub Pages 用の static build を確認する。
- plan の状態を更新する。
- 変更をコミットする。

今回やらないこと:

- PR 作成。
- 本番ドメインへの公開確認。
- Claude generator の改修。

## 変更対象ファイル

- `plan/demo-product-lp/summary.md`
- 必要なら `README.md` または `examples/demo-app/README.md`

## 実装ステップ

1. `pnpm --filter demo-app exec tsc --noEmit` を実行する。
2. `pnpm --filter demo-app build` を実行する。
3. `pnpm --filter demo-app dev` を起動し、ブラウザで LP を確認する。
4. overlay を ON にし、Hero / CTA / workflow card / feature card / editable form CTA をクリックして source location が表示されることを確認する。
5. input に文字を入れた状態で variant preview を行い、Fast Refresh で state が維持されることを確認する。
6. `git diff --check` を実行する。
7. `git status --short` で変更ファイルを確認する。
8. `plan/demo-product-lp/summary.md` のフェーズ一覧と完了条件を更新する。
9. コミットする。コミットメッセージ例: `demo LPを英語の紹介ページに更新`

## 完了条件

- [ ] TypeScript check が通っている。
- [ ] demo app build が通っている。
- [ ] local dev で overlay から LP 要素を選択できる。
- [ ] state 維持確認ができている。
- [ ] GitHub Pages 向けの build/deploy 手順が確認されている。
- [ ] plan の状態が更新されている。
- [ ] 変更がコミットされている。

## 検証方法

- `pnpm --filter demo-app exec tsc --noEmit`
- `pnpm --filter demo-app build`
- `pnpm --filter demo-app dev`
- `git diff --check`
- `git status --short`
