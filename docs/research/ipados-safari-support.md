# iPadOS Safari Support Spike

Research date: 2026-05-24

## Executive Takeaway

The current Web Extension source package is likely portable to iPadOS Safari, but the current Xcode wrapper is macOS-only. iPadOS support should be treated as a packaging and device-validation follow-up, not as a change to the macOS MVP command model.

Apple presents Safari extensions as available on iPhone, iPad, and Mac, and says Safari web extensions can be converted into an Xcode project configured with a macOS app and/or an iOS or iPadOS app. Apple also says an existing macOS Safari web extension can be upgraded for iOS and iPadOS by rerunning the command-line converter with `--rebuild-project`.

## Current Project Fit

The extension logic is mostly page-level content-script behavior:

- Link and control hints run inside normal web pages.
- `h/j/k/l`, `u/d`, `gg`, and `Shift+G` use DOM scroll APIs.
- `Shift+H` and `Shift+L` use `window.history`.
- `Shift+J/K` and new-tab hint activation depend on WebExtension `tabs` messaging through the background script.

That shape is a reasonable starting point for iPadOS because most commands operate inside web content. The parts that need the most validation are external-keyboard event delivery and tab APIs.

## Required Project Changes

Minimum expected changes before iPadOS can be claimed:

- Regenerate or rebuild the Safari Web Extension Xcode wrapper with iOS/iPadOS support.
- Add iOS/iPadOS app and extension targets, signing settings, bundle identifiers, icons, and App Store/TestFlight metadata.
- Confirm the generated iOS/iPadOS extension target includes the same `web-extension/` package files.
- Decide whether local development uses Xcode/device deployment, TestFlight, or App Store Connect packaging.
- Add manual test instructions for enabling the extension in iPadOS Safari settings.

The current `manifest.json` should not need a broad rewrite only because of iPadOS, but every permission and API used by the background script should be checked on device.

## Command Validation Matrix

| Command area | Expected iPadOS status | Validation needed |
| --- | --- | --- |
| Link/control hints with `f` and `Shift+F` | Likely to work in normal web pages | External keyboard event delivery, hint overlay layout, new-tab behavior |
| Page movement with `h/j/k/l`, `u/d`, `gg`, `Shift+G` | Likely to work in normal web pages | External keyboard event delivery, scroll behavior, PDF behavior |
| History with `Shift+H/L` | Likely to work where page history exists | Page-level keyboard handling and Safari history behavior |
| Tab switching with `Shift+J/K` | Risky | Content scripts may receive keys only inside page focus; browser-level surfaces need separate command fallback |
| Browser-level fallback shortcuts | Needs Safari/iPadOS validation | Whether WebExtension `commands` shortcuts are exposed and ergonomic with external keyboards |
| Clipboard command `yy` | Needs validation | Clipboard permission and user-gesture behavior on iPadOS |

## Follow-Up Work

- Create an iPadOS packaging issue once the macOS MVP stabilizes.
- Add a device-test checklist covering at least one current iPadOS release and one external keyboard.
- Split any failed command into a focused follow-up issue rather than widening the MVP.
- Keep iPadOS support out of release claims until a physical-device pass is recorded.

## Open Questions

- Does Safari on iPadOS deliver unmodified letter keydown events such as `f`, `h`, `j`, `k`, and `l` consistently to content scripts when an external keyboard is attached?
- Are `Alt` / Option-based WebExtension command shortcuts discoverable and reliable on iPadOS hardware keyboards?
- Does `tabs.create` with `active: true` match the foreground-tab behavior expected by `Shift+F`?
- Does Safari expose extension shortcut management consistently across iPadOS versions?
- What is the lowest iPadOS version the project is willing to support?
