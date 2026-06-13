(() => {
  const maybeSettings = (
    globalThis as typeof globalThis & {
      SafariKeyboardNavigationSettings?: SafariKeyboardNavigationSettingsApi;
    }
  ).SafariKeyboardNavigationSettings;

  if (!maybeSettings) {
    return;
  }

  const settingsApi = maybeSettings;
  const shortcutLabels: Array<
    [keyof SafariKeyboardNavigationShortcutSettings, string]
  > = [
    ["hint", "Hints"],
    ["newTabHint", "Hints in new tab"],
    ["left", "Scroll left"],
    ["down", "Scroll down"],
    ["up", "Scroll up"],
    ["right", "Scroll right"],
    ["halfPageDown", "Half page down"],
    ["halfPageUp", "Half page up"],
    ["top", "Top"],
    ["bottom", "Bottom"],
    ["copyUrl", "Copy URL"],
    ["reload", "Reload"],
    ["historyBack", "History back"],
    ["historyForward", "History forward"],
    ["commandPalette", "Command palette"],
    ["commandPaletteNewTab", "Command palette in new tab"],
    ["editCurrentUrlPalette", "Edit current URL palette"],
    ["editCurrentUrlPaletteNewTab", "Edit current URL palette in new tab"],
    ["bookmarkPalette", "Bookmark palette"],
    ["bookmarkPaletteNewTab", "Bookmark palette in new tab"],
    ["historyPalette", "History palette"],
    ["historyPaletteNewTab", "History palette in new tab"],
    ["tabPalette", "Tab palette"],
    ["tabPrevious", "Previous tab"],
    ["tabNext", "Next tab"],
    ["help", "Help"],
  ];

  const shortcutInputs = new Map<
    keyof SafariKeyboardNavigationShortcutSettings,
    HTMLInputElement
  >();

  document.addEventListener("DOMContentLoaded", () => {
    renderShortcutInputs();
    void loadSettingsIntoForm();
    document.getElementById("save")?.addEventListener("click", () => {
      void saveFormSettings();
    });
    document.getElementById("reset")?.addEventListener("click", () => {
      fillForm(settingsApi.DEFAULT_EXTENSION_SETTINGS);
      setStatus("Defaults restored. Save to apply.");
    });

    const appearanceInputs = [
      "font-size",
      "font-weight",
      "opacity",
      "background-color",
      "text-color",
      "border-radius",
      "border-width",
      "border-color",
      "shadow-opacity",
    ];
    for (const id of appearanceInputs) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", updateHintPreview);
        el.addEventListener("change", updateHintPreview);
      }
    }
  });

  function renderShortcutInputs(): void {
    const container = document.getElementById("shortcuts");
    if (!container) {
      return;
    }

    for (const [name, labelText] of shortcutLabels) {
      const label = document.createElement("label");
      label.textContent = labelText;

      const input = document.createElement("input");
      input.type = "text";
      input.autocapitalize = "off";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.dataset.shortcut = name;
      label.appendChild(input);
      container.appendChild(label);
      shortcutInputs.set(name, input);
    }
  }

  async function loadSettingsIntoForm(): Promise<void> {
    fillForm(await settingsApi.loadExtensionSettings());
  }

  function updateHintPreview(): void {
    const previewLabel = document.getElementById("hint-preview-label");
    if (!previewLabel) {
      return;
    }

    const fontSize = input("font-size").value;
    const fontWeight = input("font-weight").value;
    const opacity = input("opacity").value;
    const backgroundColor = input("background-color").value;
    const textColor = input("text-color").value;
    const borderRadius = input("border-radius").value;
    const borderWidth = input("border-width").value;
    const borderColor = input("border-color").value;
    const shadowOpacity = input("shadow-opacity").value;

    previewLabel.style.fontSize = `${fontSize}px`;
    previewLabel.style.fontWeight = fontWeight;
    previewLabel.style.opacity = opacity;
    previewLabel.style.backgroundColor = backgroundColor;
    previewLabel.style.color = textColor;
    previewLabel.style.borderRadius = `${borderRadius}px`;
    previewLabel.style.border = `${borderWidth}px solid ${borderColor}`;
    previewLabel.style.boxShadow = `0 1px 4px rgba(0, 0, 0, ${shadowOpacity})`;
  }

  function fillForm(settings: SafariKeyboardNavigationExtensionSettings): void {
    input("enabled").checked = settings.enabled;
    select("site-mode").value = settings.siteAccess.mode;
    textarea("allowlist").value = settings.siteAccess.allowlist.join("\n");
    textarea("blocklist").value = settings.siteAccess.blocklist.join("\n");
    select("search-engine").value = settings.commandPalette.searchEngine;
    input("custom-search-url-template").value =
      settings.commandPalette.customSearchUrlTemplate;
    input("hint-keys").value = settings.hintKeys;

    for (const [name, shortcutInput] of shortcutInputs) {
      shortcutInput.value = settings.shortcuts[name];
    }

    input("font-size").value = String(settings.hintStyle.fontSize);
    input("media-font-size").value = String(settings.hintStyle.mediaFontSize);
    input("font-weight").value = String(settings.hintStyle.fontWeight);
    input("opacity").value = String(settings.hintStyle.opacity);
    input("background-color").value = settings.hintStyle.backgroundColor;
    input("text-color").value = settings.hintStyle.textColor;
    input("border-radius").value = String(settings.hintStyle.borderRadius);
    input("border-width").value = String(settings.hintStyle.borderWidth);
    input("border-color").value = settings.hintStyle.borderColor;
    input("shadow-opacity").value = String(settings.hintStyle.shadowOpacity);

    updateHintPreview();
  }

  async function saveFormSettings(): Promise<void> {
    const shortcuts = { ...settingsApi.DEFAULT_EXTENSION_SETTINGS.shortcuts };
    for (const [name, shortcutInput] of shortcutInputs) {
      shortcuts[name] = shortcutInput.value.trim();
    }

    const nextSettings = settingsApi.normalizeExtensionSettings({
      enabled: input("enabled").checked,
      hintKeys: input("hint-keys").value,
      commandPalette: {
        customSearchUrlTemplate: input("custom-search-url-template").value,
        searchEngine: select("search-engine").value,
      },
      hintStyle: {
        backgroundColor: input("background-color").value,
        fontSize: Number(input("font-size").value),
        fontWeight: Number(input("font-weight").value),
        mediaFontSize: Number(input("media-font-size").value),
        opacity: Number(input("opacity").value),
        textColor: input("text-color").value,
        borderRadius: Number(input("border-radius").value),
        borderWidth: Number(input("border-width").value),
        borderColor: input("border-color").value,
        shadowOpacity: Number(input("shadow-opacity").value),
      },
      shortcuts,
      siteAccess: {
        allowlist: lines(textarea("allowlist").value),
        blocklist: lines(textarea("blocklist").value),
        mode: select("site-mode").value,
      },
    });

    await settingsApi.saveExtensionSettings(nextSettings);
    fillForm(nextSettings);
    setStatus("Saved.");
  }

  function input(id: string): HTMLInputElement {
    return document.getElementById(id) as HTMLInputElement;
  }

  function select(id: string): HTMLSelectElement {
    return document.getElementById(id) as HTMLSelectElement;
  }

  function textarea(id: string): HTMLTextAreaElement {
    return document.getElementById(id) as HTMLTextAreaElement;
  }

  function lines(value: string): string[] {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function setStatus(message: string): void {
    const status = document.getElementById("status");
    if (status) {
      status.textContent = message;
    }
  }
})();
