# Aeries Playground

Customizable grade colors, thresholds, and display options for Aeries, delivered as a Tampermonkey userscript.

**Unofficial project.** Aeries Playground is not affiliated with Aeries or any school district. Its intended scope is local display customization, not changing school records. Always use the official gradebook for authoritative grades.

## Project status

**The installable userscript has not been added to this repository yet.** The repository currently contains project documentation and validation tooling, not a usable release. There is no install button until a reviewed script is available.

The primary script should be published at the repository root as `aeries-playground.user.js`. Browser and school compatibility must be verified against that actual implementation; it is not established by the setup files.

## Installation — after the userscript is published

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
2. On Chrome-based browsers, enable **Allow User Scripts** in Tampermonkey's extension settings when available. See the [official permission instructions](https://www.tampermonkey.net/faq.php?q=Q209) for your browser. Do not bypass school-managed browser restrictions.
3. Open the published `aeries-playground.user.js` file in this repository and select **Raw**.
4. Review the source and requested permissions, then confirm installation in Tampermonkey.
5. Enable the script, open your usual Aeries portal, and refresh the page.

If Raw only shows text, create a new script in the Tampermonkey dashboard, replace the editor's starter code with the complete userscript, including its metadata header, and save. See [Tampermonkey's installation guide](https://www.tampermonkey.net/faq.php?q=Q102).

Do not install saved Aeries page source, a full browser backup, or a script copied from an untrusted issue comment. A repository ZIP is not itself an installable userscript.

## Troubleshooting

If nothing changes, check that Tampermonkey and the userscript are enabled, script-execution permission is granted, and the script's URL rules cover your Aeries portal. Do not broaden those rules to every website to work around a mismatch.

Disable duplicate or older Aeries scripts before testing. If a display looks wrong, turn off Aeries Playground and refresh to compare with the official page. Use a bug report with made-up example values rather than your real gradebook.

For removal, disable or delete the script in the Tampermonkey dashboard and reload Aeries. Disabling is not a promise that saved preferences are erased; storage behavior must be documented when the implementation is published.

## Privacy and safe sharing

Publish the userscript, not your Aeries account data. Never commit real gradebook HTML, copied DOM, login information, cookies, session tokens, network captures, or identifiable student screenshots. Build test examples from fictional data instead.

The `.gitignore` catches some common local and sensitive filenames. It is **not a privacy scanner**: it does not protect already tracked files, remove Git history, or make manual web uploads safe. Review the actual changes before publishing.

See [SECURITY.md](SECURITY.md) for the privacy boundary and sensitive-report guidance. No security or browser-functionality audit of the userscript is claimed while its source is absent.

## Development

Keep the project as a plain userscript unless a build system is genuinely needed. There is no npm dependency installation or build step for these repository checks.

From the repository root, using Node.js 22 or 24:

```sh
node --test tests/check-userscripts.test.mjs
node scripts/check-userscripts.mjs --allow-empty
```

The checker discovers `.user.js` files, validates their metadata header, and parses their JavaScript without executing it. It checks for non-empty `@name`, `@version`, `@description`, and at least one `@match` or `@include` entry. These are project checks, not a complete Tampermonkey metadata validator.

`--allow-empty` permits documentation-only setup and prints an explicit warning when no userscript exists. Before publishing a release, require an actual script:

```sh
node scripts/check-userscripts.mjs
```

GitHub Actions runs the checker tests and bootstrap check on pushes and pull requests. A passing check does **not** verify permissions, network behavior, grade calculations, browser compatibility, or absence of private data. Live-browser checks remain necessary.

## Contributing and releases

Use the bug-report or feature-request form for feedback. See [CONTRIBUTING.md](CONTRIBUTING.md) for testing and the first-release checklist, and [CHANGELOG.md](CHANGELOG.md) for changes. Keep the install filename stable and update the userscript's `@version` when publishing a changed script.

## License

[MIT](LICENSE).
