# App Store リリースチェックリスト

このチェックリストは、Safari Web Extension を App Store Connect に提出する前の残タスクを管理するためのものです。

## ポジショニング

- Vim、Vimium、Vomnibar の名前に依存しない、独自の product name `IAI` を使う。
- clone や compatibility layer ではなく、keyboard-first な Safari navigation tool として説明する。
- App Store metadata では、Safari 固有の価値、local-first privacy、日本語 IME への配慮、site control、built-in command palette を前面に出す。
- 法務確認が取れるまでは、app name、subtitle、keywords、screenshot、preview caption に third-party product name を入れない。

## Privacy と権限

- App Store 提出前に privacy policy URL を公開する。
- App Store Connect privacy answer は [App Store Privacy Answers](app-store-privacy-answers.md) をもとに入力する。
- [権限とプライバシー](../permissions-and-privacy.md) を source of truth として再利用する。
- browsing data、page content、URL、keystroke、form value、command palette query を開発者管理の server に送らないことを明記する。
- keyboard hints を置くために、Safari の website access で visible page structure を読む必要があることを説明する。
- command palette のために tab access を使い、bookmark/history access は Safari が runtime で API を公開している場合だけローカルに使うことを説明する。
- settings、recent palette queries、locally observed pages、selected destinations のために bounded local storage を使うことを説明する。
- release build に analytics、advertising SDK、remote logging、telemetry が含まれていないことを確認する。
- App Store Connect の privacy answer は実際の release build に合わせ、data handling が変わったら更新する。

## ホストアプリ

- host app に Safari 有効化手順つきの first-run screen があることを確認する。
- host app から privacy policy と support channel にリンクする。
- shortcut help、permission explanation、site settings を見つけやすくする。
- version number と簡潔な support/debug section を含める。

## App Store Connect

- macOS app record を作成または更新する。
- bundle identifier、SKU、primary language、category、pricing、availability を確認する。
- 初回 release の macOS minimum requirement は macOS 14.0 or later にする。
- app name、subtitle、description、keywords、support URL、必要なら marketing URL、privacy policy URL を追加する。
- Safari extension permission と no-server data model を説明する review notes を追加する。
- copyright と age rating answer を入力する。
- 初回 release を paid upfront にするか free にするか決める。subscription や in-app purchase は StoreKit support が実装・検証されるまで延期する。

## スクリーンショット

- tabs、local destinations、commands、URLs、search、Safari が tested release で API を公開している場合だけ bookmark/history results を検索している command palette を撮る。
- 通常ページ上の keyboard hints を撮る。
- site controls または shortcut settings を撮る。
- host app の permission/privacy explanation を撮る。
- Vim、Vimium、Apple、YouTube、Google などとの提携を示唆する screenshot は避ける。
- screenshot には架空または非機密の browsing example を使う。

## Build と署名

- marketing version と build number を設定する。
- containing app と extension の release bundle identifiers を確認する。
- Apple Developer Team と App Store signing を設定する。
- Xcode で Release build を archive する。
- App Store Connect に upload する。
- upload した build number を release notes に残す。

## TestFlight と審査準備

- fresh Safari profile で clean install を確認する。
- host app の Safari 有効化手順を確認する。
- website access denied、1 site only、all websites を確認する。
- `f`、`Shift+F`、`o`、`Shift+O`、`b`、`v`、`Shift+T`、`ge`、`gE` を確認する。
- 日本語 IME composition と confirmation Enter が palette activation を誤発火しないことを確認する。
- input、textarea、select、editable content への入力が奪われないことを確認する。
- Google Docs など shortcut が多い web app を site settings で無効化できることを確認する。
- YouTube controls が playback controls を壊さずに見つかることを確認する。
- privacy-sensitive な local file access が public release から除外されていることを確認する。
- `pnpm run check` を実行する。
- archive 前に `pnpm run build:xcode` を実行する。
- App Store archive を作成する前に `pnpm run build:xcode:release` を実行する。

## Review references

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Safari Extensions distribution overview: https://developer.apple.com/safari/extensions/
- App privacy details: https://developer.apple.com/app-store/app-privacy-details/
- App Store Connect privacy management: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
