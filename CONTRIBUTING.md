# Contributing to Aeries Playground

> **Release policy correction:** The November 1 **3.1.0** integration and November 8 **3.1.1** bonus-band update are scheduled **prereleases**, each at **11:59 p.m. PST in 2026**. **v3.0.0 remains stable and Latest.** The [release schedule](docs/RELEASE-SCHEDULE.md) supersedes earlier stable-promotion wording in preparation notes.

A useful contribution can be one sentence: an idea, an unclear instruction, or something that did not work. You do not need to write code or know the cause. A GitHub account is enough to submit an issue or pull request; no other account or service is required.

If the [README](README.md) carries a temporary maintenance notice, follow it before making commits. Suggestions and bug reports remain welcome during a pause; scheduled maintenance is exempt.

Developer and public editions are currently being prepared for a unified 3.1.0 release. Coordinate changes affecting that integration through [issue #8](https://github.com/sodium-qed/aeries-playground/issues/8) and the [merge plan](docs/MERGE-PLAN.md). Continue using focused pull requests; keep the scheduled integration candidate unmerged until its announced time and retain public audit fixes when resolving conflicts.

## Choose a starting point

| I want to… | Start here |
| --- | --- |
| Suggest an improvement | [Make a suggestion](https://github.com/sodium-qed/aeries-playground/issues/new?template=feature_request.yml) |
| Report a problem | [Report a bug](https://github.com/sodium-qed/aeries-playground/issues/new?template=bug_report.yml) |
| Install the script or understand a control | [Installation](README.md#install), [feature guide](docs/FEATURES.md), and [troubleshooting](docs/FEATURES.md#troubleshooting) |
| Report a possible vulnerability or data leak | Follow [SECURITY.md](SECURITY.md#report-a-vulnerability-privately) before sharing details |
| Improve the documentation or code | Follow [your first change](#your-first-change) |

If a direct form link fails, open [Issues → New issue](https://github.com/sodium-qed/aeries-playground/issues/new/choose). You can search [existing issues](https://github.com/sodium-qed/aeries-playground/issues) and add an example to a matching report, but you do not need to prove that your issue is new before asking for help.

## Make a suggestion

The [suggestion form](https://github.com/sodium-qed/aeries-playground/issues/new?template=feature_request.yml) has one required question: **What would you like to do?** Describe the improvement and when it would help. A sentence or two is enough; an invented example or sketch is optional.

Give the issue a descriptive title, such as “Make the weight preview explanation easier to find.” Spell out abbreviations, and give unrelated ideas separate issues. You do not need research, an implementation plan, or code. A suggestion records a need; it does not promise a feature or release date.

## Report a bug

The [bug form](https://github.com/sodium-qed/aeries-playground/issues/new?template=bug_report.yml) requires only **What happened?** Name the page or control, describe what you saw, and say what you expected if you know. Add the clicks that led to the problem when you can. A problem that happened once is still worth reporting.

Browser, userscript manager, script version, and a small invented example help, but those fields are optional. You do not need developer tools, page source, or access to anyone else's Aeries account. You can submit a report without clearing settings or trying to diagnose it yourself.

### Find the installed version

In your userscript manager's dashboard, open **Aeries Playground** and read the `@version` line near the top of its editor. Do not edit it to file a report. If known, include the release tag or source commit and whether you installed from a release or the README's `main` link. Say whether it was a fresh install or manual replacement. “I don't know” is fine.

`main` can change between releases, and different files can carry the same version number. A version label alone does not identify the exact file. See [release-specific downloads](docs/FEATURES.md#available-release).

### Use a small invented example

For a calculation problem, include just enough fictional work and grading rules to explain it. Keep a blank score, a numeric zero, and an explicitly excluded assignment distinct. Write your expected calculation separately from the result Playground displayed.

For example, use this **fictional total-points course**, with no score limits or replacement rules:

| Assignment | Earned / possible | Status |
| --- | --- | --- |
| Practice A | 8 / 10 | Graded and included |
| Quiz B | 0 / 10 | Graded and included |
| Project C | blank / 20 | Ungraded |

The current grade is `(8 + 0) / (10 + 10) × 100 = 40%`. The blank score is not a zero. With **Show ungraded assignments** off, A and B each have 50% of the current weight map. Turning it on gives preview shares of 25%, 25%, and 50%; the current grade stays 40%. Add what you actually saw and how you reached it. Do not replace these invented rows with real grades.

### Extra details that may help

Include these only when relevant and known:

| Problem | Useful details |
| --- | --- |
| Grade calculation | Total points or category weights; fictional scores and possible points; exclusions, rounding, and other rules; posted baseline versus a hypothetical edit; whether Aeries' missing-only filter was on. |
| GPA or 4/3/2/1 summary | Display mode, fictional posted letters, included courses, Honors/AP selections, and expected versus displayed average. |
| Weight map | **Show ungraded assignments** on/off; blank, zero, or excluded rows; known or missing possible points and category weights. |
| Next class | Displayed school date, approximate time and time zone, expected period number, and whether **What class is next (MVHS)** was enabled. Omit class names. |
| KBAR music | **P**, Settings, or manager-menu control; whether a text field or Playground dialog had focus; pause versus close; whether **Settings → Open on YouTube** worked. |
| Saved settings | Generic profile/year labels, the relevant Save button or toggle, whether a reload changed the result, and whether another Aeries tab was open. Do not export settings. |
| Installation | Browser and manager, release or `main`, fresh install or replacement, and whether more than one copy was enabled. |

For a display problem, an optional comparison is to disable the script in the manager and reload; this keeps its saved configuration. **Clear saved settings and pause** deletes configuration and is not a routine debugging step.

## Keep account data out of contributions

Issues, pull requests, commits, and attachments are public. Use generic courses and examples created from scratch. A few typed rows or a hand-drawn screen is often enough.

Do not share real grades, student or account identifiers, passwords, cookies, session tokens, logged-in URLs, copied Aeries pages or DOM, browser profiles, network captures, or saved-settings exports. Configuration can contain course names, identifiers, and assignment references even though posted grades and hypothetical scores are not saved. Do not offer or request account access for reproduction.

Screenshots are optional. Remove identifying information, real grades, class and assignment details, browser account details, and private URL parameters before sharing one. If you cannot confidently remove them, use a written example instead. Review every attachment and staged diff; [.gitignore](.gitignore) cannot sanitize uploads or remove data already committed.

For a possible vulnerability or unintended disclosure, follow the [private-reporting instructions](SECURITY.md#report-a-vulnerability-privately). If **Report a vulnerability** is available on the repository's Security tab, use it. Otherwise, open a blank issue asking only for a private reporting channel, without vulnerability details, exploits, or personal information. The policy does not enable private reporting or promise a response time.

## Your first change

Choose one focused improvement, following any active maintenance notice. A small wording correction needs no issue first. For a larger change, start an issue explaining the user need so the scope can be discussed.

For a small documentation edit, you can work entirely on GitHub:

1. Open the file on GitHub and select its edit control. Follow GitHub's prompts to create a fork or branch if needed.
2. Make the correction and preview the rendered Markdown. Open the links you changed and check any control names against the [feature guide](docs/FEATURES.md).
3. Propose the change in a pull request against this repository's `main` branch. Explain the problem, the correction, and what you checked. Say which local commands or browser checks you did not run.

For code or several files, use the [developer guide](docs/DEVELOPMENT.md). It covers cloning a fork, Node.js 24, the source map, repository checks, and verification for each feature. There is no package installation or build step.

Before submitting either kind of change, read the complete diff, remove unrelated edits, and confirm it contains only material you intend to make public. Fill out the [pull request template](.github/pull_request_template.md) with actual results and remaining limits. Identify source-comment and license-notice edits separately from changes to executable code. A documentation correction does not need an `@version` bump or a new release.

## Contribution license

Offer only material you have authority to license under the repository's [Aeries Playground Open Source License, Version 1.0](LICENSE). You retain your copyright; contributing does not transfer it or authorize unspecified future license revisions. Preserve applicable copyright, attribution, and separate third-party notices. See [contributing and copyright](docs/LICENSING.md#contributing-and-copyright).

The license permits complete-source review by AI tools, scanners, and human reviewers, including paid services. Share the script alone; review needs no account data or copied Aeries pages. Read [review the complete source](docs/LICENSING.md#review-the-complete-source) for the permission and its limits. An AI review is not an independent security audit.
