"""Publish only the frozen scheduled 3.1.0/3.1.1 prereleases.

This independent path survives both immutable candidate merges. The legacy
stable workflow must remain disabled. No stable publisher or preview is called.
"""

from datetime import datetime, timezone
from pathlib import Path
import base64
import hashlib
import json
import os
import re
import subprocess
import tempfile

REPOSITORY = 'sodium-qed/aeries-playground'
STABLE_TAG = 'v3.0.0'
SOURCE = Path('aeries-playground.user.js')
SPECS = {
    '3.1.0': {'pr': 10, 'head': '858a0a1fac820163d1185664baa039624767928e',
              'size': 379864, 'sha256': '5e37b76082308c0eb0f2bc1e472cb33bc4bd3b360a713ddbf8e192c655b33773',
              'launch': datetime(2026, 11, 2, 7, 59, tzinfo=timezone.utc)},
    '3.1.1': {'pr': 12, 'head': '8fad3af92e680e67d6872f52dc998cbfde14d7fc',
              'size': 383784, 'sha256': '3920c6c72f6b0d4ddfac82dad5d6f3bb560510cfe1d1ed193d43e3bb28136c4b',
              'launch': datetime(2026, 11, 9, 7, 59, tzinfo=timezone.utc)},
}


def gh(*args, check=True, **kwargs):
    return subprocess.run(['gh', *args], check=check, text=True,
                          capture_output=True, timeout=120, **kwargs)


def api(path, absent_ok=False, paginate=False):
    result = gh('api', path, *(['--paginate', '--slurp'] if paginate else []), check=False)
    if result.returncode:
        if absent_ok and '(HTTP 404)' in result.stderr:
            return None
        raise RuntimeError(result.stderr.strip() or 'GitHub read failed.')
    value = json.loads(result.stdout)
    if paginate:
        if not isinstance(value, list) or any(not isinstance(page, list) for page in value):
            raise RuntimeError('Unexpected paginated GitHub response.')
        return [item for page in value for item in page]
    return value


def api_write(path, method, payload):
    result = gh('api', path, '--method', method, '--input', '-',
                input=json.dumps(payload), check=False)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or 'GitHub write failed.')
    return json.loads(result.stdout)


def sha(value):
    if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{40}', value):
        raise RuntimeError('Expected a valid commit SHA.')
    return value


def verify_bytes(data, spec):
    if len(data) != spec['size'] or hashlib.sha256(data).hexdigest() != spec['sha256']:
        raise RuntimeError('Userscript bytes differ from the frozen scheduled artifact.')


def local_bytes():
    if not SOURCE.is_file() or SOURCE.is_symlink():
        raise RuntimeError('The userscript is not an ordinary file.')
    return SOURCE.read_bytes()


def verify_source_at(commit, spec):
    item = api(f'repos/{REPOSITORY}/contents/{SOURCE.name}?ref={sha(commit)}')
    if item.get('type') != 'file' or item.get('encoding') != 'base64':
        raise RuntimeError('The referenced userscript is not an ordinary readable file.')
    data = base64.b64decode(''.join(item['content'].split()), validate=True)
    verify_bytes(data, spec)


def publication_policy(expected_stable_id=None):
    workflow = api(f'repos/{REPOSITORY}/actions/workflows/release.yml')
    if workflow.get('path') != '.github/workflows/release.yml' or workflow.get('state') != 'disabled_manually':
        raise RuntimeError('Legacy stable publication must remain manually disabled.')
    stable = api(f'repos/{REPOSITORY}/releases/tags/{STABLE_TAG}')
    latest = api(f'repos/{REPOSITORY}/releases/latest')
    stable_id = stable.get('id')
    if (not isinstance(stable_id, int) or stable_id <= 0
            or stable.get('tag_name') != STABLE_TAG or stable.get('draft') is not False
            or stable.get('prerelease') is not False or latest.get('id') != stable_id
            or latest.get('tag_name') != STABLE_TAG or latest.get('draft') is not False
            or latest.get('prerelease') is not False
            or expected_stable_id is not None and stable_id != expected_stable_id):
        raise RuntimeError('Stable Latest changed; its selection was preserved and publication stopped.')
    return stable_id


def merged_candidate(version, expected_commit=None):
    spec = SPECS[version]
    pr = api(f"repos/{REPOSITORY}/pulls/{spec['pr']}")
    if (pr.get('number') != spec['pr'] or pr.get('merged') is not True or pr.get('state') != 'closed'
            or pr.get('head', {}).get('sha') != spec['head']
            or pr.get('head', {}).get('repo', {}).get('full_name') != REPOSITORY
            or pr.get('base', {}).get('repo', {}).get('full_name') != REPOSITORY
            or pr.get('base', {}).get('ref') != 'main'):
        raise RuntimeError('The approved candidate PR has not been merged at its pinned head.')
    commit = sha(pr.get('merge_commit_sha'))
    if expected_commit is not None and commit != expected_commit:
        raise RuntimeError('Publication must run at the exact original merge commit.')
    merged = api(f'repos/{REPOSITORY}/git/commits/{commit}')
    parents = merged.get('parents', [])
    if merged.get('sha') != commit or len(parents) != 2 or parents[1].get('sha') != spec['head']:
        raise RuntimeError('The merge does not contain the approved candidate as its second parent.')
    sha(parents[0].get('sha'))
    verify_source_at(commit, spec)
    return commit


def tagged_commit(ref):
    obj = ref.get('object', {})
    for _ in range(8):
        if obj.get('type') == 'commit':
            return sha(obj.get('sha'))
        if obj.get('type') != 'tag':
            break
        obj = api(f"repos/{REPOSITORY}/git/tags/{sha(obj.get('sha'))}").get('object', {})
    raise RuntimeError('The release tag does not resolve to a commit.')


def release_for(version):
    matches = [item for item in api(f'repos/{REPOSITORY}/releases?per_page=100', paginate=True)
               if item.get('tag_name') == 'v' + version]
    if len(matches) > 1:
        raise RuntimeError('Multiple releases use the intended tag.')
    return matches[0] if matches else None


def release_title(version):
    return f'Aeries Playground {version} prerelease'


def release_body(version, commit):
    spec = SPECS[version]
    description = ('Unifies the Developer and public editions while retaining the audited public fixes.'
                   if version == '3.1.0' else
                   'Adds the configurable purple bonus band and rating 5 after the 3.1.0 unification.')
    return f'''# {release_title(version)}

This is a **prerelease**, published at the separately authorized scheduled time. {description}

The attached `{SOURCE.name}` is the exact frozen source with `@version {version}`, from merge commit `{commit}` and approved PR #{spec['pr']}. Review the complete file, replace the existing script, keep one copy enabled, and reload Aeries. Updates remain manual. These local tools do not submit grades.

**{STABLE_TAG} remains the stable Latest release.** This release does not promote itself to Latest, change another release, or publish the withdrawn preview tags. The scheduled not-before time was `{spec['launch'].isoformat()}`.

All committed regression suites, userscript syntax/basic metadata, documentation links, and whitespace checks run before publication. The publisher verifies the exact merge/tag and independently downloads and hashes the asset. Live Aeries rendering, actual manager migration, live schedules, and audible media remain unverified.

Verified userscript: **{spec['size']} bytes**, SHA-256 `{spec['sha256']}`.'''


def inspect_release(version, commit, folder, require_published=False):
    spec = SPECS[version]
    ref = api(f'repos/{REPOSITORY}/git/ref/tags/v{version}', absent_ok=True)
    if ref and tagged_commit(ref) != commit:
        raise RuntimeError('An existing tag targets another commit; it will not be moved.')
    release = release_for(version)
    matches = []
    if release:
        if release.get('name') != release_title(version) or release.get('body') != release_body(version, commit):
            raise RuntimeError('Existing release title or notes conflict with the prepared prerelease.')
        if release.get('draft'):
            target = api(f"repos/{REPOSITORY}/commits/{release['target_commitish']}")
            if target.get('sha') != commit:
                raise RuntimeError('The existing draft targets another commit.')
        elif release.get('draft') is not False or release.get('prerelease') is not True or not ref:
            raise RuntimeError('Existing published release metadata conflicts with prerelease-only policy.')
        assets = api(f"repos/{REPOSITORY}/releases/{release['id']}/assets?per_page=100", paginate=True)
        matches = [asset for asset in assets if asset.get('name') == SOURCE.name]
        if len(matches) > 1:
            raise RuntimeError('The release contains ambiguous userscript assets.')
        if matches:
            asset = matches[0]
            if (asset.get('state') != 'uploaded' or asset.get('size') != spec['size']
                    or asset.get('digest') not in {None, 'sha256:' + spec['sha256']}):
                raise RuntimeError('An existing asset conflicts; it will not be overwritten.')
            with tempfile.TemporaryDirectory(dir=folder) as destination:
                gh('release', 'download', 'v' + version, '--repo', REPOSITORY,
                   '--pattern', SOURCE.name, '--dir', destination)
                path = Path(destination) / SOURCE.name
                if not path.is_file() or path.is_symlink():
                    raise RuntimeError('Downloaded userscript is not an ordinary file.')
                verify_bytes(path.read_bytes(), spec)
    if require_published and (not ref or not release or release.get('draft') is not False
                              or release.get('prerelease') is not True or not matches):
        raise RuntimeError('The required verified prerelease is not publicly available.')
    return ref, release, matches


def prerequisite(version, folder):
    if version == '3.1.1':
        prior_commit = merged_candidate('3.1.0')
        inspect_release('3.1.0', prior_commit, folder, require_published=True)


def main(now=None):
    event = os.environ.get('GITHUB_EVENT_NAME')
    commit = os.environ.get('GITHUB_SHA', '')
    if (os.environ.get('GITHUB_ACTIONS') != 'true'
            or os.environ.get('GITHUB_REPOSITORY') != REPOSITORY
            or os.environ.get('GITHUB_REF') != 'refs/heads/main'
            or event not in {'push', 'workflow_dispatch'}):
        raise RuntimeError('Publication requires the intended main-branch Actions workflow.')
    sha(commit)
    data = local_bytes()
    header = re.match(r'\A\ufeff?//[ \t]*==UserScript==[ \t]*\n([\s\S]*?)\n//[ \t]*==/UserScript==', data.decode('utf-8'))
    versions = re.findall(r'^//[ \t]*@version[ \t]+([^\n]*?)\s*$', header[1], re.MULTILINE) if header else []
    version = versions[0] if len(versions) == 1 else None
    spec = SPECS.get(version)
    if not spec or len(data) != spec['size'] or hashlib.sha256(data).hexdigest() != spec['sha256']:
        if event == 'push':
            print('Push is not a frozen scheduled prerelease; no publication attempted.')
            return
        raise RuntimeError('The source is not an approved scheduled prerelease artifact.')
    if (now or datetime.now(timezone.utc)) < spec['launch']:
        print('The scheduled prerelease time has not arrived; no publication attempted.')
        return
    tests = sorted(str(path) for path in Path('tests').glob('*.test.mjs') if path.is_file())
    if not tests:
        raise RuntimeError('No regression tests found; publication stopped.')
    for command in [
        ['node', '--test', *tests], ['node', 'scripts/check-userscripts.mjs'],
        ['node', 'scripts/check-documentation.mjs'], ['git', 'diff', '--check'],
    ]:
        subprocess.run(command, check=True, timeout=180)
    verify_bytes(local_bytes(), spec)
    stable_id = publication_policy()
    merged_candidate(version, commit)
    with tempfile.TemporaryDirectory() as folder:
        prerequisite(version, folder)
        ref, release, assets = inspect_release(version, commit, folder)
        publication_policy(stable_id)
        if not ref:
            api_write(f'repos/{REPOSITORY}/git/refs', 'POST',
                      {'ref': 'refs/tags/v' + version, 'sha': commit})
        if not release:
            notes = Path(folder) / 'release-notes.md'
            notes.write_text(release_body(version, commit), encoding='utf-8')
            gh('release', 'create', 'v' + version, str(SOURCE), '--repo', REPOSITORY,
               '--verify-tag', '--target', commit, '--title', release_title(version),
               '--notes-file', str(notes), '--draft', '--prerelease', '--latest=false')
        elif not assets:
            gh('release', 'upload', 'v' + version, str(SOURCE), '--repo', REPOSITORY)
        ref, release, assets = inspect_release(version, commit, folder)
        if not ref or not release or not assets:
            raise RuntimeError('The prepared draft, tag, or verified asset is missing.')
        publication_policy(stable_id)
        prerequisite(version, folder)
        if release['draft']:
            api_write(f"repos/{REPOSITORY}/releases/{release['id']}", 'PATCH', {
                'tag_name': 'v' + version, 'name': release_title(version),
                'body': release_body(version, commit), 'draft': False,
                'prerelease': True, 'make_latest': 'false',
            })
        inspect_release(version, commit, folder, require_published=True)
        publication_policy(stable_id)
    print(f'Verified prerelease: https://github.com/{REPOSITORY}/releases/tag/v{version}; stable Latest remains {STABLE_TAG}.')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired,
            ValueError, KeyError, TypeError) as error:
        detail = error.stderr if isinstance(error, subprocess.CalledProcessError) else str(error)
        raise SystemExit(f'Scheduled prerelease publication stopped: {detail or error}') from error
