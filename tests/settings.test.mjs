import assert from "node:assert/strict";
import test from "node:test";

await import("../web-extension/settings.js");

const {
  DEFAULT_EXTENSION_SETTINGS,
  isExtensionEnabledForUrl,
  isShortcutEvent,
  normalizeExtensionSettings,
  shortcutKeySequence,
  shortcutSequence,
} = globalThis.SafariKeyboardNavigationSettings;

function keyboardEvent(overrides = {}) {
  return {
    altKey: false,
    ctrlKey: false,
    isComposing: false,
    key: "",
    keyCode: 0,
    metaKey: false,
    repeat: false,
    shiftKey: false,
    ...overrides,
  };
}

test("normalizes missing and invalid settings to defaults", () => {
  const settings = normalizeExtensionSettings({
    enabled: "yes",
    hintStyle: {
      fontSize: 100,
      opacity: 2,
      textColor: "red",
      borderRadius: 99,
      borderWidth: 10,
      borderColor: "blue",
      shadowOpacity: -1,
    },
    shortcuts: {
      hint: "x",
      top: "bad shortcut",
    },
    siteAccess: {
      allowlist: [" Example.com ", ""],
      blocklist: [42, "docs.google.com"],
      mode: "allowlist",
    },
  });

  assert.equal(settings.enabled, DEFAULT_EXTENSION_SETTINGS.enabled);
  assert.equal(settings.commandPalette.searchEngine, "google");
  assert.equal(settings.commandPalette.customSearchUrlTemplate, "");
  assert.equal(settings.hintStyle.fontSize, 28);
  assert.equal(settings.hintStyle.opacity, 1);
  assert.equal(settings.hintStyle.textColor, "#111111");
  assert.equal(settings.hintStyle.borderRadius, 20);
  assert.equal(settings.hintStyle.borderWidth, 5);
  assert.equal(settings.hintStyle.borderColor, "#ffffff");
  assert.equal(settings.hintStyle.shadowOpacity, 0);
  assert.equal(settings.shortcuts.hint, "x");
  assert.equal(
    settings.shortcuts.top,
    DEFAULT_EXTENSION_SETTINGS.shortcuts.top,
  );
  assert.equal(settings.shortcuts.commandPalette, "o");
  assert.equal(settings.shortcuts.commandPaletteNewTab, "Shift+O");
  assert.equal(settings.shortcuts.editCurrentUrlPalette, "ge");
  assert.equal(settings.shortcuts.editCurrentUrlPaletteNewTab, "gE");
  assert.equal(settings.shortcuts.bookmarkPalette, "b");
  assert.equal(settings.shortcuts.bookmarkPaletteNewTab, "Shift+B");
  assert.equal(settings.shortcuts.historyPalette, "v");
  assert.equal(settings.shortcuts.historyPaletteNewTab, "Shift+V");
  assert.equal(settings.shortcuts.tabPalette, "Shift+T");
  assert.deepEqual(settings.siteAccess.allowlist, ["example.com"]);
  assert.deepEqual(settings.siteAccess.blocklist, ["docs.google.com"]);
  assert.equal(settings.siteAccess.mode, "allowlist");
});

test("normalizes command palette search engine settings", () => {
  assert.equal(
    normalizeExtensionSettings({
      commandPalette: { searchEngine: "duckduckgo" },
    }).commandPalette.searchEngine,
    "duckduckgo",
  );
  assert.equal(
    normalizeExtensionSettings({
      commandPalette: { searchEngine: "youtube" },
    }).commandPalette.searchEngine,
    "youtube",
  );
  assert.equal(
    normalizeExtensionSettings({
      commandPalette: { searchEngine: "wikipedia" },
    }).commandPalette.searchEngine,
    "wikipedia",
  );

  assert.equal(
    normalizeExtensionSettings({
      commandPalette: { searchEngine: "not-a-search-engine" },
    }).commandPalette.searchEngine,
    DEFAULT_EXTENSION_SETTINGS.commandPalette.searchEngine,
  );

  const customSettings = normalizeExtensionSettings({
    commandPalette: {
      customSearchUrlTemplate: " https://search.example.com/?q={query} ",
      searchEngine: "custom",
    },
  }).commandPalette;
  assert.equal(customSettings.searchEngine, "custom");
  assert.equal(
    customSettings.customSearchUrlTemplate,
    "https://search.example.com/?q={query}",
  );

  assert.equal(
    normalizeExtensionSettings({
      commandPalette: {
        customSearchUrlTemplate: "javascript:alert({query})",
        searchEngine: "custom",
      },
    }).commandPalette.customSearchUrlTemplate,
    "",
  );
});

test("matches single-key and shifted shortcut events", () => {
  assert.equal(isShortcutEvent(keyboardEvent({ key: "f" }), "f"), true);
  assert.equal(
    isShortcutEvent(keyboardEvent({ key: "F", shiftKey: true }), "Shift+F"),
    true,
  );
  assert.equal(isShortcutEvent(keyboardEvent({ key: "f" }), "Shift+F"), false);
});

test("does not match shortcut events that belong to IME composition", () => {
  assert.equal(
    isShortcutEvent(keyboardEvent({ isComposing: true, key: "o" }), "o"),
    false,
  );
  assert.equal(
    isShortcutEvent(keyboardEvent({ key: "o", keyCode: 229 }), "o"),
    false,
  );
});

test("returns plain shortcut sequences for multi-key commands", () => {
  assert.deepEqual(shortcutSequence("gg"), ["g", "g"]);
  assert.deepEqual(shortcutSequence("ge"), ["g", "e"]);
  assert.deepEqual(shortcutSequence("gE"), ["g", "e"]);
  assert.deepEqual(shortcutSequence("yy"), ["y", "y"]);
  assert.equal(shortcutSequence("Shift+F"), null);
});

test("returns shifted key-aware shortcut sequences", () => {
  assert.deepEqual(shortcutKeySequence("gg"), [
    { key: "g", shiftKey: false },
    { key: "g", shiftKey: false },
  ]);
  assert.deepEqual(shortcutKeySequence("ge"), [
    { key: "g", shiftKey: false },
    { key: "e", shiftKey: false },
  ]);
  assert.deepEqual(shortcutKeySequence("gE"), [
    { key: "g", shiftKey: false },
    { key: "e", shiftKey: true },
  ]);
  assert.deepEqual(shortcutKeySequence("GE"), [
    { key: "g", shiftKey: true },
    { key: "e", shiftKey: true },
  ]);
  assert.equal(shortcutKeySequence("Shift+F"), null);
  assert.equal(shortcutKeySequence("Alt+g"), null);
});

test("applies site access mode and blocklist rules", () => {
  const settings = normalizeExtensionSettings({
    siteAccess: {
      allowlist: ["example.com"],
      blocklist: ["docs.example.com"],
      mode: "allowlist",
    },
  });

  assert.equal(isExtensionEnabledForUrl(settings, "https://example.com"), true);
  assert.equal(
    isExtensionEnabledForUrl(settings, "https://docs.example.com"),
    false,
  );
  assert.equal(isExtensionEnabledForUrl(settings, "https://other.com"), false);
});
