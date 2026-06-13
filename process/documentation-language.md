# Documentation Language Policy

English is the canonical language for this project.

The project may provide Japanese translations for users and contributors, but those translations are derived from the English source. If the English and Japanese documents disagree, the English document is the source of truth.

## Structure

- Canonical English documents stay at the repository root or under `docs/`.
- Japanese translations live under `docs/ja/`.
- Japanese translations should link back to the English source document.

## Update Workflow

When documentation changes:

1. Update the English source first.
2. Update the Japanese translation in the same pull request when the document is user-facing or contributor-facing.
3. If the Japanese translation cannot be updated in the same pull request, mention that clearly in the pull request.
4. Do not introduce new behavior, commands, permissions, or process rules only in Japanese.

## Translation Style

- Translate meaning, not word order.
- Keep command names, file names, keyboard shortcuts, and code identifiers unchanged.
- Use natural Japanese for user-facing explanations.
