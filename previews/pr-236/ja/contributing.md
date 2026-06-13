# Contributing

この日本語版は `CONTRIBUTING.md` の翻訳です。内容が異なる場合は英語版を優先します。

この Safari 拡張を、小さく、信頼でき、確認しやすいものにしていくための貢献を歓迎します。

## Workflow

このプロジェクトは GitHub Flow に従います。

1. 自明でない作業を始める前に、既存 issue を探すか、新しい issue を作成します。
2. 最新の `main` から短命の branch を作成します。
3. Pull Request は 1 つの issue、または 1 つのまとまった変更に絞ります。
4. 該当する場合は `Closes #123` や `Fixes #123` で Pull Request と issue を紐づけます。
5. Review を待ち、議論は Pull Request 上で行います。
6. Merge 後に branch を削除します。

意図が分かる branch name を使います。

- `feat/123-link-hint-filtering`
- `fix/124-input-focus-guard`
- `docs/125-contributing-guide`
- `chore/126-biome-config`

## Development

`pnpm` を使います。`npm` や `yarn` の lockfile は追加しません。

```sh
pnpm install
pnpm run check
```

TypeScript のソースは `src/` にあります。Safari は `web-extension/` 内のコンパイル済みファイルを読み込みます。

```sh
pnpm run build:web
```

format と lint には Biome を使います。

```sh
pnpm run lint
pnpm run format
```

ESLint と Prettier は使いません。

## Documentation

英語版をドキュメントの正本とします。まず英語版を更新し、ユーザー向けまたはコントリビューター向けの重要な内容であれば `docs/ja/` 配下の日本語翻訳も更新します。

英語版と日本語版の内容が異なる場合は英語版を優先します。日本語翻訳には、対応する英語版への参照を入れます。

## Pull Request Expectations

review を依頼する前に、次を確認します。

- 最新の `main` を rebase または merge する。
- `pnpm run check` を実行する。
- browser behavior を変更した場合は `manual-test/` で手動確認する。
- Safari extension packaging を変更した場合は、Xcode が入った macOS で `pnpm run build:xcode` を実行する。
- 挙動、コマンド、権限、workflow が変わる場合はドキュメントを更新する。
- ユーザー向けドキュメントを変更した場合は、日本語翻訳も更新するか、未更新であることを Pull Request に明記する。

## Issue Expectations

良い issue は具体的で実行可能です。用意された issue form を使い、次の情報を含めてください。

- bug の場合は Safari version と macOS version。
- 明確な再現手順。
- 期待する挙動と実際の挙動。
- 見た目に関わる場合は screenshot または screen recording。
- 通常の Web page、PDF、またはその両方で発生するか。

## Scope

このプロジェクトは意図的に小さく保ちます。新機能は、Safari での link hints と page movement という中核の位置づけを守る必要があります。広範なブラウザ自動化スイートにはしません。
