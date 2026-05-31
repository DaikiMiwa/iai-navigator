# Permissions and Privacy

Safari Keyboard Navigation runs locally in Safari. It does not include analytics, telemetry, advertising SDKs, remote logging, or network code for sending browsing data to a server.

## What the Extension Can Access

When a user grants website access in Safari, the content script can read the page structure on those websites. This includes visible links, buttons, form controls, media controls, element positions, and the current page URL.

When the browser navigation palette is enabled, the extension also requests browser-level access to open tabs, bookmarks, and recent history so the user can search and open those destinations from the keyboard.

The extension stores a bounded local list of pages it has observed while enabled and safe destinations the user explicitly opens from the command palette. Each entry contains only the page URL, page title, last observed or selected time, and visit count. This local index helps the command palette find destinations even when Safari does not expose bookmark or history APIs at runtime. The extension also stores a bounded local list of recent command palette queries so users can recall previous palette input from the keyboard.

The extension uses this access to:

- draw keyboard hint labels near visible targets;
- focus or click the selected target after a hint is typed;
- move the current page with keyboard shortcuts;
- copy the current page URL when the user presses the URL copy shortcut;
- switch tabs or open a selected link in a new tab;
- search open tabs, bookmarks, recent history, and locally observed page destinations when the command palette is open.
- open a user-entered search query in the configured search engine when the user explicitly selects a generated search result.

## What the Extension Does Not Collect

The extension does not:

- send page content, browsing history, URLs, keystrokes, or form values to an external server;
- store page content, form values, or full browser history;
- read cookies;
- use analytics or telemetry;
- record typed text from input fields;
- sync settings to a developer-controlled backend.

Settings, recent command palette queries, and the local observed-page and selected-destination index are intended to be stored in Safari extension storage on the user's device. Command palette search results are generated on demand and are not synced to a developer-controlled service. Users can forget individual recalled palette queries and extension-owned local visit results from the command palette. User-entered web searches leave the device only when the user chooses the generated search result, and then only to the configured search engine. Generated web search results are not stored in the local destination index.

## Website Access Modes

Safari controls which websites an extension can access. For privacy-sensitive use, users should grant access only on the websites where they want keyboard navigation.

The extension should also provide an in-extension allowlist/blocklist so users can disable keyboard navigation on sites with heavy native keyboard shortcuts, such as document editors or web apps.

## Local File Access

The development build supports local `file:` HTML pages. This is useful for generated reports and local documentation, but local file access is privacy-sensitive because local documents can contain private information.

For App Store distribution, local file support should either:

- be removed from the default public manifest; or
- be clearly documented as an optional capability that only works when the user explicitly grants local file access in Safari.

## App Review Note Draft

This app contains a Safari Web Extension for keyboard-first page navigation. The extension reads visible page elements only on websites where the user grants Safari extension access. Page structure is processed locally to display keyboard hint labels and run keyboard commands. The extension also uses Safari's tabs, bookmarks, and history APIs locally where available, and stores bounded on-device lists of recent command palette queries and observed or explicitly selected page URLs and titles, so users can search browser destinations from a command palette. The app does not send page content, browsing data, shortcut activity, or form values to any external server.
