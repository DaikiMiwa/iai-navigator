"use strict";
(() => {
    const maybeSettings = globalThis.SafariKeyboardNavigationSettings;
    if (!maybeSettings) {
        return;
    }
    const settingsApi = maybeSettings;
    const shortcutLabels = [
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
    const shortcutInputs = new Map();
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
    });
    function renderShortcutInputs() {
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
    async function loadSettingsIntoForm() {
        fillForm(await settingsApi.loadExtensionSettings());
    }
    function fillForm(settings) {
        input("enabled").checked = settings.enabled;
        select("site-mode").value = settings.siteAccess.mode;
        textarea("allowlist").value = settings.siteAccess.allowlist.join("\n");
        textarea("blocklist").value = settings.siteAccess.blocklist.join("\n");
        select("search-engine").value = settings.commandPalette.searchEngine;
        input("custom-search-url-template").value =
            settings.commandPalette.customSearchUrlTemplate;
        for (const [name, shortcutInput] of shortcutInputs) {
            shortcutInput.value = settings.shortcuts[name];
        }
        input("font-size").value = String(settings.hintStyle.fontSize);
        input("media-font-size").value = String(settings.hintStyle.mediaFontSize);
        input("font-weight").value = String(settings.hintStyle.fontWeight);
        input("opacity").value = String(settings.hintStyle.opacity);
        input("background-color").value = settings.hintStyle.backgroundColor;
        input("text-color").value = settings.hintStyle.textColor;
    }
    async function saveFormSettings() {
        const shortcuts = { ...settingsApi.DEFAULT_EXTENSION_SETTINGS.shortcuts };
        for (const [name, shortcutInput] of shortcutInputs) {
            shortcuts[name] = shortcutInput.value.trim();
        }
        const nextSettings = settingsApi.normalizeExtensionSettings({
            enabled: input("enabled").checked,
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
    function input(id) {
        return document.getElementById(id);
    }
    function select(id) {
        return document.getElementById(id);
    }
    function textarea(id) {
        return document.getElementById(id);
    }
    function lines(value) {
        return value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }
    function setStatus(message) {
        const status = document.getElementById("status");
        if (status) {
            status.textContent = message;
        }
    }
})();
