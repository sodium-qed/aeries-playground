# Licensing and source review

**The effective software license remains the Aeries Playground Open Source License, Version 1.0.** Its complete operative text appears in [LICENSE](../LICENSE) and in the opening license comment of [the installable userscript](../aeries-playground.user.js). The userscript's `@license` remains `LicenseRef-Aeries-Playground-Open-Source-1.0`.

The [complete Version 1.1 rewrite](LICENSE-PROPOSAL.md) is a proposal, not an effective replacement. This guide explains the current terms and the concrete reason adoption remains separate. The operative license controls; this guide and the introductory notes in `LICENSE` add no restrictions or new grant.

## What you can do now

| Activity | Effective Version 1.0 terms |
| --- | --- |
| Install, run, study, or modify | Permitted for personal, educational, business, and other purposes. Private changes need not be published or submitted to a maintainer. Keep existing notices. See sections 1–2. |
| Submit the complete source for review | Expressly permitted for ChatGPT, other AI services or models, automated scanners, and human reviewers, including paid services. Privately modified copies may be submitted too. See section 3 and the distribution conditions in section 4. |
| Process code as a reviewer | Reviewers, providers, and processors may copy, store, analyze, make working changes, produce and return results or patches, and retain review records. See section 3. |
| Publish review findings | Findings, explanations, security reports, and relevant excerpts are permitted. Independently created material does not become covered merely because a review occurred; copied or derived code remains covered to the extent copyright applies. See section 3. |
| Share, mirror, fork, sell, rent, or bundle copies | Permitted, including commercial distribution. Include the license and notices, identify changes and dates, use the same license for covered modifications, and give recipients the matching complete corresponding source. See section 4. |
| Charge for support or services | Permitted. Running a modified service alone creates no public source-release requirement. Supplying copies still invokes the distribution conditions. See section 4. |
| Bundle independent material | Independent material does not acquire this license just because it is bundled with, communicates with, or reviews the Software. Separate third-party terms remain applicable. See section 4. |

For an unmodified copy of this userscript, the readable file already contains its source and complete operative license. If you distribute a modified version or another form, provide the preferred form for making changes to that version, including required project-specific build, installation, and run files or scripts. A minified or deliberately obscured substitute is insufficient. You may include the source or give clear instructions to obtain it without an additional charge through a readily accessible means maintained while you distribute that version.

The source obligation concerns recipients, not compulsory publication to everyone. Private review can remain unpublished, but giving someone a copy does not remove that recipient's rights under the license. The license itself does not promise a provider will keep code confidential, delete review records, or use a particular data-retention policy. Do not assume a paid review service can impose extra restrictions on the covered code's license rights.

For a review of Playground, supply the script itself. The source-review permission is not permission to disclose an Aeries account, passwords, cookies, real gradebook pages, student records, or another person's material. See [Security and privacy](../SECURITY.md) for what the script reads and how to report a concern without sharing account data.

## Why the effective text stays at Version 1.0

The reviewed repository history begins with Version 1.0 in the initial commit, and subsequent commits retain that license. History includes retained contributions from more than one account, including the [KBAR fallback change](https://github.com/sodium-qed/aeries-playground/commit/74e9c734241f9e26f493734189343fdc550597a8) and the earlier [hidden-player change](https://github.com/sodium-qed/aeries-playground/commit/12d7fa18b125fbcf78308bb516d5e83aa11e3445). Those contributions remain part of the current source.

Commit attribution is provenance evidence, not proof of legal ownership or a copyright assignment. The reviewed repository contains no assignment or authorization to apply a new license version to all affected contributions. Its existing contribution instructions require a contributor to have the right to license submitted material under Version 1.0; they do not transfer ownership or authorize maintainers to choose later terms.

Version 1.0 requires distributed covered modifications to use the same license and contains no automatic later-version option. A repository owner cannot establish authority over another person's copyright merely by changing `LICENSE`. The complete Version 1.1 proposal therefore remains separate until the necessary authority is established for the affected material.

The documentation overhaul reorganizes the license's presentation and supplies a full proposed replacement. It preserves the operative Version 1.0 text verbatim, its copyright notice, and all rights already granted. This is the publishable state while the proposed revision is reviewed.

## Copies, versions, and preserved grants

| Item | Applicable status |
| --- | --- |
| Current repository source and userscript license metadata | Version 1.0 remains effective. The complete `LICENSE` document is mirrored in the userscript comment, including the unchanged operative terms. |
| Proposed Version 1.1 | Review text only; its publication does not relicense code or alter contributor permissions. |
| Earlier tags, release assets, and downloaded files | Retain their original valid grants. A change on `main` does not rewrite those copies. |
| Material with another valid license, including MIT where actually granted | Remains usable under that grant for the copy and material it covers. The mention of MIT preserves possible existing rights; it does not assert that every older file was MIT-licensed. |
| Future software releases | A software version number does not select a new license version. Apply only terms validly offered for that release's material. |

Keep original copyright, attribution, license, and third-party notices. Do not claim a contributor assigned their rights merely because their changes were merged. New contributions intended for inclusion should follow the current [contribution instructions](../CONTRIBUTING.md), including the effective license and the contributor's authority to offer the material.

## Custom license status and outside material

This is a custom copyleft license. It was designed toward the [Open Source Definition](https://opensource.org/osd), but that describes intent, not an independent finding of compliance. Neither Version 1.0 nor the Version 1.1 proposal is OSI-approved. [OSI approval requires its review process](https://opensource.org/licenses/review-process); a license's title, the availability of source, or a `LicenseRef` identifier is not that approval.

`LicenseRef-Aeries-Playground-Open-Source-1.0` is a custom reference using the [SPDX license-expression syntax](https://spdx.github.io/spdx-spec/v2.3.1/SPDX-license-expressions/). It does not claim an entry in the SPDX License List. The proposal's separate identifier ends in `1.1` so changed text cannot be mistaken for the terms attached to an existing `1.0` file.

The repository license does not license Aeries, userscript managers, schedule services, YouTube media, trademarks, or other material its licensors do not control. The userscript does not bundle a remote library through `@require`; optional services still supply their own data, code, media, and terms. Referencing a service does not bring that service under this license or imply its endorsement. No license compatibility with another project is established here.

For the ownership distinction considered in this review, the [U.S. Copyright Office's publication of 17 U.S.C. chapter 2](https://www.copyright.gov/title17/92chap2.html) separates copyright ownership, contributions, transfers, and ownership of a copy. This is a primary reference for that distinction, not a finding about the ownership or governing law of any particular contribution.

## Adopting a future revision

1. Identify the affected contributions and the rights or permissions needed to change their terms. Resolve that scope using actual provenance and authorizations.
2. Obtain and retain the necessary authority for the exact proposed text, or preserve applicable separate terms without misrepresenting the result as a uniform new license.
3. Review the final wording and its distribution obligations. Do not infer legal compatibility or approval from a similar license name.
4. Update the operative license, embedded copy, metadata, and contribution guidance consistently. Preserve earlier releases and valid grants.

The prepared Version 1.1 text makes this review concrete. No existing contributor's agreement to that text, copyright transfer, automatic relicensing, or future release is claimed by these documents.
