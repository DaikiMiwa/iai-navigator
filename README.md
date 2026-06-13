# Safari Keyboard Navigation Extension

A small Safari Web Extension for keyboard-first browsing.

Safari Keyboard Navigation Extension adds Vimium-like link hints, page movement, tab switching, URL copying, and a lightweight navigation palette to Safari without trying to become a full browser automation suite. The project is intentionally small, auditable, and privacy-conscious.

Inspired by projects such as [Vimium](https://github.com/philc/vimium) and [Vimari](https://github.com/televator-apps/vimari), this extension focuses on the Safari-specific parts of keyboard navigation: link hints that behave like normal clicks, smooth page movement, practical tab commands, and a palette that works within Safari's Web Extension limits.

## Features

- Show link hints with `f`, then type a hint to open the target in the current tab.
- Open hinted links in a new foreground tab with `Shift+F`.
- Move around pages with familiar keys such as `h`, `j`, `k`, `l`, `u`, `d`, `gg`, and `Shift+G`.
- Navigate browser history with `Shift+H` and `Shift+L`.
- Switch tabs with `Shift+J` and `Shift+K`.
- Copy the current page URL with `yy`.
- Open a navigation palette with `o` for tabs, local visit history, commands, URLs, searches, and browser-provided bookmarks or history when Safari exposes them.
- Open bookmark, history, and tab-focused palettes with `b`, `v`, and `Shift+T`.
- View available shortcuts with `?`.
- Keep normal typing behavior in text inputs, textareas, selects, and editable content.

Safari support differs from Chromium-based browsers in a few places, especially around bookmarks, history, PDFs, and extension APIs. The extension uses best-effort fallbacks where Safari limits access.

## Status

This project is in early development. The source code is published for transparency, review, and community contributions, but the project is source-available rather than open source. Behavior, naming, packaging, licensing, and release details may still change before the first stable public release.

## Usage

After enabling the extension in Safari, visit a normal web page and try these shortcuts:

| Shortcut | Action |
| --- | --- |
| `f` | Show hints for visible links and controls, then open the selected target in the current tab. |
| `Shift+F` | Show link hints and open the selected link in a new foreground tab. |
| `h` / `j` / `k` / `l` | Scroll left, down, up, or right. |
| `u` / `d` | Move up or down by half a page. |
| `gg` / `Shift+G` | Move to the top or bottom of the page. |
| `Shift+H` / `Shift+L` | Go back or forward in tab history. |
| `Shift+J` / `Shift+K` | Switch to the tab on the left or right. |
| `o` | Open the navigation palette. |
| `b` / `v` / `Shift+T` | Open bookmark, history, or open-tab palettes. |
| `yy` | Copy the current page URL. |
| `?` | Show the shortcut help overlay. |
| `Esc` | Cancel hint mode, close overlays, or blur focused editable fields. |

Shortcuts are ignored while typing in text fields and editable content, except for commands that intentionally leave editing focus such as `Esc`.

## Installation

### Temporary Safari Load

Use this path for quick local testing:

1. Build the Web Extension files:

   ```sh
   pnpm install
   pnpm run build:web
   ```

2. Open Safari > Settings.
3. Enable the Developer tab if needed from Advanced > Show features for web developers.
4. In Safari > Settings > Developer, enable Allow unsigned extensions.
5. Click Add Temporary Extension and select the `web-extension/` folder.
6. Enable the extension in Safari Settings > Extensions and grant website access.

Safari removes temporary extensions after 24 hours or when Safari quits.

### Xcode App Load

Use this path when testing the generated macOS Safari extension app:

1. Build the Xcode project:

   ```sh
   pnpm run build:xcode
   ```

2. Open `xcode/Safari Keyboard Navigation Extension/Safari Keyboard Navigation Extension.xcodeproj` in Xcode.
3. Select a development team for both targets in Signing & Capabilities, or choose Sign to Run Locally for unsigned local testing.
4. Run the `Safari Keyboard Navigation Extension` scheme.
5. Enable the extension in Safari Settings > Extensions and grant website access.

## Development

Requirements:

- Node.js 20 or newer
- pnpm 10 or newer
- Xcode for Safari extension app builds

Install dependencies:

```sh
pnpm install
```

Run the standard verification suite:

```sh
pnpm run check
```

Build the Web Extension package that Safari loads:

```sh
pnpm run build:web
```

Build the generated Xcode app project:

```sh
pnpm run build:xcode
```

The TypeScript source of truth lives in `src/`. Generated JavaScript in `web-extension/` is produced by `pnpm run build:web`. The project uses Biome for formatting and linting; ESLint and Prettier are intentionally not used.

## Project Philosophy

- Keep the extension small enough to audit.
- Prefer normal browser and page behavior over synthetic automation.
- Respect editable fields and existing website shortcuts where possible.
- Treat Safari API differences as product constraints instead of pretending the extension is a Chromium clone.
- Keep documentation useful for both users and contributors.

## Repository Layout

- `src/`: TypeScript source for the extension logic.
- `web-extension/`: Safari-loaded Web Extension package.
- `xcode/`: generated macOS Safari Web Extension app project.
- `tests/`: Node test suite for extension logic.
- `manual-test/`: local pages for manual Safari behavior checks.
- `docs/`: user, contributor, research, release, privacy, and support documentation.

## Documentation

Useful starting points:

- [Permissions and Privacy](docs/permissions-and-privacy.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Japanese documentation](docs/ja/README.md)

English documentation is canonical. Japanese translations live under `docs/ja/` and are derived from the English source. If an English document and its Japanese translation disagree, follow the English document.

## Manual Testing

After loading the extension in Safari, serve the manual test pages over HTTP:

```sh
python3 -m http.server 8765
```

Then open `http://localhost:8765/manual-test/` in Safari.

Manual testing is most useful when browser behavior, keyboard handling, Safari permissions, packaging, or visual extension UI changes. Automated checks should still pass before requesting review.

## Contributing

Issues and pull requests are welcome. Please keep changes focused and aligned with the project's scope: keyboard navigation for Safari without broad browser automation.

Before opening a pull request:

1. Open or find an issue for non-trivial work.
2. Create a short-lived branch from `main`.
3. Run `pnpm run check`.
4. Run `pnpm run build:xcode` when Safari extension packaging or macOS/Xcode behavior changes.
5. Update documentation when behavior, permissions, commands, or contributor workflow changes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor guide.

## Support

- Bug reports and feature requests: [GitHub Issues](https://github.com/DaikiMiwa/safari-keyboard-navigation-extension/issues)
- Private inquiries and security reports: [support@mowa-mowa.com](mailto:support@mowa-mowa.com)
- Legal disclosures and terms: [Support page](https://daikimiwa.github.io/safari-keyboard-navigation-extension/support.html)

## License

This project uses a [source-available license](LICENSE).

Copyright (c) 2026 Daiki Miwa (mowa).

You may read, audit, fork for contribution, and build the project for personal non-commercial use. Commercial redistribution, App Store or browser-extension-store redistribution, and use of project branding are not permitted without prior written permission.

The Mac App Store version is distributed separately as a paid product under Apple's Standard End User License Agreement (EULA).
