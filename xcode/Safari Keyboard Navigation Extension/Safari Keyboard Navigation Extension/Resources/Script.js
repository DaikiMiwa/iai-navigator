function show(enabled, useSettingsInsteadOfPreferences) {
  const settingsLabel = useSettingsInsteadOfPreferences
    ? "Safari Settings"
    : "Safari Preferences";

  document.querySelectorAll(".open-preferences").forEach((button) => {
    button.textContent = `Open ${settingsLabel}`;
  });

  if (typeof enabled === "boolean") {
    document.body.classList.toggle("state-on", enabled);
    document.body.classList.toggle("state-off", !enabled);
  } else {
    document.body.classList.remove("state-on");
    document.body.classList.remove("state-off");
  }
}

function openPreferences() {
  webkit.messageHandlers.controller.postMessage("open-preferences");
}

document.querySelectorAll(".open-preferences").forEach((button) => {
  button.addEventListener("click", openPreferences);
});
