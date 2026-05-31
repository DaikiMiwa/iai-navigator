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

const { isSupportedPdfCandidate, isSupportedWebPageCandidate } =
  globalThis.SafariKeyboardNavigationPageSupport;

function page(overrides = {}) {
  return {
    contentType: "text/html",
    href: "https://example.com/",
    protocol: "https:",
    ...overrides,
  };
}

test("supports normal web and local HTML pages for page commands", () => {
  assert.equal(isSupportedWebPageCandidate(page({ protocol: "http:" })), true);
  assert.equal(isSupportedWebPageCandidate(page({ protocol: "https:" })), true);
  assert.equal(
    isSupportedWebPageCandidate(
      page({
        href: "file:///private/var/folders/example/architecture-review.html",
        protocol: "file:",
      }),
    ),
    true,
  );
});

test("keeps local PDFs out of normal web page hint mode", () => {
  const localPdf = page({
    contentType: "application/pdf",
    href: "file:///tmp/report.pdf",
    protocol: "file:",
  });

  assert.equal(isSupportedWebPageCandidate(localPdf), false);
  assert.equal(isSupportedPdfCandidate(localPdf), true);
});

test("rejects unsupported browser and data protocols", () => {
  for (const protocol of ["safari-extension:", "about:", "data:"]) {
    assert.equal(
      isSupportedWebPageCandidate(page({ protocol })),
      false,
      protocol,
    );
  }
});
