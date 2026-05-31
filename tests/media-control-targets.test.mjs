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

const { isSafeMediaControlCandidate } =
  globalThis.SafariKeyboardNavigationHintTargets;

function candidate(overrides = {}) {
  return {
    hasAccessibleName: false,
    isAriaDisabled: false,
    isDisabled: false,
    isFocusable: false,
    isInMediaControlSurface: true,
    isLink: false,
    isNativeControl: false,
    isYouTubeButton: false,
    role: "",
    tagName: "div",
    ...overrides,
  };
}

test("accepts native controls inside media player chrome", () => {
  assert.equal(
    isSafeMediaControlCandidate(
      candidate({ isNativeControl: true, tagName: "button" }),
    ),
    true,
  );
});

test("accepts YouTube player buttons and accessible slider controls", () => {
  assert.equal(
    isSafeMediaControlCandidate(candidate({ isYouTubeButton: true })),
    true,
  );
  assert.equal(
    isSafeMediaControlCandidate(
      candidate({ hasAccessibleName: true, isFocusable: true, role: "slider" }),
    ),
    true,
  );
});

test("rejects controls outside media chrome", () => {
  assert.equal(
    isSafeMediaControlCandidate(
      candidate({
        isInMediaControlSurface: false,
        isNativeControl: true,
        tagName: "button",
      }),
    ),
    false,
  );
});

test("rejects disabled controls and links", () => {
  for (const control of [
    candidate({ isAriaDisabled: true, isNativeControl: true }),
    candidate({ isDisabled: true, isNativeControl: true }),
    candidate({ isLink: true, role: "button" }),
  ]) {
    assert.equal(isSafeMediaControlCandidate(control), false);
  }
});
