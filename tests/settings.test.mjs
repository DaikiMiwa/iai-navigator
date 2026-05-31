import assert from "node:assert/strict";
import test from "node:test";

await import("../web-extension/settings.js");

const {
  DEFAULT_EXTENSION_SETTINGS,
  isExtensionEnabledForUrl,
  isShortcutEvent,
  normalizeExtensionSettings,
  shortcutSequence,
} = globalThis.SafariKeyboardNavigationSettings;

function keyboardEvent(overrides = {}) {
  return {
    altKey: false,
    ctrlKey: false,
    key: "",
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
  assert.equal(settings.hintStyle.fontSize, 28);
  assert.equal(settings.hintStyle.opacity, 1);
  assert.equal(settings.hintStyle.textColor, "#111111");
  assert.equal(settings.shortcuts.hint, "x");
  assert.equal(
    settings.shortcuts.top,
    DEFAULT_EXTENSION_SETTINGS.shortcuts.top,
  );
  assert.equal(settings.shortcuts.commandPalette, "o");
  assert.equal(settings.shortcuts.commandPaletteNewTab, "Shift+O");
  assert.equal(settings.shortcuts.bookmarkPalette, "b");
  assert.equal(settings.shortcuts.bookmarkPaletteNewTab, "Shift+B");
  assert.equal(settings.shortcuts.tabPalette, "Shift+T");
  assert.deepEqual(settings.siteAccess.allowlist, ["example.com"]);
  assert.deepEqual(settings.siteAccess.blocklist, ["docs.google.com"]);
  assert.equal(settings.siteAccess.mode, "allowlist");
});

test("matches single-key and shifted shortcut events", () => {
  assert.equal(isShortcutEvent(keyboardEvent({ key: "f" }), "f"), true);
  assert.equal(
    isShortcutEvent(keyboardEvent({ key: "F", shiftKey: true }), "Shift+F"),
    true,
  );
  assert.equal(isShortcutEvent(keyboardEvent({ key: "f" }), "Shift+F"), false);
});

test("returns plain shortcut sequences for multi-key commands", () => {
  assert.deepEqual(shortcutSequence("gg"), ["g", "g"]);
  assert.deepEqual(shortcutSequence("yy"), ["y", "y"]);
  assert.equal(shortcutSequence("Shift+F"), null);
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
