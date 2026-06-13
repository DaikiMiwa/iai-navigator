# Privacy Policy

**Last Updated:** June 13, 2026

This Privacy Policy explains how IAI for Safari ("the Extension") handles your information. The Extension is designed with a local-first, privacy-respecting architecture. We do not collect, store, or transmit your personal data, browsing history, or keystrokes to any external servers.

---

## 1. No Data Collection

The Extension does not collect any personal information or browsing data. 
- **No Third-Party Analytics:** We do not use analytics, telemetry, or remote logging SDKs.
- **No Advertising:** The Extension does not contain advertising SDKs or tracking codes.
- **No External Sync:** Your settings and configuration are stored locally and are not synchronized to any developer-controlled cloud backend.

---

## 2. Safari Extension Permissions and Usage

To enable keyboard navigation, Safari requires you to grant certain permissions. Here is how these permissions are handled locally on your device:

### Webpage Access ("Access to Webpage Content")
- **Why it is needed:** The Extension needs to inspect the structure of the active webpage to identify clickable elements (such as links, buttons, and form inputs) and draw visual target labels (hints) near them.
- **How it is processed:** This processing is done entirely within your browser in real-time. No page content, webpage URLs, or elements are sent over the network.
- **IME Composition:** Keystrokes are monitored to trigger navigation shortcuts. Keyboard events are explicitly ignored when you are typing inside input fields, textareas, or during Japanese IME character composition.

### Browser-Level Access (Tabs, Bookmarks, and History)
- **Why it is needed:** These permissions are used exclusively to populate search results inside the Command Palette.
- **How it is processed:** When you open the Command Palette and type a search term, the Extension queries your local open tabs, bookmarks, and recent browsing history on-demand. All search matching, scoring, and rendering are performed locally.

---

## 3. Local On-Device Storage

The Extension saves a limited amount of configuration and index data locally inside your browser's extension storage (`browser.storage.local`):

- **Extension Settings:** Custom shortcuts, site blacklist/allowlist, hint styling configurations, and display language preferences.
- **Command Palette Query History:** A bounded list of your recent Command Palette queries, allowing you to recall them using keyboard shortcuts.
- **Local Visit Index:** A bounded local list of pages you have visited or opened via the Command Palette (storing only URL, title, last-accessed timestamp, and visit count). This local list is used to suggest frequent destinations directly inside the Command Palette without relying on remote network lookups.

All local data remains strictly on your device. You can clear your query history or local visits index at any time directly from the Command Palette interface.

---

## 4. Outbound Web Searches

If you perform a web search via the Command Palette, the search query is only transmitted off your device when you explicitly select a search result. 
- The query is sent directly to your configured search engine (such as Google, DuckDuckGo, Kagi, Brave, Wikipedia, or YouTube) or your custom URL template.
- We do not intercept, log, or track these queries.

---

## 5. Contact and Support

If you have any questions or feedback regarding this Privacy Policy, please open an issue in our official GitHub repository:
[GitHub Issues](https://github.com/DaikiMiwa/safari-keyboard-navigation-extension/issues)
