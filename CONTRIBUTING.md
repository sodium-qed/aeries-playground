# Contributing

Keep changes focused on a specific bug, useful feature, or documentation improvement. Preserve the applicable license, copyright, attribution, and third-party notices.

## Bug reports and feature requests

Use the repository's [issue forms](https://github.com/sodium-qed/aeries-playground/issues/new/choose). For a bug, describe your browser, userscript manager, relevant Aeries page, active settings, steps to reproduce, and expected versus actual behavior. Use generic course names and invented grades.

For a feature request, explain what you want to do, how the proposed feature would help, and whether an existing setting already covers part of the need. For sensitive reports, follow [SECURITY.md](SECURITY.md) before posting details publicly.

Do not offer or request an Aeries account, login credentials, session cookies, page exports, or saved-settings exports to reproduce a problem. Replace student and teacher names, assignment titles, grades, and identifying details in any example or screenshot. A small invented example with the relevant grading rules is more useful than a complete gradebook.

For schedule problems, include the displayed school date, approximate time, expected period, and whether **What class is next (MVHS)** was enabled. That setting starts off and must be enabled explicitly. For an update or installation problem, say whether this was a fresh install or a manually replaced file; a fresh Tampermonkey install uses manual updates. For settings problems, describe the selected profile/year with generic labels and whether more than one Aeries tab was open.

## Source and documentation

The installable source is [aeries-playground.user.js](aeries-playground.user.js). Keep its userscript metadata first, and preserve its stable filename, name, and namespace. Explain how a proposed change affects users and which pages or grading rules it supports.

Keep the [README](README.md) as the installation guide and overview, the [feature guide](docs/FEATURES.md) as the user manual, and the [calculation reference](docs/CALCULATIONS.md) as the explanation of modeled behavior. Document actual behavior and limitations.

Keep security, permissions, data-handling, and review information in the explanatory comment at the top of the userscript. Update that comment whenever the corresponding behavior changes, and mention the change in the pull request. `SECURITY.md` points readers there and explains the reporting process.

## Checking a proposed change

From the repository root, run:

```sh
node --test tests/check-userscripts.test.mjs
node scripts/check-userscripts.mjs
```

This checker parses JavaScript and basic userscript metadata; it does not run the browser features or certify their security.

Validate the behavior your change affects using invented data. For a calculation change, show the inputs, policy, expected result, and observed result. For controls or persistence changes, check the relevant toggle, reload behavior, and any affected saved rules. Keep schedule-off behavior and explicit opt-in intact when changing the optional widget. Check documentation links and control names for a documentation-only change.

Describe the checks actually performed and any remaining limits in the pull request. Do not describe static parsing or an AI review as proof of zero risk. If a display problem needs recovery, disabling the script in the userscript manager and reloading preserves saved settings; **Clear saved settings and pause** is a separate action that removes configuration and should not be a routine debugging prerequisite.

## License

Contributions intended for inclusion in this project must be offered under the [Aeries Playground Open Source License, Version 1.0](LICENSE). Only contribute material you have the right to license, and preserve applicable third-party notices.

The custom license allows redistribution and commercial use, requires source access under the same license for distributed modifications, and expressly permits submitting the complete code to AI tools or human security auditors, including paid services. Private changes need not be published. This license is designed to meet the [Open Source Definition](https://opensource.org/osd) but is not OSI-approved; read its full terms before distributing copies.
