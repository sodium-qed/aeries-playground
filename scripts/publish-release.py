"""Publish or recover only the reviewed Aeries Playground 3.1.1 artifact.

Run from the repository root in the guarded release workflow. This module uses
only Python's standard library, Node.js, Git, and the authenticated GitHub CLI.
It never moves tags, replaces assets, or modifies an earlier release.
"""

from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
import base64
import hashlib
import json
import os
import re
import subprocess
import tempfile


REPOSITORY = 'sodium-qed/aeries-playground'
VERSION = '3.1.1'
TAG = 'v3.1.1'
TITLE = 'Aeries Playground 3.1.1'
PREVIOUS_STABLE_TAG = 'v3.1.0'
SOURCE = Path('aeries-playground.user.js')
NOTES = Path('docs/RELEASE-3.1.1.md')
# Sunday, November 8, 2026 at 11:59 PM America/Los_Angeles (PST).
# This is a not-before guard, not a scheduler; DST has ended by this time.
LAUNCH_TIME = datetime(2026, 11, 9, 7, 59, tzinfo=timezone.utc)
# Fill these from the final integrated userscript before committing the release.
EXPECTED_SHA256 = '3920c6c72f6b0d4ddfac82dad5d6f3bb560510cfe1d1ed193d43e3bb28136c4b'
EXPECTED_SIZE = 383784


def prepared_source():
    return (SOURCE.is_file() and not SOURCE.is_symlink()
        and SOURCE.stat().st_size == EXPECTED_SIZE
        and hashlib.sha256(SOURCE.read_bytes()).hexdigest() == EXPECTED_SHA256)


def gh(*args, check=True, **kwargs):
    return subprocess.run(
        ['gh', *args], check=check, text=True, capture_output=True,
        timeout=120, **kwargs)


def api(path, absent_ok=False, paginate=False):
    result = gh('api', path, *(['--paginate', '--slurp'] if paginate else []), check=False)
    if result.returncode:
        # A rate limit, authentication failure, or outage is never absence.
        if absent_ok and '(HTTP 404)' in result.stderr:
            return None
        raise SystemExit(result.stderr.strip() or 'GitHub API request failed.')
    data = json.loads(result.stdout)
    if paginate:
        if not isinstance(data, list) or any(not isinstance(page, list) for page in data):
            raise SystemExit('The paginated GitHub response has an unexpected shape.')
        return [item for page in data for item in page]
    return data


def api_write(path, method, payload):
    result = gh('api', path, '--method', method, '--input', '-',
                input=json.dumps(payload), check=False)
    if result.returncode:
        raise SystemExit(result.stderr.strip() or 'GitHub API write failed.')
    return json.loads(result.stdout)


def main(now=None):
    repo = os.environ.get('GITHUB_REPOSITORY')
    commit = os.environ.get('GITHUB_SHA', '')
    event = os.environ.get('GITHUB_EVENT_NAME')
    if (repo != REPOSITORY or os.environ.get('GITHUB_REF') != 'refs/heads/main'
            or event not in {'push', 'workflow_dispatch'}
            or not re.fullmatch(r'[0-9a-f]{40}', commit)):
        raise SystemExit('Publication requires the intended repository, main branch, and triggering commit.')
    if (not re.fullmatch(r'[0-9a-f]{64}', EXPECTED_SHA256)
            or not isinstance(EXPECTED_SIZE, int) or EXPECTED_SIZE <= 0):
        raise SystemExit('The final reviewed userscript fingerprint has not been prepared.')

    matched = prepared_source()
    if event == 'push' and not matched:
        print('Push differs from the frozen 3.1.1 artifact; no release or asset changes attempted.')
        return
    if not matched:
        raise SystemExit('The userscript does not match the prepared 3.1.1 launch file.')
    if (now or datetime.now(timezone.utc)) < LAUNCH_TIME:
        print('The release time has not arrived; no release was created.')
        return
    metadata = re.match(r'\A\ufeff?//[ \t]*==UserScript==[ \t]*\n([\s\S]*?)\n//[ \t]*==/UserScript==',
                        SOURCE.read_text(encoding='utf-8'))
    versions = re.findall(r'^//[ \t]*@version[ \t]+([^\n]*?)\s*$',
                          metadata[1], re.MULTILINE) if metadata else []
    if versions != [VERSION]:
        raise SystemExit('The userscript metadata does not match version 3.1.1.')
    if not NOTES.is_file() or NOTES.is_symlink():
        raise SystemExit('The reviewed release notes are missing.')
    body = NOTES.read_text(encoding='utf-8').strip()
    if not body:
        raise SystemExit('The reviewed release notes are empty.')
    body += f'\n\nVerified userscript: {EXPECTED_SIZE} bytes; SHA-256 `{EXPECTED_SHA256}`.\n'

    tests = sorted(str(path) for path in Path('tests').glob('*.test.mjs') if path.is_file())
    if not tests:
        raise SystemExit('No regression tests were found; publication was stopped.')
    # Run every committed regression suite, including publication recovery tests.
    # These synthetic checks do not establish live Aeries/browser compatibility.
    for command in [
        ['node', '--test', *tests],
        ['node', 'scripts/check-userscripts.mjs'],
        ['node', 'scripts/check-documentation.mjs'],
        ['git', 'diff', '--check'],
    ]:
        subprocess.run(command, check=True, timeout=180)
    if not prepared_source():
        raise SystemExit('The prepared userscript changed during validation; nothing was published.')

    def verify_source_at(ref):
        file = api(f'repos/{repo}/contents/{SOURCE.name}?ref={quote(ref, safe="")}')
        if file.get('type') != 'file' or file.get('encoding') != 'base64':
            raise SystemExit('The referenced source is not an ordinary readable file.')
        contents = base64.b64decode(file['content'])
        if len(contents) != EXPECTED_SIZE or hashlib.sha256(contents).hexdigest() != EXPECTED_SHA256:
            raise SystemExit('The referenced commit contains a different userscript.')

    def tagged_commit(ref):
        # Only a tag ref is accepted; explicitly peel annotated tags.
        obj = ref['object']
        for _ in range(8):
            if obj['type'] == 'commit':
                return obj['sha']
            if obj['type'] != 'tag':
                break
            obj = api(f'repos/{repo}/git/tags/{obj["sha"]}')['object']
        raise SystemExit('The release tag does not resolve to a commit.')

    tag_path = f'repos/{repo}/git/ref/tags/{TAG}'
    release_path = f'repos/{repo}/releases/tags/{TAG}'

    def release_for_tag():
        release = api(release_path, absent_ok=True)
        if release:
            return release
        # The tag endpoint omits drafts. Paginate so an older partial draft
        # cannot be overlooked and duplicated after many subsequent releases.
        matches = [item for item in api(f'repos/{repo}/releases?per_page=100', paginate=True)
                   if item.get('tag_name') == TAG]
        if len(matches) > 1:
            raise SystemExit('Multiple releases use the expected tag.')
        return matches[0] if matches else None

    stable = api(f'repos/{repo}/releases/tags/{PREVIOUS_STABLE_TAG}')
    if stable['draft'] or stable['prerelease'] or stable['tag_name'] != PREVIOUS_STABLE_TAG:
        raise SystemExit('The previous stable release has unexpected metadata.')

    def check_latest():
        latest = api(f'repos/{repo}/releases/latest', absent_ok=True)
        if latest and latest['id'] != stable['id'] and latest['tag_name'] != TAG:
            raise SystemExit('Latest has changed to another release; its selection was preserved.')
        return latest

    check_latest()
    verify_source_at(commit)
    tag_ref = api(tag_path, absent_ok=True)
    if tag_ref and tagged_commit(tag_ref) != commit:
        raise SystemExit('The existing release tag targets another commit; it was not moved.')
    release = release_for_tag()
    if release and release['tag_name'] != TAG:
        raise SystemExit('The existing release uses an unexpected tag.')
    if release and release['draft']:
        target = api(f'repos/{repo}/commits/{quote(release["target_commitish"], safe="")}')
        if target['sha'] != commit:
            raise SystemExit('The existing draft targets another commit; it was not repurposed.')
    if release and not release['draft'] and not tag_ref:
        raise SystemExit('The published release is missing its tag.')

    def assets_for(current):
        matches = [asset for asset in api(
            f'repos/{repo}/releases/{current["id"]}/assets?per_page=100', paginate=True)
            if asset['name'] == SOURCE.name]
        if len(matches) > 1:
            raise SystemExit('The release has ambiguous userscript assets.')
        if matches:
            asset = matches[0]
            if (asset.get('state') != 'uploaded' or asset.get('size') != EXPECTED_SIZE
                    or asset.get('digest') not in {None, f'sha256:{EXPECTED_SHA256}'}):
                raise SystemExit('The existing release asset conflicts; nothing was overwritten.')
        return matches

    with tempfile.TemporaryDirectory() as folder:
        notes = Path(folder) / 'release-notes.md'
        notes.write_text(body, encoding='utf-8')

        def verify_asset():
            # Hash the downloaded bytes even when GitHub provides a digest.
            # Never pass --clobber or delete an existing asset.
            with tempfile.TemporaryDirectory(dir=folder) as download:
                gh('release', 'download', TAG, '--repo', repo,
                   '--pattern', SOURCE.name, '--dir', download)
                asset = Path(download) / SOURCE.name
                if (not asset.is_file() or asset.is_symlink() or asset.stat().st_size != EXPECTED_SIZE
                        or hashlib.sha256(asset.read_bytes()).hexdigest() != EXPECTED_SHA256):
                    raise SystemExit('The release asset differs from the prepared userscript; nothing was overwritten.')

        matches = assets_for(release) if release else []
        if matches:
            verify_asset()
        check_latest()
        current_tag = api(tag_path, absent_ok=True)
        if ((tag_ref and not current_tag)
                or current_tag and tagged_commit(current_tag) != commit):
            raise SystemExit('The release tag changed before mutation; nothing was overwritten.')
        tag_ref = current_tag
        if not tag_ref:
            # Create only a missing tag at this exact reviewed workflow commit.
            # A conflicting concurrent creation fails; never move or delete it.
            api_write(f'repos/{repo}/git/refs', 'POST',
                      {'ref': f'refs/tags/{TAG}', 'sha': commit})
        if not release:
            gh('release', 'create', TAG, str(SOURCE), '--repo', repo,
               '--verify-tag', '--target', commit, '--title', TITLE,
               '--notes-file', str(notes), '--draft', '--latest=false')
            release = release_for_tag()
            if not release:
                raise SystemExit('The draft release could not be found after creation.')
        elif not matches:
            # Recovery may add the missing asset, while preserving all others.
            gh('release', 'upload', TAG, str(SOURCE), '--repo', repo)
        release = release_for_tag()
        if not release or not assets_for(release):
            raise SystemExit('The prepared userscript asset is missing.')
        verify_asset()
        if tagged_commit(api(tag_path)) != commit:
            raise SystemExit('The release tag changed before publication.')
        verify_source_at(commit)
        latest = check_latest()
        if (release['draft'] or release['prerelease'] or release['name'] != TITLE
                or release.get('body') != body or not latest or latest['id'] != release['id']):
            release = api_write(f'repos/{repo}/releases/{release["id"]}', 'PATCH', {
                'tag_name': TAG,
                'name': TITLE,
                'body': body,
                'draft': False,
                'prerelease': False,
                'make_latest': 'true',
            })

        release = release_for_tag()
        if (not release or release['tag_name'] != TAG or release['draft']
                or release['prerelease'] or release['name'] != TITLE or release.get('body') != body):
            raise SystemExit('The release was not published in the expected stable state.')
        if tagged_commit(api(tag_path)) != commit:
            raise SystemExit('The release tag changed unexpectedly.')
        verify_source_at(commit)
        if not assets_for(release):
            raise SystemExit('The published userscript asset is missing.')
        verify_asset()
        latest = api(f'repos/{repo}/releases/latest', absent_ok=True)
        if not latest or latest['id'] != release['id']:
            # Do not undo another publisher's newer Latest selection.
            raise SystemExit('Latest changed during publication; the newer selection was preserved.')
        print(release['html_url'])


if __name__ == '__main__':
    main()
