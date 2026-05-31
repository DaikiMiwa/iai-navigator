((
  global: typeof globalThis & {
    browser?: WebExtensionApi;
    SafariKeyboardNavigationTabs?: SafariKeyboardNavigationTabs;
  },
) => {
  function chooseNeighborTabId(
    tabs: WebExtensionTab[],
    activeTabId: number,
    direction: TabSwitchDirection,
  ): number | null {
    const orderedTabs = tabs
      .filter((tab): tab is WebExtensionTab & { id: number } =>
        Number.isFinite(tab.id),
      )
      .sort((a, b) => a.index - b.index);
    const activeIndex = orderedTabs.findIndex((tab) => tab.id === activeTabId);
    if (activeIndex < 0) {
      return null;
    }

    const offset = direction === "previous" ? -1 : 1;
    return orderedTabs[activeIndex + offset]?.id ?? null;
  }

  function isSupportedNewTabUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }

  function searchPaletteResults(
    sources: {
      bookmarks: WebExtensionBookmarkTreeNode[];
      history: WebExtensionHistoryItem[];
      tabs: WebExtensionTab[];
    },
    query: string,
    options: { includeGenerated?: boolean; sources?: PaletteSource[] } = {},
  ): PaletteResult[] {
    const normalizedQuery = normalizePaletteQuery(query);
    const sourceFilter = new Set<PaletteSource>(
      options.sources ?? ["tabs", "bookmarks", "history"],
    );
    const results: PaletteResult[] = [
      ...(sourceFilter.has("tabs")
        ? sources.tabs.flatMap((tab) => tabPaletteResult(tab, normalizedQuery))
        : []),
      ...(sourceFilter.has("bookmarks")
        ? sources.bookmarks.flatMap((bookmark) =>
            bookmarkPaletteResult(bookmark, normalizedQuery),
          )
        : []),
      ...(sourceFilter.has("history")
        ? sources.history.flatMap((historyItem) =>
            historyPaletteResult(historyItem, normalizedQuery),
          )
        : []),
      ...(options.includeGenerated
        ? generatedPaletteResults(normalizedQuery)
        : []),
    ];

    return results.sort(comparePaletteResults).slice(0, 24);
  }

  function tabSwitchDirectionForCommand(
    command: string,
  ): TabSwitchDirection | null {
    switch (command) {
      case "switch-tab-previous":
        return "previous";
      case "switch-tab-next":
        return "next";
      default:
        return null;
    }
  }

  global.SafariKeyboardNavigationTabs = {
    chooseNeighborTabId,
    isSupportedNewTabUrl,
    searchPaletteResults,
    tabSwitchDirectionForCommand,
  };

  const api = global.browser;
  if (!api?.tabs) {
    return;
  }

  if (api.runtime?.onMessage) {
    api.runtime.onMessage.addListener((message) => {
      if (isTabSwitchMessage(message)) {
        return switchNeighborTab(api, message.direction);
      }

      if (isOpenTabMessage(message)) {
        return openTab(api, message);
      }

      if (isPaletteSearchMessage(message)) {
        return searchPalette(api, message);
      }

      if (isPaletteExecuteMessage(message)) {
        return executePaletteResult(api, message.result, message.disposition);
      }

      if (isOpenOptionsMessage(message)) {
        return api.runtime?.openOptionsPage?.();
      }

      return undefined;
    });
  }

  if (api.commands?.onCommand) {
    api.commands.onCommand.addListener((command) => {
      const direction = tabSwitchDirectionForCommand(command);
      if (direction) {
        void switchNeighborTab(api, direction);
      }
    });
  }

  async function switchNeighborTab(
    api: WebExtensionApi,
    direction: TabSwitchDirection,
  ): Promise<void> {
    if (!api.tabs) {
      return;
    }

    const activeTabs = await api.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTabId = activeTabs[0]?.id;
    if (typeof activeTabId !== "number") {
      return;
    }

    const tabs = await api.tabs.query({ currentWindow: true });
    const nextTabId = chooseNeighborTabId(tabs, activeTabId, direction);
    if (nextTabId === null) {
      return;
    }

    await api.tabs.update(nextTabId, { active: true });
  }

  async function openTab(
    api: WebExtensionApi,
    message: OpenTabMessage,
  ): Promise<void> {
    if (!api.tabs || !isSupportedNewTabUrl(message.url)) {
      return;
    }

    await api.tabs.create({
      url: message.url,
      active: message.active,
    });
  }

  async function searchPalette(
    api: WebExtensionApi,
    message: PaletteSearchMessage,
  ): Promise<PaletteSearchResponse> {
    const trimmedQuery = message.query.trim();
    const since = Date.now() - 1000 * 60 * 60 * 24 * 30;
    const sources = new Set(message.sources);
    const [tabs, bookmarks, history] = await Promise.all([
      sources.has("tabs") && api.tabs
        ? api.tabs.query({ currentWindow: true })
        : Promise.resolve([]),
      sources.has("bookmarks") && trimmedQuery && api.bookmarks
        ? api.bookmarks.search(trimmedQuery)
        : Promise.resolve([]),
      sources.has("history") && api.history
        ? api.history.search({
            text: trimmedQuery,
            startTime: since,
            maxResults: trimmedQuery ? 12 : 6,
          })
        : Promise.resolve([]),
    ]);

    return {
      results: searchPaletteResults(
        { bookmarks, history, tabs },
        message.query,
        {
          includeGenerated: message.includeGenerated,
          sources: message.sources,
        },
      ),
    };
  }

  async function executePaletteResult(
    api: WebExtensionApi,
    result: PaletteResult,
    disposition: PaletteDisposition,
  ): Promise<void> {
    if (!api.tabs) {
      return;
    }

    if (result.kind === "tab" && typeof result.tabId === "number") {
      if (disposition === "new-tab" && result.url) {
        await api.tabs.create({ url: result.url, active: true });
        return;
      }

      await api.tabs.update(result.tabId, { active: true });
      return;
    }

    if (!result.url || !isSupportedNewTabUrl(result.url)) {
      return;
    }

    if (disposition === "new-tab") {
      await api.tabs.create({ url: result.url, active: true });
      return;
    }

    const activeTabs = await api.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTabId = activeTabs[0]?.id;
    if (typeof activeTabId === "number") {
      await api.tabs.update(activeTabId, { url: result.url });
      return;
    }

    await api.tabs.create({ url: result.url, active: true });
  }

  function isTabSwitchMessage(message: unknown): message is TabSwitchMessage {
    if (!message || typeof message !== "object") {
      return false;
    }

    const candidate = message as Partial<TabSwitchMessage>;
    return (
      candidate.type === "switch-tab" &&
      (candidate.direction === "previous" || candidate.direction === "next")
    );
  }

  function isOpenTabMessage(message: unknown): message is OpenTabMessage {
    if (!message || typeof message !== "object") {
      return false;
    }

    const candidate = message as Partial<OpenTabMessage>;
    return (
      candidate.type === "open-tab" &&
      typeof candidate.url === "string" &&
      candidate.active === true
    );
  }

  function isPaletteSearchMessage(
    message: unknown,
  ): message is PaletteSearchMessage {
    if (!message || typeof message !== "object") {
      return false;
    }

    const candidate = message as Partial<PaletteSearchMessage>;
    return (
      candidate.type === "palette-search" &&
      typeof candidate.query === "string" &&
      Array.isArray(candidate.sources) &&
      typeof candidate.includeGenerated === "boolean"
    );
  }

  function isPaletteExecuteMessage(
    message: unknown,
  ): message is PaletteExecuteMessage {
    if (!message || typeof message !== "object") {
      return false;
    }

    const candidate = message as Partial<PaletteExecuteMessage>;
    return (
      candidate.type === "palette-execute" &&
      (candidate.disposition === "current-tab" ||
        candidate.disposition === "new-tab") &&
      !!candidate.result &&
      typeof candidate.result === "object"
    );
  }

  function isOpenOptionsMessage(
    message: unknown,
  ): message is OpenOptionsMessage {
    if (!message || typeof message !== "object") {
      return false;
    }

    return (message as Partial<OpenOptionsMessage>).type === "open-options";
  }

  function tabPaletteResult(
    tab: WebExtensionTab,
    query: string,
  ): PaletteResult[] {
    if (typeof tab.id !== "number") {
      return [];
    }

    const title = displayTitle(tab.title, tab.url);
    const score = paletteMatchScore(query, title, tab.url ?? "");
    if (score === null) {
      return [];
    }

    return [
      {
        id: `tab:${tab.id}`,
        kind: "tab",
        score: score + 20 + (tab.active ? 2 : 0),
        subtitle: tab.url ?? "Open tab",
        tabId: tab.id,
        title,
        url: tab.url,
      },
    ];
  }

  function bookmarkPaletteResult(
    bookmark: WebExtensionBookmarkTreeNode,
    query: string,
  ): PaletteResult[] {
    if (!bookmark.url || !isSupportedNewTabUrl(bookmark.url)) {
      return [];
    }

    const title = displayTitle(bookmark.title, bookmark.url);
    const score = paletteMatchScore(query, title, bookmark.url);
    if (score === null) {
      return [];
    }

    return [
      {
        id: `bookmark:${bookmark.id}`,
        kind: "bookmark",
        score: score + 10,
        subtitle: bookmark.url,
        title,
        url: bookmark.url,
      },
    ];
  }

  function historyPaletteResult(
    historyItem: WebExtensionHistoryItem,
    query: string,
  ): PaletteResult[] {
    if (!historyItem.url || !isSupportedNewTabUrl(historyItem.url)) {
      return [];
    }

    const title = displayTitle(historyItem.title, historyItem.url);
    const score = paletteMatchScore(query, title, historyItem.url);
    if (score === null) {
      return [];
    }

    const recencyBoost = historyItem.lastVisitTime
      ? Math.min(8, Math.max(0, historyItem.lastVisitTime / Date.now()) * 8)
      : 0;

    return [
      {
        id: `history:${historyItem.id}`,
        kind: "history",
        score: score + recencyBoost,
        subtitle: historyItem.url,
        title,
        url: historyItem.url,
      },
    ];
  }

  function comparePaletteResults(a: PaletteResult, b: PaletteResult): number {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return a.title.localeCompare(b.title);
  }

  function generatedPaletteResults(query: string): PaletteResult[] {
    if (!query) {
      return [];
    }

    const results: PaletteResult[] = [];
    const directUrl = directNavigationUrl(query);
    if (directUrl) {
      results.push({
        id: `url:${directUrl}`,
        kind: "url",
        score: 95,
        subtitle: directUrl,
        title: `Open ${directUrl}`,
        url: directUrl,
      });
    }

    results.push({
      id: `search:${query}`,
      kind: "search",
      score: directUrl ? 5 : 70,
      subtitle: "Google Search",
      title: `Search for "${query}"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    });

    return results;
  }

  function directNavigationUrl(query: string): string | null {
    if (/\s/.test(query)) {
      return null;
    }

    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(query)
      ? query
      : domainLikeQuery(query)
        ? `https://${query}`
        : "";
    if (!candidate || !isSupportedNewTabUrl(candidate)) {
      return null;
    }

    return candidate;
  }

  function domainLikeQuery(query: string): boolean {
    return (
      query === "localhost" ||
      query.startsWith("localhost:") ||
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#].*)?$/i.test(query)
    );
  }

  function paletteMatchScore(
    query: string,
    title: string,
    url: string,
  ): number | null {
    if (!query) {
      return 1;
    }

    const haystack = `${title} ${url}`.toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.every((term) => haystack.includes(term))) {
      return null;
    }

    const titleLower = title.toLowerCase();
    const urlLower = url.toLowerCase();
    return terms.reduce((score, term) => {
      if (titleLower === term) {
        return score + 80;
      }
      if (titleLower.startsWith(term)) {
        return score + 60;
      }
      if (titleLower.includes(term)) {
        return score + 40;
      }
      if (urlLower.includes(term)) {
        return score + 20;
      }
      return score;
    }, 0);
  }

  function normalizePaletteQuery(query: string): string {
    return query.trim().toLowerCase();
  }

  function displayTitle(
    title: string | undefined,
    url: string | undefined,
  ): string {
    const trimmedTitle = title?.trim();
    if (trimmedTitle) {
      return trimmedTitle;
    }

    if (!url) {
      return "Untitled";
    }

    try {
      return new URL(url).hostname || url;
    } catch {
      return url;
    }
  }
})(
  globalThis as typeof globalThis & {
    browser?: WebExtensionApi;
    SafariKeyboardNavigationTabs?: SafariKeyboardNavigationTabs;
  },
);
