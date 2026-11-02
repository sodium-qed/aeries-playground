# Aeries Playground 3.1.0 — unified release

This version combines the Developer and public editions into one maintained userscript. Its launch is guarded until **Sunday, November 1, 2026 at 11:59 PM America/Los_Angeles (PST)**, equivalent to **November 2 at 07:59 UTC**. Use the published GitHub release and attached asset to confirm availability; source notes, a schedule, and a version label alone do not establish publication.

The integration starts from the audited public 3.0.0 source and carries forward its numerical, storage, interface, request-transport, schedule, and KBAR fixes. It does not replace that source wholesale with the earlier personal `2.X` build.

## Additions

- Saved assignment weights for supported numeric `/4` gradebooks, plus temporary **Counts as** multipliers in grade testing. Multipliers apply to earned and possible points while scores remain on their original scale. The integration covers replacements, score limits, ranges, targets, impact labels, and the posted assignment weight map. Saved references and multipliers are configuration; hypothetical scores remain temporary.
- **Show regression predictions** displays available native Aeries forecasts beside trend icons. It reads existing page values without recalculating forecasts, requesting separate predictions, or saving them. Missing forecasts remain absent.
- Fractional-score recovery from validated same-assignment card/raw values in addition to the supported embedded recent-assignment records. Matching checks must retain the current public safeguards against ambiguous or mismatched student, course, assignment, date, and denominator evidence.
- Bounded rounding reconciliation when only rounded scores remain. An accepted estimate must fit both category totals and the posted grade under the supported rounding policy; estimated results are identified and target planning uses a conservative bound. This is not recovery of an individual's unknown hidden score.

## Updating from either edition

After publication is verified, review the complete `aeries-playground.user.js` release asset and replace the existing script through the userscript manager. Keep one copy enabled and reload every open Aeries tab. Updates remain manual; an ordinary update does not require clearing settings.

The installed script identity and existing configuration key are retained. Settings preservation must be verified for both supported upgrade paths; separately installed manager identities do not automatically share storage. Review the selected profile/year, saved weights and policies, and schedule consent after updating. Scores, ranges, temporary multipliers, and added hypothetical assignments are not saved. Saved course and assignment references can identify personal information and must not be posted in reports.

Schedule requests remain opt-in, KBAR playback begins only after interaction, and hypothetical edits remain local without submitting grades to Aeries. Follow the [settings guide](https://github.com/sodium-qed/aeries-playground/blob/main/docs/SETTINGS.md) and [privacy explanation](https://github.com/sodium-qed/aeries-playground/blob/main/SECURITY.md).

## Validation and publication

Prepared integration verification: **195/195 regression tests passed**, with no skipped tests; userscript syntax/basic metadata and local documentation links passed. Candidate userscript: **379864 bytes**, SHA-256 `5e37b76082308c0eb0f2bc1e472cb33bc4bd3b360a713ddbf8e192c655b33773`. The timed merge must rerun the full combined-tree checks before publication.

Before release, run every committed regression suite, both repository checkers, and the whitespace check on the final integrated candidate. Review the complete source and the synthetic upgrade, multiplier, prediction, precision, and rounding fixtures. Record actual results and remaining limitations in the [maintenance record](https://github.com/sodium-qed/aeries-playground/blob/main/docs/MAINTENANCE.md). The earlier [3.0.0 audit](https://github.com/sodium-qed/aeries-playground/blob/v3.0.0/docs/AUDIT-3.0.0.md) is historical evidence for that source, not verification of the new candidate.

The publisher must be frozen to the final candidate's exact byte count and SHA-256. It refuses publication before the target time, runs the checks before API mutations, verifies the exact tag target and downloaded asset, and confirms the stable release and Latest selection. Earlier releases, tags, assets, and license grants remain preserved. Conflicting historical artifacts are not overwritten.

Live Aeries rendering, actual browser/userscript-manager migration behavior, live schedule accuracy, and audible YouTube playback have not been verified for this candidate. Synthetic tests do not establish those outcomes or certify security. Ordinary settings and consent changes still require reloading other tabs.
