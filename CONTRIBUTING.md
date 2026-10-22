# Contributing to Aeries Playground

You do not need to write code to help. A short suggestion, a confusing instruction, or a description of something that went wrong is useful. Use plain language and fictional examples; you do not need to know the cause or propose a fix.

Before making commits, check the [temporary maintenance notice in the README](README.md). Suggestions and bug reports remain welcome during the pause, and already scheduled maintenance is exempt.

## Choose a starting point

| I want to… | Start here |
| --- | --- |
| Suggest an improvement or clearer wording | [Make a suggestion](https://github.com/sodium-qed/aeries-playground/issues/new?template=feature_request.yml) |
| Report something that is broken or confusing | [Report a bug](https://github.com/sodium-qed/aeries-playground/issues/new?template=bug_report.yml) |
| Get installation or feature help | [Installation](README.md#install), [feature guide](docs/FEATURES.md), and [troubleshooting](docs/FEATURES.md#troubleshooting) |
| Report a possible security or privacy problem | Read [SECURITY.md](SECURITY.md) before sharing details |
| Improve the documentation or source | Follow [your first change](#your-first-change) below |

You need a GitHub account to submit an issue or pull request. If a direct form link does not open, use [Issues → New issue](https://github.com/sodium-qed/aeries-playground/issues/new/choose). You can check [existing issues](https://github.com/sodium-qed/aeries-playground/issues) for the same topic and add a useful example there. Searching is helpful, but uncertainty should not stop you from reporting a problem.

## Make a suggestion

The [suggestion form](https://github.com/sodium-qed/aeries-playground/issues/new?template=feature_request.yml) asks one required question: **What would you like to do?** A sentence or two is enough to start. Say where you would use the improvement and why it would help. A sketch or invented example is optional; a technical design, code, or list of existing workarounds is not required.

Use a title that describes the idea, such as “Make the weight preview explanation easier to find.” Spell out abbreviations and describe the desired action so another person can understand the request without your private notes. If you have several unrelated ideas, give each its own issue. A suggestion records a need; it does not promise that a feature will be built or released on a particular date.

## Report an ordinary bug

Open the [bug form](https://github.com/sodium-qed/aeries-playground/issues/new?template=bug_report.yml) and describe:

1. **What happened:** the incorrect display, missing control, or error message.
2. **What you expected:** what you thought you would see or be able to do.
3. **What led to it:** the page, clicks, and settings you remember. If it happened once or you cannot reproduce it, say so.

Browser, userscript manager, and script version are helpful when known, but you can leave the optional fields blank. You do not need to inspect page source, run developer tools, or share access to an Aeries account.

### Find the installed version, if you can

Open your userscript manager's dashboard, select **Aeries Playground**, and read the `@version` line near the top of its editor. Do not change it just to file a report. Say whether you installed from a tagged release or the README's `main` link, and whether this was a fresh install or a manual replacement. “I don't know” is fine.

The `main` link can change between releases, and two files can have the same metadata version while their comments or code differ. If you already know the release tag or source commit, include it. See [release-specific downloads](docs/FEATURES.md#available-release); do not assume that the file under **Latest** is the same as `main`.

### Use a small invented example

For a calculation problem, include only the rows and rules needed to explain it. Distinguish a blank score, a numeric zero, and an explicitly excluded assignment. State the expected calculation separately from what Playground actually displayed.

For example, a report could describe this **fictional** total-points course:

| Assignment | Earned / possible | Status |
| --- | --- | --- |
| Practice A | 8 / 10 | Graded and included |
| Quiz B | 0 / 10 | Graded and included |
| Project C | blank / 20 | Ungraded |

With no score limits or replacement rules, the current grade should be `(8 + 0) / (10 + 10) × 100 = 40%`. The ungraded assignment is not a zero. With **Show ungraded assignments** off, A and B each have 50% of the current weight map. Turning it on should show preview shares of 25%, 25%, and 50%, while the current grade stays 40%. Add the value you actually saw and the steps that produced it; do not copy real grades into this example.

Include these extra details only when they apply and you know them:

| Problem | Useful details |
| --- | --- |
| Calculation or precision | Total-points or weighted-category rules; fictional scores, possible points, category weights, exclusions, and rounding; posted baseline versus a hypothetical edit; whether Aeries' missing-only filter was on. |
| GPA or 4/3/2/1 summary | Which display mode was on; fictional posted letters; included courses and Honors/AP selections; expected and actual averages. |
| Weight map | **Show ungraded assignments** on/off; current map versus preview; blank, zero, and excluded rows; known or missing possible points and category weights. |
| Next class | Displayed school date, approximate time and time zone, expected period, and whether **What class is next (MVHS)** was enabled. Use period numbers instead of class names. |
| KBAR music | Whether you used **P**, Settings, or the manager menu; whether a text field or Playground dialog had focus; pause versus close; whether **Settings → Open on YouTube** worked. |
| Saved settings | Generic profile/year labels, the relevant Save button or toggle, whether a reload changed the result, and whether another Aeries tab was open. Do not export settings. |
| Installation or updating | Browser and manager if known; fresh install versus replacement; chosen release or `main`; whether more than one copy was enabled. |

For a display problem, you may compare with the script disabled in the userscript manager and then reload. This keeps saved configuration. **Clear saved settings and pause** deletes configuration and is not a routine debugging prerequisite. You can submit a report without trying either action.

## Keep account data out of contributions

Issues, pull requests, commits, and their attachments are public. Use generic courses, invented assignment titles and scores, and synthetic fixtures created from scratch. A hand-drawn example or a few typed rows is often enough.

Do not upload passwords, cookies, session tokens, student or account identifiers, logged-in URLs, Aeries page exports, browser profiles, network captures, or saved-settings exports. Configuration can contain course names, identifiers, and assignment references even though posted grades and hypothetical scores are not saved. Do not offer or request someone else's login or account access to reproduce a bug.

Screenshots are optional. Before sharing one, remove all identifying information, real grades, class and assignment details, browser account details, and private URL parameters. If you cannot confidently remove them, describe the screen with invented data instead. Review every attachment and the staged diff before uploading; [.gitignore](.gitignore) is a convenience filter, not a privacy guarantee or a way to remove already committed data.

For a possible vulnerability or unintended disclosure, follow [the private-reporting instructions](SECURITY.md#report-a-vulnerability-privately). Use **Report a vulnerability** on the repository's Security tab if that option is available. If it is not, open a blank issue asking only for a private reporting channel, without the vulnerability, exploit, or personal information. The policy does not itself enable private reporting or guarantee a response time.

You may submit the complete source file to an AI tool, scanner, or human reviewer, including a paid service, under the [license](LICENSE). Share the code alone. Account data and copied Aeries pages are not needed for a source review, and an AI review is not an independent security audit.

## Your first change

After any announced contributor pause has ended, start with one focused documentation improvement, bug fix, or feature. For a large change, explain the user need in an issue first so the scope can be discussed. An issue is not required for a small, clear correction.

### Set up a working copy

You need Git, an editor, and **Node.js 24** to match repository CI. There is no package installation or build step: the installable source is one classic JavaScript userscript, and the checker uses Node's built-in modules.

1. Fork [the repository](https://github.com/sodium-qed/aeries-playground) on GitHub.
2. Clone your fork. Replace `YOUR-USERNAME` in this command with your GitHub username:

   ```sh
   git clone https://github.com/YOUR-USERNAME/aeries-playground.git
   cd aeries-playground
   git switch -c improve-playground
   ```

3. Base the change on the current `main`. If your fork is older, synchronize it before starting so current fixes are preserved.
4. Make the focused change, run [the repository checks](#run-the-repository-checks), and verify the affected behavior.
5. Review `git diff` and `git diff --check`. Stage only the intended files, inspect `git diff --cached`, then commit and push your branch to your fork.
6. Open a pull request against this repository's `main` branch and fill out [the pull request template](.github/pull_request_template.md).

For a small documentation edit, GitHub's file editor can create a fork and proposed change without a local setup. Read the rendered page and check its links. If you did not run a command or browser check, say so in the pull request.

### Find the right file

| File or area | Purpose |
| --- | --- |
| [aeries-playground.user.js](aeries-playground.user.js) | Installable source, userscript metadata, privacy explanation, calculations, Aeries adapter, controls, and storage. |
| `GradeMath` and `OverallMath` in that file | Grade modeling and dashboard summary/GPA calculations. |
| `GradeDOM` in that file | Reading the supported page layouts, matching embedded precision, and reconciling available gradebook data. |
| `MVHSSchedule`, `BellPlusSchedule`, and schedule request helpers | Public schedule parsing, clock checks, consent, and cancellation. |
| `persist`, `clearSavedSettings`, `kbar`, and `kbarShortcut` | Saved-state handling and optional playback controls. |
| [README.md](README.md) | Installation, brief overview, and routes into the guides. |
| [docs/FEATURES.md](docs/FEATURES.md) | User controls, release availability, limits, and troubleshooting. |
| [docs/CALCULATIONS.md](docs/CALCULATIONS.md) | Modeled formulas, invented examples, and calculation limits. |
| [SECURITY.md](SECURITY.md) | Privacy controls and security reporting; the source's opening comment gives implementation detail. |
| [scripts/check-userscripts.mjs](scripts/check-userscripts.mjs) and [tests/check-userscripts.test.mjs](tests/check-userscripts.test.mjs) | Static checker and tests of that checker. |
| [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE) and [.github/pull_request_template.md](.github/pull_request_template.md) | Reporting and review prompts. |
| [.github/workflows](.github/workflows) | Repository checks and the release-specific publisher. |

Keep the userscript metadata first. Preserve its filename, name, namespace, license, copyright, attribution, and third-party notices. Leave `@version` changes to coordinated release preparation; a documentation correction does not require a version bump. Follow the nearby code style and [.editorconfig](.editorconfig): UTF-8, LF line endings, spaces, and a final newline. [.gitattributes](.gitattributes) also normalizes text line endings. Avoid unrelated reformatting of the large source file.

### Try a local userscript change

Review the complete edited file, then replace the installed script's contents through your userscript manager's editor and save. Include the metadata header and keep only one Aeries Playground copy enabled. Reload the supported Aeries page after replacement. Installation and manager-specific instructions are in the [README](README.md#install).

Fresh Tampermonkey installs use manual updates because the source specifies `@downloadURL none`. Existing installations can retain earlier update preferences, and other managers may interpret the metadata differently. Check the installed script's update settings; do not assume a repository commit updates an installed copy. Review any later replacement before installing it.

Do not request credentials or real page exports for testing. Use synthetic inputs and fixtures. If you independently test in your own authorized Aeries session, keep its data local and report the browser, manager, steps, and outcome without the account contents. If you cannot test in a browser, record that limitation.

## Run the repository checks

From the repository root:

```sh
node --test tests/check-userscripts.test.mjs
node scripts/check-userscripts.mjs
git diff --check
```

| Check | What a passing result establishes |
| --- | --- |
| `node --test tests/check-userscripts.test.mjs` | The checker's own parsing, metadata, discovery, and command-line cases behave as expected. These are not tests of Playground's grade calculations or UI. |
| `node scripts/check-userscripts.mjs` | Discovered `.user.js` files compile as classic JavaScript and have a first-position metadata block with basic required fields and a URL rule. It does not execute them. |
| `git diff --check` | The patch has no detected whitespace errors or conflict markers. It does not validate prose or behavior. |

[Repository checks](.github/workflows/checks.yml) runs the first two commands on pushes, pull requests, and manual dispatch using Node.js 24. There is no committed browser integration suite, calculation regression suite, link checker, or issue-form validator in this workflow. A green run does not establish that a control works in Aeries, formulas model every teacher's rules, network requests are safe, or a release is ready. Do not use the checker's `--allow-empty` bootstrap option to validate this repository.

For documentation, also check rendered Markdown, relative paths, heading anchors, exact control labels, and whether a described feature exists in the stated source/release. For issue forms, validate YAML and compare against [GitHub's issue-form syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms) and [form schema](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema). The forms become available through the chooser when they reach the default branch; local parsing alone is not a check of GitHub's rendered UI. Keep direct form links aligned with filenames, and do not configure labels or assignees that have not been verified.

## Verify the behavior you change

Use the relevant checks below, rather than claiming coverage of unrelated features. Show the input, policy, expected result, observed result, and method used. A numerical calculation, a synthetic DOM fixture, a mocked network/player check, and a live browser interaction provide different evidence. Keep those distinctions in the pull request.

### Grades, planning, and precision

Check total-points and weighted-category cases affected by the change, including zero versus blank, exclusions, missing weights, four-point scales, configured score limits, and final rounding. Cover the applicable replacement rules, ranges, raw-mark conversion, and minimum-target increments. Preserve the blocking of missing-only, incomplete, or mismatched baselines; a plausible answer is not a substitute for reconciling visible data. Use the [calculation reference](docs/CALCULATIONS.md) for the actual model.

For fractional-score matching, use invented fixtures for a valid rounding-consistent match and for mismatched student/course/term/dates, duplicate records, malformed JSON, absent recent records, exclusions, and four-point gradebooks. A value such as `14.66666666666667 / 15` must survive editor initialization and an unchanged edit after validation against the displayed `14.67 / 15`. An intentional raw-mark edit must still use the documented conversion. The adapter reads matching data already on the page; it must not fetch hidden records or save the matching identities.

### Weight-map preview

Check both grading methods; graded zero, blank and explicitly excluded blank rows; unknown/zero possible points; missing or zero category weights; and categories containing only ungraded work. Determined positive shares should sum to 100% when positive-weight work exists, with all circle areas using one scale. Unknown weights remain explained in the list without a circle; missing scores never become zeros.

Verify the preview label, empty-course reconciliation, selection and **Show in gradebook**, return to current weights, and unchanged current grade, impact, and GPA calculations. **Show ungraded assignments** starts off, saves immediately, applies globally across courses and profiles/years, persists after a successful save/reload, and resets to off when settings are cleared.

### GPA and dashboard ratings

Check A/B/C/D/F with both scales, plus/minus handling, mixed Honors/AP selections, unchecked and excluded courses, duplicate identities, empty/non-A–F inputs, and F as a counted zero. Five included, selected A/B/C/D/F courses must produce unweighted **2.00** and weighted **2.60**; selected D/F receive no bonus. Numeric 4/3/2/1 mode must remain a separate threshold-based average.

Verify default-off Honors/AP selections, both editing locations, **Save course settings** versus immediate detail-panel saves, reload, manual profile/year isolation, and reset. Formula checks alone do not verify the controls.

### Schedules and saved settings

Preserve explicit schedule opt-in, including upgrades from a saved enabled widget without consent. Check disabled and master-paused states, current-tab cancellation and late responses, stale/invalid data, clock or schedule disagreement, and minutes-only fallback. Countdown changes need after-school, weekend/no-school, 14-day search limits, and Pacific daylight-saving cases.

Check ordinary last-write-wins saves separately from clear-settings reset-marker detection. Turning schedules off or pausing in one tab does not immediately change another tab: it can continue requests and save the old opt-in again. Users must reload other Aeries tabs promptly. Reset detection is not an atomic cross-tab transaction, and cancellation cannot undo a request already sent.

For settings changes, cover the appropriate save control, storage failure messages, reload, global versus profile/year scope, and clearing. Hypothetical scenarios stay temporary; grading policies, incomplete rule drafts, and replacement references can be saved. Disabling the script is different from deleting this configuration.

### KBAR playback

Check that no player exists before interaction. **P** must ignore editable controls, Ctrl/Alt/Command-modified shortcuts, and an open Playground dialog. Settings and manager-menu playback controls should work while Playground is enabled. Pause retains the embed; close, master pause, reset, and page exit remove it. Playback state must not be saved.

Verify exact source-window/origin checks on incoming messages and fixed player parameters without grade or account data. Cover loading failures, blocked playback, play/pause races, and teardown. The hidden player must add no page scroll space. **Settings → Open on YouTube** must stay visible, keyboard-accessible, user-activated, and available when Playground is paused or the embed is closed or never ready; it opens a separate tab with no referrer or opener access. Opening that link does not close an existing embed.

A mocked player does not prove that YouTube playback works in a browser. YouTube's internal message transport and browser playback policy can change. Do not silently change the player's placement or claim that privacy-enhanced embedding is anonymous.

## Keep documentation and releases aligned

Write repository prose in English. Keep the README focused on setup and the overview; put version-specific availability in the feature guide. Do not turn the README into a release history or add a CHANGELOG file. Keep upcoming, published prerelease, and stable features distinct, and use explicit tag/asset links for a particular release.

The current `main` source has metadata version **2.4.0**, the current published prerelease version; stable **Latest** remains **2.0.0**. Stable **3.0.0** is planned for the maintenance work starting **October 25, 2026 at 11:59 PM Pacific**, and must remain described as planned until it is actually published. A changed document, source comment, or license notice does not itself release a new userscript.

The [release workflow](.github/workflows/release.yml) is specific to the prepared 2.4.0 prerelease, including its version, source fingerprint, tag, and release flags. It is not a general publisher for the next version. On an automatic source-path push, a file whose size or hash differs from the frozen approved file causes a clean skip before any release writes; manual dispatch rejects that mismatch. The original file can still follow the guarded 2.4.0 recovery path. A future 3.0.0 publisher needs explicit preparation and review.

The workflow's time check does not schedule a run, and publication runs independently of the repository-checks workflow, with its own checks. Review trigger and guard behavior before editing it; a comment-only change still changes the userscript path. Documentation work must not create, move, replace, or republish tags or release assets, and must not weaken the publisher's checks just to make a documentation build pass.

Release preparation needs a fresh review of the exact merged source, the corresponding checks, the intended stable/prerelease state, and the tag/asset contents. Preserve fixes already on `main`, including the KBAR Settings fallback, instead of replacing the source with an older prepared file. Keep recorded hashes tied to the exact file they describe; comment and line-ending changes also change a hash. Do not present the old prerelease's fingerprint or verification as evidence for a future stable asset.

When permissions, storage, page access, external services, update behavior, or safeguards change, update the explanatory source comment and the affected guides together. Explain the change and remaining limits in the pull request.

## Submit a reviewable pull request

Describe the user-facing problem, the change, and the resulting behavior. Link a related issue if there is one. Include fictional reproduction steps or before/after examples when useful, list checks actually run and their results, and state what remains unverified. A documentation-only change should identify any source-comment or license-metadata edits separately from executable code.

Keep the change focused and retain the applicable notices. Do not include credentials, real account data, personal fixtures, or generated browser captures. Do not call static parsing, a formula example, or an AI review proof of zero risk or an independent audit.

## Contribution license

Contributions intended for inclusion must be offered under the [Aeries Playground Open Source License, Version 1.0](LICENSE). Only submit material you have the right and authority to license. You retain ownership of your contribution; submitting it does not assign your copyright. Preserve copyright, attribution, and separately applicable third-party notices.

The custom license permits commercial use, private modifications, and complete-source review by AI tools, scanners, and human reviewers, including paid services. Distributing covered modifications requires the same license and corresponding source access for recipients. Earlier copies retain the valid permissions already granted for those copies. Read the full license for its terms; it is not OSI-approved. The [licensing guide](docs/LICENSING.md) distinguishes the effective terms from any proposed revision.
