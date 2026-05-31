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
const { commandPaletteHighlightRanges } =
  globalThis.SafariKeyboardNavigationCommandPalette;

function key(overrides) {
  return {
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
});

test("maps command palette close and ignores text input keys", () => {
  assert.equal(commandPaletteKeyAction(key({ key: "Escape" })), "close");
  assert.equal(commandPaletteKeyAction(key({ key: "a" })), null);
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
