(() => {
  type ShortcutName =
    | "hint"
    | "newTabHint"
    | "left"
    | "down"
    | "up"
    | "right"
    | "halfPageDown"
    | "halfPageUp"
    | "top"
    | "bottom"
    | "copyUrl"
    | "reload"
    | "historyBack"
    | "historyForward"
    | "commandPalette"
    | "commandPaletteNewTab"
    | "editCurrentUrlPalette"
    | "editCurrentUrlPaletteNewTab"
    | "bookmarkPalette"
    | "bookmarkPaletteNewTab"
    | "historyPalette"
    | "historyPaletteNewTab"
    | "tabPalette"
    | "tabPrevious"
    | "tabNext"
    | "help";

  const SETTINGS_STORAGE_KEY = "settings";
  const SETTINGS_VERSION = 1;

  const DEFAULT_EXTENSION_SETTINGS: SafariKeyboardNavigationExtensionSettings =
    {
      commandPalette: {
        customSearchUrlTemplate: "",
        searchEngine: "google",
      },
      enabled: true,
      hintKeys: "asdfghjkl",
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
        editCurrentUrlPalette: "ge",
        editCurrentUrlPaletteNewTab: "gE",
        bookmarkPalette: "b",
        bookmarkPaletteNewTab: "Shift+B",
        historyPalette: "v",
        historyPaletteNewTab: "Shift+V",
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

  const SHORTCUT_NAMES: ShortcutName[] = [
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
    "editCurrentUrlPalette",
    "editCurrentUrlPaletteNewTab",
    "bookmarkPalette",
    "bookmarkPaletteNewTab",
    "historyPalette",
    "historyPaletteNewTab",
    "tabPalette",
    "tabPrevious",
    "tabNext",
    "help",
  ];

  (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationSettings?: SafariKeyboardNavigationSettingsApi;
    }
  ).SafariKeyboardNavigationSettings = {
    DEFAULT_EXTENSION_SETTINGS,
    SETTINGS_STORAGE_KEY,
    isExtensionEnabledForUrl,
    isShortcutEvent,
    loadExtensionSettings,
    normalizeExtensionSettings,
    saveExtensionSettings,
    shortcutKeySequence,
    shortcutSequence,
  };

  function normalizeExtensionSettings(
    input: unknown,
  ): SafariKeyboardNavigationExtensionSettings {
    const candidate =
      input && typeof input === "object"
        ? (input as Partial<SafariKeyboardNavigationExtensionSettings>)
        : {};
    const defaultSettings = DEFAULT_EXTENSION_SETTINGS;

    return {
      commandPalette: {
        customSearchUrlTemplate: customSearchUrlTemplateSetting(
          candidate.commandPalette?.customSearchUrlTemplate,
          defaultSettings.commandPalette.customSearchUrlTemplate,
        ),
        searchEngine: searchEngineSetting(
          candidate.commandPalette?.searchEngine,
          defaultSettings.commandPalette.searchEngine,
        ),
      },
      enabled:
        typeof candidate.enabled === "boolean"
          ? candidate.enabled
          : defaultSettings.enabled,
      hintKeys: hintKeysSetting(candidate.hintKeys, defaultSettings.hintKeys),
      hintStyle: {
        backgroundColor: colorSetting(
          candidate.hintStyle?.backgroundColor,
          defaultSettings.hintStyle.backgroundColor,
        ),
        fontSize: numberSetting(
          candidate.hintStyle?.fontSize,
          defaultSettings.hintStyle.fontSize,
          9,
          28,
        ),
        fontWeight: numberSetting(
          candidate.hintStyle?.fontWeight,
          defaultSettings.hintStyle.fontWeight,
          400,
          900,
        ),
        mediaFontSize: numberSetting(
          candidate.hintStyle?.mediaFontSize,
          defaultSettings.hintStyle.mediaFontSize,
          10,
          32,
        ),
        opacity: numberSetting(
          candidate.hintStyle?.opacity,
          defaultSettings.hintStyle.opacity,
          0.35,
          1,
        ),
        textColor: colorSetting(
          candidate.hintStyle?.textColor,
          defaultSettings.hintStyle.textColor,
        ),
      },
      shortcuts: normalizeShortcuts(candidate.shortcuts),
      siteAccess: {
        allowlist: normalizePatterns(candidate.siteAccess?.allowlist),
        blocklist: normalizePatterns(candidate.siteAccess?.blocklist),
        mode:
          candidate.siteAccess?.mode === "allowlist"
            ? "allowlist"
            : defaultSettings.siteAccess.mode,
      },
      version: SETTINGS_VERSION,
    };
  }

  async function loadExtensionSettings(): Promise<SafariKeyboardNavigationExtensionSettings> {
    const storage = (
      globalThis as typeof globalThis & { browser?: WebExtensionApi }
    ).browser?.storage?.local;
    if (!storage) {
      return DEFAULT_EXTENSION_SETTINGS;
    }

    const result = await storage.get(SETTINGS_STORAGE_KEY);
    return normalizeExtensionSettings(result[SETTINGS_STORAGE_KEY]);
  }

  async function saveExtensionSettings(
    settings: SafariKeyboardNavigationExtensionSettings,
  ): Promise<void> {
    const storage = (
      globalThis as typeof globalThis & { browser?: WebExtensionApi }
    ).browser?.storage?.local;
    if (!storage) {
      return;
    }

    await storage.set({
      [SETTINGS_STORAGE_KEY]: normalizeExtensionSettings(settings),
    });
  }

  function isExtensionEnabledForUrl(
    settings: SafariKeyboardNavigationExtensionSettings,
    href: string,
  ): boolean {
    if (!settings.enabled) {
      return false;
    }

    let hostname = "";
    try {
      hostname = new URL(href).hostname.toLowerCase();
    } catch {
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

  function isShortcutEvent(
    event: KeyboardEvent,
    shortcut: string,
    options: { allowRepeat?: boolean } = {},
  ): boolean {
    const parsed = parseShortcut(shortcut);
    if (!parsed || parsed.sequence.length !== 1) {
      return false;
    }

    if (!options.allowRepeat && event.repeat) {
      return false;
    }

    if (event.isComposing || event.keyCode === 229) {
      return false;
    }

    return (
      event.altKey === parsed.altKey &&
      event.ctrlKey === parsed.ctrlKey &&
      event.metaKey === parsed.metaKey &&
      event.shiftKey === parsed.shiftKey &&
      event.key.toLowerCase() === parsed.sequence[0]
    );
  }

  function shortcutSequence(shortcut: string): string[] | null {
    const parsed = parseShortcut(shortcut);
    if (
      !parsed ||
      parsed.altKey ||
      parsed.ctrlKey ||
      parsed.metaKey ||
      parsed.shiftKey
    ) {
      return null;
    }

    return parsed.sequence;
  }

  function shortcutKeySequence(shortcut: string): ShortcutSequenceKey[] | null {
    const parsed = parseShortcut(shortcut);
    if (!parsed || parsed.altKey || parsed.ctrlKey || parsed.metaKey) {
      return null;
    }

    if (parsed.shiftKey && parsed.sequence.length === 1) {
      return null;
    }

    return parsed.keySequence;
  }

  function parseShortcut(shortcut: string): ParsedShortcut | null {
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

    const modifiers = new Set(
      parts.slice(0, -1).map((part) => part.toLowerCase()),
    );
    const inferredShift =
      keyPart.length === 1 && keyPart !== keyPart.toLowerCase();
    const sequence = keyPart.toLowerCase();
    if (!/^[a-z?]{1,2}$/.test(sequence)) {
      return null;
    }

    const keySequence = Array.from(keyPart).map((key) => ({
      key: key.toLowerCase(),
      shiftKey: key.length === 1 && key !== key.toLowerCase(),
    }));

    return {
      altKey: modifiers.has("alt") || modifiers.has("option"),
      ctrlKey: modifiers.has("ctrl") || modifiers.has("control"),
      metaKey:
        modifiers.has("cmd") ||
        modifiers.has("command") ||
        modifiers.has("meta"),
      keySequence,
      sequence: Array.from(sequence),
      shiftKey: modifiers.has("shift") || inferredShift,
    };
  }

  function normalizeShortcuts(
    shortcuts: Partial<Record<ShortcutName, string>> | undefined,
  ): Record<ShortcutName, string> {
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

  function normalizePatterns(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((pattern): pattern is string => typeof pattern === "string")
      .map((pattern) => pattern.trim().toLowerCase())
      .filter(Boolean);
  }

  function matchesAnyPattern(hostname: string, patterns: string[]): boolean {
    return patterns.some((pattern) => matchesPattern(hostname, pattern));
  }

  function matchesPattern(hostname: string, pattern: string): boolean {
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(2);
      return hostname === suffix || hostname.endsWith(`.${suffix}`);
    }

    return hostname === pattern || hostname.endsWith(`.${pattern}`);
  }

  function hintKeysSetting(value: unknown, fallback: string): string {
    if (typeof value !== "string") {
      return fallback;
    }
    const sanitized = value.replace(/\s+/g, "").toLowerCase();
    const uniqueChars = Array.from(new Set(sanitized));
    if (uniqueChars.length >= 2) {
      return uniqueChars.join("");
    }
    return fallback;
  }

  function numberSetting(
    value: unknown,
    fallback: number,
    min: number,
    max: number,
  ): number {
    return typeof value === "number" && Number.isFinite(value)
      ? Math.min(max, Math.max(min, value))
      : fallback;
  }

  function colorSetting(value: unknown, fallback: string): string {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
      ? value
      : fallback;
  }

  function searchEngineSetting(
    value: unknown,
    fallback: SafariKeyboardNavigationSearchEngine,
  ): SafariKeyboardNavigationSearchEngine {
    switch (value) {
      case "google":
      case "duckduckgo":
      case "brave":
      case "kagi":
      case "youtube":
      case "wikipedia":
      case "custom":
        return value;
      default:
        return fallback;
    }
  }

  function customSearchUrlTemplateSetting(
    value: unknown,
    fallback: string,
  ): string {
    if (typeof value !== "string") {
      return fallback;
    }

    const template = value.trim();
    if (!template || template.length > 2048 || !template.includes("{query}")) {
      return "";
    }

    try {
      const url = new URL(template.split("{query}").join("test"));
      return url.protocol === "http:" || url.protocol === "https:"
        ? template
        : "";
    } catch {
      return "";
    }
  }
})();
