# Feature guide

> **Release policy correction:** The November 1 **3.1.0** integration and November 8 **3.1.1** bonus-band update are scheduled **prereleases**, each at **11:59 p.m. PST in 2026**. **v3.0.0 remains stable and Latest.** The [release schedule](RELEASE-SCHEDULE.md) supersedes earlier stable-promotion wording in preparation notes.

Use Playground on a recognized Aeries dashboard or gradebook to customize the display, inspect assignment weights, and try possible scores. The changes are local: a hypothetical score never submits a grade or creates an assignment in Aeries.

| What you want to do | Start here |
| --- | --- |
| Find the dialog or a page control | [Find the controls](#find-the-controls) |
| Rename a course, set a period, or change its bar | [Course customization](#course-names-icons-and-periods) |
| Choose classes for weighted/unweighted GPA | [GPA](#weighted-and-unweighted-gpa-together) |
| Compare assignment weights or preview ungraded work | [Assignment weight map](#assignment-weight-map) |
| Try a score, add an assessment, or solve for a target | [Grade testing lab](#grade-testing-lab) |
| Set up a next-class countdown or KBAR | [MVHS schedule](#mvhs-next-class-panel) · [KBAR](#kbar-music) |
| Understand what saves, switch students/years, or pause | [Settings guide](SETTINGS.md) |
| Recover from missing controls or an unavailable result | [Troubleshooting](TROUBLESHOOTING.md) |

For installation and supported pages, start with the [README](../README.md). For formulas, worked examples, and the limits of an estimate, use the [calculation reference](CALCULATIONS.md).

## Available release

This guide describes the published **3.0.0 stable release**, verified as Latest on October 26, 2026. The moving `main` source and a tagged asset remain distinct downloads.

| Download | What it selects |
| --- | --- |
| [3.0.0 release](https://github.com/sodium-qed/aeries-playground/releases/tag/v3.0.0) · [3.0.0 userscript](https://github.com/sodium-qed/aeries-playground/releases/download/v3.0.0/aeries-playground.user.js) | The published stable artifact for the audited source. |
| [Latest stable release](https://github.com/sodium-qed/aeries-playground/releases/latest) | **3.0.0**, verified at publication; this shortcut can select a later stable release in the future. |
| [Main-branch userscript](https://github.com/sodium-qed/aeries-playground/raw/refs/heads/main/aeries-playground.user.js) | The moving repository source; later documentation edits do not replace tagged assets. |
| [2.4.0 release](https://github.com/sodium-qed/aeries-playground/releases/tag/v2.4.0) | The historical prerelease, preserved under its original tag. |

The [audit record](AUDIT-3.0.0.md) describes coverage and verification limits. Review the exact replacement file and [update steps](SETTINGS.md#update-the-userscript); publication does not update an installed copy automatically.

### Planned Developer and public integration

The supplied Developer **2.X** build and public **3.0.0** edition are being unified for **3.1.0**, with merge execution scheduled for **November 1, 2026, at 11:59 p.m. America/Los_Angeles (PST)**. This is a plan, not a published download. See the [merge plan](MERGE-PLAN.md) for candidate status and upgrade instructions.

| Feature | Public 3.0.0 | Planned unified 3.1.0 |
| --- | --- | --- |
| Saved assignment multipliers and temporary **Counts as** for numeric `/4` gradebooks | Not available | Positive multipliers affect earned and possible points; original score scale stays intact. |
| Native regression forecast text beside trend icons | Not available | Display Aeries' existing forecast without inventing or recalculating one; a Settings toggle controls it. |
| Matched embedded score precision | RecentAssignments recovery | Retain existing checks and add validated same-assignment card/raw sources. |
| Bounded recovery from rounded visible scores | Audited posted-precision and final-rounding checks | Add explicitly marked estimates and conservative target calculations when valid bounds can be established. |
| Ungraded weight preview, GPA, next-school-day countdown, and KBAR fallback | Available | Retained; these are already shared features. |
| Audited storage, UI lifecycle, network timeout, and media fixes | Available | Retained while integrating Developer additions. |

Do not install both editions simultaneously. Version **2.X** is a personal build label, not a newer public release number or a substitute for the audited 3.0.0 source.

<a id="weight-map-prerelease"></a>
<a id="weighted-gpa-prerelease"></a>

Older links to the weight-map and weighted-GPA prerelease notes lead here. Use the current [weight-map](#assignment-weight-map) and [GPA](#weighted-and-unweighted-gpa-together) instructions below rather than treating an earlier release announcement as a separate feature guide.

## Find the controls

1. Open the supported Aeries student page with Playground enabled. Visit the dashboard to discover its course cards, or open one course's gradebook to discover that course.
2. Press **S** outside an editable control, or choose Tampermonkey's **Aeries Playground — open settings (S)** menu command.
3. Use **Courses** for course customization, **Weight map** for the open gradebook, or **Settings** for global features and profile/year labels.
4. On a recognized gradebook, use the toolbar above the assignments: **Start grade testing**, **Add hypothetical assignment**, **Course grading profile**, and **Explain my grade**. **Assignment weight map** opens the map directly.

There is no floating Playground launcher. The Weight map tab needs an open recognized gradebook; it is not a saved list of every course's assignments. If only the map is off, the tab offers **Enable Weight map**. While Playground is paused, it offers **Enable Playground and weight map**; this resumes the master switch and can resume a previously enabled schedule integration.

Save **Courses** and ordinary **Settings** form fields before changing dialog tabs or reopening the dialog. Toggles and grading-rule forms have different save behavior; use the [save-control reference](SETTINGS.md#which-save-control-do-i-use) when unsure.

### Keyboard and dialog behavior

| Control | Behavior |
| --- | --- |
| **S** | Opens Settings. Ignores repeated/composing events, Ctrl/Alt/Meta combinations, and inputs, text areas, selects, textboxes, comboboxes, and editable content. |
| **P** | Requests KBAR play/pause when Playground is enabled and its dialog is closed. It also ignores editable controls, sliders/spinbuttons, repeats, composition, and Ctrl/Alt/Meta combinations. |
| **Tab / Shift+Tab** | Moves through available controls. The open dialog uses the browser's modal focus behavior. |
| **Left / Right**, **Home / End** on dialog tabs | Changes tabs and moves focus to the chosen tab. |
| **Enter** on a grade-testing button | Activates the button. Enter inside a score or other text input stays local and does not submit the native Aeries form. |
| **×** or **Escape** | Closes the dialog. Focus returns to the opener when it still exists, except after a successful **Show in gradebook** jump. |
| **Show in gradebook** | Closes the map, focuses the visible native assignment row, scrolls to it, and briefly highlights it. |

Typing within grade-testing controls keeps its keystrokes local; their event handling can also prevent letter shortcuts from reaching the page. Use the manager menu when a shortcut does not respond. Closing the dialog does not itself exit an active grade-testing scenario. Changing dialog tabs or reopening a form can discard unsaved **Courses** or non-toggle **Settings** fields without a warning.

## Dashboard and course customization

### Course names, icons, and periods

Open **Courses**, edit the entry you want, then select **Save course settings**. The list contains courses discovered in the selected profile/year; it can include saved courses that are not visible on the current page.

| Field | What it changes |
| --- | --- |
| **Display name** | Local dashboard title, up to 70 characters. Hovering a customized title shows its original name; its link still opens the original gradebook. |
| **Icon** | Optional text or emoji, up to 12 characters. New courses start blank. |
| **Class period (optional override)** | Manual schedule match, such as `1`, `7`, or `2A`. Leave blank to use one unambiguous period detected on the current dashboard card. Suffixes matter. |
| **Honors/AP — weighted GPA bonus** | Manual bonus eligibility for letter-based weighted GPA; starts unchecked. Names do not determine eligibility. |
| **Bar scale** | Percentage or average-point display scale; also determines which default threshold set that course uses. It does not select the lab's calculation method. |
| **Bar minimum / Bar maximum** | Display range. The minimum must be below a positive maximum; values outside the range stop at its edge. |
| **Custom thresholds for this course** | Overrides the three default cutoffs for that course when enabled. Cutoffs must be nonnegative and strictly descending. |

Select **Save course settings** to apply the form. All displayed course entries are validated together; a bad period, range, or threshold prevents the save. Clearing a display name restores the original title, and clearing an icon removes it. These edits do not rename records in Aeries.

Period matching uses the visible dashboard roster. A missing or duplicate match leaves a generic period label; Playground does not infer a free period or a personal attendance schedule.

### Colors and 4/3/2/1 ratings

**Dashboard grade colors** and **Show 4/3/2/1 on dashboard** are separate Settings toggles. Numeric display replaces a recognized dashboard mark with a custom 4, 3, 2, or 1 based on that course's numeric grade and cutoffs. Its posted percentage or average stays visible. Turn numeric display off to recover the original mark.

These are unofficial ratings, not the teacher's A–F scale. The current replacement does not add a tooltip identifying the original letter; turn numeric display off when you need to inspect that letter. A card whose mark cannot be recognized may retain its native display.

Global defaults are:

| Rating | Percentage | Average points | Color |
| --- | --- | --- | --- |
| **4** | At least 95 | At least 3.7 | Dark blue, `#1f1f7f` |
| **3** | At least 85, below 95 | At least 3.1, below 3.7 | Dark green, `#1f7f1f` |
| **2** | At least 75, below 85 | At least 2.5, below 3.1 | Orange, `#c05600` |
| **1** | Below 75 | Below 2.5 | Dark red, `#7f1f1f` |

Set global colors and cutoffs in **Settings → Grade colors & thresholds**, then select **Save settings**. Course cutoffs override global defaults. The color palette is shared by dashboard grades, progress bars, detail-page grades, and graded weight-map entries. Dashboard/detail color toggles do not disable the bar or map palette.

**Grade colors on details page** controls threshold colors for recognized posted assignment names/scores, category totals, the course total, and hypothetical score/total overlays. Turning it off removes those threshold colors from both existing and added hypothetical assignments. Active score ranges use neutral colors because an interval has no single grade band.

### Progress bars and precision

**Grade progress bars** normally use **50–100** for percentage courses and **1–4** for recognized average courses. Threshold markers appear within the configured span. A missing numeric grade produces **No numeric grade posted**. The bar does not change a grade or its calculation rules.

**Ridiculously precise mode** starts on. It generally shows up to eight decimal places for calculated values and impacts, with trailing zeros removed; turning it off generally uses two. Native posted text remains native. Some displays deliberately use shorter formatting: summary GPA/rating numbers and map weight percentages use up to two decimals, while map point details use up to four.

Display precision, the [fractional-score adapter](#fractional-score-precision), and raw-score conversion are different operations. Precise mode does not retrieve extra records, infer official decimals, or change the rule that raw-score conversion truncates gradebook points to two decimal places.

### Overall grade and current-year GPA

**Overall grade / GPA above classes** starts on. To see GPA, leave **Show 4/3/2/1 on dashboard** off and open the dashboard. To see an average of custom ratings instead, turn that toggle on. Both modes use the currently visible dashboard cards, deduplicated by course identity. If a duplicate card is blank, the first usable grade for that identity is used; the course still counts once.

| **Show 4/3/2/1 on dashboard** | Summary | Details control |
| --- | --- | --- |
| On | **Playground overall score**: equal average of each included course's threshold-based 1–4 rating. | **Calculation & included classes** |
| Off | **Current-year GPA**: estimated unweighted and weighted averages of posted A–F letters. | **Calculation & GPA class selection** |

The class-inclusion checkbox attempts to save immediately and affects both summary modes. A failed save appears in the summary and any open Playground dialog. Numeric mode skips courses without a recognized numeric grade. The result stays an average, such as **3.5**; only its color indicates a band, using **Settings → Average ≥** cutoffs. An empty set displays a dash rather than zero.

“Current-year” describes the courses shown on the dashboard. Playground does not retrieve a transcript, previous years, course credits, or a complete annual course list. Hidden courses do not count just because they have saved settings.

### Weighted and unweighted GPA together

On the dashboard in letter mode, open **Calculation & GPA class selection**, choose which courses count, and check the courses eligible for the supported Honors/AP bonus. These checkboxes save immediately. Each row has two independent choices:

- **Include** decides whether that course counts in both GPAs.
- **Honors/AP** adds one point for a counted A, B, or C in weighted GPA only. It does not include an excluded class.

| Posted letter; plus/minus ignored | Unweighted | Weighted, Honors/AP off | Weighted, Honors/AP on |
| --- | --- | --- | --- |
| A | 4 | 4 | 5 |
| B | 3 | 3 | 4 |
| C | 2 | 2 | 3 |
| D | 1 | 1 | 1 |
| F | 0 | 0 | 0 |

Honors/AP starts unchecked, so the two averages initially match. Changes in GPA details save immediately. The equivalent field in **Courses** requires **Save course settings**. Both choices belong to the selected profile/year.

F is a counted zero. Blank, pass/fail, numeric-only, and other unrecognized marks are skipped. A recognized letter may count even when a card lacks a usable numeric percentage. Both GPAs use the same included courses with equal weight, and hypothetical edits do not replace their posted letters. Honors/AP does not affect numeric-rating mode.

For five included, checked courses with A/B/C/D/F, unweighted GPA is **2.00** and weighted GPA is **2.60**. These estimates do not model transcript credits, eligibility rules, or institution-specific bonus caps. See [GPA calculations](CALCULATIONS.md#weighted-gpa).

## Assignment analysis

These tools read the recognized gradebook's native table/card rows and visible totals. Eligible embedded scores already present on that page may refine the inputs. Playground does not fetch hidden Aeries gradebook records.

### Check the posted baseline

1. Select the intended course and grading period in Aeries.
2. Turn Aeries' **Show only missing assignments** off and wait for its rows and totals to finish loading.
3. Read the Playground status above the assignments. A matching-total status means the loaded rows reconstruct the displayed totals under the rules in use. An error names the condition that still needs attention.
4. Open **Explain my grade** to inspect category totals and contributions. If it says **A complete matching total is unavailable**, the category arithmetic is not confirmation of an overall result.

Playground's own [category filter](#category-filter) only hides rows after they are read; it does not change the baseline. If the baseline cannot be reconstructed, use the [recovery steps](TROUBLESHOOTING.md#gradebook-totals-do-not-match) before interpreting estimates.

| Tool | Question it answers | Inputs while grade testing is active |
| --- | --- | --- |
| Weight map | How much of the calculation does each assignment represent? | Posted rows and Aeries-read rules; optional ungraded preview |
| Grade impact | How much does the current calculated grade change if this assignment is removed? | Current hypothetical scores, Count choices, and applicable rules |
| Grade testing lab | What course grade follows from the scores and rules I enter? | The active local scenario, after the posted baseline check |

Weight and impact are different quantities. A large circle can have a small impact, and a weight map opened during testing does not visualize the edited scenario.

### Fractional-score precision

Aeries can display **14.67 / 15** while already embedding **14.66666666666667 / 15** in the page. Playground uses the more precise earned score only when the current student/course/term and assignment identity match, the dates match, and that value agrees with the visible denominator and displayed percentages.

This happens automatically for eligible percentage gradebooks, independently of precise mode. Missing, duplicate, ambiguous, excluded, or inconsistent records retain their displayed values. Four-point gradebooks are unchanged. Native labels may therefore show rounded points while reconstruction and the local editor use a validated value.

The adapter does not guarantee extra precision for every assignment, and its identity checks do not choose a saved settings profile. See [matching and precision rules](CALCULATIONS.md#on-page-score-precision) and [privacy details](../SECURITY.md#on-page-score-matching).

### Category filter

Use **Category: All / [category]** above the gradebook. Buttons show counts for the loaded posted rows and filter both native table and card views.

This is a display filter: totals, impacts, and the weight map still use all loaded assignments. It does not filter added hypothetical cards. The selected category is kept in memory for that course/profile scope during the page session, not saved for reload.

Aeries' separate **Show only missing assignments** filter can leave the loaded data incomplete and blocks calculations. Turn that filter off before analyzing the full gradebook.

### Assignment impact labels

**Grade impact** means the calculated grade with an assignment minus the grade without it. Positive raises the current calculation; negative lowers it. Units are percentage points (**pp**) or average points.

Posted labels appear only after the loaded rows reconcile with Aeries' category and overall totals. Active lab labels instead use current hypothetical scores, Count choices, score limits, and replacement rules, once the posted baseline is acceptable. Removing a replacement source also removes its replacement effect. Impact differences use unrounded model totals, not the final-grade display-rounding policy.

There is no numeric impact when the comparison grade is undefined, such as for a sole counted assignment. With counted ranges active, labels say **Grade impact varies with ranges**: course-grade endpoints do not bound an individual assignment's impact.

An impact is neither an assignment's weight nor its historical posting effect, and impacts cannot be added together. See [weight versus impact](CALCULATIONS.md#assignment-weight-versus-impact).

### Assignment weight map

Open **Assignment weight map** above the gradebook or the dialog's **Weight map** tab. Start with **Show ungraded assignments** off to inspect the work currently counting toward the grade. Select an assignment in the circle view or list, then use **Show in gradebook** to locate it.

- Circle **area**, not diameter, represents an assignment's share. All categories use one size scale.
- Graded colors follow the posted numeric grade and selected cutoffs.
- Hover, click, or focus a circle or list button for its name, category, score, weight, and calculation breakdown.
- Entries use numeric-aware assignment-number order. Very small circles may omit the number; the list remains available.
- **Show in gradebook** rechecks the live page, clears a conflicting Playground category filter, and locates the row in Aeries' current table/card view.
- During testing the button reads **Posted assignment weight map**. It continues to use posted rows and Aeries-read rules, not hypothetical scores or saved replacement rules.

With the ungraded toggle off, the map describes included graded work. Ungraded and explicitly excluded work is omitted. Graded assignments in a 0% category remain in the list with no circle when the overall map can be calculated. A course with no counted grade may instead show an unavailable message.

Weights change when additional work or categories start counting. Circle sizes are rescaled for each map so its largest circle keeps the same visual size; compare the displayed percentages when changing courses or toggling the preview. Score floors/ceilings are used when checking posted totals; circle sizes still use possible points, and colors use posted scores.

#### Show ungraded assignments

This checkbox is inside **Weight map**, directly below its heading. It starts **off** and saves immediately as a global preference shared across courses and settings profiles/years.

| Choice | Result |
| --- | --- |
| Off | Current counted-grade shares for graded, included work. |
| On, ungraded work present | **Weight preview · includes ungraded assignments**. Known possible points and category weights size the shown work as if it counted. Graded shares may change because the denominators change. |
| On, no ungraded work present | No ungraded entries are added; the map does not label itself an ungraded preview. |

Ungraded work with a known positive share gets a neutral gray circle and **Ungraded** label. Blank scores never become zeros. A usable numeric zero is graded even when Aeries says **Grading Complete: No**. Explicitly excused, excluded, or dropped work remains omitted, including blank excluded rows.

| Missing or zero value | Preview behavior |
| --- | --- |
| No positive possible points | Listed with **Positive possible points unavailable**; no circle and omitted from preview denominators. |
| Unknown/invalid category weight for ungraded work in a weighted course | Listed with **Category weight unavailable**; no circle and omitted from preview denominators. |
| Known category weight of 0 | Listed at 0%; no circle. |
| Every known active category weight is 0 | No positive-weight circles; no invented counted grade. |
| A counted graded row makes reconstruction invalid | The whole map can be blocked; the preview does not bypass posted-data checks. |

An entirely ungraded course can show preview entries when its visible category totals reconcile and its overall grade is absent or zero. Missing totals, missing-only filtering, or conflicting posted totals still block it.

The preview does not predict an earned score, alter the gradebook, change lab Count choices, or change GPA/impacts. Turning it off returns to counted shares. See [preview formulas](CALCULATIONS.md#ungraded-assignment-weight-preview). Other tabs retain their own loaded preference until reload; a later ordinary save can overwrite it.

## Grade testing lab

For a first scenario:

1. [Check the posted baseline](#check-the-posted-baseline), then select **Start grade testing** in the toolbar or beneath an assignment's percentage. Either button starts testing for the whole gradebook.
2. Change one existing **Score**, or select **Add hypothetical assignment**, give it a name/category, and enter earned/possible points.
3. Read **Hypothetical overall grade** alongside **Posted**. Open **Explain my grade** to see the calculation.
4. Use the row's **Reset** to undo that score, **Reset hypothetical changes** to clear scenario scores/ranges/additions, or **Exit grade testing** to restore the posted view.

**Add hypothetical assignment** starts testing if needed. Scores and new assignment cards are temporary; grading profiles and replacement rules can save automatically. Read [reset behavior](#reset-or-leave-a-scenario) before using a reset as an undo.

### Edit scores and add assignments

| Control | Use |
| --- | --- |
| **Score** | Earned / possible gradebook points. Directly entered points are not truncated by raw-score conversion. |
| **Complete** | Number correct / total questions, or earned / total raw marks. Linked proportionally to Score. |
| **Count** | Includes/excludes a row in the hypothetical calculation, including a locally re-included posted exclusion. A blank single score remains ungraded. |
| **Range** | Replaces that row's single score with lower/upper bounds for the scenario. |
| **Reset** on an existing assignment | Restores its posted score/Count state and removes its range. |
| **Add hypothetical assignment** | Adds a temporary card with a name, category, score controls, Count, Range, and Remove. |
| **Remove** | Deletes that hypothetical card; saved rules referencing it may then be unmatched. |

Table/card controls for the same assignment stay synchronized. Raw scores convert proportionally to gradebook points **rounded down to two decimal places**: 2 correct out of 3 on a 10-point assignment becomes **6.66 / 10**. Use raw marks for unequal question values. If no raw total was read, supply it in Complete or enter points directly. An inferred raw equivalent may be approximate; leaving it unchanged does not round-trip the entered point value.

Blank is ungraded; zero is a real score. Scores and bounds must be nonnegative, with positive totals when counted. Values above the possible total are not automatically capped; only configured score limits restrict them. Enter ordinary decimal numbers without a percent sign, thousands separators, or scientific notation in Score, Complete, bounds, and target-planner fields.

Recognized four-point books use point controls and read-only Score denominators; added assignments also start with the detected four-point denominator. Selecting a different saved simulation scale does not change how the posted row editors were detected.

A counted scored or ranged hypothetical assignment needs a name and a category. Its category selector uses those already found in the gradebook, with an Uncategorized fallback when none exist; it cannot create an arbitrary new category. Names can contain up to 120 characters.

As you edit, Playground overlays assignment grades, category totals, and the hypothetical overall result. The toolbar remains marked as testing, edited rows have **Hypothetical** badges, and the posted overall grade remains available for comparison. It does not generate a hypothetical teacher letter grade. Turning **Count** off excludes that row from the total and from score, total, name, and category validation. Its typed scores and bounds stay in the draft; turning Count back on validates them again. Other counted rows and the posted baseline must still be valid.

Printing while testing is active can include hypothetical values. Exit testing first when you want to print the posted gradebook.

### Reset or leave a scenario

| Action | Result |
| --- | --- |
| **Reset hypothetical changes** | Clears score edits, ranges, and added assignments; reloads the currently saved replacement-rule list. Testing stays on. |
| **Exit grade testing** | Clears the temporary scenario and restores native posted nodes/values. |
| Leave or reload the page, change gradebook/term, save another profile/year, or detect refreshed gradebook rows | Clears the scenario. Returning with browser Back/Forward starts with posted values even when the browser restores a cached page. A gradebook/filter transition waits for fresh rows before rebuilding tools. |
| Turn off **Enable Playground** | Exits testing and pauses page enhancements. |
| Close the Playground dialog | Leaves the page's current scenario running. |

Saved grading profiles and replacement rules survive scenario reset/exit. Because added/removed replacement rules save immediately, **Reset hypothetical changes** is not an undo for those policy edits. It also does not clear every partially entered planner field; clear unfinished replacement fields explicitly if they block calculation.

If the baseline is unavailable, first load all posted rows and resolve the stated mismatch. A custom policy can reconcile original posted scores when it describes a supported teacher rule; hypothetical score edits cannot make incomplete posted data valid.

### Course grading profiles

Open **Course grading profile**, even before starting testing. A new form is blank. Choose its rules explicitly, or use **Copy values shown by Aeries** and complete missing fields.

| Setting | Choices |
| --- | --- |
| **Calculation method** | Total points or weighted categories. |
| **Course grade scale** | Percentage or average score; average requires a positive **Average scale maximum**. |
| **Category weights** | Nonnegative values, including 0. Supply every category that will count; at least one active category must have positive weight. Active weights are normalized. |
| **Minimum / Maximum assignment score (%)** | Optional percentage limits; minimum cannot exceed maximum. |
| **Final-grade rounding** | No rounding, nearest, down, or up. A rounding mode requires 0–8 decimal places in the course's display unit. |

Edits save automatically per course/profile/year. Complete, valid rules apply immediately. Incomplete or invalid edits are saved as a draft and retain the last valid policy, if one exists. **Save course grading profile** explicitly validates/saves and focuses the first invalid field.

**Copy values shown by Aeries** supplies only detected values and leaves rounding for you to choose; it can leave a draft rather than a new active policy. Profile validation includes categories activated only by counted ranges, even when their single scores are blank. A previously valid profile may still need new weights after you change the scenario; check the resulting calculation status.

**Clear saved grading profile** removes the policy and its form draft. The lab then uses parsed Aeries rules; replacement rules are separate and remain saved. The course's dashboard **Bar scale** is a different setting.

### “What do I need?”

With testing active:

1. Create or choose the assessment under **Assignment to solve for**, with positive possible points.
2. Enter **Target course grade** in percent or the stated average scale.
3. Enter nonnegative **Maximum earned points** and positive **Score increment in points**.
4. Add any applicable replacement rules, then clear or finish any unfinished rule fields.
5. Select **Calculate required score**.

The solver finds the smallest allowed score meeting the target under current scores, weights, score limits, replacements, and final-grade rounding. It includes the selected assessment even if its current score is blank or Count is off. All other single scores remain fixed.

Allowed scores are multiples of the increment from zero through the largest multiple at or below the maximum. An off-increment maximum is not an extra candidate. The search recalculates rules for each candidate it evaluates. A target can be unreachable within that grid.

**Apply hypothetical score** copies the result into the local scenario in gradebook points and turns that row's Count on. Relevant score, rule, or input changes invalidate the result; calculate again before applying. Turn off **counted** ranges before using the solver. Unmatched saved rules and unfinished replacement entry also block it. See [target-score calculations](CALCULATIONS.md#target-score-calculation).

### Replacement rules

A rule copies a source assignment's percentage to a target while preserving the target's possible points. The source still counts normally in its own category.

1. Choose **Assessment supplying the score** and **Target assignment it can replace**.
2. Choose **Only if higher** or **Always replace**.
3. Optionally enter a nonnegative **Replacement cap (%)**.
4. Select **Add hypothetical replacement**.

Both assignments need names/categories, and a source cannot replace itself. The tool does not enforce chronological order; choose the intended target yourself. Both must count and have numeric scores for an ordinary rule to apply. The target/range calculators first supply their candidate scores, so a previously blank future source can participate.

**Only if higher** keeps the original target unless the capped offer improves it. **Always replace** can lower the target. Multiple sources for one target must all use only-if-higher; the best eligible improvement wins. The cap limits the proposed replacement, not the source's own score. Sources use their original entered scores, so rules do not cascade; assignment score limits apply afterward.

Adding/removing rules saves automatically per course/profile/year. **Save replacement rules for this course** saves explicitly; **Load saved replacement rules** reloads the latest stored list, not an older version.

Rules stay linked when you rename a hypothetical assignment during that session. Saved references are refreshed when rules are saved; save again after a rename if you want the new name/category recorded. After reload, recreate hypothetical assignments with the saved name/category, uniquely. The name and category match is exact and case-sensitive. Posted assignment references also need their matching identity/name. Unmatched rules are labeled inactive; resolve or remove them before using target/range calculations. Ordinary single-score simulation can continue with only matched rules, so inspect that list before trusting its result.

Rules save their policy and assignment references, not assignment scores. See [replacement math](CALCULATIONS.md#replacement-rules).

### Hypothetical score ranges

Turn on **Range** beside one or more assignments. Enter **Lower bound** and **Upper bound**; the combined result updates automatically.

- Percentage-based books offer **Bounds in → # correct / Points**. Raw bounds also need a positive **Out of** total. Four-point books use points.
- Each endpoint retains its entered units and precision when you switch the displayed unit. Editing a raw total can change the conversion for raw-based bounds.
- The single earned-score/Complete controls are disabled while Range is on. Score possible points remain editable where the detected gradebook permits it.
- Bounds must be nonnegative and ordered, with positive totals. Count off removes the range from the endpoints and disables its bound controls.
- The calculator evaluates all lower scores together and all upper scores together; other single scores stay fixed. It reapplies replacements, limits, weights, and final-grade rounding at both endpoints.
- Invalid bounds, incomplete baseline data, unmatched saved rules, or an unfinished replacement entry make the combined result unavailable.

These are possible grade bounds under the supported model, not probabilities or confidence intervals. They assume the entered score ranges can vary independently. Turning Range off restores the single-score draft but discards that row's bound entries; turning it back on initializes a new range. Exiting testing clears both scores and ranges. See [range calculations](CALCULATIONS.md#score-range-calculation).

### “Explain my grade”

**Explain my grade** works with posted data and with the active scenario. It shows category earned/possible totals, grades, effective weights, contributions, omitted work, score limits, the points/weighted formula, and any final-grade rounding. Active testing adds applied/inactive replacements and separate endpoint explanations for ranges.

If saved rules reconcile original posted scores, the posted explanation can use them. The ordinary posted impact labels and weight map still require their own checks using Aeries-read rules. An explanation can show category arithmetic alongside **A complete matching total is unavailable**; that is not a validated overall result. Extra decimals describe the model's arithmetic.

## MVHS next-class panel

The panel starts **off**. In **Settings**, read the explanation beside **What class is next (MVHS)** and enable it to allow public schedule/clock requests. Saving other settings preserves that choice. An older saved enabled widget without the explicit consent flag remains off until enabled through this control.

With visible dashboard courses, the panel shows the current bell-schedule slot, before-school/between-periods/finished/no-school state, current start/end and remaining time, the next student slot, and **Today's full bell schedule** with the active slot highlighted. Recognized student slots include numbered periods, tutorial, testing, assembly, rally, and advisory; a break can be the current slot without becoming the next class.

Times use **America/Los_Angeles (Pacific time)**. Course names come only from visible Aeries cards and local nicknames. **Match classes to periods** opens Courses. Matching is exact, including suffixes such as `2A`, and ambiguity produces a period label instead of a guess. Unmatched periods are not skipped as free periods.

### Countdown after school

Whenever no later student slot remains today, including during the last class, the panel looks up the next school day's first student slot and counts down to it. It searches at most fourteen dates ahead, respects public no-school/weekend entries, and converts Pacific wall time across daylight-saving changes.

The countdown uses days, hours, and minutes as appropriate. If no student slot is listed within that window, it says so. If a future date has conflicting calendar entries or an unavailable schedule, the search stops there and reports **Next school day unavailable** while keeping today's valid bells visible. It does not skip an uncertain date to predict a later class. It does not search a personal attendance calendar or guarantee that a public calendar includes every future change.

### Schedule verification and network controls

mvhs.io's public Firebase schedule is the primary source. Public bell.plus schedule and clock data cross-check it before seconds are shown. Seconds need fresh same-date data, acceptable clock checks, matching periods, and agreement about the current bell boundary. A next-school-day countdown also needs agreement for that future date.

If bell.plus is stale, unavailable, or disagrees, the primary countdown falls back to **minutes**. Missing, invalid, or stale primary data needed for today produces loading/unavailable status and **Retry schedule**. An unavailable historical or future schedule definition does not hide a valid current day; it blocks a prediction only when that definition is needed. Check the linked public source and the school's announcement when schedules differ.

The freshness window is five minutes. Visible countdowns update about once per second from in-memory data; they do not make a request each second. Hidden tabs stop refresh ticks/new refresh work until visible again, but hiding a tab does not itself cancel an already-started transfer.

Turn **What class is next (MVHS)** off to cancel pending requests where possible, ignore late replies, clear cached schedule data, and stop further refreshes **in that tab**. Master pause also stops it, but retains its opt-in so re-enabling Playground can resume requests. Other grade tools do not require schedule access.

Reload other Aeries tabs promptly after disabling schedules or pausing Playground. Ordinary setting changes are not synchronized live: another tab can retain its old opt-in, continue requests, and save it again. See [privacy and permissions](../SECURITY.md).

## KBAR music

KBAR starts off on every page load and saves no playback preference. It requests looping playback of the English KBAR video only after you activate a control. Playground must be enabled; schedule consent is unrelated.

| Control | Effect |
| --- | --- |
| **P**, with the dialog closed | Creates the player and requests playback on first use; then requests pause/resume. |
| **Settings → Play KBAR (P)**, **Pause KBAR (P)**, or **Retry KBAR (P)** | Requests playback, pause, or a fresh player after failure. The label follows the requested state; the status below reports progress. Disabled when Playground is paused. |
| **Settings → Close KBAR player** | Stops and removes the hidden embed. |
| Manager **Aeries Playground — KBAR play/pause (P)** | Requests playback/toggle through the userscript manager. |
| **Settings → Open on YouTube** | Opens the original video in a new tab. Works with Playground paused or no embed loaded. Does not close or start the embed. |

The iframe and its native controls stay offscreen, outside normal layout, to avoid adding visible page space. Settings shows loading, playback, pause, blocked-playback, and error messages; **Pausing** means a request is awaiting acknowledgment. These messages reflect the player's reports and do not guarantee audible output. Browser restrictions, networking, embed restrictions, or changes to YouTube's player interface can make a playback request fail. If you hear nothing, read the Settings status, use **Close KBAR player**, retry once, or use **Open on YouTube**. Close the embed separately to avoid simultaneous playback.

Starting connects to `www.youtube-nocookie.com`. Privacy-enhanced embedding is not anonymous: YouTube receives connection/playback information, may use browser storage, can make its own media/advertising requests, and may show ads. Playground's player parameters/control messages contain no grades, assignments, course names, profiles, or Aeries account data. The embed receives the site origin rather than the full gradebook URL.

**Pause leaves the embed loaded. Close unloads it.** Pausing does not stop every third-party request. Turning off Playground, successfully clearing saved settings, or leaving the page removes that tab's player. Closing does not undo prior requests or erase YouTube-controlled storage.

The visible **Open on YouTube** link sends no referrer and allows no opener access. See [KBAR privacy details](../SECURITY.md#kbar-playback).

## Settings, profiles, and saved data

Use the [settings guide](SETTINGS.md) for the full defaults, save behavior, and profile/year workflow. The key distinction is between saved configuration and the temporary scenario:

| You changed | How it is kept |
| --- | --- |
| A feature toggle, map's ungraded toggle, or GPA checkbox | Applies immediately and attempts to save automatically |
| A course nickname/period/bar, or global colors/cutoffs/profile/year | Requires the form's **Save course settings** or **Save settings** button |
| A course grading profile or added/removed replacement rule | Saves automatically; incomplete profile edits remain a draft |
| A hypothetical score, new assignment card, or range | Memory only; exit/reload clears it |

### Default toggles

A new install enables the grade tools, colors, bars, overall summary, and precise formatting. Numeric 4/3/2/1 display, schedule access, and the map's ungraded preview start off. KBAR starts unloaded. See the [complete default table](SETTINGS.md#default-toggles).

### What changes and what stays saved

Profiles organize course customizations and grading rules; global display settings remain shared. Posted grades and hypothetical scores are not saved by this source. Replacement rules save assignment references, which can include names and categories. See [the storage table](SETTINGS.md#what-changes-and-what-stays-saved).

### Select a profile and school year

When switching students, close other Aeries tabs, pause Playground in the remaining tab, switch the Aeries account, and save the intended **Settings profile** and **School-year starting year** while paused, then re-enable it. Selection is manual; matching a score to a student does not select a settings profile. See [switching profiles](SETTINGS.md#select-a-profile-and-school-year).

### Storage errors and multiple tabs

Ordinary saves are last-write-wins across tabs. After changing important settings, consent, or pause state, reload other Aeries tabs. Check for a storage-error message if a change does not survive reload. See [storage recovery](TROUBLESHOOTING.md#settings-do-not-survive-reload).

## Updating and returning to the original page

For a temporary pause, turn **Enable Playground** off. For native Aeries with no Playground code running, disable the userscript in the manager and reload every Aeries tab. Neither action deletes saved settings.

**Clear saved settings and pause** removes active configuration after confirmation; it is not needed for ordinary troubleshooting. An update replaces the installed script and requires a reload. Follow the [pause, clear, and update steps](SETTINGS.md#pause-clear-or-remove-playground) to choose the action you need.

## Troubleshooting

Start with the [troubleshooting guide](TROUBLESHOOTING.md). It groups recovery by task:

- [Missing controls or courses](TROUBLESHOOTING.md#controls-or-courses-are-missing)
- [Unavailable or mismatched grade totals](TROUBLESHOOTING.md#gradebook-totals-do-not-match)
- [Weight-map previews](TROUBLESHOOTING.md#weight-map-and-ungraded-preview)
- [Scores, ranges, and replacement rules](TROUBLESHOOTING.md#grade-testing-targets-and-ranges)
- [GPA and dashboard display](TROUBLESHOOTING.md#gpa-and-dashboard-display)
- [Schedules](TROUBLESHOOTING.md#next-class-schedule) or [KBAR](TROUBLESHOOTING.md#kbar-playback)
- [Saving and multiple tabs](TROUBLESHOOTING.md#settings-do-not-survive-reload)

## Limitations

Playground does not provide persistent scenarios, scenario export/import, grade history, grade notifications, transcript GPA, automatic account separation, or other schools' schedule support. It does not infer drop-lowest, hidden exclusions, arbitrary teacher rules, or zero-point extra-credit policies.

Automatic average-gradebook parsing is tailored to recognized four-point layouts; bare numeric averages have narrow course-title recognition. A display scale or custom grading profile does not make every other gradebook format supported. There is no current generic table-import/mapping interface.

When a local estimate differs, use the posted Aeries gradebook and the teacher's stated policy. See [maintenance and release readiness](MAINTENANCE.md) for documented follow-up work; this guide describes current behavior rather than promising future fixes.

