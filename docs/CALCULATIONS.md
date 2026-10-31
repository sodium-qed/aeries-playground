# Calculation reference

Aeries Playground reconstructs the gradebook loaded in your browser and evaluates local hypothetical scenarios. This reference describes the calculations implemented in the current source. See the [feature guide](FEATURES.md) for controls and [release availability](FEATURES.md#available-release) for which edition includes them. A planned release does not make an unimplemented calculation or fix available.

All examples use fictional scores. A calculated result is an estimate under the available data and supplied rules; it does not establish a teacher's policy or replace the official Aeries grade. **Unavailable** or **—** means there is no usable result or comparison, not a grade of zero.

Use these sections for the most common questions:

- [What counts, including missing work and zero scores](#counted-assignments-and-score-limits)
- [Points, category weights, and four-point averages](#total-points-and-weighted-category-grades)
- [Dashboard ratings and GPA](#display-ratings-and-gpa)
- [Assignment weight, impact, and ungraded previews](#assignment-weight-versus-impact)
- [Replacements](#replacement-rules), [required scores](#target-score-calculation), and [score ranges](#score-range-calculation)
- [Why a calculation can be unavailable](#reconciliation-and-incomplete-data)

This reference retains the public 3.0.0 calculation behavior, describes the prepared [3.1.0 integration additions](#planned-310-assignment-multipliers), and identifies the separate planned 3.1.1 bonus band. Check [release availability](FEATURES.md#available-release); a calculation description is not evidence of stable publication.

## Inputs and interpretation

Different tools use different inputs:

| Tool | Inputs |
| --- | --- |
| Dashboard ratings and GPA | Posted marks on currently visible course cards, course inclusion choices, and the applicable display thresholds or Honors/AP selections. |
| Posted impacts and weight map | The open gradebook's assignment rows, eligible matching embedded scores, and grading information read from Aeries totals. |
| Grade testing, target solver, and ranges | The posted assignment baseline, temporary edits and Count choices, and any saved course grading profile and replacement rules. |
| Explain my grade | Posted reconstruction when testing is off; the current hypothetical scenario when testing is on. A partial explanation can appear with an explicit unmatched-total message. |

The script does not fetch hidden assignments, prior terms, or a transcript to fill gaps. Playground's category filter hides rows visually while keeping their scores in the model. Aeries' **Show only missing assignments** can remove necessary rows and blocks reconstruction. The optional next-class panel and KBAR playback supply no calculation inputs.

Dashboard display settings are separate from calculation policies. Changing colors, threshold cutoffs, bar bounds, nicknames, or Honors/AP selections does not change assignment scores or the gradebook formula. A saved **Course grading profile** can change the hypothetical formula; it does not modify Aeries.

Keep the units separate when reading results:

| Value | Meaning |
| --- | --- |
| `8 / 10` points | Earned points and possible points for an assignment. |
| `80%` | Earned divided by possible, multiplied by 100. |
| `+5 pp` | A difference of five **percentage points**, such as 85% minus 80%; it is not a 5% relative increase. |
| `3.5 / 4` average | A continuous average in the course's average scale. |
| Dashboard rating `3` | A threshold band assigned from a course's posted numeric grade. |
| GPA `3` | An equal-course average of letter-grade points; the Honors/AP choice affects only its weighted version. |

### Order of a hypothetical calculation

The supported calculation proceeds in this order:

1. Read or edit assignment earned points, possible points, and inclusion. Convert intentionally entered raw marks to points; for a target or range, supply the candidate point score first.
2. Apply eligible replacement rules using the original entered source scores, with any replacement-specific caps.
3. Apply the course's minimum and maximum assignment percentages to each counted effective score.
4. Sum counted earned and possible points by category, then calculate a total-points or weighted-category percentage.
5. Convert to the course's display scale and apply any configured final-grade rounding.
6. Format the result for display.

Assignment impacts deliberately use step 4's **unrounded** grades. Dashboard ratings and letter-based GPA use their own calculations, described below. None of these operations supplies an unknown letter-grade conversion policy.

## On-page score precision

Aeries may display **14.67 / 15** while already embedding **14.66666666666667** earned points in the page. The adapter can restore that earned value before reconstruction and grade testing. This operates independently of **Ridiculously precise mode**, which only changes formatting.

The adapter parses one JSON array named `RecentData` already present in the page; it does not execute the surrounding JavaScript. A value is accepted only when all of these checks pass:

- The page has unambiguous school, student, and person identifiers, and the selected gradebook belongs to that school.
- One matching course record connects the exact course title to the selected gradebook, term, and school. Abbreviated or duplicated titles do not qualify.
- The assignment number, title, category, assigned date, and due date match the loaded assignment. Duplicate embedded assignment numbers and duplicate model IDs are rejected.
- The assignment is included, graded, and in a percentage-based gradebook, with positive possible points.
- The embedded earned score rounds to the visible earned-point value at its displayed precision, with a minimum of two decimal places for that check.
- Dividing those earned points by the **visible** possible points produces a percentage that rounds to both the row's percentage and the embedded percentage at their respective displayed precision.

For the example above:

```text
earned points:             14.66666666666667 → 14.67 at two decimals
percentage using / 15:     approximately 97.7777777777778%
row percentage:            97.78%
embedded percentage:       97.8%
```

The denominator remains **15**. This restores a supplied value; it does not guess extra digits or alter the posted grade. Missing, malformed, duplicated, inconsistent, excluded, and ungraded records retain the visible score. Four-point gradebooks are not adjusted. The recent-items data may cover only some assignments, so a single gradebook can contain inputs with different source precision.

When displayed **Complete** metadata does not match the posted or restored points, the editor retains points mode and derives an approximate raw equivalent. It treats differences smaller than **0.000000001 points** as matching when choosing the initial input mode. Re-entering the same numeric point value preserves that draft's input mode; deliberately changing raw marks applies the [raw conversion](#raw-marks-and-gradebook-points).

Calculations use finite JavaScript numbers, not unlimited decimal precision. Extra displayed digits do not prove hidden official precision, and restored inputs do not guarantee reconciliation. The matching identifiers are temporary and do not select settings profiles; see [on-page score matching](../SECURITY.md#on-page-score-matching).

## Counted assignments and score limits

A counted assignment must be included and have a nonnegative numeric earned score and positive possible points. The native adapter interprets the score that Aeries supplies; it does not infer a score from an assignment title, due date, or a missing-work label.

| Posted row or model condition | Treatment |
| --- | --- |
| Numeric **0 / 10** | Counts as a real zero. |
| Blank, dash, or nonnumeric earned score | Ungraded; no earned score of zero is invented. |
| Missing work with a posted numeric zero | Counts as zero if otherwise included. |
| Missing work without a usable numeric score | Remains ungraded. |
| **Grading Complete: No** with a usable numeric score | Can count; that Boolean does not exclude the score. |
| Explicitly excluded, excused, exempt, or dropped score | Omitted. The native parser recognizes `EX` and `EXC` as well as those words in the score. |
| Whole score in parentheses, such as **(8 / 10)** | Treated as excluded by the native parser. |
| Letter with an explicit numeric equivalent, such as **A+ (10) / 10** or **A+ (10 / 10)** | The numeric equivalent can be read. A letter alone is not converted to points. |
| Earned points greater than possible points | Allowed unless limited by a supplied assignment ceiling. |
| A counted negative or invalid score, or nonpositive denominator | Calculation unavailable; the engine does not silently repair it. |
| Duplicate assignment ID, including on an excluded row | Calculation unavailable; assignments must have distinct identities. |
| Counted earned points over a zero-point denominator | Unsupported extra-credit policy; calculation unavailable. |

Blank scores in the lab remain ungraded even when **Count** is checked. They do not create an active category or contribute possible points to the grade. Turning Count off omits that row from valid calculations. Explicitly excluded posted work starts with Count off; testing can include it locally if you supply a valid score and denominator.

For example, **8/10** plus **blank/10** gives **80%** in Total points mode. Changing the blank to **0/10** gives **8/20 = 40%**. Excluding that zero returns the grade to **80%**. A blank, a counted zero, and an excluded zero are three different states.

Turning Count off also omits that draft's score, denominator, range, name, and category validation. Its entered values remain available to edit or re-enable; they do not block the remaining scenario. Turning Count back on restores the normal validation, so an unfinished or malformed scored assignment must be corrected before it can contribute to a result.

### Minimum and maximum assignment percentages

Optional limits apply to the effective earned points **after replacements** and before any totals are calculated. With earned points `e`, possible points `p`, minimum percentage `f`, and maximum percentage `c`:

```text
after minimum = max(e, p × f / 100)       if a minimum is supplied
after maximum = min(after minimum, p × c / 100)   if a maximum is supplied
```

An omitted limit leaves that side unrestricted. Limits must be nonnegative, and the minimum cannot exceed the maximum. Neither limit changes the denominator or makes an ungraded assignment count. They constrain the modeled score rather than rewriting the value typed into the score field.

For example, with a **50% minimum** and **100% maximum**, scores **1/10** and **12/10** contribute **5/10** and **10/10**. The result is **15/20 = 75%**. Without limits, they contribute the original points. Aeries' recognized minimum/maximum legend supplies these policies when available; a saved profile can explicitly override them for testing.

## Raw marks and gradebook points

**Score** is gradebook earned points over gradebook possible points. **Complete** or **# correct** represents raw marks earned over raw marks possible. These denominators need not be equal.

When raw marks are intentionally edited:

```text
untruncated points = raw marks earned / raw marks possible × gradebook possible points
converted points   = floor(untruncated points × 100) / 100
```

This conversion always rounds **down to hundredths**. **2 correct out of 3** on a **10-point assignment** becomes **6.66/10**, not 6.67/10. Exact decimal arithmetic is used for this conversion before returning the numeric result; **0.58 / 1 × 50** therefore becomes **29**, not 28.99 from a binary representation error.

Raw earned marks may be fractional, zero, or above the raw total. Both denominators must be positive for a scored conversion. Blank input remains ungraded. If questions have unequal values, use earned raw marks and total raw marks rather than a count of questions.

Points entered directly are not deliberately rounded to hundredths. Their linked raw value is an approximate equivalent, and display formatting is not fed back into the stored point value. Entering a missing raw total first can derive that equivalent while retaining points as the authoritative input. Changing a raw field deliberately switches to the raw-conversion calculation.

The score controls accept ordinary signed decimal notation, then enforce nonnegative earned values and positive denominators. Use plain numbers such as `6.5`, rather than `65%`, a comma-formatted value, or scientific notation in these controls. Formatting in the original Aeries page is parsed separately.

There is no general snapping of entered scores to whole points or to integer dashboard ratings. Raw conversion, the target solver's chosen increment, final-grade rounding, and display formatting are separate operations. Switching range display units also retains each endpoint's entered basis until that endpoint is edited.

## Total-points and weighted-category grades

### Total points

For counted assignments with effective earned points `e_i` and possible points `p_i`:

```text
E = sum(e_i)
P = sum(p_i)
course percentage = E / P × 100
```

**90/100** and **40/50** produce **130/150 × 100 = 86.6666…%**. The two assignments are weighted by possible points; averaging their individual percentages equally would give a different calculation.

Category labels can still organize the explanation, but they do not introduce category weights in Total points mode. For the explanation, a category's effective share is its possible points divided by total counted possible points.

### Weighted categories

For each category `k`, sum counted effective earned points `E_k` and counted possible points `P_k`. A category is active when it contains at least one counted score, including a zero score. Its configured weight `w_k` must be known and nonnegative.

```text
category percentage q_k = E_k / P_k × 100
active weight total W   = sum(w_k for active categories)
effective share s_k     = w_k / W
course percentage      = sum(q_k × s_k)
```

Empty categories are omitted, and active weights are normalized. Weights may be relative numbers; they do not need to sum to 100.

| Category | Counted score | Category percentage | Configured weight | Effective share | Contribution |
| --- | --- | --- | --- | --- | --- |
| Homework | 18/20 | 90% | 40 | 40% | 36 percentage points |
| Tests | 40/50 | 80% | 60 | 60% | 48 percentage points |
| Total | — | — | 100 | 100% | **84%** |

Within a category, possible points still determine assignment weight. Homework scores **9/10** and **45/90** produce **54/100 = 54%**, not the equal-per-assignment mean of 70%. With Tests at **80%** and the same **40 / 60** category weights, the course grade is **0.4 × 54% + 0.6 × 80% = 69.6%**.

With the original **18/20 Homework** row as the only counted score, its effective share becomes **100%**, and the course grade is **90%**. A zero-weight category can have counted points and appear in reconciliation while contributing zero to the overall grade. If all active weights are zero, there is **no weighted grade**, not a grade of 0%. A missing or negative weight for an active category is an error.

The native adapter chooses weighted mode when it reads category weights from Aeries totals; otherwise it uses points mode. It does not infer an unseen teacher policy. A custom profile requires weights for currently counted categories, with at least one positive weight among them. If no category currently counts, at least one entered category weight must be positive. This validation differs from the calculation engine, which can recognize an Aeries baseline containing only zero-weight categories and report that no grade exists yet.

The profile's active-category check includes counted, valid ranges even when their single-score draft is blank. Supply a weight for every category you intend to use in ranges or the target solver. A saved profile is not proof that every later scenario has the weights it needs.

### Four-point averages and other display scales

The engine calculates an internal percentage in either grading mode. For an average scale with maximum `M`:

```text
displayed average = internal percentage / 100 × M
```

The native adapter recognizes an overall `Avg` value and uses **4** as the assignment denominator and scale maximum. It also has a course-title rule for Survey Composition/Literature abbreviations, allowing bare numeric grades in that recognized course. This is specific recognition, not general inference of arbitrary rubric scales.

With all native assignment denominators set to 4, Total points mode becomes an equal-weight average of counted assignment scores. **3/4** and **4/4** yield **3.5/4**. In weighted mode, each category is an equal-weight average of its counted four-point assignments, followed by category weighting. For example:

| Category | Assignment scores | Category average | Effective share | Contribution |
| --- | --- | --- | --- | --- |
| Essays | 3/4 and 4/4 | 3.5/4 | 60% | 2.1 average points |
| Projects | 2.5/4 | 2.5/4 | 40% | 1.0 average point |
| Total | — | — | 100% | **3.1/4** |

These continuous averages are separate from dashboard threshold ratings. A **3.456/4** assignment is not snapped to an integer rating. Assignment percentage limits still use percentages: the limit is applied to earned points relative to the assignment's denominator.

A hypothetical profile can specify another positive average maximum. This changes the display-scale conversion and final-rounding scale; it does **not** rescale the stored assignment denominators or infer a new rubric. Existing native four-point denominators remain read-only, and availability of raw-score controls follows the detected native gradebook. A custom scale therefore needs inputs whose meaning you have checked.

### Final-grade rounding and display precision

Without a supplied rounding policy, the calculated grade remains unrounded. A saved profile explicitly chooses one of these policies:

| Policy | Calculation in the course's display scale |
| --- | --- |
| No rounding | Preserve the calculated value. |
| Round to nearest | Nearest multiple of `10^(-d)`; nonnegative halfway values round upward. |
| Round down | Floor to a multiple of `10^(-d)`. |
| Round up | Ceiling to a multiple of `10^(-d)`. |

For a rounding policy, `d` must be an integer from **0 through 8**. Rounding is applied once to the overall result, after category contributions, and in average points for an average course. A small floating-point boundary correction prevents ordinary representation errors from selecting the wrong side of an exact rounding boundary.

For an unrounded average of **3.456/4**, two-place nearest and up rounding both yield **3.46/4**; down yields **3.45/4**. No rounding retains **3.456/4**. The calculation does not first round its internal percentage. Category values and contributions remain unrounded, so a sum of displayed contributions can differ from the displayed final total.

**Ridiculously precise mode** generally formats calculated values to at most eight decimal places; turning it off generally uses two. Trailing zeroes are removed. Headline GPA/rating values and map weights use compact formatting of at most two decimals regardless of that toggle. Expanded GPA/rating arithmetic follows the precision toggle. These display choices do not change the model or impose a final-grade policy.

## Display ratings and GPA

The dashboard summary uses currently visible course cards, with duplicate course identities counted once. It retains the first usable grade for the selected summary: a recognized letter for GPA or a numeric grade for ratings. A later usable card can replace an earlier blank or unreadable duplicate, while conflicting usable duplicates keep the first one. Included courses have equal weight. Saved courses that are not visible are not added to the calculation.

In the separate **planned 3.1.1** source, **Show 5/4/3/2/1 on dashboard** first compares each posted numeric grade with the global bonus cutoff for its scale. Only a grade strictly above that cutoff receives 5. Otherwise, compare it with the course's three ordinary descending cutoffs:

| Condition | Rating |
| --- | --- |
| Grade strictly above its global bonus cutoff | 5 |
| Grade at least the highest ordinary cutoff, without a bonus match | 4 |
| Grade at least the middle cutoff, below the highest | 3 |
| Grade at least the lowest cutoff, below the middle | 2 |
| Grade below all three cutoffs | 1 |

The earlier 3.0.0 and prepared 3.1.0 editions keep their original 1–4 ratings and **Show 4/3/2/1 on dashboard** label. The bonus row is not part of the November 1 integration.

The default bonus cutoffs are **100%** and **4** average points, using strict **>**. Thus exactly **100%** or **4** is not a bonus match. The ordinary percentage cutoffs are **95 / 85 / 75**; ordinary average cutoffs are **3.7 / 3.1 / 2.5**. Equality at an ordinary cutoff belongs to its higher band. A posted numeric zero is still a usable numeric grade and receives rating 1 with these cutoffs. A missing numeric grade is omitted. Course-specific cutoffs override the ordinary defaults only; the bonus row stays global.

Average the ratings of included visible courses. Ratings **4, 4, 3, 3** give **14/4 = 3.5**. The displayed number remains **3.5**; the default overall-average cutoffs make its color band 3. The overall color does not round the average to an integer. Honors/AP choices have no effect in this mode.

Bonus ratings also participate in that arithmetic: ratings **5** and **4** average to **4.5**. The numeric summary uses the configured **Average >** cutoff for its own bonus color, so 4.5 is purple with the default cutoff 4; exactly 4 uses an ordinary color. Changing display bands does not change posted scores, gradebook calculations, or letter-based GPA.

With numeric display off, the summary uses the original posted A/B/C/D/F letters and shows both GPAs below. It does not infer letters from percentages, custom bands, four-point averages, or hypothetical assignment results. For example, **A, B+, F** give unweighted **(4 + 3 + 0)/3 = 2.3333…**, displayed as **2.33**.

### Weighted GPA

The summaries appear when **Overall grade / GPA above classes** is on and **Show 5/4/3/2/1 on dashboard** is off. The class inclusion checkbox determines membership in **both** GPAs. **Honors/AP** changes the weighted grade points for a counted A, B, or C; it does not change course weight or override exclusion.

| Posted letter, ignoring plus/minus | Unweighted points | Weighted when unchecked | Weighted when Honors/AP is checked |
| --- | --- | --- | --- |
| A | 4 | 4 | 5 |
| B | 3 | 3 | 4 |
| C | 2 | 2 | 3 |
| D | 1 | 1 | 1 |
| F | 0 | 0 | 0 |

Let `S` contain the included, visible courses with recognized letters after deduplication, and let `N` be its size. For `N > 0`:

```text
u_i = unweighted points for course i
b_i = 1 if Honors/AP is checked and the letter is A, B, or C; otherwise 0
unweighted GPA = sum(u_i for i in S) / N
weighted GPA   = sum(u_i + b_i for i in S) / N
```

The denominators are identical. Plus/minus signs are ignored, and neither GPA uses Playground thresholds. Blank, pass/fail, numeric-only, and unrecognized marks are omitted. A posted F counts as zero. If `N = 0`, both summaries display **—**. Honors/AP starts unchecked and is never inferred from the course name.

For five included courses with **A, B, C, D, F**:

| Honors/AP and inclusion choices | Unweighted GPA | Weighted GPA |
| --- | --- | --- |
| All five checked | `(4+3+2+1+0)/5 = 2.00` | `(5+4+3+1+0)/5 = 2.60` |
| None checked | `10/5 = 2.00` | `10/5 = 2.00` |
| Only A and B checked | `10/5 = 2.00` | `12/5 = 2.40` |
| All checked, A course excluded | `6/4 = 1.50` | `8/4 = 2.00` |
| Only the F course included | `0/1 = 0.00` | `0/1 = 0.00` |

The UI's compact formatting can show these exact values as `2`, `2.6`, or `0`. Selections are saved per course in the manually selected profile/year; posted letters and calculated GPA values are not saved. These are current-visible-course estimates without transcript credit weighting, previous years, automatic honors eligibility, school-specific bonus caps, or other institutional GPA rules. The **Current-year GPA** label does not mean a transcript or complete year has been retrieved.

## Assignment weight versus impact

Weight describes how possible points enter the current formula. Impact answers what happens if one assignment is removed from the current model.

| Quantity | Formula |
| --- | --- |
| Points-based assignment weight | `assignment possible / all counted possible` |
| Weighted-category assignment weight | `effective category share × assignment possible / counted category possible` |
| Grade impact | `unrounded modeled grade with the assignment − unrounded modeled grade without it` |

For **90/100** and **40/50**, the first assignment's weight is **100/150 = 66.6666…%**. Its impact is **86.6666…% − 80% = +6.6666… percentage points**. Weight and impact are not interchangeable.

The second assignment has positive weight **50/150 = 33.3333…%**, but its impact is **86.6666…% − 90% = −3.3333… percentage points**. A negative impact means the current grade is lower with that assignment included. A valid zero impact means removing it leaves the grade unchanged; an unavailable impact means there is no usable comparison.

Weight is a share of possible points under the formula, not a promise about the benefit of one more earned point. With a **50% assignment minimum**, both **1/10** and **2/10** contribute **5/10**. That assignment can have positive weight while this particular score increase has no effect.

Impact is a leave-one-out comparison using today's model, not the historical change when the assignment was posted. It removes replacement rules involving the removed assignment, including any benefit it supplied to other targets. Removing the only counted assignment in a category can deactivate that category and renormalize the remaining weights. In the **84%** weighted example above, removing Homework leaves Tests at **80%**, so Homework's impact is **+4 percentage points**.

Percentage courses label impact **pp**, meaning percentage points. Average courses convert the internal difference to average points; **3.5 − 3.4 = +0.1 average points**. Impacts use unrounded grades even when the profile rounds the final grade. Formatting can round the label. If removal leaves no valid comparison grade, including when the assignment is the only counted score, the impact is unavailable.

Weight-map circle **areas** are proportional to shares on one scale across categories. Radii scale with the square root of weight: twice the weight means twice the area, not twice the diameter. Positive weights sum to 100%, subject to formatting; impacts do not. A zero-weight category can retain list entries without circles. Very small positive weights can display as **<0.01%**.

The map rescales its circles each time so the largest has a fixed maximum size. Compare the listed percentages when switching between current weight and the ungraded preview: an assignment can keep the same circle size while its share changes.

The map always uses **posted** assignments and the grading rules read from Aeries, including while testing is active. Saved hypothetical profile changes, added assignments, and future replacement rules do not change it. Circles and list entries follow numeric-aware assignment-number order.

During single-score testing, on-page **Grade impact** labels instead use the current scenario's scores, Count choices, grading profile, and resolved replacement rules. With counted ranges active, they say **Grade impact varies with ranges**. Subtracting endpoint grades does not establish an assignment's minimum and maximum impact; return to single scores for an exact leave-one-out value under that scenario.

### Ungraded-assignment weight preview

Turning on **Show ungraded assignments** expands the posted weight map without assigning scores to ungraded work. This saved display preference starts off. It changes only the map; it does not change the current grade, lab Count choices, impacts, or GPA.

Preview denominators include non-excluded assignments with known positive possible points. A weighted class additionally needs a known nonnegative weight for the assignment's category. An entry whose weight is unavailable stays in the list without a circle and enters neither preview denominator. An ungraded-only category can enter the preview even though it is inactive in the current grade.

```text
points-based preview share = assignment possible / all known preview possible

preview category share = category weight / sum of known preview-category weights
weighted preview share = preview category share
                         × assignment possible / category's known preview possible

displayed preview weight = preview share × 100%
```

A zero-weight category has zero share. If all preview-category weights are zero, determined shares are zero rather than a division by zero. Unknown weight remains distinct from known zero weight. Positive shares sum to 100% whenever a positive-weight preview exists, subject to formatting.

**Points example:** a graded **90/100** and an ungraded assignment worth **50** possible points have a current grade of **90%**. With the checkbox off, the graded assignment has 100% of counted weight. With it on, the preview shares become **100/150 = 66.6666…%** and **50/150 = 33.3333…%**. No 0/50 score is inserted, and the current grade stays **90%**.

**Weighted example:** Tests has weight **80**, Homework **20**, and the posted scores are **18/20** and **9/10**. Add an ungraded 40-point test and an ungraded 30-point homework assignment:

| Assignment | Posted score | Current counted weight | Preview weight |
| --- | --- | --- | --- |
| Graded test | 18/20 | 80% | `80% × 20/60 = 26.6666…%` |
| Ungraded test | Blank / 40 | Not counted | `80% × 40/60 = 53.3333…%` |
| Graded homework | 9/10 | 20% | `20% × 10/40 = 5%` |
| Ungraded homework | Blank / 30 | Not counted | `20% × 30/40 = 15%` |

The current grade is **90%** in both views. If Homework had only ungraded work, the current counted Tests category would have 100% of the grade, while the preview could show the configured **80% / 20%** category split. Excluded work stays omitted. A numeric zero is graded work; **Grading Complete: No** alone does not make it ungraded. Gray circles indicate unknown earned scores, not zero scores.

The preview still requires [posted-data reconciliation](#reconciliation-and-incomplete-data). With no counted grade, it can proceed after category totals reconcile if Aeries' overall value is absent or zero. Missing required totals, a missing-only filter, or conflicting totals still blocks it. With no positive known shares, there can be list entries without circles. Turning the checkbox off restores ordinary current-grade requirements.

This is a preview of relative weights if shown work with known weights counts. It is not a score forecast, a complete future syllabus, or an application of future replacement rules.

## Replacement rules

A replacement copies a source assignment's entered **percentage**, scaled to the target's possible points:

```text
source fraction        = source entered earned / source possible
candidate fraction     = source fraction, or min(source fraction, cap / 100) with a cap
candidate target score = candidate fraction × target possible
```

A **90/100** test replacing a **40/50** quiz proposes **0.90 × 50 = 45** earned points for the quiz. The source still counts as **90/100** in its own category; it is not consumed or moved to the target's category. The target keeps its own possible points and category. Replacement conversion does not use the raw-mark conversion's round-down-to-hundredths rule: a **2/3** source can propose **6.6666…/10** for a **0/10** target.

| Policy or condition | Behavior |
| --- | --- |
| Only if higher | Use the candidate only when its percentage is strictly higher than the target's original percentage. Equality makes no change. |
| Always replace | Use the candidate even when it lowers the target. |
| Optional cap | Limit the proposed replacement percentage, not the source's own score. |
| Original target above a cap, only-if-higher policy | Keep the higher original score. |
| Multiple sources for one target | Every rule must use only-if-higher; the largest eligible candidate wins. |
| Unscored or excluded source or target | The rule has no effect until both are included and scored. |
| Missing assignment reference, self-replacement, invalid cap, or conflicting policies | Invalid rule. The UI also rejects duplicate source/target pairs. |

Source and target can be distinct assignments from different categories; the engine does not verify date order or that a teacher permits the chosen replacement. A blank target is not filled automatically. A target or range solver supplies its selected candidate score before checking eligibility, so a previously blank source can participate in that calculation.

Replacements **do not cascade**. Each source uses its original entered score, before another replacement or assignment score limits. For example, a **100% final** can raise a **50% midterm** to 100%, but if that midterm also replaces a **0% quiz**, its offer to the quiz is still **50%**. The rule list's order does not turn that chain into repeated propagation.

Assignment limits apply afterward and can change a capped replacement. With a **100/100** source, **20/50** target, **70% replacement cap**, and **80% assignment minimum**, the replacement first proposes **35/50**. The minimum then raises the target's effective score to **40/50**. The source remains **100/100**. The replacement breakdown can describe the pre-limit proposal while category totals use the final limited score.

Adding or removing rules saves the policy and assignment references, not the scenario's earned scores. Posted assignment references match by ID and name; recreated hypothetical references need a unique matching name and category after reload. Session bindings keep a hypothetical rule connected while its assignment is renamed. Unmatched rules are shown as inactive. Ordinary single-score testing can continue using the resolved rules, so inspect those notices; target and range calculations require all saved references to be resolved or removed. A partly entered replacement also blocks target/range calculations until added or cleared.

## Target-score calculation

**What do I need?** finds the smallest allowed gradebook-point score for one selected assignment while holding every other scenario score fixed. Choose the target course grade in percent or the displayed average scale, a maximum earned score, and a positive point increment.

```text
allowed scores = 0, step, 2 × step, …, floor(maximum / step) × step
```

The maximum is a bound, not an extra candidate. With a maximum of **10** and a step of **3**, the candidates are **0, 3, 6, 9**; **10** is not searched. In that case, a lone 10-point assignment cannot reach 100%. A maximum above the assignment's possible points is allowed when you intentionally model such a score.

For each candidate evaluated during the search, the solver:

1. Sets the selected assignment's earned score and includes it, even if it was previously blank or unchecked.
2. Recalculates all resolved replacement rules and assignment limits.
3. Recalculates the course grade, including any newly active category.
4. Applies the configured final-grade rounding.
5. Compares the result to the requested target.

The supported rules make the grade nondecreasing in the selected score, so the engine uses binary search over the allowed score indices. It does not evaluate every increment. If the largest allowed score misses the target, the result is **unreachable**. Invalid data, an unmatched baseline, missing weights, or unusable rounding settings produce an invalid/unavailable result instead. An extremely small increment relative to the maximum can also be rejected when the index count exceeds safe integer precision.

For example, start with **90/100** homework and a **40/50** quiz. Add a **100-point** test that replaces the quiz only if higher. Choose target **90%**, maximum **100**, step **1**, total-points grading, and no limits or final rounding:

```text
required test score = 90/100
replacement quiz   = 45/50
course grade       = (90 + 45 + 90) / 250 × 100 = 90%
```

Without the replacement, **95/100** is required. This is why replacement effects are recalculated during the search rather than frozen at the source's current blank or entered score.

Final rounding can affect the minimum. For a lone 100-point assignment, a **90%** target with nearest whole-percent final rounding and a **0.1-point** increment can be met by **89.5/100**, because its rounded course grade is 90%. This result is valid only if that rounding policy is the one you intend to model.

Turn off counted assignment ranges before solving: the tool holds other scores at single values. Maximum and increment are **gradebook points**, not number-correct units. **Apply hypothetical score** writes the result into the local point-score draft and checks Count. Relevant scenario or policy changes invalidate the saved solution and require a new calculation. The result is specific to the supplied maximum, increment, rules, and baseline, not a prediction of future teacher policy.

The step grid always begins at zero; it is not anchored to the assignment's current score. A result of **0 points required** is valid when including a scored zero still reaches the target. It does not mean the assignment stays ungraded or excluded. A result can also be lower than an existing score because the solver is finding a replacement hypothetical score, not additional points to earn.

## Score-range calculation

Turn on **Range** for one or more assignments and enter nonnegative lower and upper bounds, with lower no greater than upper. Counted ranges require positive possible points. Percentage-based books allow **Points** or **# correct**; raw bounds need a positive raw total and use the [round-down conversion](#raw-marks-and-gradebook-points). Native four-point books use points.

For an assignment with a usable single score, enabling Range initializes both bounds from that score. For a blank score, it starts at zero through the available total. Review these initial values; they are editable defaults, not predicted outcomes. Equal bounds are valid. Bounds above possible points are also allowed, with any configured assignment ceiling applied during calculation. Ranges have no separate score-increment control.

Switching display units preserves each endpoint's entered units and precision. Two raw bounds are checked for order in raw units before truncation; mixed-basis bounds are compared using their actual point scores. Turning Count off omits that range. Turning Range off returns to the saved single-score draft rather than selecting one of the bounds.

The engine evaluates the complete scenario twice: once with **all lower bounds together**, and once with **all upper bounds together**. Replacements, caps, assignment limits, category weighting, and final rounding are applied at both endpoints. Assignments without ranges retain their single scores; denominators remain fixed across the two scenarios.

With **80/100** already earned, no replacements, and total-points grading:

| Assignment | Lower endpoint | Upper endpoint |
| --- | --- | --- |
| Existing work | 80/100 | 80/100 |
| New quiz | 12/20 | 18/20 |
| New test | 30/40 | 38/40 |
| Total | **122/160 = 76.25%** | **136/160 = 85%** |

The combined course range is **76.25–85%**. Separately, **2–3 correct out of 3** on a **10-point assignment** converts to **6.66–10 points**.

In the preceding replacement-target example, a test range of **80–90/100** yields **84–90%** for the course. At 80 the quiz remains 40/50, giving **210/250 = 84%**. At 90 it becomes 45/50, giving **225/250 = 90%**.

These endpoints attain the extrema under the supported model: category weights are nonnegative, counted denominators are fixed, and permitted replacements, caps, limits, and rounding are nondecreasing in every input score. An unconditional replacement ignores its target's original score, which preserves that property. This also covers a ranged assignment supplying a replacement to another ranged assignment.

The calculation assumes assignments can vary independently within their bounds. It does not model linked outcomes, a fixed total number of correct answers across assessments, probabilities, or confidence intervals. It reports attainable lower and upper grades, not a guarantee that every intermediate value is possible when scores are discrete or rounded.

Invalid bounds, unfinished or unmatched replacement rules, invalid model inputs, or an unmatched posted baseline make the range unavailable rather than producing a partial estimate. The UI uses neutral range colors because an interval has no single grade band. Per-assignment impacts are withheld as described [above](#assignment-weight-versus-impact).

## Hypothetical changes and resets

The lab's temporary state and saved course policies have different lifetimes:

| Action | Effect |
| --- | --- |
| Per-assignment Reset | Restore that posted assignment's score/denominator/inclusion draft and remove its range. Saved grading and replacement policies remain active. |
| Reset hypothetical changes | Clear all score edits, ranges, and added assignments, then reload the saved replacement-rule list. Testing remains active; the planner fields are not explicitly cleared. |
| Exit grade testing | Clear the temporary scenario and planner fields and restore the original posted display. |
| Reload, switch gradebooks/terms, change profile/year, or detected gradebook-data refresh | Discard the temporary scenario. A gradebook/filter transition can close testing while fresh rows load. |
| Clear saved grading profile | Remove the custom grading policy and its form draft; testing falls back to the rules read from Aeries. Saved replacement rules are separate. |
| Clear saved settings and pause | Remove all saved profiles, course settings, and rules from active userscript storage, discard testing, and pause Playground. |

Scores, ranges, added assignments, and calculated results are not saved. Valid course profiles and added/removed replacement rules are saved automatically in the selected profile/year. Incomplete profile forms are saved as drafts; the last valid profile stays in use until a complete replacement is supplied or the saved profile is cleared. Copying Aeries values still requires an explicit final-rounding choice before a new profile becomes valid.

A reset of hypothetical changes is therefore not an undo of a saved policy. If a saved replacement references a removed hypothetical assignment, recreate a unique matching assignment or remove the rule. Settings profiles are selected manually and do not follow student identity automatically. See [settings and saved data](FEATURES.md#settings-profiles-and-saved-data) for scope and storage controls.

## Reconciliation and incomplete data

Before showing posted impacts or the weight map, the adapter reconstructs the loaded gradebook and compares category and overall totals with Aeries. Eligible embedded-score restoration happens first. The comparison checks consistency with the supplied page; it is not proof of hidden official precision or teacher-policy completeness.

| Check | Current behavior |
| --- | --- |
| Missing-only filter | Blocks reconstruction while enabled. |
| Category totals | At least one recognized category total is required. Every counted category must match a reported category. |
| Percentage/point category totals | Reconstructed effective earned and possible totals must each differ from the reported values by no more than **0.011 points**. |
| Category totals recognized as averages | Compare the reconstructed average to the displayed average, using tolerance `max(0.011, half of the last displayed decimal unit + 0.000000001)`. These books can report a zero points denominator. A blank grade has no recognized average unit and falls back to the earned/possible points check. |
| Overall percentage | Must be numeric and match the reconstructed result after any supplied final-grade rounding, within `max(0.011, half of the last displayed decimal unit + 0.000000001)` percentage points. |
| Overall average | Uses the same display-decimal-based tolerance as average categories, in average points. |
| Categories present only in the assignment model | Block reconstruction; they are missing from the reported totals. |

Percentage and average comparisons account for displayed decimal places. The total-points example reconstructs **86.6666…%** and can match **86.67%**, **86.7%**, or **87%**, while **86.6%**, **86%**, and **88%** remain inconsistent. The existing **0.011** allowance remains the minimum tolerance; labels with fewer decimal places use half of their last displayed unit plus a small floating-point allowance. Category point totals must still pass their separate check. Nonfinite grades or invalid precision metadata cannot satisfy reconciliation.

A saved grading profile or resolved replacement rules can reconcile original posted rows with adjusted totals, but the retry still uses **posted scores only**. Editing hypothetical scores cannot make a bad baseline valid. When a profile supplies final-grade rounding, the overall reconciliation check applies it in the course's display scale before comparing with Aeries. For example, **86.1%** with whole-percent rounding up can match **87%**; whole-percent rounding down cannot. Category totals, the arithmetic breakdown, and assignment impacts retain their unrounded values. Without a supplied rounding policy, the check compares the unrounded result using the displayed precision allowance; it does not infer a teacher's rounding policy.

Posted impacts and the map use only the native posted-rule check; a custom simulation profile that makes the lab available does not automatically make those posted tools available. **Explain my grade** can show category arithmetic beside an unmatched-total warning. That breakdown is not a reconciled overall result.

There are two deliberately limited empty-course cases:

- **First-assignment testing:** an entirely ungraded course can enter the lab if the missing-only filter is off, recognized category totals exist, and category earned/possible/grade values and the overall grade are absent or zero. This permits a hypothetical first score without treating existing blanks as zero.
- **Ungraded weight preview:** an empty current grade can be accepted when its category totals pass the map's reconciliation checks and the overall grade is absent or zero. Categories without a recognized numeric average still need usable earned/possible totals, normally zero; missing totals are not automatically accepted. This includes blank category grades in a native four-point book.

These checks do not infer arbitrary drop-lowest rules, hidden exclusions, different assignment weighting inside a four-point rubric, zero-point extra-credit policies, or additional teacher adjustments. Course-title recognition and native page selectors also have limits. Load the complete grading period and inspect the visible scores and known policy before changing a profile to explain a discrepancy. When a policy cannot be represented, the official gradebook remains authoritative.

## Planned 3.1.0 assignment multipliers

The [merge candidate](MERGE-PLAN.md) adds explicit assignment multipliers to recognized numeric `/4` gradebooks. A positive **Counts as** value changes an assignment's contribution within its category without changing its score scale or the category's configured percentage weight. The ordinary value is **1**; positive fractional values are allowed. Missing or guessed teacher weights are not inferred automatically.

After applying a replacement and score limits, the calculation multiplies both that assignment's earned and possible points by its multiplier. For two fictional assignments in one category, with no replacements or limits:

| Assignment | Score | Counts as | Weighted earned / possible |
| --- | --- | --- | --- |
| Quiz A | 3 / 4 | 2× | 6 / 8 |
| Quiz B | 4 / 4 | 1× | 4 / 4 |

The category average is `(6 + 4) / (8 + 4) × 4 = 3.333333… / 4`. The individual scores stay **3/4** and **4/4**. Within this category, their possible-point shares are **2/3** and **1/3**; circle area in the weight map follows those weighted shares. Other category weights still apply at the category level.

A replacement changes the target assignment's earned value first; the target retains its own denominator and multiplier. Range endpoints and target calculations use the same multiplier rules. A weight change does not turn a blank into a counted zero, include an excluded row, or alter the raw-to-points conversion. **Saved assignment weights** affect reconstruction and testing; temporary **Counts as** edits affect the active scenario and reset to the saved/default weight. See [save behavior](SETTINGS.md#planned-310-settings).

## Planned 3.1.0 precision and bounded estimates

The candidate keeps validated `RecentData` restoration and adds eligible card/raw values already present in the loaded page. A supplied precise value must agree with the current assignment identity, visible denominator, and displayed score information. An ambiguous or contradictory match is not a basis for inventing additional digits. These are read-only page adapters, not requests for hidden records.

When only rounded posted scores remain, a separate fallback can label the reconstruction **approximate** if display-derived bounds are consistent with the reported category and overall totals. This applies to eligible complete percentage gradebooks; it cannot explain a missing assignment denominator, an incomplete grading period, malformed metadata, or an unsupported policy. It preserves the public edition's explicit final-grade rounding policy and displayed-precision checks. Passing bounded reconciliation does not identify each exact hidden score or prove every teacher rule is known.

The target planner uses the lower permitted bounds of uncertain original scores for a **conservative** result. Under the supported nondecreasing calculation rules, that result meets the modeled target even at those lower bounds; the exact minimum could be lower. An entered hypothetical score remains the entered value, rather than being replaced by the original posted score's uncertainty bound. Ordinary reconstructed grades and impacts remain labeled estimates while this fallback is active. Display precision, teacher final-rounding policy, uncertainty in original inputs, and the chosen target increment are separate concepts.

Native regression predictions are a separate display feature: the candidate shows the existing Aeries tooltip value without recalculating it. A forecast is not a target calculation, posted grade, or extra input to these formulas.
