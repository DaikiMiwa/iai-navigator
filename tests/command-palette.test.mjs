import assert from "node:assert/strict";
import test from "node:test";

globalThis.SafariKeyboardNavigationHints = {
  DEFAULT_HINT_KEYS: "asdfghjkl",
  generateHints: () => [],
  hasPrefixCollision: () => false,
};

globalThis.SafariKeyboardNavigationHelp = {
  HELP_SECTIONS: [],
  isHelpCloseCommandEvent: () => false,
  isHelpCommandEvent: () => false,
};

globalThis.SafariKeyboardNavigationScroll = {
  WINDOW_SURFACE_ID: "window",
  canMoveScrollPosition: () => false,
  chooseScrollSurface: () => "window",
  isScrollableOverflow: () => false,
  maxScroll: () => 0,
};

globalThis.window = {
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  setTimeout,
  clearTimeout,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => undefined,
};

await import("../web-extension/settings.js");
await import("../web-extension/content.js");

const { commandPaletteKeyAction } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteDeletePreviousWordValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteMarkdownLinkValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteDomainFilterValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteTitleFilterValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteUrlFilterValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteNextIndexAfterActivation } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteApplyPrefixValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteEditableResultValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteHistoryNavigation } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteHighlightRanges } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteCommandIds } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteCommandSearchIds } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteCurrentUrlEditValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteQueryScope } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteShouldCloseAfterActivation } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { recentPaletteQueryResultTitles } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { COMMAND_PALETTE_FOOTER_HINTS } =
  globalThis.SafariKeyboardNavigationCommandPalette;

const defaultPaletteOptions = {
  generatedKinds: ["url", "search"],
  includeCommands: true,
  includeGenerated: true,
  sources: ["tabs", "bookmarks", "history", "visits"],
};

function key(overrides) {
  return {
    altKey: false,
    ctrlKey: false,
    isComposing: false,
    key: "",
    keyCode: 0,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  };
}

test("maps command palette navigation keys", () => {
  assert.equal(commandPaletteKeyAction(key({ key: "ArrowDown" })), "next");
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "n" })),
    "next",
  );
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "j" })),
    "next",
  );
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "J" })),
    "next",
  );
  assert.equal(commandPaletteKeyAction(key({ key: "Tab" })), "next");
  assert.equal(commandPaletteKeyAction(key({ key: "ArrowUp" })), "previous");
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "p" })),
    "previous",
  );
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "k" })),
    "previous",
  );
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "K" })),
    "previous",
  );
  assert.equal(
    commandPaletteKeyAction(key({ key: "Tab", shiftKey: true })),
    "previous",
  );
  assert.equal(commandPaletteKeyAction(key({ key: "PageDown" })), "page-next");
  assert.equal(
    commandPaletteKeyAction(key({ key: "PageUp" })),
    "page-previous",
  );
  assert.equal(commandPaletteKeyAction(key({ key: "Home" })), "first");
  assert.equal(commandPaletteKeyAction(key({ key: "End" })), "last");
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "u" })),
    "clear-query",
  );
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "U" })),
    "clear-query",
  );
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "w" })),
    "delete-previous-word",
  );
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "W" })),
    "delete-previous-word",
  );
});

test("maps command palette activation keys", () => {
  assert.equal(
    commandPaletteKeyAction(key({ key: "Enter" })),
    "activate-current-tab",
  );
  assert.equal(
    commandPaletteKeyAction(key({ key: "Enter", shiftKey: true })),
    "activate-new-tab",
  );
  assert.equal(
    commandPaletteKeyAction(key({ key: "Enter", metaKey: true })),
    "activate-new-tab",
  );
  assert.equal(
    commandPaletteKeyAction(key({ key: "Enter", ctrlKey: true })),
    "activate-new-tab",
  );
  assert.equal(
    commandPaletteKeyAction(key({ key: "Enter", altKey: true })),
    "activate-background-tab",
  );
  assert.equal(
    commandPaletteKeyAction(key({ isComposing: true, key: "Enter" })),
    null,
  );
  assert.equal(
    commandPaletteKeyAction(key({ key: "Enter", keyCode: 229 })),
    null,
  );
  assert.equal(
    commandPaletteKeyAction(key({ isComposing: true, key: "a" })),
    null,
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "c" })),
    "copy-result-url",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "C" })),
    "copy-result-url",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "y" })),
    "copy-result-markdown",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "Y" })),
    "copy-result-markdown",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "e" })),
    "edit-result-url",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "E" })),
    "edit-result-url",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "d" })),
    "narrow-to-domain",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "D" })),
    "narrow-to-domain",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "f" })),
    "narrow-to-title",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "F" })),
    "narrow-to-title",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "u" })),
    "narrow-to-url",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "U" })),
    "narrow-to-url",
  );
  assert.deepEqual(
    commandPaletteKeyAction(key({ altKey: true, key: "U", shiftKey: true })),
    { kind: "apply-prefix", prefix: "url" },
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "r" })),
    "refresh-results",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "R" })),
    "refresh-results",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "w" })),
    "close-tab",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "W" })),
    "close-tab",
  );
  assert.deepEqual(
    commandPaletteKeyAction(key({ altKey: true, code: "Digit1", key: "1" })),
    { kind: "activate-index", index: 0 },
  );
  assert.deepEqual(
    commandPaletteKeyAction(key({ altKey: true, code: "Digit9", key: "9" })),
    { kind: "activate-index", index: 8 },
  );
  assert.deepEqual(
    commandPaletteKeyAction(key({ altKey: true, code: "Digit3", key: "£" })),
    { kind: "activate-index", index: 2 },
  );
  assert.deepEqual(
    commandPaletteKeyAction(
      key({ altKey: true, code: "Digit4", key: "$", shiftKey: true }),
    ),
    { disposition: "new-tab", kind: "activate-index", index: 3 },
  );
  assert.deepEqual(
    commandPaletteKeyAction(
      key({ altKey: true, code: "Digit5", ctrlKey: true, key: "5" }),
    ),
    { disposition: "background-tab", kind: "activate-index", index: 4 },
  );
  assert.equal(
    commandPaletteKeyAction(
      key({
        altKey: true,
        code: "Digit6",
        ctrlKey: true,
        key: "6",
        shiftKey: true,
      }),
    ),
    null,
  );
  assert.deepEqual(
    commandPaletteKeyAction(key({ altKey: true, code: "KeyB", key: "∫" })),
    { kind: "apply-prefix", prefix: "book" },
  );
  assert.deepEqual(commandPaletteKeyAction(key({ altKey: true, key: "H" })), {
    kind: "apply-prefix",
    prefix: "history",
  });
  assert.deepEqual(commandPaletteKeyAction(key({ altKey: true, key: "m" })), {
    kind: "apply-prefix",
    prefix: "cmd",
  });
  assert.deepEqual(commandPaletteKeyAction(key({ altKey: true, key: "a" })), {
    kind: "apply-prefix",
    prefix: "all",
  });
  assert.deepEqual(commandPaletteKeyAction(key({ altKey: true, key: "A" })), {
    kind: "apply-prefix",
    prefix: "all",
  });
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "Backspace" })),
    "forget-palette-entry",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "Delete" })),
    "forget-palette-entry",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "ArrowUp" })),
    "history-previous",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "ArrowDown" })),
    "history-next",
  );
});

test("maps command palette close and ignores text input keys", () => {
  assert.equal(commandPaletteKeyAction(key({ key: "Escape" })), "close");
  assert.equal(commandPaletteKeyAction(key({ key: "a" })), null);
  assert.equal(commandPaletteKeyAction(key({ key: "j" })), null);
  assert.equal(commandPaletteKeyAction(key({ key: "k" })), null);
  assert.equal(commandPaletteKeyAction(key({ key: "1" })), null);
  assert.deepEqual(
    commandPaletteKeyAction(
      key({ altKey: true, code: "Digit1", key: "1", shiftKey: true }),
    ),
    { disposition: "new-tab", kind: "activate-index", index: 0 },
  );
});

test("describes command palette activation and source-prefix hints", () => {
  const hints = COMMAND_PALETTE_FOOTER_HINTS.join(" ");
  assert.match(hints, /Enter/);
  assert.match(hints, /Shift\+Enter/);
  assert.match(hints, /Option\+Enter/);
  assert.match(hints, /Option\+C/);
  assert.match(hints, /Option\+Y/);
  assert.match(hints, /Option\+E/);
  assert.match(hints, /Option\+D/);
  assert.match(hints, /Option\+F/);
  assert.match(hints, /Option\+U/);
  assert.match(hints, /Option\+⌫/);
  assert.match(hints, /Option\+W/);
  assert.match(hints, /Option\+1-9/);
  assert.match(hints, /Ctrl\+J\/K/);
  assert.match(hints, /Ctrl\+U\/W/);
  assert.match(hints, /Option\+R/);
  assert.match(hints, /Option\+↑\/↓/);
  assert.match(hints, /Option\+A\/T\/B\/H\/V\/S\/M/);
  assert.match(hints, /Shift\+Option\+U/);
  assert.match(hints, /tab:/);
  assert.match(hints, /book:/);
  assert.match(hints, /history:/);
  assert.match(hints, /visit:/);
  assert.match(hints, /search:/);
  assert.match(hints, /g:/);
  assert.match(hints, /ddg:/);
  assert.match(hints, /br:/);
  assert.match(hints, /k:/);
  assert.match(hints, /yt:/);
  assert.match(hints, /w:/);
  assert.match(hints, /url:/);
  assert.match(hints, /cmd:/);
});

test("keeps the command palette open after background activation", () => {
  assert.equal(
    commandPaletteShouldCloseAfterActivation({
      disposition: "current-tab",
      resultKind: "tab",
    }),
    true,
  );
  assert.equal(
    commandPaletteShouldCloseAfterActivation({
      disposition: "new-tab",
      resultKind: "bookmark",
    }),
    true,
  );
  assert.equal(
    commandPaletteShouldCloseAfterActivation({
      disposition: "background-tab",
      resultKind: "history",
    }),
    false,
  );
  assert.equal(
    commandPaletteShouldCloseAfterActivation({
      disposition: "background-tab",
      resultKind: "command",
    }),
    false,
  );
});

test("advances the command palette selection after background browser activation", () => {
  assert.equal(
    commandPaletteNextIndexAfterActivation({
      activeIndex: 0,
      disposition: "background-tab",
      resultCount: 4,
      resultKind: "bookmark",
    }),
    1,
  );
  assert.equal(
    commandPaletteNextIndexAfterActivation({
      activeIndex: 3,
      disposition: "background-tab",
      resultCount: 4,
      resultKind: "history",
    }),
    0,
  );
  assert.equal(
    commandPaletteNextIndexAfterActivation({
      activeIndex: 2,
      disposition: "background-tab",
      resultCount: 4,
      resultKind: "command",
    }),
    2,
  );
  assert.equal(
    commandPaletteNextIndexAfterActivation({
      activeIndex: 2,
      disposition: "new-tab",
      resultCount: 4,
      resultKind: "bookmark",
    }),
    2,
  );
});

test("lists tab operation commands in the command palette", () => {
  const commandIds = commandPaletteCommandIds();
  assert.equal(commandIds.includes("history-back"), true);
  assert.equal(commandIds.includes("history-forward"), true);
  assert.equal(commandIds.includes("new-tab"), true);
  assert.equal(commandIds.includes("duplicate-current-tab"), true);
  assert.equal(commandIds.includes("close-current-tab"), true);
  assert.equal(commandIds.includes("previous-tab"), true);
  assert.equal(commandIds.includes("next-tab"), true);
  assert.equal(commandIds.includes("edit-current-url"), true);
});

test("matches command palette command aliases", () => {
  assert.equal(commandPaletteCommandSearchIds("back")[0], "history-back");
  assert.equal(commandPaletteCommandSearchIds("forward")[0], "history-forward");
  assert.equal(commandPaletteCommandSearchIds("nt")[0], "new-tab");
  assert.equal(
    commandPaletteCommandSearchIds("dup")[0],
    "duplicate-current-tab",
  );
  assert.equal(
    commandPaletteCommandSearchIds("close tab")[0],
    "close-current-tab",
  );
  assert.equal(commandPaletteCommandSearchIds("prev tab")[0], "previous-tab");
  assert.equal(commandPaletteCommandSearchIds("next tab")[0], "next-tab");
  assert.equal(commandPaletteCommandSearchIds("options")[0], "open-settings");
  assert.equal(commandPaletteCommandSearchIds("gg")[0], "scroll-top");
  assert.equal(commandPaletteCommandSearchIds("ge")[0], "edit-current-url");
  assert.equal(
    commandPaletteCommandSearchIds("edit current url")[0],
    "edit-current-url",
  );
});

test("applies command palette source prefixes while preserving query text", () => {
  assert.equal(commandPaletteApplyPrefixValue("docs", "book"), "book: docs");
  assert.equal(
    commandPaletteApplyPrefixValue("tab: docs", "history"),
    "history: docs",
  );
  assert.equal(
    commandPaletteApplyPrefixValue("  ddg: safari keyboard", "search"),
    "search: safari keyboard",
  );
  assert.equal(
    commandPaletteApplyPrefixValue("unknown: docs", "tab"),
    "tab: unknown: docs",
  );
  assert.equal(commandPaletteApplyPrefixValue("book: docs", "all"), "docs");
  assert.equal(
    commandPaletteApplyPrefixValue("unknown: docs", "all"),
    "unknown: docs",
  );
  assert.equal(commandPaletteApplyPrefixValue("", "cmd"), "cmd: ");
});

test("formats editable command palette result URLs", () => {
  assert.equal(
    commandPaletteEditableResultValue({
      kind: "bookmark",
      url: "https://example.com/docs",
    }),
    "url: https://example.com/docs",
  );
  assert.equal(
    commandPaletteEditableResultValue({
      kind: "search",
      url: "https://www.google.com/search?q=docs",
    }),
    "url: https://www.google.com/search?q=docs",
  );
  assert.equal(commandPaletteEditableResultValue({ kind: "command" }), null);
  assert.equal(commandPaletteEditableResultValue({ kind: "history" }), null);
});

test("formats command palette domain filter values", () => {
  assert.equal(
    commandPaletteDomainFilterValue("docs", {
      url: "https://Example.com/docs",
    }),
    "domain:example.com",
  );
  assert.equal(
    commandPaletteDomainFilterValue("book: docs", {
      url: "https://docs.example.com/path",
    }),
    "book: domain:docs.example.com",
  );
  assert.equal(
    commandPaletteDomainFilterValue("url: https://example.com", {
      url: "https://docs.example.com/path",
    }),
    "domain:docs.example.com",
  );
  assert.equal(
    commandPaletteDomainFilterValue("docs", { url: "javascript:alert(1)" }),
    null,
  );
  assert.equal(commandPaletteDomainFilterValue("docs", {}), null);
});

test("formats command palette title filter values", () => {
  assert.equal(
    commandPaletteTitleFilterValue("docs", {
      kind: "bookmark",
      title: "Project Docs",
    }),
    'title:"Project Docs"',
  );
  assert.equal(
    commandPaletteTitleFilterValue("book: docs", {
      kind: "bookmark",
      title: "Project Docs",
    }),
    'book: title:"Project Docs"',
  );
  assert.equal(
    commandPaletteTitleFilterValue("url: https://example.com", {
      kind: "url",
      title: "Open https://example.com",
    }),
    'title:"Open https://example.com"',
  );
  assert.equal(
    commandPaletteTitleFilterValue("docs", {
      kind: "history",
      title: 'Project "Docs"',
    }),
    'title:"Project Docs"',
  );
  assert.equal(
    commandPaletteTitleFilterValue("docs", {
      kind: "command",
      title: "Open settings",
    }),
    null,
  );
  assert.equal(commandPaletteTitleFilterValue("docs", { title: "  " }), null);
});

test("formats command palette URL filter values", () => {
  assert.equal(
    commandPaletteUrlFilterValue("docs", {
      kind: "history",
      url: "https://example.com/docs",
    }),
    "url:https://example.com/docs",
  );
  assert.equal(
    commandPaletteUrlFilterValue("book: docs", {
      kind: "bookmark",
      url: "https://docs.example.com/path?q=1",
    }),
    "book: url:https://docs.example.com/path?q=1",
  );
  assert.equal(
    commandPaletteUrlFilterValue("url: https://example.com", {
      kind: "url",
      url: "https://docs.example.com/path",
    }),
    "url:https://docs.example.com/path",
  );
  assert.equal(
    commandPaletteUrlFilterValue("docs", {
      kind: "command",
      url: "https://example.com/options",
    }),
    null,
  );
  assert.equal(
    commandPaletteUrlFilterValue("docs", {
      kind: "history",
      url: "javascript:alert(1)",
    }),
    null,
  );
  assert.equal(commandPaletteUrlFilterValue("docs", {}), null);
});

test("deletes the previous command palette word", () => {
  assert.deepEqual(
    commandPaletteDeletePreviousWordValue({
      selectionEnd: 18,
      selectionStart: 18,
      value: "book: project docs",
    }),
    { selectionEnd: 14, selectionStart: 14, value: "book: project " },
  );
  assert.deepEqual(
    commandPaletteDeletePreviousWordValue({
      selectionEnd: 16,
      selectionStart: 16,
      value: "book: project  ",
    }),
    { selectionEnd: 6, selectionStart: 6, value: "book: " },
  );
  assert.deepEqual(
    commandPaletteDeletePreviousWordValue({
      selectionEnd: 13,
      selectionStart: 5,
      value: "book: project docs",
    }),
    { selectionEnd: 5, selectionStart: 5, value: "book: docs" },
  );
  assert.deepEqual(
    commandPaletteDeletePreviousWordValue({
      selectionEnd: 999,
      selectionStart: 999,
      value: "docs",
    }),
    { selectionEnd: 0, selectionStart: 0, value: "" },
  );
});

test("formats the current URL for command palette editing", () => {
  assert.equal(
    commandPaletteCurrentUrlEditValue("https://example.com/docs?q=1"),
    "url: https://example.com/docs?q=1",
  );
  assert.equal(
    commandPaletteCurrentUrlEditValue(" http://localhost:3000/path "),
    "url: http://localhost:3000/path",
  );
  assert.equal(
    commandPaletteCurrentUrlEditValue("file:///tmp/page.html"),
    null,
  );
  assert.equal(commandPaletteCurrentUrlEditValue("not a url"), null);
});

test("formats command palette results as Markdown links", () => {
  assert.equal(
    commandPaletteMarkdownLinkValue({
      title: "Project [Docs]",
      url: "https://example.com/docs",
    }),
    "[Project \\[Docs\\]](https://example.com/docs)",
  );
  assert.equal(
    commandPaletteMarkdownLinkValue({
      title: "Project) Docs",
      url: "https://example.com/a_(b)",
    }),
    "[Project) Docs](https://example.com/a_(b\\))",
  );
  assert.equal(
    commandPaletteMarkdownLinkValue({
      title: "  \n  ",
      url: "https://example.com/",
    }),
    "[https://example.com/](https://example.com/)",
  );
  assert.equal(
    commandPaletteMarkdownLinkValue({
      title: "Command result",
    }),
    null,
  );
});

test("navigates command palette query history", () => {
  const history = ["search: docs", "tab: mail"];

  const first = commandPaletteHistoryNavigation({
    cursor: null,
    direction: "previous",
    history,
    inputBeforeHistory: "",
    query: "current",
  });
  assert.deepEqual(first, {
    cursor: 0,
    inputBeforeHistory: "current",
    query: "search: docs",
  });

  const older = commandPaletteHistoryNavigation({
    ...first,
    direction: "previous",
    history,
  });
  assert.deepEqual(older, {
    cursor: 1,
    inputBeforeHistory: "current",
    query: "tab: mail",
  });

  const newer = commandPaletteHistoryNavigation({
    ...older,
    direction: "next",
    history,
  });
  assert.deepEqual(newer, first);

  assert.deepEqual(
    commandPaletteHistoryNavigation({
      ...newer,
      direction: "next",
      history,
    }),
    {
      cursor: null,
      inputBeforeHistory: "",
      query: "current",
    },
  );
});

test("shows recent query suggestions only for an empty all-source palette", () => {
  const history = ["github issues", "book: docs", "yt: safari"];

  assert.deepEqual(
    recentPaletteQueryResultTitles(
      commandPaletteQueryScope("", defaultPaletteOptions),
      history,
    ),
    history,
  );

  assert.deepEqual(
    recentPaletteQueryResultTitles(
      commandPaletteQueryScope("docs", defaultPaletteOptions),
      history,
    ),
    [],
  );

  assert.deepEqual(
    recentPaletteQueryResultTitles(
      commandPaletteQueryScope("book:", defaultPaletteOptions),
      history,
    ),
    [],
  );

  assert.deepEqual(
    recentPaletteQueryResultTitles(
      commandPaletteQueryScope("", {
        ...defaultPaletteOptions,
        includeCommands: false,
        sources: ["bookmarks"],
      }),
      history,
    ),
    [],
  );
});

test("highlights contiguous command palette query matches", () => {
  assert.deepEqual(
    commandPaletteHighlightRanges("Google Docs Project Plan", "docs"),
    [{ start: 7, end: 11 }],
  );
});

test("highlights fuzzy command palette query matches", () => {
  assert.deepEqual(
    commandPaletteHighlightRanges("Google Docs Project Plan", "gdp"),
    [
      { start: 0, end: 1 },
      { start: 7, end: 8 },
      { start: 12, end: 13 },
    ],
  );
});

test("does not highlight empty command palette queries", () => {
  assert.deepEqual(commandPaletteHighlightRanges("Google Docs", " "), []);
});

test("keeps unprefixed command palette queries unchanged", () => {
  assert.deepEqual(commandPaletteQueryScope("docs", defaultPaletteOptions), {
    ...defaultPaletteOptions,
    query: "docs",
  });
});

test("scopes command palette queries to open tabs", () => {
  assert.deepEqual(
    commandPaletteQueryScope("tab: docs", defaultPaletteOptions),
    {
      generatedKinds: [],
      includeCommands: false,
      includeGenerated: false,
      query: "docs",
      sources: ["tabs"],
    },
  );
  assert.deepEqual(commandPaletteQueryScope("t: docs", defaultPaletteOptions), {
    generatedKinds: [],
    includeCommands: false,
    includeGenerated: false,
    query: "docs",
    sources: ["tabs"],
  });
});

test("scopes command palette queries to bookmarks", () => {
  assert.deepEqual(
    commandPaletteQueryScope("book: docs", defaultPaletteOptions),
    {
      generatedKinds: [],
      includeCommands: false,
      includeGenerated: false,
      query: "docs",
      sources: ["bookmarks"],
    },
  );
  assert.deepEqual(commandPaletteQueryScope("b: docs", defaultPaletteOptions), {
    generatedKinds: [],
    includeCommands: false,
    includeGenerated: false,
    query: "docs",
    sources: ["bookmarks"],
  });
});

test("scopes command palette queries to history", () => {
  assert.deepEqual(
    commandPaletteQueryScope("history: docs", defaultPaletteOptions),
    {
      generatedKinds: [],
      includeCommands: false,
      includeGenerated: false,
      query: "docs",
      sources: ["history"],
    },
  );
  assert.deepEqual(commandPaletteQueryScope("h: docs", defaultPaletteOptions), {
    generatedKinds: [],
    includeCommands: false,
    includeGenerated: false,
    query: "docs",
    sources: ["history"],
  });
});

test("scopes command palette queries to local visits", () => {
  assert.deepEqual(
    commandPaletteQueryScope("visit: docs", defaultPaletteOptions),
    {
      generatedKinds: [],
      includeCommands: false,
      includeGenerated: false,
      query: "docs",
      sources: ["visits"],
    },
  );
  assert.deepEqual(commandPaletteQueryScope("v: docs", defaultPaletteOptions), {
    generatedKinds: [],
    includeCommands: false,
    includeGenerated: false,
    query: "docs",
    sources: ["visits"],
  });
});

test("scopes command palette queries to extension commands", () => {
  assert.deepEqual(
    commandPaletteQueryScope("cmd: settings", defaultPaletteOptions),
    {
      generatedKinds: [],
      includeCommands: true,
      includeGenerated: false,
      query: "settings",
      sources: [],
    },
  );
  assert.deepEqual(
    commandPaletteQueryScope("m: settings", defaultPaletteOptions),
    {
      generatedKinds: [],
      includeCommands: true,
      includeGenerated: false,
      query: "settings",
      sources: [],
    },
  );
});

test("scopes command palette queries to direct URL generation", () => {
  assert.deepEqual(
    commandPaletteQueryScope("url: example.com", defaultPaletteOptions),
    {
      generatedKinds: ["url"],
      includeCommands: false,
      includeGenerated: true,
      query: "example.com",
      sources: [],
    },
  );
  assert.deepEqual(
    commandPaletteQueryScope("u: example.com", defaultPaletteOptions),
    {
      generatedKinds: ["url"],
      includeCommands: false,
      includeGenerated: true,
      query: "example.com",
      sources: [],
    },
  );
});

test("scopes command palette queries to web search generation", () => {
  assert.deepEqual(
    commandPaletteQueryScope("search: example.com", defaultPaletteOptions),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "example.com",
      sources: [],
    },
  );
  assert.deepEqual(
    commandPaletteQueryScope("s: example.com", defaultPaletteOptions),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "example.com",
      sources: [],
    },
  );
});

test("scopes command palette queries to explicit search engines", () => {
  assert.deepEqual(commandPaletteQueryScope("g: docs", defaultPaletteOptions), {
    generatedKinds: ["search"],
    includeCommands: false,
    includeGenerated: true,
    query: "docs",
    searchEngine: "google",
    sources: [],
  });
  assert.deepEqual(
    commandPaletteQueryScope("ddg: docs", defaultPaletteOptions),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "docs",
      searchEngine: "duckduckgo",
      sources: [],
    },
  );
  assert.deepEqual(
    commandPaletteQueryScope("brave: docs", defaultPaletteOptions),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "docs",
      searchEngine: "brave",
      sources: [],
    },
  );
  assert.deepEqual(commandPaletteQueryScope("k: docs", defaultPaletteOptions), {
    generatedKinds: ["search"],
    includeCommands: false,
    includeGenerated: true,
    query: "docs",
    searchEngine: "kagi",
    sources: [],
  });
  assert.deepEqual(
    commandPaletteQueryScope("yt: safari keyboard", defaultPaletteOptions),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "safari keyboard",
      searchEngine: "youtube",
      sources: [],
    },
  );
  assert.deepEqual(
    commandPaletteQueryScope("youtube: safari keyboard", defaultPaletteOptions),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "safari keyboard",
      searchEngine: "youtube",
      sources: [],
    },
  );
  assert.deepEqual(
    commandPaletteQueryScope("w: safari keyboard", defaultPaletteOptions),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "safari keyboard",
      searchEngine: "wikipedia",
      sources: [],
    },
  );
  assert.deepEqual(
    commandPaletteQueryScope("wiki: safari keyboard", defaultPaletteOptions),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "safari keyboard",
      searchEngine: "wikipedia",
      sources: [],
    },
  );
  assert.deepEqual(
    commandPaletteQueryScope(
      "wikipedia: safari keyboard",
      defaultPaletteOptions,
    ),
    {
      generatedKinds: ["search"],
      includeCommands: false,
      includeGenerated: true,
      query: "safari keyboard",
      searchEngine: "wikipedia",
      sources: [],
    },
  );
});
