import assert from "node:assert/strict";
import test from "node:test";

await import("../web-extension/background.js");

const {
  chooseNeighborTabId,
  isSupportedNewTabUrl,
  searchPaletteResults,
  tabSwitchDirectionForCommand,
} = globalThis.SafariKeyboardNavigationTabs;

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

test("maps browser-level tab switch commands to directions", () => {
  assert.equal(tabSwitchDirectionForCommand("switch-tab-previous"), "previous");
  assert.equal(tabSwitchDirectionForCommand("switch-tab-next"), "next");
  assert.equal(tabSwitchDirectionForCommand("unknown-command"), null);
});

test("combines matching tabs, bookmarks, and recent history for palette search", () => {
  const results = searchPaletteResults(
    {
      bookmarks: [
        {
          id: "bookmark-docs",
          title: "Project Docs",
          url: "https://example.com/docs",
        },
      ],
      history: [
        {
          id: "history-docs",
          lastVisitTime: Date.now(),
          title: "Docs History",
          url: "https://example.com/history",
        },
      ],
      tabs: [
        {
          id: 10,
          index: 0,
          title: "Docs Tab",
          url: "https://example.com/tab",
        },
      ],
    },
    "docs",
    { sources: ["tabs", "bookmarks", "history"] },
  );

  assert.deepEqual(
    new Set(results.map((result) => result.kind)),
    new Set(["tab", "bookmark", "history"]),
  );
  assert.equal(results[0].tabId, 10);
});

test("can restrict palette search to bookmarks only", () => {
  const results = searchPaletteResults(
    {
      bookmarks: [
        {
          id: "bookmark-docs",
          title: "Project Docs",
          url: "https://example.com/docs",
        },
      ],
      history: [
        {
          id: "history-docs",
          title: "Docs History",
          url: "https://example.com/history",
        },
      ],
      tabs: [
        {
          id: 10,
          index: 0,
          title: "Docs Tab",
          url: "https://example.com/tab",
        },
      ],
    },
    "docs",
    { sources: ["bookmarks"] },
  );

  assert.deepEqual(
    results.map((result) => result.kind),
    ["bookmark"],
  );
});

test("adds direct URL and search results for open palette queries", () => {
  const urlResults = searchPaletteResults(
    { bookmarks: [], history: [], tabs: [] },
    "example.com",
    { includeGenerated: true },
  );

  assert.deepEqual(
    urlResults.map((result) => result.kind),
    ["url", "search"],
  );
  assert.equal(urlResults[0].url, "https://example.com");

  const searchResults = searchPaletteResults(
    { bookmarks: [], history: [], tabs: [] },
    "hello world",
    { includeGenerated: true },
  );

  assert.deepEqual(
    searchResults.map((result) => result.kind),
    ["search"],
  );
  assert.equal(
    searchResults[0].url,
    "https://www.google.com/search?q=hello%20world",
  );
});

test("filters unsafe palette destinations", () => {
  const results = searchPaletteResults(
    {
      bookmarks: [
        {
          id: "bookmark-js",
          title: "Bad",
          url: "javascript:alert(1)",
        },
      ],
      history: [
        {
          id: "history-mail",
          title: "Mail",
          url: "mailto:hello@example.com",
        },
      ],
      tabs: [{ id: 10, index: 0, title: "Safe", url: "https://example.com" }],
    },
    "",
  );

  assert.deepEqual(
    results.map((result) => result.kind),
    ["tab"],
  );
});
