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

  type HintTarget = LinkTarget | FormControlTarget;
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
    surface: ScrollSurface;
    startedAt: number;
    lastFrameAt: number;
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
  const maybeScroll = (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationScroll?: SafariKeyboardNavigationScroll;
    }
  ).SafariKeyboardNavigationScroll;

  if (!maybeHints || !maybeScroll) {
    return;
  }

  const hints: SafariKeyboardNavigationHints = maybeHints;
  const scroll: SafariKeyboardNavigationScroll = maybeScroll;

  const HINT_TRIGGER = "f";
  const TOP_SEQUENCE_WINDOW_MS = 800;
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

  function startHintMode(): void {
    const targets = collectHintTargets();
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
      activateHintTarget(exactMatch.target);
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

  function collectHintTargets(): HintTarget[] {
    const targets: HintTarget[] = [];
    collectLinkTargetsInto(targets);
    collectFormControlTargetsInto(targets);

    targets.sort((a, b) => {
      if (a.rect.top !== b.rect.top) {
        return a.rect.top - b.rect.top;
      }
      return a.rect.left - b.rect.left;
    });

    return targets;
  }

  function collectLinkTargetsInto(targets: HintTarget[]): void {
    const seen = new Set<HTMLAnchorElement>();
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

  function isVisibleLink(link: HTMLAnchorElement): boolean {
    return isVisibleElement(link);
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

  function isVisibleElement(element: HTMLElement): boolean {
    if (element.hidden || element.getAttribute("aria-hidden") === "true") {
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

  function activateHintTarget(target: HintTarget): void {
    if (target.kind === "link") {
      activateLinkTarget(target.element);
      return;
    }

    activateFormControlTarget(target.element);
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

  function activateFormControlTarget(element: FormControlTargetElement): void {
    cancelHintMode();
    focusElement(element);

    if (isTextEntryControl(element)) {
      placeTextEntryCaretAtEnd(element);
      return;
    }

    element.click();
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

  function startMovement(movement: Movement): void {
    if (movementState && movementState.key === movement.key) {
      return;
    }

    stopMovement();
    const surface = findScrollSurface(movement, { requireCanMove: true });
    scrollSurfaceBy(surface, {
      left: movement.dx,
      top: movement.dy,
      behavior: "smooth",
    });

    movementState = {
      ...movement,
      surface,
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
      scrollSurfaceBy(movementState.surface, {
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
