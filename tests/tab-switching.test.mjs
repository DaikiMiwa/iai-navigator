import assert from "node:assert/strict";
import test from "node:test";

await import("../web-extension/background.js");

const {
  chooseNeighborTabId,
  closePaletteTab,
  executePaletteResult,
  isSupportedNewTabUrl,
  paletteTabQueryInfo,
  recordLocalVisit,
  removeLocalVisitByUrl,
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

test("queries all windows for command palette tab search", () => {
  assert.deepEqual(paletteTabQueryInfo(), {});
});

test("opens palette destinations in a background tab", async () => {
  const createdTabs = [];
  const storedItems = [];
  await executePaletteResult(
    {
      storage: {
        local: {
          get: async () => ({ paletteLocalVisits: [] }),
          set: async (items) => {
            storedItems.push(items);
          },
        },
      },
      tabs: {
        create: async (properties) => {
          createdTabs.push(properties);
          return { id: 99, index: 1, url: properties.url };
        },
        query: async () => [],
        update: async () => {
          throw new Error("background tab activation should not update tabs");
        },
      },
    },
    {
      id: "bookmark-docs",
      kind: "bookmark",
      title: "Docs",
      subtitle: "https://example.com/docs",
      url: "https://example.com/docs",
      score: 10,
    },
    "background-tab",
  );

  assert.deepEqual(createdTabs, [
    { active: false, url: "https://example.com/docs" },
  ]);
  assert.equal(
    storedItems[0]?.paletteLocalVisits[0]?.url,
    "https://example.com/docs",
  );
  assert.equal(storedItems[0]?.paletteLocalVisits[0]?.visitCount, 1);
});

test("duplicates open tab palette results in a background tab", async () => {
  const createdTabs = [];
  await executePaletteResult(
    {
      tabs: {
        create: async (properties) => {
          createdTabs.push(properties);
          return { id: 99, index: 1, url: properties.url };
        },
        query: async () => [],
        update: async () => {
          throw new Error("background tab activation should not focus tabs");
        },
      },
    },
    {
      id: "tab:10",
      kind: "tab",
      tabId: 10,
      title: "Docs Tab",
      subtitle: "https://example.com/tab",
      url: "https://example.com/tab",
      score: 10,
    },
    "background-tab",
  );

  assert.deepEqual(createdTabs, [
    { active: false, url: "https://example.com/tab" },
  ]);
});

test("records direct URL palette activations as local visits", async () => {
  const storedItems = [];
  await executePaletteResult(
    {
      storage: {
        local: {
          get: async () => ({
            paletteLocalVisits: [
              {
                lastVisitTime: 100,
                title: "Old Docs",
                url: "https://example.com/docs",
                visitCount: 1,
              },
            ],
          }),
          set: async (items) => {
            storedItems.push(items);
          },
        },
      },
      tabs: {
        create: async () => {
          throw new Error("current-tab activation should update active tab");
        },
        query: async () => [{ active: true, id: 5, index: 0 }],
        update: async (tabId, properties) => ({
          id: tabId,
          index: 0,
          ...properties,
        }),
      },
    },
    {
      id: "url:https://example.com/docs",
      kind: "url",
      title: "Open https://example.com/docs",
      subtitle: "https://example.com/docs",
      url: "https://example.com/docs",
      score: 95,
    },
    "current-tab",
  );

  assert.equal(
    storedItems[0]?.paletteLocalVisits[0]?.url,
    "https://example.com/docs",
  );
  assert.equal(storedItems[0]?.paletteLocalVisits[0]?.visitCount, 2);
});

test("does not record generated search palette activations as local visits", async () => {
  const storedItems = [];
  await executePaletteResult(
    {
      storage: {
        local: {
          get: async () => ({ paletteLocalVisits: [] }),
          set: async (items) => {
            storedItems.push(items);
          },
        },
      },
      tabs: {
        create: async () => {
          throw new Error("current-tab activation should update active tab");
        },
        query: async () => [{ active: true, id: 5, index: 0 }],
        update: async (tabId, properties) => ({
          id: tabId,
          index: 0,
          ...properties,
        }),
      },
    },
    {
      id: "search:docs",
      kind: "search",
      title: 'Search for "docs"',
      subtitle: "Google Search",
      url: "https://www.google.com/search?q=docs",
      score: 70,
    },
    "current-tab",
  );

  assert.deepEqual(storedItems, []);
});

test("focuses the source window when activating an open tab palette result", async () => {
  const updatedTabs = [];
  const updatedWindows = [];
  await executePaletteResult(
    {
      tabs: {
        create: async () => {
          throw new Error("current-tab activation should not create tabs");
        },
        query: async () => [],
        update: async (tabId, properties) => {
          updatedTabs.push([tabId, properties]);
          return { id: tabId, index: 0, ...properties };
        },
      },
      windows: {
        update: async (windowId, properties) => {
          updatedWindows.push([windowId, properties]);
          return {};
        },
      },
    },
    {
      id: "tab:10",
      kind: "tab",
      tabId: 10,
      title: "Docs Tab",
      subtitle: "https://example.com/tab",
      url: "https://example.com/tab",
      windowId: 20,
      score: 10,
    },
    "current-tab",
  );

  assert.deepEqual(updatedTabs, [[10, { active: true }]]);
  assert.deepEqual(updatedWindows, [[20, { focused: true }]]);
});

test("closes command palette open tab results", async () => {
  const removedTabs = [];
  assert.deepEqual(
    await closePaletteTab(
      {
        tabs: {
          create: async () => {
            throw new Error("close should not create tabs");
          },
          query: async () => [],
          remove: async (tabId) => {
            removedTabs.push(tabId);
          },
          update: async () => {
            throw new Error("close should not update tabs");
          },
        },
      },
      10,
    ),
    { closed: true },
  );

  assert.deepEqual(removedTabs, [10]);
});

test("combines matching tabs, bookmarks, recent history, and local visits for palette search", () => {
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
      visits: [
        {
          lastVisitTime: Date.now(),
          title: "Docs Local Visit",
          url: "https://example.com/local",
          visitCount: 3,
        },
      ],
    },
    "docs",
    { sources: ["tabs", "bookmarks", "history", "visits"] },
  );

  assert.deepEqual(
    new Set(results.map((result) => result.kind)),
    new Set(["tab", "bookmark", "history", "visit"]),
  );
  assert.equal(results[0].tabId, 10);
});

test("preserves window context on open tab palette results", () => {
  const results = searchPaletteResults(
    {
      bookmarks: [],
      history: [],
      tabs: [
        {
          id: 10,
          index: 0,
          title: "Docs Tab",
          url: "https://example.com/docs",
          windowId: 20,
        },
      ],
    },
    "docs",
    { sources: ["tabs"] },
  );

  assert.equal(results[0]?.kind, "tab");
  assert.equal(results[0]?.tabId, 10);
  assert.equal(results[0]?.windowId, 20);
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

test("deduplicates matching palette destinations by URL with open tabs first", () => {
  const results = searchPaletteResults(
    {
      bookmarks: [
        {
          id: "bookmark-docs",
          title: "Bookmarked Docs",
          url: "https://example.com/docs#bookmark",
        },
      ],
      history: [
        {
          id: "history-docs",
          lastVisitTime: Date.now(),
          title: "History Docs",
          url: "https://example.com/docs#history",
        },
      ],
      tabs: [
        {
          id: 10,
          index: 0,
          title: "Open Docs",
          url: "https://example.com/docs#tab",
        },
      ],
      visits: [
        {
          lastVisitTime: Date.now(),
          title: "Observed Docs",
          url: "https://example.com/docs#visit",
          visitCount: 3,
        },
      ],
    },
    "docs",
    {
      includeGenerated: true,
      sources: ["tabs", "bookmarks", "history", "visits"],
    },
  );

  assert.deepEqual(
    results.filter((result) => result.url === "https://example.com/docs#tab"),
    [
      {
        id: "tab:10",
        kind: "tab",
        score: 60,
        subtitle: "https://example.com/docs#tab",
        tabId: 10,
        title: "Open Docs",
        url: "https://example.com/docs#tab",
      },
    ],
  );
  assert.equal(
    results.filter((result) =>
      result.url?.startsWith("https://example.com/docs"),
    ).length,
    1,
  );
});

test("matches compact fuzzy destination queries", () => {
  const results = searchPaletteResults(
    {
      bookmarks: [],
      history: [],
      tabs: [
        {
          id: 10,
          index: 0,
          title: "Google Docs Project Plan",
          url: "https://docs.google.com/document/d/project-plan",
        },
        {
          id: 11,
          index: 1,
          title: "Project Dashboard",
          url: "https://example.com/dashboard",
        },
      ],
      visits: [],
    },
    "gdocs",
    { sources: ["tabs"] },
  );

  assert.deepEqual(
    results.map((result) => result.title),
    ["Google Docs Project Plan"],
  );
});

test("ranks exact and prefix palette matches before fuzzy matches", () => {
  const results = searchPaletteResults(
    {
      bookmarks: [
        {
          id: "bookmark-docs",
          title: "Docs",
          url: "https://example.com/docs",
        },
      ],
      history: [],
      tabs: [
        {
          id: 10,
          index: 0,
          title: "Developer Operations Console",
          url: "https://example.com/dev-ops-console",
        },
      ],
      visits: [],
    },
    "docs",
    { sources: ["tabs", "bookmarks"] },
  );

  assert.equal(results[0].title, "Docs");
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

  const duckDuckGoResults = searchPaletteResults(
    { bookmarks: [], history: [], tabs: [] },
    "private search",
    { includeGenerated: true, searchEngine: "duckduckgo" },
  );

  assert.equal(duckDuckGoResults[0].subtitle, "DuckDuckGo");
  assert.equal(
    duckDuckGoResults[0].url,
    "https://duckduckgo.com/?q=private%20search",
  );

  const customResults = searchPaletteResults(
    { bookmarks: [], history: [], tabs: [] },
    "private search",
    {
      customSearchUrlTemplate: "https://search.example.com/?q={query}",
      includeGenerated: true,
      searchEngine: "custom",
    },
  );

  assert.equal(customResults[0].subtitle, "Custom Search");
  assert.equal(
    customResults[0].url,
    "https://search.example.com/?q=private%20search",
  );

  const unsafeCustomResults = searchPaletteResults(
    { bookmarks: [], history: [], tabs: [] },
    "private search",
    {
      customSearchUrlTemplate: "javascript:alert({query})",
      includeGenerated: true,
      searchEngine: "custom",
    },
  );

  assert.equal(unsafeCustomResults[0].subtitle, "Google Search");
});

test("filters generated palette results by generated kind", () => {
  const searchOnlyResults = searchPaletteResults(
    { bookmarks: [], history: [], tabs: [] },
    "example.com",
    { generatedKinds: ["search"], includeGenerated: true },
  );

  assert.deepEqual(
    searchOnlyResults.map((result) => result.kind),
    ["search"],
  );
  assert.equal(
    searchOnlyResults[0].url,
    "https://www.google.com/search?q=example.com",
  );

  const urlOnlyResults = searchPaletteResults(
    { bookmarks: [], history: [], tabs: [] },
    "example.com",
    { generatedKinds: ["url"], includeGenerated: true },
  );

  assert.deepEqual(
    urlOnlyResults.map((result) => result.kind),
    ["url"],
  );
  assert.equal(urlOnlyResults[0].url, "https://example.com");

  const invalidUrlResults = searchPaletteResults(
    { bookmarks: [], history: [], tabs: [] },
    "hello world",
    { generatedKinds: ["url"], includeGenerated: true },
  );

  assert.deepEqual(invalidUrlResults, []);
});

test("records local visits with canonical URLs, deduping, and a bounded list", () => {
  const first = recordLocalVisit(
    [],
    { title: "Docs", url: "https://example.com/docs#intro" },
    100,
  );

  assert.deepEqual(first, [
    {
      lastVisitTime: 100,
      title: "Docs",
      url: "https://example.com/docs",
      visitCount: 1,
    },
  ]);

  const next = recordLocalVisit(
    [
      ...first,
      {
        lastVisitTime: 90,
        title: "Older",
        url: "https://example.com/older",
        visitCount: 1,
      },
    ],
    { title: "Updated Docs", url: "https://example.com/docs#later" },
    200,
    1,
  );

  assert.deepEqual(next, [
    {
      lastVisitTime: 200,
      title: "Updated Docs",
      url: "https://example.com/docs",
      visitCount: 2,
    },
  ]);
});

test("removes local visits by canonical URL", () => {
  assert.deepEqual(
    removeLocalVisitByUrl(
      [
        {
          lastVisitTime: 100,
          title: "Docs",
          url: "https://example.com/docs",
          visitCount: 2,
        },
        {
          lastVisitTime: 90,
          title: "Other",
          url: "https://example.com/other",
          visitCount: 1,
        },
      ],
      "https://example.com/docs#section",
    ),
    [
      {
        lastVisitTime: 90,
        title: "Other",
        url: "https://example.com/other",
        visitCount: 1,
      },
    ],
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
      visits: [
        {
          lastVisitTime: Date.now(),
          title: "Bad visit",
          url: "javascript:alert(1)",
          visitCount: 1,
        },
      ],
    },
    "",
  );

  assert.deepEqual(
    results.map((result) => result.kind),
    ["tab"],
  );
});
