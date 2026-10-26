# Aeries Playground 3.0.0

This stable release combines the complete documentation overhaul with a six-reviewer code audit and verified corrections. Install `aeries-playground.user.js` from this release, review the file, and reload Aeries. Updates remain manual; hypothetical changes are local and never submit grades.

## Corrections

- Grade reconstruction respects the precision of posted percentages and explicit final rounding while preserving unrounded impacts. Invalid/nonfinite reconciliation data is rejected, literal category names retain their weights, and embedded fractional scores such as 14.66666666666667 / 15 remain protected by identity checks.
- GPA uses a usable duplicate course card once. Excluded hypothetical rows no longer block totals with invalid score fields, and range-only categories participate in grading-profile validation.
- Settings saves preserve current toggle choices. Unreadable/unsupported storage is not overwritten by default settings; malformed known policies produce a recovery warning. Save failures appear in current controls.
- Grade-tool buttons support Enter; hypothetical coloring follows the preference. Navigation discards transient scenarios, and DOM cleanup releases obsolete decorations and gradebook references.
- Public schedule requests have independent timeout watchdogs and cancellation cleanup. Valid current-day bells remain available when an unrelated schedule or uncertain future day cannot be resolved; future predictions stop at uncertainty.
- KBAR ignores late playback events that contradict a pause or failure. Settings exposes provider-reported playback/error status and retry controls; the source-video fallback remains available.
- All regression suites run before publication. The publisher checks the exact source, tag, uploaded asset, stable status and Latest selection, and refuses conflicting historical artifacts.

## Review and verification

See the [audit coverage and verification record](https://github.com/sodium-qed/aeries-playground/blob/v3.0.0/docs/AUDIT-3.0.0.md) and [complete documentation](https://github.com/sodium-qed/aeries-playground/blob/v3.0.0/docs/README.md). Tests use synthetic source-level numerical, DOM, storage, network, media and release-recovery fixtures. No real student records were needed.

Live Aeries rendering, actual browser/userscript-manager behavior, live schedule accuracy and audible YouTube playback were not verified. Ordinary settings and consent are not synchronized immediately across tabs. This audit cannot prove all possible bugs absent and is not a security certification.

Earlier releases, tags, assets and the original custom license grant are preserved.
