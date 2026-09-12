# Contributing

Keep changes focused on a specific bug or useful display improvement. This is a userscript project, not a hosted gradebook service. Do not add a framework, backend, analytics, or build pipeline without a concrete need and review.

## Useful bug reports

Include the userscript version, browser and Tampermonkey versions, steps to reproduce, and expected versus actual behavior. Use a generic course name and invented grades. For example, describe a letter grade with a parenthesized numerical value instead of uploading your real gradebook.

Do not attach full page source, copied DOM, browser backups, request headers, or real student screenshots. Redacting a visible name is not sufficient to sanitize a complete HTML document.

## Code changes

Keep the installable script readable and save it with a `.user.js` extension. Put its metadata header first. This repository checks for non-empty `@name`, `@version`, `@description`, and a URL rule (`@match` or `@include`). Maintain a stable name and namespace; explicitly document permissions and reviewed URL rules. Consult the [Tampermonkey metadata documentation](https://www.tampermonkey.net/documentation.php).

Request only the capabilities the implementation needs. Scope execution to supported Aeries pages, not all websites. Never hardcode student IDs, grades, names, tokens, or private account URLs. Use invented fixtures for automated tests.

Run these commands from the repository root with Node.js 22 or 24:

```sh
node --test tests/check-userscripts.test.mjs
node scripts/check-userscripts.mjs --allow-empty
```

The empty-source option exists only to support this initial documentation setup. A release must pass the same checker without `--allow-empty`.

In pull requests, distinguish automated checks from browser testing. A successful parse does not prove the userscript works. Describe tests not performed and known limitations.

## Browser regression checklist

When these features exist, exercise percentage grades, four-point scales, and letter grades accompanied by numeric values. Check switching courses, empty or ungraded entries, zero-weight categories, configurable thresholds, display toggles, and bar limits. Confirm that disabling the script and refreshing restores the official presentation. Do not imply every feature has been implemented or tested merely because it appears in this checklist.

## First release

- Add the exact working userscript as `aeries-playground.user.js`; do not substitute a placeholder or saved Aeries page.
- Review the complete source for personal data, URL scope, permissions, storage, remote dependencies, and network activity. Document actual behavior in the README.
- Run the strict check (`node scripts/check-userscripts.mjs`) and test the script in a browser. Record the tested browser/portal scope without including private account details.
- Set an appropriate `@version`, document changes in `CHANGELOG.md`, and replace the README's source-pending notice with verified installation and compatibility details.
- Only after the file exists on `main`, add a Raw install link. For any automatic-update metadata, use reachable URLs controlled by this project and test the update path.
- Publish a matching release tag and include the reviewed `.user.js` file. Do not claim a release exists before it has been published.

Inspect `git diff --cached` before a local commit. GitHub web uploads also require manual review; `.gitignore` is not an upload sanitizer. Preserve the existing MIT license.
