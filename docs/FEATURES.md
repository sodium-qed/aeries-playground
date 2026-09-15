# Feature guide

This guide describes the inspected **1.5.4 development snapshot**, reviewed September 15, 2026. The userscript remains unpublished. See the [README](../README.md) for project status and portal scope, and the [calculation reference](CALCULATIONS.md) for formulas.

## Dashboard and course customization

### Course names, icons, and periods

Open **Aeries Playground → Courses** to edit discovered courses.

- **Display name** changes the dashboard label. Hovering retains access to the original title, and the course link still opens its gradebook.
- **Icon** is optional text or an emoji; new courses start without an automatically chosen icon.
- **Class period (optional override)** connects a course to the MVHS schedule panel. Leave it blank to use an unambiguous period detected on its dashboard card. Period identifiers can include suffixes such as `2A`; matching is exact.
- **Bar scale**, **Bar minimum**, and **Bar maximum** control the progress bar.
- **Custom thresholds for this course** overrides the global cutoffs for its grade scale.

Use **Save course settings** to apply these changes. The bar scale is a display setting; simulation calculation rules have their own **Course grading profile**.

### Colors and 4/3/2/1 ratings

**Settings** provides separate toggles for dashboard colors and numeric grades. Numeric mode replaces the dashboard letter with a 4, 3, 2, or 1 based on that course's cutoffs. The posted percentage or average remains visible. Turning numeric mode off restores the original letter.

Four color bands are shared by dashboard grades, progress bars, detail-page grades, and weight-map scores. Detail coloring covers assignment names/scores in both native views and the recognized category/course totals.

The snapshot's global defaults are:

| Band | Percentage cutoff | Average-point cutoff | Color |
| --- | --- | --- | --- |
| 4 | At least 95 | At least 3.7 | Dark blue, `#1f1f7f` |
| 3 | At least 85, below 95 | At least 3.1, below 3.7 | Dark green, `#1f7f1f` |
| 2 | At least 75, below 85 | At least 2.5, below 3.1 | Orange, `#c05600` |
| 1 | Below 75 | Below 2.5 | Dark red, `#7f1f1f` |

Cutoffs must be nonnegative and strictly descending. Course-specific cutoffs take precedence. Colors and ratings describe your chosen bands; they do not change a teacher's letter-grade policy.

### Progress bars and precision

Percentage-course bars normally span **50–100**; recognized four-point-course bars span **1–4**. Each course can use another valid minimum/maximum. Threshold markers appear when they fall within that span. Values outside the span stop at the bar edge while the posted number remains visible.

**Ridiculously precise mode** shows up to eight decimal places for supported calculated values, including impacts; turning it off generally uses two. It preserves the precision Aeries actually displays and does not reveal hidden official decimals. Some compact displays, including the overall summary and weight labels, use their own shorter formatting.

### Overall grade and current-year GPA

Enable **Overall grade / GPA above classes**, then choose the mode with **Show 4/3/2/1 on dashboard**.

| Numeric display | Summary | Calculation |
| --- | --- | --- |
| On | Playground overall score | Convert each included course's numeric grade to its own threshold-based 1–4 rating, then average those ratings equally. |
| Off | Current-year GPA | Convert posted A/B/C/D/F letters to 4/3/2/1/0 and average them equally; ignore plus/minus and Playground thresholds. |

The number stays an **average**, such as 3.5. In numeric mode, only its **color** indicates the overall band, using **Settings → Average ≥** cutoffs.

Open **Calculation & included classes** to inspect the arithmetic and choose which classes count. The summary uses courses currently visible on the dashboard, deduplicated by course identity. Ungraded or unrecognized entries are skipped. In letter mode, F counts as zero; pass/fail and numeric-only marks are skipped.

This is an equal-weight estimate, without AP/Honors bonuses, credits, previous years, or transcript weighting. The “current-year” label does not mean the script downloads a transcript.

## Assignment analysis

These tools use the currently open course's gradebook details. They read the rendered assignment rows and Aeries totals; they do not download hidden gradebook data.

### Category filter

Use **Category: All / [category]** to focus on one category. Buttons show assignment counts, and the selected filter applies to both the native table and card views.

The filter only changes which posted rows are shown. Grade totals, impacts, and the weight map still use all loaded assignments. It differs from Aeries' **Show only missing assignments**, which can remove necessary data from the page and block calculations.

### Assignment impact labels

**Model impact** labels estimate the current grade **with an assignment minus the current grade without it**, in percentage points or average points. Positive means the assignment raises the current modeled grade; negative means it lowers it.

Labels appear only when the parsed gradebook reconciles with the visible Aeries totals. They are suppressed while grade testing is active. An assignment with no valid comparison grade, such as the only counted assignment, has no numeric impact.

Impacts are not the assignment's weight, its historical posting effect, or values that can be added together. See [weight versus impact](CALCULATIONS.md#assignment-weight-versus-impact).

### Assignment weight map

Open **Assignment weight map** above the gradebook or the **Weight map** tab.

- Circle **area** is proportional to an assignment's share of the current counted grade, with one size scale across categories.
- Color follows the assignment's posted numeric grade and your thresholds.
- Hover, click, or keyboard-focus a circle or its list entry to see the assignment's name, category, earned/possible points, grade, weight, and calculation breakdown.
- Ungraded and excluded assignments have no circle. Graded work in a zero-weight category remains in the list with a 0% label and no circle.
- Weights can change as additional assignments or categories begin counting.
- During grade testing, the button becomes **Posted assignment weight map**: the map continues to describe posted data.

In the inspected snapshot, entries are sorted by descending weight, with names breaking ties. The numbered badges are list positions. Assignment-number ordering is a requested revision; see [development status](#development-status-and-snapshot-limits).

## Grade testing lab

On a gradebook details page, select **Start grade testing**.

Existing assignments receive hypothetical earned-point and possible-point controls, a **Count** checkbox, and a per-assignment **Reset** button. A blank score means ungraded; zero is a real score. Existing four-point assignment denominators are read-only in this snapshot.

**Add hypothetical assignment** creates a row for a future assessment. Enter its name, choose a category, and supply earned/possible points. Blank scores do not count. **Remove** deletes the hypothetical row.

As you type, the lab recalculates assignment grades, category totals, and the hypothetical overall grade. It labels modeled values **Hypothetical** and shows the posted overall grade for comparison. Table/card controls for an existing assignment stay synchronized.

**Reset hypothetical changes** clears score edits and added assignments and reloads saved replacement rules. **Exit grade testing**, reloading, changing gradebooks/settings scope, or a detected gradebook-data refresh also clears the temporary scenario. Saveable course policies are separate from the score edits.

The controls are local overlays. They do not submit grades or add assignments to Aeries.

### Course grading profiles

Open **Course grading profile** in the lab toolbar. A new profile starts with no preset policy; explicitly choose the fields or use **Copy values shown by Aeries** as a starting point.

| Setting | Choices and purpose |
| --- | --- |
| Calculation method | Total points or weighted categories. |
| Course grade scale | Percentage or average score, with an explicit positive average-scale maximum. |
| Category weights | Nonnegative weights, including 0; counted categories need weights, and active weights are normalized. |
| Minimum/maximum assignment score | Optional percentage limits applied before totaling. |
| Final-grade rounding | No rounding, nearest, down, or up; rounding modes use 0–8 decimal places. |

Copying Aeries values fills only what the page supplies; you still choose rounding and complete missing fields. Use **Save course grading profile** to persist a policy or **Clear saved grading profile** to remove it.

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

### Replacement rules

A source assessment can supply its percentage to one or more earlier assignments. Each target keeps its original possible points.

Choose **Only if higher** or **Always replace**, optionally enter a replacement cap in percent, and select **Add hypothetical replacement**. Multiple sources for one target must all use only-if-higher; the best eligible improvement wins. A replacement uses the source's entered score, so replacements do not cascade through other rules.

Both assignments need counted numeric scores for a rule to take effect. The target/range calculators supply the selected candidate score first, allowing a currently blank future assessment to act as the source. The cap limits the proposed replacement, not the source assessment's own score.

Use **Save replacement rules for this course** to persist the rules, **Load saved replacement rules** to restore them, or **Remove** to edit the current list. Save again to persist removals.

Rules remain connected while you rename a hypothetical assignment in the current session. After reload, hypothetical assignments must be recreated with matching names/categories. Unmatched rules are shown as inactive; target/range calculations require them to be resolved or removed. Saved rules include assignment references, described in [Security and privacy](../SECURITY.md).

### Hypothetical score ranges

Expand **Hypothetical score ranges**, choose an assignment, enter **Low earned points** and **High earned points**, and select **Calculate hypothetical range**.

The result shows the course grade at both endpoints, including rounding, score limits, and replacements. The selected assignment counts at both endpoints, all other lab scores stay fixed, and no entered score is changed. This models one assignment's range; it is not a probability or confidence interval.

### “Explain my grade”

**Explain my grade** works for both posted reconstruction and the active hypothetical scenario. It shows:

- Earned/possible totals and grade for each category.
- Effective weight and contribution to the course grade.
- The points or weighted-category calculation.
- Omitted ungraded/excluded assignments and configured assignment score limits.
- Final-grade rounding and, in the hypothetical scenario, applied or inactive replacement rules.

If a complete matching total is unavailable, the explanation says so. Extra displayed decimals are model results.

## MVHS next-class panel

With **What class is next (MVHS)** enabled, the dashboard shows:

- The current period or before-school, between-periods, finished, and no-school states.
- Current start/end times and minutes remaining.
- The next student schedule slot and minutes until it starts.
- **Today's full bell schedule**, with the active slot highlighted.
- The next school day's first student slot when none remain today, searching up to two weeks ahead.
- Special-schedule labels from the public calendar.

Times use **America/Los_Angeles (Pacific time)**. Student slots include numbered periods and recognized tutorial/testing/assembly/rally/advisory entries, rather than treating every break as the next class.

Course names come from the currently visible Aeries dashboard cards and optional local nicknames. **Match classes to periods** opens Courses. If a period has no match or multiple matches, the panel shows the period instead of guessing. It does not infer that an unmatched period is a free period or skip it as part of a personalized attendance schedule.

The widget reads public mvhs.io schedule JSON, caches it in memory for 30 minutes, and refreshes the visible clock state about every 15 seconds. Hidden tabs pause that refresh work. No school grades or class names are included in schedule requests.

An unavailable, malformed, conflicting, or stale schedule produces **Schedule unavailable** and a retry option. A source link opens mvhs.io. Schedule accuracy depends on that public source and the device clock.

## Settings, profiles, and saved data

All twelve listed Settings toggles are enabled by default in this snapshot:

| Toggle | Controls |
| --- | --- |
| Enable Playground | Master pause for page enhancements. |
| Dashboard grade colors | Dashboard color overrides. |
| Show 4/3/2/1 on dashboard | Threshold ratings and the overall-summary mode. |
| Overall grade / GPA above classes | Overall summary panel. |
| What class is next (MVHS) | Public schedule panel. |
| Course nicknames & icons | Customized dashboard labels. |
| Grade progress bars | Bars and their posted-grade readouts. |
| Grade colors on details page | Assignment/category/course colors. |
| Assignment impact labels on the page | Reconciled model-impact labels. |
| Ridiculously precise mode | Additional decimal places in supported calculations. |
| Category filter on gradebook pages | Local category buttons. |
| Assignment weight map | Weight-map entry point and view. |

Toggles apply and save immediately. Other Settings fields require **Save settings**.

**Settings profile** and **School-year starting year** partition saved course settings. Both start blank; the year, if entered, must have four digits. The script does not identify the logged-in student automatically. Select the appropriate profile before switching accounts or students. Global display toggles, colors, and default thresholds remain global; course customizations and policies belong to the selected profile/year.

The dialog supports keyboard tab navigation, arrow/Home/End navigation between its tabs, labeled controls, and focusable weight-map entries. It adapts its layout to the available width. These are implementation features, not a completed accessibility or mobile-browser audit.

Posted grades and hypothetical scenarios stay in memory. Preferences, course identities/names, course policies, and explicitly saved replacement references use userscript storage. The full breakdown is in [Security and privacy](../SECURITY.md#data-handling-in-the-inspected-snapshot).

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| No Playground button | Confirm the script and Tampermonkey are enabled, script permission is granted, and the page is under the supported MVLA student URL. |
| Courses are missing | Open the dashboard to discover course cards. The feature does not fetch courses from other pages or accounts. |
| Impact/map/total unavailable | Turn off Aeries' missing-only filter, wait for the selected gradebook to load, and check that visible rows reconcile with category/overall totals. |
| Teacher uses additional rules | Inspect the posted totals and configured policies; unsupported rules can leave the baseline unmatched. |
| “What do I need?” cannot calculate | Complete the assignment, target, maximum, and increment; finish any half-entered replacement and resolve unmatched saved rules. |
| Next class shows only a period | Use Courses to set the exact period, including any suffix, and resolve duplicate matches. |
| Schedule unavailable | Use Retry schedule and check the linked public source. The panel needs schedule-request permission and a working source. |
| Changes disappear after reload | Hypothetical scores are temporary. Use the appropriate Save button for settings and course policies. |
| Wrong preferences after changing students | Switch the manual settings profile/year; account identity is not detected. |
| Display looks wrong | Disable duplicate/older Aeries scripts; pause Playground or disable it and reload to compare with the original page. |
| Settings cannot be saved | The change applies for the current visit, and the UI reports a browser-storage error. |

For a bug report, include the development version, browser/Tampermonkey versions, steps, and fictional example values.

## Development status and snapshot limits

| Item | Status |
| --- | --- |
| Features described above | Present in the inspected development snapshot labeled 1.5.4. |
| Public userscript/release | Not published in this repository. |
| Assignment-number map ordering | Requested, but not verified in this snapshot. The requested change keeps weight-based circle areas and weight information while ordering by assignment number. |
| Live browser validation for this documentation update | Not performed; feature descriptions are based on source inspection. |

The build does not provide a grade-history service, grade notifications, scenario export/import, persistent hypothetical scorebooks, automatic student-account separation, an official transcript GPA, or general support for other schools' bell schedules. Zero-point extra-credit policies, arbitrary drop-lowest rules, and hidden teacher rules are not inferred. Update this guide when a newer implementation is reviewed.
