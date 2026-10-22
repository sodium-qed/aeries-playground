# Feature guide

Use this guide for controls, defaults, saved settings, and recovery. The [README](../README.md) covers installation and supported pages; the [calculation reference](CALCULATIONS.md) covers formulas and worked examples.

Playground reads the supported Aeries page and changes its local presentation. Hypothetical grades are estimates under the supplied rules. They do not submit grade changes, create official assignments, or replace the teacher's grading policy.

## Available release

This guide documents the current source, whose userscript metadata remains **2.4.0**.

| Edition | Status and download |
| --- | --- |
| **2.4.0** | Published prerelease containing the features below. [Release page](https://github.com/sodium-qed/aeries-playground/releases/tag/v2.4.0) · [Version-specific userscript](https://github.com/sodium-qed/aeries-playground/releases/download/v2.4.0/aeries-playground.user.js). |
| **2.3.0** | Published earlier prerelease. It includes the fractional-score adapter and next-school-day countdown, but predates the ungraded-assignment weight preview. [Release page](https://github.com/sodium-qed/aeries-playground/releases/tag/v2.3.0). |
| **2.0.0** | Current stable **Latest**. [Stable release](https://github.com/sodium-qed/aeries-playground/releases/latest). It predates weighted GPA, KBAR, the fractional-score adapter, the next-school-day countdown, and the ungraded-assignment preview. |
| **3.0.0** | Planned stable release; not released by this documentation update. See [maintenance and release readiness](MAINTENANCE.md). |

The [main-branch installation link](https://github.com/sodium-qed/aeries-playground/raw/refs/heads/main/aeries-playground.user.js) follows `main`; it is not an immutable release download. The branch may include documentation, license-comment, and help-wording updates absent from the published asset; those text edits do not add features or alter calculation/control logic. Review the exact file you install. `/releases/latest` and its download shortcuts still point to the stable edition, not the 2.4.0 prerelease.

<a id="weight-map-prerelease"></a>
<a id="weighted-gpa-prerelease"></a>

Older links to the weight-map and weighted-GPA prerelease notes lead here. Use the current [weight-map](#assignment-weight-map) and [GPA](#weighted-and-unweighted-gpa-together) instructions below rather than treating an earlier release announcement as a separate feature guide.

## Find the controls

1. Open the Aeries dashboard to discover its course cards. The current gradebook can also discover its own course.
2. Press **S** outside an editable field, or use Tampermonkey's **Aeries Playground — open settings (S)** menu command.
3. Choose **Courses**, **Weight map**, or **Settings** in the dialog. Save ordinary form edits before changing tabs or reopening the dialog.
4. Open a course's gradebook with all assignments loaded and Aeries' **Show only missing assignments** turned off. Its local toolbar provides **Start grade testing**, **Add hypothetical assignment**, **Course grading profile**, and **Explain my grade**.
5. Check that posted totals can be reconstructed before relying on a hypothetical result.

There is no general floating Playground launcher in the current source. The gradebook's **Assignment weight map** button opens that dialog tab directly. The schedule and KBAR features are optional and are not needed for grade tools.

### Keyboard and dialog behavior

| Control | Behavior |
| --- | --- |
| **S** | Opens Settings. Ignores repeated/composing events, Ctrl/Alt/Meta combinations, and inputs, text areas, selects, textboxes, comboboxes, and editable content. |
| **P** | Requests KBAR play/pause when Playground is enabled and its dialog is closed. It also ignores editable controls, sliders/spinbuttons, repeats, composition, and Ctrl/Alt/Meta combinations. |
| **Tab / Shift+Tab** | Moves through available controls. The open dialog uses the browser's modal focus behavior. |
| **Left / Right**, **Home / End** on dialog tabs | Changes tabs and moves focus to the chosen tab. |
| **×** or **Escape** | Closes the dialog. Focus returns to the opener when it still exists, except after a successful **Show in gradebook** jump. |
| **Show in gradebook** | Closes the map, focuses the visible native assignment row, scrolls to it, and briefly highlights it. |

Typing within grade-testing controls keeps its keystrokes local; their event handling can also prevent letter shortcuts from reaching the page. Use the manager menu when a shortcut does not respond. Closing the dialog does not itself exit an active grade-testing scenario. Changing dialog tabs or reopening a form can discard unsaved **Courses** or non-toggle **Settings** fields without a warning.

## Dashboard and course customization

### Course names, icons, and periods

Open **Courses** to configure the courses discovered in the selected profile/year.

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

**Grade colors on details page** colors recognized posted assignment names/scores, category totals, and the course total. In the current lab, some existing hypothetical score/total overlays still receive threshold colors with this toggle off. Active score ranges use neutral colors because an interval has no single grade band.

### Progress bars and precision

**Grade progress bars** normally use **50–100** for percentage courses and **1–4** for recognized average courses. Threshold markers appear within the configured span. A missing numeric grade produces **No numeric grade posted**. The bar does not change a grade or its calculation rules.

**Ridiculously precise mode** starts on. It generally shows up to eight decimal places for calculated values and impacts, with trailing zeros removed; turning it off generally uses two. Native posted text remains native. Some displays deliberately use shorter formatting: summary GPA/rating numbers and map weight percentages use up to two decimals, while map point details use up to four.

Display precision, the [fractional-score adapter](#fractional-score-precision), and raw-score conversion are different operations. Precise mode does not retrieve extra records, infer official decimals, or change the rule that raw-score conversion truncates gradebook points to two decimal places.

### Overall grade and current-year GPA

**Overall grade / GPA above classes** starts on and uses the currently visible dashboard cards, deduplicated by course identity.

| **Show 4/3/2/1 on dashboard** | Summary | Details control |
| --- | --- | --- |
| On | **Playground overall score**: equal average of each included course's threshold-based 1–4 rating. | **Calculation & included classes** |
| Off | **Current-year GPA**: estimated unweighted and weighted averages of posted A–F letters. | **Calculation & GPA class selection** |

The class-inclusion checkbox saves immediately and affects both summary modes. Numeric mode skips courses without a recognized numeric grade. The result stays an average, such as **3.5**; only its color indicates a band, using **Settings → Average ≥** cutoffs. An empty set displays a dash rather than zero.

“Current-year” describes the courses shown on the dashboard. Playground does not retrieve a transcript, previous years, course credits, or a complete annual course list. Hidden courses do not count just because they have saved settings.

### Weighted and unweighted GPA together

In letter mode, open **Calculation & GPA class selection**. Each row has two independent choices:

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

Open **Assignment weight map** above the gradebook or the dialog's **Weight map** tab.

- Circle **area**, not diameter, represents an assignment's share. All categories use one size scale.
- Graded colors follow the posted numeric grade and selected cutoffs.
- Hover, click, or focus a circle or list button for its name, category, score, weight, and calculation breakdown.
- Entries use numeric-aware assignment-number order. Very small circles may omit the number; the list remains available.
- **Show in gradebook** rechecks the live page, clears a conflicting Playground category filter, and locates the row in Aeries' current table/card view.
- During testing the button reads **Posted assignment weight map**. It continues to use posted rows and Aeries-read rules, not hypothetical scores or saved replacement rules.

With the ungraded toggle off, the map describes included graded work. Ungraded and explicitly excluded work is omitted. Graded assignments in a 0% category remain in the list with no circle when the overall map can be calculated. A course with no counted grade may instead show an unavailable message.

Weights change when additional work or categories start counting. Score floors/ceilings are used when checking posted totals; circle sizes still use possible points, and colors use posted scores.

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

Select **Start grade testing** in the toolbar or beneath an assignment's percentage. That control starts testing for the whole open gradebook; it is not limited to the row you clicked. **Add hypothetical assignment** also starts testing if needed.

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

A scored or ranged hypothetical assignment needs a name and a category. Its category selector uses those already found in the gradebook, with an Uncategorized fallback when none exist; it cannot create an arbitrary new category. Names can contain up to 120 characters.

As you edit, Playground overlays assignment grades, category totals, and the hypothetical overall result. The toolbar remains marked as testing, edited rows have **Hypothetical** badges, and the posted overall grade remains available for comparison. It does not generate a hypothetical teacher letter grade. **Count** removes a contribution but does not suppress every input error: malformed single-score/raw inputs can still block the scenario, so fix or reset them.

Printing while testing is active can include hypothetical values. Exit testing first when you want to print the posted gradebook.

### Reset or leave a scenario

| Action | Result |
| --- | --- |
| **Reset hypothetical changes** | Clears score edits, ranges, and added assignments; reloads the currently saved replacement-rule list. Testing stays on. |
| **Exit grade testing** | Clears the temporary scenario and restores native posted nodes/values. |
| Reload, change gradebook/term, save another profile/year, or detect refreshed gradebook rows | Clears the scenario. A gradebook/filter transition waits for fresh rows before rebuilding tools. |
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

**Copy values shown by Aeries** supplies only detected values and leaves rounding for you to choose; it can leave a draft rather than a new active policy. Check weights for categories activated only by a new score or range, since a previously valid profile may not cover them.

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

1. Choose **Assessment supplying the score** and **Earlier assignment it can replace**.
2. Choose **Only if higher** or **Always replace**.
3. Optionally enter a nonnegative **Replacement cap (%)**.
4. Select **Add hypothetical replacement**.

Both assignments need names/categories, and a source cannot replace itself. “Earlier” is a user-facing label: the tool does not enforce chronological order. Both must count and have numeric scores for an ordinary rule to apply. The target/range calculators first supply their candidate scores, so a previously blank future source can participate.

**Only if higher** keeps the original target unless the capped offer improves it. **Always replace** can lower the target. Multiple sources for one target must all use only-if-higher; the best eligible improvement wins. The cap limits the proposed replacement, not the source's own score. Sources use their original entered scores, so rules do not cascade; assignment score limits apply afterward.

Adding/removing rules saves automatically per course/profile/year. **Save replacement rules for this course** saves explicitly; **Load saved replacement rules** reloads the latest stored list, not an older version.

Rules stay linked when you rename a hypothetical assignment during that session. Saved references are refreshed when rules are saved; save again after a rename if you want the new name/category recorded. After reload, recreate hypothetical assignments with the saved name/category, uniquely. Posted assignment references also need their matching identity/name. Unmatched rules are labeled inactive; resolve or remove them before using target/range calculations. Ordinary single-score simulation can continue with only matched rules, so inspect that list before trusting its result.

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

The countdown uses days, hours, and minutes as appropriate. If no student slot is listed within that window, it says so. It does not search a personal attendance calendar or guarantee that a public calendar includes every future change.

### Schedule verification and network controls

mvhs.io's public Firebase schedule is the primary source. Public bell.plus schedule and clock data cross-check it before seconds are shown. Seconds need fresh same-date data, acceptable clock checks, matching periods, and agreement about the current bell boundary. A next-school-day countdown also needs agreement for that future date.

If bell.plus is stale, unavailable, or disagrees, the primary countdown falls back to **minutes**. Missing, invalid, or stale primary schedule data instead produces loading/unavailable status and **Retry schedule**. Check the linked public source and the school's announcement when schedules differ.

The freshness window is five minutes. Visible countdowns update about once per second from in-memory data; they do not make a request each second. Hidden tabs stop refresh ticks/new refresh work until visible again, but hiding a tab does not itself cancel an already-started transfer.

Turn **What class is next (MVHS)** off to cancel pending requests where possible, ignore late replies, clear cached schedule data, and stop further refreshes **in that tab**. Master pause also stops it, but retains its opt-in so re-enabling Playground can resume requests. Other grade tools do not require schedule access.

Reload other Aeries tabs promptly after disabling schedules or pausing Playground. Ordinary setting changes are not synchronized live: another tab can retain its old opt-in, continue requests, and save it again. See [privacy and permissions](../SECURITY.md).

## KBAR music

KBAR starts off on every page load and saves no playback preference. It requests looping playback of the English KBAR video only after you activate a control. Playground must be enabled; schedule consent is unrelated.

| Control | Effect |
| --- | --- |
| **P**, with the dialog closed | Creates the player and requests playback on first use; then requests pause/resume. |
| **Settings → Play / pause KBAR (P)** | Requests the same toggle while Settings is open. Disabled when Playground is paused. |
| **Settings → Close KBAR player** | Stops and removes the hidden embed. |
| Manager **Aeries Playground — KBAR play/pause (P)** | Requests playback/toggle through the userscript manager. |
| **Settings → Open on YouTube** | Opens the original video in a new tab. Works with Playground paused or no embed loaded. Does not close or start the embed. |

The iframe is kept offscreen, outside normal layout, to avoid adding visible page space. Its internal status/error text is hidden too; the visible Settings button does not report whether playback actually started. Browser restrictions, networking, embed restrictions, or changes to YouTube's player interface can make a playback request fail. If you hear nothing, use **Close KBAR player**, retry once, or use **Open on YouTube**. Close the embed separately to avoid simultaneous playback.

Starting connects to `www.youtube-nocookie.com`. Privacy-enhanced embedding is not anonymous: YouTube receives connection/playback information, may use browser storage, can make its own media/advertising requests, and may show ads. Playground's player parameters/control messages contain no grades, assignments, course names, profiles, or Aeries account data. The embed receives the site origin rather than the full gradebook URL.

**Pause leaves the embed loaded. Close unloads it.** Pausing does not stop every third-party request. Turning off Playground, successfully clearing saved settings, or leaving the page removes that tab's player. Closing does not undo prior requests or erase YouTube-controlled storage.

The visible **Open on YouTube** link sends no referrer and allows no opener access. See [KBAR privacy details](../SECURITY.md#kbar-playback).

## Settings, profiles, and saved data

### Default toggles

Settings toggles apply and attempt to save immediately.

| Setting | Fresh-install default | Scope |
| --- | --- | --- |
| **Enable Playground** | On | Global master pause |
| **Dashboard grade colors** | On | Global |
| **Show 4/3/2/1 on dashboard** | Off | Global; also selects summary mode |
| **Overall grade / GPA above classes** | On | Global |
| **What class is next (MVHS)** | Off; explicit opt-in | Global saved choice; running requests are tab-local |
| **Course nicknames & icons** | On | Global display toggle |
| **Grade progress bars** | On | Global |
| **Grade colors on details page** | On | Global; see the active-lab limitation above |
| **Assignment impact labels on the page** | On | Global |
| **Ridiculously precise mode** | On | Global |
| **Category filter on gradebook pages** | On | Global feature toggle |
| **Assignment weight map** | On | Global |
| **Show ungraded assignments**, inside Weight map | Off | Global map preference; also saves immediately |

Existing valid preferences are generally retained on upgrade. Some former built-in defaults have migration logic, including older average cutoffs, bar minima, the old third-band color, and former automatically generated icons. A new install's default table is not a promise that every older setting remains unchanged.

### What changes and what stays saved

| Item | Save behavior and scope |
| --- | --- |
| Feature toggles, colors, global cutoffs, current profile/year labels | Global. Toggles save immediately; other fields require **Save settings**. |
| Course names/identifiers, aliases, icons, period overrides, bar ranges, course cutoffs | Per course in the selected profile/year; editable form uses **Save course settings**. Course discovery itself is saved automatically. |
| Summary inclusion | Per course/profile/year, default included; saves immediately in summary details. |
| Honors/AP selection | Per course/profile/year, default unchecked; immediate in GPA details or **Save course settings** in Courses. |
| Course grading policy and unfinished form draft | Per course/profile/year; automatic save, with only valid rules active. |
| Replacement policy and referenced assignment names/IDs/categories | Per course/profile/year; automatic on add/remove or explicit save. |
| Hypothetical scores, added assignments, ranges, target results | Memory only; scenario exit/reset/reload clears them. |
| Posted grades, calculated GPA, weight previews, gradebook page | Not persisted by Playground. |
| Selected category, map selection, public schedule cache, KBAR state | Page memory only. |

### Select a profile and school year

Enter **Settings profile** and **School-year starting year**, then **Save settings**. Both start blank. A supplied year must have four digits; a profile label may contain up to 60 characters. Use the same trimmed, case-sensitive labels to return to an existing scope.

Course settings are partitioned by that pair of labels and course/gradebook/term identity. A new pair starts a separate collection of course settings; global toggles, colors, and default thresholds remain shared. There is no automatic account/student/year selection and no profile picker or per-profile delete control. Select the right labels before customizing another student's courses.

Changing scope exits the current scenario. This separation is organizational, not encryption or independent storage accounts. Saved course identifiers and replacement references can reveal school/course information. Review manager sync/backups if you want configuration kept on one device; see [saved-data details](../SECURITY.md).

### Storage errors and multiple tabs

If storage fails, most settings still work for the current visit. A storage-error message can appear when a form reports its save or the dialog is rendered again. Reopen Settings if a supposedly saved preference disappears after reload.

Ordinary saves write the tab's loaded settings; simultaneous edits are last-write-wins, not merged. Reload other tabs after important settings changes. After an in-app clear, an old tab checks the reset marker before saving and can report **Saved settings were cleared in another tab. Reload this tab before saving.** That check is not immediate synchronization of its already-running features.

## Updating and returning to the original page

| Goal | Action |
| --- | --- |
| Temporarily pause | Turn **Enable Playground** off. Saved configuration stays; testing exits, schedule work stops in that tab, and KBAR unloads. |
| Stop only schedules | Turn **What class is next (MVHS)** off; other features stay available. |
| Return to Aeries with no Playground code running | Disable the userscript in Tampermonkey and reload. Saved settings remain. |
| Clear configuration | In Settings, select **Clear saved settings and pause**, confirm, then reload other Aeries tabs promptly. |
| Update | Review the intended source/release, install it as the replacement, keep only one copy enabled, and reload Aeries. |

A successful clear removes saved profiles, course customizations, grading profiles/drafts, replacement rules, and preferences, then restores defaults with **Enable Playground off**. It resets schedule consent and **Show ungraded assignments** to off. Re-enable Playground when ready; enabling schedules again needs its own opt-in.

Clearing does not delete manager sync/backups or YouTube-controlled storage. If the clear fails to save, the script restores its previous in-memory settings and reports the failure. Clearing all settings is not a routine troubleshooting prerequisite.

A fresh Tampermonkey install is configured for manual updates. An existing install can retain its previous manager update preference; inspect that setting. Use [Available release](#available-release) to distinguish a stable download, an explicit prerelease asset, and the moving main branch.

## Troubleshooting

| Symptom | Check or recovery |
| --- | --- |
| Cannot find Settings | Use **S** outside editable/grade-lab controls or the manager menu. No floating launcher is supplied. Confirm Tampermonkey/script execution is enabled on the supported MVLA student page. |
| Courses missing | Visit the dashboard or that course's recognized gradebook. Course discovery reads those pages; it does not fetch another account's courses. |
| Edits disappear after changing tabs | Save Courses/non-toggle Settings forms before navigating. Grading-profile drafts and added/removed replacement rules have separate automatic saves. |
| Wrong preferences after changing student/year | Enter the correct manual profile/year and save; score-matching checks do not switch settings scope. |
| No weighted GPA | Turn on **Overall grade / GPA above classes**, turn numeric 4/3/2/1 mode off, and check that the installed edition includes weighted GPA. |
| GPAs match unexpectedly | Check Honors/AP on included A/B/C courses; save if edited in Courses. Checked D/F receive no bonus. |
| Course absent from GPA | It must be visible, included, and have a recognized A–F letter. Honors/AP does not override exclusion. |
| Number rating differs from the posted letter | Ratings use your thresholds, not the teacher's letter scale. Turn numeric mode off to inspect the original mark. |
| Impact, map, or hypothetical total unavailable | Turn Aeries' missing-only filter off, wait for the selected gradebook, and compare loaded rows with category/overall totals. Review unsupported rules or your configured policy. |
| **Waiting for the selected gradebook or filter to finish loading…** persists | Let Aeries finish loading, then reload if necessary. The tool refuses to reuse old rows for a new course/filter. |
| Some scores have more decimals than native labels | Eligible matching embedded values are used locally. Precise mode changes formatting, not matching eligibility. Not every row has usable extra precision. |
| Ungraded checkbox missing | Use the explicit 2.4.0 prerelease or matching main source and reload. The checkbox is inside Weight map, not the Settings toggle list. |
| Preview row has no circle | Read its missing-point/category-weight explanation; a known zero-weight category also has no circle. Explicit exclusions stay omitted. |
| Preview changes graded weights | Ungraded work changes preview denominators and can activate a category. Turn it off for current counted shares. |
| Count off does not clear an error | Fix/reset malformed score/raw fields and name/category fields. Exclusion does not bypass all input validation. |
| “What do I need?” unavailable | Turn off counted ranges; provide target, positive possible points, nonnegative maximum, and positive increment. Finish/clear replacement entry and resolve unmatched rules. |
| Range result unavailable | Check nonnegative ordered bounds, positive Score/raw totals, baseline reconciliation, and weights for newly active categories. Resolve unfinished/unmatched replacements. |
| Reset did not undo replacement changes | Rule additions/removals save immediately. Remove unwanted rules explicitly; scenario reset reloads the saved list. |
| Saved hypothetical replacement is inactive | Recreate exactly one assignment with its saved name/category, or remove the rule. Save rules again after a rename before leaving. |
| Next-class panel missing | Enable Playground and the explained schedule toggle; visit a dashboard with visible course cards. |
| Next class shows only a period | Set its exact period override and resolve duplicate matches. Unmatched periods are not inferred to be free. |
| Schedule unavailable | Use **Retry schedule**, check userscript network permission and the linked public source. |
| Countdown has no seconds | Minutes are the fallback for stale/unavailable/disagreeing clock or schedule data, including an unverified future date. |
| No upcoming class after school | Search is limited to fourteen dates and depends on valid public schedule data. |
| P does nothing or KBAR is silent | Enable Playground; close the dialog and leave editable/lab controls, or use Settings/menu playback. Close the embed, retry, or use **Open on YouTube**. Hidden player errors are not displayed in Settings. |
| Paused music still has a loaded player | Use **Close KBAR player** to unload it. Pause retains the iframe. |
| Page gains a blank area after KBAR | The player is intended to stay outside normal layout. Keep one updated copy, reload, and report a remaining layout problem. |
| Settings fail to survive reload | Reopen Settings for storage errors, check the relevant Save control, and avoid conflicting saves from other tabs. Scores/ranges are temporary by design. |
| Another tab cleared settings or disabled schedules | Reload promptly. That tab's change does not immediately stop this tab's running state. |
| Display breaks or behavior changes unexpectedly | Disable duplicate/older scripts. Pause Playground or disable it and reload to compare with native Aeries. Aeries layout changes can invalidate the parser. |

For a useful ordinary report, give the installed version/source, browser, manager, affected feature, settings, steps, expected result, and fictional example values. Do not provide account access, cookies, page exports, or unredacted gradebooks. See [Contributing](../CONTRIBUTING.md) for reports and [Security](../SECURITY.md) for sensitive concerns.

## Limitations

Playground does not provide persistent scenarios, scenario export/import, grade history, grade notifications, transcript GPA, automatic account separation, or other schools' schedule support. It does not infer drop-lowest, hidden exclusions, arbitrary teacher rules, or zero-point extra-credit policies.

Automatic average-gradebook parsing is tailored to recognized four-point layouts; bare numeric averages have narrow course-title recognition. A display scale or custom grading profile does not make every other gradebook format supported. There is no current generic table-import/mapping interface.

When a local estimate differs, use the posted Aeries gradebook and the teacher's stated policy. See [maintenance and release readiness](MAINTENANCE.md) for documented follow-up work; this guide describes current behavior rather than promising future fixes.

