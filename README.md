# Aeries Playground

<!-- temporary-maintenance-pause-start -->
> [!IMPORTANT]
> **Temporary contributor commit pause through October 25, 2026.** Please hold new commits, pushes, merges, and releases until the scheduled code audit and release starting **Sunday, October 25 at 11:59 PM Pacific** have finished. Already scheduled maintenance will continue. Ideas and bug reports are welcome in issues.
<!-- temporary-maintenance-pause-end -->

Make your Aeries dashboard easier to read, understand how assignments affect a grade, and try “what if?” scores in your browser. Aeries Playground is a userscript for the **MVLA Aeries student portal**, with an optional next-class panel for **Mountain View High School**.

It is an independent, unofficial project. Hypothetical edits change the local display and calculation; they do not submit grade changes to Aeries. Your posted gradebook and teacher's grading policy remain the reference.

[Install](#install) · [Get started](#get-started) · [Features](#features) · [Update](#update-manually) · [Help and feedback](#help-and-feedback)

## Install

Use a modern desktop browser with [Tampermonkey](https://www.tampermonkey.net/). The script runs only on `https://mvla.aeries.net/student/*`, covering the dashboard and recognized gradebook table/card views. Other Aeries domains and the native mobile app are outside its scope.

Choose which file to install:

| Download | What you are choosing |
| --- | --- |
| [Stable release](https://github.com/sodium-qed/aeries-playground/releases/latest) | Open **Assets** and choose the attached `aeries-playground.user.js`. This is the published stable edition; it does not include every feature in the current source. |
| [Install current source](https://github.com/sodium-qed/aeries-playground/raw/refs/heads/main/aeries-playground.user.js) | Follows `main` and currently installs a prerelease. The overview below describes this source. |

See the [feature guide's download details](docs/FEATURES.md#available-release) for specific builds and their differences. **Pre-release** and stable **Latest** are separate choices.

1. Install Tampermonkey for your browser.
2. Follow its [userscript permission instructions](https://www.tampermonkey.net/faq.php?q=Q209) where applicable, and allow the extension to run on the supported Aeries site.
3. Open your chosen userscript, review the complete file and its opening privacy explanation, and confirm installation in Tampermonkey.
4. Keep **one copy** of Aeries Playground enabled, then reload the [MVLA Aeries student portal](https://mvla.aeries.net/student/).

If the file opens as text or downloads without an installer, follow [Tampermonkey's script-editor instructions](https://www.tampermonkey.net/faq.php?q=Q102). Paste the complete script, including its header, and save. A repository ZIP is not the installable script.

## Get started

1. **Open the Aeries dashboard** to discover your courses.
2. **Press S outside an editable control** to open Settings. You can also use Tampermonkey's **Aeries Playground — open settings (S)** menu command. Feature toggles apply and save immediately; colors, default thresholds, and profile/year fields use **Save settings**.
3. **Open Courses** to customize display names, icons, periods, progress bars, and course thresholds. Use **Save course settings**. Select **Honors/AP — weighted GPA bonus** yourself for the courses you want weighted; the script does not infer eligibility.
4. **Open a course's full gradebook** with Aeries' missing-only filter off. Wait for the rows and totals to load. Use **Assignment weight map** to inspect weights, or **Start grade testing** in the **Grade testing lab** to try scores, ranges, and added assignments.
5. **Choose Exit grade testing when finished.** It restores posted values and clears the scenario. Reloading, changing gradebooks or settings profile/year, and detected gradebook refreshes also clear it. Saved grading profiles and replacement rules remain.

Before using another student's account or starting a new school year, choose the appropriate **Settings profile** and **School-year starting year**, then save. These are manual settings; account changes do not select a profile for you.

See [Grade testing lab](docs/FEATURES.md#grade-testing-lab) for score controls and saved rules.

## Features

| Tool | What it helps you do |
| --- | --- |
| Dashboard customization | Set course names, icons, progress bars, colors, and thresholds. Optionally display your own 4/3/2/1 ratings alongside the posted numeric grades. |
| Grade summaries | Inspect an average of your custom ratings, or weighted and unweighted GPA estimates from included, visible courses with posted letter grades. Honors/AP selections add one point for A/B/C; D/F receive no bonus. |
| Assignment analysis | Filter the displayed rows by category, see an assignment's calculated grade impact, and compare weights. Circle **area** represents weight; impact describes a different quantity. |
| Ungraded assignment preview | Turn on **Show ungraded assignments** inside the weight map to preview shares using known possible points and category weights. Gray means ungraded; the current grade does not change. |
| Grade testing and planning | Try individual scores or ranges, include/exclude assignments, add hypothetical work, find a score needed for a target, and model supported assessment replacements. |
| Grading profiles and explanations | Set points or weighted-category rules, score limits, and rounding. **Explain my grade** shows category totals, contributions, and modeled replacements. |
| MVHS next class | Opt in to public schedule requests for current/next periods and a countdown that can continue to the next school day. Match your courses to periods locally. |
| KBAR music | Request looping YouTube playback with **P**, Settings, or the manager menu. Playback starts off each time you load the page. |

The [feature guide](docs/FEATURES.md) explains controls and defaults; the [calculation reference](docs/CALCULATIONS.md) gives formulas and fictional worked examples.

### Optional schedules and music

**What class is next (MVHS)** starts off. Read its Settings explanation before enabling public schedule and clock requests to mvhs.io's Firebase service and bell.plus. These requests contain no grades or course data; the services still receive connection information such as your IP address. Seconds require fresh, agreeing schedule and clock checks. Use the school's announced schedule if feeds disagree. See [next-class controls and limits](docs/FEATURES.md#mvhs-next-class-panel).

For KBAR, press **P** outside editable controls with the Playground dialog closed, or use **Settings → Play / pause KBAR (P)**. Playback loads a YouTube embed, which can collect connection/playback information and show ads. **Pause leaves it loaded; Close KBAR player unloads it.** If embedding fails, **Settings → Open on YouTube** opens the video separately without closing the embed. See [KBAR controls and privacy](docs/FEATURES.md#kbar-music).

## Saved settings and temporary scores

Tampermonkey stores preferences, profile/year labels, course information, grading-rule drafts, and replacement-rule references. Course settings and rules belong to the selected profile/year. Display toggles, colors, default thresholds, and the ungraded-assignment preview choice are shared across profiles.

Grading-profile edits and added/removed replacement rules save automatically. GPA inclusion and Honors/AP changes save immediately in GPA details; changes in Courses use **Save course settings**. Check for storage errors if settings do not survive a reload.

Posted grades, hypothetical scores, ranges, added assignments, calculated results, and playback state are not saved. Configuration can still identify courses and assignments; manager sync or backups may copy it elsewhere. See [saved-data details](docs/FEATURES.md#settings-profiles-and-saved-data) and [security and privacy](SECURITY.md).

## Update manually

1. Choose a file from the [download choices](#install). The `main` link follows branch changes; a tagged release asset is a specific published file.
2. Review the replacement file. For a repository file view, select **Raw** to open the userscript installer.
3. Confirm replacement in Tampermonkey. If using its editor, replace the **existing script's complete contents** and save. Keep one copy enabled.
4. Reload every open Aeries tab so they use the newly installed file.

Fresh Tampermonkey installations are configured for manual updates. Existing installations may retain their previous update preference, and other managers can behave differently; check the script's manager settings. An ordinary update does not require clearing saved settings.

## Pause, reset, or remove

| Goal | Action and effect |
| --- | --- |
| Discard a hypothetical scenario | Use **Reset hypothetical changes** to start again, or **Exit grade testing** to restore posted values. Saved rules remain. |
| Pause enhancements | Turn off **Enable Playground** in Settings. This stops enhancements and schedule work, exits grade testing, and closes KBAR in that tab while retaining saved settings. Re-enabling can resume a previously enabled schedule panel. |
| Stop only schedule requests | Turn off **What class is next (MVHS)**. This stops schedule work and requests cancellation of pending transfers in that tab; grade tools remain available. |
| Clear configuration and start fresh | Choose **Clear saved settings and pause**, then confirm. It clears all saved profiles, course customizations, rules/drafts, and preferences, and leaves Playground paused. |
| Stop the script completely | Disable or remove it in Tampermonkey, then reload Aeries. Disabling leaves stored settings in place. |

**Reload other Aeries tabs promptly after pausing, turning schedules off, or clearing settings.** Changes do not synchronize live: an old tab can continue requests and save its old choices again. Reset protection does not immediately update every tab. Cancellation cannot undo requests already sent.

To remove saved configuration, use the in-app clear before uninstalling, or close Aeries tabs and erase this script's storage through the manager. Manage any manager sync or backup copies separately.

## Limits and school policies

Calculations depend on loaded assignments and supported rules. Missing assignments, Aeries' missing-only filter, conflicting totals, or unsupported policies can block results. Posted impact labels and weight maps require checks against Aeries totals; matching totals do not establish every teacher policy. More displayed decimals do not guarantee more accurate inputs. More precise scores already embedded in the page are used only after matching checks.

GPA estimates give equal weight to included, visible courses, without transcript credits, earlier years, or institution-specific bonus caps. Arbitrary drop-lowest rules, hidden teacher rules, and zero-point extra-credit policies are not inferred. Page changes can break recognition or display. See [Troubleshooting](docs/FEATURES.md#troubleshooting) for recovery steps.

Aeries Playground is not affiliated with Aeries, MVLA, or any school, and its availability does not imply approval. Follow your school's device, account, and acceptable-use rules. Neither this documentation nor the software license grants permission to use school systems or certifies compliance with school policy.

## Help and feedback

- [Feature guide](docs/FEATURES.md): controls, defaults, troubleshooting, and limitations.
- [Calculation reference](docs/CALCULATIONS.md): formulas and worked examples.
- [Security and privacy](SECURITY.md): page access, storage, external services, and private vulnerability reporting. The [userscript's opening comment](aeries-playground.user.js) contains the detailed source explanation.
- [Contributing](CONTRIBUTING.md): how to report a problem, suggest an improvement, or prepare a change.

Have an idea or found a bug? Use the [bug report or feature request form](https://github.com/sodium-qed/aeries-playground/issues/new/choose). Include your browser/manager, installed download, steps, and expected versus actual behavior with fictional examples. Share no student records, copied pages, storage exports, credentials, or identifiable screenshots. Follow [SECURITY.md](SECURITY.md#report-a-vulnerability-privately) for sensitive concerns.

If the page looks wrong, disable Playground in Tampermonkey and reload to compare with the original page. You do not need to clear saved settings to report a problem.

## License

Copyright (c) 2026 sodium-qed. The [Aeries Playground Open Source License](LICENSE) is a custom copyleft license. Read its full terms and the [licensing guide](docs/LICENSING.md) for permissions, source-sharing obligations, and which terms apply.

You may use, modify, redistribute, and sell copies. Distribution requires preserving notices, identifying changes, and giving recipients complete corresponding source under the same license. Private changes need not be published. Giving the **complete source** to AI tools, automated scanners, or human security reviewers, including paid services, is expressly permitted without asking permission. Share the script alone, without account information or student data. The license grants no school approval, endorsement, or trademark rights, and preserves valid permissions for earlier copies.
