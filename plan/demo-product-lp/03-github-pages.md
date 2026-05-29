# Phase 3: GitHub Pages build and deploy preparation

## 目的

demo LP を GitHub Pages に公開できるように、static build の base path と deploy 手順を整える。

## 対象範囲

今回やること:

- GitHub Pages 公開方法を決める。
- `examples/demo-app` の Vite build が Pages 配下で正しく asset を参照できるようにする。
- 必要なら GitHub Actions workflow を追加する。
- ローカル dev overlay と公開 LP の役割差を README に明記する。

今回やらないこと:

- overlay を GitHub Pages 上で動かす。
- 独自ドメイン設定。
- analytics 設定。

## 変更対象ファイル

- `examples/demo-app/vite.config.ts`
- `examples/demo-app/package.json`
- `.github/workflows/demo-pages.yml`（workflow を採用する場合）
- `README.md` または `examples/demo-app/README.md`（存在しない場合は必要に応じて追加）

## 実装ステップ

1. repository name を確認し、GitHub Pages の base path を決める。想定は `/ai-ui-variants/`。
2. `examples/demo-app/vite.config.ts` に Pages build 用の `base` を追加する。環境変数で切り替える場合は `process.env.GITHUB_PAGES === "true"` のように明示する。
3. `examples/demo-app/package.json` に必要なら `build:pages` script を追加する。
4. GitHub Actions を使う場合は `.github/workflows/demo-pages.yml` を追加し、`pnpm install`、`pnpm --filter demo-app build:pages`、`examples/demo-app/dist` の upload/deploy を行う。
5. README に次を短く書く。
   - Local editable demo: `pnpm --filter demo-app dev`
   - Static LP build: `pnpm --filter demo-app build` or `build:pages`
   - GitHub Pages では local agent overlay は動かず、LP 表示のみであること。

## 完了条件

- [ ] Pages 用 base path が決まっている。
- [ ] `pnpm --filter demo-app build` または `build:pages` が通る。
- [ ] GitHub Pages deploy の手順が repo 内に残っている。
- [ ] 公開 LP と local editable demo の違いが説明されている。

## 検証方法

- `pnpm --filter demo-app build`
- Pages workflow を追加した場合は workflow YAML の構文と paths を目視確認する。
- 必要なら `pnpm --filter demo-app exec vite preview --host 127.0.0.1` で static build を確認する。
