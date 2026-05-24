# Agent Instructions

This repository is intended to become a public GitHub project.

## Package And Tooling

- Use `pnpm`, not `npm` or `yarn`.
- Do not create `package-lock.json` or `yarn.lock`.
- Use Biome for formatting and linting; do not add ESLint or Prettier.
- Edit TypeScript in `src/`; generated JavaScript in `web-extension/` is produced by `pnpm run build:web`.

## Workflow

- Follow GitHub Flow: branch from `main`, make a focused change, open a PR, review, merge, delete the branch.
- Work in a dedicated git worktree for each task. Create the worktree from `main` with its own focused branch before editing files, and leave existing worktrees untouched unless the user explicitly asks otherwise.
- Prefer one issue per user-visible bug, feature, or maintenance task.
- Prefer small PRs linked to issues with `Closes #123` when the PR resolves the issue.
- Keep English documentation canonical.
- Place Japanese translations under `docs/ja/`, derived from the English source.
- Update English first; then update Japanese translations for user-facing or contributor-facing docs.
- If English and Japanese docs disagree, follow the English document.

## Verification

Run before handing off code changes:

```sh
pnpm run check
```

Run on macOS/Xcode changes or Safari extension packaging changes:

```sh
pnpm run build:xcode
```
