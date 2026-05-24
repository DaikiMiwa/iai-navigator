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

  global.SafariKeyboardNavigationTabs = {
    chooseNeighborTabId,
  };

  const api = global.browser;
  if (!api?.runtime?.onMessage || !api.tabs) {
    return;
  }

  api.runtime.onMessage.addListener((message) => {
    if (!isTabSwitchMessage(message)) {
      return undefined;
    }

    return switchNeighborTab(api, message.direction);
  });

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
})(
  globalThis as typeof globalThis & {
    browser?: WebExtensionApi;
    SafariKeyboardNavigationTabs?: SafariKeyboardNavigationTabs;
  },
);
