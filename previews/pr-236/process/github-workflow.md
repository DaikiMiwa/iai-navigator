# GitHub Workflow

This project uses GitHub Flow for public development.

## Branches

- `main` is always the integration branch.
- Work happens on short-lived topic branches.
- Branch names should use a type prefix and, when available, the issue number:
  - `feat/123-link-hints`
  - `fix/124-input-focus`
  - `docs/125-readme`
  - `chore/126-tooling`
- Delete branches after merge.

## Issues

Create an issue when work needs discussion, prioritization, reproduction, or public tracking.

Use one issue for one problem. A good issue has:

- Clear title.
- Current behavior or user problem.
- Expected behavior or desired outcome.
- Reproduction steps for bugs.
- Acceptance criteria for features or tasks.
- Environment details when relevant.

Suggested labels:

- `type: bug`
- `type: feature`
- `type: docs`
- `type: chore`
- `area: hints`
- `area: page-movement`
- `area: safari-extension`
- `status: needs-triage`
- `good first issue`

## Pull Requests

Pull requests should be small enough to review comfortably.

Every PR should include:

- Summary of the change.
- Linked issue, if any.
- Tests or manual checks performed.
- Screenshots or recordings for visible behavior changes.
- Notes about Safari permissions, privacy, or security impact.

Use draft PRs for early feedback. Mark the PR ready only when it has a clear review target and passes local checks.

## Merge Policy

Before merge:

- `pnpm run check` should pass.
- Behavior changes should be manually tested on the manual test page.
- Safari packaging changes should pass `pnpm run build:xcode` on macOS.
- Documentation should be updated when behavior, commands, or process changes.

Prefer squash merge for a clean public history unless preserving individual commits adds clear review value.
