# Feature guide

This guide describes Aeries Playground's controls, defaults, and limitations. See the [README](../README.md) for installation and supported pages, and the [calculation reference](CALCULATIONS.md) for formulas.

For a first session, open the Aeries dashboard to discover courses, configure display preferences in **Settings**, and then open one course's gradebook with all assignments loaded. Compare its posted totals before starting a hypothetical scenario. The optional next-class panel is configured separately; grade tools do not require it.

## Available release

Except for sections explicitly marked **upcoming**, this guide describes the **2.3.0 prerelease**, combining validated on-page fractional-score precision, the after-school countdown, weighted/unweighted GPA, and optional KBAR playback with the visible **Settings → Open on YouTube** fallback. The README installation link follows `main` and currently installs this prerelease. For the version-specific copy, use the attached userscript:

```text
Release: https://github.com/sodium-qed/aeries-playground/releases/tag/v2.3.0
Asset:   https://github.com/sodium-qed/aeries-playground/releases/download/v2.3.0/aeries-playground.user.js
```

Review the particular file you intend to install and keep only one copy enabled. This is a **Pre-release**, not the stable **Latest** release. The [stable Latest release](https://github.com/sodium-qed/aeries-playground/releases/latest) remains **2.0.0**, which does not include weighted GPA, KBAR, the fractional-score adapter, or the after-school countdown. `/releases/latest/download/...` targets that stable release; use the explicit tagged asset above for this prerelease.

### Fractional-score precision

Aeries can display **14.67 / 15** while already including **14.66666666666667 / 15** in the page's embedded assignment data. The adapter uses that more precise earned score for reconstruction and grade testing only when it matches the current student, course, assignment, dates, denominator, and displayed percentages. This can resolve a mismatch caused by summing rounded rows.

This runs automatically for eligible percentage-based gradebooks; **Ridiculously precise mode** only changes formatting. It does not fetch additional records or recover precision for every assignment. Missing, ambiguous, excluded, or inconsistent records retain their displayed values, and four-point gradebooks are unchanged. Native Aeries labels can still show the rounded score while the local model and score editor use the validated value. See [the precision rules](CALCULATIONS.md#on-page-score-precision) and [data handling](../SECURITY.md#on-page-score-matching).

### Countdown after school

After today's classes end, the panel lists the next school day's first student slot with a live countdown to its start, including weekends and dates marked as no school in the public calendar. It searches up to fourteen days ahead and converts the target's Pacific wall time with daylight-saving changes accounted for.

The countdown shows days, hours, and minutes as appropriate. Seconds require fresh bell.plus clock verification and agreement for the upcoming date as well as the current day's applicable schedule checks. If those checks fail, it uses minutes. Missing or invalid schedule data can still make the panel unavailable. This does not add schedule services or change the existing opt-in, current-tab cancellation, or manual course-to-period matching.

## Upcoming weight-map prerelease

The **2.4.0 prerelease** is planned for **Sunday, October 18, 2026 at 11:59 PM America/Los_Angeles (Pacific time)**. It adds [Show ungraded assignments](#upcoming-show-ungraded-assignments) inside the weight map. This documentation update does not publish that source: `main` still installs the current prerelease described above, and the new checkbox is not available there yet.

When published, the new userscript will be publicly downloadable under tag `v2.4.0`, with metadata `@version 2.4.0`, as a published **Pre-release**, not a draft or the stable **Latest** release. The existing stable release will retain **Latest**. The raw-`main` installation link will then serve the new prerelease. The intended version-specific addresses below are publication targets, not currently available downloads:

```text
Release: https://github.com/sodium-qed/aeries-playground/releases/tag/v2.4.0
Asset:   https://github.com/sodium-qed/aeries-playground/releases/download/v2.4.0/aeries-playground.user.js
```

Use those explicit tagged addresses once published. `/releases/latest/download/...` continues to target the stable edition and must not be used as the prerelease download. Review the particular source before manually updating. Syntax and numerical checks on the prepared weight-map change passed; live Aeries/Tampermonkey/browser integration has not been verified.

## Weighted GPA prerelease

The earlier **2.1.0 prerelease** introduced the weighted-GPA controls, under tag `v2.1.0` with userscript metadata `@version 2.1.0`. It remains a historical **Pre-release** download; it does not include KBAR and is not **Latest**. Its release and asset addresses are:

```text
Release: https://github.com/sodium-qed/aeries-playground/releases/tag/v2.1.0
Asset:   https://github.com/sodium-qed/aeries-playground/releases/download/v2.1.0/aeries-playground.user.js
```

For the current combined prerelease and the stable edition, see [available release](#available-release).

## KBAR music

KBAR, including the visible Settings fallback, is available in the **2.3.0 prerelease**. It starts off on every page load and saves no playback preference. It plays the English KBAR video on loop only after you request playback. **Enable Playground** must be on; enabling the schedule panel is not required.

| Control | Behavior |
| --- | --- |
| **P** | First press creates the player and requests playback; subsequent presses request pause or resume. The shortcut ignores editable controls, repeated/composing key events, and Ctrl/Alt/Meta combinations. It is inactive while the Playground dialog is open. |
| **Settings → Play / pause KBAR (P)** | Starts or toggles playback while Settings is open. |
| **Settings → Close KBAR player** | Stops playback and removes the hidden player. |
| **Settings → Open on YouTube** | Opens the original video in a new tab, including when the hidden embed fails. Does not start or close the embed. |
| Tampermonkey **Aeries Playground — KBAR play/pause (P)** | Starts or toggles playback through the manager menu. |

The YouTube player is kept hidden outside the visible layout, so starting KBAR does not add blank space or increase the page's scroll height. Playback is controlled through **P**, Settings, or the userscript manager menu. Closing removes the hidden embed entirely. Browser restrictions, network problems, or a video that cannot be embedded can prevent playback; a keypress requests playback rather than guaranteeing it starts.

Starting KBAR loads a third-party embed from `www.youtube-nocookie.com`. Privacy-enhanced embedding is not anonymous: YouTube receives ordinary connection information and playback activity, may use cookies or other browser storage, makes its own media/advertising requests, and may show ads. Playground's player URL and control messages contain no grades, assignments, course names, profiles, or Aeries account data. The embed receives the Aeries site origin, not the full gradebook URL. See [Security and privacy](../SECURITY.md#kbar-playback).

**Pausing leaves the embed loaded; closing unloads it.** Pausing therefore does not stop all third-party network activity. Turning off **Enable Playground**, clearing saved settings, or leaving the page also removes the player in that tab. Closing cannot undo requests already sent or clear storage controlled by YouTube. YouTube's cross-origin player loads its own code; Playground does not inject that code into the Aeries page's JavaScript realm. Its internal message transport may change, so use the visible **Settings → Open on YouTube** link if embedded playback fails. This user-initiated link sends no referrer and allows no opener access; it works even with Playground paused or the embed closed. Close the embed separately to avoid simultaneous playback.

## What changes and what stays saved

| Action or data | Behavior |
| --- | --- |
| Course labels, colors, periods, and grading preferences | Saved for reuse; course settings belong to the manually selected profile/year. |
| Honors/AP selections | Saved per course in the selected profile/year; default unchecked. These are preferences, not saved grades or GPA results. |
| Upcoming: Show ungraded assignments | Defaults off; saves immediately as one global weight-map display preference, shared across courses and settings profiles/years. Assignment scores and calculated preview weights are not saved. |
| Course grading profiles and replacement rules | Saved separately from the current hypothetical scenario. Incomplete grading-profile forms are saved as drafts. |
| Hypothetical scores, score ranges, and added assignments | Temporary; leaving the scenario or reloading clears them. |
| Posted grades and assignments | Read from the current Aeries page, including validated matching embedded scores; local controls do not submit changes to Aeries. |
| Next-class panel | Off until enabled in Settings; turning it off stops schedule work in the current tab. Reload other Aeries tabs promptly. |
| KBAR playback | Off on every page load; playback state is not saved. Starting creates the embed; pausing keeps it loaded; closing removes it. |

The security and privacy comment in the published script is the full reference for permissions, stored fields, external requests, and manager-specific behavior. [SECURITY.md](../SECURITY.md) explains how to report a concern.

## Dashboard and course customization

### Course names, icons, and periods

Open **Aeries Playground → Courses** to edit discovered courses.

- **Display name** changes the dashboard label. Hovering retains access to the original title, and the course link still opens its gradebook.
- **Icon** is optional text or an emoji; new courses start without an automatically chosen icon.
- **Class period (optional override)** connects a course to the MVHS schedule panel. Leave it blank to use an unambiguous period detected on its dashboard card. Period identifiers can include suffixes such as `2A`; matching is exact.
- **Honors/AP — weighted GPA bonus** appears beside the period setting. Check only courses that should receive the bonus; no eligibility is inferred from a course name. New and previously saved courses without a selection start unchecked. Use **Save course settings** to apply it.
- **Bar scale**, **Bar minimum**, and **Bar maximum** control the progress bar.
- **Custom thresholds for this course** overrides the global cutoffs for its grade scale.

Use **Save course settings** to apply these changes. The bar scale is a display setting; simulation calculation rules have their own **Course grading profile**.

### Colors and 4/3/2/1 ratings

**Settings** provides separate toggles for dashboard colors and numeric grades. Numeric mode replaces the dashboard letter with a 4, 3, 2, or 1 based on that course's cutoffs. The posted percentage or average remains visible. The tooltip and accessible label identify the custom rating as unofficial and retain the posted letter. Turning numeric mode off restores the original letter and labels. Numeric mode is off on a fresh install.

Four color bands are shared by dashboard grades, progress bars, detail-page grades, and weight-map scores. Detail coloring covers assignment names/scores in both native views and the recognized category/course totals.

The global defaults are:

| Band | Percentage cutoff | Average-point cutoff | Color |
| --- | --- | --- | --- |
| 4 | At least 95 | At least 3.7 | Dark blue, `#1f1f7f` |
| 3 | At least 85, below 95 | At least 3.1, below 3.7 | Dark green, `#1f7f1f` |
| 2 | At least 75, below 85 | At least 2.5, below 3.1 | Orange, `#c05600` |
| 1 | Below 75 | Below 2.5 | Dark red, `#7f1f1f` |

Cutoffs must be nonnegative and strictly descending. Course-specific cutoffs take precedence. Colors and ratings describe your chosen bands; they do not change a teacher's letter-grade policy.

### Progress bars and precision

Percentage-course bars normally span **50–100**; recognized four-point-course bars span **1–4**. Each course can use another valid minimum/maximum. Threshold markers appear when they fall within that span. Values outside the span stop at the bar edge while the posted number remains visible.

**Ridiculously precise mode** shows up to eight decimal places for supported calculated values, including impacts; turning it off generally uses two. It formats the available calculation precision and does not invent hidden official decimals. Some compact displays, including the overall summary and weight labels, use their own shorter formatting. The [fractional-score adapter](#fractional-score-precision) restores eligible input scores independently of this display setting.

### Overall grade and current-year GPA

Enable **Overall grade / GPA above classes**, then choose the mode with **Show 4/3/2/1 on dashboard**.

| Numeric display | Summary | Calculation |
| --- | --- | --- |
| On | Playground overall score | Convert each included course's numeric grade to its own threshold-based 1–4 rating, then average those ratings equally. |
| Off | Estimated current-year GPA | Convert posted A/B/C/D/F letters to 4/3/2/1/0 and average them equally; ignore plus/minus and Playground thresholds. |

The number stays an **average**, such as 3.5. In numeric mode, only its **color** indicates the overall band, using **Settings → Average ≥** cutoffs.

Open **Calculation & included classes** to inspect the arithmetic and choose which classes count. The summary uses courses currently visible on the dashboard, deduplicated by course identity. Ungraded or unrecognized entries are skipped. In letter mode, F counts as zero; pass/fail and numeric-only marks are skipped.

In letter mode, the manually selected AP/Honors bonus is applied as described below. These are unofficial equal-weight estimates, without course-credit weighting, previous years, or transcript data. The “current-year” label does not mean the script downloads a transcript.

### Weighted and unweighted GPA together

With **Overall grade / GPA above classes** enabled and **Show 4/3/2/1 on dashboard** off, Playground shows **Unweighted GPA** and **Weighted GPA** together. Numeric 4/3/2/1 mode keeps its existing threshold-based overall average; selecting honors/AP courses does not change those ratings.

Open **Calculation & GPA class selection** to inspect both totals. Each class has two separate choices:

- The class inclusion checkbox decides whether it counts in **both** GPAs.
- **Honors/AP** decides whether a counted A, B, or C receives one extra point in **weighted GPA only**. This does not automatically include an excluded class. D remains 1 and F remains 0 even when checked.

| Posted letter (plus/minus ignored) | Unweighted points, all classes | Weighted points, Honors/AP unchecked | Weighted points, Honors/AP checked |
| --- | --- | --- | --- |
| A | 4 | 4 | 5 |
| B | 3 | 3 | 4 |
| C | 2 | 2 | 3 |
| D | 1 | 1 | 1 |
| F | 0 | 0 | 0 |

Honors/AP choices start unchecked, so both GPAs initially match. Set them here for immediate saving and recalculation, or use the checkbox beside each period in **Courses** and select **Save course settings**. Choices persist after reload within the selected settings profile/year; they are not inferred from names, percentages, or custom thresholds.

Both averages count the same included, currently visible courses with posted A–F letters, once per course identity and with equal course weight. Blank, pass/fail, numeric-only, or other unrecognized marks do not count. F counts as a real zero. An empty set displays a dash for each GPA, not zero. Grades and computed GPA values are not saved, and hypothetical assignment edits do not replace the posted letters used here.

For five included, checked courses with A, B, C, D, and F, unweighted GPA is **10 / 5 = 2.00** and weighted GPA is **13 / 5 = 2.60**. See [the formulas and examples](CALCULATIONS.md#weighted-gpa). These estimates do not apply transcript credit weights, institution-specific eligibility rules, or bonus caps.

## Assignment analysis

These tools use the currently open course's gradebook details: rendered assignment rows, Aeries totals, and validated matching scores already embedded in that page. The script does not download hidden gradebook records.

### Category filter

Use **Category: All / [category]** to focus on one category. Buttons show assignment counts, and the selected filter applies to both the native table and card views.

The filter only changes which posted rows are shown. Grade totals, impacts, and the weight map still use all loaded assignments. It differs from Aeries' **Show only missing assignments**, which can remove necessary data from the page and block calculations.

### Assignment impact labels

**Grade impact** labels estimate the current grade **with an assignment minus the current grade without it**, in percentage points or average points. Positive means the assignment raises the current calculated grade; negative means it lowers it.

Posted impact labels require the parsed gradebook to reconcile with the visible Aeries totals. While grade testing is active, the labels use the current hypothetical scores, Count choices, and configured grading/replacement rules. An assignment with no valid comparison grade, such as the only counted assignment, has no numeric impact. With counted assignment ranges active, the label says **Grade impact varies with ranges**; course-grade endpoints do not establish bounds for each assignment's impact.

Impacts are not the assignment's weight, its historical posting effect, or values that can be added together. See [weight versus impact](CALCULATIONS.md#assignment-weight-versus-impact).

### Assignment weight map

Open **Assignment weight map** above the gradebook or the **Weight map** tab. The current release, and the upcoming checkbox-off view, work as follows:

- Circle **area** is proportional to an assignment's share of the current counted grade, with one size scale across categories.
- Color follows the assignment's posted numeric grade and your thresholds.
- Hover, click, or keyboard-focus a circle or its list entry to see the assignment's name, category, earned/possible points, grade, weight, and calculation breakdown.
- Use **Show in gradebook** from the detail view to locate and highlight its native row. The action checks that the gradebook is still current.
- Ungraded and excluded assignments have no circle. Graded work in a zero-weight category remains in the list with a 0% label and no circle.
- Weights can change as additional assignments or categories begin counting.
- During grade testing, the button becomes **Posted assignment weight map**: the map continues to describe posted data.

Circles and list entries are ordered by assignment number, using numeric-aware ordering. Their labels use the assignment number; circle area and the displayed weight still describe grade weight.

#### Upcoming: Show ungraded assignments

**Planned for the [2.4.0 prerelease](#upcoming-weight-map-prerelease); not in the current installed source.**

1. Open a course's full gradebook, with Aeries' missing-only filter off, then open **Assignment weight map** or the **Weight map** tab.
2. Turn on **Show ungraded assignments**, directly beneath the map heading. It starts **off**, including on upgrade when no choice has been saved. The choice applies and saves immediately; no separate Save button is needed.
3. Turn it off to return to the current counted-grade view. This does not hide rows in the native Aeries gradebook or change the lab's **Count** choices.

| Checkbox | Map behavior |
| --- | --- |
| Off | Shows graded, included work using its current counted shares. Ungraded work is hidden. |
| On, with ungraded work present | Shows **Weight preview · includes ungraded assignments**. Circle sizes use known possible points and category weights for the shown work, assuming that work will count. Graded shares can change because the preview denominators change. |

Ungraded assignments with a positive known weight use **neutral gray circles** and an **Ungraded** label; graded assignments retain their score-threshold colors. Blank scores are never treated as zeros. A posted numeric zero remains a graded score, even when **Grading Complete** says **No**. Explicitly excused, excluded, or dropped assignments remain omitted, including when their score is blank.

An ungraded assignment without known positive possible points, or without a valid category weight in a weighted class, stays in the list with an unavailable-weight explanation and no circle. It does not enter the preview denominators. Work in a known 0% category has zero weight and no circle, but remains in the list. If all known categories have zero weight, no positive-weight circles appear. The map does not guess missing values or fetch future assignments.

Number ordering, assignment details, and **Show in gradebook** remain available for shown entries. During grade testing the map still uses posted assignment data, not hypothetical scores or replacement rules. The preview does not change the posted grade, current grade reconstruction, impacts, or GPA, and it does not predict the grade that an unscored assignment will earn. See the [preview formulas and examples](CALCULATIONS.md#upcoming-ungraded-assignment-weight-preview).

A course with no counted grade can show preview entries when its visible category totals reconcile and Aeries' overall grade is absent or zero; unknown weights still have no circle. Missing totals, a filtered/incomplete gradebook, or conflicting posted totals can still block the map. Turning on this checkbox does not bypass those checks.

The choice is a **global display preference**, shared across courses and manually selected settings profiles/years. It persists after reload when storage succeeds. Other open tabs keep their own loaded preferences until reloaded; a later save can overwrite an earlier choice. **Clear saved settings and pause** resets it to off. See [saved-data details](../SECURITY.md#upcoming-weight-map-preference).

## Grade testing lab

On a gradebook details page, select **Start grade testing** in the lab toolbar or beneath an assignment's percentage. The same control becomes **Exit grade testing** while the lab is active.

Existing assignments receive linked **Score** (gradebook points) and **Complete** (number correct or raw marks) controls, a **Count** checkbox, a **Range** toggle, and a per-assignment **Reset** button. Changing one score pair updates the other. A blank score means ungraded; zero is a real score. Existing four-point assignment denominators are read-only, and those books use points rather than a raw-score pair.

Raw scores convert proportionally to gradebook points, rounded down to two decimals. Entered points retain their precision; switching between points and an inferred raw equivalent does not silently round the point score. For unequal question values, use raw marks rather than the question count.

**Add hypothetical assignment** creates a card for a future assessment, styled from the native Aeries cards when available. Enter its name, choose a category, and supply a score or enable a range. Blank scores without a counted range do not count. **Remove** deletes the hypothetical card.

As you type, the lab recalculates assignment grades, category totals, and the hypothetical overall grade. An active-testing indicator and **Hypothetical** labels distinguish simulated values, including compact percentages and printed values. The posted overall grade remains available for comparison. Table/card controls for an existing assignment stay synchronized and reuse the native score typography.

**Reset hypothetical changes** clears score edits, ranges, and added assignments and reloads saved replacement rules. **Exit grade testing**, reloading, changing gradebooks/terms/settings scope, or a detected gradebook-data refresh also clears the temporary scenario. Exiting restores the original posted nodes and values. A gradebook or missing-only filter change closes testing while the page is waiting for fresh rows. Saved course policies are separate from the score edits.

The controls are local overlays. They do not submit grades or add assignments to Aeries.

If the posted baseline cannot be reconstructed from the loaded rows and visible totals, resolve that mismatch before relying on a scenario. A saved grading profile describes your chosen simulation rules; it does not establish that those rules match the teacher's policy.

### Course grading profiles

Open **Course grading profile** in the lab toolbar. A new profile starts with no preset policy; explicitly choose the fields or use **Copy values shown by Aeries** as a starting point.

| Setting | Choices and purpose |
| --- | --- |
| Calculation method | Total points or weighted categories. |
| Course grade scale | Percentage or average score, with an explicit positive average-scale maximum. |
| Category weights | Nonnegative weights, including 0; counted categories need weights, and active weights are normalized. |
| Minimum/maximum assignment score | Optional percentage limits applied before totaling. |
| Final-grade rounding | No rounding, nearest, down, or up; rounding modes use 0–8 decimal places. |

Copying Aeries values fills only what the page supplies; you still choose rounding and complete missing fields. Edits save automatically for this course in the selected profile/year. Complete, valid rules apply immediately to local simulations. Incomplete or invalid edits are saved as a draft and do not replace the last valid rules. **Save course grading profile** remains available for an explicit validation/save, and **Clear saved grading profile** removes both the policy and its draft.

Saved profiles govern local simulations. Without one, the lab uses the rules it can read from Aeries. A custom profile is not a way to bypass missing assignments or an unmatched posted baseline.

### “What do I need?”

While grade testing is active:

1. Choose the existing or hypothetical **Assignment to solve for**.
2. Enter the desired course grade, in percent or the displayed average scale.
3. Enter **Maximum earned points** and a positive **Score increment in points**.
4. Add any replacement rules that should apply.
5. Select **Calculate required score**.

The result is the minimum allowed score that meets the target under the current scenario, or an unreachable/invalid message. The selected assessment itself counts, and its replacement effects are recalculated for every candidate evaluated during the search. A breakdown shows which earlier scores change.

**Apply hypothetical score** copies the result into the local scenario. Changing relevant inputs invalidates the old result so it must be recalculated before applying. Scores are searched on multiples of the chosen increment up to the maximum; an off-increment maximum is not an extra permitted score.

Turn off counted assignment ranges before solving for one required score. The target solver uses gradebook points; raw-score and range editing remain available in the assignment controls.

### Replacement rules

A source assessment can supply its percentage to one or more earlier assignments. Each target keeps its original possible points.

Choose **Only if higher** or **Always replace**, optionally enter a replacement cap in percent, and select **Add hypothetical replacement**. Multiple sources for one target must all use only-if-higher; the best eligible improvement wins. A replacement uses the source's entered score, so replacements do not cascade through other rules.

Both assignments need counted numeric scores for a rule to take effect. The target/range calculators supply the selected candidate score first, allowing a currently blank future assessment to act as the source. The cap limits the proposed replacement, not the source assessment's own score.

Adding or removing a replacement rule saves the change automatically for the current course. **Save replacement rules for this course** remains available, and **Load saved replacement rules** reloads the stored list.

Rules remain connected while you rename a hypothetical assignment in the current session. After reload, hypothetical assignments must be recreated with matching names/categories. Unmatched rules are shown as inactive; target/range calculations require them to be resolved or removed.

### Hypothetical score ranges

Turn on **Range** beside any existing or hypothetical assignment, then enter its **Lower bound** and **Upper bound**. Several assignments can have ranges at once, and the combined result updates automatically.

- For percentage-based books, choose **# correct** or **Points** under **Bounds in**. Number-correct bounds need an **Out of** total for questions or raw marks; raw endpoints convert to points rounded down to two decimals. Four-point books use points.
- Unit switches change the display while retaining each endpoint's entered units and precision. The assignment's Score total remains editable; its single earned-score controls are disabled while Range is on.
- Bounds must be nonnegative, with the lower no greater than the upper and a positive score total. The **Count** checkbox excludes the assignment and its range when unchecked.
- Course and category totals show lower and upper values, including configured rounding, score limits, and replacements. All counted ranged assignments use their lower bounds together and their upper bounds together; other assignment scores stay fixed. Within the supported grading rules, these give the combined grade bounds.
- Ranges use neutral colors because an interval has no single grade band. Fix invalid inputs or unresolved replacement rules before totals can be shown.

These are possible-score bounds, not probabilities or confidence intervals. Turning Range off returns to the assignment's single-score draft; exiting testing clears both.

### “Explain my grade”

**Explain my grade** works for both posted reconstruction and the active hypothetical scenario. It shows:

- Earned/possible totals and grade for each category.
- Effective weight and contribution to the course grade.
- The points or weighted-category calculation.
- Omitted ungraded/excluded assignments and configured assignment score limits.
- Final-grade rounding and, in the hypothetical scenario, applied or inactive replacement rules.
- Lower- and upper-score scenarios when assignment ranges are active.

If a complete matching total is unavailable, the explanation says so. Extra displayed decimals are model results.

## MVHS next-class panel

The next-class panel starts off. Open **Settings**, read the explanation beside **What class is next (MVHS)**, and enable that checkbox to allow its public schedule requests. Saving other settings preserves your choice. Previously saved settings without this opt-in also leave the panel off until you enable it.

Turn the checkbox off to stop refreshes, request cancellation of pending transfers, ignore late responses, and clear cached schedule results **in the current tab**. Pausing **Enable Playground** also stops schedule work in that tab but retains your selected features; re-enabling Playground can resume a previously enabled panel. Grade tools remain available when only the next-class panel is off.

Reload other Aeries tabs promptly after disabling schedules or pausing Playground. Ordinary setting changes are not synchronized live between open tabs: another tab can retain its previous opt-in, continue requests, and save that old choice again. Ordinary saves use the last written settings. Turning a checkbox off in one tab does not immediately revoke another tab's running state.

With the panel enabled, the dashboard shows:

- The current period or before-school, between-periods, finished, and no-school states.
- Current start/end times and minutes remaining.
- The next student schedule slot and minutes until it starts.
- **Today's full bell schedule**, with the active slot highlighted.
- The next school day's first student slot and a live countdown when none remain today, searching up to two weeks ahead.
- Special-schedule labels from the public calendar.

Times use **America/Los_Angeles (Pacific time)**. Student slots include numbered periods and recognized tutorial/testing/assembly/rally/advisory entries, rather than treating every break as the next class.

Course names come from the currently visible Aeries dashboard cards and optional local nicknames. **Match classes to periods** opens Courses. If a period has no match or multiple matches, the panel shows the period instead of guessing. It does not infer that an unmatched period is a free period or skip it as part of a personalized attendance schedule.

The widget uses public mvhs.io schedules and checks public bell.plus schedule and time-sync data before displaying seconds. It requires fresh, same-date data and successful schedule/clock checks. Stale, unavailable, or disagreeing bell.plus data leaves the mvhs.io countdown in minutes. The relevant freshness limit is five minutes and the visible clock updates about once per second; hidden tabs pause refresh work. These ticks use in-memory data, rather than requesting the network every second.

The [after-school countdown](#countdown-after-school) extends this display to the next school day. Seconds also require agreement for that future date; otherwise the multi-day countdown uses minutes.

An unavailable or invalid mvhs.io schedule produces **Schedule unavailable** and a retry option. Public source links are provided. Use the school's announced schedule if public feeds disagree with it; a valid feed is not a guarantee that a last-minute change has been recorded. Request details can be read in the comment at the top of [aeries-playground.user.js](../aeries-playground.user.js).

## Settings, profiles, and saved data

On a fresh install, **Show 4/3/2/1 on dashboard** and **What class is next (MVHS)** are off. The other ten toggles below default to on. Existing display preferences are retained when updating; the next-class panel requires the opt-in described above:

| Toggle | Controls |
| --- | --- |
| Enable Playground | Master pause for page enhancements. |
| Dashboard grade colors | Dashboard color overrides. |
| Show 4/3/2/1 on dashboard | Threshold ratings and the overall-summary mode; off on a fresh install. |
| Overall grade / GPA above classes | Overall summary panel. |
| What class is next (MVHS) | Public schedule panel; off until you opt in. |
| Course nicknames & icons | Customized dashboard labels. |
| Grade progress bars | Bars and their posted-grade readouts. |
| Grade colors on details page | Assignment/category/course colors. |
| Assignment impact labels on the page | Reconciled posted impacts or current hypothetical impacts. |
| Ridiculously precise mode | Additional decimal places in supported calculations. |
| Category filter on gradebook pages | Local category buttons. |
| Assignment weight map | Weight-map entry point and view. |

The upcoming **Show ungraded assignments** checkbox lives inside **Weight map**, separately from the Settings toggles above. It defaults off, saves immediately, and is global across courses and profiles/years. Resetting saved settings restores it to off. See [its controls and preview behavior](#upcoming-show-ungraded-assignments).

Toggles apply and save immediately. Other Settings fields require **Save settings**. Course display edits use **Save course settings**; grading-profile forms and added/removed replacement rules save automatically. These different save behaviors are independent of the temporary grade-testing scenario.

Course-level honors/AP selections use **Save course settings** when edited in Courses, but save immediately when changed in **Calculation & GPA class selection**. Inclusion choices affect both GPAs. These preferences belong to the selected profile/year and are removed by **Clear saved settings and pause**. Posted grades and calculated GPAs are not saved; manager sync or backups may copy saved configuration, including these selections, elsewhere.

Use **Clear saved settings and pause** to clear saved profiles, course settings, grading rules, and preferences. Confirm the dialog to apply the reset. This exits grade testing, turns off the next-class panel, and leaves Playground paused. Reload other Aeries tabs promptly after clearing settings and before using them again. Reset detection can prevent stale saves once a tab detects the reset, but it is not immediate live synchronization; an already open tab can still run with its old state until detection or reload. Re-enable **Enable Playground** when you are ready to configure a fresh setup; the schedule panel requires a separate opt-in again. Clearing settings does not remove copies retained by the userscript manager's sync or backups.

**Settings profile** and **School-year starting year** partition saved course settings. Both start blank; the year, if entered, must have four digits. Student/account and school-year separation are manual. Select the appropriate profile/year before using settings for another student or school year. Gradebook and term identifiers separate courses within that scope. Global display toggles, colors, and default thresholds remain global; course customizations and policies belong to the selected profile/year.

The dialog supports keyboard tab navigation, arrow/Home/End navigation between its tabs, labeled controls, and focusable weight-map entries. It adapts its layout to the available width.

Press **S** outside an editable field to open Settings. The shortcut ignores typing in inputs, text areas, selectors, and editable content, as well as modified shortcuts such as Ctrl+S. A Tampermonkey menu command also opens Settings. The KBAR shortcut **P** is separate and inactive while this dialog is open; use its Settings buttons instead.

Read the comment at the top of [aeries-playground.user.js](../aeries-playground.user.js) for the saved-data breakdown and removal instructions.

## Updating and returning to the original page

Review the complete published script, then open its **Raw** view and install the replacement through Tampermonkey. Keep only one copy enabled and reload Aeries afterward. A fresh Tampermonkey installation is configured for manual updates. Existing installations can retain their earlier update preference, so check the script's manager settings if you want updates to stay manual.

Turning off **Enable Playground** pauses enhancements without deleting your setup. To return to the original page with no Playground code running, disable the script in Tampermonkey and reload Aeries. Disabling and clearing settings are separate actions.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| No Playground button | Confirm the script and Tampermonkey are enabled, script permission is granted, and the page is under the supported MVLA student URL. |
| Courses are missing | Open the dashboard to discover course cards. The feature does not fetch courses from other pages or accounts. |
| No weighted GPA or Honors/AP controls | Confirm the current release is installed, then enable **Overall grade / GPA above classes** and turn **Show 4/3/2/1 on dashboard** off. Check the installed metadata version if the controls are still missing. |
| GPAs are identical | Check the intended Honors/AP classes and save course settings if edited in Courses. No selected, counted A/B/C means no bonus; selected D/F still receive no bonus. |
| A class does not affect GPA | Check inclusion, visibility, and the posted letter. Non-A–F marks do not count, and checking Honors/AP does not include an excluded class. |
| Impact/map/total unavailable | Turn off Aeries' missing-only filter, wait for the selected gradebook to load, and check that visible rows reconcile with category/overall totals. |
| Upcoming ungraded checkbox is missing | It is planned for the 2.4.0 prerelease and is not in the current source. After publication, update manually and look inside **Weight map**, not the Settings toggle list. |
| Upcoming preview lists an assignment without a circle | Check its unavailable-weight explanation. A positive possible-point value and, in a weighted class, a known nonnegative category weight are required. A known 0% category has no circle. Explicitly excluded work remains omitted. |
| Upcoming preview changes the displayed weight percentages | Including ungraded work changes preview denominators and can activate categories with no graded work. Turn the checkbox off for current counted-grade shares; the course grade itself is unchanged. |
| Rounded scores differ across views | The fractional-score adapter uses only validated matching on-page values. It does not guarantee extra decimals for every row. Compare the posted totals and installed version; report fictional examples rather than copied page source. |
| Teacher uses additional rules | Inspect the posted totals and configured policies; unsupported rules can leave the baseline unmatched. |
| “What do I need?” cannot calculate | Turn off counted ranges; complete the assignment, target, maximum, and increment; finish any half-entered replacement and resolve unmatched saved rules. |
| Range total unavailable | Check positive totals and nonnegative ordered bounds; resolve unmatched or unfinished replacement rules and any posted-baseline mismatch. |
| Next class shows only a period | Use Courses to set the exact period, including any suffix, and resolve duplicate matches. |
| Next-class panel is missing | Enable **What class is next (MVHS)** in Settings; it starts off and requires your opt-in. |
| Schedule unavailable | Use Retry schedule and check the linked public source. The panel needs schedule-request permission and a working source. |
| Changes disappear after reload | Hypothetical scores and ranges are temporary. Grading-profile edits and added/removed replacement rules save automatically; general Settings fields and course display changes use their Save buttons. Check for a storage-error message. |
| Wrong preferences after changing students | Switch the manual settings profile/year. The score-matching checks do not select or separate settings profiles automatically. |
| Display looks wrong | Disable duplicate/older Aeries scripts; pause Playground or disable it and reload to compare with the original page. |
| Settings cannot be saved | The change applies for the current visit, and the UI reports a browser-storage error. |
| Settings were cleared or schedules disabled in another tab | Reload promptly. Ordinary saves use the last written settings; an old tab can continue schedule requests and re-save its opt-in. Clearing settings has a separate stale-save check once detected, but does not immediately synchronize every running tab. |
| KBAR controls are missing | Check that the installed source is 2.2.0 or newer; the earlier weighted-GPA prerelease does not include KBAR. Reload after updating. |
| P does nothing or KBAR is silent | Enable Playground, close its dialog, and move focus outside editable controls; otherwise use Settings or the menu command. If playback is blocked, retry or use **Settings → Open on YouTube** to open the original video in a new tab. |
| Page gains a long blank area after starting KBAR | This should not happen: the KBAR player is hidden outside the document layout and should add no scroll space. Reload after updating, and report the layout if the blank area remains. |
| Music paused but YouTube remains loaded | Pause leaves the embed active. Use **Close KBAR player** to unload it. |
| Unexpected behavior after installing | Keep one copy enabled, reload Aeries, and compare with the script disabled. Check whether the supported Aeries layout has changed. |

For a bug report, include your browser, userscript manager, the affected feature, steps, and fictional example values. Describe the expected result and what appeared instead. Use [Contributing](../CONTRIBUTING.md) for ordinary reports and [Security](../SECURITY.md) for sensitive concerns.

## Limitations

Aeries Playground does not provide a grade-history service, grade notifications, scenario export/import, persistent hypothetical scorebooks, automatic student-account separation, an official transcript GPA, or general support for other schools' bell schedules. Zero-point extra-credit policies, arbitrary drop-lowest rules, and hidden teacher rules are not inferred. Aeries page changes can affect parsing and display; use the posted gradebook and your teacher's policy when a local estimate differs.

