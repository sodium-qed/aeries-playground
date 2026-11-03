# Aeries Playground 3.1.1 — configurable bonus band

This follow-up adds a configurable **5 · bonus band**. Its launch is guarded until **Sunday, November 8, 2026, at 11:59 p.m. America/Los_Angeles (PST)**, equivalent to **November 9 at 07:59 UTC**. It is separate from the unchanged November 1 Developer/public **3.1.0** integration. Use the published GitHub release and attached asset to verify availability; a schedule, source note, or version label alone does not establish publication.

## Changes

- **Settings → Grade colors & thresholds** gains an editable **5 · bonus band** row, with purple (`#7c3aed`) as the default color, **Percentage > 100**, and **Average > 4**. Both comparisons are strict: exactly 100% or 4 keeps its ordinary band, normally 4 with default cutoffs.
- The bonus color and two cutoffs are global across courses, profiles, and years. Cutoffs must be finite and nonnegative. The bonus check runs before ordinary cutoffs; a course-specific override still changes only its original three thresholds. Select **Save settings** to apply the bonus row.
- **Show 5/4/3/2/1 on dashboard** can assign rating 5 to a qualifying course. The numeric overall summary averages the 1–5 ratings and checks its own average against the configured average bonus cutoff. Letter-based weighted and unweighted GPA keep their existing A–F and Honors/AP rules.
- Bonus colors follow the existing display-color controls without requiring numeric dashboard mode. A native forecast above the percentage bonus cutoff also uses the bonus color when dashboard grade colors are enabled; other forecast badges retain their blue styling and unchanged native values.
- Bonus settings save separately from existing four-color palettes and three-cutoff arrays. Older installations receive defaults for missing bonus fields. Invalid stored bonus values return to their defaults with a recovery notice.

## Updating

After 3.1.1 publication is verified, review its complete userscript and replace the existing installation. Keep one copy enabled, reload all Aeries tabs, and check the saved color and cutoff values. Updates remain manual, and adding the bonus band does not require clearing saved settings. The earlier 3.1.0 source and release notes remain unchanged by this follow-up.

The display band does not change posted scores, gradebook formulas, teacher policies, or official records. Public schedule consent and optional KBAR playback remain separate. See [settings](SETTINGS.md#colors-thresholds-and-precision), [feature behavior](FEATURES.md#bonus-band-planned-for-311), and [rating arithmetic](CALCULATIONS.md#display-ratings-and-gpa).

## Verification and release limits

Preparation verification passed **325/325 tests** on the prospective combined tree, including the existing scheduling/completion checks; the standalone candidate branch contains **205 tests**. Userscript syntax/basic metadata and local documentation links also passed. The frozen 3.1.1 userscript is **383784 bytes**, SHA-256 `3920c6c72f6b0d4ddfac82dad5d6f3bb560510cfe1d1ed193d43e3bb28136c4b`. These are preparation results, not publication evidence. Revalidate the exact combined candidate/base at execution.

Before publication, run the complete regression suite, both repository checkers, and the whitespace check on the final 3.1.1 candidate. Cover exact/default/custom cutoff boundaries, palette and cutoff persistence, older settings, numeric summary averages, applicable color toggles, forecast color, and unchanged letter-based GPA. Freeze the final source fingerprint only after the code and documentation are settled; an earlier release's test count or hash is not evidence for this artifact.

Live Aeries rendering, actual browser/userscript-manager migration, live schedule accuracy, and audible media have not been verified for this candidate. Synthetic tests do not establish those outcomes or certify security. Preserve existing releases, tags, and assets, and record actual publication evidence before changing availability claims.
