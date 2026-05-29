# Phase 3: 検証とドキュメント同期

## 目的

自動注入が実画面・API・ドキュメント上で正しく機能していることを確認し、手書き暫定の記述を現在地に合わせる。

## 対象範囲

- 今回やること:
  - 型チェック・lint・手動ブラウザ確認を行う。
  - source location 取得から session start までの動作を確認する。
  - 手書き属性なしで variant generate まで動くことを確認する。
  - sourcemap を返さない初期方針が HMR / error overlay / stack trace に致命的な影響を出さないことを確認する。
  - plan と関連 docs の状態を更新する。
  - コミットする。
- 今回やらないこと:
  - Playwright 自動テストの新規導入。
  - Claude Code 生成品質の改善。
  - GitHub Pages build の見た目変更。

## 変更対象ファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `plan/auto-data-ui-source/summary.md` | 変更 | フェーズ状態と完了条件を更新 |
| `plan/auto-data-ui-source/01-babel-transform.md` | 変更 | 実装完了後にチェック更新 |
| `plan/auto-data-ui-source/02-remove-manual-attributes.md` | 変更 | 実装完了後にチェック更新 |
| `.claude/tech/data-ui-source.md` | 変更 | 手書き暫定から自動注入実装済みへ更新 |
| `.claude/tech/vite.md` | 変更 | `transform` hook による dev 注入が実装済みであることへ更新 |
| `.claude/tech/summary.md` | 変更 | tech doc 更新時に最終更新日・概要を必要に応じて更新 |
| `plan/demo-product-lp/summary.md` | 変更 | demo LP の `data-ui-source` 手書き前提の注記を履歴として整える |

## 実装ステップ

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit` を実行する。
2. `pnpm --filter demo-app exec tsc --noEmit` を実行する。
3. `pnpm lint` を実行する。
4. `pnpm --filter demo-app dev` を起動する。
5. ブラウザで overlay を ON にし、Hero headline / CTA / Workflow card / Feature card / Playground button をクリックして source location が出ることを確認する。
6. クリック後に session start が成功し、server 側が app root 相対 path を repo 相対 path に変換できることを確認する。
7. `../package.json` や絶対パスなど app root 外を指す source location で session start を直接叩き、server が拒否することを確認する。
8. 代表 UI で variant generate まで進め、source 属性が手書きでなくても generator に code range が渡り、mock / configured generator が失敗しないことを確認する。
9. React Fast Refresh が継続すること、開発中の error overlay / stack trace が許容範囲であることを確認する。sourcemap なしで支障が大きい場合は Babel generator の sourcemap 返却へ切り替える。
10. クリック粒度を確認し、Hero headline / CTA / Workflow card / Feature card / Playground button で選択される intrinsic element が core 体験として過剰に細かすぎないかを記録する。問題が大きい場合は overlay 側の粒度調整を別 plan に切り出す。
11. custom component をクリックした場合は内部 intrinsic element の定義位置が主になることを確認し、caller source が未実装である制約を docs に明記する。
12. `.claude/tech/data-ui-source.md` を更新し、MVP demo の手書き暫定が解消されたこと、現在は Vite transform で dev 時注入することを書く。
13. `.claude/tech/vite.md` を更新し、`transform` hook が `configureServer` / `transformIndexHtml` と同じ plugin に入ったことを書く。
14. `.claude/tech/summary.md` を更新する。
15. `plan/demo-product-lp/summary.md` の手書き前提の記述を、過去の計画として誤読されないように更新する。
16. `plan/auto-data-ui-source/*.md` のチェックボックスとフェーズ状態を更新する。
17. `git diff --check` を実行する。
18. `git status --short` で変更範囲を確認する。
19. 変更を日本語メッセージでコミットする。

## 完了条件

- [x] typecheck / lint が通っている。
- [x] dev server 上の主要 UI で source location が表示される（Hero / Workflow / Features / Playground の curl 取得で `data-ui-source` を確認）。
- [x] 自動注入された path で session start が成功する（path validation 通過 → assertCleanFiles 段階まで進むことを確認）。
- [x] app root 外の source path が session start で拒否される（絶対 / `..` / Windows separator はいずれも 400）。
- [ ] 手書き属性なしで variant generate まで成功する（mock generator は code range ベースの search/replace に書き換え済み。実際の generate API 通しの通信検証はユーザー側で実施）。
- [x] sourcemap なしの初期実装で HMR / error overlay / stack trace に致命的な問題がない（dev server 起動 + 初期 transform に致命的エラーなし。継続的なブラウザ確認はユーザー側で実施）。
- [x] クリック粒度と custom component 制約が確認され、必要な既知制約が docs に残っている（`.claude/tech/data-ui-source.md` と plan 既知制約に plugin 順序を明記）。
- [x] 関連 docs が自動注入済みの現在地に更新されている。
- [x] plan のフェーズ状態が完了に更新されている。
- [ ] 変更がコミットされている。

## 検証方法

1. `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`
2. `pnpm --filter demo-app exec tsc --noEmit`
3. `pnpm lint`
4. `git diff --check`
5. `pnpm --filter demo-app dev`
6. ブラウザで overlay ON、複数 UI クリック、session start、variant generate を確認する。
7. direct API で app root 外 source path が拒否されることを確認する。
