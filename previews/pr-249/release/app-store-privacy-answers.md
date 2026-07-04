# App Store Privacy Answers

Use these answers for the first App Store Connect privacy submission for IAI, based on the current release build.

## Recommended App Store Connect Answers

### Privacy Policy

- Privacy Policy URL: `https://daikimiwa.github.io/iai-navigator/privacy-policy.html`
- Japanese Privacy Policy URL: `https://daikimiwa.github.io/iai-navigator/ja/privacy-policy.html`
- User Privacy Choices URL: leave blank for the first release.

This GitHub Pages URL is preferred over the repository document URL because it is a public product-facing page.

### Data Collection

Question: Does this app collect data from this app?

Answer: No, this app does not collect data.

Rationale:

- The release build does not include analytics, advertising SDKs, telemetry, remote logging, or a developer-controlled server for browsing data.
- Page structure, tabs, bookmarks, history, settings, recent palette queries, and local visits are processed on device.
- The app stores settings, recent palette queries, and a bounded local visit index only in Safari extension storage on the user's device.
- The app does not transmit page content, browsing history, URLs, keystrokes, form values, settings, crash logs, diagnostics, or usage events to the developer.

### Tracking

Question: Do you or your third-party partners use data from this app to track users?

Answer: No.

Rationale:

- No app data is linked with third-party data for advertising or advertising measurement.
- No app data is shared with a data broker.
- No tracking SDKs or advertising SDKs are included.

### Data Types

Do not select any data types for the first release.

Local-only data that should not be selected as collected data under Apple's current definition:

- Browsing History: website URLs and page titles are used locally for command palette results and local visits, but they are not sent to the developer or third-party partners.
- Search History: recent command palette queries are stored locally for keyboard recall, but they are not sent to the developer or third-party partners.
- Usage Data: keyboard commands and result activation are processed locally and are not sent to the developer or third-party partners.
- Diagnostics: no crash reporting, remote logging, or diagnostics SDK is included.

User-initiated outbound searches:

- If the user explicitly selects a generated web search result, Safari navigates to the configured search engine or custom search URL.
- The developer does not intercept, log, receive, retain, or proxy those queries.
- Treat this as user-directed navigation, not developer collection. Keep the privacy policy wording clear about this behavior.

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
  - Runtime has no third-party app SDK dependencies.
  - Dev dependencies are TypeScript and Biome only.
- Network audit:
  - No `fetch`, `XMLHttpRequest`, `WebSocket`, or `sendBeacon` calls in `src/`, `web-extension/`, or the Xcode app code.
  - Search engine URLs are generated only when the user selects an outbound search result.

## Official Basis

Apple says App Store privacy answers must identify data collected by the developer or third-party partners, and defines "collect" as transmitting data off the device in a way that allows the developer or third-party partners to access it beyond what is needed for real-time servicing. Apple also says data processed only on device is not "collected" and does not need to be disclosed.

References:

- App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
- Manage App Privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
