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

  interface SemanticActionTarget extends HintTargetBase {
    kind: "semantic-action";
    element: HTMLElement;
  }

  type HintTarget = LinkTarget | FormControlTarget | SemanticActionTarget;
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

  if (!maybeHints || !maybeHelp || !maybeScroll) {
    return;
  }

  const hints: SafariKeyboardNavigationHints = maybeHints;
  const help: SafariKeyboardNavigationHelp = maybeHelp;
  const scroll: SafariKeyboardNavigationScroll = maybeScroll;

  const HINT_TRIGGER = "f";
  const NEW_TAB_HINT_TRIGGER_CODE = "KeyF";
  const HELP_OVERLAY_ID = "skne-help-overlay";
  const NATIVE_HINT_TARGET_SELECTOR =
    "a[href], button, input, select, textarea";
  const SEMANTIC_ACTION_TARGET_SELECTOR =
    '[role="button"], [role="link"], [role="tab"]';
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

  let hintState: HintState | null = null;
  let helpState: HelpState | null = null;
  let lastGPressAt = 0;
  let lastYPressAt = 0;
  let urlCopyToastTimer = 0;
  let movementState: MovementState | null = null;

  window.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("blur", stopMovement, true);
  window.addEventListener("pagehide", closeHelpOverlay, true);
  window.addEventListener("pagehide", stopMovement, true);

  function handleKeyDown(event: KeyboardEvent): void {
    if (hintState) {
      handleHintKeyDown(event);
      return;
    }

    if (helpState) {
      handleHelpKeyDown(event);
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
      handleUrlCopyCommand();
      return;
    }

    clearUrlCopySequence();

    if (help.isHelpCommandEvent(event)) {
      event.preventDefault();
      event.stopPropagation();
      showHelpOverlay();
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
      handleTopCommand();
      return;
    }

    if (isBottomCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      const surface = findScrollSurface(
        { key: "G", dx: 0, dy: 1, speedX: 0, speedY: 0 },
        { requireCanMove: false },
      );
      scrollToSurfacePosition(surface, {
        top: maxScrollTop(surface),
        left: currentScrollX(surface),
      });
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
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return null;
    }

    if (!event.shiftKey && event.key === HINT_TRIGGER) {
      return "current-tab";
    }

    if (event.shiftKey && event.code === NEW_TAB_HINT_TRIGGER_CODE) {
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
    return (
      (location.protocol === "http:" || location.protocol === "https:") &&
      !isPdfDocument()
    );
  }

  function isMovementSurface(): boolean {
    return isSupportedWebPage() || isSupportedPdf();
  }

  function isSupportedPdf(): boolean {
    return (
      isPdfDocument() &&
      (location.protocol === "http:" ||
        location.protocol === "https:" ||
        location.protocol === "file:")
    );
  }

  function isPdfDocument(): boolean {
    return (
      document.contentType === "application/pdf" ||
      /\.pdf(?:[?#]|$)/i.test(location.href)
    );
  }

  function startHintMode(activationMode: HintActivationMode): void {
    const targets = collectHintTargets(activationMode);
    if (targets.length === 0) {
      return;
    }

    const hintValues = hints.generateHints(targets.length);
    if (hints.hasPrefixCollision(hintValues)) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "skne-hint-overlay";

    const entries = targets.map((target, index): HintEntry => {
      const hint = hintValues[index];
      const label = document.createElement("span");
      label.className = "skne-hint";
      label.textContent = hint;
      label.dataset.hint = hint;
      label.style.left = `${Math.round(target.rect.left)}px`;
      label.style.top = `${Math.round(target.rect.top)}px`;
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
      entry.label.dataset.hidden = entry.hint.startsWith(nextInput)
        ? "false"
        : "true";
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
      return;
    }

    hintState.overlay.remove();
    hintState = null;
    window.removeEventListener("scroll", cancelHintMode, true);
    window.removeEventListener("resize", cancelHintMode, true);
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

  function collectHintTargets(
    activationMode: HintActivationMode,
  ): HintTarget[] {
    const targets: HintTarget[] = [];
    collectLinkTargetsInto(targets, activationMode);
    if (activationMode === "current-tab") {
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
    if (element.disabled || !isVisibleElement(element)) {
      return false;
    }

    if (element instanceof HTMLInputElement) {
      return element.type.toLowerCase() !== "hidden";
    }

    return true;
  }

  function isVisibleSemanticActionTarget(element: HTMLElement): boolean {
    if (!isVisibleElement(element) || isNativeHintTarget(element)) {
      return false;
    }

    if (element.getAttribute("aria-disabled") === "true") {
      return false;
    }

    return true;
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

  function visibleRectForElement(element: Element): HintPosition | null {
    return firstVisibleRect(element.getClientRects());
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

  function intersectsViewport(rect: DOMRect): boolean {
    return (
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.top < window.innerHeight
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

    if (target.kind === "semantic-action") {
      activateSemanticActionTarget(target.element);
      return;
    }

    activateFormControlTarget(target.element);
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
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return null;
    }

    switch (event.key) {
      case "h":
        return {
          key: "h",
          dx: -HORIZONTAL_STEP_PX,
          dy: 0,
          speedX: -HORIZONTAL_HOLD_SPEED_PX_PER_SECOND,
          speedY: 0,
        };
      case "j":
        return {
          key: "j",
          dx: 0,
          dy: VERTICAL_STEP_PX,
          speedX: 0,
          speedY: VERTICAL_HOLD_SPEED_PX_PER_SECOND,
        };
      case "k":
        return {
          key: "k",
          dx: 0,
          dy: -VERTICAL_STEP_PX,
          speedX: 0,
          speedY: -VERTICAL_HOLD_SPEED_PX_PER_SECOND,
        };
      case "l":
        return {
          key: "l",
          dx: HORIZONTAL_STEP_PX,
          dy: 0,
          speedX: HORIZONTAL_HOLD_SPEED_PX_PER_SECOND,
          speedY: 0,
        };
      default:
        return null;
    }
  }

  function halfPageDirectionForEvent(event: KeyboardEvent): -1 | 1 | null {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return null;
    }

    switch (event.key) {
      case "d":
        return 1;
      case "u":
        return -1;
      default:
        return null;
    }
  }

  function tabSwitchDirectionForEvent(
    event: KeyboardEvent,
  ): TabSwitchDirection | null {
    if (
      event.repeat ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !event.shiftKey
    ) {
      return null;
    }

    switch (event.code) {
      case "KeyJ":
        return "previous";
      case "KeyK":
        return "next";
      default:
        return null;
    }
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
    return (
      !event.repeat &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      event.key === "g"
    );
  }

  function handleTopCommand(): void {
    const now = performance.now();
    if (now - lastGPressAt <= TOP_SEQUENCE_WINDOW_MS) {
      lastGPressAt = 0;
      const surface = findScrollSurface(
        { key: "g", dx: 0, dy: -1, speedX: 0, speedY: 0 },
        { requireCanMove: false },
      );
      scrollToSurfacePosition(surface, {
        top: 0,
        left: currentScrollX(surface),
      });
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
    return (
      !event.repeat &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      event.key === "y"
    );
  }

  function isUrlCopyCancelCommand(event: KeyboardEvent): boolean {
    return lastYPressAt !== 0 && event.key === "Escape";
  }

  function handleUrlCopyCommand(): void {
    const now = performance.now();
    if (now - lastYPressAt <= URL_COPY_SEQUENCE_WINDOW_MS) {
      clearUrlCopySequence();
      void copyCurrentUrl();
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
    return (
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      event.shiftKey &&
      event.code === "KeyG"
    );
  }

  function isHistoryBackCommand(event: KeyboardEvent): boolean {
    return isShiftLetterCommand(event, "KeyH");
  }

  function isHistoryForwardCommand(event: KeyboardEvent): boolean {
    return isShiftLetterCommand(event, "KeyL");
  }

  function isReloadCommand(event: KeyboardEvent): boolean {
    return (
      !event.repeat &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      event.key === "r"
    );
  }

  function isShiftLetterCommand(
    event: KeyboardEvent,
    code: KeyboardEvent["code"],
  ): boolean {
    return (
      !event.repeat &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      event.shiftKey &&
      event.code === code
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
