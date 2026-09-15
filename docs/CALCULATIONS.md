# Calculation reference

This reference describes the inspected **1.5.4 development snapshot**. The script is still unpublished. Examples below use fictional grades, and all calculated outputs are local models.

## Display ratings and GPA

Custom color/rating thresholds are separate from gradebook calculation policies.

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

Both summaries are equal-weight averages of included visible courses, with duplicate course identities counted once. Neither applies course credits or AP/Honors weighting.

## Counted assignments and score limits

A counted assignment needs a nonnegative numeric earned score, positive possible points, and inclusion in the model.

- Blank/ungraded and excluded work does not count. Zero earned points does count.
- A numeric score can count even if Aeries says **Grading Complete: No**.
- The adapter reads explicitly supplied numeric equivalents, such as a letter accompanied by earned/possible points. It does not invent a numeric score from a letter alone.
- The native parser treats recognized exclusion markers and a whole score wrapped in parentheses as excluded.
- Above-100% earned scores can be modeled when permitted by the configured limits. A zero-point extra-credit denominator is unsupported.

Replacement rules are applied to the entered scores first. Optional minimum/maximum assignment percentages are then applied to each counted score before category totals are calculated. These limits affect the modeled score without changing the assignment's possible points.

Average-point courses convert the internal percentage back to their scale: `displayed average = percentage / 100 × scale maximum`. The inspected Aeries adapter uses four-point denominators for recognized average gradebooks; a hypothetical profile can specify another average maximum.

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

## Assignment weight versus impact

| Quantity | Calculation | Meaning |
| --- | --- | --- |
| Points-based assignment weight | Assignment possible points / all counted possible points | Its share of the current counted grade. |
| Weighted-category assignment weight | Effective category share × assignment possible points / counted category possible points | Its share after category weighting. |
| Model impact | Modeled grade with the assignment − modeled grade without it | Its leave-one-out effect on the current grade. |

In the 90/100 and 40/50 example, the first assignment's weight is **66.6666…%**. Its impact is **+6.6666… percentage points**, because the grade is 86.6666…% with it and 80% without it.

Weight-map **areas** are proportional to weight. Radii therefore scale with the square root of weight: an assignment with twice the weight has twice the area, not twice the diameter. Positive weights total 100%, subject to display rounding; impact values do not have that property.

Removing an assignment for an impact calculation can also remove an active category, causing the remaining weights to be renormalized. The calculation engine also removes replacement rules involving a removed assignment. If removing the assignment leaves no valid grade, its impact is unavailable.

The map and on-page impact labels use the posted gradebook. The map does not become a simulation map when grade testing is active; on-page impacts are hidden during testing.

## Replacement rules

A replacement copies the source's entered **percentage**, scaled to the target's possible points.

Example: a 90/100 test replacing a 40/50 quiz proposes `0.90 × 50 = 45` earned points for the quiz. The test still counts as 90/100 in its own category.

- **Only if higher** applies the candidate only when it improves the target.
- **Always replace** uses the candidate even if it lowers the target.
- An optional cap limits the replacement percentage, not the source's own score.
- Multiple sources for one target must all be only-if-higher; the highest eligible candidate wins.
- Source and target must both be included and scored. A replacement does not fill an unrelated ungraded target automatically.
- Sources use their entered scores, not scores they received from another replacement. There is no cascading.

Saving a rule saves its policy and assignment references, not the scenario's earned scores. The [feature guide](FEATURES.md#replacement-rules) explains matching after reload.

## Target-score calculation

The target calculator keeps other scenario scores fixed and searches allowed scores for one selected assignment. Allowed scores are `0, step, 2 × step, …`, up to the greatest multiple within the entered maximum.

For each candidate evaluated, it:

1. Assigns that earned score to the selected assignment and includes it.
2. Recalculates replacements and assignment score limits.
3. Recalculates the points or weighted-category grade.
4. Applies the configured final-grade rounding.
5. Compares that grade to the requested target.

The engine uses a monotonic search to find the minimum allowed score. If the largest allowed candidate misses the target, the result is unreachable. Invalid inputs, unmatched saved rules, an unfinished rule entry, or an unmatched baseline prevent a result.

With existing 90/100 homework and a 40/50 quiz, add a 100-point test that replaces the quiz only if higher. Use target 90%, maximum 100, step 1, total-points grading, and no rounding or score limits.

A score of **90/100** is sufficient: the quiz becomes 45/50, and `(90 + 45 + 90) / 250 × 100 = 90%`. Without that replacement, the needed score would be 95/100. This is why the replacement must be recalculated during the search.

The result is specific to the supplied maximum, increment, rules, and current scenario; it is not a prediction of a teacher's future policy.

## Score-range calculation

A range varies one assignment from the entered low score to the high score. The calculator includes that assignment and evaluates the complete model at each endpoint, including replacements, limits, and rounding. Other scores remain fixed.

In the preceding example, a test range of **80–90/100** produces a course-grade range of **84–90%**. At 80, the quiz stays 40/50; at 90, it becomes 45/50.

The range does not edit the scenario. It supplies bounds under the current model, not probabilities or a multi-assignment forecast.

## Reconciliation and incomplete data

Before displaying posted impacts or the weight map, the adapter checks reconstructed category and overall totals against Aeries. Percentage/point comparisons allow a small display tolerance; average-gradebook comparisons also account for the number of displayed decimals. This is a consistency check, not proof of hidden official precision.

Calculations are blocked if the missing-only filter is enabled, required totals are absent, categories cannot be matched, or the reconstructed grade disagrees with Aeries. The lab can model a first assignment in an otherwise entirely ungraded course when its visible category totals support that baseline.

A saved grading profile or replacement rules can reconcile posted rows with adjusted totals, but reconciliation uses the original posted scores. Editing hypothetical scores cannot make an incomplete posted baseline valid. Drop-lowest policies, hidden exclusions, unusual extra credit, or other teacher-specific rules may remain unsupported.
