# Server-side Syntax Validation

## 目的

worktree 上で生成後ファイルを TSX/JSX として parse し、構文エラーのある variant を `failed` にする。

## 対象範囲

今回やること:

- `.tsx` / `.jsx` の変更後ファイルを `@babel/parser` で parse する server helper を追加する。
- `generateVariants()` の variant 生成ループで、patch validation と合わせて構文検証を実行する。
- parse error message を variant の `error` として保存する。

今回やらないこと:

- TypeScript 型チェック。
- runtime error 検知。
- AI 出力の自動修復。

## 変更対象ファイル

| ファイル | 変更内容 |
| --- | --- |
| `packages/vite-plugin-ui-variants/src/server/variantValidation.ts` | 新規。変更ファイルの構文検証 helper を追加 |
| `packages/vite-plugin-ui-variants/src/server/router.ts` | `generateVariants()` の variant 生成ループで構文検証を呼び出す |
| `packages/vite-plugin-ui-variants/src/server/patch.ts` | 必要なら `extractTouchedFiles()` の再利用境界を確認。大きな変更は避ける |

## 実装ステップ

1. `packages/vite-plugin-ui-variants/src/server/variantValidation.ts` を作成する。
2. `@babel/parser` の `parse()` を import し、`validateChangedFiles(worktreeRoot: string, patch: string)` を定義する。
3. `extractTouchedFiles(patch)` で repo 相対の変更ファイルを取得する。
4. `.tsx` / `.jsx` 以外は構文検証対象から外す。
5. 対象ファイルごとに `path.join(worktreeRoot, repoRelFile)` を読み込み、`parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] })` を実行する。
6. parse に失敗したら `{ ok: false, reason }` を返す。reason は `JSX syntax error in <file>: <message>` のようにファイル名付きにする。
7. すべて成功したら `{ ok: true }` を返す。
8. `router.ts` の variant loop で `validatePatch(patch)` の後に `validateChangedFiles(worktreeDir(...), patch)` を呼ぶ。
9. patch validation または syntax validation のどちらかが失敗した場合、`variant.status = "failed"`、`variant.error = reason` とする。
10. 成功した場合だけ `variant.status = "ready"` と `variant.patchPath = patchPath` を設定する。
11. 空 patch が発生する場合の挙動を確認し、既存仕様から外れない範囲で error にするか現状維持かを決める。判断が必要なら実装時に main agent で確認する。

## 完了条件

- [ ] `.tsx` / `.jsx` の変更後ファイルに構文エラーがある variant が `failed` になる。
- [ ] `.ts` / `.js` / `.css` などは今回の JSX 構文検証で誤って parse されない。
- [ ] `validatePatch()` の denylist / max file / max diff lines の挙動が維持される。
- [ ] `Variant.error` にユーザーが読める構文エラー理由が入る。

## 検証方法

- `pnpm --filter vite-plugin-ui-variants exec tsc --noEmit`
- 手動または API で `Workflow.tsx` の `<p>` を `>> WORKFLOW <<<` にする生成結果を通し、該当 variant が `failed` になることを確認する。
