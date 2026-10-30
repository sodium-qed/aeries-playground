# Documentation

Start with the [project README](../README.md) to install Aeries Playground and try a gradebook. The guides here describe the **current source**; check [available downloads](FEATURES.md#available-release) if a control is missing from your installed copy.

Playground supports the MVLA Aeries student portal. Its optional schedule panel is for Mountain View High School. It changes your local display and calculations, without submitting grade changes to Aeries.

The Developer and public editions are being prepared for one maintained 3.1.0 edition. See the [November 1 merge plan](MERGE-PLAN.md) for the scheduled time, feature differences, upgrade guidance, checks, and rollback. Planned features are not yet part of the published 3.0.0 asset.

## Use Playground

| Task | Guide |
| --- | --- |
| Install, update, pause, or remove the script | [README](../README.md#install) — download choices, setup, first use, and recovery controls. |
| Find Settings, keyboard shortcuts, or a feature | [Feature guide](FEATURES.md#find-the-controls) — where each control appears and what it does. |
| Customize courses or understand the dashboard GPA | [Dashboard and course customization](FEATURES.md#dashboard-and-course-customization) — names, icons, periods, colors, ratings, and included courses. |
| Compare assignment weights and impacts | [Assignment analysis](FEATURES.md#assignment-analysis) — category filtering, impact labels, the posted weight map, and ungraded previews. |
| Try scores, ranges, future assignments, or a target grade | [Grade testing lab](FEATURES.md#grade-testing-lab) — temporary scenarios, grading profiles, targets, replacements, and explanations. |
| Understand the arithmetic or a rejected result | [Calculation reference](CALCULATIONS.md) — formulas, fictional examples, score precision, rounding, and reconciliation limits. |
| Find defaults, save an edit, switch profile/year, or clear settings | [Settings guide](SETTINGS.md) — save controls, storage scope, multiple tabs, and resets. |
| Fix a missing control, unavailable total, or playback problem | [Troubleshooting](TROUBLESHOOTING.md) — symptom-based checks and recovery. |
| Enable the next-class countdown or KBAR | [MVHS schedules](FEATURES.md#mvhs-next-class-panel) and [KBAR music](FEATURES.md#kbar-music) — opt-in controls and integration limits. |
| Review page access, saved data, or external requests | [Security and privacy](../SECURITY.md) — what this source reads, stores, and sends; stopping optional integrations; private reporting. |

For a calculation discrepancy, start with [reconciliation and incomplete data](CALCULATIONS.md#reconciliation-and-incomplete-data). A matching model supports an estimate under its supplied rules; the posted gradebook and teacher's policy remain authoritative. Hypothetical scores are temporary, while grading policies and replacement references can stay saved.

## Report, review, or contribute

| Task | Guide |
| --- | --- |
| Report an ordinary bug, suggest an improvement, or submit a first change | [Contributing](../CONTRIBUTING.md) — what to include and how to use fictional examples. |
| Set up a working copy or verify a change | [Development guide](DEVELOPMENT.md) — repository structure, local checks, and behavior-specific verification. |
| Report a vulnerability | [Private security reporting](../SECURITY.md#report-a-vulnerability-privately) — use this route before posting sensitive details publicly. |
| Read the software terms | [Current-license reading edition](../LICENSE) — reorganized permissions and conditions; the original grant controls any discrepancy. |
| Share source, obtain paid/AI review, or understand distribution obligations | [Licensing guide](LICENSING.md) — current permissions, source-sharing conditions, outside material, and preserved grants. |
| Verify the original controlling grant | [Original Version 1.0 grant](../LICENSES/LicenseRef-Aeries-Playground-Open-Source-1.0.txt) — the exact text that continues to control permissions and conditions. |
| Inspect documentation coverage or planned audit follow-up | [Maintenance and release preparation](MAINTENANCE.md) — verified state, remaining work, and verification limits. |
| Follow the Developer/public integration | [Merge plan](MERGE-PLAN.md) — scope, schedule, migration, release gates, and rollback. |

The installable [userscript](../aeries-playground.user.js) also contains metadata, an opening privacy explanation, the complete effective license, and help text beside the relevant implementation. Review the exact file you intend to install or redistribute; a moving branch and a published release asset can differ.

Do not include real student records, page captures, credentials, or settings exports in public reports or review examples. The license permits reviewing the complete source; it does not grant permission to disclose account data.
