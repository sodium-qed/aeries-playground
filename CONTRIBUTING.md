# Contributing

Keep changes focused on a specific bug, useful feature, or documentation improvement. This is a userscript project, not a hosted gradebook service. Preserve the existing MIT license and avoid adding a framework, backend, analytics, or build pipeline without a concrete need and review.

## Current development boundary

The installable userscript remains outside this repository while it is in development. The documentation describes an inspected snapshot labeled **1.5.4**; it does not publish that source or declare a release.

For a documentation-only update, commit documentation only. Do not add the development attachment, a userscript, a copied code listing, a distribution archive, or a source attachment to a PR. Code publication is a separate maintainer decision.

Keep the [README](README.md) as the overview, the [feature guide](docs/FEATURES.md) as the user manual, and the [calculation reference](docs/CALCULATIONS.md) as the explanation of modeled behavior. Update [SECURITY.md](SECURITY.md) when storage or network behavior changes. Record documentation changes under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).

Distinguish features present in the reviewed snapshot from requested changes. In particular, assignment-number weight-map ordering is requested but is not present in the snapshot used for this documentation. Verify a newer source before marking it implemented.

## Useful bug reports

Include the userscript version, browser and Tampermonkey versions, steps to reproduce, and expected versus actual behavior. Describe the relevant page, active feature toggles, grading mode, and filters. Use generic course names and invented grades.

Do not attach full page source, copied DOM, browser backups, request headers, real student screenshots, or userscript-storage exports. Redacting a visible name does not sanitize a complete HTML document.

## Repository checks

Run from the repository root with Node.js 22 or 24:

```sh
node --test tests/check-userscripts.test.mjs
node scripts/check-userscripts.mjs --allow-empty
```

There is no npm dependency installation or build step. The first command tests the existing checker. The second validates discovered userscripts' metadata and JavaScript syntax and explicitly permits the current empty-source repository.

For documentation, also check relative links, examples, development-status wording, and the changed-file list. A checker pass with no userscript does not validate any product feature.

## Future code changes

When source publication is authorized, keep the installable script readable, with its metadata header first and a stable name/namespace. The intended filename is `aeries-playground.user.js` at the repository root.

The repository checker requires non-empty `@name`, `@version`, `@description`, and a URL rule (`@match` or `@include`). Request only capabilities the implementation needs, retain narrow portal scope, and document changes to permissions, storage, dependencies, and network requests. Use fictional fixtures for calculations and page adapters.

In change descriptions, distinguish source inspection, automated checks, and actual browser testing. Describe known limitations rather than treating a syntax pass as a functionality test.

## Browser regression coverage for a future release

The following are review targets for the documented development features, not evidence that they have already passed:

| Area | Behavior to exercise |
| --- | --- |
| Dashboard | Numeric/letter mode switching, original percentage visibility, names/icons, colors, bar bounds, empty grades, and layout at narrow widths. |
| Overall summary | Threshold ratings versus posted A–F GPA, F as zero, plus/minus ignored in letter mode, excluded/duplicate courses, and average-number versus band-color behavior. |
| Gradebook reading | Percentage/four-point courses, numeric equivalents with letter marks, excluded/blank/zero scores, zero-weight categories, score limits, missing-only filters, and delayed course changes. |
| Analysis | Category filtering in both table/card views without changing totals; posted weights/impacts; zero-area entries; keyboard-accessible map details. |
| Grade lab | Score edits, count/reset controls, future assignments, synchronized views, posted comparison, and clearing temporary changes on exit/reload/gradebook refresh. |
| Planning | Points/weighted profiles, rounding, optional limits, replacement caps/conflicts, target search including replacements, range endpoints, and invalidated results after edits. |
| Persistence | Explicit save/load/clear actions, manual profile/year separation, replacement-reference matching after rename/reload, and storage-error messages. |
| Schedule | Pacific-time boundaries, special/no-school days, exact/ambiguous period matches, next-school-day lookup, stale/malformed/offline data, and disabling requests. |
| Local behavior | Playground controls do not submit Aeries forms; no student data enters public schedule requests; disabling and reloading restores the native page. |

## First release

Once the maintainer authorizes publishing source:

- Add the exact reviewed userscript as `aeries-playground.user.js`.
- Review its actual URL scope, permissions, saved data, and network activity.
- Run `node scripts/check-userscripts.mjs` without `--allow-empty`; update CI to require source for releases.
- Test the intended portal/browser scope and document the results without account data.
- Update the userscript version, changelog, feature guide, and status notices for the implementation being released.
- Only after the file exists on `main`, add a working Raw install link. Review and test any automatic-update URLs before adding them.
- Publish a matching release tag with the reviewed file if making a numbered release.

Inspect `git diff --cached` before committing. GitHub web uploads require the same content review; ignore rules do not sanitize them.
