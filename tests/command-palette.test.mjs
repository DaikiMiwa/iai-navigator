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
const { commandPaletteApplyPrefixValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteEditableResultValue } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteHistoryNavigation } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteHighlightRanges } =
  globalThis.SafariKeyboardNavigationCommandPalette;
const { commandPaletteQueryScope } =
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
    key: "",
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
  assert.equal(commandPaletteKeyAction(key({ key: "Tab" })), "next");
  assert.equal(commandPaletteKeyAction(key({ key: "ArrowUp" })), "previous");
  assert.equal(
    commandPaletteKeyAction(key({ ctrlKey: true, key: "p" })),
    "previous",
  );
  assert.equal(
    commandPaletteKeyAction(key({ key: "Tab", shiftKey: true })),
    "previous",
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
    commandPaletteKeyAction(key({ altKey: true, key: "c" })),
    "copy-result-url",
  );
  assert.equal(
    commandPaletteKeyAction(key({ altKey: true, key: "C" })),
    "copy-result-url",
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
  assert.equal(commandPaletteKeyAction(key({ key: "1" })), null);
  assert.equal(
    commandPaletteKeyAction(
      key({ altKey: true, code: "Digit1", key: "1", shiftKey: true }),
    ),
    null,
  );
});

test("describes command palette activation and source-prefix hints", () => {
  const hints = COMMAND_PALETTE_FOOTER_HINTS.join(" ");
  assert.match(hints, /Enter/);
  assert.match(hints, /Shift\+Enter/);
  assert.match(hints, /Option\+Enter/);
  assert.match(hints, /Option\+C/);
  assert.match(hints, /Option\+E/);
  assert.match(hints, /Option\+⌫/);
  assert.match(hints, /Option\+W/);
  assert.match(hints, /Option\+1-9/);
  assert.match(hints, /Option\+↑\/↓/);
  assert.match(hints, /Option\+T\/B\/H\/V\/S\/U\/M/);
  assert.match(hints, /tab:/);
  assert.match(hints, /book:/);
  assert.match(hints, /history:/);
  assert.match(hints, /visit:/);
  assert.match(hints, /search:/);
  assert.match(hints, /g:/);
  assert.match(hints, /ddg:/);
  assert.match(hints, /br:/);
  assert.match(hints, /k:/);
  assert.match(hints, /url:/);
  assert.match(hints, /cmd:/);
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
});
