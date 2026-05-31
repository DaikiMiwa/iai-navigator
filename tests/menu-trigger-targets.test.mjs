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

const { canClickMenuTriggerCandidate, isSafeMenuTriggerCandidate } =
  globalThis.SafariKeyboardNavigationHintTargets;

function candidate(overrides = {}) {
  return {
    hasAriaControls: false,
    hasAriaExpanded: false,
    hasAriaHaspopup: false,
    isAriaDisabled: false,
    isDisabled: false,
    isFormSubmitButton: false,
    isInNavigationContext: false,
    isLink: false,
    isNonButtonFormControl: false,
    role: "",
    tagName: "div",
    ...overrides,
  };
}

test("accepts explicit disclosure menu triggers", () => {
  const trigger = candidate({
    hasAriaControls: true,
    hasAriaExpanded: true,
    hasAriaHaspopup: true,
    tagName: "button",
  });

  assert.equal(isSafeMenuTriggerCandidate(trigger), true);
  assert.equal(canClickMenuTriggerCandidate(trigger), true);
});

test("allows navigation button-like triggers for focus-only reveal", () => {
  const trigger = candidate({
    isInNavigationContext: true,
    tagName: "button",
  });

  assert.equal(isSafeMenuTriggerCandidate(trigger), true);
  assert.equal(canClickMenuTriggerCandidate(trigger), false);
});

test("rejects ordinary page buttons outside navigation context", () => {
  const trigger = candidate({ tagName: "button" });

  assert.equal(isSafeMenuTriggerCandidate(trigger), false);
  assert.equal(canClickMenuTriggerCandidate(trigger), false);
});

test("rejects unsafe or non-disclosure controls", () => {
  for (const trigger of [
    candidate({ hasAriaHaspopup: true, isAriaDisabled: true }),
    candidate({ hasAriaHaspopup: true, isDisabled: true }),
    candidate({ hasAriaHaspopup: true, isFormSubmitButton: true }),
    candidate({ hasAriaHaspopup: true, isLink: true }),
    candidate({ hasAriaHaspopup: true, isNonButtonFormControl: true }),
  ]) {
    assert.equal(isSafeMenuTriggerCandidate(trigger), false);
    assert.equal(canClickMenuTriggerCandidate(trigger), false);
  }
});
