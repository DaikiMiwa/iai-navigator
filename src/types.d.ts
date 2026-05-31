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
  commandPalette: string;
  commandPaletteNewTab: string;
  bookmarkPalette: string;
  bookmarkPaletteNewTab: string;
  tabPalette: string;
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

type SafariKeyboardNavigationSearchEngine =
  | "google"
  | "duckduckgo"
  | "brave"
  | "kagi";

interface SafariKeyboardNavigationCommandPaletteSettings {
  searchEngine: SafariKeyboardNavigationSearchEngine;
}

interface SafariKeyboardNavigationExtensionSettings {
  commandPalette: SafariKeyboardNavigationCommandPaletteSettings;
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

type CommandPaletteKeyAction =
  | "close"
  | "next"
  | "previous"
  | "activate-current-tab"
  | "activate-new-tab"
  | "activate-background-tab";

interface CommandPaletteKeyCandidate {
  altKey: boolean;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
}

interface TextRange {
  start: number;
  end: number;
}

interface CommandPaletteQueryOptions {
  generatedKinds: PaletteGeneratedKind[];
  includeCommands: boolean;
  includeGenerated: boolean;
  sources: PaletteSource[];
}

interface CommandPaletteQueryScope extends CommandPaletteQueryOptions {
  query: string;
}

interface SafariKeyboardNavigationCommandPalette {
  COMMAND_PALETTE_FOOTER_HINTS: readonly string[];
  commandPaletteHighlightRanges(value: string, query: string): TextRange[];
  commandPaletteKeyAction(
    candidate: CommandPaletteKeyCandidate,
  ): CommandPaletteKeyAction | null;
  commandPaletteQueryScope(
    query: string,
    options: CommandPaletteQueryOptions,
  ): CommandPaletteQueryScope;
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

type PaletteResultKind =
  | "tab"
  | "bookmark"
  | "history"
  | "visit"
  | "url"
  | "search";
type PaletteSource = "tabs" | "bookmarks" | "history" | "visits";
type PaletteGeneratedKind = "url" | "search";
type PaletteDisposition = "current-tab" | "new-tab" | "background-tab";

interface PaletteResult {
  id: string;
  kind: PaletteResultKind;
  title: string;
  subtitle: string;
  url?: string;
  tabId?: number;
  windowId?: number;
  score: number;
}

interface PaletteSearchMessage {
  type: "palette-search";
  query: string;
  sources: PaletteSource[];
  generatedKinds?: PaletteGeneratedKind[];
  includeGenerated: boolean;
}

interface PaletteExecuteMessage {
  type: "palette-execute";
  disposition: PaletteDisposition;
  result: PaletteResult;
}

interface OpenOptionsMessage {
  type: "open-options";
}

interface ObservePageMessage {
  type: "observe-page";
  title: string;
  url: string;
}

interface PaletteSearchResponse {
  results: PaletteResult[];
}

type SafariKeyboardNavigationMessage =
  | TabSwitchMessage
  | OpenTabMessage
  | PaletteSearchMessage
  | PaletteExecuteMessage
  | OpenOptionsMessage
  | ObservePageMessage;

interface WebExtensionTab {
  active?: boolean;
  id?: number;
  index: number;
  title?: string;
  url?: string;
  windowId?: number;
}

interface WebExtensionTabQuery {
  active?: boolean;
  currentWindow?: boolean;
}

interface WebExtensionTabUpdate {
  active?: boolean;
  url?: string;
}

interface WebExtensionTabCreate {
  active?: boolean;
  url: string;
}

interface WebExtensionRuntime {
  sendMessage(message: SafariKeyboardNavigationMessage): Promise<unknown>;
  openOptionsPage?(): Promise<void>;
  onMessage?: {
    addListener(
      listener: (message: unknown) => Promise<unknown> | unknown | undefined,
    ): void;
  };
}

interface WebExtensionBookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
}

interface WebExtensionBookmarks {
  search(query: string): Promise<WebExtensionBookmarkTreeNode[]>;
}

interface WebExtensionHistoryItem {
  id: string;
  lastVisitTime?: number;
  title?: string;
  url?: string;
}

interface WebExtensionHistoryQuery {
  maxResults?: number;
  startTime?: number;
  text: string;
}

interface WebExtensionHistory {
  search(query: WebExtensionHistoryQuery): Promise<WebExtensionHistoryItem[]>;
}

interface LocalVisitItem {
  lastVisitTime: number;
  title: string;
  url: string;
  visitCount: number;
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

interface WebExtensionWindowUpdate {
  focused?: boolean;
}

interface WebExtensionWindows {
  update(
    windowId: number,
    updateInfo: WebExtensionWindowUpdate,
  ): Promise<unknown>;
}

interface WebExtensionApi {
  bookmarks?: WebExtensionBookmarks;
  commands?: WebExtensionCommands;
  history?: WebExtensionHistory;
  runtime?: WebExtensionRuntime;
  storage?: WebExtensionStorage;
  tabs?: WebExtensionTabs;
  windows?: WebExtensionWindows;
}

interface SafariKeyboardNavigationTabs {
  chooseNeighborTabId(
    tabs: WebExtensionTab[],
    activeTabId: number,
    direction: TabSwitchDirection,
  ): number | null;
  executePaletteResult(
    api: WebExtensionApi,
    result: PaletteResult,
    disposition: PaletteDisposition,
  ): Promise<void>;
  isSupportedNewTabUrl(url: string): boolean;
  paletteTabQueryInfo(): WebExtensionTabQuery;
  recordLocalVisit(
    visits: LocalVisitItem[],
    page: { title: string; url: string },
    now: number,
    maxItems?: number,
  ): LocalVisitItem[];
  searchPaletteResults(
    sources: {
      bookmarks: WebExtensionBookmarkTreeNode[];
      history: WebExtensionHistoryItem[];
      tabs: WebExtensionTab[];
      visits?: LocalVisitItem[];
    },
    query: string,
    options?: {
      generatedKinds?: PaletteGeneratedKind[];
      includeGenerated?: boolean;
      searchEngine?: SafariKeyboardNavigationSearchEngine;
      sources?: PaletteSource[];
    },
  ): PaletteResult[];
  tabSwitchDirectionForCommand(command: string): TabSwitchDirection | null;
}

declare const browser: WebExtensionApi | undefined;
