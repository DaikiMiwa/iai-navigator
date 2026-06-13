# GitHub Workflow

この日本語版は `docs/process/github-workflow.md` の翻訳です。内容が異なる場合は英語版を優先します。

このプロジェクトは、public development のために GitHub Flow を使います。

## Branches

- `main` は常に integration branch です。
- 作業は短命の topic branch で行います。
- Branch name は type prefix を使い、可能であれば issue number を含めます。
  - `feat/123-link-hints`
  - `fix/124-input-focus`
  - `docs/125-readme`
  - `chore/126-tooling`
- Merge 後に branch を削除します。

## Issues

議論、優先順位付け、再現、公開 tracking が必要な作業では issue を作成します。

1 つの issue は 1 つの問題に対応させます。良い issue には次を含めます。

- 明確な title。
- 現在の挙動、またはユーザーの問題。
- 期待する挙動、または望ましい結果。
- bug の場合は再現手順。
- feature や task の場合は acceptance criteria。
- 必要に応じた environment details。

推奨 labels:

- `type: bug`
- `type: feature`
- `type: docs`
- `type: chore`
- `area: hints`
- `area: page-movement`
- `area: safari-extension`
- `status: needs-triage`
- `good first issue`

## Pull Requests

Pull Request は、無理なく review できる小ささに保ちます。

すべての PR には次を含めます。

- 変更内容の summary。
- 関連 issue があればその link。
- 実行した tests または manual checks。
- 見た目の挙動が変わる場合は screenshot または recording。
- Safari permissions、privacy、security への影響があればその notes。

早い段階の feedback には draft PR を使います。review target が明確で、local checks が通っている状態になってから ready for review にします。

## Merge Policy

Merge 前に次を満たします。

- `pnpm run check` が通る。
- 挙動変更は manual test page で手動確認する。
- Safari packaging の変更は macOS で `pnpm run build:xcode` が通る。
- 挙動、コマンド、process が変わる場合はドキュメントを更新する。

個別 commit を残す明確な review 上の価値がない限り、public history をきれいに保つため squash merge を優先します。
