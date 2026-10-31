# Scheduled prereleases

The Developer/public integration and its bonus-band follow-up are **prereleases**. Publishing either version must leave **v3.0.0** as the stable **Latest** release. This policy supersedes earlier preparation text describing 3.1.0 or 3.1.1 as a future stable release or Latest promotion; the 3.0.0 audit and publication records remain historical evidence for that stable artifact.

## Dates and scope

| Version | Scope | Earliest execution | UTC equivalent | Candidate |
| --- | --- | --- | --- | --- |
| **v3.1.0 prerelease** | Developer/public integration: assignment multipliers, native forecasts, validated precision recovery, and bounded rounding estimates | **Sunday, November 1, 2026, 11:59 p.m. PST** | **2026-11-02T07:59:00Z** | [PR #10](https://github.com/sodium-qed/aeries-playground/pull/10) |
| **v3.1.1 prerelease** | Separate configurable purple **5 · bonus band** for grades above the configured percentage or average cutoff | **Sunday, November 8, 2026, 11:59 p.m. PST** | **2026-11-09T07:59:00Z** | [PR #12](https://github.com/sodium-qed/aeries-playground/pull/12) |

Both dates use **America/Los_Angeles**. Daylight saving time ends earlier on November 1, so both scheduled times are Pacific Standard Time (UTC−08:00). The time starts execution; checks, merge processing, and asset verification can finish later. A failed check or changed candidate blocks the run rather than authorizing a substitute or an early publication.

As of **October 31, 2026**, these are pending scheduled releases. The November 8 bonus-band change remains separate from the November 1 integration. Preparation branches, version metadata, and release notes do not establish publication. Use each release's verified outcome to determine whether it has completed.

## Execution

The authoritative publisher is [publish-scheduled-prereleases.py](../scripts/publish-scheduled-prereleases.py), used by the [scheduled prerelease workflow](../.github/workflows/scheduled-prereleases.yml). The legacy [release workflow](../.github/workflows/release.yml) must remain disabled: the frozen candidates contain its older stable-publication code, which must not publish either scheduled version.

- **November 1:** The [scheduled merge workflow](../.github/workflows/scheduled-merge.yml) merges the approved PR #10 and invokes the prerelease publisher directly at the exact merge commit.
- **November 8:** The existing two-occurrence ChatGPT task merges the approved PR #12 at its second scheduled occurrence. The resulting userscript-source push starts the scheduled prerelease workflow, which publishes the exact triggering merge commit.

The accidental early `v3.1.0-preview.1` and `v3.1.1-preview.1` releases were withdrawn to drafts and must never be republished. The authorized scheduled tags are separately **`v3.1.0`** and **`v3.1.1`**; neither schedule authorizes reusing or publishing a withdrawn preview record.

## Downloads and verification

Use the [stable Latest release](https://github.com/sodium-qed/aeries-playground/releases/latest) for **v3.0.0**. After a scheduled prerelease is verified, its specific release page and attached `aeries-playground.user.js` are the opt-in download. The moving `main` source can contain prerelease code and is not a stable-release shortcut. Keep only one installation enabled and follow the [upgrade guidance](MERGE-PLAN.md#upgrade-from-either-edition).

At each scheduled publication, verify the approved candidate and resulting merge commit, the exact tag target, and the attached userscript's bytes, size, and SHA-256. The resulting release must be public with `draft: false`, **`prerelease: true`**, and **`make_latest: false`**; independently confirm that the stable Latest endpoint still selects **v3.0.0**. Do not move historical tags, replace conflicting assets, or promote either prerelease to Latest.

Completion documentation must identify the published version as a prerelease, link its verified artifact and merge evidence, and retain the v3.0.0 stable download. A merge with failed publication or verification is a partial outcome. Keep the [integration runbook](MERGE-PLAN.md) and tracking issue aligned with that outcome; a scheduled date alone is not evidence of success.
