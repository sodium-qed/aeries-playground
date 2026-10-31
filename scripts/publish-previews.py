"""Publish only the two approved immutable previews; never promote stable Latest.

The source files retain their original @version and exact approved bytes. This
publisher is independent of the scheduled stable publishers and their deadlines.
"""

from pathlib import Path
import base64
import hashlib
import json
import os
import re
import subprocess
import tempfile

REPOSITORY = 'sodium-qed/aeries-playground'
SOURCE_NAME = 'aeries-playground.user.js'
REQUIRED_CHECK = 'Validate userscript repository'
PREVIEWS = (
    {'version': '3.1.0', 'tag': 'v3.1.0-preview.1', 'pr': 10,
     'commit': '858a0a1fac820163d1185664baa039624767928e', 'size': 379864,
     'sha256': '5e37b76082308c0eb0f2bc1e472cb33bc4bd3b360a713ddbf8e192c655b33773',
     'stable_time': 'November 1, 2026 at 11:59 p.m. America/Los_Angeles (PST)'},
    {'version': '3.1.1', 'tag': 'v3.1.1-preview.1', 'pr': 12,
     'commit': '8fad3af92e680e67d6872f52dc998cbfde14d7fc', 'size': 383784,
     'sha256': '3920c6c72f6b0d4ddfac82dad5d6f3bb560510cfe1d1ed193d43e3bb28136c4b',
     'stable_time': 'November 8, 2026 at 11:59 p.m. America/Los_Angeles (PST)'},
)


def gh(*args, check=True, **kwargs):
    return subprocess.run(['gh', *args], check=check, text=True,
                          capture_output=True, timeout=120, **kwargs)


def api(path, absent_ok=False, paginate=False):
    result = gh('api', path, *(['--paginate', '--slurp'] if paginate else []), check=False)
    if result.returncode:
        if absent_ok and '(HTTP 404)' in result.stderr:
            return None
        raise RuntimeError(result.stderr.strip() or 'GitHub read failed.')
    data = json.loads(result.stdout)
    if paginate:
        if not isinstance(data, list) or any(not isinstance(page, list) for page in data):
            raise RuntimeError('Unexpected paginated GitHub response.')
        return [item for page in data for item in page]
    return data


def api_write(path, method, payload):
    result = gh('api', path, '--method', method, '--input', '-',
                input=json.dumps(payload), check=False)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or 'GitHub write failed.')
    return json.loads(result.stdout)


def title(spec):
    return f"Aeries Playground {spec['version']} preview 1"


def notes(spec):
    return f'''# {title(spec)}

This is a publicly downloadable **prerelease**, separate from the scheduled stable release. Preview tag `{spec['tag']}` contains the exact approved source from commit `{spec['commit']}`. The userscript metadata intentionally remains `@version {spec['version']}`; the preview label is on this GitHub release, not a modification of the frozen source.

Install the attached `{SOURCE_NAME}` after reviewing its complete source and privacy explanation. Replace the existing script, keep one copy enabled, and reload Aeries. Updates remain manual; publishing this preview does not update an installed copy automatically.

The scheduled stable target remains **{spec['stable_time']}**. This preview does not merge the prepared PR, create a stable tag, change either stable schedule, or select itself as Latest. Stable publication still requires its separate checks and verification.

The exact candidate PR head, successful repository checks, source metadata and syntax, tag target, and independently downloaded asset are checked by the preview publisher. Live Aeries rendering, actual userscript-manager migration, live schedule accuracy, and audible playback remain unverified. Hypothetical edits remain local and do not submit grades.

Verified userscript: **{spec['size']} bytes**, SHA-256 `{spec['sha256']}`.'''


def verify_bytes(data, spec):
    if len(data) != spec['size'] or hashlib.sha256(data).hexdigest() != spec['sha256']:
        raise RuntimeError(f"{spec['tag']}: source or asset bytes conflict with the approved fingerprint.")


def latest_snapshot():
    latest = api(f'repos/{REPOSITORY}/releases/latest')
    if (not isinstance(latest.get('id'), int) or latest['id'] <= 0
            or latest.get('draft') is not False or latest.get('prerelease') is not False
            or latest.get('tag_name') in {spec['tag'] for spec in PREVIEWS}):
        raise RuntimeError('Latest is not an ordinary published stable release.')
    return latest['id'], latest.get('tag_name')


def preserve_latest(snapshot):
    if latest_snapshot() != snapshot:
        raise RuntimeError('Latest changed concurrently; its new selection was preserved. Inspect and retry.')


def tagged_commit(ref):
    obj = ref.get('object', {})
    for _ in range(8):
        if obj.get('type') == 'commit' and re.fullmatch(r'[0-9a-f]{40}', obj.get('sha', '')):
            return obj['sha']
        if obj.get('type') != 'tag' or not re.fullmatch(r'[0-9a-f]{40}', obj.get('sha', '')):
            break
        obj = api(f"repos/{REPOSITORY}/git/tags/{obj['sha']}").get('object', {})
    raise RuntimeError('A preview tag does not resolve to a commit.')


def release_for(spec):
    releases = api(f'repos/{REPOSITORY}/releases?per_page=100', paginate=True)
    matches = [release for release in releases if release.get('tag_name') == spec['tag']]
    if len(matches) > 1:
        raise RuntimeError(f"{spec['tag']}: multiple releases use this tag.")
    return matches[0] if matches else None


def inspect_existing(spec, folder):
    ref = api(f"repos/{REPOSITORY}/git/ref/tags/{spec['tag']}", absent_ok=True)
    if ref and tagged_commit(ref) != spec['commit']:
        raise RuntimeError(f"{spec['tag']}: existing tag targets another commit; it will not be moved.")
    release = release_for(spec)
    assets = []
    if release:
        if release.get('name') != title(spec) or release.get('body') != notes(spec):
            raise RuntimeError(f"{spec['tag']}: existing release notes or title conflict.")
        if release.get('draft'):
            target = api(f"repos/{REPOSITORY}/commits/{release['target_commitish']}")
            if target.get('sha') != spec['commit']:
                raise RuntimeError('An existing preview draft targets a different commit.')
        elif release.get('draft') is not False or release.get('prerelease') is not True or not ref:
            raise RuntimeError('An existing published preview has conflicting stable/tag metadata.')
        all_assets = api(f"repos/{REPOSITORY}/releases/{release['id']}/assets?per_page=100", paginate=True)
        assets = [asset for asset in all_assets if asset.get('name') == SOURCE_NAME]
        if len(assets) > 1:
            raise RuntimeError('The preview has ambiguous userscript assets.')
        if assets:
            asset = assets[0]
            if (asset.get('state') != 'uploaded' or asset.get('size') != spec['size']
                    or asset.get('digest') not in {None, 'sha256:' + spec['sha256']}):
                raise RuntimeError('An existing preview asset conflicts; it will not be overwritten.')
            verify_download(spec, folder)
    return ref, release, assets


def verify_download(spec, folder):
    with tempfile.TemporaryDirectory(dir=folder) as download:
        gh('release', 'download', spec['tag'], '--repo', REPOSITORY,
           '--pattern', SOURCE_NAME, '--dir', download)
        path = Path(download) / SOURCE_NAME
        if not path.is_file() or path.is_symlink():
            raise RuntimeError('The downloaded preview asset is not an ordinary file.')
        verify_bytes(path.read_bytes(), spec)


def verify_pr(spec, recovering=False):
    pr = api(f"repos/{REPOSITORY}/pulls/{spec['pr']}")
    if (pr.get('number') != spec['pr'] or pr.get('head', {}).get('sha') != spec['commit']
            or pr.get('head', {}).get('repo', {}).get('full_name') != REPOSITORY
            or pr.get('base', {}).get('repo', {}).get('full_name') != REPOSITORY
            or pr.get('base', {}).get('ref') != 'main'):
        raise RuntimeError('A candidate PR identity or approved head changed.')
    if not (pr.get('state') == 'open' and pr.get('draft') is False):
        if not (recovering and pr.get('merged') is True and pr.get('state') == 'closed'):
            raise RuntimeError('A candidate PR is not open and ready; only an existing preview may recover after merge.')
    checks = api(f"repos/{REPOSITORY}/commits/{spec['commit']}/check-runs?per_page=100&filter=latest")
    # The required check is among the first 100 in this small repository. A
    # larger/incomplete response is rejected instead of ignoring unseen checks.
    runs = checks.get('check_runs', [])
    if checks.get('total_count') != len(runs) or not any(run.get('name') == REQUIRED_CHECK for run in runs):
        raise RuntimeError('Required candidate checks are absent or incomplete.')
    if any(run.get('head_sha') != spec['commit'] or run.get('status') != 'completed'
           or run.get('conclusion') != 'success' for run in runs):
        raise RuntimeError('A candidate check is failing, pending, or attached to another commit.')
    status = api(f"repos/{REPOSITORY}/commits/{spec['commit']}/status")
    if status.get('sha') != spec['commit'] or status.get('total_count', 0) and status.get('state') != 'success':
        raise RuntimeError('Candidate commit statuses are failing, pending, or inconsistent.')


def prepare(spec, folder):
    if (not re.fullmatch(r'[0-9a-f]{40}', spec['commit'])
            or not re.fullmatch(r'[0-9a-f]{64}', spec['sha256']) or spec['size'] <= 0):
        raise RuntimeError('An approved preview fingerprint is invalid.')
    ref, release, _ = inspect_existing(spec, folder)
    verify_pr(spec, recovering=bool(ref or release))
    item = api(f"repos/{REPOSITORY}/contents/{SOURCE_NAME}?ref={spec['commit']}")
    if item.get('type') != 'file' or item.get('encoding') != 'base64':
        raise RuntimeError('The candidate source is not an ordinary base64 file.')
    data = base64.b64decode(''.join(item['content'].split()), validate=True)
    verify_bytes(data, spec)
    text = data.decode('utf-8')
    header = re.match(r'\A\ufeff?//[ \t]*==UserScript==[ \t]*\n([\s\S]*?)\n//[ \t]*==/UserScript==', text)
    versions = re.findall(r'^//[ \t]*@version[ \t]+([^\n]*?)\s*$', header[1], re.MULTILINE) if header else []
    if versions != [spec['version']]:
        raise RuntimeError('The preview source has unexpected userscript version metadata.')
    path = Path(folder) / spec['tag'] / SOURCE_NAME
    path.parent.mkdir(exist_ok=True)
    path.write_bytes(data)
    subprocess.run(['node', '--check', str(path)], check=True, timeout=60)
    return path


def publish_one(spec, source, folder, snapshot):
    verify_bytes(source.read_bytes(), spec)
    ref, release, assets = inspect_existing(spec, folder)
    verify_pr(spec, recovering=bool(ref or release))
    preserve_latest(snapshot)
    if not ref:
        api_write(f'repos/{REPOSITORY}/git/refs', 'POST',
                  {'ref': 'refs/tags/' + spec['tag'], 'sha': spec['commit']})
    if not release:
        notes_path = source.parent / 'preview-notes.md'
        notes_path.write_text(notes(spec), encoding='utf-8')
        gh('release', 'create', spec['tag'], str(source), '--repo', REPOSITORY,
           '--verify-tag', '--target', spec['commit'], '--title', title(spec),
           '--notes-file', str(notes_path), '--draft', '--prerelease', '--latest=false')
    elif not assets:
        gh('release', 'upload', spec['tag'], str(source), '--repo', REPOSITORY)
    ref, release, assets = inspect_existing(spec, folder)
    if not ref or not release or not assets:
        raise RuntimeError('The preview draft, tag, or verified asset is missing.')
    preserve_latest(snapshot)
    if release['draft']:
        api_write(f"repos/{REPOSITORY}/releases/{release['id']}", 'PATCH', {
            'tag_name': spec['tag'], 'name': title(spec), 'body': notes(spec),
            'draft': False, 'prerelease': True, 'make_latest': 'false',
        })
    ref, release, assets = inspect_existing(spec, folder)
    if not ref or not release or release['draft'] or release.get('prerelease') is not True or not assets:
        raise RuntimeError('The preview was not published in the expected prerelease state.')
    preserve_latest(snapshot)
    print(f"Verified prerelease: https://github.com/{REPOSITORY}/releases/tag/{spec['tag']}")


def main():
    if (os.environ.get('GITHUB_ACTIONS') != 'true'
            or os.environ.get('GITHUB_REPOSITORY') != REPOSITORY
            or os.environ.get('GITHUB_REF') != 'refs/heads/main'
            or os.environ.get('GITHUB_EVENT_NAME') not in {'push', 'workflow_dispatch'}
            or not re.fullmatch(r'[0-9a-f]{40}', os.environ.get('GITHUB_SHA', ''))):
        raise RuntimeError('Preview publication requires the intended main-branch Actions workflow.')
    repo = api(f'repos/{REPOSITORY}')
    if repo.get('full_name') != REPOSITORY or repo.get('default_branch') != 'main' or repo.get('archived') is not False:
        raise RuntimeError('Repository identity, default branch, or archived state changed.')
    snapshot = latest_snapshot()
    with tempfile.TemporaryDirectory() as folder:
        # Validate BOTH candidates and all existing artifacts before any writes.
        sources = [prepare(spec, folder) for spec in PREVIEWS]
        preserve_latest(snapshot)
        for spec, source in zip(PREVIEWS, sources):
            publish_one(spec, source, folder, snapshot)
    preserve_latest(snapshot)
    print(f'Stable Latest preserved: {snapshot[1]}. Stable schedules and publishers were not invoked.')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired,
            ValueError, KeyError, TypeError) as error:
        detail = error.stderr if isinstance(error, subprocess.CalledProcessError) else str(error)
        raise SystemExit(f'Preview publication stopped: {detail or error}') from error
