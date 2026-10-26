# Troubleshooting

Choose the symptom below. Start with the smallest recovery step that fits; clearing all settings is rarely necessary. The [feature guide](FEATURES.md) explains the controls, and the [settings guide](SETTINGS.md) explains saves and resets.

| Problem | Jump to |
| --- | --- |
| No Settings, grade tools, or expected courses | [Controls and course discovery](#controls-or-courses-are-missing) |
| A total, impact, or map is unavailable | [Gradebook baseline](#gradebook-totals-do-not-match) |
| A preview assignment has no circle | [Weight map](#weight-map-and-ungraded-preview) |
| A score, target, range, or replacement will not work | [Grade testing](#grade-testing-targets-and-ranges) |
| GPA or dashboard display looks wrong | [GPA and display](#gpa-and-dashboard-display) |
| Schedule is missing, stale, or has no seconds | [Next-class schedule](#next-class-schedule) |
| KBAR is silent or will not stop | [KBAR playback](#kbar-playback) |
| Changes disappear after reload or in another tab | [Saved settings](#settings-do-not-survive-reload) |
| Layout or behavior changed unexpectedly | [Compare with native Aeries](#compare-with-native-aeries) |

## Controls or courses are missing

1. Confirm you are on a supported `https://mvla.aeries.net/student/*` page, with the userscript manager and one copy of Playground enabled. Use the [README's installation instructions](../README.md) for browser-specific execution permissions.
2. Open Settings with **S** outside an editable field or grade-lab control, or use **Aeries Playground — open settings (S)** in the manager menu. There is no floating launcher.
3. Check **Enable Playground** and the feature's own toggle. The gradebook toolbar requires a recognized Aeries gradebook; the GPA and next-class panels require visible dashboard course cards.
4. Visit the dashboard or the missing course's gradebook. Course discovery reads those pages; it does not retrieve another student's courses or an unseen transcript.
5. If a specific newer control is absent, check the installed edition against [Available release](FEATURES.md#available-release), update the intended copy, and reload.

The **Show ungraded assignments** checkbox is inside the **Weight map** tab, not in the Settings toggle list. The Weight map tab needs the currently open gradebook. **Course grading profile** and **Explain my grade** are buttons in the page's gradebook toolbar, not dialog tabs.

For a student/account change, follow the [paused profile-switch workflow](SETTINGS.md#select-a-profile-and-school-year). Changing labels while enabled immediately discovers the current page under those labels.

## Gradebook totals do not match

Playground checks the posted baseline before presenting a complete estimate. Read the error above the assignments, then work through this order:

1. Confirm the course and grading period selected in Aeries.
2. Turn Aeries' **Show only missing assignments** off and wait for new rows and totals. Playground's own category filter is safe to leave on because it only changes which already-loaded rows are displayed.
3. Exit grade testing if active, then inspect the posted category and overall totals. **Explain my grade** can expose the arithmetic, but **A complete matching total is unavailable** means the overall reconstruction still failed.
4. If a supported teacher policy explains the difference, configure the [course grading profile](FEATURES.md#course-grading-profiles) and any applicable replacement rules from that policy. A hypothetical score edit cannot repair missing or mismatched posted data.
5. If the mismatch remains, reload once and compare with native Aeries. The parser may not support this layout or rule; use posted Aeries totals and the teacher's policy for the actual grade.

| Message or situation | What to check |
| --- | --- |
| **Waiting for the selected gradebook or filter to finish loading…** | Aeries has changed the selector/filter but the old rows remain. Wait for the load; reload if it stalls. The script will not reuse those rows for the new selection. |
| Category totals are required | Confirm category totals are displayed in a recognized gradebook. A list of assignments alone is insufficient. |
| Assignment totals/averages do not match | Check that the full selected grading period has loaded. Missing, skipped, or unsupported rows can cause the mismatch. |
| Calculated grade does not match the displayed grade | Review category weights, score limits, and supported grading rules. Do not adjust scores merely to force agreement. |
| No graded assignments yet | Ordinary impacts/current-counted weights need a counted grade. An entirely ungraded course can permit first-score testing or a weight preview only when its separate empty-baseline checks pass. |
| Only 0% categories have grades | There is no positive-weight counted grade yet. A known 0% category is not an unknown weight. |
| A profile makes testing work but posted impacts/map remain unavailable | Saved simulation rules may reconcile the lab baseline. Posted impacts and the map use their own checks with Aeries-read rules. |
| Some scores contain more decimals than the native label | Eligible matched on-page values can refine the input. Precise mode only changes formatting and does not control matching eligibility. |

An impact label can be absent for a sole counted assignment because removing it leaves no comparison grade. During counted ranges, **Grade impact varies with ranges** is expected; switch to single scores for numeric impacts.

## Weight map and ungraded preview

| Symptom | Recovery or explanation |
| --- | --- |
| No map at all | Enable **Assignment weight map** and open one recognized gradebook. Resolve any baseline error above. |
| No ungraded entries | Turn on **Show ungraded assignments** inside Weight map. Explicitly excluded/excused/dropped work stays omitted. |
| A row says **Positive possible points unavailable** | Aeries has not supplied usable positive possible points. It stays in the preview list, outside the denominators, without a circle. |
| A row says **Category weight unavailable** | Its weighted category has no valid known weight. It stays in the list and outside preview denominators. |
| A row has 0% and no circle | Its category has known zero weight. Use its list button to inspect it. |
| Every category is 0% | There are no positive-weight circles; the map does not invent a counted grade. |
| Graded weights change when preview is enabled | Ungraded possible points change denominators and can activate categories. Turn the preview off for current counted shares. |
| Circle size looks unchanged despite a different percentage | Each map rescales its largest circle to the same visual size. Compare displayed percentages across preview states or courses, not absolute diameters. |
| A score of zero is shown as graded | A usable numeric zero counts, even when Aeries says **Grading Complete: No**. A blank score is different. |
| The map ignores hypothetical score edits | Expected: **Posted assignment weight map** continues using posted rows and Aeries-read rules. It does not apply saved replacement rules. |
| **Show in gradebook** cannot find the row | Reopen the map after Aeries finishes refreshing and select it again. The jump respects the current table/card view; it can clear Playground's conflicting category filter but cannot reveal every Aeries-hidden row. |
| A circle is too small to read its number | Use the assignment list below it; small circles omit text so their area stays proportional. |

The preview sizes work as if known possible points counted. It does not assign missing scores, forecast grades, or change lab Count choices. See [the feature instructions](FEATURES.md#assignment-weight-map) and [formulas](CALCULATIONS.md#ungraded-assignment-weight-preview).

## Grade testing, targets, and ranges

| Symptom | Recovery or explanation |
| --- | --- |
| Score/Complete entry is invalid | Use ordinary nonnegative decimal numbers; supply positive totals. Do not include `%`, thousands separators, or scientific notation. Use raw marks when questions have unequal values. |
| Complete has an unknown total | Enter the raw total, or work directly in **Score** points. Do not assume the number of questions equals the points possible. |
| Raw conversion seems short by a hundredth | Raw marks convert to gradebook points rounded down to two decimals. For example, 2/3 of 10 is 6.66. Direct point entry is not deliberately truncated by that conversion. |
| Complete shows an approximate equivalent | Entered/validated Score points are retained. Leaving the inferred raw equivalent unchanged does not convert it back through truncation. |
| Score denominator is read-only | Recognized four-point gradebooks use a fixed detected denominator. A saved simulation scale does not rebuild the row controls. |
| An excluded row still contains unfinished inputs | Count off keeps the draft but skips its score, total, name, and category validation. Counted rows, the posted baseline, and active rules still need to be valid. Re-enable Count to validate that row again. |
| A new assignment cannot use a new category | The selector contains categories already read from the gradebook, or Uncategorized if none exist. There is no arbitrary category-creation control. |
| **Calculate required score** is disabled | Turn off the counted ranges. Uncounted ranges do not prevent single-score solving. |
| Target result is unavailable | Enter a nonnegative target and maximum, a positive increment, and positive possible points. Finish/add or clear replacement fields, resolve unmatched saved rules, and check the baseline. |
| Target is unreachable | It cannot be met using allowed multiples of the increment up to the maximum. An off-increment maximum is not an extra candidate. Verify the intended maximum/increment and policy. |
| **Apply hypothetical score** is disabled after an edit | The earlier result is stale. Calculate again with the current inputs and scenario. |
| Range result is unavailable | Check ordered, nonnegative bounds, positive Score/raw totals, weights for newly active categories, the baseline, and unfinished/unmatched replacement rules. |
| Range bounds disappeared after turning Range off | Turning it off discards that row's bounds and restores its single-score draft. Turning it on again initializes a new range. |
| A replacement is listed but changes no score | Both rows must count and have scores; **Only if higher** also requires an improvement after the cap. Sources use entered scores, so rules do not cascade. |
| Saved hypothetical replacement is inactive | Recreate exactly one assignment with the saved case-sensitive name/category, or remove the rule. Save rules again after a rename if you want the new reference recorded. |
| Conflicting replacement rules | Multiple sources for one target must all use **Only if higher**. Remove conflicting or duplicate rules before adding the intended one. |
| A grading profile is a saved draft | Complete all required fields, including rounding. The last valid profile remains active until the draft is valid; **Save course grading profile** focuses its first invalid field. |
| Copying Aeries values did not activate a profile | **Copy values shown by Aeries** copies detected fields and leaves rounding for you to choose. Complete the draft and inspect its status. |
| Reset did not undo a policy change | Rule additions/removals save immediately. Scenario reset reloads saved rules; it does not roll them back or clear every unfinished planner field. |
| Closing Settings did not end testing | Use **Exit grade testing** in the gradebook. Closing the dialog leaves the scenario active. |
| Browser Back/Forward did not restore hypothetical scores | Expected: leaving the page clears the temporary scenario, including when the browser later restores that page from its navigation cache. Saved grading policies and replacement rules remain. |
| A printed page contains hypothetical values | Exit testing before printing the posted gradebook. |

For a fresh score scenario, use **Reset hypothetical changes**. To remove a saved calculation policy, use **Clear saved grading profile**; replacement rules are separate and remain. To restore the posted page without deleting saved policies, use **Exit grade testing**. See [the lab guide](FEATURES.md#grade-testing-lab) for the full workflow.

## GPA and dashboard display

| Symptom | Recovery or explanation |
| --- | --- |
| Only one overall score appears | Turn **Show 4/3/2/1 on dashboard** off for the two letter-based GPAs. Keep **Overall grade / GPA above classes** on. |
| The two GPAs match unexpectedly | Check **Honors/AP** on the included A/B/C courses eligible for the supported bonus. D/F gain no bonus. In Courses, select **Save course settings**; dashboard details save immediately. |
| A course is absent from GPA | It must have a visible dashboard card, be included, and have a recognized A–F letter. Honors/AP does not override exclusion. Pass/fail, blanks, and numeric-only marks are skipped. Duplicate course identities use the first usable letter and count once. |
| Plus/minus marks do not change GPA | Expected: both GPA scales ignore plus/minus. They also ignore custom thresholds and hypothetical score edits. |
| A numeric rating differs from the letter | Ratings use your thresholds, not the teacher's letter scale. Turn numeric display off to inspect the original mark; the replacement does not supply an original-letter tooltip. |
| A nickname/icon does not appear | Enable **Course nicknames & icons**, save the Courses form, and check the selected profile/year. Clearing a name/icon restores/removes that customization. |
| A bar is full before 100, or begins above zero | Inspect the course's bar minimum/maximum. Bars clip to their chosen display span; the posted number stays visible. |
| No numeric bar appears | The card has no recognized numeric grade. A recognized letter may still count toward GPA. |
| Some colors remain after a color toggle is off | Bars/map use the shared palette independently. **Grade colors on details page** controls threshold colors for posted and hypothetical grades; range values and Hypothetical badges retain their neutral/annotation styling. |

The displayed GPAs are equal averages of selected visible letters, not transcript or credit-weighted GPAs. Hidden saved courses do not count. See [GPA details](FEATURES.md#weighted-and-unweighted-gpa-together).

## Next-class schedule

| Symptom | Recovery or explanation |
| --- | --- |
| Panel missing | Enable Playground and the explained **What class is next (MVHS)** toggle, then open a dashboard with visible course cards. The integration starts off. |
| Schedule unavailable | Select **Retry schedule** when offered. Check userscript network permission and the linked public source; invalid or stale primary data is not used for a countdown. |
| Loading does not finish | Requests have local deadlines of 15 seconds for MVHS and 10 seconds for bell.plus; a suspended browser can delay these timers. When the page is active again, use **Retry schedule**, or turn the schedule toggle off and on to start fresh in this tab. The manager may still fail to stop an underlying transfer. |
| Countdown has minutes but no seconds | Minutes are the intended fallback when bell.plus clock/schedule checks are stale, unavailable, or disagree. A future date must agree too. |
| Next class shows only a period | Open **Match classes to periods**, set an exact period such as `2A`, resolve duplicate matches, and save. Only visible dashboard cards are matched; unmatched periods are not skipped as free periods. |
| Panel already counts down to another day during the last class | Expected: no later student slot remains today. The current class can still be shown alongside the next school day. |
| No upcoming class after school | The search stops fourteen dates ahead and depends on the public calendar. It does not use a personal attendance schedule. |
| Next school day unavailable, but today's bells remain visible | A future date has an unavailable schedule or conflicting calendar entries. Check mvhs.io and allow the cache to refresh. Playground stops at that uncertain date instead of guessing a later school day. |
| Times differ from local device time | The panel uses America/Los_Angeles, including daylight-saving changes. It never changes the device clock. |
| Another tab keeps requesting schedules after you turn them off | Reload or close the other Aeries tabs. Each retains its loaded consent/settings until refreshed. |

Public MVHS data is the primary schedule; bell.plus cross-checks it for seconds. A five-minute freshness window describes this tab's fetch, not when the publisher last edited its calendar. Check the school's announcements if a public schedule conflicts with them. See [schedule behavior](FEATURES.md#mvhs-next-class-panel).

## KBAR playback

1. Enable Playground. With its dialog closed, press **P** outside editable/lab controls, or use **Settings → Play KBAR (P)** or the manager's KBAR command. The Settings button changes to **Pause KBAR (P)** while playback is requested and **Retry KBAR (P)** after a load/player failure.
2. If silent, read the status below the Settings playback control. If blocked or unavailable, retry once or use **Close KBAR player**, then start it again. Browser/media restrictions, networking, or YouTube embed behavior may prevent playback.
3. If still unavailable, use **Open on YouTube** in Settings. Close the embed separately to avoid simultaneous playback.
4. To stop and unload the embed, use **Close KBAR player**. **P** requests pause/resume and leaves the embed loaded.

The player and its native controls remain offscreen. Settings exposes its reported status and errors; a playing message does not guarantee audible output. **Pausing** means the request is still awaiting acknowledgment. The original-video link remains available with Playground paused or no embed loaded; opening it neither starts nor closes the embed.

If audio continues after a pause request, close the player. Master pause also unloads it in this tab; other tabs' players are separate. If the page gains blank scroll space after KBAR, keep one updated script enabled, reload, and [report a remaining layout problem](#report-a-reproducible-problem).

## Settings do not survive reload

| What happened | What to do |
| --- | --- |
| Course/form edits disappear on tab change | Save **Courses** or ordinary **Settings** fields before switching dialog tabs. These forms are not automatically saved. |
| A toggle seems saved but returns after reload | Check the storage error in the open dialog or dashboard summary, and inspect the manager's storage operation. Avoid saves from other tabs while checking. |
| **Could not load saved settings** or **Saved settings have an unsupported or invalid format** | Ordinary saves are blocked and the stored data is retained. Recover the manager or use a compatible script, then reload. Explicitly clearing settings can replace the data if you intend a full reset and the write succeeds. |
| **Some invalid saved settings were ignored** | Review course settings, grading profiles, and replacement rules. Invalid known entries are not applied; valid entries remain. This recovery notice is separate from a failed save. |
| **Could not save to browser storage. Changes work for this visit only.** | Keep the tab open while checking the manager, then retry the relevant Save control. Do not rely on persistence until a save succeeds. |
| **Saved settings were cleared in another tab. Reload this tab before saving.** | Reload promptly before making further changes. The old running state is not synchronized immediately. |
| A change is overwritten by another tab | Use one tab for configuration, then reload the others. Ordinary saves replace the stored settings copy rather than merging fields. |
| Wrong settings after changing student/year | Use the correct trimmed, case-sensitive profile/year pair and the [paused switch sequence](SETTINGS.md#select-a-profile-and-school-year). |
| Saved course settings differ between dashboard and gradebook | Playground reuses an exact course identity or one unambiguous verified older URL key. If older keys conflict or include an unmatched year/section, it keeps a separate entry instead of guessing. Check the selected course and edit that entry in Courses. |
| Scores/ranges disappear after exit or reload | Expected: scenarios are temporary. Saved grading rules do not save scenario scores. |
| An in-app clear fails | The script restores the previous in-memory settings and reports an error. Check storage and retry only if you still intend to reset all configuration. |

See [save scopes](SETTINGS.md#what-changes-and-what-stays-saved) before attempting a reset. Clearing settings does not remove sync/backups and should not be the first response to a missing feature.

## Compare with native Aeries

Disable duplicate or older copies first. To compare with the original page, disable the userscript in the manager and reload every affected Aeries tab. This retains saved Playground configuration. If native Aeries is also affected, the problem may be in the page or another extension; if only Playground is affected, note the control and steps that trigger it.

Aeries layout changes can invalidate parsing. Pause/disable Playground if the local display becomes confusing, then use posted Aeries values until the issue is understood. Avoid collecting a real page export merely to demonstrate the problem.

## Report a reproducible problem

Provide the installed version/source, browser and userscript manager, affected feature, relevant settings, steps, expected result, and actual result. Use fictional course names, assignments, and scores. For a calculation mismatch, describe the method, category weights, score limits, and replacement policy with that fictional example.

Do not post account access, cookies, student identifiers, settings exports, page source, or unredacted screenshots/gradebooks. See [Contributing](../CONTRIBUTING.md) for ordinary reports and [Security](../SECURITY.md) for sensitive concerns.
