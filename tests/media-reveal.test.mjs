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

await import("../web-extension/content.js");

const {
  isRevealableMediaControlsCandidate,
  shouldPreRevealMediaControlsCandidate,
} = globalThis.SafariKeyboardNavigationMediaReveal;

function candidate(overrides = {}) {
  return {
    activationMode: "current-tab",
    hasRevealableMediaSurfaces: true,
    hasVisibleMediaControls: false,
    ...overrides,
  };
}

test("pre-reveals media controls before current-tab hints when controls are hidden", () => {
  assert.equal(shouldPreRevealMediaControlsCandidate(candidate()), true);
});

test("pre-reveals media controls before current-tab hints even when controls look visible", () => {
  assert.equal(
    shouldPreRevealMediaControlsCandidate(
      candidate({ hasVisibleMediaControls: true }),
    ),
    true,
  );
});

test("skips media pre-reveal for new-tab hints", () => {
  assert.equal(
    shouldPreRevealMediaControlsCandidate(
      candidate({ activationMode: "new-tab" }),
    ),
    false,
  );
});

test("skips media pre-reveal when no surface exists", () => {
  assert.equal(
    shouldPreRevealMediaControlsCandidate(
      candidate({ hasRevealableMediaSurfaces: false }),
    ),
    false,
  );
});

test("identifies the narrower hidden-controls reveal candidate", () => {
  assert.equal(isRevealableMediaControlsCandidate(candidate()), true);
  assert.equal(
    isRevealableMediaControlsCandidate(
      candidate({ hasVisibleMediaControls: true }),
    ),
    false,
  );
});
