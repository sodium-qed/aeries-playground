# Calculation reference

This reference explains Aeries Playground's calculations. Examples use fictional grades, and all calculated outputs are local estimates under the supplied rules. See the [feature guide](FEATURES.md) for the corresponding controls.

## Inputs and interpretation

Calculations use data already rendered on the current Aeries page and the rules or hypothetical values you enter:

- Dashboard summaries use the posted marks on visible course cards.
- Posted assignment analysis uses the open gradebook's assignment rows, category totals, and overall grade.
- Grade testing starts from those posted rows, then applies your current score edits, Count choices, and saved course policies.

The optional next-class panel supplies no input to these calculations. Leaving it off does not reduce grade-tool functionality. The script does not retrieve hidden assignments or a transcript to complete an incomplete calculation.

A numerical result describes the supported model; it does not establish an unknown teacher policy. **Unavailable** or **—** means no usable result or comparison is available, not a grade of zero. Extra displayed decimals expose the calculation's precision, not additional precision from Aeries.

## Display ratings and GPA

Custom color/rating thresholds are separate from gradebook calculation policies. **Show 4/3/2/1 on dashboard** defaults to off on a fresh install.

With **Show 4/3/2/1 on dashboard** on, compare a course's posted numeric grade to that course's three descending cutoffs: the top band is 4, followed by 3 and 2, and anything below all three is 1. Average the ratings of included, visible courses equally.

For example, ratings 4, 4, 3, and 3 produce `14 / 4 = 3.5`. The displayed number remains **3.5**. With default average cutoffs 3.7/3.1/2.5, its color is the band-3 color. It is not displayed as an integer 3.

With numeric display off, use the original posted letter:

| Posted letter | Points |
| --- | --- |
| A, A+, A− | 4 |
| B, B+, B− | 3 |
| C, C+, C− | 2 |
| D, D+, D− | 1 |
| F | 0 |

A, B+, and F therefore produce `(4 + 3 + 0) / 3 = 2.3333…`, displayed as **2.33**. Threshold changes have no effect on this mode. Blank, pass/fail, and numeric-only marks do not count.

Both summaries are unofficial, equal-weight averages of included visible courses, with duplicate course identities counted once. The currently installable script does not apply AP/Honors bonuses. Course-credit weighting is not applied, and neither summary is an official school GPA.

### Weighted GPA (upcoming prerelease)

This subsection describes the prepared **2.1.0 prerelease**, not the currently installable script. See [availability and installation details](FEATURES.md#upcoming-weighted-gpa-prerelease). The prerelease displays both GPAs when **Overall grade / GPA above classes** is on and **Show 4/3/2/1 on dashboard** is off; numeric-rating mode remains unchanged.

Let `S` be the set of included, visible courses with a recognized posted A–F letter, deduplicated by course identity, and let `N` be its size. For each course `i`, let `u_i` be its unweighted points and `h_i` be 1 if the user checked **Honors/AP**, otherwise 0. The checkbox defaults to off and is never inferred from the course title.

| Letter, ignoring plus/minus | Unweighted `u_i` | Weighted if unchecked | Weighted if checked |
| --- | --- | --- | --- |
| A | 4 | 4 | 5 |
| B | 3 | 3 | 4 |
| C | 2 | 2 | 3 |
| D | 1 | 1 | 1 |
| F | 0 | 0 | 0 |

For `N > 0`:

```text
bonus_i = 1 if h_i = 1 and the posted letter is A, B, or C; otherwise 0
w_i = u_i + bonus_i
unweighted GPA = sum(u_i for i in S) / N
weighted GPA   = sum(w_i for i in S) / N
```

The denominator is identical for both averages. Honors/AP adds grade points; it does not give a course a larger share of the average. D/F receive no bonus. Unchecked courses still count normally when included, and checked but excluded courses contribute to neither average. Blank, pass/fail, numeric-only, or unrecognized marks are omitted; a posted F is included as zero. If `N = 0`, both GPAs display **—**, not zero or an invalid division.

For five included courses with posted A, B, C, D, and F, all checked as Honors/AP:

```text
unweighted GPA = (4 + 3 + 2 + 1 + 0) / 5 = 10 / 5 = 2.00
weighted GPA   = (5 + 4 + 3 + 1 + 0) / 5 = 13 / 5 = 2.60
```

If none is checked, both are **2.00**. If only A and B are checked, weighted GPA is **12 / 5 = 2.40**, while unweighted GPA stays **2.00**. If the A course is excluded from the all-checked example, both denominators become 4: unweighted **6 / 4 = 1.50**, weighted **8 / 4 = 2.00**. A single included F gives **0.00** for both; it is not an empty set.

Playground thresholds, numeric percentages, and hypothetical assignment scores do not determine these letters. Honors/AP selections are saved by course within the manually selected profile/year; posted marks and calculated GPA results are not persisted. The summary uses compact formatting with up to two decimal places (so exact values may omit trailing zeroes). Calculation details use the configured display precision. These are current-visible-course estimates without transcript credit weighting, prior years, automatic honors eligibility, or institution-specific bonus caps.

## Counted assignments and score limits

A counted assignment needs a nonnegative numeric earned score, positive possible points, and inclusion in the model.

- Blank/ungraded and excluded work does not count. Zero earned points does count.
- A numeric score can count even if Aeries says **Grading Complete: No**.
- The adapter reads explicitly supplied numeric equivalents, such as a letter accompanied by earned/possible points. It does not invent a numeric score from a letter alone.
- The native parser treats recognized exclusion markers and a whole score wrapped in parentheses as excluded.
- Above-100% earned scores can be modeled when permitted by the configured limits. A counted zero-point extra-credit assignment makes the calculation unavailable because no policy for that denominator has been supplied.

Replacement rules are applied to the entered scores first. Optional minimum/maximum assignment percentages are then applied to each counted score before category totals are calculated. These limits affect the modeled score without changing the assignment's possible points.

Average-point courses convert the internal percentage back to their scale: `displayed average = percentage / 100 × scale maximum`. The Aeries adapter uses four-point denominators for recognized average gradebooks; a hypothetical profile can specify another average maximum.

## Raw marks and gradebook points

When editing **# correct** or **Complete**, the conversion is:

```text
untruncated points = raw marks earned / raw marks possible × gradebook possible points
converted points = floor(untruncated points × 100) / 100
```

This conversion always rounds down to hundredths. For example, **2 correct out of 3**, on a **10-point assignment**, becomes **6.66/10**, not 6.67/10. Exact decimal arithmetic prevents a value such as `0.58 / 1 × 50 = 29` from incorrectly becoming 28.99 because of binary representation error.

Raw earned marks may be zero or above the raw total; both denominators must be positive. Blank input remains ungraded. If questions have unequal values, enter earned raw marks and total raw marks rather than a count of questions.

Points entered directly retain their entered value. Raw-score conversion, final-grade rounding, and the number of displayed decimals are three separate operations. The same raw-score conversion applies independently to lower and upper bounds entered as **# correct**.

## Total-points and weighted-category grades

For total-points grading:

```text
course percentage = total earned points / total possible points × 100
```

For example, 90/100 and 40/50 produce `130 / 150 × 100 = 86.6666…%`.

For weighted categories:

```text
category percentage = category earned / category possible × 100
effective category share = category weight / sum of active category weights
course percentage = sum(category percentage × effective category share)
```

An active category has at least one counted score. Empty categories are omitted and the remaining weights are normalized.

| Category | Score | Category grade | Configured weight | Contribution |
| --- | --- | --- | --- | --- |
| Homework | 18/20 | 90% | 40 | 36 percentage points |
| Tests | 40/50 | 80% | 60 | 48 percentage points |
| Total | — | **84%** | 100 | **84 percentage points** |

If only Homework has a counted score, its effective share is 100% and the grade is 90%. A zero-weight category can have tracked points but contributes zero. If every active category has zero weight, there is no calculated grade.

The profile's final-grade rounding is applied after the calculation, in the displayed scale. It can be none, nearest, down, or up, with 0–8 decimal places for rounding modes. This is distinct from the number of decimals shown by precise mode.

For example, an unrounded four-point average of 3.456 becomes 3.46 with nearest rounding to two decimals. The rounding acts on the average points, not on the internal percentage first. Category contributions are shown before this final rounding, so adding displayed contributions can differ slightly from the displayed final total.

## Assignment weight versus impact

| Quantity | Calculation | Meaning |
| --- | --- | --- |
| Points-based assignment weight | Assignment possible points / all counted possible points | Its share of the current counted grade. |
| Weighted-category assignment weight | Effective category share × assignment possible points / counted category possible points | Its share after category weighting. |
| Grade impact | Calculated grade with the assignment − calculated grade without it | Its leave-one-out effect on the current grade. |

In the 90/100 and 40/50 example, the first assignment's weight is **66.6666…%**. Its impact is **+6.6666… percentage points**, because the grade is 86.6666…% with it and 80% without it.

Impact subtracts the two **unrounded modeled grades**; it does not subtract final grades rounded by the course profile. Percentage courses label the result **pp** (percentage points), while average courses convert the difference to average points. For example, 3.5 minus 3.4 is an impact of +0.1 average points. Display formatting can round the label without changing this calculation.

Weight-map **areas** are proportional to weight. Radii therefore scale with the square root of weight: an assignment with twice the weight has twice the area, not twice the diameter. Positive weights total 100%, subject to display rounding; impact values do not have that property.

Removing an assignment for an impact calculation can also remove an active category, causing the remaining weights to be renormalized. The calculation engine also removes replacement rules involving a removed assignment. If removing the assignment leaves no valid grade, its impact is unavailable.

The weight map uses the posted gradebook, including during grade testing. Its circles and list follow assignment-number order; size still represents weight.

During single-score grade testing, on-page **Grade impact** labels use the current hypothetical scores, Count choices, and grading rules. When score ranges are active, counted assignments instead say **Grade impact varies with ranges**. Subtracting two endpoint grades would not establish the minimum and maximum impact of an individual assignment. Return ranged assignments to single scores to see exact impacts under that scenario.

## Replacement rules

A replacement copies the source's entered **percentage**, scaled to the target's possible points.

Example: a 90/100 test replacing a 40/50 quiz proposes `0.90 × 50 = 45` earned points for the quiz. The test still counts as 90/100 in its own category.

- **Only if higher** applies the candidate only when it improves the target.
- **Always replace** uses the candidate even if it lowers the target.
- An optional cap limits the proposed replacement percentage, not the source's own score. With only-if-higher, an original target above the cap keeps its higher score.
- Multiple sources for one target must all be only-if-higher; the highest eligible candidate wins.
- Source and target must both be included and scored. A replacement does not fill an unrelated ungraded target automatically.
- Sources use their original entered scores, not scores they received from another replacement. There is no cascading. For example, if a 100% final raises a 50% midterm and that midterm also replaces a 0% quiz, the midterm becomes 100% but its offer to the quiz is still 50%. Assignment score limits apply after these replacements.

Saving a rule saves its policy and assignment references, not the scenario's earned scores. The [feature guide](FEATURES.md#replacement-rules) explains matching after reload.

## Target-score calculation

The target calculator keeps other scenario scores fixed and searches allowed earned-point scores for one selected assignment. Allowed scores are `0, step, 2 × step, …`, up to the greatest multiple within the entered maximum. A maximum that is not a multiple of the step is not an additional candidate.

For each candidate evaluated, it:

1. Assigns that earned score to the selected assignment and includes it.
2. Recalculates replacements and assignment score limits.
3. Recalculates the points or weighted-category grade.
4. Applies the configured final-grade rounding.
5. Compares that grade to the requested target.

The engine uses a monotonic search to find the minimum allowed score. If the largest allowed candidate misses the target, the result is unreachable. Invalid inputs, unmatched saved rules, an unfinished rule entry, or an unmatched baseline prevent a result. Turn off counted assignment ranges before using this solver: it holds every other score at a single value. Maximum and increment are entered in gradebook points; the desired course grade uses the course's percentage or average scale.

With existing 90/100 homework and a 40/50 quiz, add a 100-point test that replaces the quiz only if higher. Use target 90%, maximum 100, step 1, total-points grading, and no rounding or score limits.

A score of **90/100** is sufficient: the quiz becomes 45/50, and `(90 + 45 + 90) / 250 × 100 = 90%`. Without that replacement, the needed score would be 95/100. This is why the replacement must be recalculated during the search.

The result is specific to the supplied maximum, increment, rules, and current scenario; it is not a prediction of a teacher's future policy.

## Score-range calculation

Turn on **Range** for one or more assignments and enter a lower and upper bound in **Points** or **# correct**. Raw bounds require a positive raw total and use the conversion above. Each lower bound must be no greater than its upper bound; two raw bounds are checked in raw units before truncation. Both bounds must be nonnegative.

Every selected, counted assignment contributes at both endpoints. The calculator evaluates the complete scenario once with all lower bounds and once with all upper bounds, including replacements, score limits, category weights, and final-grade rounding. Assignments without ranges keep their single scores. A row with **Count** off contributes to neither endpoint.

For example, with 80/100 already earned, no replacements, and total-points grading:

| Assignment | Lower bound | Upper bound |
| --- | --- | --- |
| Existing work | 80/100 | 80/100 |
| New quiz | 12/20 | 18/20 |
| New test | 30/40 | 38/40 |
| Total | **122/160 = 76.25%** | **136/160 = 85%** |

The combined course range is **76.25–85%**. As a separate raw-score example, a range of **2–3 correct out of 3** on a **10-point assignment** converts to **6.66–10 points**.

In the preceding target-score example, a test range of **80–90/100** produces a course-grade range of **84–90%**. At 80, the quiz stays 40/50; at 90, it becomes 45/50. Replacement effects are recalculated at both endpoints, including when one ranged assignment replaces another.

These are exact extrema under the supported model because counted assignments and possible-point denominators stay fixed, category weights are nonnegative, and each permitted replacement, cap, score limit, and rounding rule is nondecreasing in every entered score. Unconditional replacement ignores its target's original score, which also preserves this property. The method assumes scores can vary independently within their bounds; it does not model additional constraints linking outcomes.

Ranges update the current hypothetical scenario without changing Aeries. They give attainable bounds under the entered rules, not probabilities or a prediction of the teacher's grading policy. Invalid bounds or rules make the range unavailable rather than producing a partial estimate.

## Reconciliation and incomplete data

Before displaying posted impacts or the weight map, the adapter checks reconstructed category and overall totals against Aeries. Percentage/point comparisons allow a small display tolerance; average-gradebook comparisons also account for the number of displayed decimals. This is a consistency check, not proof of hidden official precision.

Calculations are blocked if the missing-only filter is enabled, required totals are absent, categories cannot be matched, or the reconstructed grade disagrees with Aeries. The lab can model a first assignment in an otherwise entirely ungraded course when its visible category totals support that baseline.

Playground's own category filter only hides rows and does not remove their scores from the model. It is different from Aeries' missing-only filter. **Explain my grade** may still show category arithmetic alongside a message that a complete matching total is unavailable; that breakdown is not a reconciled overall result.

A saved grading profile or replacement rules can reconcile posted rows with adjusted totals, but reconciliation uses the original posted scores. Editing hypothetical scores cannot make an incomplete posted baseline valid. Drop-lowest policies, hidden exclusions, unusual extra credit, or other teacher-specific rules may remain unsupported.
