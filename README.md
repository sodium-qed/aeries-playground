# Aeries Playground

Personalize your Aeries dashboard, understand assignment weights, and explore hypothetical grades. Built for the MVLA Aeries student portal, with an optional next-class panel for Mountain View High School.

**The script is planned to be available Sunday, September 20, 2026 at 11:59 PM Pacific Time.** This repository currently contains documentation only.

[Feature guide](docs/FEATURES.md) · [Calculation reference](docs/CALCULATIONS.md) · [Security information and reporting](SECURITY.md)

Aeries Playground is unofficial and is not affiliated with Aeries or a school district. Its grade calculations are estimates under the supplied grading rules. Hypothetical edits change the displayed scenario; Aeries remains the authoritative gradebook.

## Install after publication

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
2. Enable userscript execution using [Tampermonkey's browser instructions](https://www.tampermonkey.net/faq.php?q=Q209).
3. Once published, open `aeries-playground.user.js` in this repository and choose **Raw**, review the script, and confirm installation in Tampermonkey.
4. Refresh the [MVLA Aeries student portal](https://mvla.aeries.net/student/).

If the published script opens as text, follow [Tampermonkey's script-editor installation guide](https://www.tampermonkey.net/faq.php?q=Q102) and paste the complete script. A repository ZIP is not an installable userscript.

Keep one copy of Aeries Playground enabled at a time. After installation, open the dashboard before configuring individual courses.

## Features

| Feature | What you can do |
| --- | --- |
| Dashboard customization | Set course names, icons, periods, progress-bar scales, grade colors, and per-course thresholds. |
| Grade summaries | Choose posted letters or custom 4/3/2/1 ratings, and view an overall average or an unweighted GPA estimate from visible classes. |
| Assignment analysis | Filter by category, inspect grade impacts, and compare assignment weights in assignment-number order. Circle area shows each assignment's weight. |
| Grade testing lab | Change points or number correct, include/exclude work, and add hypothetical assignments with live grade calculations. |
| Course grading profiles | Configure total-points or weighted-category grading, score limits, average scales, and final-grade rounding. |
| Score planning | Find the minimum score needed for a target grade, model assessment replacements, or enter score ranges for several assignments. |
| Grade explanations | Inspect category totals, effective weights, contributions, exclusions, and replacement effects. |
| MVHS next class | Opt in through Settings to see the current/next period and countdown from mvhs.io, with seconds shown when fresh bell.plus schedule and clock checks agree. |
| Settings profiles | Organize course settings by a manually selected profile and school year, toggle individual enhancements, or clear saved settings and pause. |

## Get started

Press **S** outside a text field to open Settings, or use Tampermonkey's **Aeries Playground — open settings (S)** menu command.

- **Courses:** edit display names, icons, periods, progress bars, and course cutoffs; use **Save course settings**.
- **Settings:** toggle features, set colors and default cutoffs, or choose a profile/year. Toggles save immediately; other fields use **Save settings**. Both custom 4/3/2/1 ratings and the MVHS next-class panel start off. Read the explanation beside **What class is next (MVHS)** before enabling it.
- **Gradebook details:** open **Grade testing lab**, **Category**, or **Assignment weight map**. Start with all assignments loaded and Aeries' missing-only filter off. Grading-profile edits and replacement-rule changes save automatically. Hypothetical scores reset when you exit or reload.

Choose a separate settings profile/year before using another student's account or starting a new school year. Profiles are selected manually.

## Pause, reset, and update

- **Pause:** turn off **Enable Playground** to pause enhancements while retaining your setup. Turn off **What class is next (MVHS)** to stop only the schedule panel.
- **Start fresh:** choose **Clear saved settings and pause** in Settings, confirm, and reload other Aeries tabs. This clears course customizations and saved grading rules as well as general preferences.
- **Stop:** disable the script in Tampermonkey and reload Aeries.
- **Update manually:** review the published script's **Raw** view and confirm its replacement in Tampermonkey. A fresh Tampermonkey installation is configured for manual updates; an existing installation can retain its manager update preference.

## Supported pages

The script runs on `https://mvla.aeries.net/student/*` in a modern desktop browser with Tampermonkey. It supports the dashboard and recognized gradebook table/card views, including percentage and four-point gradebooks. The next-class panel is specific to **Mountain View High School**. Other Aeries domains and the native mobile app are outside its scope.

## Documentation and feedback

- [Feature guide](docs/FEATURES.md): controls, defaults, troubleshooting, and limitations.
- [Calculation reference](docs/CALCULATIONS.md): formulas and worked examples.
- Security and privacy information: once published, read the explanatory comment at the top of `aeries-playground.user.js`.
- [Contributing](CONTRIBUTING.md): bug reports, feature requests, and proposed changes.
- [Security information and reporting](SECURITY.md): where to find the source explanation and how to report a sensitive issue privately.

Use the repository's [issue forms](https://github.com/sodium-qed/aeries-playground/issues/new/choose) for ordinary feedback, with fictional example values.

## License

The [Aeries Playground Source-Available License](LICENSE) covers use, private changes, and submitting the complete code for AI or human review. Read it for the permissions and conditions governing redistribution and sale.
