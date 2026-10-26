# Code audit for the stable release

The audit started from commit `81d9114d288bc7b38561da2f4f1ab311f9685744`, after the complete documentation redo. Exactly six GPT-6 Astra reviewers at maximum reasoning effort reviewed separate areas; the coordinator integrated changes and checked the final artifact. Repository prose and the custom license grants remain in English and unchanged in substance.

## Coverage map

| Executable area | Owner | Review scope |
| --- | --- | --- |
| Userscript `GradeMath`, `GradeDOM`, weight-map mathematics | Numerical reviewer | Parsing, precision, identity reconciliation, totals, weights, exclusions, empty work, targets and ranges |
| Userscript configuration, profiles, scenarios and `OverallMath` | State reviewer | Persistence, corrupted storage, migrations, GPA, hypothetical editing, reset and cross-tab boundaries |
| Userscript rendering, controls and lifecycle | UI reviewer | DOM assumptions, listeners, observers, navigation, focus, accessibility, restoration and display preferences |
| Userscript permissions, page boundaries and request transport | Security reviewer | Source parsing, injection boundaries, consent, cancellation, endpoint restrictions and privacy |
| Userscript `MVHSSchedule`, `BellPlusSchedule`, schedule rendering and KBAR | Schedule/media reviewer | Pacific dates and DST, missing feeds, next-school-day logic, playback and message handling |
| Repository checkers, publisher, workflows and test infrastructure | Tooling reviewer | Every support executable, CI, frozen-artifact gates, release recovery and cross-feature integration |

All new regression fixtures use synthetic data and exercise extracted source functions or repository programs. No real student records were needed.

## Verification limits

No signed-in Aeries session, live school data, real media playback, browser layout, or userscript-manager installation was exercised. The local browser-testing package had no browser executable. Synthetic DOM and transport tests are not a substitute for those checks. School-specific grading policies and external feeds may differ. This audit does not prove the absence of all possible bugs and is not a security certification.

## Results and executable-file inventory

All 171 tests passed on Node.js 24.22.1 against the integrated source, with zero failures or skipped tests. Syntax/basic metadata, local documentation links, whitespace and workflow/form YAML checks passed. The coordinator inspected source patches and independently ran the integrated suites. Legacy saved-policy compatibility was corrected during integration rather than discarding valid old profiles. Temporary test-fixture integration failures were resolved before freezing the artifact.

| Executable file | Review owner and result |
| --- | --- |
| `aeries-playground.user.js` | Five runtime owners plus tooling integration; all named and anonymous functions assigned by section. Baseline AST inventory: 577 functions, including 283 anonymous functions/IIFEs. |
| `scripts/check-userscripts.mjs`, `tests/check-userscripts.test.mjs` | Tooling; duplicate metadata and executable header-content rejection; 13 tests. |
| `scripts/check-documentation.mjs`, `tests/check-documentation.test.mjs` | Tooling; symlink escape and aliased-anchor validation; 7 tests. |
| `scripts/publish-release.py`, `tests/audit-tooling.test.mjs` | Tooling; 54 mocked publication/gate/recovery/conflict tests. |
| `tests/audit-math.test.mjs` | Numerical owner; 20 source-extracted groups, including exhaustive small target/range grids and full fractional-score restoration. |
| `tests/audit-state.test.mjs` | State owner; 21 source-extracted storage/profile/GPA/scenario groups. |
| `tests/audit-ui.test.mjs` | UI owner; 12 synthetic DOM/event groups, including full-script startup, Settings, pagehide and pageshow. |
| `tests/audit-security.test.mjs` | Security owner; 19 fake-manager/timer/actual-parser groups covering consent, watchdogs, queued callbacks, and fixed payloads. |
| `tests/audit-media.test.mjs` | Schedule/media owner; 25 groups covering DST, feed errors, uncertainty, cache lifecycle and player state. |
| `.github/workflows/checks.yml`, `.github/workflows/release.yml` | Tooling and coordinator; all regression files included, publisher frozen to the final source, paths/time/stable/recovery safeguards reviewed. |

The other tracked files are documentation, templates, license grants, and formatting/ignore configuration. They were checked for behavior consistency and carry forward the complete documentation inventory in [maintenance](MAINTENANCE.md). There is no dependency package, build step, or additional executable file omitted from the coverage map.

## Corrected behavior

The [release notes](RELEASE-3.0.0.md) describe verified corrections. In particular, reconciliation uses displayed precision and saved final-rounding policy without rounding impact math; malformed data fails explicitly. Count-off drafts remain editable without blocking calculations. Course identity and saved-policy handling preserve valid older settings while preventing stale metadata from replacing current posted evidence. UI cleanup preserves native controls and resets transient scenarios on departure. Public transport settles locally on timeout and ignores invalidated responses. Schedule uncertainty does not hide valid current bells or invent future predictions. KBAR provider events cannot reverse a pause/failure, and Settings exposes its status.

Ordinary cross-tab saves remain last-write-wins and consent is not revoked live in other tabs. Reset markers reduce stale restoration but are not atomic locking. External service availability and school-specific grading rules remain outside the audit's guarantees. No known release-blocking defect remains from this review; that is not proof that every possible defect is absent.

## Frozen source

The approved userscript is **354294 bytes**, SHA-256 `ec9bb512dcd1f966c67499687fdf1c40f2c820711acc9b4f2aa83aafacb4fea6`. The release publisher must verify these exact bytes locally, at the tag, and in the downloaded asset before reporting success.
