((
  global: typeof globalThis & {
    browser?: WebExtensionApi;
    SafariKeyboardNavigationTabs?: SafariKeyboardNavigationTabs;
  },
) => {
  const LOCAL_VISITS_STORAGE_KEY = "paletteLocalVisits";
  const LOCAL_VISITS_MAX_ITEMS = 500;
  const SETTINGS_STORAGE_KEY = "settings";
  const DEFAULT_SEARCH_ENGINE: SafariKeyboardNavigationSearchEngine = "google";
  const SEARCH_ENGINES: Record<
    SafariKeyboardNavigationSearchEngine,
    { label: string; urlPrefix: string }
  > = {
    brave: {
      label: "Brave Search",
      urlPrefix: "https://search.brave.com/search?q=",
    },
    duckduckgo: {
      label: "DuckDuckGo",
      urlPrefix: "https://duckduckgo.com/?q=",
    },
    google: {
      label: "Google Search",
      urlPrefix: "https://www.google.com/search?q=",
    },
    kagi: {
      label: "Kagi",
      urlPrefix: "https://kagi.com/search?q=",
    },
  };
  const PALETTE_GENERATED_KINDS: PaletteGeneratedKind[] = ["url", "search"];

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

  function paletteTabQueryInfo(): WebExtensionTabQuery {
    return {};
  }

  function searchPaletteResults(
    sources: {
      bookmarks: WebExtensionBookmarkTreeNode[];
      history: WebExtensionHistoryItem[];
      tabs: WebExtensionTab[];
      visits?: LocalVisitItem[];
    },
    query: string,
    options: {
      includeGenerated?: boolean;
      generatedKinds?: PaletteGeneratedKind[];
      searchEngine?: SafariKeyboardNavigationSearchEngine;
      sources?: PaletteSource[];
    } = {},
  ): PaletteResult[] {
    const normalizedQuery = normalizePaletteQuery(query);
    const sourceFilter = new Set<PaletteSource>(
      options.sources ?? ["tabs", "bookmarks", "history", "visits"],
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
      ...(sourceFilter.has("visits")
        ? (sources.visits ?? []).flatMap((visit) =>
            localVisitPaletteResult(visit, normalizedQuery),
          )
        : []),
      ...(options.includeGenerated
        ? generatedPaletteResults(
            normalizedQuery,
            options.searchEngine,
            options.generatedKinds,
          )
        : []),
    ];

    return dedupePaletteResults(results)
      .sort(comparePaletteResults)
      .slice(0, 24);
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
    executePaletteResult,
    isSupportedNewTabUrl,
    paletteTabQueryInfo,
    recordLocalVisit,
    removeLocalVisitByUrl,
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

      if (isPaletteRemoveLocalVisitMessage(message)) {
        return removeLocalVisit(api, message.url);
      }

      if (isObservePageMessage(message)) {
        return observePage(api, message);
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
    const [tabs, bookmarks, history, visits, searchEngine] = await Promise.all([
      sources.has("tabs") && api.tabs
        ? api.tabs.query(paletteTabQueryInfo())
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
      sources.has("visits") && api.storage?.local
        ? loadLocalVisits(api).then((items) =>
            trimmedQuery ? items : items.slice(0, 12),
          )
        : Promise.resolve([]),
      loadConfiguredSearchEngine(api),
    ]);

    return {
      results: searchPaletteResults(
        { bookmarks, history, tabs, visits },
        message.query,
        {
          includeGenerated: message.includeGenerated,
          generatedKinds: message.generatedKinds ?? PALETTE_GENERATED_KINDS,
          searchEngine,
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
      if (
        (disposition === "new-tab" || disposition === "background-tab") &&
        result.url
      ) {
        await api.tabs.create({
          active: disposition === "new-tab",
          url: result.url,
        });
        await recordPaletteActivation(api, result);
        return;
      }

      await api.tabs.update(result.tabId, { active: true });
      if (typeof result.windowId === "number") {
        await api.windows
          ?.update(result.windowId, { focused: true })
          .catch(() => undefined);
      }
      await recordPaletteActivation(api, result);
      return;
    }

    if (!result.url || !isSupportedNewTabUrl(result.url)) {
      return;
    }

    if (disposition === "new-tab" || disposition === "background-tab") {
      await api.tabs.create({
        active: disposition === "new-tab",
        url: result.url,
      });
      await recordPaletteActivation(api, result);
      return;
    }

    const activeTabs = await api.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTabId = activeTabs[0]?.id;
    if (typeof activeTabId === "number") {
      await api.tabs.update(activeTabId, { url: result.url });
      await recordPaletteActivation(api, result);
      return;
    }

    await api.tabs.create({ url: result.url, active: true });
    await recordPaletteActivation(api, result);
  }

  async function observePage(
    api: WebExtensionApi,
    message: ObservePageMessage,
  ): Promise<void> {
    if (!api.storage?.local || !isSupportedNewTabUrl(message.url)) {
      return;
    }

    const visits = await loadLocalVisits(api);
    const nextVisits = recordLocalVisit(visits, message, Date.now());

    await api.storage.local.set({ [LOCAL_VISITS_STORAGE_KEY]: nextVisits });
  }

  async function removeLocalVisit(
    api: WebExtensionApi,
    url: string,
  ): Promise<{ removed: boolean }> {
    if (!api.storage?.local || !isSupportedNewTabUrl(url)) {
      return { removed: false };
    }

    const visits = await loadLocalVisits(api);
    const nextVisits = removeLocalVisitByUrl(visits, url);
    if (nextVisits.length === visits.length) {
      return { removed: false };
    }

    await api.storage.local.set({ [LOCAL_VISITS_STORAGE_KEY]: nextVisits });
    return { removed: true };
  }

  async function recordPaletteActivation(
    api: WebExtensionApi,
    result: PaletteResult,
  ): Promise<void> {
    if (
      result.kind === "search" ||
      !api.storage?.local ||
      !result.url ||
      !isSupportedNewTabUrl(result.url)
    ) {
      return;
    }

    const visits = await loadLocalVisits(api);
    const nextVisits = recordLocalVisit(
      visits,
      { title: result.title, url: result.url },
      Date.now(),
    );

    await api.storage.local.set({ [LOCAL_VISITS_STORAGE_KEY]: nextVisits });
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
      (candidate.generatedKinds === undefined ||
        (Array.isArray(candidate.generatedKinds) &&
          candidate.generatedKinds.every(isPaletteGeneratedKind))) &&
      typeof candidate.includeGenerated === "boolean"
    );
  }

  function isPaletteGeneratedKind(
    value: unknown,
  ): value is PaletteGeneratedKind {
    return value === "url" || value === "search";
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
        candidate.disposition === "new-tab" ||
        candidate.disposition === "background-tab") &&
      !!candidate.result &&
      typeof candidate.result === "object"
    );
  }

  function isPaletteRemoveLocalVisitMessage(
    message: unknown,
  ): message is PaletteRemoveLocalVisitMessage {
    if (!message || typeof message !== "object") {
      return false;
    }

    const candidate = message as Partial<PaletteRemoveLocalVisitMessage>;
    return (
      candidate.type === "palette-remove-local-visit" &&
      typeof candidate.url === "string"
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

  function isObservePageMessage(
    message: unknown,
  ): message is ObservePageMessage {
    if (!message || typeof message !== "object") {
      return false;
    }

    const candidate = message as Partial<ObservePageMessage>;
    return (
      candidate.type === "observe-page" &&
      typeof candidate.url === "string" &&
      typeof candidate.title === "string"
    );
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

    const result: PaletteResult = {
      id: `tab:${tab.id}`,
      kind: "tab",
      score: score + 20 + (tab.active ? 2 : 0),
      subtitle: tab.url ?? "Open tab",
      tabId: tab.id,
      title,
      url: tab.url,
    };
    if (typeof tab.windowId === "number") {
      result.windowId = tab.windowId;
    }

    return [result];
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

  function localVisitPaletteResult(
    visit: LocalVisitItem,
    query: string,
  ): PaletteResult[] {
    if (!isSupportedNewTabUrl(visit.url)) {
      return [];
    }

    const title = displayTitle(visit.title, visit.url);
    const score = paletteMatchScore(query, title, visit.url);
    if (score === null) {
      return [];
    }

    const recencyBoost = Math.min(
      8,
      Math.max(0, visit.lastVisitTime / Date.now()) * 8,
    );
    const frequencyBoost = Math.min(6, Math.max(0, visit.visitCount));

    return [
      {
        id: `visit:${visit.url}`,
        kind: "visit",
        score: score + recencyBoost + frequencyBoost,
        subtitle: visit.url,
        title,
        url: visit.url,
      },
    ];
  }

  function comparePaletteResults(a: PaletteResult, b: PaletteResult): number {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return a.title.localeCompare(b.title);
  }

  function dedupePaletteResults(results: PaletteResult[]): PaletteResult[] {
    const seen = new Map<string, PaletteResult>();
    const deduped: PaletteResult[] = [];

    for (const result of results) {
      const key = paletteResultDedupeKey(result);
      if (!key) {
        deduped.push(result);
        continue;
      }

      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, result);
        deduped.push(result);
        continue;
      }

      if (comparePaletteResultPreference(result, existing) < 0) {
        seen.set(key, result);
        const index = deduped.indexOf(existing);
        if (index >= 0) {
          deduped[index] = result;
        }
      }
    }

    return deduped;
  }

  function comparePaletteResultPreference(
    a: PaletteResult,
    b: PaletteResult,
  ): number {
    const rankDifference =
      paletteResultKindRank(a.kind) - paletteResultKindRank(b.kind);
    if (rankDifference !== 0) {
      return rankDifference;
    }

    return comparePaletteResults(a, b);
  }

  function paletteResultKindRank(kind: PaletteResultKind): number {
    switch (kind) {
      case "tab":
        return 0;
      case "bookmark":
        return 1;
      case "history":
        return 2;
      case "visit":
        return 3;
      case "url":
        return 4;
      case "search":
        return 5;
    }
  }

  function paletteResultDedupeKey(result: PaletteResult): string | null {
    if (!result.url || result.kind === "search") {
      return null;
    }

    try {
      return canonicalDestinationUrl(result.url);
    } catch {
      return null;
    }
  }

  function generatedPaletteResults(
    query: string,
    searchEngine: SafariKeyboardNavigationSearchEngine = DEFAULT_SEARCH_ENGINE,
    generatedKinds: PaletteGeneratedKind[] = PALETTE_GENERATED_KINDS,
  ): PaletteResult[] {
    if (!query) {
      return [];
    }

    const results: PaletteResult[] = [];
    const kindFilter = new Set(generatedKinds);
    const directUrl = directNavigationUrl(query);
    if (directUrl && kindFilter.has("url")) {
      results.push({
        id: `url:${directUrl}`,
        kind: "url",
        score: 95,
        subtitle: directUrl,
        title: `Open ${directUrl}`,
        url: directUrl,
      });
    }

    if (kindFilter.has("search")) {
      const engine = SEARCH_ENGINES[searchEngine] ?? SEARCH_ENGINES.google;
      results.push({
        id: `search:${query}`,
        kind: "search",
        score: directUrl ? 5 : 70,
        subtitle: engine.label,
        title: `Search for "${query}"`,
        url: `${engine.urlPrefix}${encodeURIComponent(query)}`,
      });
    }

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
    if (!terms.every((term) => paletteTermMatches(term, haystack))) {
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
      const titleFuzzyScore = fuzzyMatchScore(term, titleLower);
      const urlFuzzyScore = fuzzyMatchScore(term, urlLower);
      return score + Math.max(titleFuzzyScore ?? 0, urlFuzzyScore ?? 0);
    }, 0);
  }

  function paletteTermMatches(term: string, haystack: string): boolean {
    return haystack.includes(term) || fuzzyMatchScore(term, haystack) !== null;
  }

  function fuzzyMatchScore(term: string, haystack: string): number | null {
    if (!term) {
      return 0;
    }

    let termIndex = 0;
    let previousMatchIndex = -1;
    let score = 0;
    for (let index = 0; index < haystack.length; index += 1) {
      if (haystack[index] !== term[termIndex]) {
        continue;
      }

      score += index === previousMatchIndex + 1 ? 3 : 1;
      if (isWordBoundary(haystack, index)) {
        score += 2;
      }

      previousMatchIndex = index;
      termIndex += 1;
      if (termIndex === term.length) {
        return score;
      }
    }

    return null;
  }

  function isWordBoundary(value: string, index: number): boolean {
    if (index === 0) {
      return true;
    }

    return /[\s/._:#?-]/.test(value[index - 1] ?? "");
  }

  function normalizePaletteQuery(query: string): string {
    return query.trim().toLowerCase();
  }

  async function loadLocalVisits(
    api: WebExtensionApi,
  ): Promise<LocalVisitItem[]> {
    const result = await api.storage?.local?.get(LOCAL_VISITS_STORAGE_KEY);
    const value = result?.[LOCAL_VISITS_STORAGE_KEY];
    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((item): LocalVisitItem[] => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as Partial<LocalVisitItem>;
      if (
        typeof candidate.url !== "string" ||
        !isSupportedNewTabUrl(candidate.url)
      ) {
        return [];
      }

      return [
        {
          lastVisitTime:
            typeof candidate.lastVisitTime === "number" &&
            Number.isFinite(candidate.lastVisitTime)
              ? candidate.lastVisitTime
              : 0,
          title:
            typeof candidate.title === "string"
              ? candidate.title
              : displayTitle(undefined, candidate.url),
          url: canonicalDestinationUrl(candidate.url),
          visitCount:
            typeof candidate.visitCount === "number" &&
            Number.isFinite(candidate.visitCount)
              ? Math.max(1, Math.floor(candidate.visitCount))
              : 1,
        },
      ];
    });
  }

  function recordLocalVisit(
    visits: LocalVisitItem[],
    page: { title: string; url: string },
    now: number,
    maxItems = LOCAL_VISITS_MAX_ITEMS,
  ): LocalVisitItem[] {
    if (!isSupportedNewTabUrl(page.url)) {
      return visits.slice(0, maxItems);
    }

    const url = canonicalDestinationUrl(page.url);
    const existing = visits.find((visit) => visit.url === url);
    const nextVisit: LocalVisitItem = {
      lastVisitTime: now,
      title: displayTitle(page.title, url),
      url,
      visitCount: (existing?.visitCount ?? 0) + 1,
    };

    return [nextVisit, ...visits.filter((visit) => visit.url !== url)]
      .sort((a, b) => b.lastVisitTime - a.lastVisitTime)
      .slice(0, maxItems);
  }

  function removeLocalVisitByUrl(
    visits: LocalVisitItem[],
    url: string,
  ): LocalVisitItem[] {
    if (!isSupportedNewTabUrl(url)) {
      return visits;
    }

    const targetUrl = canonicalDestinationUrl(url);
    return visits.filter((visit) => visit.url !== targetUrl);
  }

  async function loadConfiguredSearchEngine(
    api: WebExtensionApi,
  ): Promise<SafariKeyboardNavigationSearchEngine> {
    if (!api.storage?.local) {
      return DEFAULT_SEARCH_ENGINE;
    }

    const result = await api.storage.local.get(SETTINGS_STORAGE_KEY);
    const settings = result[SETTINGS_STORAGE_KEY];
    if (!settings || typeof settings !== "object") {
      return DEFAULT_SEARCH_ENGINE;
    }

    const commandPalette = (
      settings as Partial<SafariKeyboardNavigationExtensionSettings>
    ).commandPalette;
    return searchEngineSetting(commandPalette?.searchEngine);
  }

  function searchEngineSetting(
    value: unknown,
  ): SafariKeyboardNavigationSearchEngine {
    return typeof value === "string" && value in SEARCH_ENGINES
      ? (value as SafariKeyboardNavigationSearchEngine)
      : DEFAULT_SEARCH_ENGINE;
  }

  function canonicalDestinationUrl(url: string): string {
    const parsedUrl = new URL(url);
    parsedUrl.hash = "";
    return parsedUrl.toString();
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
