# Developer and public edition merge

> **Release policy correction:** The November 1 **3.1.0** integration and November 8 **3.1.1** bonus-band update are scheduled **prereleases**, each at **11:59 p.m. PST in 2026**. **v3.0.0 remains stable and Latest.** The [release schedule](RELEASE-SCHEDULE.md) supersedes earlier stable-promotion wording in preparation notes.

The supplied Developer **2.X** build and public **3.0.0** edition are being prepared as one maintained **3.1.0** edition. This document records the planned transition; it does not claim that a merge or publication has already succeeded.

## Schedule and current status

| Item | Plan or verified state |
| --- | --- |
| Tracking | [Issue #8](https://github.com/sodium-qed/aeries-playground/issues/8) |
| Merge execution starts | **Sunday, November 1, 2026, 11:59 p.m. Pacific Standard Time** |
| IANA timezone | `America/Los_Angeles` |
| Equivalent UTC time | `2026-11-02T07:59:00Z` — daylight saving time ends earlier that Sunday |
| Public baseline | `main` at `893b7b0abd826c75732222d6d883eafc17faa23b`; audited stable [v3.0.0](https://github.com/sodium-qed/aeries-playground/releases/tag/v3.0.0) |
| Developer input | Supplied `Aeries Playground-2.X.txt`, personal integration build dated October 14, 2026 |
| Candidate | Branch `release/unify-developer-public-3.1.0`; the integration PR and approved head are recorded in [issue #8](https://github.com/sodium-qed/aeries-playground/issues/8) and the scheduled-merge configuration |
| Publication | A separately guarded 3.1.0 publication after the merge; completion is verified from the release and downloaded asset |

The scheduled time starts the merge task. Checks, GitHub processing, and publication can finish later. A conflicting head, failed check, or incompatible change blocks completion and must be reported; the schedule is not permission to bypass validation. No recurring release task is intended.

Execution is configured through GitHub Actions on `main`, using a date-guarded November 2 07:59 UTC schedule and a pinned candidate PR/head. The absolute 2026 date prevents the yearly cron expression from repeating the merge in a later year. GitHub may queue scheduled jobs after their nominal time. Manual workflow dispatch supports controlled recovery after the not-before time; it cannot authorize a different head or bypass checks.

## What becomes one edition

Use current audited public source as the base. The Developer build is older than the 3.0.0 audit, so replacing the public file wholesale would discard fixes. Integrate these additions selectively:

| Developer addition | Required behavior |
| --- | --- |
| Saved assignment multipliers and temporary **Counts as** in numeric `/4` gradebooks | Positive, finite multipliers apply to earned and possible points after score replacement/limits. Scores stay on their original scale. Cover ranges, target scores, impacts, the map, and hypothetical assignments. |
| Native regression forecast display | Read existing Aeries tooltip values and display them without recalculation. Missing or conflicting forecasts stay absent. Respect the setting, pause, navigation, and cleanup. |
| Additional card/raw precision recovery | Match student/course/assignment identity, visible rounding, and possible points before accepting a more precise on-page value. Do not fetch hidden records. |
| Bounded rounding estimates | Accept only defensible bounds consistent with category and overall totals, displayed precision, and supported final-rounding rules. Label uncertainty and use conservative bounds for targets; never guess an individual hidden score. |

Ungraded weight previews, GPA, next-school-day countdown, and KBAR fallback already exist publicly. Preserve them and the 3.0.0 fixes for malformed inputs, saved-state recovery, failed-save reporting, count-off scenarios, UI lifecycle, schedule watchdogs, and media races.

The result remains one `aeries-playground.user.js`, one settings identity, and one maintained public release line. A development branch may still exist for future work; it is not a second script users need to install. Historical releases and their original tags/assets remain available and unchanged.

## Upgrade from either edition

Wait for verified release availability if you want the stable download. A candidate branch is for review and testing.

1. Note the installed version and download source in the userscript manager. If keeping a local manager backup, keep it private: saved course and assignment references can identify school work.
2. Close other Aeries tabs before replacing the script. Retain the script name **Aeries Playground**, namespace `local.aeries-playground`, storage key `aeries-playground-v1`, and schema version 1. Replace the existing script's complete contents, including its metadata, rather than enabling a second copy.
3. Preserve valid settings, profile/year scope, grading/replacement rules, Developer assignment-weight references, and the forecast preference. New public-install fields receive defaults. Invalid or unmatched references need warnings and must not silently apply to another assignment.
4. Keep only one copy enabled and reload every Aeries tab. Check the selected profile/year, course rules, weight settings, and optional schedule setting. Do not clear settings as an ordinary upgrade step.
5. Review the actual installed permissions and manual-update preference. Public schedules still require explicit opt-in, KBAR still requires a playback action, and posted/hypothetical scores are not saved or submitted.

These compatibility goals require synthetic upgrade tests from both editions. A different userscript name/namespace, manager, or separately created installation can use different storage; automatic transfer between such installations is not promised. Live manager migration remains unverified unless a specific test result is recorded.

## Candidate and merge gates

Integration verification on October 29, 2026 passed **195/195 tests**, with no skipped tests, plus userscript syntax/basic metadata and documentation-link checks. New regression files cover forecast display, assignment weights, and precision/bounded estimates. The candidate userscript is **379864 bytes**, SHA-256 **`5e37b76082308c0eb0f2bc1e472cb33bc4bd3b360a713ddbf8e192c655b33773`**. This is the prepared source fingerprint, not a claim of release publication. The timed workflow rechecks the prospective merged tree, including any scheduling tests added during preparation.

- Prepare an integration PR against `main`, identify its exact head and tested base, and link it here before scheduling execution.
- Preserve the metadata identity, licensing notices, manual-update setting, narrow network permissions, and both editions' valid saved-state behavior.
- Add regression fixtures for weights, replacements/caps, ranges, target bounds, map denominators, invalid/unmatched saved references, native forecasts, precise-score identity conflicts, and bounded rounding. Use synthetic data only.
- Run the complete checks below with Node.js 24. Do not replace older regression assertions with weaker checks to accept the Developer source.
- Record the final candidate userscript SHA-256/byte count, test results, exact source revision, and remaining limitations. Freeze the publisher fingerprint only after all source edits.
- At execution time, re-read repository instructions, the PR head and current base, changed files, reviews, and check results. Verify the current candidate remains the reviewed integration and has no unresolved conflict or failing check. If the base moved, validate the combined result again.
- Merge only the identified candidate PR using its verified `expected_head_sha`, after the not-before time. Do not enable immediate auto-merge while waiting.

```sh
node --test tests/*.test.mjs
node scripts/check-userscripts.mjs
node scripts/check-documentation.mjs
git diff --check
```

Existing 3.0.0 verification is baseline evidence, not evidence that the new candidate passes. Synthetic tests do not establish signed-in Aeries rendering, actual manager storage migration, live bell-schedule accuracy, or audible YouTube behavior. Record any such checks separately; never invent them.

## Publication and completion

The previous 3.0.0 publisher is pinned to its original artifact and cannot publish the integration. The candidate includes a prepared **3.1.0** publisher, updated tooling fixtures, release notes, and a newly frozen fingerprint while retaining its safeguards. The previous stable release is **v3.0.0**. The new publisher's not-before time is **2026-11-02T07:59:00Z**; this guard is not a scheduler.

After the timed merge, run the publisher at the actual merge commit. The scheduled workflow invokes it directly because GitHub's workflow-token merge does not trigger a new push workflow. It must run all checks before release writes, create or recover only the intended new tag/release, independently download and hash the userscript asset, and verify stable/Latest status. Do not move historical tags or overwrite an existing conflicting asset. Recover a partial publication from the original workflow run and original commit, not from an unrelated later documentation commit.

Only after publication is verified should the README announcement, available-download table, and this status change from planned to complete. Record the merged PR, commit, release link, fingerprint, and validation results, then close the tracking issue. A successful source merge with failed publication must be reported as a partial outcome; the previous stable release remains the known download until the new release is verified.

## Rollback and blocked runs

If a candidate check fails or GitHub cannot merge the reviewed state, leave it unmerged and report the exact blocker. Do not force-push `main`, disable required checks, move tags, clear settings, or silently substitute another PR.

If an installed update misbehaves, disable Playground and reload Aeries first; saved configuration remains. The preserved [3.0.0 download](https://github.com/sodium-qed/aeries-playground/releases/download/v3.0.0/aeries-playground.user.js) provides a known source baseline. Restoring old source is not a guaranteed inverse settings migration: Developer-only settings may be ignored or dropped on a later old-version save. Keep a private backup before downgrading and check configuration explicitly. Do not publish storage exports.

For a repository regression, prepare a focused revert of the integration or a reviewed corrective PR, rerun checks, and document the actual result. Existing immutable release artifacts remain preserved; publish a distinct corrective version when needed. See [maintenance](MAINTENANCE.md) and [development release safeguards](DEVELOPMENT.md#keep-documentation-and-releases-aligned).

## Scheduled execution configuration

The [scheduled workflow](../.github/workflows/scheduled-merge.yml) runs the [guarded merge controller](../scripts/merge-prepared-release.py) on the default branch. It targets [PR #10](https://github.com/sodium-qed/aeries-playground/pull/10) at reviewed head `858a0a1fac820163d1185664baa039624767928e`, with the source fingerprint above. The UTC cron is `59 7 2 11 *`; the controller's absolute 2026 date window makes this a one-time merge rather than an annual release. GitHub may queue the run after its nominal time.

The controller verifies the prospective combined tree, merges with the expected head SHA, and publishes at the exact resulting merge commit. After verified publication, the [completion recorder](../scripts/record-merge-completion.py) updates current documentation and closes the tracking issue without replacing its discussion or moving any release tag. A manual dispatch before the deadline makes no GitHub changes; later manual dispatch supports recovery of the same pinned integration.
