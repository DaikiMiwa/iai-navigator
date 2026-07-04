# App Store Privacy Answers

IAI の初回 App Store Connect privacy submission では、現在の release build に基づいて以下の回答を使う。

## Recommended App Store Connect Answers

### Privacy Policy

- Privacy Policy URL: `https://daikimiwa.github.io/iai-navigator/privacy-policy.html`
- 日本語版 Privacy Policy URL: `https://daikimiwa.github.io/iai-navigator/ja/privacy-policy.html`
- User Privacy Choices URL: 初回 release では空欄にする。

この GitHub Pages URL は公開 product-facing page なので、repository document URL より優先する。

### Data Collection

Question: Does this app collect data from this app?

Answer: No, this app does not collect data.

Rationale:

- release build には analytics、advertising SDK、telemetry、remote logging、developer-controlled server for browsing data が含まれていない。
- page structure、tabs、bookmarks、history、settings、recent palette queries、local visits は端末上で処理される。
- app は settings、recent palette queries、bounded local visit index を、ユーザー端末上の Safari extension storage にだけ保存する。
- page content、browsing history、URLs、keystrokes、form values、settings、crash logs、diagnostics、usage events を developer に送信しない。

### Tracking

Question: Do you or your third-party partners use data from this app to track users?

Answer: No.

Rationale:

- app data を advertising や advertising measurement のために third-party data と結びつけない。
- app data を data broker と共有しない。
- tracking SDK や advertising SDK は含まれていない。

### Data Types

初回 release では data type を選択しない。

Apple の現在の定義では、以下の local-only data は collected data として選択しない。

- Browsing History: website URL と page title は command palette results と local visits のためにローカルで使うが、developer や third-party partners へ送信しない。
- Search History: recent command palette queries は keyboard recall のためにローカル保存するが、developer や third-party partners へ送信しない。
- Usage Data: keyboard commands と result activation はローカルで処理し、developer や third-party partners へ送信しない。
- Diagnostics: crash reporting、remote logging、diagnostics SDK は含まれていない。

User-initiated outbound searches:

- ユーザーが generated web search result を明示的に選択した場合、Safari は configured search engine または custom search URL へ移動する。
- developer はその query を intercept、log、receive、retain、proxy しない。
- これは user-directed navigation として扱い、developer collection とは扱わない。privacy policy ではこの挙動を明確に説明し続ける。

## Review Notes Snippet

This app contains a Safari Web Extension for keyboard-first page navigation. The extension reads visible page elements only on websites where the user grants Safari extension access. Page structure is processed locally to display keyboard hint labels and run keyboard commands.

The command palette uses Safari tabs and, where Safari exposes the APIs at runtime, bookmarks and history locally. The app stores bounded on-device lists of recent command palette queries and observed or explicitly selected page URLs and titles in Safari extension storage so users can search browser destinations from the keyboard.

The app does not include analytics, advertising SDKs, telemetry, remote logging, crash reporting, or any developer-controlled server for browsing data. It does not send page content, browsing data, shortcut activity, keystrokes, form values, settings, diagnostics, or command palette queries to the developer.

## Release Build Evidence

- Web extension permissions: `storage`, `tabs`, `bookmarks`, `history`.
- Host permissions: `http://*/*`, `https://*/*`.
- Local storage keys:
  - `settings`
  - `commandPaletteQueryHistory`
  - `paletteLocalVisits`
- Dependency audit:
  - runtime には third-party app SDK dependency がない。
  - dev dependencies は TypeScript と Biome のみ。
- Network audit:
  - `src/`、`web-extension/`、Xcode app code に `fetch`、`XMLHttpRequest`、`WebSocket`、`sendBeacon` call はない。
  - search engine URL は、ユーザーが outbound search result を選んだ場合だけ生成される。

## Official Basis

Apple は App Store privacy answer で、developer または third-party partners が collect する data を特定する必要があると説明している。また Apple は "collect" を、real-time service に必要な範囲を超えて developer または third-party partners が access できる形で data を端末外へ送信すること、と定義している。Apple は、端末上でのみ処理される data は "collected" ではなく、回答で開示する必要はないとも説明している。

References:

- App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Manage App Privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
