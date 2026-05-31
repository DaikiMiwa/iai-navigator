# Permissions and Privacy

Safari Keyboard Navigation runs locally in Safari. It does not include analytics, telemetry, advertising SDKs, remote logging, or network code for sending browsing data to a server.

## What the Extension Can Access

When a user grants website access in Safari, the content script can read the page structure on those websites. This includes visible links, buttons, form controls, media controls, element positions, and the current page URL.

The extension uses this access to:

- draw keyboard hint labels near visible targets;
- focus or click the selected target after a hint is typed;
- move the current page with keyboard shortcuts;
- copy the current page URL when the user presses the URL copy shortcut;
- switch tabs or open a selected link in a new tab.

## What the Extension Does Not Collect

The extension does not:

- send page content, browsing history, URLs, keystrokes, or form values to an external server;
- store browsing history;
- read cookies;
- use analytics or telemetry;
- record typed text from input fields;
- sync settings to a developer-controlled backend.

Settings are intended to be stored in Safari extension storage on the user's device.

## Website Access Modes

Safari controls which websites an extension can access. For privacy-sensitive use, users should grant access only on the websites where they want keyboard navigation.

The extension should also provide an in-extension allowlist/blocklist so users can disable keyboard navigation on sites with heavy native keyboard shortcuts, such as document editors or web apps.

## Local File Access

The development build supports local `file:` HTML pages. This is useful for generated reports and local documentation, but local file access is privacy-sensitive because local documents can contain private information.

For App Store distribution, local file support should either:

- be removed from the default public manifest; or
- be clearly documented as an optional capability that only works when the user explicitly grants local file access in Safari.

## App Review Note Draft

This app contains a Safari Web Extension for keyboard-first page navigation. The extension reads visible page elements only on websites where the user grants Safari extension access. Page structure is processed locally to display keyboard hint labels and run keyboard commands. The app does not send page content, browsing data, shortcut activity, or form values to any external server.
