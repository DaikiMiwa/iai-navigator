interface SafariKeyboardNavigationHints {
  DEFAULT_HINT_KEYS: string;
  generateHints(count: number, keys?: string): string[];
  hasPrefixCollision(hints: string[]): boolean;
}

interface ScrollSurfaceCandidate {
  id: string;
  kind: "probe" | "window" | "visible";
  canScroll: boolean;
  canMove: boolean;
  visibleArea: number;
}

interface SafariKeyboardNavigationScroll {
  WINDOW_SURFACE_ID: string;
  canMoveScrollPosition(
    scrollPosition: number,
    maxScroll: number,
    direction: number,
  ): boolean;
  chooseScrollSurface(
    candidates: ScrollSurfaceCandidate[],
    options: { requireCanMove: boolean },
  ): string;
  isScrollableOverflow(overflow: string): boolean;
  maxScroll(scrollSize: number, clientSize: number): number;
}

type TabSwitchDirection = "previous" | "next";

interface TabSwitchMessage {
  type: "switch-tab";
  direction: TabSwitchDirection;
}

interface OpenTabMessage {
  type: "open-tab";
  url: string;
  active: boolean;
}

type SafariKeyboardNavigationMessage = TabSwitchMessage | OpenTabMessage;

interface WebExtensionTab {
  id?: number;
  index: number;
}

interface WebExtensionTabQuery {
  active?: boolean;
  currentWindow?: boolean;
}

interface WebExtensionTabUpdate {
  active?: boolean;
}

interface WebExtensionTabCreate {
  active?: boolean;
  url: string;
}

interface WebExtensionRuntime {
  sendMessage(message: SafariKeyboardNavigationMessage): Promise<unknown>;
  onMessage?: {
    addListener(
      listener: (message: unknown) => Promise<unknown> | unknown | undefined,
    ): void;
  };
}

interface WebExtensionCommands {
  onCommand: {
    addListener(
      listener: (command: string) => Promise<unknown> | unknown | undefined,
    ): void;
  };
}

interface WebExtensionTabs {
  create(createProperties: WebExtensionTabCreate): Promise<WebExtensionTab>;
  query(queryInfo: WebExtensionTabQuery): Promise<WebExtensionTab[]>;
  update(
    tabId: number,
    updateProperties: WebExtensionTabUpdate,
  ): Promise<WebExtensionTab>;
}

interface WebExtensionApi {
  commands?: WebExtensionCommands;
  runtime?: WebExtensionRuntime;
  tabs?: WebExtensionTabs;
}

interface SafariKeyboardNavigationTabs {
  chooseNeighborTabId(
    tabs: WebExtensionTab[],
    activeTabId: number,
    direction: TabSwitchDirection,
  ): number | null;
  isSupportedNewTabUrl(url: string): boolean;
  tabSwitchDirectionForCommand(command: string): TabSwitchDirection | null;
}

declare const browser: WebExtensionApi | undefined;
