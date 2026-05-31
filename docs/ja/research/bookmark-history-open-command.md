# Bookmark And History Open Command Spike

この日本語版は `docs/research/bookmark-history-open-command.md` の翻訳です。内容が異なる場合は英語版を優先します。

調査日: 2026-05-24

## Executive Takeaway

提案されている `o` コマンドを、Safari の bookmark と history を必ず直接検索できる機能としてはまだ扱わない。

WebExtensions のモデルには `bookmarks` と `history` API があるが、現在公開されている互換性データではどちらも Safari 非対応とされている。また Apple の `WKWebExtension.Permission` constants にも `bookmarks` と `history` は含まれていない。Safari Web Extension だけで実装すると、失敗するか、未文書化の挙動に依存することになる。

issue #62 時点では、guard 付きの Browser Navigation Palette 実装を追加している。標準 WebExtension の `bookmarks` / `history` API は runtime に存在するときだけ使い、存在しない場合も open tabs と extension commands では動作する。local Debug の Xcode build では manifest permission は受け入れられたが、Safari 上で bookmark/history が実際に動くかは、完全な Safari bookmark/history search として打ち出す前に manual verification が必要である。

次の実用的な一手は、機能を分けたまま進めることである。

- open tabs、extension commands、Safari が runtime で公開する bookmark/history API を検索する WebExtension palette。
- Safari がこれらの API を安定して公開しない場合に備えた native app bridge の設計。
- Safari がこのデータのサポートを文書化するまで、hard guarantee は延期する。

## 確認したこと

2026-05-24 に確認した source:

- Apple `WKWebExtension.Permission`: `tabs` など、Safari Web Extension の対応 permission constants はあるが、`bookmarks` と `history` はない。
- Apple Safari Web Extension documentation: Safari Web Extension の packaging、permissions、background scripts は説明されているが、`browser.bookmarks` や `browser.history` の Safari 対応は説明されていない。
- MDN `bookmarks` API: 対応ブラウザ向けに `browser.bookmarks` と必須の `bookmarks` manifest permission を説明している。
- MDN `history` API: 対応ブラウザ向けに `browser.history` と必須の `history` manifest permission を説明している。
- MDN browser-compat-data: Safari での top-level `bookmarks` / `history` WebExtension API をどちらも `version_added: false` としている。

## 互換性評価

| 要件 | 現時点の評価 |
| --- | --- |
| Safari で `browser.bookmarks` が使える | MDN browser-compat-data では非対応。 |
| Safari で `browser.history` が使える | MDN browser-compat-data では非対応。 |
| 必要な manifest permission が使える | MDN は `bookmarks` と `history` を説明しているが、Apple の現在の `WKWebExtension.Permission` constants にはどちらもない。 |
| background script からアクセスできる | このプロジェクトはすでに `tabs` のような対応 API で background service worker を使っている。詰まっているのは bookmark/history access。 |
| Xcode packaged Safari extension として成立する | 2026-05-31 の local Debug Xcode build では `bookmarks` / `history` permission は受け入れられた。runtime behavior は Safari manual test が必要。 |

## Privacy Impact

Bookmark と history access は機微なブラウザデータである。この機能を再検討する場合、次の制約を維持する。

- bookmark/history data を off-device に収集、同期、送信しない。
- Safari が将来サポートする場合は、可能な限り optional permissions を優先する。
- matching は extension または native app のローカル内に閉じる。
- どのデータを index し、どこに保存し、ユーザーがどう削除できるかを明記する。

## 推奨する Issue 分割

1. **Guard 付き直接 bookmark/history search**
   - `browser.bookmarks` と `browser.history` は存在するときだけ使う。
   - Safari がどちらかの API を提供しない場合でも、tabs と extension commands で palette が使えるようにする。
   - runtime test で証明されるまで、完全な Safari bookmark/history search としては約束しない。

2. **Extension-maintained open command**
   - 小さめの optional feature として、`o` が extension 有効中にローカルで観測したページを検索する。
   - Safari bookmarks や完全な browser history は検索しない。
   - 元 issue と挙動が違うため、別途プロダクト判断が必要。

3. **Native bridge exploration**
   - より大きな optional feature として、macOS app component が利用可能で承認済みの native mechanism から Safari bookmark/history data を読む。
   - 現在の小さな Web Extension-only の位置づけからは外れるため、実装前に明示的な承認が必要。

## Sources

- Apple: WKWebExtension.Permission — https://developer.apple.com/documentation/webkit/wkwebextension/permission
- Apple: Safari web extensions — https://developer.apple.com/documentation/SafariServices/safari-web-extensions
- Apple: Creating a Safari web extension — https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension
- MDN: bookmarks API — https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks
- MDN: history API — https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history
- MDN browser-compat-data: bookmarks — https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/api/bookmarks.json
- MDN browser-compat-data: history — https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/api/history.json
