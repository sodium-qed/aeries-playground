# Security and privacy

## Project boundary

Aeries Playground customizes the local presentation of Aeries and calculates hypothetical grades. It must not change school records, collect credentials, or transmit student information to a third-party service.

The behavior below was inspected in an unreleased development snapshot labeled **1.5.4**. The userscript is not published in this repository. This documentation update is not a live network, browser, or security audit; review the actual release source before publication.

## Data handling in the inspected snapshot

| Data | Handling |
| --- | --- |
| Posted grades, assignment scores, and gradebook totals | Read from rendered Aeries pages and used in memory. They are not saved as a grade history or included in schedule requests. |
| Hypothetical scores and added assignments | Held in memory for the current lab session; reset on exit, reload, gradebook/scope changes, or a detected gradebook refresh. |
| Global preferences | Toggles, colors, thresholds, selected settings profile, and selected school year are saved in userscript storage. |
| Course settings | Course identity keys, titles, nicknames, icons, period overrides, scale/bar settings, custom cutoffs, and overall-summary inclusion choices are saved per profile/year. |
| Course grading profiles | Explicitly saved calculation mode, category names/weights, scale, rounding, and assignment score limits persist per course. |
| Saved replacement rules | Store policies/caps and source/target references containing assignment IDs, names, categories, and whether a reference is hypothetical. They do not store the assignments' earned scores. |
| Public bell-schedule data | Downloaded into a 30-minute in-memory cache; not stored as a local student schedule. |
| Account identity or credentials | No account-identity detection or credential-collection feature. Settings profiles are selected manually. |

Course identity keys are derived from recognized course/navigation identifiers or the displayed course title and period. They are local settings keys, not anonymized data. Because course names and saved replacement references can reveal school information, userscript storage should not be shared as if it contained only generic preferences.

The script uses `GM_getValue` and `GM_setValue` under the `aeries-playground-v1` storage key. It contains no dedicated backend, analytics, or cloud-sync service.

## Permissions and public schedule requests

| Metadata/capability | Purpose |
| --- | --- |
| `@match https://mvla.aeries.net/student/*` | Limit execution to the MVLA Aeries student portal. |
| `@run-at document-idle` and `@noframes` | Run after initial document loading and avoid framed copies. |
| `GM_getValue`, `GM_setValue` | Read/write userscript preferences and saved course policies. |
| `GM_registerMenuCommand` | Add the settings menu command in Tampermonkey. |
| `GM_xmlhttpRequest` | Read public schedule JSON. |
| `@connect mvhs-app-d04d2.firebaseio.com` | Declare the public schedule host used by the next-class panel. |

When the MVHS panel is enabled on a visible dashboard, the script makes anonymous GET requests for `days.json`, `weekday-map.json`, and `schedules.json` under `https://mvhs-app-d04d2.firebaseio.com/`. These fixed requests include no grades, course names, account identifiers, or Aeries page contents. The schedule provider still receives ordinary connection information such as the requesting IP address.

The implementation requests anonymous access, uses a fixed mvhs.io referrer, parses JSON without evaluating remote scripts, and checks responses for status, size, format, and expected final host. No remote JavaScript dependency is declared in the snapshot.

Disabling **What class is next (MVHS)** stops future widget refreshes/requests; a request already in progress can finish. Course-to-period matching happens locally. The separate **mvhs.io** link opens that site only when clicked.

## Storage and removal

The script does not implement its own settings synchronization, but Tampermonkey's sync configuration may copy stored preferences. Review or disable that sync if the settings should remain on one device.

Disabling **Enable Playground** pauses enhancements and keeps saved settings. Exiting grade testing resets its temporary scenario; it does not delete saved grading profiles or replacement rules.

To stop the script, disable or remove it in Tampermonkey and reload Aeries. Disabling alone does not erase storage. To remove saved data, use the userscript manager's storage controls for this script; there is no in-app erase-all button in the inspected snapshot.

## Never publish account data

Do not include real Aeries page source, copied DOM, cookies, session IDs, passwords, student identifiers, grades, or identifiable screenshots in commits, issues, pull requests, or logs. Use fictional reproductions. Browser exports can include information that is not visible on screen.

The repository's ignore rules only help prevent some accidental local additions. They do not sanitize uploads, remove tracked files, or erase Git history.

## Reporting a vulnerability

If **Report a vulnerability** is available on this repository's Security tab, use that private channel. This file does not enable private reporting.

If private reporting is unavailable, open an issue asking the maintainer to establish a private reporting channel, without including vulnerability details or sensitive examples. There is no published response-time commitment.

## Accidental exposure

Do not quote or repost exposed information. Notify the affected account owner and maintainer privately. Exposed credentials or sessions need to be revoked or reset through the relevant provider; deleting a file is not enough. Sensitive Git history and cached copies may also need cleanup.
