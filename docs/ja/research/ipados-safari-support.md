# iPadOS Safari 対応 Spike

調査日: 2026-05-24

## 要約

現在の Web Extension ソースパッケージは iPadOS Safari に移植できる可能性が高い一方、現在の Xcode wrapper は macOS 専用です。iPadOS 対応は macOS MVP のコマンド設計を変える作業ではなく、packaging と実機検証の後続作業として扱うべきです。

Apple は Safari extensions を iPhone、iPad、Mac で利用できるものとして説明しており、Safari web extensions は macOS app と iOS / iPadOS app の一方または両方を含む Xcode project に変換できるとしています。また、既存の macOS Safari web extension は command-line converter を `--rebuild-project` 付きで再実行することで iOS / iPadOS 対応に更新できるとしています。

## 現在のプロジェクトとの適合

この拡張のロジックは、大部分が page-level content script の挙動です。

- link/control hints は通常の Web ページ内で動きます。
- `h/j/k/l`、`u/d`、`gg`、`Shift+G` は DOM の scroll API を使います。
- `Shift+H` と `Shift+L` は `window.history` を使います。
- `Shift+J/K` と new-tab hint activation は、background script との WebExtension `tabs` messaging に依存します。

多くのコマンドが Web content 内で完結するため、この形は iPadOS 対応の出発点としては妥当です。特に検証が必要なのは、外部キーボードの key event delivery と tab API です。

## 必要なプロジェクト変更

iPadOS 対応を主張する前に、少なくとも次の変更が必要になる見込みです。

- iOS / iPadOS 対応を含めて Safari Web Extension の Xcode wrapper を再生成または再構築する。
- iOS / iPadOS app と extension target、signing settings、bundle identifiers、icons、App Store / TestFlight metadata を追加する。
- 生成された iOS / iPadOS extension target が同じ `web-extension/` package files を含むことを確認する。
- ローカル開発を Xcode/device deployment、TestFlight、App Store Connect packaging のどれで行うか決める。
- iPadOS Safari settings で拡張を有効化する手順を manual test instructions に追加する。

現在の `manifest.json` は、iPadOS だけを理由に大きく書き換える必要はなさそうです。ただし、background script が使う permission と API は実機で確認する必要があります。

## コマンド検証マトリクス

| コマンド領域 | iPadOS での見込み | 必要な検証 |
| --- | --- | --- |
| `f` と `Shift+F` の link/control hints | 通常の Web ページでは動く可能性が高い | 外部キーボードの key event delivery、hint overlay layout、new-tab behavior |
| `h/j/k/l`、`u/d`、`gg`、`Shift+G` の page movement | 通常の Web ページでは動く可能性が高い | 外部キーボードの key event delivery、scroll behavior、PDF behavior |
| `Shift+H/L` の history | page history がある場所では動く可能性が高い | page-level keyboard handling と Safari history behavior |
| `Shift+J/K` の tab switching | リスクあり | content scripts は page focus 内でしか key を受け取れない可能性があり、browser-level surface には別の command fallback が必要 |
| browser-level fallback shortcuts | Safari/iPadOS 検証が必要 | WebExtension `commands` shortcuts が外部キーボードで表示・利用しやすいか |
| `yy` の clipboard command | 検証が必要 | iPadOS での clipboard permission と user-gesture behavior |

## 後続作業

- macOS MVP が安定したあと、iPadOS packaging issue を作る。
- 現行 iPadOS の実機 1 台以上と外部キーボード 1 台以上を含む device-test checklist を追加する。
- 動かないコマンドがあれば、MVP を広げずに個別の follow-up issue に分ける。
- 物理デバイスでの確認が記録されるまで、iPadOS 対応を release claim に含めない。

## 未解決の質問

- 外部キーボード接続時、Safari on iPadOS は `f`、`h`、`j`、`k`、`l` のような modifier なしの letter keydown events を content scripts に一貫して渡すか。
- `Alt` / Option ベースの WebExtension command shortcuts は iPadOS hardware keyboard で見つけやすく、信頼できるか。
- `active: true` を付けた `tabs.create` は `Shift+F` が期待する foreground-tab behavior と一致するか。
- Safari の extension shortcut management は iPadOS versions 間で一貫しているか。
- このプロジェクトがサポート対象にする最小 iPadOS version はどこか。
