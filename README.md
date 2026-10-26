# Aeries Playground


Make your Aeries dashboard easier to read, understand how assignments affect a grade, and try “what if?” scores in your browser. Aeries Playground is a userscript for the **MVLA Aeries student portal**, with an optional next-class panel for **Mountain View High School**.

It is an independent, unofficial project. Hypothetical edits change the local display and calculation; they do not submit grade changes to Aeries. Your posted gradebook and teacher's grading policy remain the reference.

[Install](#install) · [Get started](#get-started) · [Find a feature](#features) · [Update](#update-manually) · [All documentation](docs/README.md)

## Install

Use a modern desktop browser with [Tampermonkey](https://www.tampermonkey.net/). The script supports the dashboard and recognized gradebook table/card views at `https://mvla.aeries.net/student/*`. Other Aeries domains and the native mobile app are outside its scope.

| Download | What you are choosing |
| --- | --- |
| [Stable release](https://github.com/sodium-qed/aeries-playground/releases/latest) | Open **Assets** and choose the attached `aeries-playground.user.js`. This published stable edition does not include every feature described below. |
| [Install current source](https://github.com/sodium-qed/aeries-playground/raw/refs/heads/main/aeries-playground.user.js) | The source described by these guides. It currently installs a prerelease, and the link follows changes to `main`. |

Check [available downloads and feature differences](docs/FEATURES.md#available-release) before choosing. GitHub's stable **Latest** and **Pre-release** are separate choices.

1. Install Tampermonkey and follow its [userscript permission instructions](https://www.tampermonkey.net/faq.php?q=Q209) for your browser. Allow it to run on the supported Aeries site.
2. Open your chosen userscript, review the complete file and its opening privacy explanation, and confirm installation in Tampermonkey.
3. Keep **one copy** of Aeries Playground enabled, then reload the [MVLA Aeries student portal](https://mvla.aeries.net/student/).
4. Press **S** outside an editable control. The Playground dialog should open on **Settings**.

If the file opens as text or downloads without an installer, follow [Tampermonkey's script-editor instructions](https://www.tampermonkey.net/faq.php?q=Q102): paste the **complete script, including its header**, into a new script and save. A repository ZIP is not the installable script. If S does not respond, use the manager's **Aeries Playground — open settings (S)** command or [check missing controls](docs/TROUBLESHOOTING.md#controls-or-courses-are-missing).

## Get started

The dialog has **Courses**, **Weight map**, and **Settings** tabs. Open it with **S** or the manager menu; there is no general floating launcher.

1. **Choose your settings scope.** Enter **Settings profile** and **School-year starting year**, then **Save settings** if you want a named scope. The signed-in student does not select it automatically. For a shared browser, follow the [account-switching steps](docs/SETTINGS.md#select-a-profile-and-school-year) before changing accounts.
2. **Visit the dashboard.** This discovers your courses. In **Courses**, change a display name, icon, period, or progress bar, then select **Save course settings**. The original gradebook links remain in place.
3. **Try one gradebook.** Open the full assignment list, turn Aeries' **Show only missing assignments** off, and wait for rows and totals to load. Choose **Start grade testing** in the **Grade testing lab**. Edit a **Score**, try a **Range**, or **Add hypothetical assignment**. Resolve any baseline warning before relying on the result.
4. **Finish with Exit grade testing.** This restores posted values and clears the scenario. Reloading or changing gradebooks also clears it. Closing the Playground dialog alone leaves testing active.

On a fresh install, colors, progress bars, and the GPA summary are on; custom **4/3/2/1** ratings are off. In the dashboard's **Calculation & GPA class selection**, choose included courses and mark **Honors/AP** eligibility yourself. Honors/AP starts unchecked and is never inferred from a course name.

Save ordinary **Courses** and non-toggle **Settings** form edits before changing dialog tabs. Feature toggles apply and attempt to save immediately. See [settings and save controls](docs/SETTINGS.md#which-save-control-do-i-use) for the full distinction.

## Features

| I want to… | Where to start |
| --- | --- |
| Change course names, icons, colors, or progress bars | **Courses** and **Settings** → [dashboard customization](docs/FEATURES.md#dashboard-and-course-customization). |
| Compare weighted and unweighted GPA, or use my own 4/3/2/1 ratings | Dashboard summary → [grade summaries](docs/FEATURES.md#overall-grade-and-current-year-gpa). |
| Focus on one category or see how an assignment affects the grade | Gradebook **Category** buttons and **Grade impact** labels → [assignment analysis](docs/FEATURES.md#assignment-analysis). |
| Compare assignment weights, including ungraded work | **Assignment weight map** → [map and ungraded preview](docs/FEATURES.md#assignment-weight-map). Circle **area** represents weight; gray means ungraded. |
| Try scores, ranges, exclusions, or future assignments | **Start grade testing** → [grade testing lab](docs/FEATURES.md#grade-testing-lab). |
| Find a score needed for a target or model an assessment replacement | Grade testing lab → [target planner](docs/FEATURES.md#what-do-i-need) and [replacement rules](docs/FEATURES.md#replacement-rules). |
| Set a grading policy or inspect the arithmetic | **Course grading profile** and **Explain my grade** → [grading profiles](docs/FEATURES.md#course-grading-profiles) and [calculation reference](docs/CALCULATIONS.md). |

The weight map uses **posted** assignments even during grade testing. Its optional **Show ungraded assignments** preview changes relative shares without treating blanks as zeros or changing the current grade. Assignment **impact** is a different calculation; see [weight versus impact](docs/CALCULATIONS.md#assignment-weight-versus-impact).

### Optional schedules and music

Both integrations start off. Grade tools work without enabling either.

| Feature | Start, stop, and privacy |
| --- | --- |
| [MVHS next class](docs/FEATURES.md#mvhs-next-class-panel) | Read the explanation beside **Settings → What class is next (MVHS)** before enabling it. This permits public schedule and clock requests to mvhs.io's Firebase service and bell.plus. No grades or course data are sent; services still receive connection information such as your IP address. Turn the setting off to stop schedule work in that tab. |
| [KBAR music](docs/FEATURES.md#kbar-music) | Press **P** outside editable controls with the dialog closed, or use **Settings → Play / pause KBAR (P)**. Playback loads a YouTube embed, which can collect connection/playback information and show ads. **Pause leaves it loaded; Close KBAR player unloads it.** **Open on YouTube** opens the video separately without closing the embed. |

The schedule countdown can continue to the next school day. Seconds require fresh, agreeing schedule and clock checks; follow the school's announced schedule if feeds disagree. KBAR playback starts off again on each page load. Read [security and privacy](SECURITY.md) for request and storage details.

## Saved settings and temporary scores

| Data | What survives a reload |
| --- | --- |
| Preferences and course settings | Saved in userscript-manager storage. Course settings belong to the selected profile/year; display toggles, colors, default thresholds, and the ungraded-preview choice are shared. |
| Grading profiles and replacement rules | Save automatically, including incomplete grading-form drafts and assignment references. Only valid grading profiles become active. Scenario reset does **not** undo saved rule changes. |
| Posted grades and hypothetical work | Posted scores, calculated results, entered hypothetical scores, ranges, and added assignments are **not saved**. Scenario exit, reload, scope changes, and detected gradebook refreshes discard temporary work. |

Profiles organize settings; they are not private accounts. Saved course names, identifiers, and rule references can identify courses or assignments, and manager sync/backups may copy them elsewhere. See [what is saved and when](docs/SETTINGS.md#what-changes-and-what-stays-saved) before sharing configuration or switching students.

## Update manually

1. Choose a file from the [download choices](#install), and review the replacement. For a GitHub file view, select **Raw** to open the userscript installer.
2. Confirm replacement in Tampermonkey. If using its editor, replace the **existing script's complete contents** and save; keep one copy enabled.
3. Reload every open Aeries tab so it uses the replacement file.

Fresh Tampermonkey installations are configured for manual updates. Existing installations may retain an earlier update preference, and other managers can behave differently; check the script's manager settings. An ordinary update does not require clearing saved settings.

## Pause, reset, or remove

| Goal | Action and effect |
| --- | --- |
| Start a new scenario | **Reset hypothetical changes** clears scores, ranges, and added assignments while leaving testing on. Saved grading and replacement rules remain. |
| Restore posted values | **Exit grade testing** clears the scenario and ends testing. |
| Pause enhancements | Turn **Enable Playground** off in Settings. Testing exits, schedule work stops, and KBAR closes in that tab. Settings remain; re-enabling can resume a previously enabled schedule panel. |
| Clear all configuration | **Clear saved settings and pause**, then confirm. A successful clear removes all saved profiles, course settings, rules/drafts, and preferences, and leaves Playground paused. |
| Stop the script completely | Disable or remove it in Tampermonkey, then reload Aeries. Disabling leaves saved settings in place. |

**Reload other Aeries tabs promptly after pausing, turning schedules off, or clearing settings.** Changes do not synchronize live: an old tab can continue requests or save its old choices again. Cancellation cannot undo requests already sent.

To remove saved configuration, clear it before uninstalling, or close Aeries tabs and erase this script's storage through the manager. Manage sync and backup copies separately. See [settings and reset details](docs/SETTINGS.md#pause-clear-or-remove-playground).

## Limits and school policies

Calculations depend on loaded assignments and supported rules. Incomplete data, conflicting totals, or unsupported policies can block a result. Matching totals do not establish every teacher policy, and extra decimals do not guarantee more accurate inputs. The script uses more precise scores already embedded in an eligible page only after matching checks.

GPA estimates weight included, visible courses equally. They do not retrieve a transcript, credits, previous years, or institution-specific bonus caps. Honors/AP adds one point for A/B/C only; D/F receive no bonus. Drop-lowest rules, hidden teacher adjustments, and zero-point extra-credit policies are not inferred. See [calculation limits](docs/CALCULATIONS.md#reconciliation-and-incomplete-data) and [troubleshooting](docs/TROUBLESHOOTING.md).

Aeries Playground is not affiliated with Aeries, MVLA, or any school. Follow your school's device, account, and acceptable-use rules. Neither the documentation nor the software license grants permission to use school systems or certifies school approval.

## Help and feedback

Use the [documentation hub](docs/README.md) to find controls, calculations, settings, troubleshooting, privacy, and contributor instructions.

If the page looks wrong, disable Playground in Tampermonkey and reload to compare with the original page. You do not need to clear saved settings to report a problem.

Use the [bug report or feature request form](https://github.com/sodium-qed/aeries-playground/issues/new/choose) for ordinary feedback. Include your browser/manager, installed download, steps, and expected versus actual behavior with **fictional examples**. Share no student records, copied pages, storage exports, credentials, or identifiable screenshots. Use [private vulnerability reporting](SECURITY.md#report-a-vulnerability-privately) for sensitive concerns, and [Contributing](CONTRIBUTING.md) to prepare a change.

## License

Copyright (c) 2026 sodium-qed. The [Aeries Playground Open Source License](LICENSE) is a custom copyleft license. You may use, modify, redistribute, and sell copies under its terms. Distribution requires preserving notices, identifying changes, and providing recipients complete corresponding source under the same license; private changes need not be published.

Giving the **complete source** to AI tools, automated scanners, or human reviewers, including paid services, is expressly permitted without asking permission. Share the script alone, without account information or student data. Read the [licensing guide](docs/LICENSING.md) for the effective terms, review permissions, distribution obligations, and preserved rights in earlier copies.
