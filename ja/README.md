# IAI

この日本語版は `README.md` の翻訳です。内容が異なる場合は英語版を優先します。

IAI は、キーボード中心で Safari を操作するための小さな Safari Web Extension です。

Vimium のようなリンク Hint、ページ移動、タブ切り替え、URL コピー、軽量な navigation palette を Safari に追加します。フル機能のブラウザ自動化ツールを目指すのではなく、小さく監査しやすく、プライバシーに配慮した拡張として保つことを重視しています。

[Vimium](https://github.com/philc/vimium) や [Vimari](https://github.com/televator-apps/vimari) などのプロジェクトに影響を受けつつ、この拡張は Safari 固有のキーボードナビゲーションに焦点を当てています。通常のクリックとして動く link hint、滑らかなページ移動、実用的な tab command、Safari Web Extension の制約内で動く palette を重視します。

## 機能

- `f` でリンク Hint を表示し、Hint を入力して対象を現在タブで開く。
- `Shift+F` で Hint したリンクを新しい前面タブで開く。
- `h`、`j`、`k`、`l`、`u`、`d`、`gg`、`Shift+G` などでページを移動する。
- `Shift+H` と `Shift+L` でブラウザ履歴を戻る/進む。
- `Shift+J` と `Shift+K` でタブを切り替える。
- `yy` で現在ページの URL をコピーする。
- `o` で navigation palette を開き、タブ、ローカルで観測した訪問履歴、コマンド、URL、検索、Safari が公開する場合の bookmark/history を検索する。
- `b`、`v`、`Shift+T` で bookmark、history、tab に絞った palette を開く。
- `?` で利用可能なショートカットを見る。
- text input、textarea、select、編集可能な要素では通常の入力を妨げない。

Safari は Chromium 系ブラウザと拡張 API の挙動が異なるため、bookmark、history、PDF などでは利用できる情報に制限があります。この拡張は Safari の制限内で best-effort の fallback を使います。

## ステータス

このプロジェクトは early development の段階です。ソースコードは透明性、レビュー、community contribution のために公開していますが、open source ではなく source-available です。最初の安定した公開リリースまでは、挙動、名称、パッケージング、ライセンス、リリース方針が変わる可能性があります。

## 使い方

Safari で拡張を有効にしたあと、通常の Web page で次の shortcut を試せます。

| Shortcut | Action |
| --- | --- |
| `f` | 見えている link や control に Hint を表示し、選択した target を現在タブで開く。 |
| `Shift+F` | link Hint を表示し、選択した link を新しい前面タブで開く。 |
| `h` / `j` / `k` / `l` | 左、下、上、右へスクロールする。 |
| `u` / `d` | 半ページ分、上または下へ移動する。 |
| `gg` / `Shift+G` | ページ上端または下端へ移動する。 |
| `Shift+H` / `Shift+L` | tab history を戻る/進む。 |
| `Shift+J` / `Shift+K` | 左または右の tab へ切り替える。 |
| `o` | navigation palette を開く。 |
| `b` / `v` / `Shift+T` | bookmark、history、open-tab palette を開く。 |
| `yy` | 現在ページの URL をコピーする。 |
| `?` | shortcut help overlay を表示する。 |
| `Esc` | hint mode のキャンセル、overlay の close、または focused editable field の blur。 |

text field や editable content で入力している間、通常の shortcut は無視されます。ただし `Esc` のように編集 focus を抜けるための command は例外です。

## インストール

### Safari に一時的に読み込む

ローカルで素早くテストする場合の手順です。

1. Web Extension ファイルをビルドします。

   ```sh
   pnpm install
   pnpm run build:web
   ```

2. Safari > Settings を開きます。
3. 必要であれば Advanced > Show features for web developers から Developer tab を有効にします。
4. Safari > Settings > Developer で Allow unsigned extensions を有効にします。
5. Add Temporary Extension をクリックし、`web-extension/` フォルダを選択します。
6. Safari Settings > Extensions で拡張を有効にし、website access を許可します。

Safari は、一時的に読み込んだ拡張を 24 時間後、または Safari 終了時に削除します。

### Xcode app として読み込む

生成された macOS Safari extension app をテストする場合の手順です。

1. Xcode project をビルドします。

   ```sh
   pnpm run build:xcode
   ```

2. Xcode で `xcode/Safari Keyboard Navigation Extension/Safari Keyboard Navigation Extension.xcodeproj` を開きます。
3. Signing & Capabilities で両 target に development team を設定するか、ローカル検証では Sign to Run Locally を選びます。
4. `Safari Keyboard Navigation Extension` scheme を実行します。
5. Safari Settings > Extensions で拡張を有効にし、website access を許可します。

## 開発

必要なもの:

- Node.js 20 以上
- pnpm 10 以上
- Safari extension app build 用の Xcode

依存関係をインストールします。

```sh
pnpm install
```

標準の検証を実行します。

```sh
pnpm run check
```

Safari が読み込む Web Extension package をビルドします。

```sh
pnpm run build:web
```

生成された Xcode app project をビルドします。

```sh
pnpm run build:xcode
```

TypeScript の source of truth は `src/` にあります。`web-extension/` の生成 JavaScript は `pnpm run build:web` で作られます。format と lint には Biome を使い、ESLint と Prettier は使いません。

## プロジェクト方針

- 拡張を監査しやすい小ささに保つ。
- synthetic automation より、通常の browser/page behavior を優先する。
- editable field と既存の website shortcut をできるだけ尊重する。
- Safari API の違いを、Chromium clone ではなく product constraint として扱う。
- user と contributor の両方に役立つ documentation を保つ。

## リポジトリ構成

- `src/`: 拡張ロジックの TypeScript source。
- `web-extension/`: Safari が読み込む Web Extension package。
- `xcode/`: 生成された macOS Safari Web Extension app project。
- `tests/`: 拡張ロジックの Node test suite。
- `manual-test/`: Safari での手動確認に使う local page。
- `docs/`: user、contributor、research、release、privacy、support documentation。

## ドキュメント

最初に読むと便利なドキュメント:

- [権限とプライバシー](permissions-and-privacy.md)
- [コントリビューション](contributing.md)
- [Documentation Language](process/documentation-language.md)
- [GitHub Workflow](process/github-workflow.md)
- [English README](../../README.md)

このプロジェクトでは英語ドキュメントを正本とします。日本語翻訳は `docs/ja/` 配下に置き、英語版をもとに作成します。英語版と日本語版の内容が異なる場合は英語版を優先します。

## 手動テスト

Safari に拡張を読み込んだあと、manual test page を HTTP で配信します。

```sh
python3 -m http.server 8765
```

その後、Safari で `http://localhost:8765/manual-test/` を開きます。

手動テストは、ブラウザ挙動、キーボード処理、Safari permissions、packaging、拡張 UI の見た目を変更したときに特に有用です。review を依頼する前には automated checks も通してください。

## コントリビューション

Issue と pull request は歓迎します。変更は focused に保ち、このプロジェクトの scope である「広いブラウザ自動化ではなく、Safari のキーボードナビゲーション」に沿わせてください。

Pull request を開く前に:

1. non-trivial な作業では issue を作るか、既存 issue を探す。
2. `main` から短命の branch を作る。
3. `pnpm run check` を実行する。
4. Safari extension packaging または macOS/Xcode の挙動を変えた場合は `pnpm run build:xcode` を実行する。
5. 挙動、permissions、commands、contributor workflow が変わる場合は documentation を更新する。

詳しくは [docs/ja/contributing.md](contributing.md) を参照してください。

## サポート

- バグ報告・機能リクエスト: [GitHub Issues](https://github.com/DaikiMiwa/iai-navigator/issues)
- 個別のお問い合わせ・セキュリティ報告: [support@mowa-mowa.com](mailto:support@mowa-mowa.com)
- 法的表記および利用規約: [サポートページ](https://daikimiwa.github.io/iai-navigator/support.html)

## ライセンス

本プロジェクトは [source-available license](../../LICENSE) のもとで公開されています。

Copyright (c) 2026 Daiki Miwa (mowa)

ソースコードの閲覧、監査、contribution のための fork、個人的かつ非商用のビルドは許可されます。商用再配布、App Store や browser extension store での再配布、project branding の利用には、事前の書面による許可が必要です。

Mac App Store 版は、Apple の標準エンドユーザ使用許諾契約（EULA）に基づく有料製品として別途配布されます。
