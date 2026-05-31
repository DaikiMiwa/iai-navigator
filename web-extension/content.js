"use strict";
(() => {
    const maybeHints = globalThis.SafariKeyboardNavigationHints;
    const maybeHelp = globalThis.SafariKeyboardNavigationHelp;
    const maybeScroll = globalThis.SafariKeyboardNavigationScroll;
    const maybeSettings = globalThis.SafariKeyboardNavigationSettings;
    if (!maybeHints || !maybeHelp || !maybeScroll || !maybeSettings) {
        return;
    }
    const hints = maybeHints;
    const help = maybeHelp;
    const scroll = maybeScroll;
    const settingsApi = maybeSettings;
    const HELP_OVERLAY_ID = "skne-help-overlay";
    const COMMAND_PALETTE_OVERLAY_ID = "skne-command-palette-overlay";
    const COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY = "paletteQueryHistory";
    const COMMAND_PALETTE_QUERY_HISTORY_MAX_ITEMS = 50;
    const MEDIA_CONTROLS_REVEALED_CLASS = "skne-media-controls-revealed";
    const NATIVE_HINT_TARGET_SELECTOR = "a[href], button, input, select, textarea";
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
    const SEMANTIC_ACTION_TARGET_SELECTOR = '[role="button"], [role="link"], [role="tab"]';
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
    const LOCAL_PALETTE_COMMANDS = [
        {
            aliases: ["hint", "f"],
            id: "show-hints",
            title: "Show hints",
            subtitle: "Open link and control hints in the current tab",
        },
        {
            aliases: ["hint new", "new hint", "shift f"],
            id: "show-new-tab-hints",
            title: "Show hints in new tab",
            subtitle: "Open link hints for foreground tabs",
        },
        {
            aliases: ["copy address", "copy link", "yy", "yank"],
            id: "copy-url",
            title: "Copy current URL",
            subtitle: "Copy this page address to the clipboard",
        },
        {
            aliases: ["edit url", "edit address", "current url", "ge"],
            id: "edit-current-url",
            title: "Edit current URL",
            subtitle: "Put this page address in the palette input before opening",
        },
        {
            aliases: ["back", "go back", "history back", "h"],
            id: "history-back",
            title: "Go back",
            subtitle: "Navigate back in the current tab history",
        },
        {
            aliases: ["forward", "go forward", "history forward", "l"],
            id: "history-forward",
            title: "Go forward",
            subtitle: "Navigate forward in the current tab history",
        },
        {
            aliases: ["new", "new page", "nt", "open tab", "create tab"],
            id: "new-tab",
            title: "New tab",
            subtitle: "Open a new foreground tab",
        },
        {
            aliases: ["duplicate tab", "dup", "clone tab"],
            id: "duplicate-current-tab",
            title: "Duplicate current tab",
            subtitle: "Copy the current tab into a new foreground tab",
        },
        {
            aliases: ["close tab", "delete tab", "remove tab", "x"],
            id: "close-current-tab",
            title: "Close current tab",
            subtitle: "Close this tab when another tab is available",
        },
        {
            aliases: ["previous tab", "prev tab", "left tab", "shift j"],
            id: "previous-tab",
            title: "Previous tab",
            subtitle: "Switch to the tab on the left",
        },
        {
            aliases: ["next tab", "right tab", "shift k"],
            id: "next-tab",
            title: "Next tab",
            subtitle: "Switch to the tab on the right",
        },
        {
            aliases: ["top", "gg"],
            id: "scroll-top",
            title: "Scroll to top",
            subtitle: "Jump to the top of the current scroll area",
        },
        {
            aliases: ["bottom", "g", "end"],
            id: "scroll-bottom",
            title: "Scroll to bottom",
            subtitle: "Jump to the bottom of the current scroll area",
        },
        {
            aliases: ["refresh"],
            id: "reload",
            title: "Reload page",
            subtitle: "Reload the current page",
        },
        {
            aliases: ["options", "preferences", "config"],
            id: "open-settings",
            title: "Open settings",
            subtitle: "Configure shortcuts, sites, and hint appearance",
        },
    ];
    const COMMAND_PALETTE_FOOTER_HINTS = [
        "Enter open",
        "Shift+Enter new tab",
        "Option+Enter background",
        "Option+C copy URL",
        "Option+Y copy Markdown",
        "Option+E edit URL",
        "Option+D same domain",
        "Option+F title filter",
        "Option+⌫ forget local/query",
        "Option+W close tab",
        "Option+1-9 open result",
        "Ctrl+J/K move",
        "Ctrl+U/W edit",
        "Option+R refresh",
        "Option+↑/↓ query history",
        "Option+A/T/B/H/V/S/U/M source",
        "tab: book: history: visit: search: g: ddg: br: k: url: cmd:",
    ];
    const COMMAND_PALETTE_GENERATED_KINDS = [
        "url",
        "search",
    ];
    globalThis.SafariKeyboardNavigationHintTargets = {
        canClickMenuTriggerCandidate,
        isSafeMediaControlCandidate,
        isSafeMenuTriggerCandidate,
    };
    globalThis.SafariKeyboardNavigationPageSupport = {
        isSupportedPdfCandidate,
        isSupportedWebPageCandidate,
    };
    globalThis.SafariKeyboardNavigationMediaReveal = {
        isRevealableMediaControlsCandidate,
        shouldPreRevealMediaControlsCandidate,
    };
    globalThis.SafariKeyboardNavigationCommandPalette = {
        COMMAND_PALETTE_FOOTER_HINTS,
        commandPaletteApplyPrefixValue,
        commandPaletteCommandIds,
        commandPaletteCommandSearchIds,
        commandPaletteCurrentUrlEditValue,
        commandPaletteDomainFilterValue,
        commandPaletteEditableResultValue,
        commandPaletteHistoryNavigation,
        commandPaletteHighlightRanges,
        commandPaletteKeyAction,
        commandPaletteDeletePreviousWordValue,
        commandPaletteMarkdownLinkValue,
        commandPaletteNextIndexAfterActivation,
        commandPaletteQueryScope,
        commandPaletteShouldCloseAfterActivation,
        commandPaletteTitleFilterValue,
    };
    let hintState = null;
    let helpState = null;
    let commandPaletteState = null;
    let lastGPressAt = 0;
    let lastYPressAt = 0;
    let urlCopyToastTimer = 0;
    let movementState = null;
    let menuRevealTimer = 0;
    let extensionSettings = settingsApi.DEFAULT_EXTENSION_SETTINGS;
    let lastObservedPageKey = "";
    const revealedMediaControlSurfaces = new Set();
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
    function initializeExtensionSettings() {
        void settingsApi
            .loadExtensionSettings()
            .then((loadedSettings) => {
            extensionSettings = loadedSettings;
            applyHintStyleSettings();
        })
            .catch(() => undefined);
        globalThis.browser?.storage?.onChanged?.addListener((changes, areaName) => {
            if (areaName !== "local" ||
                !(settingsApi.SETTINGS_STORAGE_KEY in changes)) {
                return;
            }
            extensionSettings = settingsApi.normalizeExtensionSettings(changes[settingsApi.SETTINGS_STORAGE_KEY]?.newValue);
            applyHintStyleSettings();
            if (!settingsApi.isExtensionEnabledForUrl(extensionSettings, location.href)) {
                cancelHintMode();
                closeCommandPalette();
                stopMovement();
            }
        });
    }
    function handleKeyDown(event) {
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
        if (!settingsApi.isExtensionEnabledForUrl(extensionSettings, location.href)) {
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
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.help) ||
            help.isHelpCommandEvent(event)) {
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
    function handleHelpKeyDown(event) {
        const shouldClose = help.isHelpCloseCommandEvent(event);
        event.preventDefault();
        event.stopPropagation();
        if (shouldClose) {
            closeHelpOverlay();
        }
    }
    function handleKeyUp(event) {
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
    function hintActivationModeForEvent(event) {
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.hint)) {
            return "current-tab";
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.newTabHint)) {
            return "new-tab";
        }
        return null;
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
    function editableBlurTargetForEvent(event) {
        if (event.defaultPrevented ||
            event.repeat ||
            event.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.key !== "Escape") {
            return null;
        }
        if (document.activeElement instanceof HTMLElement &&
            isTextEditingElement(document.activeElement)) {
            return document.activeElement;
        }
        const path = typeof event.composedPath === "function"
            ? event.composedPath()
            : [event.target];
        for (const target of path) {
            if (target instanceof HTMLElement && isTextEditingElement(target)) {
                return target;
            }
        }
        return null;
    }
    function isTextEditingElement(element) {
        if (element.isContentEditable || element instanceof HTMLTextAreaElement) {
            return true;
        }
        return (element instanceof HTMLInputElement &&
            TEXT_ENTRY_INPUT_TYPES.has(element.type.toLowerCase()));
    }
    function isSupportedWebPage() {
        return isSupportedWebPageCandidate(currentPageSupportCandidate());
    }
    function isMovementSurface() {
        return isSupportedWebPage() || isSupportedPdf();
    }
    function isSupportedPdf() {
        return isSupportedPdfCandidate(currentPageSupportCandidate());
    }
    function currentPageSupportCandidate() {
        return {
            contentType: document.contentType,
            href: location.href,
            protocol: location.protocol,
        };
    }
    function isSupportedWebPageCandidate(candidate) {
        return (isSupportedPageProtocol(candidate.protocol) &&
            !isPdfDocumentCandidate(candidate));
    }
    function isSupportedPdfCandidate(candidate) {
        return (isPdfDocumentCandidate(candidate) &&
            isSupportedPageProtocol(candidate.protocol));
    }
    function isSupportedPageProtocol(protocol) {
        return (protocol === "http:" || protocol === "https:" || protocol === "file:");
    }
    function isPdfDocumentCandidate(candidate) {
        return (candidate.contentType === "application/pdf" ||
            /\.pdf(?:[?#]|$)/i.test(candidate.href));
    }
    function startHintMode(activationMode, options = {}) {
        cancelPendingMenuReveal();
        if (options.allowMediaControlPreReveal !== false &&
            revealMediaControlsBeforeHintCollection(activationMode)) {
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
        const entries = targets.map((target, index) => {
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
    function applyHintStyleSettings(root = document.documentElement) {
        const style = extensionSettings.hintStyle;
        root.style.setProperty("--skne-hint-background", style.backgroundColor);
        root.style.setProperty("--skne-hint-color", style.textColor);
        root.style.setProperty("--skne-hint-font-size", `${style.fontSize}px`);
        root.style.setProperty("--skne-hint-font-weight", String(style.fontWeight));
        root.style.setProperty("--skne-hint-media-font-size", `${style.mediaFontSize}px`);
        root.style.setProperty("--skne-hint-opacity", String(style.opacity));
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
            const isMatch = entry.hint.startsWith(nextInput);
            entry.label.dataset.hidden = isMatch ? "false" : "true";
            if (isMatch) {
                renderHintLabel(entry.label, entry.hint, nextInput);
            }
        }
        const exactMatch = matchingEntries.find((entry) => entry.hint === nextInput);
        if (exactMatch) {
            activateHintTarget(exactMatch.target, hintState.activationMode);
        }
    }
    function cancelHintMode() {
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
    function renderHintLabel(label, hint, input) {
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
    function showHelpOverlay() {
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
    function createHelpSection(section) {
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
    function createHelpShortcut(shortcut) {
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
    function closeHelpOverlay() {
        if (!helpState) {
            return;
        }
        helpState.overlay.remove();
        helpState = null;
    }
    function openCommandPalette(options) {
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
            includeCommands: options.includeCommands,
            includeGenerated: options.includeGenerated,
            input,
            inputBeforeHistory: "",
            list,
            overlay,
            results: [],
            searchId: 0,
            sources: options.sources,
        };
        input.addEventListener("input", () => {
            if (commandPaletteState) {
                commandPaletteState.historyCursor = null;
                commandPaletteState.inputBeforeHistory = "";
            }
            void refreshCommandPaletteResults();
        });
        input.focus();
        void loadCommandPaletteQueryHistory().then((history) => {
            if (commandPaletteState?.input === input) {
                commandPaletteState.history = history;
            }
        });
        void refreshCommandPaletteResults();
    }
    function closeCommandPalette() {
        if (!commandPaletteState) {
            return;
        }
        commandPaletteState.overlay.remove();
        commandPaletteState = null;
    }
    function createCommandPaletteFooter() {
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
    function handleCommandPaletteKeyDown(event) {
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
    function commandPaletteKeyAction(candidate) {
        if (candidate.key === "Escape") {
            return "close";
        }
        if (candidate.altKey && candidate.key === "ArrowUp") {
            return "history-previous";
        }
        if (candidate.altKey && candidate.key === "ArrowDown") {
            return "history-next";
        }
        if (candidate.key === "ArrowDown" ||
            (candidate.ctrlKey && candidate.key.toLowerCase() === "n") ||
            (candidate.ctrlKey && candidate.key.toLowerCase() === "j") ||
            (candidate.key === "Tab" && !candidate.shiftKey)) {
            return "next";
        }
        if (candidate.key === "ArrowUp" ||
            (candidate.ctrlKey && candidate.key.toLowerCase() === "p") ||
            (candidate.ctrlKey && candidate.key.toLowerCase() === "k") ||
            (candidate.key === "Tab" && candidate.shiftKey)) {
            return "previous";
        }
        if (candidate.key === "PageDown") {
            return "page-next";
        }
        if (candidate.key === "PageUp") {
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
        if (candidate.ctrlKey &&
            !candidate.altKey &&
            candidate.key.toLowerCase() === "w") {
            return "delete-previous-word";
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
        if (candidate.altKey && candidate.key.toLowerCase() === "r") {
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
        if (candidate.altKey &&
            (candidate.key === "Backspace" || candidate.key === "Delete")) {
            return "forget-palette-entry";
        }
        return null;
    }
    function handleCommandPaletteKeyAction(action) {
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
            case "delete-previous-word":
                deleteCommandPalettePreviousWord();
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
    function commandPaletteResultIndexForKey(candidate) {
        if (!candidate.altKey ||
            candidate.metaKey ||
            (candidate.ctrlKey && candidate.shiftKey)) {
            return null;
        }
        const digit = candidate.code?.match(/^Digit([1-9])$/)?.[1] ?? "";
        const key = digit || (/^[1-9]$/.test(candidate.key) ? candidate.key : "");
        if (!key) {
            return null;
        }
        const action = {
            index: Number(key) - 1,
            kind: "activate-index",
        };
        if (candidate.ctrlKey) {
            action.disposition = "background-tab";
        }
        else if (candidate.shiftKey) {
            action.disposition = "new-tab";
        }
        return action;
    }
    function commandPaletteSourcePrefixForKey(candidate) {
        if (!candidate.altKey ||
            candidate.ctrlKey ||
            candidate.metaKey ||
            candidate.shiftKey) {
            return null;
        }
        const key = candidate.code?.match(/^Key([A-Z])$/)?.[1]?.toLowerCase() ??
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
    function navigateCommandPaletteQueryHistory(direction) {
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
    function commandPaletteHistoryNavigation(candidate) {
        if (candidate.history.length === 0) {
            return {
                cursor: candidate.cursor,
                inputBeforeHistory: candidate.inputBeforeHistory,
                query: candidate.query,
            };
        }
        if (candidate.direction === "previous") {
            const cursor = candidate.cursor === null
                ? 0
                : Math.min(candidate.cursor + 1, candidate.history.length - 1);
            return {
                cursor,
                inputBeforeHistory: candidate.cursor === null
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
    async function refreshCommandPaletteResults() {
        const state = commandPaletteState;
        if (!state) {
            return;
        }
        const scope = commandPaletteQueryScope(state.input.value, state);
        const searchId = state.searchId + 1;
        state.searchId = searchId;
        const [localResults, browserResults] = await Promise.all([
            Promise.resolve(scope.includeCommands ? searchLocalPaletteCommands(scope.query) : []),
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
    async function searchBrowserPaletteResults(scope) {
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
            }));
            return Array.isArray(response?.results) ? response.results : [];
        }
        catch {
            return [];
        }
    }
    function searchLocalPaletteCommands(query) {
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
    function commandPaletteCommandIds() {
        return LOCAL_PALETTE_COMMANDS.map((command) => command.id);
    }
    function commandPaletteCommandSearchIds(query) {
        return searchLocalPaletteCommands(query).map((result) => result.command);
    }
    function localPaletteCommandScore(command, query) {
        if (!query) {
            return 1;
        }
        const aliases = command.aliases ?? [];
        const haystack = `${command.title} ${command.subtitle}`.toLowerCase();
        const haystackTokens = haystack.split(/[^a-z0-9]+/).filter(Boolean);
        const terms = query.split(/\s+/).filter(Boolean);
        if (!terms.every((term) => commandTextMatchesTerm(haystack, haystackTokens, term) ||
            aliases.some((alias) => commandAliasMatchesTerm(alias, term)))) {
            return null;
        }
        const title = command.title.toLowerCase();
        const aliasScore = Math.max(0, ...aliases.map((alias) => commandAliasScore(alias, terms)));
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
    function commandAliasScore(alias, terms) {
        const normalizedAlias = alias.toLowerCase();
        if (terms.join(" ") === normalizedAlias) {
            return 90;
        }
        return terms.every((term) => commandAliasMatchesTerm(alias, term)) ? 50 : 0;
    }
    function commandTextMatchesTerm(haystack, haystackTokens, term) {
        if (term.length <= 2) {
            return haystackTokens.some((token) => token === term || token.startsWith(term));
        }
        return haystack.includes(term);
    }
    function commandAliasMatchesTerm(alias, term) {
        const normalizedAlias = alias.toLowerCase();
        if (normalizedAlias === term) {
            return true;
        }
        return normalizedAlias
            .split(/\s+/)
            .some((token) => token === term || token.startsWith(term));
    }
    function renderCommandPaletteResults() {
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
            row.setAttribute("aria-selected", index === state.activeIndex ? "true" : "false");
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
    function revealCommandPaletteSelection() {
        if (!commandPaletteState) {
            return;
        }
        const activeRow = commandPaletteState.list.querySelector('.skne-command-palette-result[data-active="true"]');
        activeRow?.scrollIntoView({ block: "nearest" });
    }
    function moveCommandPaletteSelection(delta) {
        if (!commandPaletteState || commandPaletteState.results.length === 0) {
            return;
        }
        const length = commandPaletteState.results.length;
        commandPaletteState.activeIndex =
            (commandPaletteState.activeIndex + delta + length) % length;
        renderCommandPaletteResults();
    }
    function setCommandPaletteSelection(index) {
        if (!commandPaletteState || commandPaletteState.results.length === 0) {
            return;
        }
        commandPaletteState.activeIndex = clamp(index, 0, commandPaletteState.results.length - 1);
        renderCommandPaletteResults();
    }
    function setCommandPaletteSelectionToLast() {
        if (!commandPaletteState) {
            return;
        }
        setCommandPaletteSelection(commandPaletteState.results.length - 1);
    }
    function clearCommandPaletteQuery() {
        if (!commandPaletteState) {
            return;
        }
        commandPaletteState.input.value = "";
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
        void refreshCommandPaletteResults();
    }
    function deleteCommandPalettePreviousWord() {
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
    function refreshCommandPaletteLiveQuery() {
        if (!commandPaletteState) {
            return;
        }
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
        void refreshCommandPaletteResults();
    }
    function appendCommandPaletteHighlightedText(element, value, query) {
        const ranges = commandPaletteHighlightRanges(value, query);
        if (ranges.length === 0) {
            element.textContent = value;
            return;
        }
        let cursor = 0;
        for (const range of ranges) {
            if (range.start > cursor) {
                element.appendChild(document.createTextNode(value.slice(cursor, range.start)));
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
    function commandPaletteHighlightRanges(value, query) {
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
    function commandPaletteQueryScope(query, options) {
        const match = query.trimStart().match(/^([a-z]+):\s*(.*)$/i);
        if (!match) {
            return { ...options, query };
        }
        const sources = paletteSourcesForPrefix(match[1].toLowerCase());
        if (!sources) {
            return { ...options, query };
        }
        const scope = {
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
    function commandPaletteApplyPrefixValue(value, prefix) {
        const query = commandPaletteUnprefixedQuery(value);
        if (prefix === "all") {
            return query;
        }
        return `${prefix}: ${query}`;
    }
    function commandPaletteUnprefixedQuery(value) {
        const match = value.trimStart().match(/^([a-z]+):\s*(.*)$/i);
        if (!match || !paletteSourcesForPrefix(match[1].toLowerCase())) {
            return value;
        }
        return match[2];
    }
    function commandPaletteEditableResultValue(result) {
        return result.kind !== "command" && result.url
            ? `url: ${result.url}`
            : null;
    }
    function commandPaletteDomainFilterValue(value, result) {
        const hostname = commandPaletteResultHostname(result);
        if (!hostname) {
            return null;
        }
        const prefix = commandPaletteSourcePrefixForValue(value);
        const nextQuery = `domain:${hostname}`;
        return prefix ? `${prefix}: ${nextQuery}` : nextQuery;
    }
    function commandPaletteTitleFilterValue(value, result) {
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
    function commandPaletteDeletePreviousWordValue(candidate) {
        const selectionStart = clamp(Math.min(candidate.selectionStart, candidate.selectionEnd), 0, candidate.value.length);
        const selectionEnd = clamp(Math.max(candidate.selectionStart, candidate.selectionEnd), 0, candidate.value.length);
        if (selectionStart !== selectionEnd) {
            return {
                selectionEnd: selectionStart,
                selectionStart,
                value: candidate.value.slice(0, selectionStart) +
                    candidate.value.slice(selectionEnd),
            };
        }
        let deleteStart = selectionStart;
        while (deleteStart > 0 &&
            /\s/.test(candidate.value.charAt(deleteStart - 1))) {
            deleteStart -= 1;
        }
        while (deleteStart > 0 &&
            !/\s/.test(candidate.value.charAt(deleteStart - 1))) {
            deleteStart -= 1;
        }
        return {
            selectionEnd: deleteStart,
            selectionStart: deleteStart,
            value: candidate.value.slice(0, deleteStart) +
                candidate.value.slice(selectionEnd),
        };
    }
    function commandPaletteCurrentUrlEditValue(href) {
        try {
            const url = new URL(href.trim());
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return null;
            }
            return `url: ${url.toString()}`;
        }
        catch {
            return null;
        }
    }
    function commandPaletteFilterPhraseValue(value) {
        return (value ?? "").replace(/"/g, " ").replace(/\s+/g, " ").trim();
    }
    function commandPaletteResultHostname(result) {
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
        }
        catch {
            return null;
        }
    }
    function commandPaletteSourcePrefixForValue(value) {
        const match = value.trimStart().match(/^([a-z]+):\s*(.*)$/i);
        if (!match) {
            return null;
        }
        const sources = paletteSourcesForPrefix(match[1].toLowerCase());
        return sources && sources.sources.length > 0
            ? match[1].toLowerCase()
            : null;
    }
    function paletteSourcesForPrefix(prefix) {
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
    function fuzzyHighlightRanges(term, value) {
        let termIndex = 0;
        const ranges = [];
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
    function mergeTextRanges(ranges) {
        const sortedRanges = ranges
            .filter((range) => range.start < range.end)
            .sort((a, b) => a.start - b.start || a.end - b.end);
        const mergedRanges = [];
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
    function activateCommandPaletteSelection(dispositionOverride) {
        if (!commandPaletteState) {
            return;
        }
        const result = commandPaletteState.results[commandPaletteState.activeIndex];
        if (!result) {
            return;
        }
        const disposition = dispositionOverride ?? commandPaletteState.disposition;
        const query = commandPaletteState.input.value;
        if (result.kind === "command" && result.command === "edit-current-url") {
            executeLocalPaletteCommand(result.command);
            return;
        }
        if (commandPaletteShouldCloseAfterActivation({
            disposition,
            resultKind: result.kind,
        })) {
            closeCommandPalette();
        }
        void rememberCommandPaletteQuery(query);
        if (result.kind === "command") {
            if (disposition === "background-tab") {
                return;
            }
            executeLocalPaletteCommand(result.command);
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
    function commandPaletteShouldCloseAfterActivation(candidate) {
        return candidate.disposition !== "background-tab";
    }
    function commandPaletteNextIndexAfterActivation(candidate) {
        if (candidate.disposition !== "background-tab" ||
            candidate.resultKind === "command" ||
            candidate.resultCount <= 0) {
            return candidate.activeIndex;
        }
        return (candidate.activeIndex + 1) % candidate.resultCount;
    }
    function advanceCommandPaletteSelectionAfterActivation(candidate) {
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
    function activateCommandPaletteIndex(index, dispositionOverride) {
        if (!commandPaletteState || !commandPaletteState.results[index]) {
            return;
        }
        commandPaletteState.activeIndex = index;
        activateCommandPaletteSelection(dispositionOverride);
    }
    function applyCommandPaletteSourcePrefix(prefix) {
        if (!commandPaletteState) {
            return;
        }
        commandPaletteState.input.value = commandPaletteApplyPrefixValue(commandPaletteState.input.value, prefix);
        commandPaletteState.input.setSelectionRange(commandPaletteState.input.value.length, commandPaletteState.input.value.length);
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
        void refreshCommandPaletteResults();
    }
    function editCommandPaletteSelectionUrl() {
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
        commandPaletteState.input.setSelectionRange(commandPaletteState.input.value.length, commandPaletteState.input.value.length);
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
        void refreshCommandPaletteResults();
    }
    function narrowCommandPaletteSelectionToDomain() {
        if (!commandPaletteState) {
            return;
        }
        const result = commandPaletteState.results[commandPaletteState.activeIndex];
        if (!result) {
            return;
        }
        const nextValue = commandPaletteDomainFilterValue(commandPaletteState.input.value, { url: "url" in result ? result.url : undefined });
        if (!nextValue) {
            showUrlCopyToast("No domain to filter");
            return;
        }
        commandPaletteState.input.value = nextValue;
        commandPaletteState.input.setSelectionRange(commandPaletteState.input.value.length, commandPaletteState.input.value.length);
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
        void refreshCommandPaletteResults();
    }
    function narrowCommandPaletteSelectionToTitle() {
        if (!commandPaletteState) {
            return;
        }
        const result = commandPaletteState.results[commandPaletteState.activeIndex];
        if (!result) {
            return;
        }
        const nextValue = commandPaletteTitleFilterValue(commandPaletteState.input.value, { kind: result.kind, title: result.title });
        if (!nextValue) {
            showUrlCopyToast("No title to filter");
            return;
        }
        commandPaletteState.input.value = nextValue;
        commandPaletteState.input.setSelectionRange(commandPaletteState.input.value.length, commandPaletteState.input.value.length);
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
        void refreshCommandPaletteResults();
    }
    async function copyCommandPaletteSelectionUrl() {
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
    async function copyCommandPaletteSelectionMarkdown() {
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
        showUrlCopyToast(didCopy ? "Copied Markdown link" : "Could not copy Markdown link");
    }
    function commandPaletteMarkdownLinkValue(result) {
        const url = result.url?.trim();
        if (!url) {
            return null;
        }
        const title = normalizeMarkdownLinkTitle(result.title) || url;
        return `[${escapeMarkdownLinkText(title)}](${escapeMarkdownLinkUrl(url)})`;
    }
    function normalizeMarkdownLinkTitle(value) {
        return (value ?? "").replace(/\s+/g, " ").trim();
    }
    function escapeMarkdownLinkText(value) {
        return value.replace(/([\\[\]])/g, "\\$1");
    }
    function escapeMarkdownLinkUrl(value) {
        return value.replace(/([\\)])/g, "\\$1");
    }
    async function loadCommandPaletteQueryHistory() {
        const storage = globalThis.browser
            ?.storage?.local ?? null;
        if (!storage) {
            return [];
        }
        const result = await storage.get(COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY);
        return normalizeCommandPaletteQueryHistory(result[COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY]);
    }
    async function rememberCommandPaletteQuery(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            return;
        }
        const storage = globalThis.browser
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
    async function forgetCommandPaletteEntry() {
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
        if (!result || result.kind === "command" || !result.url) {
            showUrlCopyToast("Nothing to forget");
            return;
        }
        if (result.kind === "visit") {
            const removed = await removeCommandPaletteLocalVisit(result.url);
            showUrlCopyToast(removed ? "Forgot local visit" : "Could not forget visit");
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
        showUrlCopyToast(removed ? "Removed history result" : "Could not remove history");
        if (removed) {
            await refreshCommandPaletteResults();
        }
    }
    async function closeCommandPaletteTab() {
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
    async function closeBrowserPaletteTab(tabId) {
        if (typeof browser === "undefined" || !browser.runtime) {
            return false;
        }
        const response = (await browser.runtime
            .sendMessage({
            type: "palette-close-tab",
            tabId,
        })
            .catch(() => undefined));
        return response?.closed === true;
    }
    async function forgetRecalledCommandPaletteQuery() {
        if (!commandPaletteState || commandPaletteState.historyCursor === null) {
            return false;
        }
        const query = commandPaletteState.history[commandPaletteState.historyCursor];
        if (!query) {
            return false;
        }
        const nextHistory = commandPaletteState.history.filter((item) => item !== query);
        const restoredQuery = commandPaletteState.inputBeforeHistory;
        commandPaletteState.history = nextHistory;
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
        commandPaletteState.input.value = restoredQuery;
        await storeCommandPaletteQueryHistory(nextHistory);
        await refreshCommandPaletteResults();
        return true;
    }
    async function removeCommandPaletteLocalVisit(url) {
        if (typeof browser === "undefined" || !browser.runtime) {
            return false;
        }
        const response = (await browser.runtime
            .sendMessage({
            type: "palette-remove-local-visit",
            url,
        })
            .catch(() => undefined));
        return response?.removed === true;
    }
    async function removeCommandPaletteHistory(url) {
        if (typeof browser === "undefined" || !browser.runtime) {
            return false;
        }
        const response = (await browser.runtime
            .sendMessage({
            type: "palette-remove-history",
            url,
        })
            .catch(() => undefined));
        return response?.removed === true;
    }
    async function storeCommandPaletteQueryHistory(history) {
        const storage = globalThis.browser
            ?.storage?.local ?? null;
        if (!storage) {
            return;
        }
        await storage.set({
            [COMMAND_PALETTE_QUERY_HISTORY_STORAGE_KEY]: normalizeCommandPaletteQueryHistory(history),
        });
    }
    function normalizeCommandPaletteQueryHistory(input) {
        if (!Array.isArray(input)) {
            return [];
        }
        const history = [];
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
    function executeLocalPaletteCommand(command) {
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
    function editCurrentUrlInCommandPalette() {
        if (!commandPaletteState) {
            return;
        }
        const nextValue = commandPaletteCurrentUrlEditValue(location.href);
        if (!nextValue) {
            showUrlCopyToast("Current URL cannot be edited");
            return;
        }
        commandPaletteState.input.value = nextValue;
        commandPaletteState.input.setSelectionRange(nextValue.length, nextValue.length);
        commandPaletteState.historyCursor = null;
        commandPaletteState.inputBeforeHistory = "";
        void refreshCommandPaletteResults();
    }
    async function executeBrowserPaletteResult(result, disposition) {
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
    async function openExtensionSettings() {
        if (typeof browser === "undefined" || !browser.runtime) {
            return;
        }
        await browser.runtime
            .sendMessage({ type: "open-options" })
            .catch(() => undefined);
    }
    async function executeTabCommand(command) {
        if (typeof browser === "undefined" || !browser.runtime) {
            return;
        }
        await browser.runtime
            .sendMessage({ type: "tab-command", command })
            .catch(() => undefined);
    }
    function compareCommandPaletteResults(a, b) {
        if (a.score !== b.score) {
            return b.score - a.score;
        }
        return a.title.localeCompare(b.title);
    }
    function scheduleMenuRevealStep(callback, delayMs) {
        cancelPendingMenuReveal();
        menuRevealTimer = window.setTimeout(() => {
            menuRevealTimer = 0;
            callback();
        }, delayMs);
    }
    function cancelPendingMenuReveal() {
        if (!menuRevealTimer) {
            return;
        }
        window.clearTimeout(menuRevealTimer);
        menuRevealTimer = 0;
    }
    function collectVisibleLinkSignatures() {
        const signatures = new Set();
        for (const link of document.querySelectorAll("a[href]")) {
            if (!isVisibleLink(link)) {
                continue;
            }
            const rect = visibleRectForElement(link);
            if (!rect) {
                continue;
            }
            signatures.add([
                link.href,
                Math.round(rect.left),
                Math.round(rect.top),
                link.textContent?.trim().slice(0, 80) ?? "",
            ].join("\n"));
        }
        return signatures;
    }
    function hasNewVisibleLinks(beforeVisibleLinks) {
        for (const signature of collectVisibleLinkSignatures()) {
            if (!beforeVisibleLinks.has(signature)) {
                return true;
            }
        }
        return false;
    }
    function collectHintTargets(activationMode) {
        const targets = [];
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
    function collectLinkTargetsInto(targets, activationMode) {
        const seen = new Set();
        for (const link of document.querySelectorAll("a[href]")) {
            if (seen.has(link) ||
                !isVisibleLink(link) ||
                !isActivatableLink(link, activationMode)) {
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
    function collectFormControlTargetsInto(targets) {
        const seen = new Set();
        for (const element of document.querySelectorAll("button, input, select, textarea")) {
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
    function collectMenuTriggerTargetsInto(targets) {
        const seen = new Set();
        for (const element of document.querySelectorAll(MENU_TRIGGER_TARGET_SELECTOR)) {
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
    function collectMediaTargetsInto(targets) {
        const addedControls = collectMediaControlTargetsInto(targets);
        if (!addedControls) {
            collectMediaSurfaceTargetsInto(targets);
        }
    }
    function collectMediaControlTargetsInto(targets) {
        const seen = new Set();
        let addedControl = false;
        for (const surface of document.querySelectorAll(MEDIA_CONTROL_SURFACE_SELECTOR)) {
            if (!isVisibleElementWithAncestors(surface)) {
                continue;
            }
            for (const element of surface.querySelectorAll(MEDIA_CONTROL_TARGET_SELECTOR)) {
                const targetElement = mediaControlTargetElement(element, surface);
                if (seen.has(targetElement) ||
                    !isVisibleMediaControlTarget(targetElement)) {
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
    function collectMediaSurfaceTargetsInto(targets) {
        const seen = new Set();
        for (const element of document.querySelectorAll(MEDIA_SURFACE_TARGET_SELECTOR)) {
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
    function collectSemanticActionTargetsInto(targets) {
        const seen = new Set();
        for (const element of document.querySelectorAll(SEMANTIC_ACTION_TARGET_SELECTOR)) {
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
    function isActivatableLink(link, activationMode) {
        if (activationMode === "current-tab") {
            return true;
        }
        return isSupportedNewTabUrl(link.href);
    }
    function isVisibleLink(link) {
        return isVisibleElement(link, { allowAriaHidden: true });
    }
    function isVisibleFormControlTarget(element) {
        if (element.disabled ||
            isSafeMenuTriggerElementCandidate(element) ||
            isSafeMediaControlElementCandidate(element) ||
            !isVisibleElement(element)) {
            return false;
        }
        if (element instanceof HTMLInputElement) {
            return element.type.toLowerCase() !== "hidden";
        }
        return true;
    }
    function isVisibleMenuTriggerTarget(element) {
        return (isVisibleElement(element) && isSafeMenuTriggerElementCandidate(element));
    }
    function isVisibleMediaControlTarget(element) {
        return (isVisibleElementWithAncestors(element) &&
            isSafeMediaControlElementCandidate(element));
    }
    function isVisibleMediaSurfaceTarget(element) {
        return isVisibleElementWithAncestors(element) && hasMediaElement(element);
    }
    function revealMediaControlsBeforeHintCollection(activationMode) {
        const surfaces = revealableMediaSurfaceTargets();
        if (!shouldPreRevealMediaControlsCandidate({
            activationMode,
            hasRevealableMediaSurfaces: surfaces.length > 0,
            hasVisibleMediaControls: hasVisibleMediaControlTargets(),
        })) {
            return false;
        }
        for (const surface of surfaces) {
            revealMediaControlSurface(surface);
            dispatchMediaSurfaceRevealEvent(surface);
        }
        return true;
    }
    function shouldPreRevealMediaControlsCandidate(candidate) {
        return (candidate.activationMode === "current-tab" &&
            candidate.hasRevealableMediaSurfaces);
    }
    function isRevealableMediaControlsCandidate(candidate) {
        return (candidate.activationMode === "current-tab" &&
            candidate.hasRevealableMediaSurfaces &&
            !candidate.hasVisibleMediaControls);
    }
    function hasVisibleMediaControlTargets() {
        for (const surface of document.querySelectorAll(MEDIA_CONTROL_SURFACE_SELECTOR)) {
            if (!isVisibleElementWithAncestors(surface)) {
                continue;
            }
            for (const element of surface.querySelectorAll(MEDIA_CONTROL_TARGET_SELECTOR)) {
                if (isVisibleMediaControlTarget(element) &&
                    visibleRectForMediaControlTarget(element)) {
                    return true;
                }
            }
        }
        return false;
    }
    function revealableMediaSurfaceTargets() {
        const surfaces = [];
        const seen = new Set();
        for (const element of document.querySelectorAll(MEDIA_SURFACE_TARGET_SELECTOR)) {
            if (seen.has(element) || !isVisibleMediaSurfaceTarget(element)) {
                continue;
            }
            seen.add(element);
            surfaces.push(element);
        }
        return surfaces;
    }
    function revealMediaControlSurface(element) {
        document.documentElement.classList.add(MEDIA_CONTROLS_REVEALED_CLASS);
        element.classList.add(MEDIA_CONTROLS_REVEALED_CLASS);
        revealedMediaControlSurfaces.add(element);
    }
    function clearRevealedMediaControlSurfaces() {
        document.documentElement.classList.remove(MEDIA_CONTROLS_REVEALED_CLASS);
        for (const surface of revealedMediaControlSurfaces) {
            surface.classList.remove(MEDIA_CONTROLS_REVEALED_CLASS);
        }
        revealedMediaControlSurfaces.clear();
    }
    function isVisibleSemanticActionTarget(element) {
        if (!isVisibleElement(element) ||
            isNativeHintTarget(element) ||
            isSafeMenuTriggerElementCandidate(element) ||
            isSafeMediaControlElementCandidate(element)) {
            return false;
        }
        if (element.getAttribute("aria-disabled") === "true") {
            return false;
        }
        return true;
    }
    function isSafeMenuTriggerElementCandidate(element) {
        return isSafeMenuTriggerCandidate(menuTriggerCandidateForElement(element));
    }
    function canClickMenuTriggerElement(element) {
        return canClickMenuTriggerCandidate(menuTriggerCandidateForElement(element));
    }
    function isSafeMediaControlElementCandidate(element) {
        return isSafeMediaControlCandidate(mediaControlCandidateForElement(element));
    }
    function menuTriggerCandidateForElement(element) {
        return {
            hasAriaControls: element.hasAttribute("aria-controls"),
            hasAriaExpanded: element.hasAttribute("aria-expanded"),
            hasAriaHaspopup: element.hasAttribute("aria-haspopup") &&
                element.getAttribute("aria-haspopup") !== "false",
            isAriaDisabled: element.getAttribute("aria-disabled") === "true",
            isDisabled: element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement
                ? element.disabled
                : false,
            isFormSubmitButton: element instanceof HTMLButtonElement &&
                element.closest("form") !== null &&
                element.type === "submit",
            isInNavigationContext: element.closest('nav, header, [role="navigation"], [role="menubar"], [role="menu"]') !== null,
            isLink: element.matches("a[href]") || element.closest("a[href]") !== null,
            isNonButtonFormControl: element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement,
            role: (element.getAttribute("role") ?? "").toLowerCase(),
            tagName: element.tagName.toLowerCase(),
        };
    }
    function isSafeMenuTriggerCandidate(candidate) {
        if (candidate.isAriaDisabled ||
            candidate.isDisabled ||
            candidate.isFormSubmitButton ||
            candidate.isLink ||
            candidate.isNonButtonFormControl) {
            return false;
        }
        const signals = menuTriggerSignals(candidate);
        return signals.hasExplicitDisclosure || signals.isNavigationButtonLike;
    }
    function canClickMenuTriggerCandidate(candidate) {
        if (!isSafeMenuTriggerCandidate(candidate)) {
            return false;
        }
        const signals = menuTriggerSignals(candidate);
        return signals.hasExplicitDisclosure;
    }
    function menuTriggerSignals(candidate) {
        const tagName = candidate.tagName.toLowerCase();
        const role = candidate.role.toLowerCase();
        const isButtonLike = tagName === "button" || role === "button" || role === "menuitem";
        return {
            hasExplicitDisclosure: candidate.hasAriaControls ||
                candidate.hasAriaExpanded ||
                candidate.hasAriaHaspopup,
            isNavigationButtonLike: candidate.isInNavigationContext && isButtonLike,
        };
    }
    function mediaControlCandidateForElement(element) {
        const tagName = element.tagName.toLowerCase();
        const role = (element.getAttribute("role") ?? "").toLowerCase();
        return {
            hasAccessibleName: element.hasAttribute("aria-label") || element.hasAttribute("title"),
            isAriaDisabled: element.getAttribute("aria-disabled") === "true",
            isDisabled: element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement
                ? element.disabled
                : false,
            isFocusable: element.tabIndex >= 0 ||
                element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement,
            isInMediaControlSurface: element.closest(MEDIA_CONTROL_SURFACE_SELECTOR) !== null,
            isLink: element.matches("a[href]") || element.closest("a[href]") !== null,
            isNativeControl: tagName === "button" ||
                tagName === "input" ||
                tagName === "select" ||
                tagName === "textarea",
            isYouTubeButton: element.classList.contains("ytp-button") ||
                element.closest(".ytp-button") !== null,
            role,
            tagName,
        };
    }
    function mediaControlTargetElement(element, surface) {
        const youtubeButton = element.closest(".ytp-button");
        if (youtubeButton && surface.contains(youtubeButton)) {
            return youtubeButton;
        }
        return element;
    }
    function isSafeMediaControlCandidate(candidate) {
        if (!candidate.isInMediaControlSurface ||
            candidate.isAriaDisabled ||
            candidate.isDisabled ||
            candidate.isLink) {
            return false;
        }
        return (candidate.isNativeControl ||
            candidate.isYouTubeButton ||
            candidate.role === "button" ||
            candidate.role === "slider" ||
            candidate.role === "switch" ||
            candidate.role === "menuitem" ||
            (candidate.isFocusable && candidate.hasAccessibleName));
    }
    function isNativeHintTarget(element) {
        return (element.matches(NATIVE_HINT_TARGET_SELECTOR) ||
            element.closest(NATIVE_HINT_TARGET_SELECTOR) !== null ||
            element.querySelector(NATIVE_HINT_TARGET_SELECTOR) !== null);
    }
    function isVisibleElement(element, options = {}) {
        if (element.hidden ||
            (!options.allowAriaHidden &&
                element.getAttribute("aria-hidden") === "true")) {
            return false;
        }
        const style = getComputedStyle(element);
        return (style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.visibility !== "collapse" &&
            style.opacity !== "0");
    }
    function isVisibleElementWithAncestors(element) {
        let current = element;
        while (current && current !== document.documentElement) {
            if (!isVisibleElement(current)) {
                return false;
            }
            current = current.parentElement;
        }
        return isVisibleElement(element);
    }
    function visibleRectForElement(element) {
        return firstVisibleRect(element.getClientRects());
    }
    function visibleRectForMediaControlTarget(element) {
        const ownRect = visibleRectForElement(element);
        if (ownRect) {
            return centerTopHintPositionForElement(element, ownRect);
        }
        return visibleContentRectForElement(element);
    }
    function visibleRectForSemanticActionTarget(element) {
        const ownRect = visibleRectForElement(element);
        if (ownRect) {
            return ownRect;
        }
        return visibleContentRectForElement(element);
    }
    function visibleContentRectForElement(element) {
        const range = document.createRange();
        try {
            range.selectNodeContents(element);
            return firstVisibleRect(range.getClientRects());
        }
        finally {
            range.detach();
        }
    }
    function firstVisibleRect(rects) {
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
    function centerTopHintPositionForElement(element, fallback) {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || !intersectsViewport(rect)) {
            return fallback;
        }
        return {
            left: clamp(rect.left + rect.width / 2, 0, window.innerWidth - 1),
            top: clamp(rect.top, 0, window.innerHeight - 1),
        };
    }
    function intersectsViewport(rect) {
        return (rect.right > 0 &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.top < window.innerHeight);
    }
    function hasMediaElement(element) {
        return (element.matches("video, audio") ||
            element.querySelector("video, audio") !== null);
    }
    function activateHintTarget(target, activationMode) {
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
    function activateMenuTriggerTarget(element) {
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
    function activateMediaControlTarget(element) {
        cancelHintMode();
        focusElement(element);
        element.click();
    }
    function activateMediaSurfaceTarget(element) {
        cancelHintMode();
        focusElement(element);
        dispatchMediaSurfaceRevealEvent(element);
        scheduleMenuRevealStep(() => {
            startHintMode("current-tab");
        }, MEDIA_SURFACE_RESCAN_DELAY_MS);
    }
    function dispatchMediaSurfaceRevealEvent(element) {
        const rect = element.getBoundingClientRect();
        const clientX = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
        const clientY = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));
        for (const type of ["mouseover", "mouseenter", "mousemove"]) {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                clientX,
                clientY,
                view: window,
            }));
        }
        if (typeof PointerEvent === "function") {
            for (const type of ["pointerover", "pointerenter", "pointermove"]) {
                element.dispatchEvent(new PointerEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    clientX,
                    clientY,
                    pointerType: "mouse",
                    view: window,
                }));
            }
        }
    }
    function activateLinkTarget(element, activationMode) {
        if (activationMode === "new-tab") {
            openLinkTargetInNewTab(element);
            return;
        }
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
    function activateFormControlTarget(element) {
        cancelHintMode();
        focusElement(element);
        if (isTextEntryControl(element)) {
            placeTextEntryCaretAtEnd(element);
            return;
        }
        element.click();
    }
    function activateSemanticActionTarget(element) {
        cancelHintMode();
        focusElement(element);
        element.click();
    }
    function openLinkTargetInNewTab(element) {
        const link = element.closest("a[href]") || element;
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
    function isSupportedNewTabUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
        }
        catch {
            return false;
        }
    }
    function focusElement(element) {
        try {
            element.focus({ preventScroll: true });
        }
        catch {
            element.focus();
        }
    }
    function isTextEntryControl(element) {
        if (element instanceof HTMLTextAreaElement) {
            return true;
        }
        return (element instanceof HTMLInputElement &&
            TEXT_ENTRY_INPUT_TYPES.has(element.type.toLowerCase()));
    }
    function placeTextEntryCaretAtEnd(element) {
        const end = element.value.length;
        try {
            element.setSelectionRange(end, end);
        }
        catch {
            // Some text-entry-like input types do not expose text selection in Safari.
        }
    }
    function movementForEvent(event) {
        const movements = [
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
            if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts[shortcutName], {
                allowRepeat: true,
            })) {
                return movement;
            }
        }
        return null;
    }
    function halfPageDirectionForEvent(event) {
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.halfPageDown)) {
            return 1;
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.halfPageUp)) {
            return -1;
        }
        return null;
    }
    function tabSwitchDirectionForEvent(event) {
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.tabPrevious)) {
            return "previous";
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.tabNext)) {
            return "next";
        }
        return null;
    }
    function scrollHalfPage(direction) {
        const surface = findScrollSurface({
            key: direction > 0 ? "d" : "u",
            dx: 0,
            dy: direction,
            speedX: 0,
            speedY: 0,
        }, { requireCanMove: true });
        const distance = Math.max(1, Math.round(surfaceClientHeight(surface) * HALF_PAGE_RATIO));
        stopMovement();
        scrollSurfaceBy(surface, {
            left: 0,
            top: distance * direction,
            behavior: "smooth",
        });
    }
    function switchTab(direction) {
        stopMovement();
        if (typeof browser === "undefined" || !browser.runtime) {
            return;
        }
        void browser.runtime
            .sendMessage({ type: "switch-tab", direction })
            .catch(() => undefined);
    }
    function startMovement(movement) {
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
    function tickMovement(now) {
        if (!movementState) {
            return;
        }
        const elapsed = now - movementState.startedAt;
        const nextInitialProgress = movementInitialProgress(elapsed);
        const initialProgressDelta = nextInitialProgress - movementState.initialProgress;
        if (initialProgressDelta > 0) {
            scrollSurfaceBy(movementState.surface, {
                left: movementState.dx * initialProgressDelta,
                top: movementState.dy * initialProgressDelta,
                behavior: "auto",
            });
            movementState.initialProgress = nextInitialProgress;
        }
        const continuousFrom = Math.max(movementState.lastFrameAt, movementState.startedAt + HOLD_DELAY_MS);
        const deltaSeconds = !movementState.keyReleased && elapsed >= HOLD_DELAY_MS
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
    function movementInitialProgress(elapsedMs) {
        const linearProgress = clamp(elapsedMs / HOLD_DELAY_MS, 0, 1);
        return 1 - (1 - linearProgress) ** 3;
    }
    function stopMovement() {
        if (!movementState) {
            return;
        }
        window.cancelAnimationFrame(movementState.frameId);
        movementState = null;
    }
    function isTopCommand(event) {
        const sequence = settingsApi.shortcutSequence(extensionSettings.shortcuts.top);
        const key = event.key.toLowerCase();
        return (!event.repeat &&
            sequence?.length === 2 &&
            (key === sequence[0] ||
                isPendingSequenceKey(lastGPressAt, key, sequence, TOP_SEQUENCE_WINDOW_MS)));
    }
    function handleTopCommand(event) {
        const sequence = settingsApi.shortcutSequence(extensionSettings.shortcuts.top);
        if (!sequence || sequence.length !== 2) {
            return;
        }
        const now = performance.now();
        const key = event.key.toLowerCase();
        if (isPendingSequenceKey(lastGPressAt, key, sequence, TOP_SEQUENCE_WINDOW_MS)) {
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
    function isUrlCopyCommand(event) {
        const sequence = settingsApi.shortcutSequence(extensionSettings.shortcuts.copyUrl);
        const key = event.key.toLowerCase();
        return (!event.repeat &&
            sequence?.length === 2 &&
            (key === sequence[0] ||
                isPendingSequenceKey(lastYPressAt, key, sequence, URL_COPY_SEQUENCE_WINDOW_MS)));
    }
    function isUrlCopyCancelCommand(event) {
        return lastYPressAt !== 0 && event.key === "Escape";
    }
    function handleUrlCopyCommand(event) {
        const sequence = settingsApi.shortcutSequence(extensionSettings.shortcuts.copyUrl);
        if (!sequence || sequence.length !== 2) {
            return;
        }
        const now = performance.now();
        const key = event.key.toLowerCase();
        if (isPendingSequenceKey(lastYPressAt, key, sequence, URL_COPY_SEQUENCE_WINDOW_MS)) {
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
    function clearUrlCopySequence() {
        lastYPressAt = 0;
    }
    function scrollToTop() {
        const surface = findScrollSurface({ key: "g", dx: 0, dy: -1, speedX: 0, speedY: 0 }, { requireCanMove: false });
        scrollToSurfacePosition(surface, {
            top: 0,
            left: currentScrollX(surface),
        });
    }
    function scrollToBottom() {
        const surface = findScrollSurface({ key: "G", dx: 0, dy: 1, speedX: 0, speedY: 0 }, { requireCanMove: false });
        scrollToSurfacePosition(surface, {
            top: maxScrollTop(surface),
            left: currentScrollX(surface),
        });
    }
    function isPendingSequenceKey(startedAt, key, sequence, windowMs) {
        return (startedAt !== 0 &&
            performance.now() - startedAt <= windowMs &&
            key === sequence[1]);
    }
    async function copyCurrentUrl() {
        stopMovement();
        const didCopy = await writeTextToClipboard(location.href);
        showUrlCopyToast(didCopy ? "Copied URL" : "Could not copy URL");
    }
    async function writeTextToClipboard(text) {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            }
            catch {
                // Fall back to the selection-based copy path below.
            }
        }
        return copyTextWithTemporarySelection(text);
    }
    function copyTextWithTemporarySelection(text) {
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
        }
        finally {
            textarea.remove();
        }
    }
    function showUrlCopyToast(message) {
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
    function isBottomCommand(event) {
        return settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.bottom);
    }
    function isHistoryBackCommand(event) {
        return settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.historyBack);
    }
    function isHistoryForwardCommand(event) {
        return settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.historyForward);
    }
    function isReloadCommand(event) {
        return settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.reload);
    }
    function commandPaletteOptionsForEvent(event) {
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.commandPalette)) {
            return {
                disposition: "current-tab",
                generatedKinds: COMMAND_PALETTE_GENERATED_KINDS,
                includeCommands: true,
                includeGenerated: true,
                placeholder: "Search tabs, bookmarks, history, commands, URLs",
                sources: ["tabs", "bookmarks", "history", "visits"],
            };
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.commandPaletteNewTab)) {
            return {
                disposition: "new-tab",
                generatedKinds: COMMAND_PALETTE_GENERATED_KINDS,
                includeCommands: true,
                includeGenerated: true,
                placeholder: "Open tabs, bookmarks, history, commands, URLs in new tab",
                sources: ["tabs", "bookmarks", "history", "visits"],
            };
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.bookmarkPalette)) {
            return {
                disposition: "current-tab",
                generatedKinds: [],
                includeCommands: false,
                includeGenerated: false,
                placeholder: "Search bookmarks",
                sources: ["bookmarks"],
            };
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.bookmarkPaletteNewTab)) {
            return {
                disposition: "new-tab",
                generatedKinds: [],
                includeCommands: false,
                includeGenerated: false,
                placeholder: "Open bookmark in new tab",
                sources: ["bookmarks"],
            };
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.historyPalette)) {
            return {
                disposition: "current-tab",
                generatedKinds: [],
                includeCommands: false,
                includeGenerated: false,
                placeholder: "Search recent history",
                sources: ["history"],
            };
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.historyPaletteNewTab)) {
            return {
                disposition: "new-tab",
                generatedKinds: [],
                includeCommands: false,
                includeGenerated: false,
                placeholder: "Open recent history in new tab",
                sources: ["history"],
            };
        }
        if (settingsApi.isShortcutEvent(event, extensionSettings.shortcuts.tabPalette)) {
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
    function navigateHistory(direction) {
        stopMovement();
        if (direction === "back") {
            window.history.back();
            return;
        }
        window.history.forward();
    }
    function reloadPage() {
        stopMovement();
        location.reload();
    }
    function observeCurrentPageSoon() {
        window.setTimeout(observeCurrentPage, 250);
    }
    function observeSinglePageAppNavigations() {
        if (typeof history === "undefined") {
            return;
        }
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        try {
            history.pushState = function pushState(data, unused, url) {
                originalPushState.call(this, data, unused, url);
                observeCurrentPageSoon();
            };
            history.replaceState = function replaceState(data, unused, url) {
                originalReplaceState.call(this, data, unused, url);
                observeCurrentPageSoon();
            };
        }
        catch {
            return;
        }
    }
    function observeTitleChanges() {
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
    function observeCurrentPage() {
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
    function scrollToSurfacePosition(surface, position) {
        stopMovement();
        scrollSurfaceTo(surface, { ...position, behavior: "auto" });
    }
    function findScrollSurface(movement, options) {
        const axis = movementAxis(movement);
        const collection = collectScrollSurfaceCandidates(axis, movement);
        const selectedId = scroll.chooseScrollSurface(collection.candidates, options);
        return collection.surfaces.get(selectedId) ?? window;
    }
    function movementAxis(movement) {
        return Math.abs(movement.dx) > Math.abs(movement.dy) ? "x" : "y";
    }
    function elementsFromViewportProbePoints() {
        const points = [
            { left: window.innerWidth * 0.5, top: window.innerHeight * 0.5 },
            { left: window.innerWidth * 0.5, top: window.innerHeight * 0.35 },
            { left: window.innerWidth * 0.5, top: window.innerHeight * 0.65 },
            { left: window.innerWidth * 0.65, top: window.innerHeight * 0.5 },
        ];
        const elements = [];
        const seen = new Set();
        for (const point of points) {
            const element = document.elementFromPoint(point.left, point.top);
            if (element && !seen.has(element)) {
                seen.add(element);
                elements.push(element);
            }
        }
        return elements;
    }
    function collectScrollSurfaceCandidates(axis, movement) {
        const candidates = [];
        const surfaces = new Map();
        const elementIds = new WeakMap();
        surfaces.set(scroll.WINDOW_SURFACE_ID, window);
        for (const element of elementsFromViewportProbePoints()) {
            let current = element;
            while (current && current !== document.documentElement) {
                if (current !== document.documentElement) {
                    addElementCandidate(candidates, surfaces, elementIds, current, "probe", axis, movement);
                }
                current = current.parentElement;
            }
        }
        candidates.push(windowScrollCandidate(axis, movement));
        for (const element of document.querySelectorAll("*")) {
            if (element === document.documentElement) {
                continue;
            }
            addElementCandidate(candidates, surfaces, elementIds, element, "visible", axis, movement);
        }
        return { candidates, surfaces };
    }
    function addElementCandidate(candidates, surfaces, elementIds, element, kind, axis, movement) {
        const id = surfaceIdForElement(element, elementIds, surfaces);
        const candidate = elementScrollCandidate(id, element, kind, axis, movement);
        if (!candidate.canScroll) {
            return;
        }
        surfaces.set(candidate.id, element);
        candidates.push(candidate);
    }
    function surfaceIdForElement(element, elementIds, surfaces) {
        const existingId = elementIds.get(element);
        if (existingId) {
            return existingId;
        }
        const id = `element:${surfaces.size}`;
        elementIds.set(element, id);
        return id;
    }
    function viewportIntersectionArea(element) {
        const rect = element.getBoundingClientRect();
        const width = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
        const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        return width * height;
    }
    function elementScrollCandidate(id, element, kind, axis, movement) {
        const style = getComputedStyle(element);
        const overflow = axis === "y" ? style.overflowY : style.overflowX;
        const scrollPosition = axis === "y" ? element.scrollTop : element.scrollLeft;
        const maxScroll = maxElementScroll(element, axis);
        const direction = axis === "y" ? movement.dy : movement.dx;
        const canScroll = scroll.isScrollableOverflow(overflow) && maxScroll > 1;
        return {
            id,
            kind,
            canScroll,
            canMove: canScroll &&
                scroll.canMoveScrollPosition(scrollPosition, maxScroll, direction),
            visibleArea: kind === "visible" ? viewportIntersectionArea(element) : 0,
        };
    }
    function windowScrollCandidate(axis, movement) {
        const maxScroll = axis === "y"
            ? documentHeight() - window.innerHeight
            : documentWidth() - window.innerWidth;
        const scrollPosition = axis === "y" ? currentScrollY(window) : currentScrollX(window);
        const direction = axis === "y" ? movement.dy : movement.dx;
        return {
            id: scroll.WINDOW_SURFACE_ID,
            kind: "window",
            canScroll: maxScroll > 1,
            canMove: scroll.canMoveScrollPosition(scrollPosition, maxScroll, direction),
            visibleArea: window.innerWidth * window.innerHeight,
        };
    }
    function scrollSurfaceBy(surface, options) {
        if (isWindowSurface(surface)) {
            window.scrollBy(options);
            return;
        }
        surface.scrollBy(options);
    }
    function scrollSurfaceTo(surface, options) {
        if (isWindowSurface(surface)) {
            window.scrollTo(options);
            return;
        }
        surface.scrollTo(options);
    }
    function maxElementScroll(element, axis) {
        return axis === "y"
            ? scroll.maxScroll(element.scrollHeight, element.clientHeight)
            : scroll.maxScroll(element.scrollWidth, element.clientWidth);
    }
    function maxScrollTop(surface) {
        return isWindowSurface(surface)
            ? Math.max(0, documentHeight() - window.innerHeight)
            : maxElementScroll(surface, "y");
    }
    function surfaceClientHeight(surface) {
        return isWindowSurface(surface) ? window.innerHeight : surface.clientHeight;
    }
    function documentHeight() {
        const body = document.body;
        const element = document.documentElement;
        return Math.max(body ? body.scrollHeight : 0, body ? body.offsetHeight : 0, element ? element.clientHeight : 0, element ? element.scrollHeight : 0, element ? element.offsetHeight : 0);
    }
    function documentWidth() {
        const body = document.body;
        const element = document.documentElement;
        return Math.max(body ? body.scrollWidth : 0, body ? body.offsetWidth : 0, element ? element.clientWidth : 0, element ? element.scrollWidth : 0, element ? element.offsetWidth : 0);
    }
    function currentScrollX(surface) {
        return isWindowSurface(surface)
            ? window.scrollX || window.pageXOffset || 0
            : surface.scrollLeft;
    }
    function currentScrollY(surface) {
        return isWindowSurface(surface)
            ? window.scrollY || window.pageYOffset || 0
            : surface.scrollTop;
    }
    function isWindowSurface(surface) {
        return surface === window;
    }
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
})();
