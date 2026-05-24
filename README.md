# Safari Keyboard Navigation Extension

Working-name repository for a small, auditable Safari Web Extension that provides Vimium-like link hints and page movement without becoming a full browser automation suite.

## MVP Behavior

- `f` shows yellow, black-text hints for visible link targets in the current viewport on normal `http` and `https` pages.
- Typing a complete hint fires that link's normal click behavior in the current tab.
- `Esc` cancels hint mode.
- `h`, `j`, `k`, and `l` scroll in small steps and continue smoothly while held.
- Pressing `g` twice quickly moves to the top of the page.
- `Shift+G` moves to the bottom of the page.
- `Shift+H` navigates back and `Shift+L` navigates forward in the current tab history.
- Text inputs, textareas, selects, and editable content keep normal typing behavior.
- PDFs get best-effort page movement only; PDF link hints are intentionally out of scope.

## Repository Layout

- `src/`: TypeScript source for the content scripts.
- `web-extension/`: Safari-loaded Web Extension package; JavaScript files are generated from `src/`.
- `xcode/`: generated macOS Safari Web Extension app project.
- `tests/`: Node tests for pure JavaScript logic.
- `CONTEXT.md`: project glossary and domain language.
- `docs/research/competitors.md`: competitor notes for Vimari, Vifari, and Vimlike.

## Documentation Language

English is the canonical language for project documentation. Japanese translations live under `docs/ja/` and are derived from the English source. If the English and Japanese documents disagree, follow the English version.

Start here for Japanese documentation:

- `docs/ja/README.md`
- `docs/ja/contributing.md`
- `docs/ja/process/documentation-language.md`
- `docs/ja/process/github-workflow.md`
- `docs/ja/strategy/why-use-this-app.md`

## Build And Test

The active `xcode-select` path on this machine may point at Command Line Tools. Use `DEVELOPER_DIR` so commands resolve against the installed Xcode app:

```sh
pnpm install
pnpm run check
pnpm run build:xcode
```

`src/*.ts` is the editing source of truth for script logic. `pnpm run build:web` compiles it to `web-extension/*.js`, which is what Safari and Xcode load. Biome is used for formatting and linting; ESLint is intentionally not used.

## Manual Test Page

After loading the extension in Safari, serve the manual test page over `http`:

```sh
python3 -m http.server 8765
```

Then open `http://localhost:8765/manual-test/` in Safari.

Useful checks:

- `f` shows hints only for visible links.
- Wrapped links receive one hint.
- Hidden links do not receive hints.
- `href="#"` and `javascript:` links activate through normal click behavior.
- `Esc` cancels hint mode.
- Typing in inputs, textareas, and editable content is not intercepted.
- `j/k` scroll vertically, `h/l` scroll horizontally where possible, `gg` moves to the top, and `Shift+G` moves to the bottom.
- Open `manual-test/history-a.html`, navigate to `history-b.html`, then verify `Shift+H` goes back and `Shift+L` goes forward.

## Load In Safari

### Fast Temporary Load

1. Open Safari > Settings.
2. Enable the Developer tab if needed from Advanced > Show features for web developers.
3. In Safari > Settings > Developer, enable Allow unsigned extensions.
4. Click Add Temporary Extension and select the `web-extension/` folder.
5. Enable the extension and grant website access.

Safari removes temporary extensions after 24 hours or when Safari quits.

### Xcode App Load

1. Open `xcode/Safari Keyboard Navigation Extension/Safari Keyboard Navigation Extension.xcodeproj` in Xcode.
2. In Signing & Capabilities, select a development team for both targets, or choose Sign to Run Locally if you are testing unsigned.
3. Run the `Safari Keyboard Navigation Extension` scheme.
4. In Safari, enable the extension in Settings > Extensions and grant website access.
5. For unsigned local development, enable Safari's Develop menu and allow unsigned extensions if Safari does not show the extension after running from Xcode.

The generated app name is a placeholder working name, not a product name.
