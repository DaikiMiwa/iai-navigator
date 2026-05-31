# Safari Keyboard Navigation Extension

Working-name repository for a small, auditable Safari Web Extension that provides Vimium-like link hints and page movement without becoming a full browser automation suite.

## MVP Behavior

- `f` shows compact yellow, black-text hints for visible link targets, safe navigation menu triggers, bounded media player controls, native form controls, and semantic custom controls in the current viewport on normal `http`, `https`, and local `file:` HTML pages.
- Typing a complete link hint fires that link's normal click behavior in the current tab.
- Typing a complete navigation menu trigger hint focuses the trigger first, safely clicks only explicit disclosure-style triggers if focus does not reveal links, and then rescans visible targets.
- Typing a complete media player control hint focuses and clicks visible controls inside recognized player chrome, such as YouTube's player controls.
- When recognized media controls are hidden, `f` may show a player-surface hint that focuses the player, sends a best-effort reveal event, and rescans for newly visible controls.
- Typing a complete form-control hint focuses text-entry controls with the caret at the end, or fires the control's normal click behavior for controls such as buttons, checkboxes, radios, and selects.
- Typing a complete semantic custom control hint fires that element's normal click/focus behavior for controls such as ARIA tabs, buttons, links, and inline expanders.
- `Shift+F` shows hints for visible `http` and `https` link targets and opens the chosen target in a new foreground tab.
- `Esc` cancels hint mode.
- `h`, `j`, `k`, and `l` scroll in smooth small steps and continue smoothly while held.
- `u` and `d` smoothly move up and down by half a page.
- Pressing `g` twice quickly moves to the top of the page.
- `Shift+G` moves to the bottom of the page.
- `Shift+H` navigates back and `Shift+L` navigates forward in the current tab history.
- `r` reloads the current page from normal page focus.
- `Esc` blurs focused text inputs, textareas, and editable content so normal page focus commands can resume.
- `Shift+J` switches to the tab on the left, and `Shift+K` switches to the tab on the right.
- `Option+Shift+J` and `Option+Shift+K` provide browser-level fallback tab switching when Safari Start Page, the address bar, or browser chrome has focus.
- `o` opens a browser navigation palette that searches open tabs across browser windows, bookmarks, recent history, locally observed pages, extension commands, direct URLs, and web searches with a configurable search engine.
- Palette prefixes can narrow intent: `tab:`, `book:`, `history:`, `visit:`, `cmd:`, `url:`, and `search:`. Search engine prefixes `g:`, `ddg:`, `br:`, and `k:` force Google, DuckDuckGo, Brave Search, and Kagi for a single query.
- `Option+C` copies the selected command palette browser destination URL without opening it.
- `Option+E` puts the selected command palette destination URL back into the input as `url: ...` so it can be edited before opening.
- `Option+Backspace` forgets the selected local visit result, or the currently recalled palette query.
- `Option+W` closes the selected open-tab result from the command palette.
- `Option+1` through `Option+9` activate the corresponding visible command palette result.
- `Option+Up` and `Option+Down` recall recent command palette queries.
- `Option+T/B/H/V/S/U/M` changes the command palette source to tabs, bookmarks, history, local visits, search, URL, or commands while preserving the current query.
- Browser destinations opened from the command palette are recorded locally so recently selected destinations are easier to find again.
- `Shift+O` opens palette results in a new foreground tab.
- The generated web search result can use Google, DuckDuckGo, Brave Search, Kagi, or a custom URL template with `{query}`.
- `b` and `Shift+B` search bookmarks in the current tab or a new foreground tab.
- `Shift+T` searches open tabs across browser windows.
- Pressing `y` twice quickly copies the current page URL and shows a small confirmation.
- `?` opens a keyboard shortcut help overlay, and `Esc` closes it.
- Text inputs, textareas, selects, and editable content keep normal typing behavior.
- PDFs get best-effort page movement only; PDF link hints are intentionally out of scope.

## Repository Layout

- `src/`: TypeScript source for the content scripts.
- `web-extension/`: Safari-loaded Web Extension package; JavaScript files are generated from `src/`.
- `xcode/`: generated macOS Safari Web Extension app project.
- `tests/`: Node tests for pure JavaScript logic.
- `CONTEXT.md`: project glossary and domain language.
- `docs/research/ipados-safari-support.md`: iPadOS Safari compatibility spike notes.
- `docs/research/bookmark-history-open-command.md`: compatibility spike for bookmark/history-backed destination search.

## Documentation Language

English is the canonical language for project documentation. Japanese translations live under `docs/ja/` and are derived from the English source. If the English and Japanese documents disagree, follow the English version.

For permission and privacy details, see [Permissions and Privacy](docs/permissions-and-privacy.md).

Start here for Japanese documentation:

- `docs/ja/README.md`
- `docs/ja/contributing.md`
- `docs/ja/process/documentation-language.md`
- `docs/ja/process/github-workflow.md`
- `docs/ja/research/ipados-safari-support.md`
- `docs/ja/research/bookmark-history-open-command.md`

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

- Visible links receive hints.
- Safe visible navigation menu triggers receive hints and rescan newly revealed links after activation.
- Visible bounded media player controls receive hints and activate through normal click/focus behavior.
- Visible native form controls receive hints.
- Visible semantic custom controls, such as `role="tab"`, receive hints.
- Inline semantic custom controls, such as `role="button"` expanders whose visible text provides the layout box, receive hints.
- Visible `aria-hidden` links, such as visual thumbnail links with a separate text link, receive hints.
- `Shift+F` opens visible `http` and `https` links in a new foreground tab.
- Completing hints for text inputs and textareas focuses the control with the caret at the end.
- Completing hints for checkboxes, radios, buttons, and selects fires normal click/focus behavior.
- Completing hints for semantic custom controls fires normal click/focus behavior.
- Completing hints for visible media controls fires normal click/focus behavior.
- On a YouTube watch page, pressing `f` should reveal hidden player controls before collecting hints where Safari and YouTube accept the synthetic reveal event; visible play/pause, mute, captions, settings, theater/miniplayer, and fullscreen controls receive hints.
- Disabled, hidden, and offscreen controls do not receive hints.
- Wrapped links receive one hint.
- Hidden links do not receive hints.
- `href="#"` and `javascript:` links activate through normal click behavior.
- Focus-revealed navigation menus and click-revealed disclosure menus can be opened through a hint, then newly visible menu links receive normal hints.
- `Esc` cancels hint mode.
- Typing in inputs, textareas, and editable content is not intercepted.
- `j/k` scroll vertically with smooth single steps, `h/l` scroll horizontally with smooth single steps where possible, held keys transition into continuous scrolling without a visible stutter, `u/d` smoothly move by half a page, `gg` moves to the top, and `Shift+G` moves to the bottom.
- Open `manual-test/history-a.html`, navigate to `history-b.html`, then verify `Shift+H` goes back and `Shift+L` goes forward.
- Press `r` from normal page focus and verify the Reload Command page load count increments.
- Press `r` while focused inside an input, textarea, or editable content and verify it types normally instead of reloading.
- Press `f`, then press `r` while hint mode is active and verify hint mode consumes the key instead of reloading.
- Press `f`, type the first character of a multi-character hint, and verify the typed prefix turns red while the remaining hint characters keep their normal color.
- Press `Esc` while focused inside a text input, textarea, or editable content and verify focus leaves the editable element.
- Open at least three Safari tabs with the extension enabled, then verify `Shift+J` switches to the left tab and `Shift+K` switches to the right tab.
- Focus Safari Start Page or the address bar, then verify `Option+Shift+J` switches to the left tab and `Option+Shift+K` switches to the right tab.
- Open a local `file:` HTML page, grant the extension local file access in Safari if prompted, then verify `f` shows hints and page movement commands work.
- Open `manual-test/frame-host.html`, click inside the frame, then verify `Shift+J/K` still switch tabs and `f` still shows hints inside the frame.
- Press `yy` and paste into the text input to verify the current page URL was copied.
- Press `y`, wait briefly, then press `y` again and verify the URL is not copied.
- Press `y`, then `Esc`, then `y` again and verify the URL is not copied.
- Press `f`, then press `yy` while hint mode is active and verify hint mode consumes the keys instead of copying the URL.
- Press `?` from normal page focus and verify the shortcut help overlay is readable, lists the current commands, and closes with `Esc`.
- Visit an `http` or `https` page with the extension enabled, open another page, press `o`, type the earlier page title or URL, and verify the locally observed page result can be opened.
- Press `o` from normal page focus, type a tab title, bookmark title, history URL, locally observed page, command name, URL, or search term, and verify `Enter` opens or runs the selected result.
- In the palette, type `url: example.com` and verify only a direct URL result appears; type `search: example.com` and verify only a web search result appears.
- In the palette, type `ddg: safari keyboard` and verify the generated search result uses DuckDuckGo; repeat with `g:`, `br:`, and `k:`.
- In the palette, verify `ArrowDown`, `ArrowUp`, `Ctrl+n`, `Ctrl+p`, `Tab`, and `Shift+Tab` move the selected result without leaving the palette.
- In the palette, verify `Shift+Enter`, `Command+Enter`, and `Control+Enter` open a browser destination in a new foreground tab.
- In the palette, verify `Alt+Enter` / `Option+Enter` opens a browser destination in a new background tab without activating it.
- In the palette, verify `Alt+C` / `Option+C` copies the selected browser destination URL without opening it.
- In the palette, verify `Alt+E` / `Option+E` changes the input to `url: <selected URL>` for a selected browser destination without closing the palette.
- In the palette, verify `Alt+Backspace` / `Option+Backspace` forgets a selected local visit result, or the currently recalled palette query.
- In the palette, verify `Alt+W` / `Option+W` closes the selected open-tab result and refreshes the result list.
- In the palette, verify `Alt+1` / `Option+1` through `Alt+9` / `Option+9` activate the matching visible numbered result.
- In the palette, verify `Alt+Up` / `Option+Up` and `Alt+Down` / `Option+Down` cycle through recent palette queries.
- In the palette, type `docs`, press `Alt+B` / `Option+B`, and verify the input changes to `book: docs`; then press `Alt+H` / `Option+H` and verify it changes to `history: docs`.
- Press `Shift+O`, type a URL or destination, and verify `Enter` opens it in a new foreground tab.
- Press `b` / `Shift+B` and verify only bookmarks are searched, with `Shift+B` opening the selected bookmark in a new foreground tab.
- Press `Shift+T` and verify open tabs across browser windows are searched and selected tabs are focused.
- Press `?` while focused inside an input, textarea, or editable content and verify it types normally instead of opening help.
- Press `f`, then press `?` while hint mode is active and verify hint mode consumes the key instead of opening help.
- Open `manual-test/nested-scroll.html`, then verify `j/k`, `u/d`, `gg`, and `Shift+G` move the internal scroll container.
- Open `manual-test/body-scroll.html`, then verify `j/k`, `u/d`, `gg`, and `Shift+G` move the body scroll container.

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
