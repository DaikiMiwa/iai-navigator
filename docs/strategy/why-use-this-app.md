# Why Users Should Choose This App

This English document is canonical. The Japanese translation lives at `docs/ja/strategy/why-use-this-app.md`.

## SCQ-A

**Situation**:
Safari users who prefer keyboard-first browsing want a fast way to choose links and move around pages with very few keystrokes. The desired core experience is Vimium-like: press `f` to show link hints, type the displayed hint to open a link, and use `h/j/k/l` plus `gg` / `G` for page movement.

**Complication**:
Existing options may be too broad, too heavy, or raise maintenance concerns for some users. Vimlike is powerful, but its large command set and settings surface can feel complex when the user only wants simple link and page movement. Vifari uses Hammerspoon and macOS accessibility automation, which makes setup heavier for users who want a normal Safari extension. Vimari is the closest fit, but its public release and code activity are old enough that some users may worry about long-term maintenance.

**Question**:
Why should a Safari user who wants Vimium-like navigation choose this app?

**Answer**:
This app is for users who want the core Safari experience of choosing links and moving around pages from the keyboard, delivered as a small, understandable Safari extension rather than a broad browser automation suite.

## Open Questions

- **Messaging tone**: User-facing copy should describe fit differences instead of strongly criticizing competitors.
- **Use cases**: The current target use cases are everyday browsing, reading documentation, and research. App Store copy, workplace adoption, and iPad support may need separate positioning.
- **Evidence level**: The current rationale is based on feature scope and competitor comparison. Vimari's public update history has been checked through public GitHub data, but this positioning has not yet been validated through user interviews or usage data.

## Logic Tree

**Claim: Safari users who want a minimal Vimium-like navigation experience should choose this app.**

1. **It focuses on the necessary operations**
   - `f` can show hints for links currently visible in the viewport.
   - Typing the complete hint fires the link's normal click behavior in the current tab.
   - `h/j/k/l` provide small directional scroll steps, and `gg` / `G` move to the top or bottom of the page.
   - Tab commands, history commands, search commands, custom scripts, and detailed settings are outside the MVP.

2. **It is easier to understand than broader extensions**
   - Vimlike is powerful, but its command set and settings surface can feel complex for users who only want link and page movement.
   - This app limits itself to choosing links and moving around pages, so there are fewer keys to learn.
   - A smaller feature set creates clearer expectations and fewer surprises in everyday use.

3. **It does not require external automation such as Hammerspoon**
   - Vifari uses Hammerspoon and macOS accessibility automation, which increases the psychological and technical cost of setup.
   - This app runs as a Safari Web Extension, so users can understand it as something they load into Safari.
   - The app stays scoped to page-level behavior inside Safari rather than controlling the broader system.

4. **It should be easier to trust and maintain**
   - Vimari is a close alternative, but as of 2026-05-24 its latest GitHub release is `v2.1.0` from 2020-09-10, and the latest commit on its default branch is from 2021-04-12.
   - Safari changes with macOS and browser updates, so an extension with little visible recent activity can create compatibility and maintenance concerns.
   - This app aims to be a small extension built for current Safari, with visible maintenance activity.
   - The MVP does not include telemetry, settings sync, custom script execution, or broad browser automation.
   - The main behavior is limited to visible link detection, hint display, click activation, and page movement.
   - A small scope makes behavior easier for users and contributors to inspect.

## Logic Check

- **Q/A fit**: The question asks why users should choose the app. The answer is that it provides a lightweight Safari extension focused on the core navigation actions.
- **So what?**: Users who find Vimlike too broad, Hammerspoon-based automation too heavy, or older extensions concerning get a focused alternative.
- **Why so?**: The feature scope is small, the setup model is a Safari extension, the interaction surface is limited to link selection and page movement, and the project can present visible maintenance activity.
- **MECE check**: The first-level branches are feature fit, understandability, setup simplicity, and trust/maintainability. They overlap slightly, but represent distinct user-value angles.

## Messaging Notes

- "You should use this app" can sound too forceful. Prefer "who this app is for" or "why users may choose this app."
- Avoid saying "Vimlike is too complex" as a general judgment. Use "Vimlike is powerful, but may feel complex for users who only want simple link movement."
- Avoid saying "Hammerspoon is too much" in polished copy. Use "some users may not want to introduce an external automation layer."
- Avoid saying "Vimari is old" without context. Use "its public release and code activity are old enough to raise continuity concerns for some users."

## Executive Summary

This app is for Safari users who want Vimium-like keyboard navigation without adopting a broad extension or an external automation layer such as Hammerspoon. The MVP focuses on `f` link hints, current-tab link activation, `h/j/k/l` scrolling, and `gg` / `G` page movement.

The reason to choose this app is not breadth; it is restraint. Vimlike is powerful, but may feel complex when the user only wants simple link and page movement. Vifari is powerful too, but its Hammerspoon-based architecture creates a heavier setup model for users who want a Safari extension. Vimari is the closest alternative, but its public release and code activity are old enough to make continuity a concern for some users. This project aims to occupy the space between them: small, understandable, inspectable, and maintained for current Safari.

The most natural positioning is therefore: "keyboard-first link selection and page movement for Safari, without the weight of a full command suite." Near-term work should prioritize stability, clarity, and low-surprise everyday behavior over adding tab commands or detailed settings too early.
