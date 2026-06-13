# Bookmark And History Open Command Spike

Research date: 2026-05-24

## Executive Takeaway

Do not rely on the proposed `o` command as guaranteed direct Safari bookmark and history search yet.

The WebExtensions model has `bookmarks` and `history` APIs, but current public compatibility data marks both APIs as unsupported in Safari, and Apple's `WKWebExtension.Permission` constants do not list `bookmarks` or `history`. A Safari Web Extension-only implementation would therefore either fail outright or depend on undocumented behavior.

As of issue #62, the project has a guarded Browser Navigation Palette implementation. It uses the standard WebExtension `bookmarks` and `history` APIs only when those APIs exist at runtime, and it still works for open tabs and extension commands when they do not. Xcode packaging accepts the manifest permissions in a local Debug build, but real Safari bookmark/history runtime behavior still needs manual verification before this can be marketed as complete Safari bookmark/history search.

The next practical step is to keep the feature split into:

- WebExtension palette search for open tabs, extension commands, and any bookmark/history APIs Safari exposes at runtime;
- a native app bridge design, if real Safari bookmark/history access is required and Safari does not expose these APIs reliably; or
- a deferred hard guarantee until Safari documents support for this data.

## What Was Checked

Sources checked on 2026-05-24:

- Apple `WKWebExtension.Permission`: lists supported Safari Web Extension permission constants, including `tabs`, but not `bookmarks` or `history`.
- Apple Safari Web Extension documentation: documents Safari Web Extension packaging, permissions, and background scripts, but does not document Safari support for `browser.bookmarks` or `browser.history`.
- MDN `bookmarks` API: documents `browser.bookmarks` and the required `bookmarks` manifest permission for browsers that support the API.
- MDN `history` API: documents `browser.history` and the required `history` manifest permission for browsers that support the API.
- MDN browser-compat-data: marks Safari support for both top-level `bookmarks` and `history` WebExtension APIs as `version_added: false`.

## Compatibility Assessment

| Requirement | Current assessment |
| --- | --- |
| `browser.bookmarks` available in Safari | Not supported according to MDN browser-compat-data. |
| `browser.history` available in Safari | Not supported according to MDN browser-compat-data. |
| Required manifest permissions available | MDN documents `bookmarks` and `history`; Apple's current `WKWebExtension.Permission` constants do not list either one. |
| Background script access | The project already uses a background service worker for supported APIs such as `tabs`; bookmark/history access is the blocked part. |
| Xcode-packaged Safari extension viability | A local Debug Xcode build accepted `bookmarks` and `history` permissions on 2026-05-31. Runtime behavior still needs Safari manual testing. |

## Privacy Impact

Bookmark and history access is high-sensitivity browser data. If this feature is revisited, the project should keep these constraints:

- Do not collect, sync, or send bookmark/history data off-device.
- Prefer optional permissions only if Safari later supports them.
- Keep all matching local to the extension or native app.
- Document exactly what data is indexed, where it is stored, and how users can clear it.

## Recommended Issue Split

1. **Guarded direct bookmark/history search**
   - Use `browser.bookmarks` and `browser.history` only when present.
   - Keep the palette useful with tabs and extension commands if Safari omits either API.
   - Do not promise full Safari bookmark/history search until runtime testing proves it.

2. **Extension-maintained open command**
   - Optional smaller feature: `o` searches pages the extension has locally observed while enabled.
   - This would not search Safari bookmarks or complete browser history.
   - It needs a separate product decision because behavior differs from the original issue.

3. **Native bridge exploration**
   - Optional larger feature: a macOS app component reads Safari bookmark/history data through approved native mechanisms, if available and acceptable.
   - This is outside the current small Web Extension-only positioning and should require explicit approval before implementation.

## Sources

- Apple: WKWebExtension.Permission — https://developer.apple.com/documentation/webkit/wkwebextension/permission
- Apple: Safari web extensions — https://developer.apple.com/documentation/SafariServices/safari-web-extensions
- Apple: Creating a Safari web extension — https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension
- MDN: bookmarks API — https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks
- MDN: history API — https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history
- MDN browser-compat-data: bookmarks — https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/api/bookmarks.json
- MDN browser-compat-data: history — https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/api/history.json
