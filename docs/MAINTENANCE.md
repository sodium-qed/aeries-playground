# Maintenance and release plan

The stable **3.0.0** release work is planned for **Sunday, October 25, 2026 at 11:59 PM America/Los_Angeles**. The code audit starts then; publication follows implementation and verification of the fixes. A scheduled start is not a claim that the software has already passed that audit.

The October 25 documentation redo keeps the userscript at **2.4.0**. It covers every documentation-bearing file and embedded explanation, including the license, privacy policy, contribution flow, and guides. The public README notice governs contributor timing; it does not narrow the scope of either overhaul. That notice remains until the code audit, fixes, verification, and stable release finish. Already scheduled maintenance is exempt.

## Current release state

The redo starts from [`b0dab82`](https://github.com/sodium-qed/aeries-playground/commit/b0dab82fa3451a8c619dfe667f6258d73fbdf671) on `main`. Release state was rechecked on October 25:

- [2.4.0](https://github.com/sodium-qed/aeries-playground/releases/tag/v2.4.0), published October 19, is the current prerelease. Its asset is the historical file; subsequent documentation and help-text changes on `main` do not replace that asset.
- [2.0.0](https://github.com/sodium-qed/aeries-playground/releases/tag/v2.0.0) remains stable **Latest**. Earlier prereleases, including 2.3.0, remain available under their original tags.
- Stable 3.0.0 is planned, not published by the documentation work.

No historical release, tag, or asset is replaced by this documentation work. See [available downloads](FEATURES.md#available-release) before choosing an installation.

## Review coverage

Six parallel reviewers reread the current implementation and every assigned document, followed by integration and cross-file verification. The starting revision contained 21 tracked files and no `AGENTS.md`, package manifest, or additional documentation format. The [documentation index](README.md) is the user-facing entry point; this inventory records review ownership and outcomes.

| Documentation-bearing file or source area | Review owner | Outcome |
| --- | --- | --- |
| [README.md](../README.md) | Entry point and structure | Rewritten installation, first use, manual updates, navigation, saved state, removal, and limits; temporary notice preserved. |
| [docs/README.md](README.md) | Entry point and structure | Added a task-based index of the full documentation set. |
| [docs/FEATURES.md](FEATURES.md) | Features and usage | Full control/default inventory, current release distinctions, settings scope, platform limits, recovery, and troubleshooting rewritten against source. |
| [docs/SETTINGS.md](SETTINGS.md), [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Features and usage | Extracted focused settings/save controls and symptom-based recovery guides; old feature anchors remain useful. |
| [docs/CALCULATIONS.md](CALCULATIONS.md) | Calculation semantics | Formulas, examples, precision, reconciliation, categories, GPA, exclusions, hypothetical edits, ranges, replacements, and weight preview verified and rewritten. |
| [SECURITY.md](../SECURITY.md) | Security and privacy | Permissions, page access, saved data, optional requests, media, update behavior, clearing, residual risks, and reporting rewritten. |
| [LICENSE](../LICENSE), [original grant](../LICENSES/LicenseRef-Aeries-Playground-Open-Source-1.0.txt) | Licensing | Complete current-license restatement replaces the proposal-only presentation; the controlling original grant preserves all existing rights and obligations. |
| [docs/LICENSING.md](LICENSING.md) | Licensing | Practical source-review, modification, distribution, and ownership guidance aligned with the rewritten LICENSE; retired the separate 1.1 proposal. |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution experience | First contribution, privacy-safe reports, checks, review boundaries, and release workflow explained. |
| [docs/DEVELOPMENT.md](DEVELOPMENT.md) | Contribution experience | Setup, actual check coverage, synthetic verification guidance, and release safeguards separated from the short contributor entry point. |
| [.github/ISSUE_TEMPLATE/bug_report.yml](../.github/ISSUE_TEMPLATE/bug_report.yml) | Contribution experience | Reproduction-oriented form with practical privacy guidance. |
| [.github/ISSUE_TEMPLATE/feature_request.yml](../.github/ISSUE_TEMPLATE/feature_request.yml) | Contribution experience | Easier suggestion form; existing URL retained. |
| [.github/ISSUE_TEMPLATE/config.yml](../.github/ISSUE_TEMPLATE/config.yml) | Contribution experience | Help and security routes added to the issue chooser. |
| [.github/pull_request_template.md](../.github/pull_request_template.md) | Contribution experience | Clear change, validation, privacy, and release questions. |
| [.github/workflows/checks.yml](../.github/workflows/checks.yml) | Contribution experience and coordinator | Existing checks retained; documentation-link checking and its regression tests added to CI. |
| [.github/workflows/release.yml](../.github/workflows/release.yml) | Coordinator and contribution experience | Display names now identify fixed-artifact recovery; release code and nonmatching-push safeguards retained. |
| [aeries-playground.user.js](../aeries-playground.user.js): opening explanation, metadata, and license | Security, licensing, coordinator | Privacy explanation rewritten; effective license copy synchronized; current version, permissions, and update metadata retained. |
| Userscript: feature help, labels, tooltips, calculation explanations, and surrounding comments | Features, calculations, security, entry point | Read against surrounding logic; inaccurate explanatory copy corrected; behavioral defects recorded below. |
| [scripts/check-userscripts.mjs](../scripts/check-userscripts.mjs) and [tests/check-userscripts.test.mjs](../tests/check-userscripts.test.mjs) | Contribution experience and coordinator | All comments, test names, and CLI messages reviewed; commands and limited test scope documented accurately. |
| [scripts/check-documentation.mjs](../scripts/check-documentation.mjs) and [tests/check-documentation.test.mjs](../tests/check-documentation.test.mjs) | Coordinator | Added dependency-free local inline-link and anchor checking, with fixtures for missing targets, duplicate headings, examples, escaped paths, and ignored private directories. |
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
| Browser back/forward restoration may retain an active scenario | `pagehide` handlers and grade-lab lifecycle | Navigation handlers abort schedules and close KBAR but do not explicitly clear grade-lab state. Check browser back/forward-cache restoration before promising that navigation discards hypothetical values. This is a source-level concern, not a reproduced browser result. |
| Enabling the weight map can resume the master switch | `renderTab`, `setToggle`, `scheduleRequestsAllowed` | The disabled-map action first enables Playground, retaining any saved schedule consent. The revised help now discloses this; assess the control's label and expected behavior during the UI audit. |

The hidden KBAR frame has no accessible native playback/status controls; Settings supplies separate controls and a YouTube fallback. Dashboard numeric ratings do not preserve the replaced letter in a visible tooltip. These are documented current limitations, not promised fixes. The open feature issue's abbreviated request requires clarification before implementing any inferred feature.

Do not place exploitable vulnerability details or real Aeries records in this public handoff. Use the [private security-reporting route](../SECURITY.md#report-a-vulnerability-privately).

## Publication safeguards and verification limits

The current release workflow is still a recovery publisher for one frozen 2.4.0 artifact. An automatic push whose userscript does not match its approved SHA-256 and size exits successfully without creating a release, changing a tag, or uploading an asset. Manual recovery retains the strict mismatch failure. A later release requires an explicitly reviewed workflow/artifact update; changing a version label alone does not prepare a release.

Verification completed before publication:

- All **17 checker tests** passed on Node.js 24.22.1, and the userscript passed syntax/basic-metadata checking. `git diff --check` passed. The six new tests cover documentation-link checking, not browser behavior.
- A fresh temporary source-function harness passed **111 arithmetic, parsing, and boundary cases**, including all worked examples and reproductions of existing limitations. Eight separate contribution-example assertions and synthetic request/storage checks also passed. These are review checks, not a newly committed calculation or browser regression suite.
- All **256 local inline Markdown file/anchor links** resolved across twelve Markdown files. This checker now runs in CI. It does not check external URLs, reference-style links, issue-form schema, or rendered layout.
- The issue forms and chooser separately passed YAML parsing, duplicate-key detection, and structural checks against GitHub's documented schema. Documented shell blocks passed shell syntax checks. Markdown structures were parsed; signed-in GitHub forms and browser layout were not exercised.
- Both embedded licensing texts exactly match their files. The original Version 1.0 grant matches the initial repository commit byte for byte, and the README maintenance block matches the starting revision exactly.
- Exact source comparison permits only the opening privacy/license comments and **27 reviewed text/comment substitutions**. All other executable source and metadata, including `@version` and `@license`, are unchanged.
- The release workflow's Python is unchanged and compiles. Checks of the frozen original and current file confirm automatic-push skip and strict manual-recovery behavior before external commands or API writes. Only workflow display names changed to identify its recovery role.

These checks do not exercise a signed-in Aeries page, browser layout, school-specific policies, live schedule feeds, media playback, or every userscript-manager implementation. They are not a security certification, legal determination, or proof of zero defects. The license rewrite preserves the existing grant; it does not relicense other contributors' work under new terms. See [licensing](LICENSING.md).

The October 25 release work must fetch the latest `main`, reproduce the findings, implement and test fixes, reconcile any concurrent changes, prepare the actual stable artifact, and verify publication before removing the temporary README notice. If any required phase is blocked or incomplete, retain the notice and report the actual status.
