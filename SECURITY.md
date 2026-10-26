# Security and privacy

Aeries Playground reads the Aeries page available to the signed-in user and changes its local display. Grade calculations run in the browser; this source does not submit grades or account-setting changes to Aeries. Public schedules and KBAR playback are optional external connections. Saved configuration can reveal school, course, and assignment information even though current features do not save posted or hypothetical score values.

This policy describes the **3.0.0 release candidate source** in [aeries-playground.user.js](aeries-playground.user.js). Publication of stable **3.0.0** has not yet been verified. Older tagged files can behave differently. Use the [feature guide](docs/FEATURES.md) to choose a published download, and review the actual file you install. A version label, static check, or AI review is not a security certification.

**Found a possible vulnerability?** Use [private reporting](#report-a-vulnerability-privately). For controls, start below; for the data retained after a visit, see [saved configuration](#saved-data-and-settings-profiles).

## Controls you can use now

Open **Settings** with **S** outside editable controls, or use the userscript manager's **Aeries Playground — open settings (S)** command. Feature toggles apply and attempt to save immediately; they do not wait for **Save settings**.

| Goal | Control and effect |
| --- | --- |
| Use grade tools without the optional integrations | Leave **What class is next (MVHS)** off and do not start KBAR. Grade tools do not require either service. Aeries, the browser, and the userscript manager can still make their own requests. |
| Stop public schedule access | Turn off **What class is next (MVHS)**. The current tab revokes its schedule consent, stops refreshes, requests cancellation, discards late responses, and clears its in-memory schedule/clock cache. |
| Stop KBAR | Use **Settings → Close KBAR player**. This removes the iframe. **P** and the play/pause button only request a playback change; pausing leaves the iframe loaded. |
| Pause page enhancements | Turn off **Enable Playground**. The current tab closes the grade-testing lab, removes the KBAR player, and stops schedule work. Saved settings, including any schedule opt-in, remain; re-enabling Playground can resume schedule requests. |
| Clear active configuration | Use **Settings → Clear saved settings and pause**, confirm, and check for the success message. It replaces profiles, course customizations, grading-rule drafts, replacement rules, and preferences with paused defaults and a reset marker. It does not uninstall the script. |
| Stop the installed script entirely | Disable or remove it in the userscript manager, then reload every open Aeries tab. Disabling alone does not erase saved settings. |

**Reload or close other open Aeries tabs after changing schedule consent, pausing, or clearing settings.** Each tab has its own state. If saving fails, a toggle can change this visit while the previously stored choice returns on reload. Check the storage status in Settings; save errors appear there immediately. Disabling the script in the manager and reloading all Aeries tabs does not depend on a successful in-app save. See [Changes in other open tabs](#changes-in-other-open-tabs).

## Page access and permissions

The metadata matches `https://mvla.aeries.net/student/*`, uses `@run-at document-idle`, and requests `@noframes`. A runtime check also verifies the hostname and `/student/` path. This source does not request a password, read login cookies, fetch additional Aeries records, or contain an Aeries form-submission/API-write path. It does read the page available to the signed-in user, including selected hidden identity fields and matching embedded scores described below.

| Requested grant | Use in this source |
| --- | --- |
| `GM_getValue` | Read the script's saved configuration and check its reset marker before saving. |
| `GM_setValue` | Save preferences, course configuration, and grading policies in userscript-manager storage. |
| `GM_registerMenuCommand` | Register the Settings shortcut and KBAR play/pause command. |
| `GM_xmlhttpRequest` | Read public MVHS schedules and request a public clock check after schedule opt-in. |

The two `@connect` entries name `mvhs-app-d04d2.firebaseio.com` and `bell.plus`; there is no wildcard entry in this file. These are domain permissions, broader than the [five exact endpoints](#optional-public-schedules) selected by the request helper. [Tampermonkey documents that domain entries also permit subdomains](https://www.tampermonkey.net/documentation.php?locale=en&q=connect), and manager settings can add permissions. The grant remains available while schedules are off: consent is enforced by this file's code. Browser iframe/media requests are outside this `GM_xmlhttpRequest` list.

There are no `@require` dependencies, downloaded scripts evaluated in the gradebook, or Playground analytics endpoints in this source. The optional YouTube iframe does load third-party code in its own cross-origin document.

### Safeguards around the Aeries page

- Playground's input, select, textarea, and button elements receive a `form` attribute pointing to a deliberately unbound form ID. Its buttons use `type="button"`. Inline lab controls stop relevant events from bubbling into Aeries and prevent Enter from submitting a form.
- Course names, assignment labels, error messages, and public schedule text are rendered with text nodes, `textContent`, or ordinary attributes, not interpolated into HTML. Embedded score data and network responses are parsed as JSON rather than executed.
- Grade testing uses separate working values and restores original Aeries nodes when you exit grade testing. Recognized gradebook, filter, or settings-scope changes reset the scenario; calculations check the available baseline before presenting supported estimates.

These controls reduce accidental submissions and data-to-code injection. They do not isolate displayed information from the Aeries page or other extensions. Open shadow roots provide layout separation, not privacy. Aeries changes, other scripts, or a modified Playground file can invalidate the assumptions described here. See the [calculation reference](docs/CALCULATIONS.md) for the limits of grade estimates.

## Saved data and settings profiles

Configuration is stored under the userscript-manager key `aeries-playground-v1`. There is no project account or project-operated storage service in this source.

| Data | Handling |
| --- | --- |
| Posted scores, raw marks, displayed grade values, calculated GPA/grade results, hypothetical score edits and ranges | Used as working data in page memory; current features do not add these values to saved configuration. |
| Temporary hypothetical assignments | Kept in the current scenario. A saved replacement rule can retain an assignment's **name, ID, and category**, including a hypothetical assignment's references; its entered score is not part of that saved rule. |
| Settings | Saves feature toggles, schedule consent, display precision, colors, default thresholds, and the manually selected profile/year labels. |
| Course configuration | Saves discovered course names and keys, nicknames, icons, period overrides, grade-display scales and thresholds, GPA inclusion, and Honors/AP selections. Course keys can contain gradebook, term, school, section, or year information, or a title/period fallback. |
| Grading policies | Saves calculation mode, category names and weights, scale, rounding, score limits, replacement policy/caps, and the referenced assignments' names, IDs, and categories. Incomplete grading-profile form values are saved as drafts. |
| Public schedules and clock results | Cached in memory for the current tab, with the freshness checks described below. |
| KBAR playback state | Starts off on each page load and is not saved by Playground. YouTube's own storage is separate. |

Course discovery can save names and keys automatically when you open a recognized dashboard or gradebook; saving is not limited to clicking **Save course settings**. Grading-profile fields save on edit, including incomplete drafts. Valid profiles replace the active rules; an invalid draft can leave the last valid rules active. Adding/removing replacement rules saves their references. Page exit flushes a pending save; an idle tab does not unconditionally rewrite its old copy on exit. An upgrade does not erase fields left by an older or modified file.

Unreadable or unsupported saved configuration uses defaults for the visit and blocks ordinary saves, so those defaults do not automatically replace the stored configuration. Resolve the storage problem and reload with a compatible script, or explicitly choose **Clear saved settings and pause** to replace it if clearing succeeds. Malformed saved grading policies, replacement rules, or drafts are ignored with a recovery warning; review those settings before using them. Unrelated older or imported fields can remain in storage.

**Profiles organize settings; they do not create private accounts or detect the signed-in student.** Changing the selected profile while Playground is enabled can immediately save the current page's courses under the new label. When switching students or years:

1. Close other Aeries tabs. In the remaining tab, turn off **Enable Playground** and check the visible storage status in Settings for errors.
2. Switch to the intended student/account or year while Playground is paused.
3. Open **Settings → Separate course settings**, choose **Settings profile** and **School-year starting year**, then click **Save settings** and check for success.
4. Re-enable Playground on that student's page.

Per-course settings and rules use this selected scope. Display toggles, colors, default thresholds, schedule consent, and **Show ungraded assignments** remain global. The on-page identifiers used for score matching do not select a profile. Anyone who can use the same manager storage can select another saved profile.

Saved settings are **not anonymized or encrypted by Playground**. Names, identifiers, assignment references, and anything typed into a saved field can identify someone. Do not share a settings export as generic preferences. The manager controls storage, sync, and backups; review those settings if you want configuration kept on one device. In-app clearing cannot remove its backups or synchronized copies elsewhere. Working values in an open or browser-restored page are not securely erased merely because they were never saved as configuration.

### Weighted GPA

Honors/AP selections default to off and save per course/profile/year, alongside GPA inclusion and period mappings. They reveal course choices, but this calculation adds no network request and saves no posted marks or GPA results. A successful clear-settings action removes the selections from active configuration.

### Weight-map preference

**Show ungraded assignments** defaults to off and saves one global Boolean shared across courses and profiles/years. It adds no network request and saves no assignment list, scores, weights, or preview results. Successful clearing resets it to off; other tabs need reloading. The preview does not turn missing scores into counted zeros or change an official grade.

### On-page score matching

Aeries can embed more precise numeric scores than its table displays. For eligible percentage gradebooks, Playground reads one bounded JSON `RecentData` initializer already present in the page and accepts a score only after checking the current school, student, and person identifiers; the selected course, gradebook, and term; and the assignment's number, name, category, dates, possible points, and displayed score/percentage consistency. Duplicate, missing, ambiguous, malformed, or inconsistent records retain the displayed score. Four-point gradebooks do not use this adapter.

School/student/person identity values and the embedded record collection are used in memory for matching. The adapter adds neither to configuration or external requests. Saved course keys can independently contain school/course identifiers. This reads data already in the page; it does not fetch additional records, authenticate the data, guarantee a match for every Aeries layout, or switch settings profiles.

Copied HTML or page source can contain identifiers and records that are absent from a screenshot. Reproduce problems with invented page fixtures; do not share a real page export.

## Optional public schedules

**What class is next (MVHS)** and its separate consent flag default to off. An older saved widget setting without the consent flag is forced off until enabled through Settings. Enabling this feature permits both the primary schedules and the bell.plus schedule/clock cross-check; there is no separate seconds opt-in. New work starts with Playground enabled on a visible dashboard course section. Hidden documents defer refreshes; hiding a tab or navigating within the page does not guarantee cancellation of transfers already in progress.

`requestScheduleJSON` accepts only named request kinds mapped to these constants. Callers cannot provide an arbitrary URL or request body.

| Method | Exact endpoint | Purpose/payload |
| --- | --- | --- |
| GET | `https://mvhs-app-d04d2.firebaseio.com/days.json` | Public calendar overrides used by mvhs.io. |
| GET | `https://mvhs-app-d04d2.firebaseio.com/weekday-map.json` | Public weekday-to-schedule mapping. |
| GET | `https://mvhs-app-d04d2.firebaseio.com/schedules.json` | Public bell times. |
| GET | `https://bell.plus/api/data/mvhs` | Public MVHS schedule cross-check. |
| POST | `https://bell.plus/timesync` | JSON-RPC body with `jsonrpc: "2.0"`, `method: "timesync"`, and `id: "aeries-clock-"` followed by the current millisecond timestamp. |

The POST is a public clock check, not an Aeries update. These payloads include no grades, assignment data, course names, profile labels, or Aeries account identifiers. Period-to-course matching happens locally. The after-school countdown uses the same services and consent, with no additional student-data transfer.

Requests set `Accept: application/json`, ask for cookie omission with `anonymous: true`, and specify a public-service `Referer`: `https://mvhs.io/` or `https://bell.plus/mvhs`. The clock request additionally sets `Content-Type: application/json`. **“Anonymous” does not hide your IP address, request timing, browser/network metadata, or use of an MVHS service.** The clock ID also identifies the request as Aeries-related. Cookie omission, header handling, and cancellation depend on the manager and browser.

### Request validation and its limits

- The code requests a **15-second** timeout for Firebase and **10 seconds** for bell.plus, and starts an independent local timer. If a request stalls, that timer rejects it and asks the manager to abort the transfer; late callbacks cannot revive it. Background tabs or a suspended browser can delay the timer. [Tampermonkey's documentation](https://www.tampermonkey.net/documentation.php?locale=en&q=GM_xmlhttpRequest) says anonymous requests use fetch mode and warns that its built-in timeout does not work in Chrome. The local timer does not guarantee that a manager stops transferring data.
- Requests ask the manager to reject redirects. A completed response must also have HTTP status 200, a string body no longer than **200,000 JavaScript characters**, valid JSON, and a `finalUrl` exactly equal to the requested endpoint. The size check happens after receipt; it is not a transfer-size limit. A manager that ignores the redirect option may follow a redirect before the final-URL check rejects the response.
- Parsers check calendar ranges, names, periods, clock values, and schedule consistency. Remote content is treated as data. These checks reject unsupported structures, but they cannot establish that a public service's schedule is correct or current.
- Cached responses must have been fetched for the same Pacific calendar date and be less than five minutes old in this tab. This measures local cache age, not the publisher's update time. New requests do not run every countdown second; failures normally wait a minute before retrying, unless retried manually.
- Seconds require a matching clock-response ID, a round trip of at most two seconds, clock-stability checks, limited offsets, and agreement with the primary schedule. A future-day countdown also checks that future schedule. Otherwise the display falls back to minutes. The clock check does not change the device clock.

Turning the schedule setting off, pausing Playground, clearing settings successfully, or leaving the page invalidates current requests and asks the manager to abort them. Late responses are ignored even if aborting the transfer fails. Requests already received by a service cannot be recalled. Clicking a schedule source link makes a normal visit to that service, separately from these requests.

## KBAR playback

KBAR is independent of schedule consent. Playground must be enabled, but no additional userscript grant is required. **P** outside editable controls with Settings closed, the **Settings → Play / Pause / Retry KBAR (P)** control, or the manager's KBAR command creates the player on first use and requests playback. The Settings label changes with the requested playback state. No player is created during ordinary startup, and playback state is not shared across tabs or saved for the next load.

The player is a cross-origin iframe at `https://www.youtube-nocookie.com/embed/sasjlpt7zWM`. Playground supplies the constant video ID, fixed looping/player options, and `https://mvla.aeries.net` as the client origin. Its `strict-origin-when-cross-origin` referrer policy permits the site origin rather than the full gradebook path/query. Playground places no grades, assignment data, course names, profiles, or student identifiers in that URL or its command messages.

Outgoing messages target the exact `https://www.youtube-nocookie.com` origin. Incoming messages must come from that origin **and the current iframe window**, be a bounded JSON string, and match the recognized message handling. The iframe permits autoplay, encrypted media, fullscreen, and picture-in-picture; it has no `sandbox` attribute. Browser cross-origin protections apply, while YouTube controls its own document and resources. The message transport is an internal player interface and can change.

**Privacy-enhanced embedding is not anonymous or ad-free playback.** YouTube receives connection and playback information and may use cookies or other browser storage. Its iframe loads code, media, and potentially advertising through ordinary browser requests, outside the schedule `@connect` list. [YouTube describes privacy-enhanced mode as limiting personalization](https://support.google.com/youtube/answer/171780?hl=en), not eliminating those connections. [YouTube's terms](https://www.youtube.com/t/terms) and [Google's privacy policy](https://policies.google.com/privacy) apply to that service.

The iframe is offscreen, inert, and excluded from accessibility navigation, with no added page scroll space. Settings provides a visible, keyboard-accessible playback control and live status for loading, playback, pause, blocked playback, errors, and stopping. The status reflects provider messages and local request state; it does not prove that audio is audible. YouTube's native controls remain hidden. Use **Settings → Open on YouTube** when playback is blocked, the player never becomes ready, or you want the normal YouTube interface. That link opens a new tab with `noopener`, `noreferrer`, and `no-referrer`; the destination is an ordinary YouTube visit under its own settings and policies. It neither starts nor closes the hidden embed, so close an existing player separately to avoid simultaneous playback.

**Pause keeps the embed loaded; Close unloads it.** A paused or failed player can still make third-party requests until removed. **Settings → Close KBAR player**, pausing Playground, a successful clear-settings action, and page exit remove the iframe in that tab. Closing does not undo previous requests or delete YouTube-managed storage. Close players in other tabs separately.

## Changes in other open tabs

Ordinary settings changes are not synchronized live. Each tab holds its own copy, and a save writes that copy: concurrent edits are last-write-wins. Another tab can continue schedule requests after you turn the setting off elsewhere and can save its old opt-in again. Pausing in one tab also does not close another tab's player.

Clearing settings adds a reset marker. Before saving, this source rereads storage and refuses a stale save when that marker differs from the one the tab observed. It reports **“Saved settings were cleared in another tab. Reload this tab before saving.”** This reduces restoration of cleared settings, but is not immediate cross-tab revocation or an atomic transaction. Older code without the check can still rewrite its copy. If clearing fails, the previous configuration remains active in that tab; heed the storage error.

After a successful clear, close or reload other Aeries tabs promptly. To remove the stored object through the manager instead, close all Aeries tabs first, then erase this script's stored values using the manager's controls. Disabling or uninstalling is not proof that the manager removed them. In-app clearing retains paused defaults, schema/migration flags, and the reset marker. Neither route erases separate sync, backup, browser, or third-party copies.

## Review the installed file

Use the [official repository](https://github.com/sodium-qed/aeries-playground) and the [installation instructions](README.md). Choose the intended stable or prerelease asset; the raw `main` link moves with source changes. Keep one copy enabled. Before installing or replacing it, review the complete file, its `@version`, match rules, grants, connection hosts, and update metadata. A reviewed filename or version label alone does not establish that another copy has identical contents.

`@downloadURL none` requests manual updating; [Tampermonkey documents that value as disabling update checks](https://www.tampermonkey.net/documentation.php?locale=en&q=update_url). This metadata describes the requested behavior, not an inspection of your installed manager settings. Existing preferences can persist and other managers can differ. Check the installed script's update settings and review each replacement file. The source contains no self-updater. Installation, updates, and repository visits can independently contact the source host.

The [license](LICENSE) explicitly permits giving the complete source to AI tools, automated scanners, and human security reviewers, including paid services, without advance permission. Preserve its notices. Share **the script alone**: review does not require an Aeries password, session, account access, real grades, page export, or settings export. Permission to review the code does not grant rights in anyone's private records.

Useful review entry points are `GradeDOM`, `parseRecentData`, `readEmbeddedScores`, `restoreEmbeddedPrecision`, `el`, `labContain`, `persist`, `clearSavedSettings`, `serializePlanningRules`, `saveProfile`, `scheduleRequestsAllowed`, `requestScheduleJSON`, `abortScheduleRequests`, `requestBellPlusClock`, `verifiedBellSeconds`, `kbar`, and `kbarShortcut`.

The [userscript checker](scripts/check-userscripts.mjs) compiles classic JavaScript without executing it and checks basic metadata. The [documentation checker](scripts/check-documentation.mjs) checks supported local Markdown links and anchors. The [security regression tests](tests/audit-security.test.mjs) execute the actual request and local-control helpers with invented data, fake timers, and a fake userscript manager. They cover consent, fixed requests, response and clock validation, timeout and cancellation cleanup, queued cache updates, and local form controls without making network requests. These checks do not establish live Aeries behavior, actual manager storage/cookie handling or transfer cancellation, or YouTube playback. Source review and synthetic tests are useful evidence, but are not an independent audit or a guarantee of zero risk.

## Report a vulnerability privately

1. Open this repository's [Security page](https://github.com/sodium-qed/aeries-playground/security) and look for **Report a vulnerability**. Use it if available.
2. If that private option is unavailable, [ask for a private reporting channel in an issue](https://github.com/sodium-qed/aeries-playground/issues/new) **without describing the vulnerability or including personal information**. A suitable public message is: “How can I contact the maintainer privately about a security concern?”
3. Wait for a private channel before sending the report. An issue, pull request, or ordinary repository comment is public.

[GitHub's reporting feature is separate from this policy](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately). Its availability for this repository is not established here. This document does not enable it, identify a verified private email address, or promise a response time.

Once a private channel is established, include:

- The exact installed source/version and its origin, plus browser and userscript-manager versions.
- The affected feature and settings, including schedule consent, other open Aeries tabs, and whether KBAR was started, paused, or closed.
- Minimal reproduction steps with fictional courses, assignments, scores, and generic profile labels.
- Expected versus observed behavior and the suspected impact; identify whether the evidence comes from source review, a synthetic fixture, or a live environment.

Do not include passwords, cookies, session tokens, account identifiers, copied Aeries source/DOM, storage exports, identifiable screenshots, or real student records. Browser exports can contain information absent from the visible page. Do not publish exploit details while arranging private contact. Repository ignore rules do not sanitize attachments, remove tracked files, or erase history.

If account data has been exposed, avoid quoting or reposting it. Contact the affected owner and maintainer privately. Reset exposed credentials and revoke sessions through their provider as appropriate; deleting a file alone cannot remove every cached/history copy or restore account security.

## Ordinary bugs and suggestions

For display problems, calculation discrepancies, and feature requests without sensitive security details, use the [issue forms](https://github.com/sodium-qed/aeries-playground/issues/new/choose) and follow [Contributing](CONTRIBUTING.md). Invent a small example that demonstrates the problem. No contributor or reviewer needs access to a student's live account.

