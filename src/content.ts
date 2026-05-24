(() => {
  interface HintPosition {
    left: number;
    top: number;
  }

  interface LinkTarget {
    element: HTMLAnchorElement;
    rect: HintPosition;
  }

  interface HintEntry {
    element: HTMLAnchorElement;
    hint: string;
    label: HTMLSpanElement;
  }

  interface HintState {
    entries: HintEntry[];
    input: string;
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
    startedAt: number;
    lastFrameAt: number;
    frameId: number;
  }

  const maybeHints = (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationHints?: SafariKeyboardNavigationHints;
    }
  ).SafariKeyboardNavigationHints;

  if (!maybeHints) {
    return;
  }

  const hints: SafariKeyboardNavigationHints = maybeHints;

  const HINT_TRIGGER = "f";
  const TOP_SEQUENCE_WINDOW_MS = 800;
  const HOLD_DELAY_MS = 140;
  const VERTICAL_STEP_PX = 72;
  const HORIZONTAL_STEP_PX = 84;
  const VERTICAL_HOLD_SPEED_PX_PER_SECOND = 720;
  const HORIZONTAL_HOLD_SPEED_PX_PER_SECOND = 720;

  let hintState: HintState | null = null;
  let lastGPressAt = 0;
  let movementState: MovementState | null = null;

  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("blur", stopMovement, true);
  window.addEventListener("pagehide", stopMovement, true);

  function handleKeyDown(event: KeyboardEvent): void {
    if (hintState) {
      handleHintKeyDown(event);
      return;
    }

    if (shouldIgnoreKeyboardCommand(event)) {
      return;
    }

    if (!event.repeat && isHintTrigger(event) && isSupportedWebPage()) {
      event.preventDefault();
      event.stopPropagation();
      startHintMode();
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

    if (isTopCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      handleTopCommand();
      return;
    }

    if (isBottomCommand(event)) {
      event.preventDefault();
      event.stopPropagation();
      scrollToPosition({ top: documentHeight(), left: currentScrollX() });
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (!movementState || event.key.toLowerCase() !== movementState.key) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    stopMovement();
  }

  function isHintTrigger(event: KeyboardEvent): boolean {
    return (
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      event.key === HINT_TRIGGER
    );
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

  function startHintMode(): void {
    const targets = collectLinkTargets();
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
        element: target.element,
        hint,
        label,
      };
    });

    document.documentElement.appendChild(overlay);
    hintState = {
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
      activateLinkTarget(exactMatch.element);
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

  function collectLinkTargets(): LinkTarget[] {
    const seen = new Set<HTMLAnchorElement>();
    const targets: LinkTarget[] = [];
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
      "a[href]",
    )) {
      if (seen.has(link) || !isVisibleLink(link)) {
        continue;
      }

      const rect = visibleRectForElement(link);
      if (!rect) {
        continue;
      }

      seen.add(link);
      targets.push({ element: link, rect });
    }

    targets.sort((a, b) => {
      if (a.rect.top !== b.rect.top) {
        return a.rect.top - b.rect.top;
      }
      return a.rect.left - b.rect.left;
    });

    return targets;
  }

  function isVisibleLink(link: HTMLAnchorElement): boolean {
    if (link.hidden || link.getAttribute("aria-hidden") === "true") {
      return false;
    }

    const style = getComputedStyle(link);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.visibility !== "collapse" &&
      style.opacity !== "0"
    );
  }

  function visibleRectForElement(element: Element): HintPosition | null {
    for (const rect of element.getClientRects()) {
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

  function activateLinkTarget(element: HTMLAnchorElement): void {
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

  function startMovement(movement: Movement): void {
    if (movementState && movementState.key === movement.key) {
      return;
    }

    stopMovement();
    window.scrollBy({ left: movement.dx, top: movement.dy, behavior: "auto" });

    movementState = {
      ...movement,
      startedAt: performance.now(),
      lastFrameAt: performance.now(),
      frameId: 0,
    };
    movementState.frameId = window.requestAnimationFrame(tickMovement);
  }

  function tickMovement(now: number): void {
    if (!movementState) {
      return;
    }

    const elapsed = now - movementState.startedAt;
    const deltaSeconds = Math.max(0, now - movementState.lastFrameAt) / 1000;
    movementState.lastFrameAt = now;

    if (elapsed >= HOLD_DELAY_MS) {
      window.scrollBy({
        left: movementState.speedX * deltaSeconds,
        top: movementState.speedY * deltaSeconds,
        behavior: "auto",
      });
    }

    movementState.frameId = window.requestAnimationFrame(tickMovement);
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
      scrollToPosition({ top: 0, left: currentScrollX() });
      return;
    }

    lastGPressAt = now;
    window.setTimeout(() => {
      if (performance.now() - lastGPressAt >= TOP_SEQUENCE_WINDOW_MS) {
        lastGPressAt = 0;
      }
    }, TOP_SEQUENCE_WINDOW_MS);
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

  function scrollToPosition(position: HintPosition): void {
    stopMovement();
    window.scrollTo({ ...position, behavior: "auto" });
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

  function currentScrollX(): number {
    return window.scrollX || window.pageXOffset || 0;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
})();
