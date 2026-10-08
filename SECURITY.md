# Security and privacy

Read the opening comment in [aeries-playground.user.js](aeries-playground.user.js) for the full security and privacy explanation: page access, every requested permission and schedule endpoint, saved data, update behavior, safeguards, and remaining limitations. See the [README](README.md) for installation. This page summarizes the available controls and explains how to report a concern.

Unless explicitly marked upcoming, this page describes the current source on `main`. The [planned prerelease](docs/FEATURES.md#upcoming-prerelease) is documented separately below and has not been published by this documentation update.

## Privacy controls

| Area | Documented behavior and controls |
| --- | --- |
| Grade tools | Read the visible Aeries page and calculate locally. The script does not send grades or account details in its schedule requests, submit grade changes, or change account settings. Hypothetical scores are temporary. |
| Public schedules | **What class is next (MVHS)** starts off and requires an explicit opt-in in Settings. Turning it off stops refreshes, requests cancellation of pending transfers, and ignores late responses in the current tab. Pausing Playground also stops schedule work in that tab. Reload other Aeries tabs promptly; they can retain the old opt-in, continue requests, and save it again. |
| Connection metadata | Enabling schedules contacts public services, which receive ordinary connection information such as IP address and request timing. These requests are not anonymous browsing; the clock request also has an Aeries-related identifier. The source comment describes the exact requests and manager-dependent behavior. |
| Saved configuration | The userscript manager stores preferences, course information, and grading-rule references. Posted grades and hypothetical scores are not saved. Manager sync or backups may copy configuration elsewhere; manage those options in the manager. |
| Pause or clear | **Enable Playground** pauses enhancements while retaining settings. **Clear saved settings and pause** clears profiles, course customizations, and grading rules, resets preferences, and pauses Playground. Reload other Aeries tabs afterward. Separate sync and backup copies are controlled by the manager. |

For the controls and their effects, see the [feature guide](docs/FEATURES.md#settings-profiles-and-saved-data). To stop the script entirely, disable it in the userscript manager and reload Aeries.

### Upcoming on-page score matching

The prepared **2.3.0 prerelease** can use a more precise numeric score already embedded in the current Aeries page when it matches the displayed assignment. It temporarily reads school, student, and person identifiers, along with course/gradebook/term information and assignment details, to reject unrelated or ambiguous matches. Those matching identifiers and embedded score records remain in page memory; this feature does not write them to userscript storage or include them in external requests. Existing saved course identifiers and replacement-rule references remain as documented above.

Embedded data is parsed as JSON, not executed as page JavaScript. The feature does not read login cookies, request credentials, fetch hidden records, or add userscript permissions or network endpoints. Missing or inconsistent data retains the displayed score. These checks reduce mistaken matches but do not certify the accuracy of Aeries data or account for every page layout.

The matching checks do **not** switch settings profiles. Continue selecting a separate profile/year manually for each account or school year. Do not share copied Aeries page source or embedded data in a bug report; describe the problem using fictional examples.

The accompanying after-school countdown uses the existing public schedule and clock services under the existing opt-in. It adds no grades or identity fields to those requests. Current-tab cancellation and the need to reload other open tabs remain unchanged.

### Weighted GPA

The [GPA controls](docs/FEATURES.md#weighted-and-unweighted-gpa-together) save per-course **Honors/AP** selections alongside period mappings and GPA inclusion preferences, scoped to the manually selected settings profile/year. These checkboxes default to off. They are configuration: **posted grades, hypothetical scores, and calculated GPA results are not saved**. These selections do not add network requests or permissions; GPA calculations stay in the browser.

Selections can reveal course information and, like other preferences, may be copied by the userscript manager's sync or backups. Do not treat a configuration export as anonymized. **Clear saved settings and pause** also removes these selections from the script's active storage; separate backup copies remain manager-controlled.

### KBAR playback

The [KBAR feature](docs/FEATURES.md#kbar-music) is available in the **2.2.1 prerelease**. The earlier **2.1.0 prerelease** does not include it. The visible Settings fallback described below is a newer `main` change; the tagged prerelease asset does not contain that addition.

No YouTube embed is created until the user requests KBAR playback through **P**, a playback button, or the manager menu. Playback starts off on each page load, and no playback state is saved. KBAR is separate from schedule opt-in and adds no userscript grants.

The player uses a cross-origin `https://www.youtube-nocookie.com/embed/sasjlpt7zWM` iframe. Its URL contains the constant video ID, fixed player options, and the Aeries site origin. The iframe referrer policy sends the site origin rather than the full gradebook URL. Playground includes no grades, assignment data, course names, settings profiles, or Aeries account data in its player URL or command messages. Commands are sent to the exact YouTube origin; received messages are checked against that origin and the current iframe window.

The iframe loads YouTube's own third-party code, media, and advertising resources. Privacy-enhanced embedding does not make it anonymous or ad-free: YouTube receives connection information and playback activity and may use cookies or other browser storage. Iframe/media requests are browser requests, not `GM_xmlhttpRequest` calls, and are not restricted by the userscript's schedule-only `@connect` list. There is no claim that the whole page makes no third-party requests. See [YouTube's terms](https://www.youtube.com/t/terms) and [Google's privacy policy](https://policies.google.com/privacy).

**P pauses/resumes; Close stops and unloads.** Pausing leaves the embed loaded and can leave third-party network activity running. **Settings → Close KBAR player** removes the player without scrolling to it. Pausing Playground, clearing settings, or leaving the page also removes it in that tab. Closing cannot undo requests already made or delete YouTube-managed storage. No playback state is shared between tabs; close other tabs' players separately.

The player is hidden outside the visible layout, is inert and excluded from accessibility navigation, and adds no page scroll space. It uses YouTube's internal message transport for controls; that transport can change. The current `main` source also provides **Settings → Open on YouTube**, a visible, keyboard-accessible fallback even when playback is blocked or the embed never becomes ready. Opening it is a user-initiated normal YouTube visit in a new tab, with no referrer or opener access; it neither starts nor closes the hidden embed. Close the embed separately to avoid simultaneous playback.

### Changes in other open tabs

Ordinary settings saves use the last written settings and are not synchronized live. Turning schedules off or pausing Playground in one tab does not immediately update other open tabs: their old state can keep making schedule requests, and a later save can restore their old opt-in. Reload other Aeries tabs promptly. **Clear saved settings and pause** has a separate stale-save check when a tab detects the reset, but that is not immediate revocation in every running tab. A request already sent cannot be recalled from its recipient.

## Review the installed file

Use the official repository's source and review the complete file you intend to install. The [license](LICENSE) permits submitting the complete source for AI or human review. Share the script alone; reviewing it does not require anyone's Aeries password, login session, live account access, or real gradebook data.

The script requests manual updates for fresh Tampermonkey installations. Existing installations may retain their previous update settings, and other managers can behave differently; check the script's update settings in your manager. Review a replacement file before installing it. Findings about one file do not automatically apply to a different copy.

The README's raw-`main` installation link follows the source on `main`; the stable **Latest** release, the current KBAR prerelease, and the earlier weighted-GPA prerelease have separate tagged downloads. Check the release label and installed file's metadata version. Neither a stable nor a prerelease label is a security certification. See the feature guide for the exact release and asset addresses.

Reading grades and changing their display are necessary for these features. Display or calculation bugs, page changes, inaccurate public schedules, and manager behavior remain possible. A static review or successful check is not a certification or a guarantee of zero risk. The [calculation reference](docs/CALCULATIONS.md) explains when estimates are available and what they mean.

## Report a vulnerability privately

If **Report a vulnerability** is available on this repository's [Security tab](https://github.com/sodium-qed/aeries-playground/security), use that private channel. If it is unavailable, open an issue asking for a private reporting channel, without describing the vulnerability or including personal information. This document does not enable private reporting or promise a response time.

Once a private channel is established, include:

- The installed script's source and metadata version, plus browser and userscript manager.
- The affected feature and settings, especially whether public schedules were enabled, whether other Aeries tabs were open, and whether the KBAR player had been started or closed.
- Reproduction steps using fictional courses, assignments, and scores.
- What you expected, what happened, and the suspected impact.

Do not include passwords, cookies, session tokens, account identifiers, copied Aeries page source, storage exports, or real student records. Do not post an exploitable issue publicly while arranging private contact.

## Ordinary bugs and suggestions

For display problems, calculation discrepancies, or feature requests without sensitive security details, use the [issue forms](https://github.com/sodium-qed/aeries-playground/issues/new/choose) and follow [Contributing](CONTRIBUTING.md). Give fictional examples rather than access to an Aeries account.

