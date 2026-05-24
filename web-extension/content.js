"use strict";
(() => {
    const maybeHints = globalThis.SafariKeyboardNavigationHints;
    if (!maybeHints) {
        return;
    }
    const hints = maybeHints;
    const HINT_TRIGGER = "f";
    const TOP_SEQUENCE_WINDOW_MS = 800;
    const HOLD_DELAY_MS = 140;
    const VERTICAL_STEP_PX = 72;
    const HORIZONTAL_STEP_PX = 84;
    const VERTICAL_HOLD_SPEED_PX_PER_SECOND = 720;
    const HORIZONTAL_HOLD_SPEED_PX_PER_SECOND = 720;
    let hintState = null;
    let lastGPressAt = 0;
    let movementState = null;
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", stopMovement, true);
    window.addEventListener("pagehide", stopMovement, true);
    function handleKeyDown(event) {
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
    function handleKeyUp(event) {
        if (!movementState || event.key.toLowerCase() !== movementState.key) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        stopMovement();
    }
    function isHintTrigger(event) {
        return (!event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            event.key === HINT_TRIGGER);
    }
    function shouldIgnoreKeyboardCommand(event) {
        return (event.defaultPrevented ||
            event.isComposing ||
            isEditableEventTarget(event));
    }
    function isEditableEventTarget(event) {
        const path = typeof event.composedPath === "function"
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
            return (tagName === "input" || tagName === "textarea" || tagName === "select");
        });
    }
    function isSupportedWebPage() {
        return ((location.protocol === "http:" || location.protocol === "https:") &&
            !isPdfDocument());
    }
    function isMovementSurface() {
        return isSupportedWebPage() || isSupportedPdf();
    }
    function isSupportedPdf() {
        return (isPdfDocument() &&
            (location.protocol === "http:" ||
                location.protocol === "https:" ||
                location.protocol === "file:"));
    }
    function isPdfDocument() {
        return (document.contentType === "application/pdf" ||
            /\.pdf(?:[?#]|$)/i.test(location.href));
    }
    function startHintMode() {
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
        const entries = targets.map((target, index) => {
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
    function handleHintKeyDown(event) {
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
        const matchingEntries = hintState.entries.filter((entry) => entry.hint.startsWith(nextInput));
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
        const exactMatch = matchingEntries.find((entry) => entry.hint === nextInput);
        if (exactMatch) {
            activateLinkTarget(exactMatch.element);
        }
    }
    function cancelHintMode() {
        if (!hintState) {
            return;
        }
        hintState.overlay.remove();
        hintState = null;
        window.removeEventListener("scroll", cancelHintMode, true);
        window.removeEventListener("resize", cancelHintMode, true);
    }
    function collectLinkTargets() {
        const seen = new Set();
        const targets = [];
        for (const link of document.querySelectorAll("a[href]")) {
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
    function isVisibleLink(link) {
        if (link.hidden || link.getAttribute("aria-hidden") === "true") {
            return false;
        }
        const style = getComputedStyle(link);
        return (style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.visibility !== "collapse" &&
            style.opacity !== "0");
    }
    function visibleRectForElement(element) {
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
    function intersectsViewport(rect) {
        return (rect.right > 0 &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.top < window.innerHeight);
    }
    function activateLinkTarget(element) {
        const link = element.closest("a[href]") || element;
        const previousTarget = link.getAttribute("target");
        const hadTarget = link.hasAttribute("target");
        cancelHintMode();
        link.setAttribute("target", "_self");
        try {
            link.click();
        }
        finally {
            window.setTimeout(() => {
                if (hadTarget) {
                    link.setAttribute("target", previousTarget ?? "");
                }
                else {
                    link.removeAttribute("target");
                }
            }, 0);
        }
    }
    function movementForEvent(event) {
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
    function startMovement(movement) {
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
    function tickMovement(now) {
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
    function stopMovement() {
        if (!movementState) {
            return;
        }
        window.cancelAnimationFrame(movementState.frameId);
        movementState = null;
    }
    function isTopCommand(event) {
        return (!event.repeat &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            event.key === "g");
    }
    function handleTopCommand() {
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
    function isBottomCommand(event) {
        return (!event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            event.shiftKey &&
            event.code === "KeyG");
    }
    function scrollToPosition(position) {
        stopMovement();
        window.scrollTo({ ...position, behavior: "auto" });
    }
    function documentHeight() {
        const body = document.body;
        const element = document.documentElement;
        return Math.max(body ? body.scrollHeight : 0, body ? body.offsetHeight : 0, element ? element.clientHeight : 0, element ? element.scrollHeight : 0, element ? element.offsetHeight : 0);
    }
    function currentScrollX() {
        return window.scrollX || window.pageXOffset || 0;
    }
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
})();
