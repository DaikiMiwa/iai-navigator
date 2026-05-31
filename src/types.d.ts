interface SafariKeyboardNavigationHints {
  DEFAULT_HINT_KEYS: string;
  generateHints(count: number, keys?: string): string[];
  hasPrefixCollision(hints: string[]): boolean;
}

interface HelpShortcut {
  key: string;
  description: string;
}

interface HelpSection {
  title: string;
  shortcuts: readonly HelpShortcut[];
}

interface SafariKeyboardNavigationHelp {
  HELP_SECTIONS: readonly HelpSection[];
  isHelpCommandEvent(event: KeyboardEvent): boolean;
  isHelpCloseCommandEvent(event: KeyboardEvent): boolean;
}

interface SafariKeyboardNavigationMenuTriggerCandidate {
  tagName: string;
  role: string;
  hasAriaControls: boolean;
  hasAriaExpanded: boolean;
  hasAriaHaspopup: boolean;
  isAriaDisabled: boolean;
  isDisabled: boolean;
  isFormSubmitButton: boolean;
  isInNavigationContext: boolean;
  isLink: boolean;
  isNonButtonFormControl: boolean;
}

interface SafariKeyboardNavigationMediaControlCandidate {
  tagName: string;
  role: string;
  hasAccessibleName: boolean;
  isAriaDisabled: boolean;
  isDisabled: boolean;
  isFocusable: boolean;
  isInMediaControlSurface: boolean;
  isLink: boolean;
  isNativeControl: boolean;
  isYouTubeButton: boolean;
}

interface SafariKeyboardNavigationHintTargets {
  canClickMenuTriggerCandidate(
    candidate: SafariKeyboardNavigationMenuTriggerCandidate,
  ): boolean;
  isSafeMediaControlCandidate(
    candidate: SafariKeyboardNavigationMediaControlCandidate,
  ): boolean;
  isSafeMenuTriggerCandidate(
    candidate: SafariKeyboardNavigationMenuTriggerCandidate,
  ): boolean;
}

interface SafariKeyboardNavigationPageSupportCandidate {
  protocol: string;
  contentType: string;
  href: string;
}

interface SafariKeyboardNavigationPageSupport {
  isSupportedPdfCandidate(
    candidate: SafariKeyboardNavigationPageSupportCandidate,
  ): boolean;
  isSupportedWebPageCandidate(
    candidate: SafariKeyboardNavigationPageSupportCandidate,
  ): boolean;
}

interface SafariKeyboardNavigationMediaControlRevealCandidate {
  activationMode: "current-tab" | "new-tab";
  hasRevealableMediaSurfaces: boolean;
  hasVisibleMediaControls: boolean;
}

interface SafariKeyboardNavigationMediaReveal {
  isRevealableMediaControlsCandidate(
    candidate: SafariKeyboardNavigationMediaControlRevealCandidate,
  ): boolean;
  shouldPreRevealMediaControlsCandidate(
    candidate: SafariKeyboardNavigationMediaControlRevealCandidate,
  ): boolean;
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
  onCommand?: {
    addListener(listener: (command: string) => void): void;
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
