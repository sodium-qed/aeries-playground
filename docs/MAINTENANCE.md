# Documentation review and release preparation

This documentation review prepares Aeries Playground for the stable **3.0.0** release planned for **Sunday, October 25, 2026 at 11:59 PM America/Los_Angeles**. That is the planned start of the code audit and release work, not a guarantee that a release will be ready at that instant. The audit must implement and verify fixes before publication.

The October 22 documentation publication does not release 3.0.0. The userscript remains at **2.4.0**, and its calculation, storage, network, and interface logic is unchanged. Updates inside the userscript are explanatory comments, license presentation, and corrected help wording. The public README contributor pause remains in effect until the audit, fixes, verification, and stable release finish. Already scheduled maintenance is exempt.

## Verified starting state

The review started from [`cc52494`](https://github.com/sodium-qed/aeries-playground/commit/cc52494c1876cda5ef910096d9bba893fa385e38) on `main`. The earlier documentation and software work exists in history:

- The planned October 14 documentation update was committed on October 15, Pacific time, as [`23396a4`](https://github.com/sodium-qed/aeries-playground/commit/23396a4).
- The planned October 18 software update was published on October 19 as the [2.4.0 prerelease](https://github.com/sodium-qed/aeries-playground/releases/tag/v2.4.0). Its downloadable asset is the historical release file, not the subsequently edited `main` file.
- [2.3.0](https://github.com/sodium-qed/aeries-playground/releases/tag/v2.3.0) remains a prerelease. At review time, [2.0.0](https://github.com/sodium-qed/aeries-playground/releases/tag/v2.0.0) remains the stable **Latest** release.

No historical release, tag, or asset is replaced by this documentation work. See [available downloads](FEATURES.md#available-release) before choosing an installation.

## Review coverage

Six parallel documentation reviewers inspected the current implementation and their assigned files. The coordinating review integrated their changes, checked cross-file claims, and verified the publication guard. There was no tracked `AGENTS.md`, additional documentation format, package manifest, or build system at the starting revision.

| Documentation-bearing file or source area | Review owner | Outcome |
| --- | --- | --- |
| [README.md](../README.md) | Entry point and structure | Rewritten installation, first use, manual updates, navigation, saved state, removal, and limits; temporary notice preserved. |
| [docs/FEATURES.md](FEATURES.md) | Features and usage | Full control/default inventory, current release distinctions, settings scope, platform limits, recovery, and troubleshooting rewritten against source. |
| [docs/CALCULATIONS.md](CALCULATIONS.md) | Calculation semantics | Formulas, examples, precision, reconciliation, categories, GPA, exclusions, hypothetical edits, ranges, replacements, and weight preview verified and rewritten. |
| [SECURITY.md](../SECURITY.md) | Security and privacy | Permissions, page access, saved data, optional requests, media, update behavior, clearing, residual risks, and reporting rewritten. |
| [LICENSE](../LICENSE) | Licensing | New navigation and interpretation distinguish the operative license from the proposed revision; existing terms and contributor rights retained. |
| [docs/LICENSING.md](LICENSING.md) | Licensing | Licensing scope, full-source review permission, third-party rights, and revision requirements explained. |
| [docs/LICENSE-PROPOSAL.md](LICENSE-PROPOSAL.md) | Licensing | Complete replacement text supplied for review; not represented as effective without the necessary contributor authorization. |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution experience | First contribution, privacy-safe reports, checks, review boundaries, and release workflow explained. |
| [.github/ISSUE_TEMPLATE/bug_report.yml](../.github/ISSUE_TEMPLATE/bug_report.yml) | Contribution experience | Reproduction-oriented form with practical privacy guidance. |
| [.github/ISSUE_TEMPLATE/feature_request.yml](../.github/ISSUE_TEMPLATE/feature_request.yml) | Contribution experience | Easier suggestion form; existing URL retained. |
| [.github/ISSUE_TEMPLATE/config.yml](../.github/ISSUE_TEMPLATE/config.yml) | Contribution experience | Help and security routes added to the issue chooser. |
| [.github/pull_request_template.md](../.github/pull_request_template.md) | Contribution experience | Clear change, validation, privacy, and release questions. |
| [.github/workflows/checks.yml](../.github/workflows/checks.yml) | Contribution experience and coordinator | All explanatory steps reviewed; existing checks retained and run. |
| [.github/workflows/release.yml](../.github/workflows/release.yml) | Coordinator and contribution experience | Fixed-artifact prerelease recovery reviewed; nonmatching automatic pushes now skip publication before any API write. |
| [aeries-playground.user.js](../aeries-playground.user.js): opening explanation, metadata, and license | Security, licensing, coordinator | Privacy explanation rewritten; effective license copy synchronized; current version, permissions, and update metadata retained. |
| Userscript: feature help, labels, tooltips, calculation explanations, and surrounding comments | Features, calculations, security, entry point | Read against surrounding logic; inaccurate explanatory copy corrected; behavioral defects recorded below. |
| [scripts/check-userscripts.mjs](../scripts/check-userscripts.mjs) and [tests/check-userscripts.test.mjs](../tests/check-userscripts.test.mjs) | Contribution experience and coordinator | All comments, test names, and CLI messages reviewed; commands and limited test scope documented accurately. |
| [.editorconfig](../.editorconfig), [.gitattributes](../.gitattributes), and [.gitignore](../.gitignore) | Contribution experience and coordinator | Formatting, line endings, ignored captures, and privacy-warning comments reviewed; retained. |
| [docs/MAINTENANCE.md](MAINTENANCE.md) | Coordinator | Complete coverage, verification limits, and actionable audit handoff recorded. |

## Code-audit handoff

These findings are not fixed by the documentation publication. Synthetic examples use fictional data. Reproduce and evaluate the intended behavior during the October 25 audit before changing code.

| Finding | Source location by function | Evidence and next check |
| --- | --- | --- |
| Final rounding is not used for posted percentage reconciliation | `GradeMath.fromAeries` | Rows `90/100` and `40/50` calculate `86.666…%`; a posted `87%` still fails with a saved nearest-integer rounding rule. Decide how native policy and saved simulation rules should affect reconciliation. |
| Percentage reconciliation does not adapt to displayed decimal places | `GradeMath.fromAeries` | The same rows with a posted `86.7%` fail the fixed `0.011` percentage-point tolerance. Average-scale labels use a different, decimal-aware tolerance. Test coarse percentage labels without accepting genuinely inconsistent totals. |
| Duplicate course keys can discard a usable grade | `OverallMath.summarize` | A blank first card and an `A` second card with the same key yield zero included courses. Check actual duplicate layouts and select a consistent usable record without double-counting. |
| Count-off rows can still block a scenario | `labScoreState`, `labModel` | Malformed score input remains invalid when Count is off; a scored hypothetical row without a name/category also blocks. Define and test whether exclusion should suppress this validation. |
| Range-only categories can be missed by profile validation | `buildGradingProfileUI` / `activeCategories` | The active-category check inspects single-score drafts rather than enabled ranges, allowing a missing weight that the later range calculation rejects. Reproduce through the UI. |
| Existing hypothetical-score colors disregard one display preference | `renderGradeLabResult` | Existing edited scores and totals receive threshold colors while `detailsColors` is off; added-row coloring checks the preference. Verify intended consistency in a browser. |
| Immediate settings saves may not immediately surface failure | `setToggle`, GPA checkbox handlers, `persist`, `renderTab` | Some handlers ignore `persist()`'s return value; the stored error is shown when the dialog is rendered again. Test storage failure and reset-marker mismatch with the Settings tab already open. |
| Schedule timeouts need manager/browser verification | `requestScheduleJSON` | The source requests timeouts with anonymous requests. Tampermonkey documents fetch-mode timeout limitations in Chrome; verify cancellation and hung transfers rather than assuming the timeout always fires. |

The hidden KBAR frame has no accessible native playback/status controls; Settings supplies separate controls and a YouTube fallback. Dashboard numeric ratings do not preserve the replaced letter in a visible tooltip. These are documented current limitations, not promised fixes. The open feature issue's abbreviated request requires clarification before implementing any inferred feature.

Do not place exploitable vulnerability details or real Aeries records in this public handoff. Use the [private security-reporting route](../SECURITY.md#report-a-vulnerability-privately).

## Publication safeguards and verification limits

The current release workflow is still a recovery publisher for one frozen 2.4.0 artifact. An automatic push whose userscript does not match its approved SHA-256 and size exits successfully without creating a release, changing a tag, or uploading an asset. Manual recovery retains the strict mismatch failure. A later release requires an explicitly reviewed workflow/artifact update; changing a version label alone does not prepare a release.

Verification completed before publication:

- All **11 checker tests** passed on Node.js 24, and the userscript passed syntax/basic-metadata checking. `git diff --check` passed.
- A temporary source-function harness passed **137 arithmetic, parsing, and boundary assertions**, including reproductions of the unfixed limitations above. The contribution guide's fictional grade and weight-preview example was checked separately. These are review checks, not a newly committed regression suite.
- All **130 local Markdown file/anchor links** resolved across nine Markdown files. The issue forms and chooser passed YAML parsing and structural checks against GitHub's documented schema. Markdown headings, tables, and code blocks were parsed for structure; the signed-in GitHub form UI was not exercised.
- The complete embedded license matches `LICENSE`; the authoritative Version 1.0 terms and README maintenance block match the starting revision exactly.
- Exact source comparison permits only the opening comment changes and **19 reviewed help-copy substitutions**. All other executable source and metadata, including `@version`, are unchanged.
- The release workflow's Python compiled. Tests of the frozen original and a comment-edited file confirmed automatic-push skip and strict manual-recovery behavior before external commands or API writes.

These checks do not exercise a signed-in Aeries page, browser layout, school-specific policies, live schedule feeds, media playback, or every userscript-manager implementation. They are not a security certification, legal determination, or proof of zero defects. The complete license proposal remains pending the necessary rights-holder authorization; see [licensing](LICENSING.md).

The October 25 release work must fetch the latest `main`, reproduce the findings, implement and test fixes, reconcile any concurrent changes, prepare the actual stable artifact, and verify publication before removing the temporary README notice. If any required phase is blocked or incomplete, retain the notice and report the actual status.
