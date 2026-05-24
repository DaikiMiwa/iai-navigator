import assert from "node:assert/strict";
import test from "node:test";

await import("../web-extension/help.js");

const { HELP_SECTIONS, isHelpCloseCommandEvent, isHelpCommandEvent } =
  globalThis.SafariKeyboardNavigationHelp;

function keyboardEvent(overrides = {}) {
  return {
    altKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    isComposing: false,
    key: "",
    metaKey: false,
    repeat: false,
    shiftKey: false,
    ...overrides,
  };
}

test("recognizes ? as the help overlay command", () => {
  assert.equal(isHelpCommandEvent(keyboardEvent({ key: "?" })), true);
  assert.equal(
    isHelpCommandEvent(keyboardEvent({ key: "?", shiftKey: true })),
    true,
  );
});

test("ignores modified, repeated, composing, and prevented help commands", () => {
  assert.equal(
    isHelpCommandEvent(keyboardEvent({ key: "/", shiftKey: true })),
    false,
  );
  assert.equal(
    isHelpCommandEvent(keyboardEvent({ key: "?", altKey: true })),
    false,
  );
  assert.equal(
    isHelpCommandEvent(keyboardEvent({ key: "?", ctrlKey: true })),
    false,
  );
  assert.equal(
    isHelpCommandEvent(keyboardEvent({ key: "?", metaKey: true })),
    false,
  );
  assert.equal(
    isHelpCommandEvent(keyboardEvent({ key: "?", repeat: true })),
    false,
  );
  assert.equal(
    isHelpCommandEvent(keyboardEvent({ key: "?", isComposing: true })),
    false,
  );
  assert.equal(
    isHelpCommandEvent(keyboardEvent({ key: "?", defaultPrevented: true })),
    false,
  );
});

test("recognizes Escape as the help overlay close command", () => {
  assert.equal(isHelpCloseCommandEvent(keyboardEvent({ key: "Escape" })), true);
  assert.equal(isHelpCloseCommandEvent(keyboardEvent({ key: "Esc" })), false);
  assert.equal(
    isHelpCloseCommandEvent(keyboardEvent({ key: "Escape", metaKey: true })),
    false,
  );
});

test("lists the supported shortcut groups in the help overlay", () => {
  assert.deepEqual(
    HELP_SECTIONS.map((section) => section.title),
    ["Hints", "Page Movement", "Navigation", "Utilities"],
  );

  const shortcutKeys = HELP_SECTIONS.flatMap((section) =>
    section.shortcuts.map((shortcut) => shortcut.key),
  );
  for (const key of [
    "f",
    "Shift+F",
    "h / j / k / l",
    "u / d",
    "gg",
    "Shift+G",
    "Shift+H",
    "Shift+L",
    "Shift+J",
    "Shift+K",
    "r",
    "yy",
    "?",
    "Esc",
  ]) {
    assert.equal(shortcutKeys.includes(key), true, `${key} is listed`);
  }
});
