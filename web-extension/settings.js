"use strict";
(() => {
    const SETTINGS_STORAGE_KEY = "settings";
    const SETTINGS_VERSION = 1;
    const DEFAULT_EXTENSION_SETTINGS = {
        commandPalette: {
            searchEngine: "google",
        },
        enabled: true,
        hintStyle: {
            backgroundColor: "#ffd84d",
            fontSize: 12,
            fontWeight: 700,
            mediaFontSize: 15,
            opacity: 1,
            textColor: "#111111",
        },
        shortcuts: {
            bottom: "G",
            copyUrl: "yy",
            commandPalette: "o",
            commandPaletteNewTab: "Shift+O",
            bookmarkPalette: "b",
            bookmarkPaletteNewTab: "Shift+B",
            down: "j",
            halfPageDown: "d",
            halfPageUp: "u",
            help: "?",
            hint: "f",
            historyBack: "H",
            historyForward: "L",
            left: "h",
            newTabHint: "Shift+F",
            reload: "r",
            right: "l",
            tabPalette: "Shift+T",
            tabNext: "Shift+K",
            tabPrevious: "Shift+J",
            top: "gg",
            up: "k",
        },
        siteAccess: {
            allowlist: [],
            blocklist: [],
            mode: "all",
        },
        version: SETTINGS_VERSION,
    };
    const SHORTCUT_NAMES = [
        "hint",
        "newTabHint",
        "left",
        "down",
        "up",
        "right",
        "halfPageDown",
        "halfPageUp",
        "top",
        "bottom",
        "copyUrl",
        "reload",
        "historyBack",
        "historyForward",
        "commandPalette",
        "commandPaletteNewTab",
        "bookmarkPalette",
        "bookmarkPaletteNewTab",
        "tabPalette",
        "tabPrevious",
        "tabNext",
        "help",
    ];
    globalThis.SafariKeyboardNavigationSettings = {
        DEFAULT_EXTENSION_SETTINGS,
        SETTINGS_STORAGE_KEY,
        isExtensionEnabledForUrl,
        isShortcutEvent,
        loadExtensionSettings,
        normalizeExtensionSettings,
        saveExtensionSettings,
        shortcutSequence,
    };
    function normalizeExtensionSettings(input) {
        const candidate = input && typeof input === "object"
            ? input
            : {};
        const defaultSettings = DEFAULT_EXTENSION_SETTINGS;
        return {
            commandPalette: {
                searchEngine: searchEngineSetting(candidate.commandPalette?.searchEngine, defaultSettings.commandPalette.searchEngine),
            },
            enabled: typeof candidate.enabled === "boolean"
                ? candidate.enabled
                : defaultSettings.enabled,
            hintStyle: {
                backgroundColor: colorSetting(candidate.hintStyle?.backgroundColor, defaultSettings.hintStyle.backgroundColor),
                fontSize: numberSetting(candidate.hintStyle?.fontSize, defaultSettings.hintStyle.fontSize, 9, 28),
                fontWeight: numberSetting(candidate.hintStyle?.fontWeight, defaultSettings.hintStyle.fontWeight, 400, 900),
                mediaFontSize: numberSetting(candidate.hintStyle?.mediaFontSize, defaultSettings.hintStyle.mediaFontSize, 10, 32),
                opacity: numberSetting(candidate.hintStyle?.opacity, defaultSettings.hintStyle.opacity, 0.35, 1),
                textColor: colorSetting(candidate.hintStyle?.textColor, defaultSettings.hintStyle.textColor),
            },
            shortcuts: normalizeShortcuts(candidate.shortcuts),
            siteAccess: {
                allowlist: normalizePatterns(candidate.siteAccess?.allowlist),
                blocklist: normalizePatterns(candidate.siteAccess?.blocklist),
                mode: candidate.siteAccess?.mode === "allowlist"
                    ? "allowlist"
                    : defaultSettings.siteAccess.mode,
            },
            version: SETTINGS_VERSION,
        };
    }
    async function loadExtensionSettings() {
        const storage = globalThis.browser?.storage?.local;
        if (!storage) {
            return DEFAULT_EXTENSION_SETTINGS;
        }
        const result = await storage.get(SETTINGS_STORAGE_KEY);
        return normalizeExtensionSettings(result[SETTINGS_STORAGE_KEY]);
    }
    async function saveExtensionSettings(settings) {
        const storage = globalThis.browser?.storage?.local;
        if (!storage) {
            return;
        }
        await storage.set({
            [SETTINGS_STORAGE_KEY]: normalizeExtensionSettings(settings),
        });
    }
    function isExtensionEnabledForUrl(settings, href) {
        if (!settings.enabled) {
            return false;
        }
        let hostname = "";
        try {
            hostname = new URL(href).hostname.toLowerCase();
        }
        catch {
            return false;
        }
        if (matchesAnyPattern(hostname, settings.siteAccess.blocklist)) {
            return false;
        }
        if (settings.siteAccess.mode === "allowlist") {
            return matchesAnyPattern(hostname, settings.siteAccess.allowlist);
        }
        return true;
    }
    function isShortcutEvent(event, shortcut, options = {}) {
        const parsed = parseShortcut(shortcut);
        if (!parsed || parsed.sequence.length !== 1) {
            return false;
        }
        if (!options.allowRepeat && event.repeat) {
            return false;
        }
        return (event.altKey === parsed.altKey &&
            event.ctrlKey === parsed.ctrlKey &&
            event.metaKey === parsed.metaKey &&
            event.shiftKey === parsed.shiftKey &&
            event.key.toLowerCase() === parsed.sequence[0]);
    }
    function shortcutSequence(shortcut) {
        const parsed = parseShortcut(shortcut);
        if (!parsed ||
            parsed.altKey ||
            parsed.ctrlKey ||
            parsed.metaKey ||
            parsed.shiftKey) {
            return null;
        }
        return parsed.sequence;
    }
    function parseShortcut(shortcut) {
        const parts = shortcut
            .split("+")
            .map((part) => part.trim())
            .filter(Boolean);
        if (parts.length === 0) {
            return null;
        }
        const keyPart = parts[parts.length - 1];
        if (!keyPart) {
            return null;
        }
        const modifiers = new Set(parts.slice(0, -1).map((part) => part.toLowerCase()));
        const inferredShift = keyPart.length === 1 && keyPart !== keyPart.toLowerCase();
        const sequence = keyPart.toLowerCase();
        if (!/^[a-z?]{1,2}$/.test(sequence)) {
            return null;
        }
        return {
            altKey: modifiers.has("alt") || modifiers.has("option"),
            ctrlKey: modifiers.has("ctrl") || modifiers.has("control"),
            metaKey: modifiers.has("cmd") ||
                modifiers.has("command") ||
                modifiers.has("meta"),
            sequence: Array.from(sequence),
            shiftKey: modifiers.has("shift") || inferredShift,
        };
    }
    function normalizeShortcuts(shortcuts) {
        const normalized = { ...DEFAULT_EXTENSION_SETTINGS.shortcuts };
        if (!shortcuts || typeof shortcuts !== "object") {
            return normalized;
        }
        for (const name of SHORTCUT_NAMES) {
            const value = shortcuts[name];
            if (typeof value === "string" && parseShortcut(value)) {
                normalized[name] = value.trim();
            }
        }
        return normalized;
    }
    function normalizePatterns(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value
            .filter((pattern) => typeof pattern === "string")
            .map((pattern) => pattern.trim().toLowerCase())
            .filter(Boolean);
    }
    function matchesAnyPattern(hostname, patterns) {
        return patterns.some((pattern) => matchesPattern(hostname, pattern));
    }
    function matchesPattern(hostname, pattern) {
        if (pattern.startsWith("*.")) {
            const suffix = pattern.slice(2);
            return hostname === suffix || hostname.endsWith(`.${suffix}`);
        }
        return hostname === pattern || hostname.endsWith(`.${pattern}`);
    }
    function numberSetting(value, fallback, min, max) {
        return typeof value === "number" && Number.isFinite(value)
            ? Math.min(max, Math.max(min, value))
            : fallback;
    }
    function colorSetting(value, fallback) {
        return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
            ? value
            : fallback;
    }
    function searchEngineSetting(value, fallback) {
        switch (value) {
            case "google":
            case "duckduckgo":
            case "brave":
            case "kagi":
                return value;
            default:
                return fallback;
        }
    }
})();
