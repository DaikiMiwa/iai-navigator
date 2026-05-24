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

      return undefined;
    });
  }

  api.commands?.onCommand.addListener((command) => {
    const direction = tabSwitchDirectionForCommand(command);
    if (!direction) {
      return undefined;
    }

    return switchNeighborTab(api, direction);
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
})(
  globalThis as typeof globalThis & {
    browser?: WebExtensionApi;
    SafariKeyboardNavigationTabs?: SafariKeyboardNavigationTabs;
  },
);
