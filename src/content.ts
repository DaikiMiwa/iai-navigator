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
    | "scroll-top"
    | "scroll-bottom"
    | "reload"
    | "open-settings";

  interface LocalPaletteCommand {
    id: LocalPaletteCommandId;
    title: string;
    subtitle: string;
  }

  interface LocalPaletteResult {
    id: string;
    kind: "command";
    command: LocalPaletteCommandId;
    title: string;
    subtitle: string;
    score: number;
  }

  type BrowserPaletteResult = PaletteResult;
  type CommandPaletteResult = BrowserPaletteResult | LocalPaletteResult;

  interface CommandPaletteState {
    activeIndex: number;
    disposition: PaletteDisposition;
    generatedKinds: PaletteGeneratedKind[];
    includeCommands: boolean;
    includeGenerated: boolean;
    input: HTMLInputElement;
    list: HTMLDivElement;
    overlay: HTMLDivElement;
    results: CommandPaletteResult[];
    searchId: number;
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
  const MEDIA_CONTROLS_REVEALED_CLASS = "skne-media-controls-revealed";
  const NATIVE_HINT_TARGET_SELECTOR =
    "a[href], button, input, select, textarea";
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
  const LOCAL_PALETTE_COMMANDS: LocalPaletteCommand[] = [
    {
      id: "show-hints",
      title: "Show hints",
      subtitle: "Open link and control hints in the current tab",
    },
    {
      id: "show-new-tab-hints",
      title: "Show hints in new tab",
      subtitle: "Open link hints for foreground tabs",
    },
    {
      id: "copy-url",
      title: "Copy current URL",
      subtitle: "Copy this page address to the clipboard",
    },
    {
      id: "scroll-top",
      title: "Scroll to top",
      subtitle: "Jump to the top of the current scroll area",
    },
    {
      id: "scroll-bottom",
      title: "Scroll to bottom",
      subtitle: "Jump to the bottom of the current scroll area",
    },
    {
      id: "reload",
      title: "Reload page",
      subtitle: "Reload the current page",
    },
    {
      id: "open-settings",
      title: "Open settings",
      subtitle: "Configure shortcuts, sites, and hint appearance",
    },
  ];
  const COMMAND_PALETTE_FOOTER_HINTS = [
    "Enter open",
    "Shift+Enter new tab",
    "Option+Enter background",
    "tab: book: history: visit: search: url: cmd:",
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
    commandPaletteHighlightRanges,
    commandPaletteKeyAction,
    commandPaletteQueryScope,
  };

  let hintState: HintState | null = null;
  let helpState: HelpState | null = null;
  let commandPaletteState: CommandPaletteState | null = null;
  let lastGPressAt = 0;
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

    if (isTopCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      handleTopCommand(event);
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
    return (
      protocol === "http:" || protocol === "https:" || protocol === "file:"
    );
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

    const hintValues = hints.generateHints(targets.length);
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
    hintState = {
      activationMode,
      entries,
      input: "",
      overlay,
    };

    window.addEventListener("scroll", cancelHintMode, true);
    window.addEventListener("resize", cancelHintMode, true);
  }

  function applyHintStyleSettings(
    root: HTMLElement = document.documentElement,
  ): void {
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
    if (!hints.DEFAULT_HINT_KEYS.includes(key)) {
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
    includeCommands: boolean;
    includeGenerated: boolean;
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
      includeCommands: options.includeCommands,
      includeGenerated: options.includeGenerated,
      input,
      list,
      overlay,
      results: [],
      searchId: 0,
      sources: options.sources,
    };

    input.addEventListener("input", () => {
      void refreshCommandPaletteResults();
    });
    input.focus();
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
    if (!commandPaletteState) {
      return;
    }

    const action = commandPaletteKeyAction(event);
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
    if (candidate.key === "Escape") {
      return "close";
    }

    if (
      candidate.key === "ArrowDown" ||
      (candidate.ctrlKey && candidate.key.toLowerCase() === "n") ||
      (candidate.key === "Tab" && !candidate.shiftKey)
    ) {
      return "next";
    }

    if (
      candidate.key === "ArrowUp" ||
      (candidate.ctrlKey && candidate.key.toLowerCase() === "p") ||
      (candidate.key === "Tab" && candidate.shiftKey)
    ) {
      return "previous";
    }

    if (candidate.key === "Enter") {
      if (candidate.altKey) {
        return "activate-background-tab";
      }

      return candidate.shiftKey || candidate.metaKey || candidate.ctrlKey
        ? "activate-new-tab"
        : "activate-current-tab";
    }

    return null;
  }

  function handleCommandPaletteKeyAction(
    action: CommandPaletteKeyAction,
  ): void {
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
      case "activate-current-tab":
        activateCommandPaletteSelection();
        return;
      case "activate-new-tab":
        activateCommandPaletteSelection("new-tab");
        return;
      case "activate-background-tab":
        activateCommandPaletteSelection("background-tab");
        return;
    }
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
      Promise.resolve(
        scope.includeCommands ? searchLocalPaletteCommands(scope.query) : [],
      ),
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
        sources: scope.sources,
      })) as Partial<PaletteSearchResponse> | undefined;
      return Array.isArray(response?.results) ? response.results : [];
    } catch {
      return [];
    }
  }

  function searchLocalPaletteCommands(query: string): LocalPaletteResult[] {
    const normalizedQuery = query.trim().toLowerCase();
    return LOCAL_PALETTE_COMMANDS.flatMap((command) => {
      const score = localPaletteCommandScore(command, normalizedQuery);
      if (score === null) {
        return [];
      }

      return [
        {
          command: command.id,
          id: `command:${command.id}`,
          kind: "command",
          score: score + 30,
          subtitle: command.subtitle,
          title: command.title,
        },
      ];
    });
  }

  function localPaletteCommandScore(
    command: LocalPaletteCommand,
    query: string,
  ): number | null {
    if (!query) {
      return 1;
    }

    const haystack = `${command.title} ${command.subtitle}`.toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.every((term) => haystack.includes(term))) {
      return null;
    }

    const title = command.title.toLowerCase();
    return terms.reduce((score, term) => {
      if (title.startsWith(term)) {
        return score + 60;
      }
      if (title.includes(term)) {
        return score + 40;
      }
      return score + 20;
    }, 0);
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

    return {
      generatedKinds: sources.generatedKinds,
      includeCommands: sources.includeCommands,
      includeGenerated: sources.generatedKinds.length > 0,
      query: match[2],
      sources: sources.sources,
    };
  }

  function paletteSourcesForPrefix(
    prefix: string,
  ): Pick<
    CommandPaletteQueryScope,
    "generatedKinds" | "includeCommands" | "sources"
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
        return {
          generatedKinds: [],
          includeCommands: false,
          sources: ["history"],
        };
      case "visit":
      case "visits":
        return {
          generatedKinds: [],
          includeCommands: false,
          sources: ["visits"],
        };
      case "url":
      case "open":
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
      case "cmd":
      case "command":
      case "commands":
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
    closeCommandPalette();
    if (result.kind === "command") {
      if (disposition === "background-tab") {
        return;
      }

      executeLocalPaletteCommand(result.command);
      return;
    }

    void executeBrowserPaletteResult(result, disposition);
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
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
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
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
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
    for (const element of document.querySelectorAll<FormControlTargetElement>(
      "button, input, select, textarea",
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
    for (const element of document.querySelectorAll<HTMLElement>(
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
    for (const surface of document.querySelectorAll<HTMLElement>(
      MEDIA_CONTROL_SURFACE_SELECTOR,
    )) {
      if (!isVisibleElementWithAncestors(surface)) {
        continue;
      }

      for (const element of surface.querySelectorAll<HTMLElement>(
        MEDIA_CONTROL_TARGET_SELECTOR,
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
    for (const element of document.querySelectorAll<HTMLElement>(
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
    for (const element of document.querySelectorAll<HTMLElement>(
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
    for (const surface of document.querySelectorAll<HTMLElement>(
      MEDIA_CONTROL_SURFACE_SELECTOR,
    )) {
      if (!isVisibleElementWithAncestors(surface)) {
        continue;
      }

      for (const element of surface.querySelectorAll<HTMLElement>(
        MEDIA_CONTROL_TARGET_SELECTOR,
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
    for (const element of document.querySelectorAll<HTMLElement>(
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
        element.closest("form") !== null &&
        element.type === "submit",
      isInNavigationContext:
        element.closest(
          'nav, header, [role="navigation"], [role="menubar"], [role="menu"]',
        ) !== null,
      isLink: element.matches("a[href]") || element.closest("a[href]") !== null,
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
        element.closest(MEDIA_CONTROL_SURFACE_SELECTOR) !== null,
      isLink: element.matches("a[href]") || element.closest("a[href]") !== null,
      isNativeControl:
        tagName === "button" ||
        tagName === "input" ||
        tagName === "select" ||
        tagName === "textarea",
      isYouTubeButton:
        element.classList.contains("ytp-button") ||
        element.closest(".ytp-button") !== null,
      role,
      tagName,
    };
  }

  function mediaControlTargetElement(
    element: HTMLElement,
    surface: HTMLElement,
  ): HTMLElement {
    const youtubeButton = element.closest<HTMLElement>(".ytp-button");
    if (youtubeButton && surface.contains(youtubeButton)) {
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
      element.closest(NATIVE_HINT_TARGET_SELECTOR) !== null ||
      element.querySelector(NATIVE_HINT_TARGET_SELECTOR) !== null
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

      current = current.parentElement;
    }

    return isVisibleElement(element);
  }

  function visibleRectForElement(element: Element): HintPosition | null {
    return firstVisibleRect(element.getClientRects());
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

  function activateHintTarget(
    target: HintTarget,
    activationMode: HintActivationMode,
  ): void {
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

  function isTopCommand(event: KeyboardEvent): boolean {
    const sequence = settingsApi.shortcutSequence(
      extensionSettings.shortcuts.top,
    );
    const key = event.key.toLowerCase();
    return (
      !event.repeat &&
      sequence?.length === 2 &&
      (key === sequence[0] ||
        isPendingSequenceKey(
          lastGPressAt,
          key,
          sequence,
          TOP_SEQUENCE_WINDOW_MS,
        ))
    );
  }

  function handleTopCommand(event: KeyboardEvent): void {
    const sequence = settingsApi.shortcutSequence(
      extensionSettings.shortcuts.top,
    );
    if (!sequence || sequence.length !== 2) {
      return;
    }

    const now = performance.now();
    const key = event.key.toLowerCase();
    if (
      isPendingSequenceKey(lastGPressAt, key, sequence, TOP_SEQUENCE_WINDOW_MS)
    ) {
      lastGPressAt = 0;
      scrollToTop();
      return;
    }

    if (key !== sequence[0]) {
      lastGPressAt = 0;
      return;
    }

    lastGPressAt = now;
    window.setTimeout(() => {
      if (performance.now() - lastGPressAt >= TOP_SEQUENCE_WINDOW_MS) {
        lastGPressAt = 0;
      }
    }, TOP_SEQUENCE_WINDOW_MS);
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
    includeCommands: boolean;
    includeGenerated: boolean;
    placeholder: string;
    sources: PaletteSource[];
  } | null {
    if (
      settingsApi.isShortcutEvent(
        event,
        extensionSettings.shortcuts.commandPalette,
      )
    ) {
      return {
        disposition: "current-tab",
        generatedKinds: COMMAND_PALETTE_GENERATED_KINDS,
        includeCommands: true,
        includeGenerated: true,
        placeholder: "Search tabs, bookmarks, history, commands, URLs",
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
        includeCommands: true,
        includeGenerated: true,
        placeholder: "Open tabs, bookmarks, history, commands, URLs in new tab",
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
        includeCommands: false,
        includeGenerated: false,
        placeholder: "Search bookmarks",
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
        includeCommands: false,
        includeGenerated: false,
        placeholder: "Open bookmark in new tab",
        sources: ["bookmarks"],
      };
    }

    if (
      settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.tabPalette)
    ) {
      return {
        disposition: "current-tab",
        generatedKinds: [],
        includeCommands: false,
        includeGenerated: false,
        placeholder: "Search open tabs",
        sources: ["tabs"],
      };
    }

    return null;
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
      const element = document.elementFromPoint(point.left, point.top);
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
        current = current.parentElement;
      }
    }

    candidates.push(windowScrollCandidate(axis, movement));

    for (const element of document.querySelectorAll("*")) {
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
})();
