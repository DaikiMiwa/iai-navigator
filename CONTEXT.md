# Safari Keyboard Navigation Extension

A Safari extension for keyboard-first page navigation inspired by Vimium, without aiming for Vimium compatibility.

## Language

**Safari Keyboard Navigation Extension**:
A small, auditable Safari browser extension that gives users keyboard-first navigation across web pages without broad browser automation. It is inspired by Vimium's interaction style, but is not a Safari port of Vimium and does not promise Vimium command compatibility.
_Avoid_: Vimium port, Vimium-compatible Safari extension, Hammerspoon automation, full browser automation suite

**Hint Target**:
A page element that is at least partly visible within the current viewport and that can receive a Hint. In the MVP, Hint Targets are Link Targets and native Form Control Targets only. Arbitrary non-native clickable elements, hidden elements, fully offscreen elements, disabled controls, and destructive page actions are not Hint Targets.
_Avoid_: Click target, action target, selectable element

**Link Target**:
A Hint Target backed by a page link. In the MVP, each link is at most one Link Target even if it spans multiple visual rectangles, and Link Targets may include `href="#"` and `javascript:` links while excluding fully offscreen links, hidden links, arbitrary buttons, form controls, or destructive page actions.
_Avoid_: Click target, action target, selectable element

**Form Control Target**:
A Hint Target backed by a visible, enabled native form control, currently `button`, `input`, `select`, and `textarea` elements. Activating a text-entry Form Control Target focuses the control and places the caret at the end where Safari exposes text selection. Activating other Form Control Targets fires their normal click/focus behavior. Hidden, disabled, fully offscreen, and `input type="hidden"` controls are not Form Control Targets.
_Avoid_: Arbitrary input target, editable action, custom onclick target

**Hint**:
A short alphabetic key sequence shown next to a Hint Target while hint mode is active. Hints use home-row letters, starting with `asdfghjkl`, rather than numbers or the full alphabet, are assigned in top-left to bottom-right visual order, maximize one-letter Hints when possible, and never allow one Hint to be the prefix of another active Hint.
_Avoid_: Shortcut number, target id, label

**Hint Mode**:
A temporary keyboard state started from the page body, where visible Hint Targets receive Hints and typed letters narrow or activate a target. As the user types, non-matching Hints are hidden. Hint Mode does not start while the user is typing in text inputs, textareas, or editable page content, and it can be cancelled with Escape. Pressing Escape while focused in text-editing content blurs that editable target so normal page focus commands can resume.
_Avoid_: Selection mode, command mode

**Hint Activation**:
The act of choosing a Hint Target by typing its complete Hint. In the MVP, Hint Activation fires a Link Target's normal click behavior in the current tab, focuses a text-entry Form Control Target with the caret at the end where possible, or fires normal click/focus behavior for another Form Control Target. It does not auto-activate on partial matches, open new tabs, or open background tabs.
_Avoid_: Click emulation, tab opening

**Page Movement Command**:
A keyboard command that moves the current page view without choosing a Link Target. Page Movement Commands are `h`, `j`, `k`, and `l` for smooth small directional scroll steps that can repeat while held, `u` and `d` for smooth half-page vertical movement, `gg` for moving to the top after two quick `g` presses, and `G` for moving to the bottom of the page. Page Movement Commands do not run while the user is typing in text inputs, textareas, or editable page content.
_Avoid_: Browser history command, link command

**History Navigation Command**:
A keyboard command that moves the current tab through browser history without choosing a Link Target. History Navigation Commands are `H` for back and `L` for forward. They do not run while Hint Mode is active or while the user is typing in text inputs, textareas, selects, or editable page content.
_Avoid_: Page Movement Command, horizontal scroll command

**Reload Command**:
A keyboard command that reloads the current page from normal page focus. The Reload Command is `r`. It does not run while Hint Mode is active or while the user is typing in text inputs, textareas, selects, or editable page content.
_Avoid_: Browser refresh shortcut, hard reload, cache bypass

**Tab Switching Command**:
A keyboard command that activates a neighboring browser tab without choosing a Link Target. Tab Switching Commands are `Shift+J` for the tab on the left and `Shift+K` for the tab on the right. They do not run while Hint Mode is active or while the user is typing in text inputs, textareas, selects, or editable page content.
_Avoid_: Page Movement Command, full tab management command

**Supported Web Page**:
A normal `http` or `https` web page where Hint Mode, Page Movement Commands, History Navigation Commands, Reload Commands, and Tab Switching Commands may run. Content scripts run early and in all frames so page-level commands still work on pages that focus embedded frames or install their own keyboard handlers during load.
_Avoid_: Any browser page, local HTML page

**Supported PDF**:
A PDF document opened in Safari, whether remote or local, where Page Movement Commands may run but Hint Mode does not. PDF links are not Link Targets in the MVP.
_Avoid_: PDF web page, PDF hint target

## Example Dialogue

Dev: Are we building a Vimium port for Safari?

Domain expert: No. We are building a Safari Keyboard Navigation Extension. It should feel Vimium-like for core navigation, especially link hinting, but it does not need to copy every Vimium command.

Dev: Are we trying to match Vimlike's breadth or Vifari's macOS automation power?

Domain expert: No. The project should stay small and auditable: a focused Safari extension, not a broad command suite or external automation layer.

Dev: Does pressing `f` let users activate every clickable thing on the page?

Domain expert: No. In the MVP, `f` exposes Hint Targets only: visible Link Targets and native Form Control Targets in the current viewport.

Dev: If a link wraps across two lines, does it receive two Hints?

Domain expert: No. One link is one Link Target and receives at most one Hint.

Dev: Are target labels numeric?

Domain expert: No. They are Hints: short alphabetic key sequences displayed next to Link Targets, generated from home-row letters and assigned in top-left to bottom-right visual order.

Dev: Does pressing `f` always start Hint Mode?

Domain expert: No. It starts from normal page focus only. If the user is typing into editable content, `f` remains text input.

Dev: How does the user leave Hint Mode without navigating?

Domain expert: Press Escape. The MVP does not need editable Hint input with Backspace.

Dev: What happens after the user types a full Hint?

Domain expert: Hint Activation fires a chosen Link Target's normal click behavior in the current tab, focuses a text-entry Form Control Target, or fires click/focus behavior for another Form Control Target.

Dev: Does `f` target every form control?

Domain expert: It targets visible, enabled native form controls such as text inputs, textareas, checkboxes, radios, buttons, and selects. Disabled, hidden, offscreen, and `input type="hidden"` controls are excluded.

Dev: If only one Hint remains after partial input, does it activate automatically?

Domain expert: No. Hint Activation requires typing the complete Hint.

Dev: Do `h` and `l` move browser history?

Domain expert: No. They are Page Movement Commands for horizontal scrolling. Browser history commands are outside the MVP.

Dev: How does the user move through browser history?

Domain expert: Use History Navigation Commands: `H` moves back and `L` moves forward, as long as the user is not typing and Hint Mode is not active.

Dev: Do `Shift+J` and `Shift+K` scroll the page or type into inputs?

Domain expert: No. From normal page focus, `Shift+J` and `Shift+K` are Tab Switching Commands for neighboring tabs. While the user is typing into editable content, they remain normal text input.

Dev: Can Page Movement Commands fire while the user is typing?

Domain expert: No. Like Hint Mode, they only run from normal page focus.

Dev: Does the MVP support links inside PDFs?

Domain expert: No. PDFs only support Page Movement Commands. PDF links are not Link Targets.
