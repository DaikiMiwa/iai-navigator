# Competitor Notes

Research date: 2026-05-24

## Vimari

Source:
- https://github.com/televator-apps/vimari
- https://apps.apple.com/us/app/vimari/id1480933944?mt=12

Positioning:
- Open-source Safari extension inspired by Vimium.
- Distributed through the Mac App Store and GitHub releases.
- Mac-only.
- As of 2026-05-24, the latest GitHub release is `v2.1.0`, published on 2020-09-10, and the latest commit on the default branch is from 2021-04-12.

Relevant behaviors:
- `f` opens link hints in the current tab.
- `F` opens link hints in a new tab.
- `h/j/k/l` scroll left/down/up/right.
- `gg` and `G` move to page top/bottom.
- Supports smooth scrolling, configurable hint characters, scroll size, excluded URLs, normal/insert mode, and extra detection by cursor style.

Notes for this project:
- Vimari is the closest architectural comparator because it is a Safari extension.
- It is broader than our MVP: history, tabs, reload, new tab, close tab, settings, normal/insert mode.
- Its apparent maintenance age is a user-facing concern: even if the app still works, users may hesitate to depend on a Safari extension that has not had recent public code or release activity.
- Our MVP should stay smaller: current-tab link activation, page movement, no settings, no tab commands.

## Vifari

Source:
- https://github.com/dzirtusss/vifari

Positioning:
- Open-source Hammerspoon/Lua tool for Safari keyboard navigation.
- Not a browser extension; uses macOS accessibility automation.
- Installable through Homebrew or manual Hammerspoon setup.

Relevant behaviors:
- `f` shows marks and jumps in the same window.
- `F` shows marks and jumps in a new window.
- `h/j/k/l` scroll left/down/up/right.
- `gg/G` scroll to top/bottom.
- Has insert mode, forced unfocus, tab navigation, URL copying, mouse positioning, and customizable mappings.

Notes for this project:
- Vifari's differentiator is avoiding Safari extension APIs entirely.
- It can work on Safari UI surfaces where content scripts cannot, but it requires Hammerspoon/accessibility setup.
- Our project should not copy this architecture for the MVP because the goal is a Safari extension loaded in Safari.

## Vimlike

Source:
- https://www.jasminestudios.net/vimlike/
- https://apps.apple.com/us/app/vimlike/id1584519802?platform=mac

Positioning:
- Safari extension for Mac, iPad, iPhone, and Vision.
- Distributed through the App Store.
- Appears more productized and actively maintained than Vimari.

Relevant behaviors:
- `f` toggles links; `shift+f` opens a link in a new tab.
- `h/j/k/l` scroll left/down/up/right.
- `gg` and `shift+g` move to page top/bottom.
- Includes many commands beyond MVP: half-page movement, history, tabs, search bar, reader view, link search, video controls, dark mode, help, website-specific settings, iCloud setting sync, custom key bindings, and scripts.
- App Store privacy listing says the app does not collect data.

Notes for this project:
- Vimlike is the strongest user-facing competitor.
- It validates demand for a polished Safari vim-like experience.
- It also creates an opening for a smaller, auditable, minimal extension focused only on link hints and page movement.

## MVP Implications

- Keep the MVP intentionally narrow: `f` link hints, current-tab click activation, `h/j/k/l`, `gg`, and `G`.
- Do not compete on breadth yet. Vimlike and Vimari already cover many commands.
- Compete on simplicity, low surprise, inspectable behavior, and active maintainability.
- Treat settings, new-tab activation, tab control, history, and search as explicit later phases.
