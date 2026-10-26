<!--
Check the README maintenance notice before making commits. Already scheduled
maintenance is exempt. For vulnerabilities or data leaks, follow SECURITY.md
before posting publicly. Use invented examples, without account data or exports.
-->

## Problem and change

Describe the problem, what you changed, and the result a user will see. A short before/after example helps. Link a related issue if one exists; a small correction needs no issue first.

## Verification

Replace “Not run” with the result of each check you ran. For anything you could not check, state the limitation. A documentation edit made on GitHub can say that local commands were not run.

| Check | Result |
| --- | --- |
| `node --test tests/*.test.mjs` | Not run |
| `node scripts/check-userscripts.mjs` | Not run |
| `node scripts/check-documentation.mjs` | Not run |
| `git diff --check` | Not run |
| Affected behavior or rendered documentation | Describe the input/steps, expected result, and observed result. |

Use the relevant [developer verification guide](https://github.com/sodium-qed/aeries-playground/blob/main/docs/DEVELOPMENT.md#verify-the-behavior-you-change). Distinguish formula examples, synthetic page fixtures, mocked requests/player checks, and live browser verification. Synthetic source regression tests cover feature behavior without a live browser; the documentation checker does not validate external links, form schema, or rendering.

## Documentation and remaining limits

Name the guides or help text updated and any behavior still unsupported or unverified. Identify source-comment or license-notice edits separately from executable changes. If permissions, page access, storage, external requests, updates, or safeguards change, update the source's opening explanation and SECURITY.md too.

For documentation changes, check control names, links, source behavior, and release availability. Keep plans, published prereleases, stable releases, and `main` distinct. Documentation work does not require an `@version` bump and must not create or republish releases, tags, or assets.

## Before submitting

- [ ] I reviewed the full diff and attachments and confirmed they contain no real student data, credentials, logged-in URLs, copied account pages, or saved-settings exports.
- [ ] I have authority to offer this contribution under the repository's license and have preserved applicable copyright, attribution, and separate third-party notices.
- [ ] The description records actual checks and remaining limits without claiming an independent audit or zero risk.

See [Contributing](https://github.com/sodium-qed/aeries-playground/blob/main/CONTRIBUTING.md) for the first-change path and contribution terms. Keep the change focused.
