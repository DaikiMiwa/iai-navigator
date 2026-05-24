# Paid App Roadmap

This English document is canonical. The Japanese translation lives at `docs/ja/strategy/paid-app-roadmap.md`.

Planning date: 2026-05-24

## SCQ-A

**Situation**:
This project is becoming a small, public Safari Web Extension for keyboard-first page navigation. The current product promise is focused: visible hints, predictable page movement, lightweight tab and history actions, and a small command set that is easier to inspect than broad Vimium-like suites.

**Complication**:
An app that can earn revenue needs more than a working extension. Users must understand why it is worth paying for, trust that it will keep working across Safari updates, receive enough polish and support to reduce purchase anxiety, and see App Store metadata that accurately reflects the product. Apple also requires App Review readiness, a clear privacy posture, and the right paid-app or In-App Purchase setup before the app can be sold.

**Question**:
What should be done next to turn this project into a credible paid App Store product?

**Answer**:
Build toward a paid v1 by finishing the reliable daily-navigation loop first, then adding just enough product surface, packaging, App Store readiness, support, and launch feedback loops to justify payment. Do not expand into a broad command suite before the core extension is dependable, documented, and easy to buy with confidence.

## Working Assumptions

- The first commercial target is macOS Safari.
- iPadOS support is a follow-up unless device testing proves the current Web Extension package is ready.
- The public repository remains a trust signal rather than a problem. Revenue comes from convenient App Store distribution, signing, updates, documentation, and support.
- The initial paid model should be simple. Prefer either a paid upfront app or a free app with one non-consumable full unlock, before considering subscriptions.
- The app should avoid telemetry by default. If diagnostics are added later, they must be opt-in, documented, and unnecessary for core behavior.

## Current Baseline

The product already has a useful foundation:

- Link, form-control, and semantic custom-control hints.
- New-tab hint activation.
- Smooth page movement and half-page movement.
- Top/bottom movement.
- Back/forward history commands.
- Neighbor tab switching.
- URL copy.
- In-page search is being handled separately in #32.
- Help overlay, Start Page tab command fallback, navigation-menu hints, iPadOS spike, and bookmark/history open-command spike are in draft PRs or separate work.

The biggest current gap is not a single missing feature. It is product readiness: stable behavior on real sites, settings and onboarding, App Store packaging, QA coverage, support process, and launch positioning.

## Revenue Model Recommendation

Start with a simple one-time purchase model unless user research strongly indicates subscription value.

Recommended sequence:

1. **Paid upfront app**
   - Best fit for a small utility with no server costs and no ongoing content service.
   - Simple for users to understand.
   - Avoids StoreKit implementation work for v1.

2. **Free app with non-consumable Pro unlock**
   - Better if try-before-buy is important.
   - Requires StoreKit, restore purchases, App Review notes, and a clear locked/unlocked feature split.

3. **Subscription**
   - Use only if the product offers ongoing service value such as cloud sync, team/workflow features, or continuous compatibility support that users understand as recurring value.
   - Higher support and expectation burden.

Near-term recommendation: ship v1 as a paid app or plan a small Pro unlock, but do not gate essential accessibility-like navigation behind confusing micro-features. The paid promise should be "a polished, maintained Safari keyboard navigation extension."

## Workstreams

### 1. Core Product Reliability

Goal: users can trust the app on daily browsing pages.

Do next:

- Merge or decide on the open PRs for help overlay, held scroll stutter, Start Page tab fallback, navigation-menu hints, and iPadOS research.
- Finish #32 in-page search and align it with help/manual docs.
- Resolve #20 media controls after #16 navigation-menu hint target rules land, because both touch hint target expansion.
- Create a manual QA matrix covering common page families: documentation sites, GitHub, YouTube, search results, news/articles, web apps with frames, and PDFs.
- Add regression tests around extracted logic for target discovery, command mapping, URL safety, and scroll surface selection.
- Decide which commands are v1 and which are explicitly later, so the app does not sprawl before launch.

Acceptance signal:

- A daily user can browse for 30 minutes on common sites without surprising key capture, broken scrolling, or stuck overlays.

### 2. Product Surface

Goal: the app feels understandable, not like a temporary developer extension.

Do next:

- Choose the final product name, subtitle, and short positioning statement.
- Build a containing app screen that explains how to enable the Safari extension and how to grant website access.
- Add a preferences surface for the few settings that paid users will expect:
  - enable or disable key groups;
  - hint characters;
  - scroll speed or step size;
  - excluded sites;
  - reset defaults.
- Add an in-app command reference that mirrors the help overlay.
- Add a first-run checklist for enabling the extension in Safari.
- Add a support link, privacy link, version number, and diagnostics copy in the containing app.

Acceptance signal:

- A new user can install the app, enable the extension, grant permissions, and understand the first five commands without reading GitHub.

### 3. App Store And Packaging

Goal: the product can be sold and reviewed without surprises.

Do next:

- Decide between paid upfront and In-App Purchase unlock.
- Confirm Apple Developer Program membership, bundle IDs, signing certificates, and App Store Connect app record.
- Accept the Paid Apps Agreement before configuring paid app pricing or In-App Purchases.
- If using In-App Purchase, implement StoreKit, restore purchases, product metadata, review notes, and locked/unlocked states.
- Build release automation for:
  - `pnpm run check`;
  - `pnpm run build:xcode`;
  - archive/export validation;
  - version and build-number updates.
- Prepare App Review notes that explain extension permissions, Safari enablement steps, and any paid unlock behavior.
- Create a release checklist for TestFlight, App Review, and production release.

Acceptance signal:

- A signed archive can be built repeatedly, installed through TestFlight, and reviewed by someone who has never used the repo.

### 4. Privacy, Trust, And Security

Goal: make the paid app easy to trust.

Do next:

- Write a public privacy policy in plain English and Japanese.
- Keep "no browsing data collected, synced, or sold" as a core promise unless the product intentionally changes.
- Document exactly why each Safari extension permission is requested.
- Add a security policy for reporting issues.
- Review all injected DOM and CSS behavior for page interference and cleanup.
- Avoid persistent local storage until there is a clear settings need.
- If site exclusion or settings storage is added, document what is stored locally.

Acceptance signal:

- A privacy-conscious buyer can understand what the extension can see, what it stores, and what it never sends off-device.

### 5. UX Polish

Goal: users feel the app is worth paying for within the first session.

Do next:

- Improve hint label placement near viewport edges and overlapping elements.
- Make overlays visually polished in light/dark pages.
- Ensure all overlays close reliably with `Esc`, scroll, resize, and navigation.
- Add reduced-motion respect where smooth movement or animation is involved.
- Check keyboard layouts and international keyboard behavior for `/`, `?`, `Shift+J/K`, and Option fallback commands.
- Make error states quiet but visible, such as "no matches" in in-page search.

Acceptance signal:

- The app feels calm, predictable, and native enough that users do not think of it as a script pasted into Safari.

### 6. Support And Operations

Goal: paid users have somewhere to go when Safari or websites change.

Do next:

- Create a support page with setup steps, troubleshooting, and contact path.
- Add issue templates for bug reports, site compatibility reports, and feature requests.
- Add a known limitations page for Start Page/browser chrome, PDFs, iframes, YouTube/media controls, and unsupported Safari APIs.
- Define a release cadence and compatibility check cadence after macOS/Safari updates.
- Track top user pain points separately from broad feature requests.

Acceptance signal:

- A user who cannot get the extension working can self-serve the most common fixes or file a useful report in under five minutes.

### 7. Marketing And Launch

Goal: users can discover the app and understand why it exists.

Do next:

- Turn `docs/strategy/why-use-this-app.md` into App Store copy:
  - app name;
  - subtitle;
  - short description;
  - long description;
  - keywords;
  - support URL;
  - privacy URL.
- Prepare screenshots that show the real extension in use, not just a title screen.
- Record a short preview video if it communicates the interaction better than screenshots.
- Build a small product page with:
  - what it does;
  - who it is for;
  - privacy promise;
  - setup steps;
  - changelog;
  - support link.
- Identify launch channels:
  - Safari, Mac, productivity, and keyboard-focused communities;
  - GitHub release notes;
  - personal blog post;
  - short demo clips.

Acceptance signal:

- A keyboard-first Safari user can see the App Store page and quickly answer: "what does this do, why should I trust it, and why is it worth paying for?"

### 8. Business Metrics

Goal: know whether the product can become worth sustaining.

Do next:

- Define a small target model before launch:
  - price;
  - expected Apple commission;
  - annual developer program cost;
  - target number of paid users;
  - refund/support load.
- Track non-invasive public metrics first:
  - App Store impressions;
  - product page views;
  - conversion rate;
  - crashes;
  - ratings and reviews;
  - support emails by category.
- Decide what would make the app worth continuing:
  - revenue threshold;
  - usage feedback;
  - support burden;
  - personal maintenance capacity.

Acceptance signal:

- After launch, the project can decide with evidence whether to invest in settings, iPadOS, media controls, or broader commands.

## Suggested Milestones

### Milestone 1: Paid v1 Foundation

- Merge or close current open PRs.
- Finish #32 or defer it explicitly.
- Finish #20 only if it can stay bounded to media-player surfaces.
- Add settings for hint keys, scroll speed, and excluded sites.
- Add a polished containing app onboarding screen.
- Add privacy policy and support docs.
- Run manual QA on the site matrix.

### Milestone 2: App Store Beta

- Create App Store Connect record.
- Decide and configure paid app or IAP model.
- Prepare screenshots, privacy details, review notes, and support URL.
- Ship TestFlight build to a small group.
- Fix onboarding, permissions, and major site compatibility issues.

### Milestone 3: Paid Launch

- Release the first paid version.
- Publish product page and changelog.
- Monitor reviews, crashes, support requests, and refund signals.
- Keep the launch command set intentionally small.

### Milestone 4: Revenue Expansion

- Add only features that reinforce paid value:
  - reliable media controls;
  - configurable commands;
  - site-specific exclusions;
  - iPadOS support if testing proves it is strong;
  - import/export settings if users ask for it.
- Avoid adding broad scripts, sync, or bookmark/history search until there is a clear platform and product decision.

## Backlog To Create

Create issues for these when the current implementation PR queue is calmer:

- Product name and App Store positioning.
- Containing app onboarding screen.
- Settings: hint characters.
- Settings: scroll speed and movement behavior.
- Settings: excluded sites.
- Privacy policy and permission explanation.
- Support and troubleshooting page.
- Manual QA site matrix.
- App Store screenshot and preview plan.
- App Store Connect setup checklist.
- StoreKit/IAP spike, only if choosing a free-with-unlock model.
- TestFlight beta plan.
- Release checklist.
- Crash/reporting and support triage process.
- App Store review notes template.

## Risks And Decisions

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| The app becomes a broad Vimium clone | Breadth makes the product harder to explain and maintain | Keep v1 command set small; require issue-level rationale for new command families |
| Safari API limitations block expected features | Bookmark/history and browser chrome behavior are limited | Document limitations early; avoid selling unsupported promises |
| Paid users expect customization immediately | Keyboard users often have strong preferences | Ship a small settings surface before launch |
| Review rejection due to unclear paid behavior | App Review needs complete, visible, understandable purchase flow | Keep monetization simple; write explicit review notes |
| Privacy concern from extension permissions | Web extensions can read/modify page content | Write clear permission and privacy docs; avoid telemetry by default |
| Maintenance burden exceeds revenue | Safari and site changes can break behavior | Track support categories and release cadence before expanding scope |

## Source Notes

- Apple says Safari extensions can be built with Xcode and distributed on the App Store in the Extensions category.
- Apple says extensions are reviewed for reliability before distribution.
- Apple says App Store metadata should accurately reflect the app's core experience, and screenshots should show the app in use.
- Apple says apps that unlock features or functionality must use In-App Purchase, and review can be delayed if the business model or purchases are unclear.
- Apple says paid apps and In-App Purchases require the Paid Apps Agreement.
- Apple's Small Business Program can reduce commission to 15% for eligible developers.

Sources:

- Apple: Safari Extensions — https://developer.apple.com/safari/extensions/
- Apple: App Review Guidelines — https://developer.apple.com/app-store/review/guidelines/
- Apple: App pricing and availability — https://developer.apple.com/help/app-store-connect/reference/pricing-and-availability/app-pricing-and-availability
- Apple: Set a price for an In-App Purchase — https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase/
- Apple: Overview for configuring In-App Purchases — https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/
- Apple: App Store Small Business Program — https://developer.apple.com/app-store/small-business-program/
