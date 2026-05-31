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

type SafariKeyboardNavigationSiteAccessMode = "all" | "allowlist";

interface SafariKeyboardNavigationShortcutSettings {
  hint: string;
  newTabHint: string;
  left: string;
  down: string;
  up: string;
  right: string;
  halfPageDown: string;
  halfPageUp: string;
  top: string;
  bottom: string;
  copyUrl: string;
  reload: string;
  historyBack: string;
  historyForward: string;
  tabPrevious: string;
  tabNext: string;
  help: string;
}

interface SafariKeyboardNavigationHintStyleSettings {
  backgroundColor: string;
  fontSize: number;
  fontWeight: number;
  mediaFontSize: number;
  opacity: number;
  textColor: string;
}

interface SafariKeyboardNavigationSiteAccessSettings {
  allowlist: string[];
  blocklist: string[];
  mode: SafariKeyboardNavigationSiteAccessMode;
}

interface SafariKeyboardNavigationExtensionSettings {
  enabled: boolean;
  hintStyle: SafariKeyboardNavigationHintStyleSettings;
  shortcuts: SafariKeyboardNavigationShortcutSettings;
  siteAccess: SafariKeyboardNavigationSiteAccessSettings;
  version: 1;
}

interface ParsedShortcut {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  sequence: string[];
  shiftKey: boolean;
}

interface SafariKeyboardNavigationSettingsApi {
  DEFAULT_EXTENSION_SETTINGS: SafariKeyboardNavigationExtensionSettings;
  SETTINGS_STORAGE_KEY: string;
  isExtensionEnabledForUrl(
    settings: SafariKeyboardNavigationExtensionSettings,
    href: string,
  ): boolean;
  isShortcutEvent(
    event: KeyboardEvent,
    shortcut: string,
    options?: { allowRepeat?: boolean },
  ): boolean;
  loadExtensionSettings(): Promise<SafariKeyboardNavigationExtensionSettings>;
  normalizeExtensionSettings(
    input: unknown,
  ): SafariKeyboardNavigationExtensionSettings;
  saveExtensionSettings(
    settings: SafariKeyboardNavigationExtensionSettings,
  ): Promise<void>;
  shortcutSequence(shortcut: string): string[] | null;
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

interface WebExtensionStorageChange {
  newValue?: unknown;
  oldValue?: unknown;
}

interface WebExtensionStorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

interface WebExtensionStorage {
  local?: WebExtensionStorageArea;
  onChanged?: {
    addListener(
      listener: (
        changes: Record<string, WebExtensionStorageChange>,
        areaName: string,
      ) => void,
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
  storage?: WebExtensionStorage;
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
