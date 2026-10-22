<!--
Check the README's current maintenance notice before submitting code changes.
For a possible vulnerability, follow SECURITY.md before posting details publicly.
Use invented examples. Never include credentials, real grades, copied account
pages, browser captures, or saved-settings exports.
-->

## Problem and change

What user-facing problem does this address, what changes, and what will users see or be able to do? Link a related issue if there is one; an issue is not required for a small correction.

## Verification

List the checks you actually ran and their results. State “not run” where appropriate, with any remaining limitation.

- Checker tests: `node --test tests/check-userscripts.test.mjs`
- Syntax and basic metadata: `node scripts/check-userscripts.mjs`
- Whitespace/diff review: `git diff --check`
- Affected behavior or documentation: describe the inputs/steps, expected result, and observed result.

Use the relevant [feature checks in CONTRIBUTING.md](https://github.com/sodium-qed/aeries-playground/blob/main/CONTRIBUTING.md#verify-the-behavior-you-change). Distinguish numerical examples, synthetic page fixtures, mocked network/player checks, and live browser verification. The checker tests do not test Playground's features.

## Documentation and remaining limits

Identify the guides or control text updated and any behavior still unsupported or unverified. If page access, permissions, storage, external requests, update behavior, or safeguards changed, identify the matching changes to the userscript's opening explanation and SECURITY.md.

For documentation work, check links, control names, source behavior, and release availability. Identify source-comment or license-metadata edits separately from executable changes. Keep planned features labeled as planned and a published prerelease distinct from stable Latest; `main` may differ from a tagged asset. Documentation work must not create or republish releases, tags, or assets, and does not require an `@version` bump.

## Before submitting

- [ ] The contribution contains no real student data, credentials, logged-in URLs, copied account pages, or saved-settings exports.
- [ ] I have the right to offer this contribution under the repository's license and have preserved applicable copyright, attribution, and third-party notices.
- [ ] The description separates completed checks from assumptions and does not claim zero risk or an independent audit.

Keep the change focused. See [CONTRIBUTING.md](https://github.com/sodium-qed/aeries-playground/blob/main/CONTRIBUTING.md) for first-contribution steps, testing limits, and release guidance.
