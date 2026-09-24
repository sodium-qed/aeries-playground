# Security and privacy

Read the opening comment in [aeries-playground.user.js](aeries-playground.user.js) for the full security and privacy explanation: page access, every requested permission and schedule endpoint, saved data, update behavior, safeguards, and remaining limitations. See the [README](README.md) for installation. This page summarizes the available controls and explains how to report a concern.

## Privacy controls

| Area | Documented behavior and controls |
| --- | --- |
| Grade tools | Read the visible Aeries page and calculate locally. The script does not send grades or account details in its schedule requests, submit grade changes, or change account settings. Hypothetical scores are temporary. |
| Public schedules | **What class is next (MVHS)** starts off and requires an explicit opt-in in Settings. Turning it off stops refreshes, requests cancellation of pending transfers, and ignores late responses. Pausing Playground also stops schedule work. |
| Connection metadata | Enabling schedules contacts public services, which receive ordinary connection information such as IP address and request timing. These requests are not anonymous browsing; the clock request also has an Aeries-related identifier. The source comment describes the exact requests and manager-dependent behavior. |
| Saved configuration | The userscript manager stores preferences, course information, and grading-rule references. Posted grades and hypothetical scores are not saved. Manager sync or backups may copy configuration elsewhere; manage those options in the manager. |
| Pause or clear | **Enable Playground** pauses enhancements while retaining settings. **Clear saved settings and pause** clears profiles, course customizations, and grading rules, resets preferences, and pauses Playground. Reload other Aeries tabs afterward. Separate sync and backup copies are controlled by the manager. |

For the controls and their effects, see the [feature guide](docs/FEATURES.md#settings-profiles-and-saved-data). To stop the script entirely, disable it in the userscript manager and reload Aeries.

### Upcoming weighted-GPA prerelease

The [upcoming prerelease](docs/FEATURES.md#upcoming-weighted-gpa-prerelease) adds saved per-course **Honors/AP** selections alongside period mappings and GPA inclusion preferences, scoped to the manually selected settings profile/year. These checkboxes default to off. They are configuration: **posted grades, hypothetical scores, and calculated GPA results are not saved**. The new selections do not add network requests or permissions; GPA calculations stay in the browser.

Selections can reveal course information and, like other preferences, may be copied by the userscript manager's sync or backups. Do not treat a configuration export as anonymized. **Clear saved settings and pause** also removes these selections from the script's active storage; separate backup copies remain manager-controlled. This describes the approved prerelease, not a change already present in the currently installable source.

## Review the installed file

Use the official repository's source and review the complete file you intend to install. The [license](LICENSE) permits submitting the complete source for AI or human review. Share the script alone; reviewing it does not require anyone's Aeries password, login session, live account access, or real gradebook data.

The prepared script requests manual updates for fresh Tampermonkey installations. Existing installations may retain their previous update settings, and other managers can behave differently; check the script's update settings in your manager. Review a replacement file before installing it. Findings about one file do not automatically apply to a different copy.

The planned prerelease will be publicly downloadable but will not replace the stable **Latest** release. The README's raw-`main` installation link will serve the prerelease after its source is published, while the stable release remains separately available. Check the release label and installed file's metadata version; a prerelease label is not a security certification. See the feature guide for the planned exact release/asset addresses and current availability.

Reading grades and changing their display are necessary for these features. Display or calculation bugs, page changes, inaccurate public schedules, and manager behavior remain possible. A static review or successful check is not a certification or a guarantee of zero risk. The [calculation reference](docs/CALCULATIONS.md) explains when estimates are available and what they mean.

## Report a vulnerability privately

If **Report a vulnerability** is available on this repository's [Security tab](https://github.com/sodium-qed/aeries-playground/security), use that private channel. If it is unavailable, open an issue asking for a private reporting channel, without describing the vulnerability or including personal information. This document does not enable private reporting or promise a response time.

Once a private channel is established, include:

- The installed script's source and metadata version, plus browser and userscript manager.
- The affected feature and settings, especially whether public schedules were enabled.
- Reproduction steps using fictional courses, assignments, and scores.
- What you expected, what happened, and the suspected impact.

Do not include passwords, cookies, session tokens, account identifiers, copied Aeries page source, storage exports, or real student records. Do not post an exploitable issue publicly while arranging private contact.

## Ordinary bugs and suggestions

For display problems, calculation discrepancies, or feature requests without sensitive security details, use the [issue forms](https://github.com/sodium-qed/aeries-playground/issues/new/choose) and follow [Contributing](CONTRIBUTING.md). Give fictional examples rather than access to an Aeries account.
