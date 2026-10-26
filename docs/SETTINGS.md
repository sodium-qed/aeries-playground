# Settings and saved data

Open Playground with **S** outside an editable control, or the manager's **Aeries Playground — open settings (S)** command. This guide explains which changes save, how to separate students and years, and how to pause, clear, or update the script. For using the features, see the [feature guide](FEATURES.md); for a failed save, see [troubleshooting](TROUBLESHOOTING.md#settings-do-not-survive-reload).

## Which save control do I use?

| Where you edit | When it applies and saves | Before leaving the form |
| --- | --- | --- |
| **Settings** feature toggles | Applies immediately and attempts to save on every change | No Save button needed for the toggle |
| **Weight map → Show ungraded assignments** | Applies immediately and attempts to save | No Save button needed; this preference is global |
| Dashboard GPA/overall details: **Include**, **Honors/AP** | Applies immediately and attempts to save | No Save button needed |
| **Courses**: names, icons, periods, Honors/AP, bar range/scale, course thresholds | **Save course settings** validates all displayed course entries together | Select **Save course settings** and check its message |
| **Settings**: colors, thresholds, profile, year | **Save settings** validates the fields and applies the form | Select **Save settings** and check its message |
| **Course grading profile** | Edits save automatically; complete valid rules apply, incomplete/invalid edits remain a draft | Check the status; **Save course grading profile** validates explicitly and focuses the first invalid field |
| Replacement rule list | Adding/removing a rule saves automatically; an explicit save is also available | Finish and add the rule, or clear unfinished entry fields |
| Score, Complete, Count, Range, or a new hypothetical assignment | Changes only the current in-memory scenario | There is no scenario save button |

Switching dialog tabs or reopening a form can discard unsaved Courses and ordinary Settings fields without a warning. **Save settings** does not save the Courses form, and **Save course settings** does not save a scenario. Closing the dialog alone leaves grade testing active.

Automatic saving can fail. A change may work for the current visit even when it was not stored. Storage errors update immediately in an open Playground dialog and the dashboard GPA/overall summary; grading-profile and replacement controls also report their own save status.

## Default toggles

These are fresh-install defaults, not a reset of an existing installation's choices.

| Setting | Default | What it controls |
| --- | --- | --- |
| **Enable Playground** | On | Master pause for page enhancements and integrations |
| **Dashboard grade colors** | On | Threshold colors for recognized dashboard titles/grades |
| **Show 4/3/2/1 on dashboard** | Off | Custom numeric marks; also selects rating mode instead of letter-based GPA |
| **Overall grade / GPA above classes** | On | Dashboard summary using visible, included courses |
| **What class is next (MVHS)** | Off | Public schedule/clock access after explicit opt-in |
| **Course nicknames & icons** | On | Customized dashboard course titles/icons; nickname use in the next-class panel |
| **Grade progress bars** | On | Dashboard bars with threshold markers |
| **Grade colors on details page** | On | Threshold colors for posted and hypothetical assignment/category/course grades |
| **Assignment impact labels on the page** | On | Calculated leave-one-out assignment impacts |
| **Ridiculously precise mode** | On | Longer formatting for supported calculated values |
| **Category filter on gradebook pages** | On | Local category buttons above assignments |
| **Assignment weight map** | On | Map tab and gradebook map button |
| **Show ungraded assignments**, in Weight map | Off | Ungraded-work weight preview |

All these preferences are global across profiles and years. KBAR has no saved on/off preference: the player starts unloaded on every fresh page load. **Honors/AP** is a separate per-course choice and starts unchecked; summary inclusion starts checked.

The **KBAR music** box has a playback button labeled **Play KBAR (P)**, **Pause KBAR (P)**, or **Retry KBAR (P)**, with visible status below it. Playback and pause requests do not need a Save button. The status reflects the player's messages, not a measurement of audible output. **Close KBAR player** unloads the embed, and **Open on YouTube** remains available even while Playground is paused.

Existing valid preferences are generally retained on upgrade. The source migrates some former built-in defaults, including old average cutoffs, bar minima, a former third-band color, and automatically generated icons. An older enabled schedule widget without the explicit consent flag is forced off until the explained toggle is enabled.

### Colors, thresholds, and precision

In **Settings → Grade colors & thresholds**, set the three descending nonnegative cutoffs and four colors, then select **Save settings**.

| Band | Percentage default | Average default | Default color |
| --- | --- | --- | --- |
| 4 | At least 95 | At least 3.7 | Dark blue, `#1f1f7f` |
| 3 | At least 85 | At least 3.1 | Dark green, `#1f7f1f` |
| 2 | At least 75 | At least 2.5 | Orange, `#c05600` |
| 1 | Below 75 | Below 2.5 | Dark red, `#7f1f1f` |

**Courses → Custom thresholds for this course** overrides the matching global cutoff set. **Bar scale** chooses percentage or average display thresholds; it does not select the lab's calculation method. Bar range edits change the display span, normally 50–100 or 1–4. A detected average course can initialize or restore its average bar scale automatically.

Colors, numeric ratings, bars, and calculation rules are separate controls. Changing cutoffs changes custom ratings and colors; it does not change letter-based GPA or a teacher's grade. Bars and map entries keep using the palette even when dashboard/detail color toggles are off. The details toggle also controls threshold colors on existing and added hypothetical scores and totals. Counted ranges use neutral colors.

Precise mode generally uses up to eight decimal places instead of two for calculated grades and impacts, with trailing zeros removed. Summary GPA/rating displays and map weight percentages use up to two; map point details use up to four. Native posted text keeps its own formatting. Extra on-page score precision and raw-score conversion are separate from this setting; see [precision](FEATURES.md#fractional-score-precision).

## What changes and what stays saved

Playground configuration is stored by the userscript manager under `aeries-playground-v1`. A successful save stores the tab's configuration, not a copy of the gradebook.

| Item | Scope and lifetime |
| --- | --- |
| Feature toggles, colors, default cutoffs, current profile/year labels, schedule consent | Global saved configuration |
| Discovered course names and identifiers | Saved automatically in the selected profile/year |
| Course aliases, icons, period overrides, bar ranges/scales, course cutoffs | Saved per course/profile/year through **Save course settings** |
| Summary inclusion and Honors/AP eligibility | Saved per course/profile/year |
| Course grading policy and unfinished profile-form draft | Saved per course/profile/year; invalid drafts retain the last valid policy, if any |
| Replacement policy, cap, and assignment references | Saved per course/profile/year; references contain names, IDs, categories, and whether an assignment was hypothetical |
| Posted scores, calculated GPA, impacts, weight previews | Not persisted by this source |
| Hypothetical scores, added assignment cards, and ranges | Memory only; reset, exit, leaving/reloading the page, or a recognized gradebook/scope change clears them. Back/Forward restoration does not restore a scenario. |
| Target inputs and calculated target result | Memory only; exit/reload clears them, and relevant scenario/input changes invalidate the result. **Reset hypothetical changes** is not a blanket reset of planner fields. |
| Selected category, map selection, public schedule cache, KBAR playback | Page memory only |

Saved rules referencing a hypothetical assignment do not recreate it or restore its scores. After reload, recreate one assignment with the saved exact name/category, or remove the unmatched rule. Save replacement rules again after a rename if you want the new reference recorded.

Profile labels are organization aids, not separate private accounts. Saved names, course identifiers, and rule references are not anonymized or encrypted by Playground. Manager sync or backups may copy them elsewhere. See [Security](../SECURITY.md) for the full data and integration details.

## Select a profile and school year

**Settings profile** and **School-year starting year** start blank. The pair of labels chooses a collection of course settings; it does not change the account signed in to Aeries.

When changing students/accounts, use this order so the current page is not discovered under the new label:

1. Close other Aeries tabs first, so they cannot later flush an older pending save.
2. Turn **Enable Playground** off in the remaining tab. Check the displayed save status and resolve any storage error before switching accounts.
3. Switch to the intended student/account in Aeries.
4. Open Playground Settings while paused. Enter the intended **Settings profile** and **School-year starting year**, then select **Save settings** and check for success.
5. Re-enable Playground and visit the intended dashboard or gradebook to discover that scope's courses.

Use a new year label when starting a new school year. A supplied year must have four digits, and a profile may contain up to 60 characters. For example, `Student A` and `2026` are a different scope from `Student A` and `2025`. Labels are trimmed and case-sensitive; return to an existing scope by entering the same pair.

There is no automatic account/student/year selection, profile picker, or individual-profile delete control. On-page identifiers check score matches only. A scope change exits the current scenario, and course discovery runs immediately when Playground is active. Global toggles, colors, cutoffs, and schedule consent remain shared when you switch scopes.

## Storage errors and multiple tabs

Each tab loads its own settings copy. Ordinary saves write that copy in full; concurrent edits are last-write-wins, not merged. A later save can restore an older nickname, map preference, or schedule opt-in. Reload other Aeries tabs after important configuration changes, especially consent changes and master pause.

A successful in-app clear writes a reset marker. An older tab with this source checks the marker before an ordinary save and can report **Saved settings were cleared in another tab. Reload this tab before saving.** This does not immediately stop its running features. Reload it; do not keep making changes in that stale tab. Older script copies without that check can still rewrite settings.

If a save reports **Could not save to browser storage. Changes work for this visit only**, keep the tab open while checking the manager and retry the relevant save.

Unreadable, malformed, or unsupported saved configuration uses temporary defaults and blocks ordinary saves, so those defaults do not overwrite the stored data. Recover the manager or use a compatible script, then reload. **Clear saved settings and pause** can replace that data only after you explicitly confirm and the storage operation succeeds.

Invalid known course policies, replacement entries, or malformed profile drafts are ignored with a review notice; valid entries and unrelated older fields remain. Older policies may omit optional fields such as rounding. The script keeps that omission and continues using the native/default behavior. For detailed recovery, see [settings do not survive reload](TROUBLESHOOTING.md#settings-do-not-survive-reload).

## Pause, clear, or remove Playground

| Goal | Action | Result in this tab |
| --- | --- | --- |
| Pause enhancements temporarily | Turn **Enable Playground** off | Testing exits; enhancements pause; schedule work stops and KBAR unloads. Saved settings and schedule consent remain. |
| Stop schedule access | Turn **What class is next (MVHS)** off | Consent is revoked; cached schedule data is cleared, pending requests are canceled where possible, and late replies are ignored. |
| Stop and unload music | **Settings → Close KBAR player** | Removes the embed. **P** only requests pause/resume. |
| Run native Aeries without Playground | Disable the userscript in the manager, then reload every Aeries tab | Playground no longer runs there; saved configuration remains. |
| Remove the script | Remove it through the manager, then reload every Aeries tab | Manager-specific removal options determine how stored configuration is handled. |
| Reset all active configuration | **Settings → Clear saved settings and pause**, then confirm | On success, removes profiles, course customizations, rules/drafts, and preferences; leaves Playground paused. |

After an in-app clear, schedule consent and the ungraded map preview are off. Re-enable Playground when ready; schedules require their own opt-in again. A failed clear reports a storage error and restores the previous in-memory settings.

Master pause keeps schedule consent, so re-enabling Playground can resume previously enabled schedule requests. While paused, the Weight map tab labels its combined action **Enable Playground and weight map**. Reload other Aeries tabs after a pause, schedule revocation, or clear; those actions do not synchronize the tabs immediately.

Clearing configuration is not a routine troubleshooting step. It does not delete manager sync/backups or YouTube-controlled storage. To erase configuration through the manager, close other Aeries tabs first and use the manager's storage controls; otherwise an open tab can write its copy again.

## Update the userscript

1. Choose the intended [release asset or main-branch source](FEATURES.md#available-release), then review the complete file.
2. Install it as the replacement for the existing script through your userscript manager. Keep only one copy enabled.
3. Check the installed version/source and manager update preference, then reload Aeries tabs.
4. Recheck the feature that prompted the update. An installed older release does not gain a new control just because the documentation changed.

The source uses `@downloadURL none`. A fresh Tampermonkey setup is configured for manual updates, but an existing installation can retain its previous update preference; other managers may differ. Updating does not erase saved configuration. Current scores/ranges are temporary, so reload ends that scenario.

For installation-specific browser/manager instructions, return to the [README](../README.md). Use [Troubleshooting](TROUBLESHOOTING.md) if the expected controls still do not appear.
