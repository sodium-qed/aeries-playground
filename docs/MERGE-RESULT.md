# Verified Developer/public merge result

<!-- aeries-playground-3.1.0-result -->

The Developer and public editions were unified in the **3.1.0 prerelease**. GitHub evidence was checked before this record was written. **3.0.0 remains the stable Latest release.**

| Evidence | Verified value |
| --- | --- |
| Integration PR | [#10](https://github.com/sodium-qed/aeries-playground/pull/10) |
| Approved integration head | `858a0a1fac820163d1185664baa039624767928e` |
| Merge commit | [`eea1a45c6327d37bcf88f76ed43c4e2b1839efd3`](https://github.com/sodium-qed/aeries-playground/commit/eea1a45c6327d37bcf88f76ed43c4e2b1839efd3) |
| Prerelease | [v3.1.0](https://github.com/sodium-qed/aeries-playground/releases/tag/v3.1.0) — published with `prerelease: true`; not selected as stable Latest |
| Stable Latest | [v3.0.0](https://github.com/sodium-qed/aeries-playground/releases/tag/v3.0.0) — unchanged; release ID `423949198` |
| Publication timestamp reported by GitHub | `2026-11-02T08:09:23Z` |
| Release / asset IDs | `431203020` / `700995140` |
| Userscript bytes | `379864` |
| Userscript SHA-256 | `5e37b76082308c0eb0f2bc1e472cb33bc4bd3b360a713ddbf8e192c655b33773` |

The scheduled merger and guarded publisher run the complete regression suite, userscript syntax/basic-metadata checker, local documentation-link checker, and whitespace checks before publication. The [workflow runs](https://github.com/sodium-qed/aeries-playground/actions/workflows/scheduled-merge.yml) contain execution evidence. The [original preparation record](MERGE-PLAN.md#original-schedule-and-preparation-record) preserves its historical test counts; this completion record does not invent a new test count.

This recorder independently checked the merged PR and approved head, merge parents, exact tag target, public prerelease state, unchanged 3.0.0 stable Latest selection, unique asset size and SHA-256 metadata, and repository source bytes. The publisher separately downloads and hashes the asset before requesting this record. Live Aeries rendering, actual userscript-manager migration, live schedule accuracy, and audible media remain unverified.

Install one copy using the [manual update instructions](SETTINGS.md#update-the-userscript). Historical releases and their tags/assets remain preserved.
