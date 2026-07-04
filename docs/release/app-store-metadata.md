# App Store Metadata Draft

This draft is intentionally written without Vim, Vimium, or Vomnibar branding. The App Store listing should sell the product as its own Safari-native keyboard navigation tool.

## Naming Direction

Chosen app name: IAI.

Use a descriptive subtitle to explain the Safari-specific value.

Avoid:

- Vimium for Safari
- Vim-like Safari Extension
- Vomnibar for Safari
- Any name that implies compatibility, endorsement, or replacement of another product.

## Subtitle Options

- Keyboard-first Safari control
- Fast tab, link, and page control
- Private keyboard browsing tools

## Short Promotional Text

Control Safari from the keyboard with link hints, smooth page movement, tab switching, and a private command palette for tabs, local destinations, commands, URLs, search, and browser data Safari exposes at runtime.

## Description Draft

Navigate Safari without reaching for the mouse.

This Safari extension adds fast keyboard-first browsing tools for people who live in tabs, documents, dashboards, and research trails. Open link hints, move around pages, switch tabs, search browser destinations, and run common navigation commands from a single command palette.

Highlights:

- Link hints for visible links, buttons, non-password form controls, menus, media controls, and semantic web controls.
- Smooth keyboard scrolling, top and bottom jumps, reload, history back/forward, and tab switching.
- A command palette for open tabs, local page visits, extension commands, direct URLs, web search, and bookmark/history results when Safari exposes them at runtime.
- Fielded and scoped palette search with prefixes such as `tab:`, `book:`, `history:`, `cmd:`, `url:`, `search:`, `title:`, and `domain:`.
- Fast palette actions for copying URLs, copying Markdown links, editing URLs, narrowing by domain/title/URL, closing open-tab results, and opening results in current, foreground, or background tabs.
- Configurable shortcuts, site-specific controls, and hint appearance settings.
- Japanese IME-aware keyboard handling that avoids swallowing composition and confirmation keys.
- Local-first privacy: no analytics, no advertising SDKs, no telemetry, and no developer-controlled server for browsing data.

The extension runs locally in Safari. Website access is used to find visible page targets and place keyboard hints. Tab access powers the command palette, and bookmark/history access is used locally when Safari exposes those APIs at runtime. See the privacy policy for details.

## Keywords Draft

keyboard, safari extension, shortcuts, command palette, tab search, link hints, productivity, browser navigation, local search

Do not include third-party app names or trademarked terms as keywords unless legal review approves them.

## Compatibility

Requires macOS 14.0 or later for the first release.

## Review Notes Draft

This app contains a Safari Web Extension for keyboard-first page navigation. The extension reads visible page elements only on websites where the user grants Safari extension access. Page structure is processed locally to display keyboard hint labels and run keyboard commands.

The command palette uses Safari tabs and, where available at runtime, Safari bookmark and history APIs. It also stores bounded on-device lists of recent command palette queries and observed or explicitly selected page URLs and titles so users can search browser destinations from the keyboard.

The app does not include analytics, advertising SDKs, telemetry, remote logging, or any developer-controlled server for browsing data. It does not send page content, browsing data, shortcut activity, keystrokes, or form values to the developer.

Suggested review path:

1. Launch the app and follow the Safari enablement instructions.
2. Allow the extension on a test website.
3. Press `f` to show keyboard hints.
4. Press `o` to open the command palette.
5. Search an open tab, locally observed page, URL, command, or bookmark/history item if Safari exposes those APIs.
6. Press `Enter` to open or run the selected result.

## Screenshot Storyboard

1. Command palette searching across tabs, local destinations, commands, URLs, search, and browser-provided bookmark/history results when available.
2. Link hints on a normal web page.
3. Site controls and shortcut settings.
4. Privacy and permission explanation in the host app.
5. Japanese IME-safe command palette input, if the screenshot can be made clear without private user data.
