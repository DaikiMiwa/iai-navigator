(() => {
  interface HintPosition {
    left: number;
    top: number;
  }

  interface HintTargetBase {
    rect: HintPosition;
  }

  interface LinkTarget extends HintTargetBase {
    kind: "link";
    element: HTMLAnchorElement;
  }

  interface FormControlTarget extends HintTargetBase {
    kind: "form-control";
    element: FormControlTargetElement;
  }

  interface MenuTriggerTarget extends HintTargetBase {
    kind: "menu-trigger";
    element: HTMLElement;
  }

  interface MediaControlTarget extends HintTargetBase {
    kind: "media-control";
    element: HTMLElement;
  }

  interface MediaSurfaceTarget extends HintTargetBase {
    kind: "media-surface";
    element: HTMLElement;
  }

  interface SemanticActionTarget extends HintTargetBase {
    kind: "semantic-action";
    element: HTMLElement;
  }

  type HintTarget =
    | LinkTarget
    | FormControlTarget
    | MenuTriggerTarget
    | MediaControlTarget
    | MediaSurfaceTarget
    | SemanticActionTarget;
  type FormControlTargetElement =
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

  interface HintEntry {
    target: HintTarget;
    hint: string;
    label: HTMLSpanElement;
  }

  type HintActivationMode = "current-tab" | "new-tab";

  interface HintState {
    activationMode: HintActivationMode;
    entries: HintEntry[];
    input: string;
    overlay: HTMLDivElement;
  }

  interface HelpState {
    overlay: HTMLDivElement;
  }

  type LocalPaletteCommandId =
    | "show-hints"
    | "show-new-tab-hints"
    | "copy-url"
    | "edit-current-url"
    | "history-back"
    | "history-forward"
    | "new-tab"
    | "duplicate-current-tab"
    | "close-current-tab"
    | "previous-tab"
    | "next-tab"
    | "scroll-top"
    | "scroll-bottom"
    | "reload"
    | "open-settings";

  interface LocalPaletteCommand {
    id: LocalPaletteCommandId;
    title: string;
    subtitle: string;
    searchHaystack: string;
    searchAliases: string[];
  }

  interface LocalPaletteCommandResult {
    id: string;
    kind: "command";
    command: LocalPaletteCommandId;
    title: string;
    subtitle: string;
    score: number;
  }

  interface LocalPaletteQueryResult {
    id: string;
    kind: "query";
    query: string;
    title: string;
    subtitle: string;
    score: number;
  }

  type LocalPaletteResult = LocalPaletteCommandResult | LocalPaletteQueryResult;

  type BrowserPaletteResult = PaletteResult;
  type CommandPaletteResult = BrowserPaletteResult | LocalPaletteResult;

  interface CommandPaletteState {
    activeIndex: number;
    disposition: PaletteDisposition;
    generatedKinds: PaletteGeneratedKind[];
    history: string[];
    historyCursor: number | null;
    includeCommands: boolean;
    includeGenerated: boolean;
    hasImeRiskFromOpeningShortcut: boolean;
    input: HTMLInputElement;
    inputBeforeHistory: string;
    isComposingQuery: boolean;
    hasPendingImeConfirmation: boolean;
    ignoreNextEnterAfterComposition: boolean;
    list: HTMLDivElement;
    overlay: HTMLDivElement;
    results: CommandPaletteResult[];
    searchId: number;
    sawEnterDuringComposition: boolean;
    sources: PaletteSource[];
  }

  interface PageSupportCandidate {
    protocol: string;
    contentType: string;
    href: string;
  }

  interface MediaControlRevealCandidate {
    activationMode: HintActivationMode;
    hasRevealableMediaSurfaces: boolean;
    hasVisibleMediaControls: boolean;
  }

  interface Movement {
    key: string;
    dx: number;
    dy: number;
    speedX: number;
    speedY: number;
  }

  interface MovementState extends Movement {
    surface: ScrollSurface;
    startedAt: number;
    lastFrameAt: number;
    initialProgress: number;
    keyReleased: boolean;
    frameId: number;
  }

  type PageSequenceAction =
    | "top"
    | "edit-current-url-palette"
    | "edit-current-url-palette-new-tab";

  type ScrollAxis = "x" | "y";
  type ScrollSurface = Window | Element;

  interface ScrollSurfaceCollection {
    candidates: ScrollSurfaceCandidate[];
    surfaces: Map<string, ScrollSurface>;
  }

  const maybeHints = (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationHints?: SafariKeyboardNavigationHints;
    }
  ).SafariKeyboardNavigationHints;
  const maybeHelp = (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationHelp?: SafariKeyboardNavigationHelp;
    }
  ).SafariKeyboardNavigationHelp;
  const maybeScroll = (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationScroll?: SafariKeyboardNavigationScroll;
    }
  ).SafariKeyboardNavigationScroll;
  const maybeSettings = (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationSettings?: SafariKeyboardNavigationSettingsApi;
    }
  ).SafariKeyboardNavigationSettings;

  if (!maybeHints || !maybeHelp || !maybeScroll || !maybeSettings) {
    return;
  }

  const hints: SafariKeyboardNavigationHints = maybeHints;
  const help: SafariKeyboardNavigationHelp = maybeHelp;
  const scroll: SafariKeyboardNavigationScroll = maybeScroll;
  const settingsApi: SafariKeyboardNavigationSettingsApi = maybeSettings;

  const HELP_OVERLAY_ID = "skne-help-overlay";
  const COMMAND_PALETTE_OVERLAY_ID = "skne-command-palette-overlay";
  const COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY = "paletteQueryHistory";
  const COMMAND_PALETTE_QUERY_HISTORY_MAX_ITEMS = 50;
  const MEDIA_CONTROLS_REVEALED_CLASS = "skne-media-controls-revealed";
  const NATIVE_HINT_TARGET_SELECTOR =
    "a[href], button, input:not([type='password' i]), select, textarea";
  const MENU_TRIGGER_TARGET_SELECTOR = [
    "[aria-haspopup]",
    "[aria-expanded]",
    "[aria-controls]",
    "nav button",
    "header button",
    '[role="navigation"] button',
    '[role="menubar"] button',
    'nav [role="button"]',
    'header [role="button"]',
    '[role="navigation"] [role="button"]',
    '[role="menubar"] [role="button"]',
    '[role="menuitem"]',
  ].join(", ");
  const MEDIA_CONTROL_SURFACE_SELECTOR = [
    ".ytp-chrome-controls",
    ".ytp-chrome-bottom",
    "[data-skne-media-controls]",
  ].join(", ");
  const MEDIA_CONTROL_TARGET_SELECTOR = [
    "button",
    "input",
    "select",
    "textarea",
    '[role="button"]',
    '[role="slider"]',
    '[role="switch"]',
    '[role="menuitem"]',
    ".ytp-button",
    '[aria-label][tabindex]:not([tabindex="-1"])',
    '[title][tabindex]:not([tabindex="-1"])',
  ].join(", ");
  const MEDIA_SURFACE_TARGET_SELECTOR = [
    "#movie_player",
    ".html5-video-player",
    "[data-skne-media-player]",
  ].join(", ");
  const SEMANTIC_ACTION_TARGET_SELECTOR =
    '[role="button"], [role="link"], [role="tab"]';
  const MENU_TRIGGER_FOCUS_RESCAN_DELAY_MS = 80;
  const MENU_TRIGGER_CLICK_RESCAN_DELAY_MS = 120;
  const MEDIA_SURFACE_RESCAN_DELAY_MS = 120;
  const TOP_SEQUENCE_WINDOW_MS = 800;
  const URL_COPY_SEQUENCE_WINDOW_MS = 800;
  const URL_COPY_TOAST_MS = 1200;
  const HOLD_DELAY_MS = 140;
  const VERTICAL_STEP_PX = 72;
  const HORIZONTAL_STEP_PX = 84;
  const COMMAND_PALETTE_PAGE_STEP = 8;
  const HALF_PAGE_RATIO = 0.5;
  const VERTICAL_HOLD_SPEED_PX_PER_SECOND = 720;
  const HORIZONTAL_HOLD_SPEED_PX_PER_SECOND = 720;
  const TEXT_ENTRY_INPUT_TYPES = new Set([
    "email",
    "number",
    "password",
    "search",
    "tel",
    "text",
    "url",
  ]);
  interface MultilingualPaletteCommand {
    id: LocalPaletteCommandId;
    titles: Record<string, string>;
    subtitles: Record<string, string>;
    aliases: Record<string, string[]>;
  }
  const RAW_LOCAL_PALETTE_COMMANDS: MultilingualPaletteCommand[] = [
    {
      id: "show-hints",
      titles: {
        en: "Show hints",
        ja: "ヒントを表示",
      },
      subtitles: {
        en: "Open link and control hints in the current tab",
        ja: "現在のタブでリンクやコントロールのヒントを表示します",
      },
      aliases: {
        en: ["hint", "f"],
        ja: ["ひんと", "ヒント", "f"],
      },
    },
    {
      id: "show-new-tab-hints",
      titles: {
        en: "Show hints in new tab",
        ja: "新規タブでヒントを表示",
      },
      subtitles: {
        en: "Open link hints for foreground tabs",
        ja: "リンクのヒントを新しいフォアグラウンドタブで開きます",
      },
      aliases: {
        en: ["hint new", "new hint", "shift f"],
        ja: ["ひんと", "ヒント", "新規タブ", "しんきたぶ", "shift f"],
      },
    },
    {
      id: "copy-url",
      titles: {
        en: "Copy current URL",
        ja: "現在のURLをコピー",
      },
      subtitles: {
        en: "Copy this page address to the clipboard",
        ja: "このページのURLをクリップボードにコピーします",
      },
      aliases: {
        en: ["copy address", "copy link", "yy", "yank"],
        ja: ["こぴー", "コピー", "アドレス", "あどれす", "yy", "ヤンク"],
      },
    },
    {
      id: "edit-current-url",
      titles: {
        en: "Edit current URL",
        ja: "現在のURLを編集",
      },
      subtitles: {
        en: "Put this page address in the palette input before opening",
        ja: "このページのURLをパレットの入力欄に入れてから開きます",
      },
      aliases: {
        en: ["edit url", "edit address", "current url", "ge"],
        ja: ["へんしゅう", "編集", "アドレス", "ge"],
      },
    },
    {
      id: "history-back",
      titles: {
        en: "Go back",
        ja: "戻る",
      },
      subtitles: {
        en: "Navigate back in the current tab history",
        ja: "現在のタブの履歴を1つ戻ります",
      },
      aliases: {
        en: ["back", "go back", "history back", "h"],
        ja: ["もどる", "戻る", "履歴", "りれき", "h"],
      },
    },
    {
      id: "history-forward",
      titles: {
        en: "Go forward",
        ja: "進む",
      },
      subtitles: {
        en: "Navigate forward in the current tab history",
        ja: "現在のタブの履歴を1つ進みます",
      },
      aliases: {
        en: ["forward", "go forward", "history forward", "l"],
        ja: ["すすむ", "進む", "履歴", "りれき", "l"],
      },
    },
    {
      id: "new-tab",
      titles: {
        en: "New tab",
        ja: "新しいタブ",
      },
      subtitles: {
        en: "Open a new foreground tab",
        ja: "新しいフォアグラウンドタブを開きます",
      },
      aliases: {
        en: ["new", "new page", "nt", "open tab", "create tab"],
        ja: ["しんき", "新規", "新しいタブ", "nt", "タブ"],
      },
    },
    {
      id: "duplicate-current-tab",
      titles: {
        en: "Duplicate current tab",
        ja: "現在のタブを複製",
      },
      subtitles: {
        en: "Copy the current tab into a new foreground tab",
        ja: "現在のタブを新しいフォアグラウンドタブに複製します",
      },
      aliases: {
        en: ["duplicate tab", "dup", "clone tab"],
        ja: ["ふくせい", "複製", "タブ", "dup"],
      },
    },
    {
      id: "close-current-tab",
      titles: {
        en: "Close current tab",
        ja: "現在のタブを閉じる",
      },
      subtitles: {
        en: "Close this tab when another tab is available",
        ja: "このタブを閉じます（他のタブがある場合）",
      },
      aliases: {
        en: ["close tab", "delete tab", "remove tab", "x"],
        ja: ["とじる", "閉じる", "さくじょ", "削除", "x", "タブ"],
      },
    },
    {
      id: "previous-tab",
      titles: {
        en: "Previous tab",
        ja: "前のタブ",
      },
      subtitles: {
        en: "Switch to the tab on the left",
        ja: "左隣のタブに切り替えます",
      },
      aliases: {
        en: ["previous tab", "prev tab", "left tab", "shift j"],
        ja: ["まえのたぶ", "前のタブ", "ひだり", "左", "shift j"],
      },
    },
    {
      id: "next-tab",
      titles: {
        en: "Next tab",
        ja: "次のタブ",
      },
      subtitles: {
        en: "Switch to the tab on the right",
        ja: "右隣のタブに切り替えます",
      },
      aliases: {
        en: ["next tab", "right tab", "shift k"],
        ja: ["つぎのたぶ", "次のタブ", "みぎ", "右", "shift k"],
      },
    },
    {
      id: "scroll-top",
      titles: {
        en: "Scroll to top",
        ja: "最上部へスクロール",
      },
      subtitles: {
        en: "Jump to the top of the current scroll area",
        ja: "現在のスクロール領域の最上部に移動します",
      },
      aliases: {
        en: ["top", "gg"],
        ja: ["さいじょうぶ", "最上部", "うえ", "上", "gg"],
      },
    },
    {
      id: "scroll-bottom",
      titles: {
        en: "Scroll to bottom",
        ja: "最下部へスクロール",
      },
      subtitles: {
        en: "Jump to the bottom of the current scroll area",
        ja: "現在のスクロール領域の最下部に移動します",
      },
      aliases: {
        en: ["bottom", "g", "end"],
        ja: ["さいかぶ", "最下部", "した", "下", "g", "end"],
      },
    },
    {
      id: "reload",
      titles: {
        en: "Reload page",
        ja: "ページを再読み込み",
      },
      subtitles: {
        en: "Reload the current page",
        ja: "現在のページを再読み込みします",
      },
      aliases: {
        en: ["refresh"],
        ja: ["りろーど", "リロード", "さいよみこみ", "再読み込み", "更新"],
      },
    },
    {
      id: "open-settings",
      titles: {
        en: "Open settings",
        ja: "設定を開く",
      },
      subtitles: {
        en: "Configure shortcuts, sites, and hint appearance",
        ja: "ショートカット、対象サイト、ヒントの見た目を設定します",
      },
      aliases: {
        en: ["options", "preferences", "config"],
        ja: [
          "おぷしょん",
          "オプション",
          "せってい",
          "設定",
          "config",
          "かんり",
          "管理",
        ],
      },
    },
  ];
  function resolveLanguage(): string {
    const settingLang = extensionSettings?.language ?? "auto";
    if (settingLang === "auto") {
      return (
        (typeof navigator !== "undefined" &&
          navigator.language?.split("-")[0]) ||
        "en"
      );
    }
    return settingLang;
  }
  function getLocalPaletteCommands(): LocalPaletteCommand[] {
    const lang = resolveLanguage();
    return RAW_LOCAL_PALETTE_COMMANDS.map((raw) => {
      const title = raw.titles[lang] ?? raw.titles.en;
      const subtitle = raw.subtitles[lang] ?? raw.subtitles.en;
      const searchHaystack = [
        ...Object.values(raw.titles),
        ...Object.values(raw.subtitles),
      ]
        .join(" ")
        .toLowerCase();
      const searchAliases = Object.values(raw.aliases).flat();
      return {
        id: raw.id,
        title,
        subtitle,
        searchHaystack,
        searchAliases,
      };
    });
  }
  const COMMAND_PALETTE_FOOTER_HINTS = [
    "Enter/Ctrl+M open",
    "Esc/Ctrl+[/G close",
    "Shift+Enter new tab",
    "Option+Enter background",
    "Option+C copy URL",
    "Option+Y copy Markdown",
    "Option+E edit URL",
    "Option+D same domain",
    "Option+F title filter",
    "Option+U URL filter",
    "Option+⌫ forget local/query",
    "Option+W close tab",
    "Option+1-9 open result",
    "Tab/Ctrl+I next",
    "Ctrl+J/K move",
    "Ctrl+F/V/B page",
    "Ctrl+A/D/E/H/L/U/W edit",
    "Ctrl+R/Option+R refresh",
    "Option+↑/↓ query history",
    "Option+A/T/B/H/V/S/M source",
    "Shift+Option+U URL source",
    "tab: book: history: visit: search: g: ddg: br: k: yt: w: url: cmd:",
  ] as const;
  const COMMAND_PALETTE_GENERATED_KINDS: PaletteGeneratedKind[] = [
    "url",
    "search",
  ];

  (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationHintTargets?: SafariKeyboardNavigationHintTargets;
    }
  ).SafariKeyboardNavigationHintTargets = {
    canClickMenuTriggerCandidate,
    isSafeMediaControlCandidate,
    isSafeMenuTriggerCandidate,
  };
  (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationPageSupport?: SafariKeyboardNavigationPageSupport;
    }
  ).SafariKeyboardNavigationPageSupport = {
    isSupportedPdfCandidate,
    isSupportedWebPageCandidate,
  };
  (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationMediaReveal?: SafariKeyboardNavigationMediaReveal;
    }
  ).SafariKeyboardNavigationMediaReveal = {
    isRevealableMediaControlsCandidate,
    shouldPreRevealMediaControlsCandidate,
  };
  (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationCommandPalette?: SafariKeyboardNavigationCommandPalette;
    }
  ).SafariKeyboardNavigationCommandPalette = {
    COMMAND_PALETTE_FOOTER_HINTS,
    commandPaletteApplyPrefixValue,
    commandPaletteCommandIds,
    commandPaletteCommandSearchIds,
    commandPaletteCurrentUrlEditValue,
    commandPaletteDeleteNextCharacterValue,
    commandPaletteDeletePreviousCharacterValue,
    commandPaletteDomainFilterValue,
    commandPaletteEditableResultValue,
    commandPaletteHistoryNavigation,
    commandPaletteHighlightRanges,
    commandPaletteIsImeConfirmEnter,
    commandPaletteKeyAction,
    commandPaletteMoveCaretRange,
    commandPaletteSelectAllRange,
    commandPaletteDeletePreviousWordValue,
    commandPaletteMarkdownLinkValue,
    commandPaletteNextIndexAfterActivation,
    commandPaletteQueryScope,
    recentPaletteQueryResultTitles,
    commandPaletteShouldCloseAfterActivation,
    commandPaletteTitleFilterValue,
    commandPaletteUrlFilterValue,
  };

  let hintState: HintState | null = null;
  let helpState: HelpState | null = null;
  let commandPaletteState: CommandPaletteState | null = null;
  let pendingPageSequence:
    | (ShortcutSequenceKey & { startedAt: number })
    | null = null;
  let lastYPressAt = 0;
  let urlCopyToastTimer = 0;
  let movementState: MovementState | null = null;
  let menuRevealTimer = 0;
  let extensionSettings = settingsApi.DEFAULT_EXTENSION_SETTINGS;
  let lastObservedPageKey = "";
  const revealedMediaControlSurfaces = new Set<HTMLElement>();

  initializeExtensionSettings();
  observeCurrentPageSoon();
  window.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("blur", stopMovement, true);
  window.addEventListener("hashchange", observeCurrentPageSoon, true);
  window.addEventListener("pageshow", observeCurrentPageSoon, true);
  window.addEventListener("pagehide", closeHelpOverlay, true);
  window.addEventListener("pagehide", closeCommandPalette, true);
  window.addEventListener("pagehide", stopMovement, true);
  window.addEventListener("popstate", observeCurrentPageSoon, true);
  observeSinglePageAppNavigations();
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        observeCurrentPageSoon();
      }
    });
    document.addEventListener("DOMContentLoaded", observeCurrentPageSoon, {
      once: true,
    });
    observeTitleChanges();
  }

  function initializeExtensionSettings(): void {
    void settingsApi
      .loadExtensionSettings()
      .then((loadedSettings) => {
        extensionSettings = loadedSettings;
        applyHintStyleSettings();
      })
      .catch(() => undefined);

    (
      globalThis as typeof globalThis & { browser?: WebExtensionApi }
    ).browser?.storage?.onChanged?.addListener((changes, areaName) => {
      if (
        areaName !== "local" ||
        !(settingsApi.SETTINGS_STORAGE_KEY in changes)
      ) {
        return;
      }

      extensionSettings = settingsApi.normalizeExtensionSettings(
        changes[settingsApi.SETTINGS_STORAGE_KEY]?.newValue,
      );
      applyHintStyleSettings();
      if (
        !settingsApi.isExtensionEnabledForUrl(extensionSettings, location.href)
      ) {
        cancelHintMode();
        closeCommandPalette();
        stopMovement();
      }
    });
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (commandPaletteState) {
      handleCommandPaletteKeyDown(event);
      return;
    }

    if (hintState) {
      handleHintKeyDown(event);
      return;
    }

    if (helpState) {
      handleHelpKeyDown(event);
      return;
    }

    if (menuRevealTimer && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancelPendingMenuReveal();
      return;
    }

    const blurTarget = editableBlurTargetForEvent(event);
    if (blurTarget) {
      event.preventDefault();
      event.stopPropagation();
      blurTarget.blur();
      return;
    }

    if (shouldIgnoreKeyboardCommand(event)) {
      return;
    }

    if (
      !settingsApi.isExtensionEnabledForUrl(extensionSettings, location.href)
    ) {
      return;
    }

    const hintActivationMode = hintActivationModeForEvent(event);

    if (isUrlCopyCancelCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      clearUrlCopySequence();
      return;
    }

    if (isUrlCopyCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      handleUrlCopyCommand(event);
      return;
    }

    clearUrlCopySequence();

    if (
      settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.help) ||
      help.isHelpCommandEvent(event)
    ) {
      event.preventDefault();
      event.stopPropagation();
      showHelpOverlay();
      return;
    }

    const commandPaletteOptions = commandPaletteOptionsForEvent(event);
    if (commandPaletteOptions) {
      event.preventDefault();
      event.stopPropagation();
      openCommandPalette(commandPaletteOptions);
      return;
    }

    if (!event.repeat && hintActivationMode && isSupportedWebPage()) {
      event.preventDefault();
      event.stopPropagation();
      startHintMode(hintActivationMode);
      return;
    }

    const tabSwitchDirection = tabSwitchDirectionForEvent(event);
    if (tabSwitchDirection) {
      event.preventDefault();
      event.stopPropagation();
      switchTab(tabSwitchDirection);
      return;
    }

    if (!isMovementSurface()) {
      return;
    }

    const movement = movementForEvent(event);
    if (movement) {
      event.preventDefault();
      event.stopPropagation();
      startMovement(movement);
      return;
    }

    const halfPageDirection = halfPageDirectionForEvent(event);
    if (halfPageDirection) {
      event.preventDefault();
      event.stopPropagation();
      scrollHalfPage(halfPageDirection);
      return;
    }

    if (isHistoryBackCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      navigateHistory("back");
      return;
    }

    if (isHistoryForwardCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      navigateHistory("forward");
      return;
    }

    if (isReloadCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      reloadPage();
      return;
    }

    const pageSequenceAction = pageSequenceActionForEvent(event);
    if (pageSequenceAction) {
      event.preventDefault();
      event.stopPropagation();
      handlePageSequenceAction(pageSequenceAction);
      return;
    }

    if (isBottomCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      scrollToBottom();
    }
  }

  function handleHelpKeyDown(event: KeyboardEvent): void {
    const shouldClose = help.isHelpCloseCommandEvent(event);
    event.preventDefault();
    event.stopPropagation();

    if (shouldClose) {
      closeHelpOverlay();
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (!movementState || event.key.toLowerCase() !== movementState.key) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (movementState.initialProgress < 1) {
      movementState.keyReleased = true;
      return;
    }

    stopMovement();
  }

  function hintActivationModeForEvent(
    event: KeyboardEvent,
  ): HintActivationMode | null {
    if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.hint)) {
      return "current-tab";
    }

    if (
      settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.newTabHint)
    ) {
      return "new-tab";
    }

    return null;
  }

  function shouldIgnoreKeyboardCommand(event: KeyboardEvent): boolean {
    return (
      event.defaultPrevented ||
      event.isComposing ||
      event.keyCode === 229 ||
      isEditableEventTarget(event)
    );
  }

  function isEditableEventTarget(event: KeyboardEvent): boolean {
    const path =
      typeof event.composedPath === "function"
        ? event.composedPath()
        : [event.target];
    return path.some((target) => {
      if (!(target instanceof Element)) {
        return false;
      }

      if (target instanceof HTMLElement && target.isContentEditable) {
        return true;
      }

      const tagName = target.tagName.toLowerCase();
      return (
        tagName === "input" || tagName === "textarea" || tagName === "select"
      );
    });
  }

  function editableBlurTargetForEvent(
    event: KeyboardEvent,
  ): HTMLElement | null {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.key !== "Escape"
    ) {
      return null;
    }

    if (
      document.activeElement instanceof HTMLElement &&
      isTextEditingElement(document.activeElement)
    ) {
      return document.activeElement;
    }

    const path =
      typeof event.composedPath === "function"
        ? event.composedPath()
        : [event.target];
    for (const target of path) {
      if (target instanceof HTMLElement && isTextEditingElement(target)) {
        return target;
      }
    }

    return null;
  }

  function isTextEditingElement(element: HTMLElement): boolean {
    if (element.isContentEditable || element instanceof HTMLTextAreaElement) {
      return true;
    }

    return (
      element instanceof HTMLInputElement &&
      TEXT_ENTRY_INPUT_TYPES.has(element.type.toLowerCase())
    );
  }

  function isSupportedWebPage(): boolean {
    return isSupportedWebPageCandidate(currentPageSupportCandidate());
  }

  function isMovementSurface(): boolean {
    return isSupportedWebPage() || isSupportedPdf();
  }

  function isSupportedPdf(): boolean {
    return isSupportedPdfCandidate(currentPageSupportCandidate());
  }

  function currentPageSupportCandidate(): PageSupportCandidate {
    return {
      contentType: document.contentType,
      href: location.href,
      protocol: location.protocol,
    };
  }

  function isSupportedWebPageCandidate(
    candidate: PageSupportCandidate,
  ): boolean {
    return (
      isSupportedPageProtocol(candidate.protocol) &&
      !isPdfDocumentCandidate(candidate)
    );
  }

  function isSupportedPdfCandidate(candidate: PageSupportCandidate): boolean {
    return (
      isPdfDocumentCandidate(candidate) &&
      isSupportedPageProtocol(candidate.protocol)
    );
  }

  function isSupportedPageProtocol(protocol: string): boolean {
    return protocol === "http:" || protocol === "https:";
  }

  function isPdfDocumentCandidate(candidate: PageSupportCandidate): boolean {
    return (
      candidate.contentType === "application/pdf" ||
      /\.pdf(?:[?#]|$)/i.test(candidate.href)
    );
  }

  function startHintMode(
    activationMode: HintActivationMode,
    options: { allowMediaControlPreReveal?: boolean } = {},
  ): void {
    cancelPendingMenuReveal();

    if (
      options.allowMediaControlPreReveal !== false &&
      revealMediaControlsBeforeHintCollection(activationMode)
    ) {
      scheduleMenuRevealStep(() => {
        startHintMode(activationMode, { allowMediaControlPreReveal: false });
      }, MEDIA_SURFACE_RESCAN_DELAY_MS);
      return;
    }

    const targets = collectHintTargets(activationMode);
    if (targets.length === 0) {
      clearRevealedMediaControlSurfaces();
      return;
    }

    const hintValues = hints.generateHints(
      targets.length,
      extensionSettings.hintKeys,
    );
    if (hints.hasPrefixCollision(hintValues)) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "skne-hint-overlay";
    applyHintStyleSettings(overlay);

    const entries = targets.map((target, index): HintEntry => {
      const hint = hintValues[index];
      const label = document.createElement("span");
      label.className =
        target.kind === "media-control"
          ? "skne-hint skne-hint-media-control"
          : "skne-hint";
      label.dataset.hint = hint;
      label.style.left = `${Math.round(target.rect.left)}px`;
      label.style.top = `${Math.round(target.rect.top)}px`;
      renderHintLabel(label, hint, "");
      overlay.appendChild(label);

      return {
        target,
        hint,
        label,
      };
    });

    document.documentElement.appendChild(overlay);
    adjustHintLayouts(entries);
    hintState = {
      activationMode,
      entries,
      input: "",
      overlay,
    };

    window.addEventListener("scroll", cancelHintMode, true);
    window.addEventListener("resize", cancelHintMode, true);
  }

  function adjustHintLayouts(entries: HintEntry[]): void {
    if (entries.length === 0) {
      return;
    }

    const rows: HintEntry[][] = [];
    const rowMaxTopDifference = 15;

    const sortedEntries = [...entries].sort((a, b) => {
      if (
        Math.abs(a.target.rect.top - b.target.rect.top) > rowMaxTopDifference
      ) {
        return a.target.rect.top - b.target.rect.top;
      }
      return a.target.rect.left - b.target.rect.left;
    });

    for (const entry of sortedEntries) {
      let placed = false;
      for (const row of rows) {
        const referenceTop = row[0].target.rect.top;
        if (
          Math.abs(entry.target.rect.top - referenceTop) <= rowMaxTopDifference
        ) {
          row.push(entry);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([entry]);
      }
    }

    const viewportWidth = window.innerWidth;
    const verticalGap = 2;
    const horizontalGap = 2;

    for (const row of rows) {
      row.sort((a, b) => a.target.rect.left - b.target.rect.left);

      const lastRightAtLevel: number[] = [];

      for (const entry of row) {
        const label = entry.label;
        const rect = entry.target.rect;
        const width = label.offsetWidth || 16;
        const height = label.offsetHeight || 16;

        let transformX = "-50%";
        let alignLeft = rect.left - width / 2;
        let alignRight = rect.left + width / 2;

        if (alignLeft < 0) {
          transformX = "0%";
          alignLeft = rect.left;
          alignRight = rect.left + width;
        } else if (alignRight > viewportWidth) {
          transformX = "-100%";
          alignLeft = rect.left - width;
          alignRight = rect.left;
        }

        let chosenLevel = 0;
        while (true) {
          const lastRight = lastRightAtLevel[chosenLevel];
          if (
            lastRight === undefined ||
            alignLeft >= lastRight + horizontalGap
          ) {
            break;
          }
          chosenLevel++;
        }

        lastRightAtLevel[chosenLevel] = alignRight;

        let transformY = "-100%";
        let finalTop = rect.top;

        const normalOffset =
          (chosenLevel + 1) * height + chosenLevel * verticalGap;
        if (rect.top - normalOffset < 0) {
          const targetElementRect =
            entry.target.element.getBoundingClientRect();
          finalTop = rect.top + targetElementRect.height;
          const belowOffset = chosenLevel * (height + verticalGap);
          transformY = "0%";
          label.style.top = `${Math.round(finalTop + belowOffset)}px`;
        } else {
          const offsetTop = rect.top - chosenLevel * (height + verticalGap);
          label.style.top = `${Math.round(offsetTop)}px`;
        }

        label.style.setProperty("--skne-tx", transformX);
        label.style.setProperty("--skne-ty", transformY);
      }
    }
  }

  function applyHintStyleSettings(
    root: HTMLElement = document.documentElement,
  ): void {
    if (extensionSettings.theme) {
      root.setAttribute("data-skne-theme", extensionSettings.theme);
    } else {
      root.removeAttribute("data-skne-theme");
    }
    const style = extensionSettings.hintStyle;
    root.style.setProperty("--skne-hint-background", style.backgroundColor);
    root.style.setProperty("--skne-hint-color", style.textColor);
    root.style.setProperty("--skne-hint-font-size", `${style.fontSize}px`);
    root.style.setProperty("--skne-hint-font-weight", String(style.fontWeight));
    root.style.setProperty(
      "--skne-hint-media-font-size",
      `${style.mediaFontSize}px`,
    );
    root.style.setProperty("--skne-hint-opacity", String(style.opacity));
    root.style.setProperty(
      "--skne-hint-border-radius",
      `${style.borderRadius}px`,
    );
    root.style.setProperty(
      "--skne-hint-border-width",
      `${style.borderWidth}px`,
    );
    root.style.setProperty("--skne-hint-border-color", style.borderColor);
    root.style.setProperty(
      "--skne-hint-shadow-opacity",
      String(style.shadowOpacity),
    );
  }

  function handleHintKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!hintState || event.repeat || event.isComposing) {
      return;
    }

    if (event.key === "Escape") {
      cancelHintMode();
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (!extensionSettings.hintKeys.includes(key)) {
      return;
    }

    const nextInput = hintState.input + key;
    const matchingEntries = hintState.entries.filter((entry) =>
      entry.hint.startsWith(nextInput),
    );
    if (matchingEntries.length === 0) {
      cancelHintMode();
      return;
    }

    hintState.input = nextInput;
    for (const entry of hintState.entries) {
      const isMatch = entry.hint.startsWith(nextInput);
      entry.label.dataset.hidden = isMatch ? "false" : "true";
      if (isMatch) {
        renderHintLabel(entry.label, entry.hint, nextInput);
      }
    }

    const exactMatch = matchingEntries.find(
      (entry) => entry.hint === nextInput,
    );
    if (exactMatch) {
      activateHintTarget(exactMatch.target, hintState.activationMode);
    }
  }

  function cancelHintMode(): void {
    if (!hintState) {
      cancelPendingMenuReveal();
      return;
    }

    hintState.overlay.remove();
    hintState = null;
    clearRevealedMediaControlSurfaces();
    cancelPendingMenuReveal();
    window.removeEventListener("scroll", cancelHintMode, true);
    window.removeEventListener("resize", cancelHintMode, true);
  }

  function renderHintLabel(
    label: HTMLSpanElement,
    hint: string,
    input: string,
  ): void {
    label.replaceChildren();
    if (input.length === 0 || !hint.startsWith(input)) {
      label.textContent = hint;
      return;
    }

    const match = document.createElement("span");
    match.className = "skne-hint-match";
    match.textContent = input;
    label.appendChild(match);
    label.append(hint.slice(input.length));
  }

  function showHelpOverlay(): void {
    stopMovement();
    closeHelpOverlay();

    const overlay = document.createElement("div");
    overlay.id = HELP_OVERLAY_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Keyboard shortcuts");

    const panel = document.createElement("div");
    panel.className = "skne-help-panel";

    const header = document.createElement("div");
    header.className = "skne-help-header";

    const title = document.createElement("div");
    title.className = "skne-help-title";
    title.textContent = "Keyboard Shortcuts";
    header.appendChild(title);

    const closeHint = document.createElement("div");
    closeHint.className = "skne-help-close-hint";
    closeHint.textContent = "Esc closes";
    header.appendChild(closeHint);
    panel.appendChild(header);

    const sections = document.createElement("div");
    sections.className = "skne-help-sections";
    for (const section of help.HELP_SECTIONS) {
      sections.appendChild(createHelpSection(section));
    }
    panel.appendChild(sections);

    overlay.appendChild(panel);
    document.documentElement.appendChild(overlay);
    helpState = { overlay };
  }

  function createHelpSection(section: HelpSection): HTMLDivElement {
    const sectionElement = document.createElement("div");
    sectionElement.className = "skne-help-section";

    const title = document.createElement("div");
    title.className = "skne-help-section-title";
    title.textContent = section.title;
    sectionElement.appendChild(title);

    const list = document.createElement("div");
    list.className = "skne-help-shortcut-list";
    for (const shortcut of section.shortcuts) {
      list.appendChild(createHelpShortcut(shortcut));
    }
    sectionElement.appendChild(list);

    return sectionElement;
  }

  function createHelpShortcut(shortcut: HelpShortcut): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "skne-help-shortcut";

    const key = document.createElement("kbd");
    key.className = "skne-help-key";
    key.textContent = shortcut.key;
    row.appendChild(key);

    const description = document.createElement("span");
    description.className = "skne-help-description";
    description.textContent = shortcut.description;
    row.appendChild(description);

    return row;
  }

  function closeHelpOverlay(): void {
    if (!helpState) {
      return;
    }

    helpState.overlay.remove();
    helpState = null;
  }

  function openCommandPalette(options: {
    disposition: PaletteDisposition;
    generatedKinds: PaletteGeneratedKind[];
    hasImeRiskFromOpeningShortcut?: boolean;
    includeCommands: boolean;
    includeGenerated: boolean;
    initialQuery?: string;
    placeholder: string;
    sources: PaletteSource[];
  }): void {
    stopMovement();
    cancelHintMode();
    closeHelpOverlay();
    closeCommandPalette();

    const overlay = document.createElement("div");
    overlay.id = COMMAND_PALETTE_OVERLAY_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Command palette");

    const panel = document.createElement("div");
    panel.className = "skne-command-palette-panel";

    const input = document.createElement("input");
    input.className = "skne-command-palette-input";
    input.type = "search";
    input.autocapitalize = "off";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = options.placeholder;
    input.setAttribute("aria-label", "Search commands and browser items");
    panel.appendChild(input);

    const list = document.createElement("div");
    list.className = "skne-command-palette-list";
    list.setAttribute("role", "listbox");
    panel.appendChild(list);

    panel.appendChild(createCommandPaletteFooter());

    overlay.appendChild(panel);
    document.documentElement.appendChild(overlay);

    commandPaletteState = {
      activeIndex: 0,
      disposition: options.disposition,
      generatedKinds: options.generatedKinds,
      history: [],
      historyCursor: null,
      hasImeRiskFromOpeningShortcut:
        options.hasImeRiskFromOpeningShortcut ?? false,
      includeCommands: options.includeCommands,
      includeGenerated: options.includeGenerated,
      input,
      inputBeforeHistory: "",
      isComposingQuery: false,
      hasPendingImeConfirmation: false,
      ignoreNextEnterAfterComposition: false,
      list,
      overlay,
      results: [],
      searchId: 0,
      sawEnterDuringComposition: false,
      sources: options.sources,
    };
    input.value = options.initialQuery ?? "";

    input.addEventListener("compositionstart", () => {
      if (!commandPaletteState) {
        return;
      }

      commandPaletteState.isComposingQuery = true;
      commandPaletteState.hasPendingImeConfirmation = true;
      commandPaletteState.ignoreNextEnterAfterComposition = false;
      commandPaletteState.sawEnterDuringComposition = false;
    });
    input.addEventListener("compositionend", () => {
      if (!commandPaletteState) {
        return;
      }

      commandPaletteState.isComposingQuery = false;
      commandPaletteState.hasPendingImeConfirmation =
        !commandPaletteState.sawEnterDuringComposition;
      commandPaletteState.ignoreNextEnterAfterComposition =
        !commandPaletteState.sawEnterDuringComposition;
      commandPaletteState.sawEnterDuringComposition = false;
    });
    input.addEventListener("beforeinput", (event) => {
      if (commandPaletteState && commandPaletteInputEventIsComposing(event)) {
        commandPaletteState.hasPendingImeConfirmation = true;
      }
    });
    input.addEventListener("input", (event) => {
      if (commandPaletteState) {
        if (commandPaletteInputEventIsComposing(event)) {
          commandPaletteState.hasPendingImeConfirmation = true;
        }
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
      }
      void refreshCommandPaletteResults();
    });
    input.focus();
    void loadCommandPaletteQueryHistory().then((history) => {
      if (commandPaletteState?.input === input) {
        commandPaletteState.history = history;
        void refreshCommandPaletteResults();
      }
    });
    void refreshCommandPaletteResults();
  }

  function closeCommandPalette(): void {
    if (!commandPaletteState) {
      return;
    }

    commandPaletteState.overlay.remove();
    commandPaletteState = null;
  }

  function createCommandPaletteFooter(): HTMLDivElement {
    const footer = document.createElement("div");
    footer.className = "skne-command-palette-footer";

    for (const hint of COMMAND_PALETTE_FOOTER_HINTS) {
      const item = document.createElement("span");
      item.className = "skne-command-palette-footer-item";
      item.textContent = hint;
      footer.appendChild(item);
    }

    return footer;
  }

  function handleCommandPaletteKeyDown(event: KeyboardEvent): void {
    const state = commandPaletteState;
    if (!state) {
      return;
    }

    const candidate: CommandPaletteKeyCandidate = {
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      hasPendingImeConfirmation: state.hasPendingImeConfirmation,
      hasImeRiskFromOpeningShortcut: state.hasImeRiskFromOpeningShortcut,
      ignoreNextEnterAfterComposition: state.ignoreNextEnterAfterComposition,
      isComposing: event.isComposing,
      isComposingQuery: state.isComposingQuery,
      key: event.key,
      keyCode: event.keyCode,
      metaKey: event.metaKey,
      query: state.input.value,
      shiftKey: event.shiftKey,
    };

    if (commandPaletteIsImeConfirmEnter(candidate)) {
      if (
        event.key === "Enter" &&
        (state.isComposingQuery ||
          state.hasPendingImeConfirmation ||
          event.isComposing ||
          event.keyCode === 229)
      ) {
        state.sawEnterDuringComposition = true;
      }
      state.hasPendingImeConfirmation = false;
      state.hasImeRiskFromOpeningShortcut = false;
      state.ignoreNextEnterAfterComposition = false;
      return;
    }

    if (event.key === "Enter") {
      state.hasImeRiskFromOpeningShortcut = false;
    }

    const action = commandPaletteKeyAction(candidate);
    if (!action) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    handleCommandPaletteKeyAction(action);
  }

  function commandPaletteKeyAction(
    candidate: CommandPaletteKeyCandidate,
  ): CommandPaletteKeyAction | null {
    if (candidate.isComposing || candidate.keyCode === 229) {
      return null;
    }

    if (commandPaletteIsImeConfirmEnter(candidate)) {
      return null;
    }

    if (
      candidate.key === "Escape" ||
      (candidate.ctrlKey && !candidate.altKey && candidate.key === "[") ||
      (candidate.ctrlKey &&
        !candidate.altKey &&
        candidate.key.toLowerCase() === "g")
    ) {
      return "close";
    }

    if (candidate.altKey && candidate.key === "ArrowUp") {
      return "history-previous";
    }

    if (candidate.altKey && candidate.key === "ArrowDown") {
      return "history-next";
    }

    if (
      candidate.key === "ArrowDown" ||
      (candidate.ctrlKey && candidate.key.toLowerCase() === "n") ||
      (candidate.ctrlKey && candidate.key.toLowerCase() === "i") ||
      (candidate.ctrlKey && candidate.key.toLowerCase() === "j") ||
      (candidate.key === "Tab" && !candidate.shiftKey)
    ) {
      return "next";
    }

    if (
      candidate.key === "ArrowUp" ||
      (candidate.ctrlKey && candidate.key.toLowerCase() === "p") ||
      (candidate.ctrlKey && candidate.key.toLowerCase() === "k") ||
      (candidate.key === "Tab" && candidate.shiftKey)
    ) {
      return "previous";
    }

    if (
      candidate.key === "PageDown" ||
      (candidate.ctrlKey &&
        !candidate.altKey &&
        (candidate.key.toLowerCase() === "f" ||
          candidate.key.toLowerCase() === "v"))
    ) {
      return "page-next";
    }

    if (
      candidate.key === "PageUp" ||
      (candidate.ctrlKey &&
        !candidate.altKey &&
        candidate.key.toLowerCase() === "b")
    ) {
      return "page-previous";
    }

    if (candidate.key === "Home") {
      return "first";
    }

    if (candidate.key === "End") {
      return "last";
    }

    if (candidate.ctrlKey && candidate.key.toLowerCase() === "u") {
      return "clear-query";
    }

    if (
      candidate.ctrlKey &&
      !candidate.altKey &&
      candidate.key.toLowerCase() === "a"
    ) {
      return "move-query-start";
    }

    if (
      candidate.ctrlKey &&
      !candidate.altKey &&
      candidate.key.toLowerCase() === "e"
    ) {
      return "move-query-end";
    }

    if (
      candidate.ctrlKey &&
      !candidate.altKey &&
      candidate.key.toLowerCase() === "l"
    ) {
      return "select-query";
    }

    if (
      candidate.ctrlKey &&
      !candidate.altKey &&
      candidate.key.toLowerCase() === "d"
    ) {
      return "delete-next-character";
    }

    if (
      candidate.ctrlKey &&
      !candidate.altKey &&
      candidate.key.toLowerCase() === "h"
    ) {
      return "delete-previous-character";
    }

    if (
      candidate.ctrlKey &&
      !candidate.altKey &&
      candidate.key.toLowerCase() === "w"
    ) {
      return "delete-previous-word";
    }

    if (
      candidate.ctrlKey &&
      !candidate.altKey &&
      candidate.key.toLowerCase() === "m"
    ) {
      return "activate-current-tab";
    }

    if (candidate.key === "Enter") {
      if (candidate.altKey) {
        return "activate-background-tab";
      }

      return candidate.shiftKey || candidate.metaKey || candidate.ctrlKey
        ? "activate-new-tab"
        : "activate-current-tab";
    }

    if (candidate.altKey && candidate.key.toLowerCase() === "c") {
      return "copy-result-url";
    }

    if (candidate.altKey && candidate.key.toLowerCase() === "y") {
      return "copy-result-markdown";
    }

    if (candidate.altKey && candidate.key.toLowerCase() === "e") {
      return "edit-result-url";
    }

    if (candidate.altKey && candidate.key.toLowerCase() === "d") {
      return "narrow-to-domain";
    }

    if (candidate.altKey && candidate.key.toLowerCase() === "f") {
      return "narrow-to-title";
    }

    if (
      candidate.altKey &&
      candidate.shiftKey &&
      candidate.key.toLowerCase() === "u"
    ) {
      return { kind: "apply-prefix", prefix: "url" };
    }

    if (candidate.altKey && candidate.key.toLowerCase() === "u") {
      return "narrow-to-url";
    }

    if (
      (candidate.altKey || (candidate.ctrlKey && !candidate.altKey)) &&
      candidate.key.toLowerCase() === "r"
    ) {
      return "refresh-results";
    }

    if (candidate.altKey && candidate.key.toLowerCase() === "w") {
      return "close-tab";
    }

    const resultIndex = commandPaletteResultIndexForKey(candidate);
    if (resultIndex) {
      return resultIndex;
    }

    const prefix = commandPaletteSourcePrefixForKey(candidate);
    if (prefix) {
      return { kind: "apply-prefix", prefix };
    }

    if (
      candidate.altKey &&
      (candidate.key === "Backspace" || candidate.key === "Delete")
    ) {
      return "forget-palette-entry";
    }

    return null;
  }

  function commandPaletteIsImeConfirmEnter(
    candidate: CommandPaletteKeyCandidate,
  ): boolean {
    return (
      candidate.key === "Enter" &&
      (candidate.isComposing === true ||
        candidate.keyCode === 229 ||
        candidate.hasPendingImeConfirmation === true ||
        candidate.isComposingQuery === true ||
        candidate.ignoreNextEnterAfterComposition === true ||
        (candidate.hasImeRiskFromOpeningShortcut === true &&
          commandPaletteQueryLooksImeGenerated(candidate.query ?? "")))
    );
  }

  function commandPaletteQueryLooksImeGenerated(query: string): boolean {
    return [...query].some((character) => character.charCodeAt(0) > 0x7f);
  }

  function commandPaletteInputEventIsComposing(event: Event): boolean {
    const inputEvent = event as InputEvent;
    const inputType = inputEvent.inputType?.toLowerCase() ?? "";
    return inputEvent.isComposing === true || inputType.includes("composition");
  }

  function handleCommandPaletteKeyAction(
    action: CommandPaletteKeyAction,
  ): void {
    if (typeof action === "object") {
      switch (action.kind) {
        case "activate-index":
          activateCommandPaletteIndex(action.index, action.disposition);
          return;
        case "apply-prefix":
          applyCommandPaletteSourcePrefix(action.prefix);
          return;
      }
      return;
    }

    switch (action) {
      case "close":
        closeCommandPalette();
        return;
      case "next":
        moveCommandPaletteSelection(1);
        return;
      case "previous":
        moveCommandPaletteSelection(-1);
        return;
      case "page-next":
        moveCommandPaletteSelection(COMMAND_PALETTE_PAGE_STEP);
        return;
      case "page-previous":
        moveCommandPaletteSelection(-COMMAND_PALETTE_PAGE_STEP);
        return;
      case "first":
        setCommandPaletteSelection(0);
        return;
      case "last":
        setCommandPaletteSelectionToLast();
        return;
      case "clear-query":
        clearCommandPaletteQuery();
        return;
      case "delete-next-character":
        deleteCommandPaletteNextCharacter();
        return;
      case "delete-previous-character":
        deleteCommandPalettePreviousCharacter();
        return;
      case "delete-previous-word":
        deleteCommandPalettePreviousWord();
        return;
      case "move-query-start":
        moveCommandPaletteInputCaret(0);
        return;
      case "move-query-end":
        moveCommandPaletteInputCaretToEnd();
        return;
      case "select-query":
        selectCommandPaletteQuery();
        return;
      case "refresh-results":
        refreshCommandPaletteLiveQuery();
        return;
      case "activate-current-tab":
        activateCommandPaletteSelection();
        return;
      case "activate-new-tab":
        activateCommandPaletteSelection("new-tab");
        return;
      case "activate-background-tab":
        activateCommandPaletteSelection("background-tab");
        return;
      case "copy-result-markdown":
        void copyCommandPaletteSelectionMarkdown();
        return;
      case "copy-result-url":
        void copyCommandPaletteSelectionUrl();
        return;
      case "edit-result-url":
        editCommandPaletteSelectionUrl();
        return;
      case "narrow-to-domain":
        narrowCommandPaletteSelectionToDomain();
        return;
      case "narrow-to-title":
        narrowCommandPaletteSelectionToTitle();
        return;
      case "narrow-to-url":
        narrowCommandPaletteSelectionToUrl();
        return;
      case "forget-palette-entry":
        void forgetCommandPaletteEntry();
        return;
      case "close-tab":
        void closeCommandPaletteTab();
        return;
      case "history-previous":
        navigateCommandPaletteQueryHistory("previous");
        return;
      case "history-next":
        navigateCommandPaletteQueryHistory("next");
        return;
    }
  }

  function commandPaletteResultIndexForKey(
    candidate: CommandPaletteKeyCandidate,
  ): CommandPaletteResultIndexAction | null {
    if (
      !candidate.altKey ||
      candidate.metaKey ||
      (candidate.ctrlKey && candidate.shiftKey)
    ) {
      return null;
    }

    const digit = candidate.code?.match(/^Digit([1-9])$/)?.[1] ?? "";
    const key = digit || (/^[1-9]$/.test(candidate.key) ? candidate.key : "");
    if (!key) {
      return null;
    }

    const action: CommandPaletteResultIndexAction = {
      index: Number(key) - 1,
      kind: "activate-index",
    };
    if (candidate.ctrlKey) {
      action.disposition = "background-tab";
    } else if (candidate.shiftKey) {
      action.disposition = "new-tab";
    }

    return action;
  }

  function commandPaletteSourcePrefixForKey(
    candidate: CommandPaletteKeyCandidate,
  ): CommandPaletteSourcePrefix | null {
    if (
      !candidate.altKey ||
      candidate.ctrlKey ||
      candidate.metaKey ||
      candidate.shiftKey
    ) {
      return null;
    }

    const key =
      candidate.code?.match(/^Key([A-Z])$/)?.[1]?.toLowerCase() ??
      candidate.key.toLowerCase();

    switch (key) {
      case "t":
        return "tab";
      case "b":
        return "book";
      case "h":
        return "history";
      case "v":
        return "visit";
      case "s":
        return "search";
      case "u":
        return "url";
      case "m":
        return "cmd";
      case "a":
        return "all";
      default:
        return null;
    }
  }

  function navigateCommandPaletteQueryHistory(
    direction: "previous" | "next",
  ): void {
    if (!commandPaletteState) {
      return;
    }

    const next = commandPaletteHistoryNavigation({
      cursor: commandPaletteState.historyCursor,
      direction,
      history: commandPaletteState.history,
      inputBeforeHistory: commandPaletteState.inputBeforeHistory,
      query: commandPaletteState.input.value,
    });
    commandPaletteState.historyCursor = next.cursor;
    commandPaletteState.inputBeforeHistory = next.inputBeforeHistory;
    commandPaletteState.input.value = next.query;
    void refreshCommandPaletteResults();
  }

  function commandPaletteHistoryNavigation(
    candidate: CommandPaletteHistoryNavigationCandidate,
  ): CommandPaletteHistoryNavigationResult {
    if (candidate.history.length === 0) {
      return {
        cursor: candidate.cursor,
        inputBeforeHistory: candidate.inputBeforeHistory,
        query: candidate.query,
      };
    }

    if (candidate.direction === "previous") {
      const cursor =
        candidate.cursor === null
          ? 0
          : Math.min(candidate.cursor + 1, candidate.history.length - 1);
      return {
        cursor,
        inputBeforeHistory:
          candidate.cursor === null
            ? candidate.query
            : candidate.inputBeforeHistory,
        query: candidate.history[cursor],
      };
    }

    if (candidate.cursor === null) {
      return {
        cursor: null,
        inputBeforeHistory: candidate.inputBeforeHistory,
        query: candidate.query,
      };
    }

    const cursor = candidate.cursor - 1;
    if (cursor < 0) {
      return {
        cursor: null,
        inputBeforeHistory: "",
        query: candidate.inputBeforeHistory,
      };
    }

    return {
      cursor,
      inputBeforeHistory: candidate.inputBeforeHistory,
      query: candidate.history[cursor],
    };
  }

  async function refreshCommandPaletteResults(): Promise<void> {
    const state = commandPaletteState;
    if (!state) {
      return;
    }

    const scope = commandPaletteQueryScope(state.input.value, state);
    const searchId = state.searchId + 1;
    state.searchId = searchId;

    const [localResults, browserResults] = await Promise.all([
      Promise.resolve(searchLocalPaletteResults(scope, state.history)),
      searchBrowserPaletteResults(scope),
    ]);

    if (!commandPaletteState || commandPaletteState.searchId !== searchId) {
      return;
    }

    commandPaletteState.results = [...localResults, ...browserResults]
      .sort(compareCommandPaletteResults)
      .slice(0, 24);
    commandPaletteState.activeIndex = 0;
    renderCommandPaletteResults();
  }

  async function searchBrowserPaletteResults(
    scope: CommandPaletteQueryScope,
  ): Promise<BrowserPaletteResult[]> {
    if (typeof browser === "undefined" || !browser.runtime) {
      return [];
    }

    try {
      const response = (await browser.runtime.sendMessage({
        type: "palette-search",
        generatedKinds: scope.generatedKinds,
        includeGenerated: scope.includeGenerated,
        query: scope.query,
        searchEngine: scope.searchEngine,
        sources: scope.sources,
      })) as Partial<PaletteSearchResponse> | undefined;
      return Array.isArray(response?.results) ? response.results : [];
    } catch {
      return [];
    }
  }

  function searchLocalPaletteResults(
    scope: CommandPaletteQueryScope,
    queryHistory: string[],
  ): LocalPaletteResult[] {
    return [
      ...(scope.includeCommands ? searchLocalPaletteCommands(scope.query) : []),
      ...recentPaletteQueryResults(scope, queryHistory),
    ];
  }

  function recentPaletteQueryResults(
    scope: CommandPaletteQueryScope,
    queryHistory: string[],
  ): LocalPaletteQueryResult[] {
    if (!shouldShowRecentPaletteQueryResults(scope)) {
      return [];
    }

    return queryHistory.slice(0, 6).map((query, index) => ({
      id: `query:${encodeURIComponent(query)}`,
      kind: "query",
      query,
      score: 20 - index,
      subtitle: "Recent palette query",
      title: query,
    }));
  }

  function shouldShowRecentPaletteQueryResults(
    scope: CommandPaletteQueryScope,
  ): boolean {
    return (
      scope.query.trim() === "" &&
      scope.includeCommands &&
      scope.includeGenerated &&
      scope.sources.includes("tabs") &&
      scope.sources.includes("bookmarks") &&
      scope.sources.includes("history") &&
      scope.sources.includes("visits")
    );
  }

  function searchLocalPaletteCommands(
    query: string,
  ): LocalPaletteCommandResult[] {
    const normalizedQuery = query.trim().toLowerCase();
    return getLocalPaletteCommands()
      .flatMap((command) => {
        const score = localPaletteCommandScore(command, normalizedQuery);
        if (score === null) {
          return [];
        }

        return [
          {
            command: command.id,
            id: `command:${command.id}`,
            kind: "command" as const,
            score: score + 30,
            subtitle: command.subtitle,
            title: command.title,
          },
        ];
      })
      .sort((a, b) => b.score - a.score);
  }

  function commandPaletteCommandIds(): string[] {
    return getLocalPaletteCommands().map((command) => command.id);
  }

  function commandPaletteCommandSearchIds(query: string): string[] {
    return searchLocalPaletteCommands(query).flatMap((result) =>
      result.command ? [result.command] : [],
    );
  }

  function recentPaletteQueryResultTitles(
    scope: CommandPaletteQueryScope,
    queryHistory: string[],
  ): string[] {
    return recentPaletteQueryResults(scope, queryHistory).map(
      (result) => result.title,
    );
  }

  function localPaletteCommandScore(
    command: LocalPaletteCommand,
    query: string,
  ): number | null {
    if (!query) {
      return 1;
    }

    const aliases = command.searchAliases;
    const haystack = command.searchHaystack;
    const haystackTokens = haystack.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const terms = query.split(/\s+/).filter(Boolean);
    if (
      !terms.every(
        (term) =>
          commandTextMatchesTerm(haystack, haystackTokens, term) ||
          aliases.some((alias) => commandAliasMatchesTerm(alias, term)),
      )
    ) {
      return null;
    }

    const title = command.title.toLowerCase();
    const aliasScore = Math.max(
      0,
      ...aliases.map((alias) => commandAliasScore(alias, terms)),
    );
    return terms.reduce((score, term) => {
      if (title.startsWith(term)) {
        return score + 60;
      }
      if (title.includes(term)) {
        return score + 40;
      }
      return score + 20;
    }, aliasScore);
  }

  function commandAliasScore(alias: string, terms: string[]): number {
    const normalizedAlias = alias.toLowerCase();
    if (terms.join(" ") === normalizedAlias) {
      return 90;
    }

    return terms.every((term) => commandAliasMatchesTerm(alias, term)) ? 50 : 0;
  }

  function commandTextMatchesTerm(
    haystack: string,
    haystackTokens: string[],
    term: string,
  ): boolean {
    const isJapaneseQuery = /[^\u0020-\u007E]/.test(term);
    if (!isJapaneseQuery && term.length <= 2) {
      return haystackTokens.some(
        (token) => token === term || token.startsWith(term),
      );
    }

    return haystack.includes(term);
  }

  function commandAliasMatchesTerm(alias: string, term: string): boolean {
    const normalizedAlias = alias.toLowerCase();
    if (normalizedAlias === term) {
      return true;
    }

    const isJapaneseQuery = /[^\u0020-\u007E]/.test(term);
    if (isJapaneseQuery) {
      return normalizedAlias.includes(term);
    }

    return normalizedAlias
      .split(/\s+/)
      .some((token) => token === term || token.startsWith(term));
  }

  function renderCommandPaletteResults(): void {
    if (!commandPaletteState) {
      return;
    }

    const state = commandPaletteState;
    const query = commandPaletteQueryScope(state.input.value, state).query;
    state.list.replaceChildren();

    if (state.results.length === 0) {
      const empty = document.createElement("div");
      empty.className = "skne-command-palette-empty";
      empty.textContent = "No results";
      state.list.appendChild(empty);
      return;
    }

    state.results.forEach((result, index) => {
      const row = document.createElement("button");
      row.className = "skne-command-palette-result";
      row.type = "button";
      row.dataset.kind = result.kind;
      row.dataset.active = index === state.activeIndex ? "true" : "false";
      row.setAttribute("role", "option");
      row.setAttribute(
        "aria-selected",
        index === state.activeIndex ? "true" : "false",
      );
      row.addEventListener("click", () => {
        if (!commandPaletteState) {
          return;
        }

        commandPaletteState.activeIndex = index;
        activateCommandPaletteSelection();
      });

      const shortcut = document.createElement("span");
      shortcut.className = "skne-command-palette-index";
      shortcut.textContent = index < 9 ? String(index + 1) : "";
      shortcut.setAttribute("aria-hidden", "true");
      row.appendChild(shortcut);

      const kind = document.createElement("span");
      kind.className = "skne-command-palette-kind";
      kind.textContent = result.kind;
      row.appendChild(kind);

      const text = document.createElement("span");
      text.className = "skne-command-palette-text";

      const title = document.createElement("span");
      title.className = "skne-command-palette-title";
      appendCommandPaletteHighlightedText(title, result.title, query);
      text.appendChild(title);

      const subtitle = document.createElement("span");
      subtitle.className = "skne-command-palette-subtitle";
      appendCommandPaletteHighlightedText(subtitle, result.subtitle, query);
      text.appendChild(subtitle);

      row.appendChild(text);
      state.list.appendChild(row);
    });

    revealCommandPaletteSelection();
  }

  function revealCommandPaletteSelection(): void {
    if (!commandPaletteState) {
      return;
    }

    const activeRow = commandPaletteState.list.querySelector(
      '.skne-command-palette-result[data-active="true"]',
    );
    activeRow?.scrollIntoView({ block: "nearest" });
  }

  function moveCommandPaletteSelection(delta: number): void {
    if (!commandPaletteState || commandPaletteState.results.length === 0) {
      return;
    }

    const length = commandPaletteState.results.length;
    commandPaletteState.activeIndex =
      (commandPaletteState.activeIndex + delta + length) % length;
    renderCommandPaletteResults();
  }

  function setCommandPaletteSelection(index: number): void {
    if (!commandPaletteState || commandPaletteState.results.length === 0) {
      return;
    }

    commandPaletteState.activeIndex = clamp(
      index,
      0,
      commandPaletteState.results.length - 1,
    );
    renderCommandPaletteResults();
  }

  function setCommandPaletteSelectionToLast(): void {
    if (!commandPaletteState) {
      return;
    }

    setCommandPaletteSelection(commandPaletteState.results.length - 1);
  }

  function clearCommandPaletteQuery(): void {
    if (!commandPaletteState) {
      return;
    }

    commandPaletteState.input.value = "";
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function deleteCommandPalettePreviousWord(): void {
    if (!commandPaletteState) {
      return;
    }

    const input = commandPaletteState.input;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const next = commandPaletteDeletePreviousWordValue({
      selectionEnd,
      selectionStart,
      value: input.value,
    });
    input.value = next.value;
    input.setSelectionRange(next.selectionStart, next.selectionEnd);
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function deleteCommandPalettePreviousCharacter(): void {
    if (!commandPaletteState) {
      return;
    }

    const input = commandPaletteState.input;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const next = commandPaletteDeletePreviousCharacterValue({
      selectionEnd,
      selectionStart,
      value: input.value,
    });
    input.value = next.value;
    input.setSelectionRange(next.selectionStart, next.selectionEnd);
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function deleteCommandPaletteNextCharacter(): void {
    if (!commandPaletteState) {
      return;
    }

    const input = commandPaletteState.input;
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const next = commandPaletteDeleteNextCharacterValue({
      selectionEnd,
      selectionStart,
      value: input.value,
    });
    input.value = next.value;
    input.setSelectionRange(next.selectionStart, next.selectionEnd);
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function moveCommandPaletteInputCaret(index: number): void {
    if (!commandPaletteState) {
      return;
    }

    const input = commandPaletteState.input;
    const range = commandPaletteMoveCaretRange(input.value, index);
    input.setSelectionRange(range.start, range.end);
  }

  function moveCommandPaletteInputCaretToEnd(): void {
    if (!commandPaletteState) {
      return;
    }

    moveCommandPaletteInputCaret(commandPaletteState.input.value.length);
  }

  function selectCommandPaletteQuery(): void {
    if (!commandPaletteState) {
      return;
    }

    const input = commandPaletteState.input;
    const range = commandPaletteSelectAllRange(input.value);
    input.setSelectionRange(range.start, range.end);
  }

  function commandPaletteMoveCaretRange(
    value: string,
    index: number,
  ): TextRange {
    const nextIndex = clamp(index, 0, value.length);
    return { start: nextIndex, end: nextIndex };
  }

  function commandPaletteSelectAllRange(value: string): TextRange {
    return { start: 0, end: value.length };
  }

  function refreshCommandPaletteLiveQuery(): void {
    if (!commandPaletteState) {
      return;
    }

    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function appendCommandPaletteHighlightedText(
    element: HTMLElement,
    value: string,
    query: string,
  ): void {
    const ranges = commandPaletteHighlightRanges(value, query);
    if (ranges.length === 0) {
      element.textContent = value;
      return;
    }

    let cursor = 0;
    for (const range of ranges) {
      if (range.start > cursor) {
        element.appendChild(
          document.createTextNode(value.slice(cursor, range.start)),
        );
      }

      const match = document.createElement("mark");
      match.className = "skne-command-palette-match";
      match.textContent = value.slice(range.start, range.end);
      element.appendChild(match);
      cursor = range.end;
    }

    if (cursor < value.length) {
      element.appendChild(document.createTextNode(value.slice(cursor)));
    }
  }

  function commandPaletteHighlightRanges(
    value: string,
    query: string,
  ): TextRange[] {
    const normalizedValue = value.toLowerCase();
    const ranges = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((term) => {
        const substringIndex = normalizedValue.indexOf(term);
        if (substringIndex >= 0) {
          return [{ start: substringIndex, end: substringIndex + term.length }];
        }

        return fuzzyHighlightRanges(term, normalizedValue);
      });

    return mergeTextRanges(ranges);
  }

  function commandPaletteQueryScope(
    query: string,
    options: CommandPaletteQueryOptions,
  ): CommandPaletteQueryScope {
    const match = query.trimStart().match(/^([a-z]+):\s*(.*)$/i);
    if (!match) {
      return { ...options, query };
    }

    const sources = paletteSourcesForPrefix(match[1].toLowerCase());
    if (!sources) {
      return { ...options, query };
    }

    const scope: CommandPaletteQueryScope = {
      generatedKinds: sources.generatedKinds,
      includeCommands: sources.includeCommands,
      includeGenerated: sources.generatedKinds.length > 0,
      query: match[2],
      sources: sources.sources,
    };
    if (sources.searchEngine) {
      scope.searchEngine = sources.searchEngine;
    }

    return scope;
  }

  function commandPaletteApplyPrefixValue(
    value: string,
    prefix: CommandPaletteSourcePrefix,
  ): string {
    const query = commandPaletteUnprefixedQuery(value);
    if (prefix === "all") {
      return query;
    }

    return `${prefix}: ${query}`;
  }

  function commandPaletteUnprefixedQuery(value: string): string {
    const match = value.trimStart().match(/^([a-z]+):\s*(.*)$/i);
    if (!match || !paletteSourcesForPrefix(match[1].toLowerCase())) {
      return value;
    }

    return match[2];
  }

  function commandPaletteEditableResultValue(
    result: CommandPaletteEditableResultCandidate,
  ): string | null {
    return result.kind !== "command" && result.url
      ? `url: ${result.url}`
      : null;
  }

  function commandPaletteDomainFilterValue(
    value: string,
    result: CommandPaletteDomainFilterCandidate,
  ): string | null {
    const hostname = commandPaletteResultHostname(result);
    if (!hostname) {
      return null;
    }

    const prefix = commandPaletteSourcePrefixForValue(value);
    const nextQuery = `domain:${hostname}`;
    return prefix ? `${prefix}: ${nextQuery}` : nextQuery;
  }

  function commandPaletteTitleFilterValue(
    value: string,
    result: CommandPaletteTitleFilterCandidate,
  ): string | null {
    if (result.kind === "command") {
      return null;
    }

    const title = commandPaletteFilterPhraseValue(result.title);
    if (!title) {
      return null;
    }

    const prefix = commandPaletteSourcePrefixForValue(value);
    const nextQuery = `title:"${title}"`;
    return prefix ? `${prefix}: ${nextQuery}` : nextQuery;
  }

  function commandPaletteUrlFilterValue(
    value: string,
    result: CommandPaletteUrlFilterCandidate,
  ): string | null {
    if (result.kind === "command") {
      return null;
    }

    const url = result.url?.trim();
    if (!url) {
      return null;
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return null;
      }
    } catch {
      return null;
    }

    const prefix = commandPaletteSourcePrefixForValue(value);
    const nextQuery = `url:${url}`;
    return prefix ? `${prefix}: ${nextQuery}` : nextQuery;
  }

  function commandPaletteDeletePreviousWordValue(
    candidate: CommandPaletteDeletePreviousWordCandidate,
  ): CommandPaletteDeletePreviousWordResult {
    const selectionStart = clamp(
      Math.min(candidate.selectionStart, candidate.selectionEnd),
      0,
      candidate.value.length,
    );
    const selectionEnd = clamp(
      Math.max(candidate.selectionStart, candidate.selectionEnd),
      0,
      candidate.value.length,
    );

    if (selectionStart !== selectionEnd) {
      return {
        selectionEnd: selectionStart,
        selectionStart,
        value:
          candidate.value.slice(0, selectionStart) +
          candidate.value.slice(selectionEnd),
      };
    }

    let deleteStart = selectionStart;
    while (
      deleteStart > 0 &&
      /\s/.test(candidate.value.charAt(deleteStart - 1))
    ) {
      deleteStart -= 1;
    }

    while (
      deleteStart > 0 &&
      !/\s/.test(candidate.value.charAt(deleteStart - 1))
    ) {
      deleteStart -= 1;
    }

    return {
      selectionEnd: deleteStart,
      selectionStart: deleteStart,
      value:
        candidate.value.slice(0, deleteStart) +
        candidate.value.slice(selectionEnd),
    };
  }

  function commandPaletteDeletePreviousCharacterValue(
    candidate: CommandPaletteDeletePreviousCharacterCandidate,
  ): CommandPaletteDeletePreviousCharacterResult {
    const selectionStart = clamp(
      Math.min(candidate.selectionStart, candidate.selectionEnd),
      0,
      candidate.value.length,
    );
    const selectionEnd = clamp(
      Math.max(candidate.selectionStart, candidate.selectionEnd),
      0,
      candidate.value.length,
    );

    if (selectionStart !== selectionEnd) {
      return {
        selectionEnd: selectionStart,
        selectionStart,
        value:
          candidate.value.slice(0, selectionStart) +
          candidate.value.slice(selectionEnd),
      };
    }

    if (selectionStart === 0) {
      return { selectionEnd: 0, selectionStart: 0, value: candidate.value };
    }

    const deleteStart = selectionStart - 1;
    return {
      selectionEnd: deleteStart,
      selectionStart: deleteStart,
      value:
        candidate.value.slice(0, deleteStart) +
        candidate.value.slice(selectionEnd),
    };
  }

  function commandPaletteDeleteNextCharacterValue(
    candidate: CommandPaletteDeleteNextCharacterCandidate,
  ): CommandPaletteDeleteNextCharacterResult {
    const selectionStart = clamp(
      Math.min(candidate.selectionStart, candidate.selectionEnd),
      0,
      candidate.value.length,
    );
    const selectionEnd = clamp(
      Math.max(candidate.selectionStart, candidate.selectionEnd),
      0,
      candidate.value.length,
    );

    if (selectionStart !== selectionEnd) {
      return {
        selectionEnd: selectionStart,
        selectionStart,
        value:
          candidate.value.slice(0, selectionStart) +
          candidate.value.slice(selectionEnd),
      };
    }

    if (selectionStart >= candidate.value.length) {
      return {
        selectionEnd: selectionStart,
        selectionStart,
        value: candidate.value,
      };
    }

    return {
      selectionEnd: selectionStart,
      selectionStart,
      value:
        candidate.value.slice(0, selectionStart) +
        candidate.value.slice(selectionStart + 1),
    };
  }

  function commandPaletteCurrentUrlEditValue(href: string): string | null {
    try {
      const url = new URL(href.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
      }

      return `url: ${url.toString()}`;
    } catch {
      return null;
    }
  }

  function commandPaletteFilterPhraseValue(value: string | undefined): string {
    return (value ?? "").replace(/"/g, " ").replace(/\s+/g, " ").trim();
  }

  function commandPaletteResultHostname(
    result: CommandPaletteDomainFilterCandidate,
  ): string | null {
    const url = result.url?.trim();
    if (!url) {
      return null;
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return null;
      }

      return parsedUrl.hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  function commandPaletteSourcePrefixForValue(value: string): string | null {
    const match = value.trimStart().match(/^([a-z]+):\s*(.*)$/i);
    if (!match) {
      return null;
    }

    const sources = paletteSourcesForPrefix(match[1].toLowerCase());
    return sources && sources.sources.length > 0
      ? match[1].toLowerCase()
      : null;
  }

  function paletteSourcesForPrefix(
    prefix: string,
  ): Pick<
    CommandPaletteQueryScope,
    "generatedKinds" | "includeCommands" | "searchEngine" | "sources"
  > | null {
    switch (prefix) {
      case "t":
      case "tab":
      case "tabs":
        return {
          generatedKinds: [],
          includeCommands: false,
          sources: ["tabs"],
        };
      case "b":
      case "book":
      case "bookmark":
      case "bookmarks":
        return {
          generatedKinds: [],
          includeCommands: false,
          sources: ["bookmarks"],
        };
      case "hist":
      case "history":
      case "h":
        return {
          generatedKinds: [],
          includeCommands: false,
          sources: ["history"],
        };
      case "visit":
      case "visits":
      case "v":
        return {
          generatedKinds: [],
          includeCommands: false,
          sources: ["visits"],
        };
      case "url":
      case "open":
      case "u":
        return {
          generatedKinds: ["url"],
          includeCommands: false,
          sources: [],
        };
      case "s":
      case "search":
        return {
          generatedKinds: ["search"],
          includeCommands: false,
          sources: [],
        };
      case "g":
      case "google":
        return {
          generatedKinds: ["search"],
          includeCommands: false,
          searchEngine: "google",
          sources: [],
        };
      case "ddg":
      case "duckduckgo":
        return {
          generatedKinds: ["search"],
          includeCommands: false,
          searchEngine: "duckduckgo",
          sources: [],
        };
      case "br":
      case "brave":
        return {
          generatedKinds: ["search"],
          includeCommands: false,
          searchEngine: "brave",
          sources: [],
        };
      case "k":
      case "kagi":
        return {
          generatedKinds: ["search"],
          includeCommands: false,
          searchEngine: "kagi",
          sources: [],
        };
      case "yt":
      case "youtube":
        return {
          generatedKinds: ["search"],
          includeCommands: false,
          searchEngine: "youtube",
          sources: [],
        };
      case "w":
      case "wiki":
      case "wikipedia":
        return {
          generatedKinds: ["search"],
          includeCommands: false,
          searchEngine: "wikipedia",
          sources: [],
        };
      case "cmd":
      case "command":
      case "commands":
      case "m":
        return {
          generatedKinds: [],
          includeCommands: true,
          sources: [],
        };
      default:
        return null;
    }
  }

  function fuzzyHighlightRanges(term: string, value: string): TextRange[] {
    let termIndex = 0;
    const ranges: TextRange[] = [];

    for (let index = 0; index < value.length; index += 1) {
      if (value[index] !== term[termIndex]) {
        continue;
      }

      ranges.push({ start: index, end: index + 1 });
      termIndex += 1;
      if (termIndex === term.length) {
        return ranges;
      }
    }

    return [];
  }

  function mergeTextRanges(ranges: TextRange[]): TextRange[] {
    const sortedRanges = ranges
      .filter((range) => range.start < range.end)
      .sort((a, b) => a.start - b.start || a.end - b.end);

    const mergedRanges: TextRange[] = [];
    for (const range of sortedRanges) {
      const previous = mergedRanges[mergedRanges.length - 1];
      if (!previous || range.start > previous.end) {
        mergedRanges.push({ ...range });
        continue;
      }

      previous.end = Math.max(previous.end, range.end);
    }

    return mergedRanges;
  }

  function activateCommandPaletteSelection(
    dispositionOverride?: PaletteDisposition,
  ): void {
    if (!commandPaletteState) {
      return;
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result) {
      return;
    }

    const disposition = dispositionOverride ?? commandPaletteState.disposition;
    const query = commandPaletteState.input.value;
    if (result.kind === "query") {
      if (result.query) {
        applyCommandPaletteQuerySuggestion(result.query);
      }
      return;
    }

    if (result.kind === "command" && result.command === "edit-current-url") {
      executeLocalPaletteCommand(result.command);
      return;
    }

    if (
      commandPaletteShouldCloseAfterActivation({
        disposition,
        resultKind: result.kind,
      })
    ) {
      closeCommandPalette();
    }
    void rememberCommandPaletteQuery(query);
    if (result.kind === "command") {
      if (disposition === "background-tab") {
        return;
      }

      if (result.command) {
        executeLocalPaletteCommand(result.command);
      }
      return;
    }

    void executeBrowserPaletteResult(result, disposition);
    advanceCommandPaletteSelectionAfterActivation({
      activeIndex: commandPaletteState?.activeIndex ?? 0,
      disposition,
      resultCount: commandPaletteState?.results.length ?? 0,
      resultKind: result.kind,
    });
  }

  function commandPaletteShouldCloseAfterActivation(
    candidate: CommandPaletteActivationCloseCandidate,
  ): boolean {
    return candidate.disposition !== "background-tab";
  }

  function commandPaletteNextIndexAfterActivation(
    candidate: CommandPaletteAdvanceCandidate,
  ): number {
    if (
      candidate.disposition !== "background-tab" ||
      candidate.resultKind === "command" ||
      candidate.resultCount <= 0
    ) {
      return candidate.activeIndex;
    }

    return (candidate.activeIndex + 1) % candidate.resultCount;
  }

  function advanceCommandPaletteSelectionAfterActivation(
    candidate: CommandPaletteAdvanceCandidate,
  ): void {
    if (!commandPaletteState) {
      return;
    }

    const nextIndex = commandPaletteNextIndexAfterActivation(candidate);
    if (nextIndex === commandPaletteState.activeIndex) {
      return;
    }

    commandPaletteState.activeIndex = nextIndex;
    renderCommandPaletteResults();
  }

  function activateCommandPaletteIndex(
    index: number,
    dispositionOverride?: PaletteDisposition,
  ): void {
    if (!commandPaletteState || !commandPaletteState.results[index]) {
      return;
    }

    commandPaletteState.activeIndex = index;
    activateCommandPaletteSelection(dispositionOverride);
  }

  function applyCommandPaletteSourcePrefix(
    prefix: CommandPaletteSourcePrefix,
  ): void {
    if (!commandPaletteState) {
      return;
    }

    commandPaletteState.input.value = commandPaletteApplyPrefixValue(
      commandPaletteState.input.value,
      prefix,
    );
    commandPaletteState.input.setSelectionRange(
      commandPaletteState.input.value.length,
      commandPaletteState.input.value.length,
    );
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function applyCommandPaletteQuerySuggestion(query: string): void {
    if (!commandPaletteState) {
      return;
    }

    commandPaletteState.input.value = query;
    commandPaletteState.input.setSelectionRange(query.length, query.length);
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function editCommandPaletteSelectionUrl(): void {
    if (!commandPaletteState) {
      return;
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result) {
      return;
    }

    const editableValue = commandPaletteEditableResultValue(result);
    if (!editableValue) {
      showUrlCopyToast("No URL to edit");
      return;
    }

    commandPaletteState.input.value = editableValue;
    commandPaletteState.input.setSelectionRange(
      commandPaletteState.input.value.length,
      commandPaletteState.input.value.length,
    );
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function narrowCommandPaletteSelectionToDomain(): void {
    if (!commandPaletteState) {
      return;
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result) {
      return;
    }

    const nextValue = commandPaletteDomainFilterValue(
      commandPaletteState.input.value,
      { url: "url" in result ? result.url : undefined },
    );
    if (!nextValue) {
      showUrlCopyToast("No domain to filter");
      return;
    }

    commandPaletteState.input.value = nextValue;
    commandPaletteState.input.setSelectionRange(
      commandPaletteState.input.value.length,
      commandPaletteState.input.value.length,
    );
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function narrowCommandPaletteSelectionToTitle(): void {
    if (!commandPaletteState) {
      return;
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result) {
      return;
    }

    const nextValue = commandPaletteTitleFilterValue(
      commandPaletteState.input.value,
      { kind: result.kind, title: result.title },
    );
    if (!nextValue) {
      showUrlCopyToast("No title to filter");
      return;
    }

    commandPaletteState.input.value = nextValue;
    commandPaletteState.input.setSelectionRange(
      commandPaletteState.input.value.length,
      commandPaletteState.input.value.length,
    );
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function narrowCommandPaletteSelectionToUrl(): void {
    if (!commandPaletteState) {
      return;
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result) {
      return;
    }

    const nextValue = commandPaletteUrlFilterValue(
      commandPaletteState.input.value,
      { kind: result.kind, url: "url" in result ? result.url : undefined },
    );
    if (!nextValue) {
      showUrlCopyToast("No URL to filter");
      return;
    }

    commandPaletteState.input.value = nextValue;
    commandPaletteState.input.setSelectionRange(
      commandPaletteState.input.value.length,
      commandPaletteState.input.value.length,
    );
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  async function copyCommandPaletteSelectionUrl(): Promise<void> {
    if (!commandPaletteState) {
      return;
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result) {
      return;
    }

    if (!("url" in result) || !result.url) {
      showUrlCopyToast("No URL to copy");
      return;
    }

    const query = commandPaletteState.input.value;
    const url = result.url;
    closeCommandPalette();
    void rememberCommandPaletteQuery(query);
    const didCopy = await writeTextToClipboard(url);
    showUrlCopyToast(didCopy ? "Copied URL" : "Could not copy URL");
  }

  async function copyCommandPaletteSelectionMarkdown(): Promise<void> {
    if (!commandPaletteState) {
      return;
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result) {
      return;
    }

    const markdown = commandPaletteMarkdownLinkValue(result);
    if (!markdown) {
      showUrlCopyToast("No URL to copy");
      return;
    }

    const query = commandPaletteState.input.value;
    closeCommandPalette();
    void rememberCommandPaletteQuery(query);
    const didCopy = await writeTextToClipboard(markdown);
    showUrlCopyToast(
      didCopy ? "Copied Markdown link" : "Could not copy Markdown link",
    );
  }

  function commandPaletteMarkdownLinkValue(
    result: CommandPaletteMarkdownResultCandidate,
  ): string | null {
    const url = result.url?.trim();
    if (!url) {
      return null;
    }

    const title = normalizeMarkdownLinkTitle(result.title) || url;
    return `[${escapeMarkdownLinkText(title)}](${escapeMarkdownLinkUrl(url)})`;
  }

  function normalizeMarkdownLinkTitle(value: string | undefined): string {
    return (value ?? "").replace(/\s+/g, " ").trim();
  }

  function escapeMarkdownLinkText(value: string): string {
    return value.replace(/([\\[\]])/g, "\\$1");
  }

  function escapeMarkdownLinkUrl(value: string): string {
    return value.replace(/([\\)])/g, "\\$1");
  }

  async function loadCommandPaletteQueryHistory(): Promise<string[]> {
    const storage =
      (globalThis as typeof globalThis & { browser?: WebExtensionApi }).browser
        ?.storage?.local ?? null;
    if (!storage) {
      return [];
    }

    const result = await storage.get(COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY);
    return normalizeCommandPaletteQueryHistory(
      result[COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY],
    );
  }

  async function rememberCommandPaletteQuery(query: string): Promise<void> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    const storage =
      (globalThis as typeof globalThis & { browser?: WebExtensionApi }).browser
        ?.storage?.local ?? null;
    if (!storage) {
      return;
    }

    const history = await loadCommandPaletteQueryHistory();
    const nextHistory = [
      trimmedQuery,
      ...history.filter((item) => item !== trimmedQuery),
    ].slice(0, COMMAND_PALETTE_QUERY_HISTORY_MAX_ITEMS);
    await storage.set({
      [COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY]: nextHistory,
    });
  }

  async function forgetCommandPaletteEntry(): Promise<void> {
    if (!commandPaletteState) {
      return;
    }

    if (commandPaletteState.historyCursor !== null) {
      const removed = await forgetRecalledCommandPaletteQuery();
      if (removed) {
        showUrlCopyToast("Forgot palette query");
        return;
      }
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result) {
      showUrlCopyToast("Nothing to forget");
      return;
    }

    if (result.kind === "query") {
      if (!result.query) {
        showUrlCopyToast("Nothing to forget");
        return;
      }

      const removed = await forgetCommandPaletteQuery(result.query);
      showUrlCopyToast(
        removed ? "Forgot palette query" : "Could not forget query",
      );
      if (removed) {
        await refreshCommandPaletteResults();
      }
      return;
    }

    if (result.kind === "command" || !result.url) {
      showUrlCopyToast("Nothing to forget");
      return;
    }

    if (result.kind === "visit") {
      const removed = await removeCommandPaletteLocalVisit(result.url);
      showUrlCopyToast(
        removed ? "Forgot local visit" : "Could not forget visit",
      );
      if (removed) {
        await refreshCommandPaletteResults();
      }
      return;
    }

    if (result.kind !== "history") {
      showUrlCopyToast("Nothing to forget");
      return;
    }

    const removed = await removeCommandPaletteHistory(result.url);
    showUrlCopyToast(
      removed ? "Removed history result" : "Could not remove history",
    );
    if (removed) {
      await refreshCommandPaletteResults();
    }
  }

  async function closeCommandPaletteTab(): Promise<void> {
    if (!commandPaletteState) {
      return;
    }

    const result = commandPaletteState.results[commandPaletteState.activeIndex];
    if (!result || result.kind !== "tab" || typeof result.tabId !== "number") {
      showUrlCopyToast("No open tab to close");
      return;
    }

    const closed = await closeBrowserPaletteTab(result.tabId);
    showUrlCopyToast(closed ? "Closed tab" : "Could not close tab");
    if (closed) {
      await refreshCommandPaletteResults();
    }
  }

  async function closeBrowserPaletteTab(tabId: number): Promise<boolean> {
    if (typeof browser === "undefined" || !browser.runtime) {
      return false;
    }

    const response = (await browser.runtime
      .sendMessage({
        type: "palette-close-tab",
        tabId,
      })
      .catch(() => undefined)) as { closed?: unknown } | undefined;
    return response?.closed === true;
  }

  async function forgetRecalledCommandPaletteQuery(): Promise<boolean> {
    if (!commandPaletteState || commandPaletteState.historyCursor === null) {
      return false;
    }

    const query =
      commandPaletteState.history[commandPaletteState.historyCursor];
    if (!query) {
      return false;
    }

    const nextHistory = commandPaletteState.history.filter(
      (item) => item !== query,
    );
    const restoredQuery = commandPaletteState.inputBeforeHistory;
    commandPaletteState.history = nextHistory;
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    commandPaletteState.input.value = restoredQuery;
    await storeCommandPaletteQueryHistory(nextHistory);
    await refreshCommandPaletteResults();
    return true;
  }

  async function forgetCommandPaletteQuery(query: string): Promise<boolean> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return false;
    }

    const currentHistory =
      commandPaletteState?.history ?? (await loadCommandPaletteQueryHistory());
    const nextHistory = currentHistory.filter(
      (item) => item !== normalizedQuery,
    );
    if (nextHistory.length === currentHistory.length) {
      return false;
    }

    await storeCommandPaletteQueryHistory(nextHistory);
    if (commandPaletteState) {
      commandPaletteState.history = nextHistory;
      commandPaletteState.historyCursor = null;
      commandPaletteState.inputBeforeHistory = "";
    }

    return true;
  }

  async function removeCommandPaletteLocalVisit(url: string): Promise<boolean> {
    if (typeof browser === "undefined" || !browser.runtime) {
      return false;
    }

    const response = (await browser.runtime
      .sendMessage({
        type: "palette-remove-local-visit",
        url,
      })
      .catch(() => undefined)) as { removed?: unknown } | undefined;
    return response?.removed === true;
  }

  async function removeCommandPaletteHistory(url: string): Promise<boolean> {
    if (typeof browser === "undefined" || !browser.runtime) {
      return false;
    }

    const response = (await browser.runtime
      .sendMessage({
        type: "palette-remove-history",
        url,
      })
      .catch(() => undefined)) as { removed?: unknown } | undefined;
    return response?.removed === true;
  }

  async function storeCommandPaletteQueryHistory(
    history: string[],
  ): Promise<void> {
    const storage =
      (globalThis as typeof globalThis & { browser?: WebExtensionApi }).browser
        ?.storage?.local ?? null;
    if (!storage) {
      return;
    }

    await storage.set({
      [COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY]:
        normalizeCommandPaletteQueryHistory(history),
    });
  }

  function normalizeCommandPaletteQueryHistory(input: unknown): string[] {
    if (!Array.isArray(input)) {
      return [];
    }

    const history: string[] = [];
    for (const item of input) {
      if (typeof item !== "string") {
        continue;
      }

      const query = item.trim();
      if (!query || history.includes(query)) {
        continue;
      }

      history.push(query);
      if (history.length >= COMMAND_PALETTE_QUERY_HISTORY_MAX_ITEMS) {
        break;
      }
    }

    return history;
  }

  function executeLocalPaletteCommand(command: LocalPaletteCommandId): void {
    switch (command) {
      case "show-hints":
        if (isSupportedWebPage()) {
          startHintMode("current-tab");
        }
        return;
      case "show-new-tab-hints":
        if (isSupportedWebPage()) {
          startHintMode("new-tab");
        }
        return;
      case "copy-url":
        void copyCurrentUrl();
        return;
      case "edit-current-url":
        editCurrentUrlInCommandPalette();
        return;
      case "history-back":
        navigateHistory("back");
        return;
      case "history-forward":
        navigateHistory("forward");
        return;
      case "new-tab":
      case "duplicate-current-tab":
      case "close-current-tab":
        void executeTabCommand(command);
        return;
      case "previous-tab":
        switchTab("previous");
        return;
      case "next-tab":
        switchTab("next");
        return;
      case "scroll-top":
        scrollToTop();
        return;
      case "scroll-bottom":
        scrollToBottom();
        return;
      case "reload":
        reloadPage();
        return;
      case "open-settings":
        void openExtensionSettings();
        return;
    }
  }

  function editCurrentUrlInCommandPalette(): void {
    if (!commandPaletteState) {
      return;
    }

    const nextValue = commandPaletteCurrentUrlEditValue(location.href);
    if (!nextValue) {
      showUrlCopyToast("Current URL cannot be edited");
      return;
    }

    commandPaletteState.input.value = nextValue;
    commandPaletteState.input.setSelectionRange(
      nextValue.length,
      nextValue.length,
    );
    commandPaletteState.historyCursor = null;
    commandPaletteState.inputBeforeHistory = "";
    void refreshCommandPaletteResults();
  }

  function openCurrentUrlEditPalette(disposition: PaletteDisposition): void {
    const initialQuery = commandPaletteCurrentUrlEditValue(location.href);
    if (!initialQuery) {
      showUrlCopyToast("Current URL cannot be edited");
      return;
    }

    openCommandPalette({
      disposition,
      generatedKinds: ["url"],
      includeCommands: false,
      includeGenerated: true,
      initialQuery,
      placeholder: "Edit current URL",
      sources: [],
    });
  }

  async function executeBrowserPaletteResult(
    result: BrowserPaletteResult,
    disposition: PaletteDisposition,
  ): Promise<void> {
    if (typeof browser === "undefined" || !browser.runtime) {
      return;
    }

    await browser.runtime
      .sendMessage({
        type: "palette-execute",
        disposition,
        result,
      })
      .catch(() => undefined);
  }

  async function openExtensionSettings(): Promise<void> {
    if (typeof browser === "undefined" || !browser.runtime) {
      return;
    }

    await browser.runtime
      .sendMessage({ type: "open-options" })
      .catch(() => undefined);
  }

  async function executeTabCommand(command: TabCommandId): Promise<void> {
    if (typeof browser === "undefined" || !browser.runtime) {
      return;
    }

    await browser.runtime
      .sendMessage({ type: "tab-command", command })
      .catch(() => undefined);
  }

  function compareCommandPaletteResults(
    a: CommandPaletteResult,
    b: CommandPaletteResult,
  ): number {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return a.title.localeCompare(b.title);
  }

  function scheduleMenuRevealStep(callback: () => void, delayMs: number): void {
    cancelPendingMenuReveal();
    menuRevealTimer = window.setTimeout(() => {
      menuRevealTimer = 0;
      callback();
    }, delayMs);
  }

  function cancelPendingMenuReveal(): void {
    if (!menuRevealTimer) {
      return;
    }

    window.clearTimeout(menuRevealTimer);
    menuRevealTimer = 0;
  }

  function collectVisibleLinkSignatures(): Set<string> {
    const signatures = new Set<string>();
    for (const link of querySelectorAllIncludingShadows<HTMLAnchorElement>(
      "a[href]",
    )) {
      if (!isVisibleLink(link)) {
        continue;
      }

      const rect = visibleRectForElement(link);
      if (!rect) {
        continue;
      }

      signatures.add(
        [
          link.href,
          Math.round(rect.left),
          Math.round(rect.top),
          link.textContent?.trim().slice(0, 80) ?? "",
        ].join("\n"),
      );
    }

    return signatures;
  }

  function hasNewVisibleLinks(beforeVisibleLinks: Set<string>): boolean {
    for (const signature of collectVisibleLinkSignatures()) {
      if (!beforeVisibleLinks.has(signature)) {
        return true;
      }
    }

    return false;
  }

  function collectHintTargets(
    activationMode: HintActivationMode,
  ): HintTarget[] {
    const targets: HintTarget[] = [];
    collectLinkTargetsInto(targets, activationMode);
    if (activationMode === "current-tab") {
      collectMenuTriggerTargetsInto(targets);
      collectMediaTargetsInto(targets);
      collectFormControlTargetsInto(targets);
      collectSemanticActionTargetsInto(targets);
    }

    targets.sort((a, b) => {
      if (a.rect.top !== b.rect.top) {
        return a.rect.top - b.rect.top;
      }
      return a.rect.left - b.rect.left;
    });

    return targets;
  }

  function collectLinkTargetsInto(
    targets: HintTarget[],
    activationMode: HintActivationMode,
  ): void {
    const seen = new Set<HTMLAnchorElement>();
    for (const link of querySelectorAllIncludingShadows<HTMLAnchorElement>(
      "a[href]",
    )) {
      if (
        seen.has(link) ||
        !isVisibleLink(link) ||
        !isActivatableLink(link, activationMode)
      ) {
        continue;
      }

      const rect = visibleRectForElement(link);
      if (!rect) {
        continue;
      }

      seen.add(link);
      targets.push({ kind: "link", element: link, rect });
    }
  }

  function collectFormControlTargetsInto(targets: HintTarget[]): void {
    const seen = new Set<FormControlTargetElement>();
    for (const element of querySelectorAllIncludingShadows<FormControlTargetElement>(
      "button, input:not([type='password' i]), select, textarea",
    )) {
      if (seen.has(element) || !isVisibleFormControlTarget(element)) {
        continue;
      }

      const rect = visibleRectForElement(element);
      if (!rect) {
        continue;
      }

      seen.add(element);
      targets.push({ kind: "form-control", element, rect });
    }
  }

  function collectMenuTriggerTargetsInto(targets: HintTarget[]): void {
    const seen = new Set<HTMLElement>();
    for (const element of querySelectorAllIncludingShadows<HTMLElement>(
      MENU_TRIGGER_TARGET_SELECTOR,
    )) {
      if (seen.has(element) || !isVisibleMenuTriggerTarget(element)) {
        continue;
      }

      const rect = visibleRectForElement(element);
      if (!rect) {
        continue;
      }

      seen.add(element);
      targets.push({ kind: "menu-trigger", element, rect });
    }
  }

  function collectMediaTargetsInto(targets: HintTarget[]): void {
    const addedControls = collectMediaControlTargetsInto(targets);
    if (!addedControls) {
      collectMediaSurfaceTargetsInto(targets);
    }
  }

  function collectMediaControlTargetsInto(targets: HintTarget[]): boolean {
    const seen = new Set<HTMLElement>();
    let addedControl = false;
    for (const surface of querySelectorAllIncludingShadows<HTMLElement>(
      MEDIA_CONTROL_SURFACE_SELECTOR,
    )) {
      if (!isVisibleElementWithAncestors(surface)) {
        continue;
      }

      for (const element of querySelectorAllIncludingShadows<HTMLElement>(
        MEDIA_CONTROL_TARGET_SELECTOR,
        surface,
      )) {
        const targetElement = mediaControlTargetElement(element, surface);
        if (
          seen.has(targetElement) ||
          !isVisibleMediaControlTarget(targetElement)
        ) {
          continue;
        }

        const rect = visibleRectForMediaControlTarget(targetElement);
        if (!rect) {
          continue;
        }

        seen.add(targetElement);
        addedControl = true;
        targets.push({ kind: "media-control", element: targetElement, rect });
      }
    }

    return addedControl;
  }

  function collectMediaSurfaceTargetsInto(targets: HintTarget[]): void {
    const seen = new Set<HTMLElement>();
    for (const element of querySelectorAllIncludingShadows<HTMLElement>(
      MEDIA_SURFACE_TARGET_SELECTOR,
    )) {
      if (seen.has(element) || !isVisibleMediaSurfaceTarget(element)) {
        continue;
      }

      const rect = visibleRectForElement(element);
      if (!rect) {
        continue;
      }

      seen.add(element);
      targets.push({ kind: "media-surface", element, rect });
    }
  }

  function collectSemanticActionTargetsInto(targets: HintTarget[]): void {
    const seen = new Set<HTMLElement>();
    for (const element of querySelectorAllIncludingShadows<HTMLElement>(
      SEMANTIC_ACTION_TARGET_SELECTOR,
    )) {
      if (seen.has(element) || !isVisibleSemanticActionTarget(element)) {
        continue;
      }

      const rect = visibleRectForSemanticActionTarget(element);
      if (!rect) {
        continue;
      }

      seen.add(element);
      targets.push({ kind: "semantic-action", element, rect });
    }
  }

  function isActivatableLink(
    link: HTMLAnchorElement,
    activationMode: HintActivationMode,
  ): boolean {
    if (activationMode === "current-tab") {
      return true;
    }

    return isSupportedNewTabUrl(link.href);
  }

  function isVisibleLink(link: HTMLAnchorElement): boolean {
    return isVisibleElement(link, { allowAriaHidden: true });
  }

  function isVisibleFormControlTarget(
    element: FormControlTargetElement,
  ): boolean {
    if (isPasswordInput(element)) {
      return false;
    }

    if (
      element.disabled ||
      isSafeMenuTriggerElementCandidate(element) ||
      isSafeMediaControlElementCandidate(element) ||
      !isVisibleElement(element)
    ) {
      return false;
    }

    if (element instanceof HTMLInputElement) {
      return element.type.toLowerCase() !== "hidden";
    }

    return true;
  }

  function isPasswordInput(
    element: FormControlTargetElement,
  ): element is HTMLInputElement {
    return element instanceof HTMLInputElement && element.type === "password";
  }

  function isVisibleMenuTriggerTarget(element: HTMLElement): boolean {
    return (
      isVisibleElement(element) && isSafeMenuTriggerElementCandidate(element)
    );
  }

  function isVisibleMediaControlTarget(element: HTMLElement): boolean {
    return (
      isVisibleElementWithAncestors(element) &&
      isSafeMediaControlElementCandidate(element)
    );
  }

  function isVisibleMediaSurfaceTarget(element: HTMLElement): boolean {
    return isVisibleElementWithAncestors(element) && hasMediaElement(element);
  }

  function revealMediaControlsBeforeHintCollection(
    activationMode: HintActivationMode,
  ): boolean {
    const surfaces = revealableMediaSurfaceTargets();
    if (
      !shouldPreRevealMediaControlsCandidate({
        activationMode,
        hasRevealableMediaSurfaces: surfaces.length > 0,
        hasVisibleMediaControls: hasVisibleMediaControlTargets(),
      })
    ) {
      return false;
    }

    for (const surface of surfaces) {
      revealMediaControlSurface(surface);
      dispatchMediaSurfaceRevealEvent(surface);
    }

    return true;
  }

  function shouldPreRevealMediaControlsCandidate(
    candidate: MediaControlRevealCandidate,
  ): boolean {
    return (
      candidate.activationMode === "current-tab" &&
      candidate.hasRevealableMediaSurfaces
    );
  }

  function isRevealableMediaControlsCandidate(
    candidate: MediaControlRevealCandidate,
  ): boolean {
    return (
      candidate.activationMode === "current-tab" &&
      candidate.hasRevealableMediaSurfaces &&
      !candidate.hasVisibleMediaControls
    );
  }

  function hasVisibleMediaControlTargets(): boolean {
    for (const surface of querySelectorAllIncludingShadows<HTMLElement>(
      MEDIA_CONTROL_SURFACE_SELECTOR,
    )) {
      if (!isVisibleElementWithAncestors(surface)) {
        continue;
      }

      for (const element of querySelectorAllIncludingShadows<HTMLElement>(
        MEDIA_CONTROL_TARGET_SELECTOR,
        surface,
      )) {
        if (
          isVisibleMediaControlTarget(element) &&
          visibleRectForMediaControlTarget(element)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  function revealableMediaSurfaceTargets(): HTMLElement[] {
    const surfaces: HTMLElement[] = [];
    const seen = new Set<HTMLElement>();
    for (const element of querySelectorAllIncludingShadows<HTMLElement>(
      MEDIA_SURFACE_TARGET_SELECTOR,
    )) {
      if (seen.has(element) || !isVisibleMediaSurfaceTarget(element)) {
        continue;
      }

      seen.add(element);
      surfaces.push(element);
    }

    return surfaces;
  }

  function revealMediaControlSurface(element: HTMLElement): void {
    document.documentElement.classList.add(MEDIA_CONTROLS_REVEALED_CLASS);
    element.classList.add(MEDIA_CONTROLS_REVEALED_CLASS);
    revealedMediaControlSurfaces.add(element);
  }

  function clearRevealedMediaControlSurfaces(): void {
    document.documentElement.classList.remove(MEDIA_CONTROLS_REVEALED_CLASS);
    for (const surface of revealedMediaControlSurfaces) {
      surface.classList.remove(MEDIA_CONTROLS_REVEALED_CLASS);
    }

    revealedMediaControlSurfaces.clear();
  }

  function isVisibleSemanticActionTarget(element: HTMLElement): boolean {
    if (
      !isVisibleElement(element) ||
      isNativeHintTarget(element) ||
      isSafeMenuTriggerElementCandidate(element) ||
      isSafeMediaControlElementCandidate(element)
    ) {
      return false;
    }

    if (element.getAttribute("aria-disabled") === "true") {
      return false;
    }

    return true;
  }

  function isSafeMenuTriggerElementCandidate(element: HTMLElement): boolean {
    return isSafeMenuTriggerCandidate(menuTriggerCandidateForElement(element));
  }

  function canClickMenuTriggerElement(element: HTMLElement): boolean {
    return canClickMenuTriggerCandidate(
      menuTriggerCandidateForElement(element),
    );
  }

  function isSafeMediaControlElementCandidate(element: HTMLElement): boolean {
    return isSafeMediaControlCandidate(
      mediaControlCandidateForElement(element),
    );
  }

  function menuTriggerCandidateForElement(
    element: HTMLElement,
  ): SafariKeyboardNavigationMenuTriggerCandidate {
    return {
      hasAriaControls: element.hasAttribute("aria-controls"),
      hasAriaExpanded: element.hasAttribute("aria-expanded"),
      hasAriaHaspopup:
        element.hasAttribute("aria-haspopup") &&
        element.getAttribute("aria-haspopup") !== "false",
      isAriaDisabled: element.getAttribute("aria-disabled") === "true",
      isDisabled:
        element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
          ? element.disabled
          : false,
      isFormSubmitButton:
        element instanceof HTMLButtonElement &&
        closestIncludingShadows("form", element) !== null &&
        element.type === "submit",
      isInNavigationContext:
        closestIncludingShadows(
          'nav, header, [role="navigation"], [role="menubar"], [role="menu"]',
          element,
        ) !== null,
      isLink:
        element.matches("a[href]") ||
        closestIncludingShadows("a[href]", element) !== null,
      isNonButtonFormControl:
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement,
      role: (element.getAttribute("role") ?? "").toLowerCase(),
      tagName: element.tagName.toLowerCase(),
    };
  }

  function isSafeMenuTriggerCandidate(
    candidate: SafariKeyboardNavigationMenuTriggerCandidate,
  ): boolean {
    if (
      candidate.isAriaDisabled ||
      candidate.isDisabled ||
      candidate.isFormSubmitButton ||
      candidate.isLink ||
      candidate.isNonButtonFormControl
    ) {
      return false;
    }

    const signals = menuTriggerSignals(candidate);
    return signals.hasExplicitDisclosure || signals.isNavigationButtonLike;
  }

  function canClickMenuTriggerCandidate(
    candidate: SafariKeyboardNavigationMenuTriggerCandidate,
  ): boolean {
    if (!isSafeMenuTriggerCandidate(candidate)) {
      return false;
    }

    const signals = menuTriggerSignals(candidate);
    return signals.hasExplicitDisclosure;
  }

  function menuTriggerSignals(
    candidate: SafariKeyboardNavigationMenuTriggerCandidate,
  ): { hasExplicitDisclosure: boolean; isNavigationButtonLike: boolean } {
    const tagName = candidate.tagName.toLowerCase();
    const role = candidate.role.toLowerCase();
    const isButtonLike =
      tagName === "button" || role === "button" || role === "menuitem";

    return {
      hasExplicitDisclosure:
        candidate.hasAriaControls ||
        candidate.hasAriaExpanded ||
        candidate.hasAriaHaspopup,
      isNavigationButtonLike: candidate.isInNavigationContext && isButtonLike,
    };
  }

  function mediaControlCandidateForElement(
    element: HTMLElement,
  ): SafariKeyboardNavigationMediaControlCandidate {
    const tagName = element.tagName.toLowerCase();
    const role = (element.getAttribute("role") ?? "").toLowerCase();
    return {
      hasAccessibleName:
        element.hasAttribute("aria-label") || element.hasAttribute("title"),
      isAriaDisabled: element.getAttribute("aria-disabled") === "true",
      isDisabled:
        element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
          ? element.disabled
          : false,
      isFocusable:
        element.tabIndex >= 0 ||
        element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement,
      isInMediaControlSurface:
        closestIncludingShadows(MEDIA_CONTROL_SURFACE_SELECTOR, element) !==
        null,
      isLink:
        element.matches("a[href]") ||
        closestIncludingShadows("a[href]", element) !== null,
      isNativeControl:
        tagName === "button" ||
        tagName === "input" ||
        tagName === "select" ||
        tagName === "textarea",
      isYouTubeButton:
        element.classList.contains("ytp-button") ||
        closestIncludingShadows(".ytp-button", element) !== null,
      role,
      tagName,
    };
  }

  function mediaControlTargetElement(
    element: HTMLElement,
    surface: HTMLElement,
  ): HTMLElement {
    const youtubeButton = closestIncludingShadows(
      ".ytp-button",
      element,
    ) as HTMLElement | null;
    if (youtubeButton && containsIncludingShadows(surface, youtubeButton)) {
      return youtubeButton;
    }

    return element;
  }

  function isSafeMediaControlCandidate(
    candidate: SafariKeyboardNavigationMediaControlCandidate,
  ): boolean {
    if (
      !candidate.isInMediaControlSurface ||
      candidate.isAriaDisabled ||
      candidate.isDisabled ||
      candidate.isLink
    ) {
      return false;
    }

    return (
      candidate.isNativeControl ||
      candidate.isYouTubeButton ||
      candidate.role === "button" ||
      candidate.role === "slider" ||
      candidate.role === "switch" ||
      candidate.role === "menuitem" ||
      (candidate.isFocusable && candidate.hasAccessibleName)
    );
  }

  function isNativeHintTarget(element: HTMLElement): boolean {
    return (
      element.matches(NATIVE_HINT_TARGET_SELECTOR) ||
      closestIncludingShadows(NATIVE_HINT_TARGET_SELECTOR, element) !== null ||
      querySelectorIncludingShadows(NATIVE_HINT_TARGET_SELECTOR, element) !==
        null
    );
  }

  function isVisibleElement(
    element: HTMLElement,
    options: { allowAriaHidden?: boolean } = {},
  ): boolean {
    if (
      element.hidden ||
      (!options.allowAriaHidden &&
        element.getAttribute("aria-hidden") === "true")
    ) {
      return false;
    }

    const style = getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.visibility !== "collapse" &&
      style.opacity !== "0"
    );
  }

  function isVisibleElementWithAncestors(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current && current !== document.documentElement) {
      if (!isVisibleElement(current)) {
        return false;
      }

      const pNode: Node | null = current.parentNode;
      if (pNode instanceof ShadowRoot) {
        current = pNode.host as HTMLElement;
      } else if (pNode instanceof HTMLElement) {
        current = pNode;
      } else {
        current = null;
      }
    }

    return isVisibleElement(element);
  }

  function visibleRectForElement(element: Element): HintPosition | null {
    const isInsideShadow = element.getRootNode() instanceof ShadowRoot;
    if (!isInsideShadow) {
      const textNode = firstNonEmptyTextNode(element);
      if (textNode) {
        const range = document.createRange();
        try {
          range.selectNode(textNode);
          const rect = firstVisibleRect(range.getClientRects());
          if (rect) {
            return rect;
          }
        } finally {
          range.detach();
        }
      }
    }
    return firstVisibleRect(element.getClientRects());
  }

  function firstNonEmptyTextNode(node: Node): Text | null {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue && node.nodeValue.trim().length > 0) {
        const parent =
          node.parentElement ??
          (node.parentNode instanceof ShadowRoot
            ? (node.parentNode.host as HTMLElement)
            : null);
        if (parent && isVisibleElementWithAncestors(parent)) {
          return node as Text;
        }
      }
    }
    if (node instanceof HTMLElement && node.shadowRoot) {
      const found = firstNonEmptyTextNode(node.shadowRoot);
      if (found) {
        return found;
      }
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child instanceof HTMLElement && !isVisibleElement(child)) {
        continue;
      }
      const found = firstNonEmptyTextNode(child);
      if (found) {
        return found;
      }
    }
    return null;
  }

  function visibleRectForMediaControlTarget(
    element: HTMLElement,
  ): HintPosition | null {
    const ownRect = visibleRectForElement(element);
    if (ownRect) {
      return centerTopHintPositionForElement(element, ownRect);
    }

    return visibleContentRectForElement(element);
  }

  function visibleRectForSemanticActionTarget(
    element: HTMLElement,
  ): HintPosition | null {
    const ownRect = visibleRectForElement(element);
    if (ownRect) {
      return ownRect;
    }

    return visibleContentRectForElement(element);
  }

  function visibleContentRectForElement(
    element: HTMLElement,
  ): HintPosition | null {
    const range = document.createRange();

    try {
      range.selectNodeContents(element);
      return firstVisibleRect(range.getClientRects());
    } finally {
      range.detach();
    }
  }

  function firstVisibleRect(rects: DOMRectList): HintPosition | null {
    for (const rect of rects) {
      if (rect.width <= 0 || rect.height <= 0 || !intersectsViewport(rect)) {
        continue;
      }

      return {
        left: clamp(rect.left, 0, window.innerWidth - 1),
        top: clamp(rect.top, 0, window.innerHeight - 1),
      };
    }

    return null;
  }

  function centerTopHintPositionForElement(
    element: Element,
    fallback: HintPosition,
  ): HintPosition {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || !intersectsViewport(rect)) {
      return fallback;
    }

    return {
      left: clamp(rect.left + rect.width / 2, 0, window.innerWidth - 1),
      top: clamp(rect.top, 0, window.innerHeight - 1),
    };
  }

  function intersectsViewport(rect: DOMRect): boolean {
    return (
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.top < window.innerHeight
    );
  }

  function hasMediaElement(element: HTMLElement): boolean {
    return (
      element.matches("video, audio") ||
      element.querySelector("video, audio") !== null
    );
  }

  function highlightActivatedElement(element: Element): void {
    element.classList.add("skne-active-highlight");
    window.setTimeout(() => {
      element.classList.remove("skne-active-highlight");
    }, 300);
  }

  function activateHintTarget(
    target: HintTarget,
    activationMode: HintActivationMode,
  ): void {
    highlightActivatedElement(target.element);

    if (target.kind === "link") {
      activateLinkTarget(target.element, activationMode);
      return;
    }

    if (target.kind === "menu-trigger") {
      activateMenuTriggerTarget(target.element);
      return;
    }

    if (target.kind === "media-control") {
      activateMediaControlTarget(target.element);
      return;
    }

    if (target.kind === "media-surface") {
      activateMediaSurfaceTarget(target.element);
      return;
    }

    if (target.kind === "semantic-action") {
      activateSemanticActionTarget(target.element);
      return;
    }

    activateFormControlTarget(target.element);
  }

  function activateMenuTriggerTarget(element: HTMLElement): void {
    const beforeVisibleLinks = collectVisibleLinkSignatures();

    cancelHintMode();
    focusElement(element);

    scheduleMenuRevealStep(() => {
      if (hasNewVisibleLinks(beforeVisibleLinks)) {
        startHintMode("current-tab");
        return;
      }

      if (canClickMenuTriggerElement(element)) {
        focusElement(element);
        element.click();
        scheduleMenuRevealStep(() => {
          startHintMode("current-tab");
        }, MENU_TRIGGER_CLICK_RESCAN_DELAY_MS);
        return;
      }

      startHintMode("current-tab");
    }, MENU_TRIGGER_FOCUS_RESCAN_DELAY_MS);
  }

  function activateMediaControlTarget(element: HTMLElement): void {
    cancelHintMode();
    focusElement(element);
    element.click();
  }

  function activateMediaSurfaceTarget(element: HTMLElement): void {
    cancelHintMode();
    focusElement(element);
    dispatchMediaSurfaceRevealEvent(element);
    scheduleMenuRevealStep(() => {
      startHintMode("current-tab");
    }, MEDIA_SURFACE_RESCAN_DELAY_MS);
  }

  function dispatchMediaSurfaceRevealEvent(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const clientX = Math.max(
      0,
      Math.min(window.innerWidth - 1, rect.left + rect.width / 2),
    );
    const clientY = Math.max(
      0,
      Math.min(window.innerHeight - 1, rect.top + rect.height / 2),
    );
    for (const type of ["mouseover", "mouseenter", "mousemove"]) {
      element.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          view: window,
        }),
      );
    }

    if (typeof PointerEvent === "function") {
      for (const type of ["pointerover", "pointerenter", "pointermove"]) {
        element.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            pointerType: "mouse",
            view: window,
          }),
        );
      }
    }
  }

  function activateLinkTarget(
    element: HTMLAnchorElement,
    activationMode: HintActivationMode,
  ): void {
    if (activationMode === "new-tab") {
      openLinkTargetInNewTab(element);
      return;
    }

    const link = element.closest<HTMLAnchorElement>("a[href]") || element;
    const previousTarget = link.getAttribute("target");
    const hadTarget = link.hasAttribute("target");

    cancelHintMode();

    link.setAttribute("target", "_self");

    try {
      link.click();
    } finally {
      window.setTimeout(() => {
        if (hadTarget) {
          link.setAttribute("target", previousTarget ?? "");
        } else {
          link.removeAttribute("target");
        }
      }, 0);
    }
  }

  function activateFormControlTarget(element: FormControlTargetElement): void {
    cancelHintMode();
    focusElement(element);

    if (isTextEntryControl(element)) {
      placeTextEntryCaretAtEnd(element);
      return;
    }

    element.click();
  }

  function activateSemanticActionTarget(element: HTMLElement): void {
    cancelHintMode();
    focusElement(element);
    element.click();
  }

  function openLinkTargetInNewTab(element: HTMLAnchorElement): void {
    const link = element.closest<HTMLAnchorElement>("a[href]") || element;
    const url = link.href;

    cancelHintMode();

    if (!isSupportedNewTabUrl(url)) {
      return;
    }

    if (typeof browser === "undefined" || !browser.runtime) {
      return;
    }

    void browser.runtime
      .sendMessage({ type: "open-tab", url, active: true })
      .catch(() => undefined);
  }

  function isSupportedNewTabUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }

  function focusElement(element: HTMLElement): void {
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  }

  function isTextEntryControl(
    element: FormControlTargetElement,
  ): element is HTMLInputElement | HTMLTextAreaElement {
    if (element instanceof HTMLTextAreaElement) {
      return true;
    }

    return (
      element instanceof HTMLInputElement &&
      TEXT_ENTRY_INPUT_TYPES.has(element.type.toLowerCase())
    );
  }

  function placeTextEntryCaretAtEnd(
    element: HTMLInputElement | HTMLTextAreaElement,
  ): void {
    const end = element.value.length;
    try {
      element.setSelectionRange(end, end);
    } catch {
      // Some text-entry-like input types do not expose text selection in Safari.
    }
  }

  function movementForEvent(event: KeyboardEvent): Movement | null {
    const movements: Array<
      [keyof SafariKeyboardNavigationShortcutSettings, Movement]
    > = [
      [
        "left",
        {
          key: event.key.toLowerCase(),
          dx: -HORIZONTAL_STEP_PX,
          dy: 0,
          speedX: -HORIZONTAL_HOLD_SPEED_PX_PER_SECOND,
          speedY: 0,
        },
      ],
      [
        "down",
        {
          key: event.key.toLowerCase(),
          dx: 0,
          dy: VERTICAL_STEP_PX,
          speedX: 0,
          speedY: VERTICAL_HOLD_SPEED_PX_PER_SECOND,
        },
      ],
      [
        "up",
        {
          key: event.key.toLowerCase(),
          dx: 0,
          dy: -VERTICAL_STEP_PX,
          speedX: 0,
          speedY: -VERTICAL_HOLD_SPEED_PX_PER_SECOND,
        },
      ],
      [
        "right",
        {
          key: event.key.toLowerCase(),
          dx: HORIZONTAL_STEP_PX,
          dy: 0,
          speedX: HORIZONTAL_HOLD_SPEED_PX_PER_SECOND,
          speedY: 0,
        },
      ],
    ];

    for (const [shortcutName, movement] of movements) {
      if (
        settingsApi.isShortcutEvent(
          event,
          extensionSettings.shortcuts[shortcutName],
          {
            allowRepeat: true,
          },
        )
      ) {
        return movement;
      }
    }

    return null;
  }

  function halfPageDirectionForEvent(event: KeyboardEvent): -1 | 1 | null {
    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.halfPageDown,
      )
    ) {
      return 1;
    }

    if (
      settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.halfPageUp)
    ) {
      return -1;
    }

    return null;
  }

  function tabSwitchDirectionForEvent(
    event: KeyboardEvent,
  ): TabSwitchDirection | null {
    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.tabPrevious,
      )
    ) {
      return "previous";
    }

    if (
      settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.tabNext)
    ) {
      return "next";
    }

    return null;
  }

  function scrollHalfPage(direction: -1 | 1): void {
    const surface = findScrollSurface(
      {
        key: direction > 0 ? "d" : "u",
        dx: 0,
        dy: direction,
        speedX: 0,
        speedY: 0,
      },
      { requireCanMove: true },
    );
    const distance = Math.max(
      1,
      Math.round(surfaceClientHeight(surface) * HALF_PAGE_RATIO),
    );

    stopMovement();
    scrollSurfaceBy(surface, {
      left: 0,
      top: distance * direction,
      behavior: "smooth",
    });
    triggerScrollIndicator(surface, 0, direction);
  }

  function switchTab(direction: TabSwitchDirection): void {
    stopMovement();
    if (typeof browser === "undefined" || !browser.runtime) {
      return;
    }

    void browser.runtime
      .sendMessage({ type: "switch-tab", direction })
      .catch(() => undefined);
  }

  function startMovement(movement: Movement): void {
    if (movementState?.key === movement.key && !movementState.keyReleased) {
      return;
    }

    stopMovement();
    const surface = findScrollSurface(movement, { requireCanMove: true });
    const now = performance.now();

    movementState = {
      ...movement,
      surface,
      startedAt: now,
      lastFrameAt: now,
      initialProgress: 0,
      keyReleased: false,
      frameId: 0,
    };
    movementState.frameId = window.requestAnimationFrame(tickMovement);
    triggerScrollIndicator(
      surface,
      movement.dx || movement.speedX,
      movement.dy || movement.speedY,
    );
  }

  function tickMovement(now: number): void {
    if (!movementState) {
      return;
    }

    const elapsed = now - movementState.startedAt;
    const nextInitialProgress = movementInitialProgress(elapsed);
    const initialProgressDelta =
      nextInitialProgress - movementState.initialProgress;
    if (initialProgressDelta > 0) {
      scrollSurfaceBy(movementState.surface, {
        left: movementState.dx * initialProgressDelta,
        top: movementState.dy * initialProgressDelta,
        behavior: "auto",
      });
      movementState.initialProgress = nextInitialProgress;
    }

    const continuousFrom = Math.max(
      movementState.lastFrameAt,
      movementState.startedAt + HOLD_DELAY_MS,
    );
    const deltaSeconds =
      !movementState.keyReleased && elapsed >= HOLD_DELAY_MS
        ? Math.max(0, now - continuousFrom) / 1000
        : 0;
    movementState.lastFrameAt = now;

    if (deltaSeconds > 0) {
      scrollSurfaceBy(movementState.surface, {
        left: movementState.speedX * deltaSeconds,
        top: movementState.speedY * deltaSeconds,
        behavior: "auto",
      });
    }

    if (movementState.keyReleased && movementState.initialProgress >= 1) {
      stopMovement();
      return;
    }

    movementState.frameId = window.requestAnimationFrame(tickMovement);
  }

  function movementInitialProgress(elapsedMs: number): number {
    const linearProgress = clamp(elapsedMs / HOLD_DELAY_MS, 0, 1);
    return 1 - (1 - linearProgress) ** 3;
  }

  function stopMovement(): void {
    if (!movementState) {
      return;
    }

    window.cancelAnimationFrame(movementState.frameId);
    movementState = null;
  }

  function pageSequenceActionForEvent(
    event: KeyboardEvent,
  ): PageSequenceAction | "pending" | null {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
      pendingPageSequence = null;
      return null;
    }

    const now = performance.now();
    const key: ShortcutSequenceKey = {
      key: event.key.toLowerCase(),
      shiftKey: event.shiftKey,
    };
    const candidates = pageSequenceCandidates();

    if (
      pendingPageSequence &&
      now - pendingPageSequence.startedAt < TOP_SEQUENCE_WINDOW_MS
    ) {
      const match = candidates.find(
        (candidate) =>
          pendingPageSequence &&
          shortcutSequenceKeyMatches(
            candidate.sequence[0],
            pendingPageSequence,
          ) &&
          shortcutSequenceKeyMatches(candidate.sequence[1], key),
      );
      pendingPageSequence = null;
      if (match) {
        return match.action;
      }
    }

    const startsSequence = candidates.some((candidate) =>
      shortcutSequenceKeyMatches(candidate.sequence[0], key),
    );
    if (!startsSequence) {
      pendingPageSequence = null;
      return null;
    }

    pendingPageSequence = { ...key, startedAt: now };
    window.setTimeout(() => {
      if (
        pendingPageSequence &&
        performance.now() - pendingPageSequence.startedAt >=
          TOP_SEQUENCE_WINDOW_MS
      ) {
        pendingPageSequence = null;
      }
    }, TOP_SEQUENCE_WINDOW_MS);
    return "pending";
  }

  function pageSequenceCandidates(): Array<{
    action: PageSequenceAction;
    sequence: ShortcutSequenceKey[];
  }> {
    const candidates: Array<{
      action: PageSequenceAction;
      sequence: ShortcutSequenceKey[] | null;
    }> = [
      {
        action: "top",
        sequence: settingsApi.shortcutKeySequence(
          extensionSettings.shortcuts.top,
        ),
      },
      {
        action: "edit-current-url-palette",
        sequence: settingsApi.shortcutKeySequence(
          extensionSettings.shortcuts.editCurrentUrlPalette,
        ),
      },
      {
        action: "edit-current-url-palette-new-tab",
        sequence: settingsApi.shortcutKeySequence(
          extensionSettings.shortcuts.editCurrentUrlPaletteNewTab,
        ),
      },
    ];

    return candidates.flatMap((candidate) =>
      candidate.sequence?.length === 2
        ? [{ action: candidate.action, sequence: candidate.sequence }]
        : [],
    );
  }

  function shortcutSequenceKeyMatches(
    expected: ShortcutSequenceKey,
    actual: ShortcutSequenceKey,
  ): boolean {
    return expected.key === actual.key && expected.shiftKey === actual.shiftKey;
  }

  function handlePageSequenceAction(
    action: PageSequenceAction | "pending",
  ): void {
    switch (action) {
      case "pending":
        return;
      case "top":
        scrollToTop();
        return;
      case "edit-current-url-palette":
        openCurrentUrlEditPalette("current-tab");
        return;
      case "edit-current-url-palette-new-tab":
        openCurrentUrlEditPalette("new-tab");
        return;
    }
  }

  function isUrlCopyCommand(event: KeyboardEvent): boolean {
    const sequence = settingsApi.shortcutSequence(
      extensionSettings.shortcuts.copyUrl,
    );
    const key = event.key.toLowerCase();
    return (
      !event.repeat &&
      sequence?.length === 2 &&
      (key === sequence[0] ||
        isPendingSequenceKey(
          lastYPressAt,
          key,
          sequence,
          URL_COPY_SEQUENCE_WINDOW_MS,
        ))
    );
  }

  function isUrlCopyCancelCommand(event: KeyboardEvent): boolean {
    return lastYPressAt !== 0 && event.key === "Escape";
  }

  function handleUrlCopyCommand(event: KeyboardEvent): void {
    const sequence = settingsApi.shortcutSequence(
      extensionSettings.shortcuts.copyUrl,
    );
    if (!sequence || sequence.length !== 2) {
      return;
    }

    const now = performance.now();
    const key = event.key.toLowerCase();
    if (
      isPendingSequenceKey(
        lastYPressAt,
        key,
        sequence,
        URL_COPY_SEQUENCE_WINDOW_MS,
      )
    ) {
      clearUrlCopySequence();
      void copyCurrentUrl();
      return;
    }

    if (key !== sequence[0]) {
      clearUrlCopySequence();
      return;
    }

    lastYPressAt = now;
    window.setTimeout(() => {
      if (performance.now() - lastYPressAt >= URL_COPY_SEQUENCE_WINDOW_MS) {
        clearUrlCopySequence();
      }
    }, URL_COPY_SEQUENCE_WINDOW_MS);
  }

  function clearUrlCopySequence(): void {
    lastYPressAt = 0;
  }

  function scrollToTop(): void {
    const surface = findScrollSurface(
      { key: "g", dx: 0, dy: -1, speedX: 0, speedY: 0 },
      { requireCanMove: false },
    );
    scrollToSurfacePosition(surface, {
      top: 0,
      left: currentScrollX(surface),
    });
    triggerScrollIndicator(surface, 0, -1);
  }

  function scrollToBottom(): void {
    const surface = findScrollSurface(
      { key: "G", dx: 0, dy: 1, speedX: 0, speedY: 0 },
      { requireCanMove: false },
    );
    scrollToSurfacePosition(surface, {
      top: maxScrollTop(surface),
      left: currentScrollX(surface),
    });
    triggerScrollIndicator(surface, 0, 1);
  }

  function isPendingSequenceKey(
    startedAt: number,
    key: string,
    sequence: string[],
    windowMs: number,
  ): boolean {
    return (
      startedAt !== 0 &&
      performance.now() - startedAt <= windowMs &&
      key === sequence[1]
    );
  }

  async function copyCurrentUrl(): Promise<void> {
    stopMovement();
    const didCopy = await writeTextToClipboard(location.href);
    showUrlCopyToast(didCopy ? "Copied URL" : "Could not copy URL");
  }

  async function writeTextToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall back to the selection-based copy path below.
      }
    }

    return copyTextWithTemporarySelection(text);
  }

  function copyTextWithTemporarySelection(text: string): boolean {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.documentElement.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }

  function showUrlCopyToast(message: string): void {
    document.getElementById("skne-url-copy-toast")?.remove();
    if (urlCopyToastTimer) {
      window.clearTimeout(urlCopyToastTimer);
    }

    const toast = document.createElement("div");
    toast.id = "skne-url-copy-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.right = "16px";
    toast.style.bottom = "16px";
    toast.style.zIndex = "2147483647";
    toast.style.padding = "6px 10px";
    toast.style.border = "1px solid rgba(255, 255, 255, 0.25)";
    toast.style.borderRadius = "6px";
    toast.style.background = "rgba(0, 0, 0, 0.86)";
    toast.style.color = "white";
    toast.style.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    toast.style.lineHeight = "1.3";
    toast.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.22)";
    document.documentElement.appendChild(toast);

    urlCopyToastTimer = window.setTimeout(() => {
      toast.remove();
      urlCopyToastTimer = 0;
    }, URL_COPY_TOAST_MS);
  }

  function isBottomCommand(event: KeyboardEvent): boolean {
    return settingsApi.isShortcutEvent(
      event,
      extensionSettings.shortcuts.bottom,
    );
  }

  function isHistoryBackCommand(event: KeyboardEvent): boolean {
    return settingsApi.isShortcutEvent(
      event,
      extensionSettings.shortcuts.historyBack,
    );
  }

  function isHistoryForwardCommand(event: KeyboardEvent): boolean {
    return settingsApi.isShortcutEvent(
      event,
      extensionSettings.shortcuts.historyForward,
    );
  }

  function isReloadCommand(event: KeyboardEvent): boolean {
    return settingsApi.isShortcutEvent(
      event,
      extensionSettings.shortcuts.reload,
    );
  }

  function commandPaletteOptionsForEvent(event: KeyboardEvent): {
    disposition: PaletteDisposition;
    generatedKinds: PaletteGeneratedKind[];
    hasImeRiskFromOpeningShortcut?: boolean;
    includeCommands: boolean;
    includeGenerated: boolean;
    initialQuery?: string;
    placeholder: string;
    sources: PaletteSource[];
  } | null {
    const hasImeRiskFromOpeningShortcut =
      commandPaletteOpeningShortcutHasImeRisk(event);

    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.commandPalette,
      )
    ) {
      return {
        disposition: "current-tab",
        generatedKinds: COMMAND_PALETTE_GENERATED_KINDS,
        hasImeRiskFromOpeningShortcut,
        includeCommands: true,
        includeGenerated: true,
        placeholder: "Search tabs, local destinations, commands, URLs",
        sources: ["tabs", "bookmarks", "history", "visits"],
      };
    }

    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.commandPaletteNewTab,
      )
    ) {
      return {
        disposition: "new-tab",
        generatedKinds: COMMAND_PALETTE_GENERATED_KINDS,
        hasImeRiskFromOpeningShortcut,
        includeCommands: true,
        includeGenerated: true,
        placeholder: "Open tabs, destinations, commands, URLs in new tab",
        sources: ["tabs", "bookmarks", "history", "visits"],
      };
    }

    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.bookmarkPalette,
      )
    ) {
      return {
        disposition: "current-tab",
        generatedKinds: [],
        hasImeRiskFromOpeningShortcut,
        includeCommands: false,
        includeGenerated: false,
        placeholder: "Search bookmarks when available",
        sources: ["bookmarks"],
      };
    }

    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.bookmarkPaletteNewTab,
      )
    ) {
      return {
        disposition: "new-tab",
        generatedKinds: [],
        hasImeRiskFromOpeningShortcut,
        includeCommands: false,
        includeGenerated: false,
        placeholder: "Open bookmark in new tab",
        sources: ["bookmarks"],
      };
    }

    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.historyPalette,
      )
    ) {
      return {
        disposition: "current-tab",
        generatedKinds: [],
        hasImeRiskFromOpeningShortcut,
        includeCommands: false,
        includeGenerated: false,
        placeholder: "Search history when available",
        sources: ["history"],
      };
    }

    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.historyPaletteNewTab,
      )
    ) {
      return {
        disposition: "new-tab",
        generatedKinds: [],
        hasImeRiskFromOpeningShortcut,
        includeCommands: false,
        includeGenerated: false,
        placeholder: "Open history in new tab when available",
        sources: ["history"],
      };
    }

    if (
      settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.tabPalette)
    ) {
      return {
        disposition: "current-tab",
        generatedKinds: [],
        hasImeRiskFromOpeningShortcut,
        includeCommands: false,
        includeGenerated: false,
        placeholder: "Search open tabs",
        sources: ["tabs"],
      };
    }

    return null;
  }

  function commandPaletteOpeningShortcutHasImeRisk(
    event: KeyboardEvent,
  ): boolean {
    return (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    );
  }

  function navigateHistory(direction: "back" | "forward"): void {
    stopMovement();
    if (direction === "back") {
      window.history.back();
      return;
    }

    window.history.forward();
  }

  function reloadPage(): void {
    stopMovement();
    location.reload();
  }

  function observeCurrentPageSoon(): void {
    window.setTimeout(observeCurrentPage, 250);
  }

  function observeSinglePageAppNavigations(): void {
    if (typeof history === "undefined") {
      return;
    }

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    try {
      history.pushState = function pushState(
        data: unknown,
        unused: string,
        url?: string | URL | null,
      ): void {
        originalPushState.call(this, data, unused, url);
        observeCurrentPageSoon();
      };

      history.replaceState = function replaceState(
        data: unknown,
        unused: string,
        url?: string | URL | null,
      ): void {
        originalReplaceState.call(this, data, unused, url);
        observeCurrentPageSoon();
      };
    } catch {
      return;
    }
  }

  function observeTitleChanges(): void {
    if (typeof MutationObserver === "undefined") {
      return;
    }

    const target = document.head || document.documentElement;
    if (!target) {
      return;
    }

    const observer = new MutationObserver(observeCurrentPageSoon);
    observer.observe(target, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  function observeCurrentPage(): void {
    if (typeof browser === "undefined" || !browser.runtime) {
      return;
    }

    if (!isSupportedWebPage()) {
      return;
    }

    const key = `${location.href}\n${document.title}`;
    if (key === lastObservedPageKey) {
      return;
    }

    lastObservedPageKey = key;
    void browser.runtime
      .sendMessage({
        type: "observe-page",
        title: document.title,
        url: location.href,
      })
      .catch(() => undefined);
  }

  function scrollToSurfacePosition(
    surface: ScrollSurface,
    position: HintPosition,
  ): void {
    stopMovement();
    scrollSurfaceTo(surface, { ...position, behavior: "auto" });
  }

  function findScrollSurface(
    movement: Movement,
    options: { requireCanMove: boolean },
  ): ScrollSurface {
    const axis = movementAxis(movement);
    const collection = collectScrollSurfaceCandidates(axis, movement);
    const selectedId = scroll.chooseScrollSurface(
      collection.candidates,
      options,
    );
    return collection.surfaces.get(selectedId) ?? window;
  }

  function movementAxis(movement: Movement): ScrollAxis {
    return Math.abs(movement.dx) > Math.abs(movement.dy) ? "x" : "y";
  }

  function elementsFromViewportProbePoints(): Element[] {
    const points: HintPosition[] = [
      { left: window.innerWidth * 0.5, top: window.innerHeight * 0.5 },
      { left: window.innerWidth * 0.5, top: window.innerHeight * 0.35 },
      { left: window.innerWidth * 0.5, top: window.innerHeight * 0.65 },
      { left: window.innerWidth * 0.65, top: window.innerHeight * 0.5 },
    ];
    const elements: Element[] = [];
    const seen = new Set<Element>();

    for (const point of points) {
      const element = elementFromPointIncludingShadows(point.left, point.top);
      if (element && !seen.has(element)) {
        seen.add(element);
        elements.push(element);
      }
    }

    return elements;
  }

  function collectScrollSurfaceCandidates(
    axis: ScrollAxis,
    movement: Movement,
  ): ScrollSurfaceCollection {
    const candidates: ScrollSurfaceCandidate[] = [];
    const surfaces = new Map<string, ScrollSurface>();
    const elementIds = new WeakMap<Element, string>();

    surfaces.set(scroll.WINDOW_SURFACE_ID, window);

    for (const element of elementsFromViewportProbePoints()) {
      let current: Element | null = element;
      while (current && current !== document.documentElement) {
        if (current !== document.documentElement) {
          addElementCandidate(
            candidates,
            surfaces,
            elementIds,
            current,
            "probe",
            axis,
            movement,
          );
        }
        const pNode: Node | null = current.parentNode;
        if (pNode instanceof ShadowRoot) {
          current = pNode.host;
        } else if (pNode instanceof Element) {
          current = pNode;
        } else {
          current = null;
        }
      }
    }

    candidates.push(windowScrollCandidate(axis, movement));

    for (const element of querySelectorAllIncludingShadows("*")) {
      if (element === document.documentElement) {
        continue;
      }

      addElementCandidate(
        candidates,
        surfaces,
        elementIds,
        element,
        "visible",
        axis,
        movement,
      );
    }

    return { candidates, surfaces };
  }

  function addElementCandidate(
    candidates: ScrollSurfaceCandidate[],
    surfaces: Map<string, ScrollSurface>,
    elementIds: WeakMap<Element, string>,
    element: Element,
    kind: ScrollSurfaceCandidate["kind"],
    axis: ScrollAxis,
    movement: Movement,
  ): void {
    const id = surfaceIdForElement(element, elementIds, surfaces);
    const candidate = elementScrollCandidate(id, element, kind, axis, movement);
    if (!candidate.canScroll) {
      return;
    }

    surfaces.set(candidate.id, element);
    candidates.push(candidate);
  }

  function surfaceIdForElement(
    element: Element,
    elementIds: WeakMap<Element, string>,
    surfaces: Map<string, ScrollSurface>,
  ): string {
    const existingId = elementIds.get(element);
    if (existingId) {
      return existingId;
    }

    const id = `element:${surfaces.size}`;
    elementIds.set(element, id);
    return id;
  }

  function viewportIntersectionArea(element: Element): number {
    const rect = element.getBoundingClientRect();
    const width = Math.max(
      0,
      Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0),
    );
    const height = Math.max(
      0,
      Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
    );
    return width * height;
  }

  function elementScrollCandidate(
    id: string,
    element: Element,
    kind: ScrollSurfaceCandidate["kind"],
    axis: ScrollAxis,
    movement: Movement,
  ): ScrollSurfaceCandidate {
    const style = getComputedStyle(element);
    const overflow = axis === "y" ? style.overflowY : style.overflowX;
    const scrollPosition =
      axis === "y" ? element.scrollTop : element.scrollLeft;
    const maxScroll = maxElementScroll(element, axis);
    const direction = axis === "y" ? movement.dy : movement.dx;
    const canScroll = scroll.isScrollableOverflow(overflow) && maxScroll > 1;

    return {
      id,
      kind,
      canScroll,
      canMove:
        canScroll &&
        scroll.canMoveScrollPosition(scrollPosition, maxScroll, direction),
      visibleArea: kind === "visible" ? viewportIntersectionArea(element) : 0,
    };
  }

  function windowScrollCandidate(
    axis: ScrollAxis,
    movement: Movement,
  ): ScrollSurfaceCandidate {
    const maxScroll =
      axis === "y"
        ? documentHeight() - window.innerHeight
        : documentWidth() - window.innerWidth;
    const scrollPosition =
      axis === "y" ? currentScrollY(window) : currentScrollX(window);
    const direction = axis === "y" ? movement.dy : movement.dx;

    return {
      id: scroll.WINDOW_SURFACE_ID,
      kind: "window",
      canScroll: maxScroll > 1,
      canMove: scroll.canMoveScrollPosition(
        scrollPosition,
        maxScroll,
        direction,
      ),
      visibleArea: window.innerWidth * window.innerHeight,
    };
  }

  function scrollSurfaceBy(
    surface: ScrollSurface,
    options: ScrollToOptions,
  ): void {
    if (isWindowSurface(surface)) {
      window.scrollBy(options);
      return;
    }

    surface.scrollBy(options);
  }

  function scrollSurfaceTo(
    surface: ScrollSurface,
    options: ScrollToOptions,
  ): void {
    if (isWindowSurface(surface)) {
      window.scrollTo(options);
      return;
    }

    surface.scrollTo(options);
  }

  function triggerScrollIndicator(
    surface: ScrollSurface,
    dx: number,
    dy: number,
  ): void {
    if (dx === 0 && dy === 0) {
      return;
    }

    let rect: DOMRect;
    if (isWindowSurface(surface)) {
      rect = new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    } else {
      rect = surface.getBoundingClientRect();
    }

    let dir = "";
    if (Math.abs(dy) >= Math.abs(dx)) {
      dir = dy > 0 ? "down" : "up";
    } else {
      dir = dx > 0 ? "right" : "left";
    }

    const indicator = document.createElement("div");
    indicator.className = `skne-scroll-indicator skne-scroll-${dir}`;
    indicator.style.position = "fixed";

    if (isWindowSurface(surface)) {
      if (dir === "down") {
        indicator.style.bottom = "0";
        indicator.style.left = "0";
        indicator.style.width = "100%";
        indicator.style.height = "5px";
      } else if (dir === "up") {
        indicator.style.top = "0";
        indicator.style.left = "0";
        indicator.style.width = "100%";
        indicator.style.height = "5px";
      } else if (dir === "right") {
        indicator.style.right = "0";
        indicator.style.top = "0";
        indicator.style.height = "100%";
        indicator.style.width = "5px";
      } else if (dir === "left") {
        indicator.style.left = "0";
        indicator.style.top = "0";
        indicator.style.height = "100%";
        indicator.style.width = "5px";
      }
    } else {
      indicator.style.left = `${rect.left}px`;
      indicator.style.top = `${rect.top}px`;
      if (dir === "down") {
        indicator.style.top = `${rect.bottom - 5}px`;
        indicator.style.width = `${rect.width}px`;
        indicator.style.height = "5px";
      } else if (dir === "up") {
        indicator.style.width = `${rect.width}px`;
        indicator.style.height = "5px";
      } else if (dir === "right") {
        indicator.style.left = `${rect.right - 5}px`;
        indicator.style.height = `${rect.height}px`;
        indicator.style.width = "5px";
      } else if (dir === "left") {
        indicator.style.height = `${rect.height}px`;
        indicator.style.width = "5px";
      }
    }
    indicator.style.zIndex = "2147483646";
    indicator.style.pointerEvents = "none";

    const overlay =
      document.getElementById("skne-hint-overlay") || document.body;
    if (overlay) {
      overlay.appendChild(indicator);
      setTimeout(() => {
        indicator.remove();
      }, 350);
    }
  }

  function maxElementScroll(element: Element, axis: ScrollAxis): number {
    return axis === "y"
      ? scroll.maxScroll(element.scrollHeight, element.clientHeight)
      : scroll.maxScroll(element.scrollWidth, element.clientWidth);
  }

  function maxScrollTop(surface: ScrollSurface): number {
    return isWindowSurface(surface)
      ? Math.max(0, documentHeight() - window.innerHeight)
      : maxElementScroll(surface, "y");
  }

  function surfaceClientHeight(surface: ScrollSurface): number {
    return isWindowSurface(surface) ? window.innerHeight : surface.clientHeight;
  }

  function documentHeight(): number {
    const body = document.body;
    const element = document.documentElement;
    return Math.max(
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      element ? element.clientHeight : 0,
      element ? element.scrollHeight : 0,
      element ? element.offsetHeight : 0,
    );
  }

  function documentWidth(): number {
    const body = document.body;
    const element = document.documentElement;
    return Math.max(
      body ? body.scrollWidth : 0,
      body ? body.offsetWidth : 0,
      element ? element.clientWidth : 0,
      element ? element.scrollWidth : 0,
      element ? element.offsetWidth : 0,
    );
  }

  function currentScrollX(surface: ScrollSurface): number {
    return isWindowSurface(surface)
      ? window.scrollX || window.pageXOffset || 0
      : surface.scrollLeft;
  }

  function currentScrollY(surface: ScrollSurface): number {
    return isWindowSurface(surface)
      ? window.scrollY || window.pageYOffset || 0
      : surface.scrollTop;
  }

  function isWindowSurface(surface: ScrollSurface): surface is Window {
    return surface === window;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function querySelectorAllIncludingShadows<T extends Element = Element>(
    selector: string,
    root: ParentNode = document,
  ): T[] {
    const results: T[] = Array.from(root.querySelectorAll<T>(selector));
    const walkers = root.querySelectorAll("*");
    for (let i = 0; i < walkers.length; i++) {
      const el = walkers[i];
      if (el.shadowRoot) {
        results.push(
          ...querySelectorAllIncludingShadows<T>(selector, el.shadowRoot),
        );
      }
    }
    return results;
  }

  function querySelectorIncludingShadows(
    selector: string,
    root: ParentNode,
  ): Element | null {
    const found = root.querySelector(selector);
    if (found) {
      return found;
    }
    const children = root.querySelectorAll("*");
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      if (el.shadowRoot) {
        const innerFound = querySelectorIncludingShadows(
          selector,
          el.shadowRoot,
        );
        if (innerFound) {
          return innerFound;
        }
      }
    }
    return null;
  }

  function closestIncludingShadows(
    selector: string,
    element: Element,
  ): Element | null {
    let current: Element | null = element;
    while (current) {
      if (current.matches(selector)) {
        return current;
      }
      const pNode: Node | null = current.parentNode;
      if (pNode instanceof ShadowRoot) {
        current = pNode.host;
      } else if (pNode instanceof Element) {
        current = pNode;
      } else {
        current = null;
      }
    }
    return null;
  }

  function containsIncludingShadows(parent: Node, child: Node): boolean {
    let current: Node | null = child;
    while (current) {
      if (current === parent) {
        return true;
      }
      const pNode: Node | null = current.parentNode;
      if (pNode instanceof ShadowRoot) {
        current = pNode.host;
      } else {
        current = pNode;
      }
    }
    return false;
  }

  function elementFromPointIncludingShadows(
    x: number,
    y: number,
  ): Element | null {
    let element = document.elementFromPoint(x, y);
    while (element?.shadowRoot) {
      const inner = element.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === element) {
        break;
      }
      element = inner;
    }
    return element;
  }
})();
