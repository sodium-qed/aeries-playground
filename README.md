# Aeries Playground

A local toolkit for understanding and personalizing your Aeries gradebook: customizable course displays, grade colors, assignment analysis, hypothetical grade testing, score planning, and an MVHS next-class panel.

**In development — userscript source is not published yet.** This repository contains documentation and validation tooling. The features below were inspected in an unreleased development snapshot labeled **1.5.4** on **September 15, 2026**. That label is not a published release. There is no installable userscript or install button in this repository yet.

Aeries Playground is unofficial and is not affiliated with Aeries or a school district. Its calculations and display changes run locally; they do not change school records. Aeries remains the authoritative gradebook.

## Features

| Feature | What it does |
| --- | --- |
| Course customization | Set course display names, optional icons, class periods, percentage or average-point bar scales, and per-course thresholds. |
| Grade colors | Apply four configurable color bands to dashboard grades, progress bars, assignment scores, and category/course totals. |
| 4/3/2/1 display | Convert each dashboard grade to a custom threshold-based rating while keeping the posted percentage or average visible. |
| Overall grade / GPA | Show either an average of custom 1–4 class ratings or a current-year unweighted estimate from posted A/B/C/D/F letters. Choose which visible classes count. |
| Progress bars | Show posted grades against adjustable minimums and maximums, with threshold markers. |
| Category filter | Focus on one category in the gradebook's table and card views while calculations continue to use the full assignment list. |
| Assignment impacts | Estimate how much each assignment affects the current modeled grade by comparing the grade with and without it. |
| Assignment weight map | Compare assignments using circles whose areas represent their shares of the current counted grade; inspect names, scores, categories, and weights. |
| Grade testing lab | Edit hypothetical earned/possible points, include or exclude existing work, and add future assignments with live recalculation and reset controls. |
| Course grading profiles | Configure total-points or weighted-category calculations, average scales, assignment score limits, and final-grade rounding for simulations. |
| “What do I need?” | Find the minimum score on a chosen assignment that reaches a target course grade within a maximum and score increment. |
| Replacement rules | Model an assessment replacing earlier scores, with only-if-higher or always-replace policies and optional caps. |
| Hypothetical score ranges | Enter low/high scores for one assignment and see the corresponding course-grade range. |
| “Explain my grade” | Inspect category totals, effective weights, contributions, exclusions, rounding, and hypothetical replacements. |
| MVHS next-class panel | Show the current period, next class, countdowns, today's bell schedule, and the next school day using public mvhs.io schedule data. |
| Settings profiles | Keep course settings under a manually selected profile and school year, and toggle individual enhancements. |

These are development-snapshot features, not a claim that a public release has been browser-tested. Requested changes not verified in the inspected snapshot are identified in the [feature guide](docs/FEATURES.md#development-status-and-snapshot-limits).

## Documentation

| Guide | Contents |
| --- | --- |
| [Feature guide](docs/FEATURES.md) | Where to find every feature, how to use it, settings/defaults, limitations, and troubleshooting. |
| [Calculation reference](docs/CALCULATIONS.md) | GPA modes, points and weighted calculations, impacts versus weights, replacements, target scores, and worked examples. |
| [Security and privacy](SECURITY.md) | What stays in memory, what is saved, the public schedule requests, and sensitive-report guidance. |
| [Contributing](CONTRIBUTING.md) | Documentation updates, repository checks, browser regression coverage, and future release work. |
| [Changelog](CHANGELOG.md) | Repository changes; development documentation remains under Unreleased. |

## Portal and browser scope

The inspected snapshot runs only on `https://mvla.aeries.net/student/*`. It targets that portal's dashboard course cards and gradebook details, including table/card assignment views and percentage/four-point gradebooks. It contains explicit handling for Survey Composition/Literature course labels and for letter marks accompanied by a numeric score.

The next-class feature is specific to **Mountain View High School**. It matches public bell periods to the courses currently shown on the dashboard. It does not establish support for every school using Aeries, other Aeries domains, or the native Aeries mobile app.

The script is designed for Tampermonkey and modern browser features. This documentation update is based on source inspection, not a new browser compatibility test.

## Getting around the development build

If you already have a development copy, open the **Aeries Playground** button on an Aeries page. Its tabs are **Courses**, **Weight map**, and **Settings**. Tampermonkey also has an **Aeries Playground — open settings** menu command.

On a course's gradebook details page, look for **Grade testing lab**, **Category**, and **Assignment weight map**. Open the dashboard once to discover your courses. Use **Courses → Class period (optional override)** if the next-class panel cannot match a period.

Settings toggles save immediately. Course edits use **Save course settings**; colors, thresholds, and profile/year changes use **Save settings**. Hypothetical scores are temporary and are cleared on exit, reload, a gradebook change, or a detected gradebook refresh.

## Installation — after the userscript is published

The intended first-release filename is `aeries-playground.user.js` at the repository root. It is currently absent; the steps below are for a future release.

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
2. Grant script execution permission as described in [Tampermonkey's official instructions](https://www.tampermonkey.net/faq.php?q=Q209).
3. Once the reviewed file exists, open `aeries-playground.user.js` in this repository and select **Raw**.
4. Review the source and requested permissions, then confirm installation.
5. Enable the script and refresh the supported MVLA Aeries student portal.

If Raw only shows text, Tampermonkey's [installation guide](https://www.tampermonkey.net/faq.php?q=Q102) explains the script-editor method. A repository ZIP is not an installable userscript.

To pause enhancements, turn off **Enable Playground**. To stop the userscript itself, disable it in Tampermonkey and reload Aeries. Saved preferences are separate from temporary simulations; see [storage and removal](SECURITY.md#storage-and-removal).

## Development

There is no npm installation or build step for the existing repository checks. From the repository root, using Node.js 22 or 24:

```sh
node --test tests/check-userscripts.test.mjs
node scripts/check-userscripts.mjs --allow-empty
```

The checker discovers `.user.js` files, checks their metadata, and parses JavaScript without executing it. It requires non-empty `@name`, `@version`, `@description`, and at least one `@match` or `@include` entry. The empty-source option supports the current documentation-only repository and prints a warning when no script exists.

GitHub Actions runs these checks on pushes and pull requests. Passing them does not test grade calculations, permissions, privacy, or browser behavior. A future release must include the actual script and pass the checker **without** `--allow-empty`.

Use the repository's bug-report or feature-request form for feedback, with fictional example grades. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE).
