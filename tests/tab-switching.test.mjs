import assert from "node:assert/strict";
import test from "node:test";

await import("../web-extension/background.js");

const { chooseNeighborTabId, isSupportedNewTabUrl } =
  globalThis.SafariKeyboardNavigationTabs;
const { tabSwitchDirectionForCommand } =
  globalThis.SafariKeyboardNavigationTabs;

test("chooses the tab to the left of the active tab", () => {
  assert.equal(
    chooseNeighborTabId(
      [
        { id: 10, index: 0 },
        { id: 11, index: 1 },
        { id: 12, index: 2 },
      ],
      11,
      "previous",
    ),
    10,
  );
});

test("chooses the tab to the right of the active tab", () => {
  assert.equal(
    chooseNeighborTabId(
      [
        { id: 10, index: 0 },
        { id: 11, index: 1 },
        { id: 12, index: 2 },
      ],
      11,
      "next",
    ),
    12,
  );
});

test("does nothing at either tab edge", () => {
  const tabs = [
    { id: 10, index: 0 },
    { id: 11, index: 1 },
  ];

  assert.equal(chooseNeighborTabId(tabs, 10, "previous"), null);
  assert.equal(chooseNeighborTabId(tabs, 11, "next"), null);
});

test("sorts tabs by index before choosing a neighbor", () => {
  assert.equal(
    chooseNeighborTabId(
      [
        { id: 12, index: 2 },
        { id: 10, index: 0 },
        { id: 11, index: 1 },
      ],
      11,
      "next",
    ),
    12,
  );
});

test("ignores tabs without numeric ids", () => {
  assert.equal(
    chooseNeighborTabId(
      [{ id: 10, index: 0 }, { index: 1 }, { id: 12, index: 2 }],
      10,
      "next",
    ),
    12,
  );
});

test("accepts only web URLs for new foreground tabs", () => {
  assert.equal(isSupportedNewTabUrl("https://example.com/docs"), true);
  assert.equal(
    isSupportedNewTabUrl("http://localhost:8765/manual-test/"),
    true,
  );
  assert.equal(isSupportedNewTabUrl("javascript:alert(1)"), false);
  assert.equal(isSupportedNewTabUrl("mailto:hello@example.com"), false);
  assert.equal(isSupportedNewTabUrl("not a url"), false);
});

test("maps browser-level tab switching commands to directions", () => {
  assert.equal(tabSwitchDirectionForCommand("switch-tab-previous"), "previous");
  assert.equal(tabSwitchDirectionForCommand("switch-tab-next"), "next");
  assert.equal(tabSwitchDirectionForCommand("unknown-command"), null);
});
