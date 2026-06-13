# Contributing

Thanks for helping make this Safari extension small, reliable, and easy to audit.

## Workflow

This project follows GitHub Flow:

1. Open or find an issue before starting non-trivial work.
2. Create a short-lived branch from the latest `main`.
3. Keep the pull request focused on one issue or one coherent change.
4. Link the pull request to the issue with `Closes #123` or `Fixes #123` when applicable.
5. Wait for review and keep discussion in the pull request.
6. Delete the branch after merge.

Use branch names that explain the intent:

- `feat/123-link-hint-filtering`
- `fix/124-input-focus-guard`
- `docs/125-contributing-guide`
- `chore/126-biome-config`

## Development

Use `pnpm`; do not add `npm` or `yarn` lockfiles.

```sh
pnpm install
pnpm run check
```

The TypeScript source lives in `src/`. Safari loads the compiled files in `web-extension/`.

```sh
pnpm run build:web
```

Use Biome for formatting and linting.

```sh
pnpm run lint
pnpm run format
```

ESLint and Prettier are intentionally not used.

## Documentation

English is the source of truth for project documentation. Write or update the English document first, then update the Japanese translation under `docs/ja/` when the document is user-facing or important for contributors.

If the English and Japanese versions disagree, the English version wins. Japanese translations should link back to their English source.

## Contribution License

By submitting a pull request, patch, issue comment containing code or documentation, or any other contribution, you agree to the contribution terms in [LICENSE](LICENSE). In short, you grant the project owner permission to use, modify, relicense, distribute, and commercially ship your contribution as part of this project, including in paid official builds.

## Pull Request Expectations

Before requesting review:

- Rebase or merge the latest `main`.
- Run `pnpm run check`.
- If browser behavior changed, manually test with `manual-test/`.
- If Safari extension packaging changed, run `pnpm run build:xcode` on macOS with Xcode installed.
- Update docs when behavior, commands, permissions, or workflow changes.
- For user-facing documentation changes, update the Japanese translation or call out that the translation still needs an update.

## Issue Expectations

Good issues are specific and actionable. Please use the provided issue forms and include:

- Safari version and macOS version for bugs.
- Clear reproduction steps.
- Expected behavior and actual behavior.
- Screenshots or screen recordings when visual behavior matters.
- Whether the issue happens on normal web pages, PDFs, or both.

## Scope

The project is intentionally minimal. New functionality should preserve the core positioning: link hints and page movement in Safari without becoming a broad browser automation suite.
