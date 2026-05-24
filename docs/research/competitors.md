# Competitor Notes

Research date: 2026-05-24

## Executive Takeaway

This project should not claim that Vim-style Safari navigation is new. Vimari, Vifari, and Vimlike already validate the category.

The clearer differentiation is product shape:

- **Vimari** is the closest Safari-extension ancestor, but its visible public maintenance history is old enough to raise continuity concerns for some users.
- **Vifari** is powerful and inspectable, but it is a Hammerspoon/macOS accessibility automation tool rather than a normal Safari extension.
- **Vimlike** is the broadest and most productized option, but its breadth can be more than users need when they only want the core navigation loop.
- **This project** should be positioned as a small, open, current Safari Web Extension for visible page navigation: link/control hints, predictable page movement, and a deliberately compact command set.

The core message is not "more Vimium than the others." It is "the smallest understandable Safari extension that covers the daily keyboard-navigation loop."

## Comparison Matrix

| Project | Product model | Strong fit | Trade-off for the target user | Intended difference for this project |
| --- | --- | --- | --- | --- |
| This project | Public Safari Web Extension | Users who want visible link/control hints and page movement with a small command set | Early project; fewer commands than established tools | Small, inspectable, current, low-surprise Safari extension |
| Vimari | Open-source Safari extension inspired by Vimium | Users who want a lightweight Vimium-style Safari extension with established defaults | Public release and code activity are old enough to raise maintenance concerns | Similar architectural lane, but with active visible maintenance and a narrower first-party scope |
| Vifari | Open-source Hammerspoon/Lua automation for Safari | Users who already trust Hammerspoon and want Safari UI/system reach beyond content scripts | Requires Hammerspoon, accessibility permissions, and a system automation mental model | Stay inside the Safari Web Extension model and avoid external automation for the core experience |
| Vimlike | App Store Safari extension across Apple platforms | Users who want a polished, broad command suite, settings, sync, custom bindings, scripts, and many built-in actions | The product surface can feel broad when the user only wants link hints and page movement | Avoid competing on breadth; compete on restraint, clarity, and auditability |

## Positioning Boundaries

This project should explicitly avoid three weak claims:

- **Not "the only Vim-like Safari extension"**: that is false.
- **Not "the most powerful Safari keyboard tool"**: Vifari and Vimlike are broader in different ways.
- **Not "a full Vimium clone"**: cloning every command would erase the project's clearest advantage.

The stronger claims are:

- It is a Safari Web Extension, not a system automation layer.
- It starts with visible page-level navigation rather than browser-wide automation.
- It keeps the command set small enough that users can understand the whole behavior.
- It treats new target types, such as form controls and media controls, as bounded categories rather than arbitrary click-anything expansion.
- It keeps documentation, issues, PRs, and tests public so users can inspect the direction of the project.

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
- Our MVP should stay smaller: current-tab link activation, page movement, and only the next commands that preserve the compact mental model.

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
- The fair comparison is setup and runtime scope, not capability. Vifari can reach places a Web Extension cannot; this project should be easier for a Safari-extension user to understand and install.

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
- It also creates an opening for a smaller, auditable extension focused on the daily keyboard-navigation loop rather than a broad configurable command suite.

## MVP Implications

- Keep the MVP intentionally narrow: `f` link hints, current-tab click activation, `h/j/k/l`, `gg`, and `G`.
- Do not compete on breadth yet. Vimlike and Vimari already cover many commands.
- Compete on simplicity, low surprise, inspectable behavior, and active maintainability.
- Treat new-tab activation, tab control, history, search, form controls, media controls, settings, and custom scripts as explicit phases.
- Add new capabilities only when they reinforce the core promise: keyboard-first page navigation that remains easy to explain.
