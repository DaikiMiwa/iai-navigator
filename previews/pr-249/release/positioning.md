# Positioning

The product should be positioned as a Safari-native keyboard navigation app, not as a Vimium clone.

## Core Promise

Control Safari from the keyboard with a private command palette, link hints, tab search, local destination search, available browser data search, and site-aware shortcuts.

## Why This Is Not Just Another Vim-Like Extension

The product can win on areas that matter to Safari users and Japanese users:

- Safari-native packaging: built as a Safari Web Extension inside a Mac app, with App Store distribution and a host app for setup, permissions, settings, and support.
- Local-first privacy: no analytics, no telemetry, no advertising SDKs, no remote logging, and no developer-controlled server for browsing data.
- Clear permission story: explains why website, tab, bookmark, and history access are needed, and lets users control where the extension runs.
- Japanese IME safety: shortcut handling is explicitly tested around composition and confirmation Enter, which is easy to get wrong in keyboard-heavy browser extensions.
- Site-specific control: users can disable or scope keyboard navigation on shortcut-heavy sites such as document editors and web apps.
- Customizable shortcuts and hint appearance: users can avoid conflicts with native site shortcuts and make hints readable for their setup.
- Safari-focused command palette: one palette covers open tabs across windows, local visits, extension commands, direct URLs, web search, and bookmark/history data when Safari exposes it at runtime.
- Practical palette actions: users can copy URLs, copy Markdown links, edit selected URLs, narrow by domain/title/URL, close tab results, and queue background tabs without leaving the palette.
- Modern web target handling: hints cover not only links, but also safe menu triggers, media controls, native form controls, and semantic ARIA-style controls.
- YouTube/media ergonomics: hidden media controls can be revealed before hint collection where Safari and the site allow it.

## Product Language To Use

Use:

- keyboard-first Safari navigation
- private command palette
- local-first browsing workflow
- site-aware shortcuts
- Japanese IME-friendly keyboard handling
- link hints, tab search, local destination search, available bookmark/history search

Avoid:

- Vimium-compatible
- Vomnibar
- Vim clone
- better than Vimium
- replacement for Vimium

## Competitive Message

This is for Safari users who want keyboard speed without giving up App Store distribution, Safari permissions, clear privacy, Japanese IME safety, and per-site control.

The message is not "we copied a Vim workflow." The message is "we made a Safari-native keyboard launcher that respects privacy and works well in real daily browsing."

## Pricing Rationale

A paid version can be justified by bundling reliability and trust, not only by shortcuts:

- Safari-first setup and support.
- Privacy-first local processing.
- Configurable shortcuts and site controls.
- A command palette that replaces repeated tab, local destination, available browser data, and search workflows.
- Japanese IME and shortcut-conflict handling that reduces daily friction.

If monetization moves beyond paid upfront pricing, StoreKit, purchase restoration, review notes, and support docs must be implemented before submission.
