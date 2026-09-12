# Security and privacy

## Project boundary

Aeries Playground is intended to customize the local display of Aeries pages. It must not change school records, collect credentials, or transmit student information to a third-party service.

The userscript has not yet been published in this repository, so its permissions, storage, dependencies, and network behavior have not been audited here. Document and review those properties before the first release. Do not infer a security guarantee from the README or a passing syntax check.

## Never publish account data

Do not put real Aeries page source, copied DOM, cookies, session IDs, passwords, student identifiers, grades, or identifiable screenshots in commits, issues, pull requests, or logs. Use small, synthetic reproductions instead. Browser exports and network captures may contain information that is not visible on screen.

The ignore rules only help prevent some accidental additions in a local Git checkout. They do not sanitize content, prevent every web upload, remove tracked files, or erase past commits. See GitHub's guidance on [ignoring files](https://docs.github.com/en/get-started/git-basics/ignoring-files) and [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

## Reporting a vulnerability

Do not post exploit details or private account data in a public issue. If **Report a vulnerability** is available on this repository's Security tab, use that private channel. This file does not enable private reporting by itself.

If private reporting is unavailable, open an issue asking the maintainer to establish a private reporting channel, without including the vulnerability details or sensitive examples. There is no published response-time commitment.

## Accidental exposure

Do not quote or repost exposed information. Notify the affected account owner and the maintainer privately. Exposed credentials or sessions need to be revoked or reset through the relevant account/provider; deleting a file is not enough. The maintainer may also need to remove sensitive Git history and coordinate cleanup of cached copies.
