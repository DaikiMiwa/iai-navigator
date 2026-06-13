# App Store Release Checklist

This checklist tracks the remaining work before submitting the Safari Web Extension to App Store Connect.

## Positioning

- Choose a distinct product name that does not rely on Vim, Vimium, or Vomnibar naming.
- Describe the app as a keyboard-first Safari navigation tool, not as a clone or compatibility layer.
- Use App Store metadata that focuses on Safari-specific value, local-first privacy, Japanese IME safety, site controls, and a built-in command palette.
- Avoid third-party product names in the app name, subtitle, keywords, screenshots, and preview captions unless legal review confirms the usage is safe.

## Privacy And Permissions

- Publish a privacy policy URL before App Store submission.
- Reuse the wording from [Permissions and Privacy](../permissions-and-privacy.md) as the source of truth.
- State clearly that browsing data, page content, URLs, keystrokes, form values, and command palette queries are not sent to a developer-controlled server.
- Explain that Safari website access is needed to read visible page structure and place keyboard hints.
- Explain that tab, bookmark, and history access powers the command palette.
- Explain that bounded local storage is used for settings, recent palette queries, locally observed pages, and selected destinations.
- Confirm that no analytics, advertising SDKs, remote logging, or telemetry are included in the release build.
- Fill App Store Connect privacy answers from the actual release build and update them whenever data handling changes.

## Host App

- Ensure the host app has a useful first-run screen with Safari enablement instructions.
- Link to the privacy policy and support channel from the host app.
- Keep shortcut help, permission explanations, and site settings discoverable.
- Include a version number and a concise support/debug section.

## App Store Connect

- Create or update the macOS app record.
- Confirm bundle identifier, SKU, primary language, category, pricing, and availability.
- Add app name, subtitle, description, keywords, support URL, marketing URL if available, and privacy policy URL.
- Add review notes that explain the Safari extension permissions and the no-server data model.
- Add copyright and age rating answers.
- Decide whether the first release is paid upfront or free; defer subscriptions or in-app purchases unless StoreKit support is implemented and tested.

## Screenshots

- Capture the command palette searching tabs, bookmarks, history, commands, URLs, and search.
- Capture keyboard hints on a normal page.
- Capture site controls or shortcut settings.
- Capture the host app permission/privacy explanation.
- Avoid screenshots that imply affiliation with Vim, Vimium, Apple, YouTube, Google, or any other third-party service.
- Use fictional or non-sensitive browsing examples in screenshots.

## Build And Signing

- Set marketing version and build number.
- Confirm release bundle identifiers for the containing app and extension.
- Configure the Apple Developer Team and App Store signing.
- Archive a Release build in Xcode.
- Upload to App Store Connect.
- Save the uploaded build number in release notes.

## TestFlight And Review Readiness

- Test a clean install with a fresh Safari profile.
- Verify Safari enablement instructions from the host app.
- Verify website access denied, allowed for one site, and allowed for all websites.
- Verify `f`, `Shift+F`, `o`, `Shift+O`, `b`, `v`, `Shift+T`, `ge`, and `gE`.
- Verify Japanese IME composition and confirmation Enter do not trigger palette activation.
- Verify typing inside inputs, textareas, selects, and editable content is not intercepted.
- Verify Google Docs or another shortcut-heavy web app can be disabled by site settings.
- Verify YouTube controls are discoverable without breaking playback controls.
- Verify privacy-sensitive local file access is either excluded from the public release or clearly documented as opt-in.
- Run `pnpm run check`.
- Run `pnpm run build:xcode` before archiving.

## Review References

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Safari Extensions distribution overview: https://developer.apple.com/safari/extensions/
- App privacy details: https://developer.apple.com/app-store/app-privacy-details/
- App Store Connect privacy management: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
