# Developing Aeries Playground

Start with [Contributing](../CONTRIBUTING.md) for suggestions, bug reports, or a first documentation edit. This guide is for a local working copy and changes that need more detailed verification. Check the [README maintenance notice](../README.md) before making commits; already scheduled maintenance is exempt from the contributor pause.

[Set up](#set-up-a-working-copy) · [Find the code](#find-the-right-file) · [Run checks](#run-the-repository-checks) · [Verify a feature](#verify-the-behavior-you-change) · [Prepare a pull request](#prepare-a-pull-request)

## Set up a working copy

You need Git, an editor, **Node.js 24**, and **Python 3**, as supplied by repository CI. The installable program is a single classic JavaScript userscript. The repository checkers use Node's built-in modules; publication tests also use Python's standard library. There is no package installation, dependency download, or build step.

1. Fork [sodium-qed/aeries-playground](https://github.com/sodium-qed/aeries-playground) on GitHub.
2. Clone your fork and add the original repository as `upstream`. Replace `YOUR-USERNAME` with your GitHub username:

   ```sh
   git clone https://github.com/YOUR-USERNAME/aeries-playground.git
   cd aeries-playground
   git remote add upstream https://github.com/sodium-qed/aeries-playground.git
   git fetch upstream
   git switch -c improve-playground upstream/main
   node --version
   ```

3. Confirm that Node reports `v24…`, then make one focused change. If you already have a clone, fetch `upstream` and create your new branch from its current `main`; adding the remote again is unnecessary.
4. Run the [repository checks](#run-the-repository-checks) and the [feature checks](#verify-the-behavior-you-change) relevant to the change.
5. Review and stage only the intended files, then follow [prepare a pull request](#prepare-a-pull-request).

This starts your work from the original repository's current `main`, even if your fork's `main` is older. Keep concurrent fixes when bringing the branch up to date.

## Find the right file

| Area | Where to look |
| --- | --- |
| Installable source and metadata | [aeries-playground.user.js](../aeries-playground.user.js). Its opening explanation covers page access, storage, requests, and review. |
| Grade calculations and planning | `GradeMath`, the grade-lab helpers, and `OverallMath` in the userscript; [calculation reference](CALCULATIONS.md). |
| Aeries page parsing and precision | `GradeDOM`, `parseRecentData`, `readEmbeddedScores`, and `restoreEmbeddedPrecision`. |
| Weight map and category filtering | `buildWeightEntries`, `layoutWeightCircles`, `refreshWeightMap`, and the category-spotlight helpers. |
| Public schedule and clock | `MVHSSchedule`, `BellPlusSchedule`, `requestScheduleJSON`, and `verifiedBellSeconds`. |
| Settings and media | `persist`, `clearSavedSettings`, `renderTab`, `kbar`, and `kbarShortcut`. |
| Reader-facing instructions | [README](../README.md), [feature guide](FEATURES.md), [Contributing](../CONTRIBUTING.md), and [security policy](../SECURITY.md). |
| License and review permission | [LICENSE](../LICENSE) and [licensing guide](LICENSING.md). Preserve applicable notices in copied or modified source. |
| Checkers and regression suites | [scripts](../scripts) and [tests](../tests). The suites cover repository validation, synthetic feature behavior, and mocked release recovery. |
| GitHub contribution prompts | [Issue forms](../.github/ISSUE_TEMPLATE) and [pull request template](../.github/pull_request_template.md). |
| CI and publishing | [Repository checks](../.github/workflows/checks.yml), [release workflow](../.github/workflows/release.yml), and [maintenance handoff](MAINTENANCE.md). |

Keep the metadata block first and preserve the userscript's filename, name, namespace, license identifier, copyright, attribution, and third-party notices. Leave version changes to coordinated release preparation. Follow nearby code style and [.editorconfig](../.editorconfig): UTF-8, LF, spaces, and a final newline. [.gitattributes](../.gitattributes) also normalizes text line endings. Avoid reformatting unrelated parts of the large source file.

## Run the repository checks

From the repository root, run:

```sh
node --test tests/*.test.mjs
node scripts/check-userscripts.mjs
node scripts/check-documentation.mjs
git diff --check
```

| Check | What passing establishes | What it does not establish |
| --- | --- | --- |
| `node --test …` | Every discovered regression suite passes its checker, extracted-source, synthetic fixture, or mocked integration cases. Publication tests exercise the real publisher against a local GitHub/CLI model. | Actual Aeries page layouts, userscript managers, live schedule services, media playback, or GitHub publication work in every environment. |
| `check-userscripts.mjs` | Discovered regular `.user.js` files compile as classic JavaScript and have a first-position comment-only metadata block with unique, nonempty `name`, `version`, and `description`, plus a `match` or `include` entry. | The URL rules or permissions are correct, or any userscript behavior is safe. The checker does not execute the userscript. |
| `check-documentation.mjs` | Supported local inline Markdown links resolve inside the repository, including through symlinks, and match local ATX heading or explicit anchors when applicable. | External URLs work, Markdown renders correctly, prose matches source, or issue-form YAML meets GitHub's schema. Fenced examples and reference-style links are outside its scope. |
| `git diff --check` | The diff has no detected whitespace errors or conflict markers. | The content, formulas, or links are correct. |

[Repository checks](../.github/workflows/checks.yml) runs all `tests/*.test.mjs` suites and both checkers on pushes, pull requests, and manual dispatch using Node.js 24. Run `git diff --check` locally as well. Synthetic feature tests and mocked integration tests are committed; they do not exercise a signed-in Aeries session or real media playback. A green CI run is not a release-readiness or security certification.

The userscript checker searches from the current directory. It skips dependency, Git, coverage, and designated private-capture directories, and does not follow symlinks. Its `--allow-empty` option is for bootstrapping an empty repository; do not use it to validate this project. A nonempty metadata field is not a complete metadata specification check.

### Documentation and form changes

Read the rendered Markdown, especially tables and code blocks. Check the changed control labels against source and distinguish current `main`, a tagged release asset, and a future plan. The same `@version` can appear in files with different contents. Keep relative links and heading anchors accurate when moving sections.

For issue forms, parse the YAML and compare it with GitHub's [issue-form syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms) and [form schema](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema). Check unique names and field IDs, supported element types, labels, and boolean `required` values. Keep `feature_request.yml` stable so existing suggestion links continue working. Do not add labels, assignees, projects, or other requirements without checking that they exist and are appropriate.

The chooser configuration must retain a private-security route and the option to open a blank issue when a private channel needs to be requested without sensitive details. Forms become available after reaching the default branch; YAML parsing alone does not test GitHub's rendered form or submission flow. Review that flow when available and say when it was not exercised.

## Try the edited userscript

Review the complete edited file, then replace the installed script's contents in your userscript manager's editor and save. Include the metadata header, keep only one Aeries Playground copy enabled, and reload the supported Aeries page. See [installation](../README.md#install) for manager-specific setup.

The source sets `@downloadURL none` to request manual updates. Fresh Tampermonkey installs use that setting; existing installations can retain earlier preferences, and other managers may interpret it differently. Inspect the installed script's update settings. A repository commit does not automatically replace the installed copy.

Use synthetic inputs and page fixtures created from scratch. Do not request credentials, copied Aeries pages, real student records, or saved-settings exports. If you independently test in your own authorized Aeries session, keep its data local and report only the browser, manager, steps, and outcome. If you cannot use a browser, record that limit.

Disabling the script in the manager and reloading keeps configuration. **Clear saved settings and pause** deletes active configuration and should be tested only when clearing itself is relevant. Use disposable synthetic settings for that check. See [SECURITY.md](../SECURITY.md) for storage, request, and other-tab behavior.

## Verify the behavior you change

Choose the relevant checks below. Record the input and rules, expected result, observed result, and method. Numerical examples test formulas; synthetic DOM fixtures test a modeled page; mocked requests test handling; live browser interaction tests the actual controls in that environment. Keep those forms of evidence distinct.

### Grades, planning, and precision

- Cover affected total-points and weighted-category cases: numeric zero versus blank, exclusions, missing and zero weights, four-point scales, score floors/ceilings, and final rounding. Include applicable replacement rules, ranges, raw-mark conversion, and target-search increments. Use the [calculation reference](CALCULATIONS.md) for the actual model.
- Preserve blocking of missing-only, incomplete, or mismatched baselines. Check both a valid reconstructed baseline and a case that must refuse to calculate. A plausible result is not enough when visible data does not reconcile.
- Test fractional-score matching with invented matching records and mismatched student/course/term/dates, duplicate records, malformed JSON, absent recent records, exclusions, and four-point gradebooks. After a valid match, `14.66666666666667 / 15` must survive editor initialization and an unchanged edit even when the table displays `14.67 / 15`.
- Keep deliberate raw-mark edits separate from restored precision: `2 / 3` on a 10-point assignment converts to **6.66**, while `0.58 / 1` on 50 points converts to **29**. Target-search checks should include a maximum not divisible by its step, such as maximum 10 and step 3, whose candidates are 0, 3, 6, and 9.
- Verify scenario reset on relevant page/scope changes. The precision adapter uses matching data already on the page; it must not fetch hidden records or save matching student identities. Hypothetical scores and ranges stay temporary, while grading policies and replacement references can be saved.

### Weight map and category filtering

- Test both grading methods, graded zero, blank and explicitly excluded blank rows, unknown/zero possible points, missing/zero category weights, and categories containing only ungraded work. Known positive shares should sum to 100% when positive-weight work exists; all circle areas use one scale. Unknown weights stay explained in the list without a circle.
- Use the [40% fictional example](../CONTRIBUTING.md#use-a-small-invented-example) to verify that turning on **Show ungraded assignments** changes shares without treating blank work as zero or changing the current grade. Also check empty-course reconciliation and the preview label.
- Check selection by pointer and keyboard, **Show in gradebook**, native table/card visibility, page changes while the map is open, and return to current weights. Current grades, impacts, and GPA must stay unchanged by the preview.
- **Show ungraded assignments** starts off, saves immediately, applies globally across courses and profiles/years, survives a successful save/reload, and resets to off after clearing. Category filtering hides rows without changing calculation inputs; choosing **All** or disabling the feature restores the appropriate rows.

### GPA and dashboard ratings

- Cover A/B/C/D/F, plus/minus marks, mixed Honors/AP choices, unchecked/excluded courses, duplicate course identities, and empty/non-A–F input. F counts as zero. Five included, Honors/AP-selected A/B/C/D/F courses yield unweighted **2.00** and weighted **2.60**; D/F receive no bonus.
- Check default-off Honors/AP selections, both editing locations, **Save course settings** versus immediate detail-panel saves, reload, manual profile/year separation, and reset. Formula checks alone do not verify saving or controls.
- Keep the numeric **4/3/2/1** mode separate from letter GPA. Check course thresholds, boundary values, the average itself, and its color threshold. Unsupported letters or unavailable scores must not silently become a counted zero.

### Public schedules and clocks

- Check explicit opt-in, including an upgrade with an old enabled widget but no saved consent. Test disabled/master-paused states, hidden-page refresh behavior, consent revocation, cancellation, and late responses in the current tab.
- Cover malformed or stale data, wrong status/final URL, oversized responses, request failures, clock disagreement, conflicting schedules, and minutes-only fallback. Mocked cancellation cannot establish whether a real manager aborts a transfer or honors the requested timeout.
- For countdown changes, cover bell boundaries, after school, weekends/no-school days, the 14-day search limit, and Pacific daylight-saving transitions. A future countdown needs the future date's schedule verified before showing seconds.
- Verify that unrelated bad schedule definitions do not hide a valid current day. An uncertain next school day must stop that prediction and show an explanation while preserving today's known bells.
- Keep schedule requests on the fixed public endpoints with no course/account data added. Review request changes with [SECURITY.md](../SECURITY.md); cookie omission, timeout, and cancellation behavior need manager/browser verification.

### Saved settings and other tabs

- Check the affected Save button or immediate toggle, storage failure messages, reload, and global versus profile/year scope. Profiles are selected manually; matching page identities do not switch them automatically.
- Distinguish ordinary last-write-wins saves from clear-settings reset-marker detection. Another tab can continue schedule requests or save an old opt-in after a change elsewhere. Closing or reloading other Aeries tabs is still necessary; reset detection is not an atomic transaction.
- Test successful and failed clearing with synthetic configuration, a stale tab attempting to save, and older-code behavior when relevant. Clearing retains paused defaults, schema/migration flags, and a reset marker. Disabling the script does not delete this configuration or manager backups.
- Check what is serialized: scores and hypothetical ranges stay temporary; course names/keys, grading policies, incomplete rule drafts, and replacement references can be stored. Do not infer that saved settings are anonymous or safe to upload.

### KBAR playback

- Verify no player before interaction and no saved playback state. **P** must ignore editable controls, Ctrl/Alt/Command-modified shortcuts, and an open Playground dialog. Settings and manager-menu playback controls should work while Playground is enabled.
- Test pause versus close, blocked playback, loading failures, rapid play/pause requests, and teardown. Pause keeps the embed loaded; close, master pause, a successful reset, and page exit remove it in that tab. Other tabs' players are separate.
- Check the Settings **Play KBAR (P)**, **Pause KBAR (P)**, and **Retry KBAR (P)** states with their visible status. A late playing message must not reverse a pause request or revive failed playback; a later deadline must not replace a useful load error. Provider-reported status is not evidence of audible output.
- Check the exact origin and current iframe window for incoming messages, bounded JSON parsing, and fixed player parameters with no grade/account data. Keep the hidden player from adding scroll space.
- **Settings → Open on YouTube** must remain visible, keyboard-accessible, and user-activated when the embed is closed, blocked, never ready, or Playground is paused. It opens a separate tab without referrer or opener access and does not close an existing embed.

A mock cannot prove actual YouTube playback. Its internal message interface and browser playback policy can change. Do not silently change player placement or describe privacy-enhanced embedding as anonymous.

### Shared controls and page behavior

For a UI change, check keyboard focus, **S** outside editable controls, dialog open/close and focus return, tab navigation, narrow layouts, and the enabled/paused states it affects. Check that buttons and score inputs do not accidentally submit the native Aeries form. Use synthetic names containing punctuation or markup-like text to confirm they remain text. For changes to row restoration, layout, or scrolling, verify the native view after disabling the enhancement and check reduced-motion behavior where applicable.

## Keep documentation and releases aligned

Write repository prose in English. Keep the README focused on setup and the overview; use the [feature guide](FEATURES.md#available-release) for release-specific availability and the [maintenance handoff](MAINTENANCE.md) for planned work. Do not add a README version history or a CHANGELOG. A future plan remains planned until publication is verified.

The [Developer/public merge plan](MERGE-PLAN.md) coordinates the next 3.1.0 integration. Build from audited public source and port Developer additions selectively. Keep the candidate on its preparation branch until the scheduled merge, preserve concurrent public fixes, and rerun checks on the actual head/base combination.

The candidate source's **3.1.0** metadata identifies the Developer/public integration. Public **3.0.0** remains the last verified stable release, published October 26, 2026, until 3.1.0 publication is verified. A version label, source edit, or document edit does not prove publication. Keep current `main` distinct from frozen tagged assets and check the release itself before claiming availability.

The [release workflow](../.github/workflows/release.yml) and [publisher](../scripts/publish-release.py) belong to one prepared **3.1.0 stable artifact**. They require a fixed version, SHA-256, byte size, tag `v3.1.0`, title `Aeries Playground 3.1.0`, and [reviewed release notes](RELEASE-3.1.0.md). Fill the publisher's fingerprint only after integrating all source changes. The not-before time is **November 2, 2026 at 07:59 UTC**, equivalent to **November 1 at 11:59 p.m. PST**; that guard does not schedule a run. The previous stable tag is `v3.0.0`; its original publication record remains in [the 3.0.0 notes](RELEASE-3.0.0.md).

The release workflow accepts a userscript-path push to this repository's `main` branch or a manual run on `main`. The timed-merge workflow also invokes the same publisher at the exact verified merge commit, because a merge made with GitHub's workflow token does not automatically trigger another push workflow. A push with a different source size/hash exits without release writes; manual recovery rejects a mismatch. Before any API mutation, the publisher runs every regression suite, both repository checkers, and `git diff --check`. It independently checks the repository source at the triggering commit, existing tags, release metadata, Latest selection, and any existing asset. Repository checks and release validation remain distinct gates; passing one does not bypass the other.

Publication first creates a missing tag at the exact triggering commit, creates or recovers a draft, and uploads only a missing asset. It downloads and hashes the asset before setting `draft: false`, `prerelease: false`, and `make_latest: true`. It then verifies the stable state, exact tag commit, source bytes, downloaded asset, and Latest. Earlier releases and their tags/assets are never changed. An existing conflicting tag, draft target, or asset stops the run; matching userscript bytes at another commit do not authorize moving or reusing that tag.

If publication stops after creating a tag, draft, or upload, inspect the error and **rerun the original workflow run at its original commit** after resolving a transient service failure. Recovery reuses matching objects and can add a missing asset; it never deletes a tag or uses an overwrite option. If `main` has advanced, a new manual run can conflict with the original tag even when the userscript is unchanged. Do not move the tag or change the approved fingerprint to force recovery. A conflicting artifact or target needs review. A new release requires new, explicitly reviewed constants and notes.

The publisher refuses to replace another release's Latest selection when it observes one, including during final verification. GitHub does not provide an atomic transaction for the whole publication sequence, so keep other release publishing paused during this run and investigate a reported race. Do not repeat publication blindly after such a report.

Review triggers and guards before changing publication code. Documentation work must not create, move, replace, or republish tags or assets, or weaken checks to make a documentation run pass. Comment and line-ending edits change a file's hash. Do not use an earlier asset's fingerprint or verification as evidence for a future release. Preserve newer fixes already on `main`, including the KBAR Settings fallback. If page access, permissions, storage, external requests, updates, or safeguards change, update the opening source explanation and affected guides together.

## Prepare a pull request

1. Review `git diff` and `git diff --check`. Stage only the intended files, then read `git diff --cached`, including every fixture and attachment, for unrelated changes or private data.
2. Commit the focused change and push the branch to your fork, for example `git push -u origin improve-playground`.
3. Open a pull request against `sodium-qed/aeries-playground`'s `main` branch and complete the [template](../.github/pull_request_template.md).

Explain the user-facing problem and resulting behavior, with a fictional before/after example when useful. List only checks actually run, their results, and what remains unverified. Include browser and manager versions for live verification. An issue is optional for a small correction; link it if one exists.

Retain notices and offer only material you have authority to contribute under the [repository license](../LICENSE). AI, scanner, and human code review are permitted; share code without account data. Static checks, a formula example, or an AI review are not evidence of zero risk or an independent audit.
