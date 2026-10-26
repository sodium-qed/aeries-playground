# Maintenance and release status

The complete documentation redo was published in [`81d9114`](https://github.com/sodium-qed/aeries-playground/commit/81d9114d288bc7b38561da2f4f1ab311f9685744). The full code audit was integrated and published in [`4de1703`](https://github.com/sodium-qed/aeries-playground/commit/4de17030f9e2ca5eb48f72d0026b7695a4e40af8), preserving the documentation and existing license grants.

[Stable 3.0.0](https://github.com/sodium-qed/aeries-playground/releases/tag/v3.0.0) was published **October 26, 2026 at 00:18:43 America/Los_Angeles**. The tag targets the reviewed commit, the downloaded userscript matches its approved bytes/hash, and GitHub reports published, stable, and Latest. Both Repository checks and the guarded publisher succeeded. Historical releases including 2.3.0 and 2.4.0 remain untouched.

The temporary README pause notice was removed only after successful audit, fixes, checks, and release verification. That notice concerned contributor timing only; it never limited either overhaul's scope.

See the [code-audit coverage and verification record](AUDIT-3.0.0.md), [release notes](RELEASE-3.0.0.md), [developer checks](DEVELOPMENT.md#run-the-repository-checks), and [available downloads](FEATURES.md#available-release).

## Documentation findings resolved in the audited source

| Carried-forward finding | Disposition |
| --- | --- |
| Posted rounding and decimal precision mismatches | Corrected reconciliation; raw mathematical results remain unrounded. |
| Blank duplicate course cards discard a usable GPA grade | First usable record is retained once per course identity. |
| Count-off invalid hypothetical rows block results | Excluded rows retain drafts but do not block totals with score/name/category validation. |
| Range-only categories omitted from profile validation | Validation uses active scenario rows, including ranges. |
| Hypothetical score colors ignore the preference | Existing rows, added rows and totals now honor the setting. |
| Immediate save errors remain hidden | Live status appears in the current settings/GPA controls. |
| Schedule manager timeouts may be ignored | Independent local watchdog settles promises and requests abort; browser throttling/manager limits remain. |
| Browser-restored pages retain hypothetical scenarios | Pagehide clears transient state; pageshow reconstructs it. Synthetic lifecycle tested, real BFCache unverified. |
| Weight-map enable also resumes Playground | Combined action is explicitly labeled while retaining its intended behavior. |
| Hidden media errors | Settings now exposes provider-reported status; native iframe controls remain offscreen. |

The abbreviated feature issue remains uninterpreted; no feature was invented from that shorthand. Dashboard numeric ratings still replace the visible letter. Cross-tab consent still requires reload/close controls described in SECURITY.md. No real student data or exploitable security details belong in this public record.

## Documentation review coverage

During the earlier documentation phase, six parallel reviewers reread the current implementation and every assigned document, followed by integration and cross-file verification. The starting revision contained 21 tracked files and no `AGENTS.md`, package manifest, or additional documentation format. The [documentation index](README.md) is the user-facing entry point; this inventory records review ownership and outcomes.

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

## Publication safeguards

The publisher is frozen to one reviewed 3.0.0 source hash and byte count. Source-path filtering prevents documentation-only pushes from initiating publication. A nonmatching source push skips; manual recovery rejects a mismatch. Required checks run before release mutations. Historical tags are never moved and conflicting assets are never overwritten. Recovery verifies the original reviewed workflow commit, attached source bytes, stable metadata and Latest selection.

The complete tests and remaining limitations are recorded in [the audit](AUDIT-3.0.0.md). They are not a guarantee of zero bugs, live-browser compatibility, security certification, or legal determination.
