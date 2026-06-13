const translations = {
  en: {
    "app-title": "Safari Keyboard Navigation",
    "state-unknown": "Enable the extension in Safari to start using keyboard navigation.",
    "state-on": "The Safari extension is currently enabled.",
    "state-off": "The Safari extension is currently disabled.",
    "setup-heading": "Setup",
    "setup-step1": "Open Safari Settings and enable the extension.",
    "setup-step2": "Grant website access for the sites where you want keyboard navigation.",
    "setup-step3": "Open a web page and press <kbd>f</kbd> to show hints.",
    "open-preferences-settings": "Open Safari Settings",
    "open-preferences-preferences": "Open Safari Preferences",
    "shortcuts-heading": "Default Shortcuts",
    "shortcut-hints": "Open hints",
    "shortcut-new-tab": "Open hint in a new tab",
    "shortcut-move": "Move the page",
    "shortcut-half-page": "Move half a page",
    "shortcut-top": "Go to top",
    "shortcut-bottom": "Go to bottom",
    "shortcut-copy": "Copy the current URL",
    "shortcut-help": "Show shortcut help",
    "permissions-heading": "Permissions",
    "permissions-p1": "The extension reads visible links, buttons, form controls, and element positions on pages where you grant access. This is used locally to draw hints and run keyboard commands.",
    "permissions-p2": "It does not send page content, browsing data, or shortcut activity to any external server.",
    "settings-heading": "Settings",
    "settings-p1": "Site-specific access, shortcut customization, and hint appearance settings are managed from the extension settings page in Safari.",
    "support-heading": "Support & Privacy",
    "support-p1": "For more information about how we handle your data, or to report issues and request features, please visit our online pages:",
    "privacy-link": "Privacy Policy",
    "support-link": "Support & Issues",
    "version-label": "Version"
  },
  ja: {
    "app-title": "Safari キーボードナビゲーション",
    "state-unknown": "Safariの設定で拡張機能を有効にして、キーボードナビゲーションを開始してください。",
    "state-on": "Safari拡張機能は現在有効です。",
    "state-off": "Safari拡張機能は現在無効です。",
    "setup-heading": "セットアップ",
    "setup-step1": "Safariの設定を開き、拡張機能を有効にします。",
    "setup-step2": "キーボードナビゲーションを使用したいサイトへのアクセス権限を許可します。",
    "setup-step3": "任意のWebページを開き、キーボードの <kbd>f</kbd> キーを押してヒントを表示します。",
    "open-preferences-settings": "Safariの設定を開く",
    "open-preferences-preferences": "Safariの環境設定を開く",
    "shortcuts-heading": "デフォルトのショートカット",
    "shortcut-hints": "ヒントを表示",
    "shortcut-new-tab": "新規タブでヒントを開く",
    "shortcut-move": "ページをスクロール（移動）",
    "shortcut-half-page": "半ページスクロール",
    "shortcut-top": "ページの最上部へ移動",
    "shortcut-bottom": "ページの最下部へ移動",
    "shortcut-copy": "現在のURLをコピー",
    "shortcut-help": "ショートカットヘルプを表示",
    "permissions-heading": "権限について",
    "permissions-p1": "本拡張機能は、アクセスを許可したWebページ上のリンク、ボタン、フォーム入力欄、要素の位置を読み取ります。これは、ヒントを描画し、キーボードコマンドを実行するためにローカルでのみ使用されます。",
    "permissions-p2": "閲覧中のページ内容、ブラウジングデータ、ショートカット操作の履歴などを外部のサーバーに送信することは一切ありません。",
    "settings-heading": "設定",
    "settings-p1": "サイトごとのアクセス設定、ショートカットのカスタマイズ、ヒントの表示設定などは、Safari内の拡張機能設定ページから管理できます。",
    "support-heading": "サポートとプライバシー",
    "support-p1": "データの取り扱いに関する詳細、不具合報告、または機能リクエストについては、以下のリンクをご覧ください：",
    "privacy-link": "プライバシーポリシー",
    "support-link": "サポート / 不具合報告",
    "version-label": "バージョン"
  }
};

function localize(lang) {
  const dict = translations[lang] || translations.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  if (lang === "ja") {
    const privacyLink = document.getElementById("privacy-link");
    if (privacyLink) {
      privacyLink.href = "https://github.com/DaikiMiwa/safari-keyboard-navigation-extension/blob/main/docs/ja/privacy-policy.md";
    }
  }
}

function show(enabled, useSettingsInsteadOfPreferences, version, build) {
  const userLang = navigator.language.startsWith("ja") ? "ja" : "en";
  const dict = translations[userLang] || translations.en;

  const settingsLabelKey = useSettingsInsteadOfPreferences
    ? "open-preferences-settings"
    : "open-preferences-preferences";
  const buttonText = dict[settingsLabelKey];

  document.querySelectorAll(".open-preferences").forEach((button) => {
    button.textContent = buttonText;
  });

  if (typeof enabled === "boolean") {
    document.body.classList.toggle("state-on", enabled);
    document.body.classList.toggle("state-off", !enabled);
  } else {
    document.body.classList.remove("state-on");
    document.body.classList.remove("state-off");
  }

  if (version && build) {
    const versionEl = document.getElementById("app-version");
    if (versionEl) {
      const versionLabel = dict["version-label"] || "Version";
      versionEl.textContent = `${versionLabel} ${version} (${build})`;
    }
  }
}

function openPreferences() {
  webkit.messageHandlers.controller.postMessage("open-preferences");
}

document.querySelectorAll(".open-preferences").forEach((button) => {
  button.addEventListener("click", openPreferences);
});

// Run localization immediately based on navigator.language
const userLang = navigator.language.startsWith("ja") ? "ja" : "en";
localize(userLang);
