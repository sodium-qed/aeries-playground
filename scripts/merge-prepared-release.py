"""Merge one reviewed 3.1.0 PR at its deadline and publish its exact merge commit.

The annual Actions cron is bounded to the intended 2026 launch window. A manual
run can recover a delayed/partial run. GITHUB_TOKEN merges do not start another
push workflow, so publication runs inline at the exact verified merge commit.
"""

from datetime import datetime, timezone
from pathlib import Path
import base64
import hashlib
import json
import os
import re
import subprocess

REPOSITORY = 'sodium-qed/aeries-playground'
PR_NUMBER = 10
HEAD_BRANCH = 'release/unify-developer-public-3.1.0'
EXPECTED_HEAD_SHA = '858a0a1fac820163d1185664baa039624767928e'
EXPECTED_SOURCE_SHA256 = '5e37b76082308c0eb0f2bc1e472cb33bc4bd3b360a713ddbf8e192c655b33773'
EXPECTED_SOURCE_SIZE = 379864
REQUIRED_CHECK_NAME = 'Validate userscript repository'
SOURCE = Path('aeries-playground.user.js')
# Sunday, November 1, 2026 at 23:59 America/Los_Angeles, after DST ends.
LAUNCH_TIME = datetime(2026, 11, 2, 7, 59, tzinfo=timezone.utc)
SCHEDULE_WINDOW_END = datetime(2026, 11, 3, 7, 59, tzinfo=timezone.utc)


def run(args, check=True, timeout=180, **kwargs):
    return subprocess.run(args, check=check, text=True, capture_output=True,
                          timeout=timeout, **kwargs)


def api(path, method='GET', payload=None, paginate=False):
    args = ['gh', 'api', path]
    if paginate:
        args += ['--paginate', '--slurp']
    if method != 'GET':
        args += ['--method', method, '--input', '-']
    result = run(args, input=json.dumps(payload) if payload is not None else None)
    return json.loads(result.stdout)


def entries(path, key=None):
    pages = api(path, paginate=True)
    if not isinstance(pages, list):
        raise RuntimeError('Unexpected paginated GitHub response.')
    result = []
    for page in pages:
        items = page.get(key) if key and isinstance(page, dict) else page
        if not isinstance(items, list):
            raise RuntimeError('Unexpected GitHub page contents.')
        result.extend(items)
    return result


def checked_sha(value, label):
    if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{40}', value):
        raise RuntimeError(f'{label} is not a valid commit SHA.')
    return value


def verify_bytes(data):
    if len(data) != EXPECTED_SOURCE_SIZE or hashlib.sha256(data).hexdigest() != EXPECTED_SOURCE_SHA256:
        raise RuntimeError('Userscript bytes differ from the reviewed integration.')


def verify_source_file():
    if not SOURCE.is_file() or SOURCE.is_symlink():
        raise RuntimeError('Reviewed userscript is not an ordinary file.')
    verify_bytes(SOURCE.read_bytes())


def verify_remote_source(sha):
    data = api(f'repos/{REPOSITORY}/contents/{SOURCE.name}?ref={sha}')
    if data.get('type') != 'file' or data.get('encoding') != 'base64':
        raise RuntimeError('Candidate source is not an ordinary GitHub file.')
    verify_bytes(base64.b64decode(data['content']))


def validate_pr(pr):
    if (pr.get('number') != PR_NUMBER or pr.get('base', {}).get('ref') != 'main'
            or pr.get('base', {}).get('repo', {}).get('full_name') != REPOSITORY
            or pr.get('head', {}).get('ref') != HEAD_BRANCH
            or pr.get('head', {}).get('repo', {}).get('full_name') != REPOSITORY):
        raise RuntimeError('PR identity or branch differs from the prepared integration.')
    if pr['head'].get('sha') != EXPECTED_HEAD_SHA:
        raise RuntimeError('The integration head changed; review and repin before retrying.')
    if pr.get('merged'):
        return
    if pr.get('state') != 'open' or pr.get('draft'):
        raise RuntimeError('The integration PR is closed or still a draft.')
    if pr.get('mergeable') is not True or pr.get('mergeable_state') != 'clean':
        raise RuntimeError('The integration is conflicting, blocked, or not yet confirmed mergeable.')


def validate_reviews_and_checks():
    reviews = entries(f'repos/{REPOSITORY}/pulls/{PR_NUMBER}/reviews?per_page=100')
    latest = {}
    for review in sorted(reviews, key=lambda item: item.get('id', 0)):
        if review.get('state') in {'APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'}:
            login = review.get('user', {}).get('login')
            if not login:
                raise RuntimeError('A decisive review has no reviewer identity.')
            latest[login] = review['state']
    if 'CHANGES_REQUESTED' in latest.values():
        raise RuntimeError('An unresolved request for changes blocks the scheduled merge.')
    checks = entries(f'repos/{REPOSITORY}/commits/{EXPECTED_HEAD_SHA}/check-runs?per_page=100&filter=latest', 'check_runs')
    if not any(check.get('name') == REQUIRED_CHECK_NAME for check in checks):
        raise RuntimeError('The required repository check is absent.')
    if any(check.get('head_sha') != EXPECTED_HEAD_SHA or check.get('status') != 'completed'
           or check.get('conclusion') != 'success' for check in checks):
        raise RuntimeError('A candidate check failed, is pending, or belongs to another commit.')
    status = api(f'repos/{REPOSITORY}/commits/{EXPECTED_HEAD_SHA}/status')
    if status.get('sha') != EXPECTED_HEAD_SHA:
        raise RuntimeError('Commit status belongs to another revision.')
    if status.get('total_count', 0) and status.get('state') != 'success':
        raise RuntimeError('A commit status is failing or pending.')


def base_head():
    ref = api(f'repos/{REPOSITORY}/git/ref/heads/main')
    if ref.get('object', {}).get('type') != 'commit':
        raise RuntimeError('The main branch does not point to a commit.')
    return checked_sha(ref['object'].get('sha'), 'Main head')


def preflight_release():
    stable = api(f'repos/{REPOSITORY}/releases/tags/v3.0.0')
    if stable.get('tag_name') != 'v3.0.0' or stable.get('draft') is not False or stable.get('prerelease') is not False:
        raise RuntimeError('The previous stable release is missing or has unexpected metadata.')
    latest = api(f'repos/{REPOSITORY}/releases/latest')
    if latest.get('id') != stable.get('id') or latest.get('tag_name') != 'v3.0.0':
        raise RuntimeError('Latest changed before integration; preserve that release and review the plan.')
    releases = entries(f'repos/{REPOSITORY}/releases?per_page=100')
    if any(release.get('tag_name') == 'v3.1.0' for release in releases):
        raise RuntimeError('A 3.1.0 release already exists before this PR merged; review it first.')
    refs = entries(f'repos/{REPOSITORY}/git/matching-refs/tags/v3.1.0')
    if any(ref.get('ref') == 'refs/tags/v3.1.0' for ref in refs):
        raise RuntimeError('A 3.1.0 tag already exists before this PR merged; it will not be moved.')


def verify_merge_commit(merge_sha, expected_base=None):
    actual = api(f'repos/{REPOSITORY}/git/commits/{merge_sha}')
    parents = [item.get('sha') for item in actual.get('parents', [])]
    if len(parents) != 2 or parents[1] != EXPECTED_HEAD_SHA:
        raise RuntimeError('The merged commit does not contain the reviewed head as its second parent.')
    checked_sha(parents[0], 'Merged base parent')
    if expected_base is not None and parents[0] != expected_base:
        raise RuntimeError('Merge completed against an unexpected base; publication stopped for review.')


def checkout_commit(sha):
    checked_sha(sha, 'Checkout target')
    run(['git', 'fetch', '--no-tags', f'https://github.com/{REPOSITORY}.git', sha])
    run(['git', 'checkout', '--detach', '--force', sha])


def validate_combination(base_sha, head_sha):
    checkout_commit(base_sha)
    run(['git', 'fetch', '--no-tags', f'https://github.com/{REPOSITORY}.git', head_sha])
    try:
        run(['git', '-c', 'user.name=Aeries Playground scheduled merge',
             '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
             'merge', '--no-commit', '--no-ff', head_sha])
        verify_source_file()
        tests = sorted(str(path) for path in Path('tests').glob('*.test.mjs') if path.is_file())
        if not tests:
            raise RuntimeError('No regression tests were found in the combined tree.')
        for command in [
            ['node', '--test', *tests],
            ['node', 'scripts/check-userscripts.mjs'],
            ['node', 'scripts/check-documentation.mjs'],
            ['git', 'diff', '--check'],
            ['git', 'diff', '--cached', '--check'],
        ]:
            result = run(command)
            if result.stdout:
                print(result.stdout, end='')
        verify_source_file()
    finally:
        # The checkout is disposable. Abort the local trial merge; never push it.
        run(['git', 'merge', '--abort'], check=False)


def publish_merged(merge_sha):
    checkout_commit(merge_sha)
    verify_source_file()
    # GITHUB_TOKEN does not start release.yml after merge. Its publisher runs at
    # the exact merge commit here, never by dispatching a moving main reference.
    env = dict(os.environ, GITHUB_REPOSITORY=REPOSITORY, GITHUB_SHA=merge_sha,
               GITHUB_REF='refs/heads/main', GITHUB_EVENT_NAME='workflow_dispatch')
    result = run(['python3', 'scripts/publish-release.py'], env=env, timeout=900)
    if result.stdout:
        print(result.stdout, end='')
    try:
        completion = run(['python3', 'scripts/record-merge-completion.py', merge_sha,
                          EXPECTED_SOURCE_SHA256, str(EXPECTED_SOURCE_SIZE)], env=env)
        if completion.stdout:
            print(completion.stdout, end='')
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        detail = error.stderr if isinstance(error, subprocess.CalledProcessError) else str(error)
        raise RuntimeError('Merge and release verified, but completion documentation/issue updates '
                           f'remain pending: {detail or error}') from error


def main(now=None):
    event = os.environ.get('GITHUB_EVENT_NAME')
    if (os.environ.get('GITHUB_ACTIONS') != 'true'
            or os.environ.get('GITHUB_REPOSITORY') != REPOSITORY
            or os.environ.get('GITHUB_REF') != 'refs/heads/main'
            or event not in {'schedule', 'workflow_dispatch'}):
        raise RuntimeError('This operation requires the intended main-branch Actions workflow.')
    current = now or datetime.now(timezone.utc)
    if current < LAUNCH_TIME or event == 'schedule' and current >= SCHEDULE_WINDOW_END:
        print('Outside the one-time scheduled merge window; no GitHub changes attempted.')
        return
    if (not isinstance(PR_NUMBER, int) or PR_NUMBER <= 0
            or not re.fullmatch(r'[0-9a-f]{40}', EXPECTED_HEAD_SHA)
            or not re.fullmatch(r'[0-9a-f]{64}', EXPECTED_SOURCE_SHA256)
            or not isinstance(EXPECTED_SOURCE_SIZE, int) or EXPECTED_SOURCE_SIZE <= 0):
        raise RuntimeError('The reviewed PR/head/source fingerprint has not been pinned.')
    pr_path = f'repos/{REPOSITORY}/pulls/{PR_NUMBER}'
    pr = api(pr_path)
    validate_pr(pr)
    verify_remote_source(EXPECTED_HEAD_SHA)
    if pr.get('merged'):
        merge_sha = checked_sha(pr.get('merge_commit_sha'), 'Existing merge commit')
        verify_merge_commit(merge_sha)
        print(f'PR #{PR_NUMBER} is already merged; verify/recover its exact release commit.')
        # The publisher reruns every check on this actual merged tree before
        # recovering publication, even when a previous attempt stopped earlier.
        publish_merged(merge_sha)
        return
    original_base = base_head()
    preflight_release()
    validate_reviews_and_checks()
    validate_combination(original_base, EXPECTED_HEAD_SHA)
    # Repeat remote gates after testing; the API also leases the candidate head.
    pr = api(pr_path)
    validate_pr(pr)
    if pr.get('merged'):
        merge_sha = checked_sha(pr.get('merge_commit_sha'), 'Concurrent merge commit')
        verify_merge_commit(merge_sha, original_base)
        publish_merged(merge_sha)
        return
    validate_reviews_and_checks()
    preflight_release()
    if base_head() != original_base:
        raise RuntimeError('Main changed during validation; revalidate the combined result on retry.')
    # REST has no atomic base-SHA lease. Verify actual parents after merge,
    # before release publication; GitHub branch protection still applies.
    merged = api(f'{pr_path}/merge', method='PUT', payload={
        'sha': EXPECTED_HEAD_SHA, 'merge_method': 'merge',
        'commit_title': 'Merge reviewed Developer/public integration for 3.1.0',
    })
    if merged.get('merged') is not True:
        raise RuntimeError('GitHub did not confirm the merge; nothing was force-merged.')
    merge_sha = checked_sha(merged.get('sha'), 'Merge result')
    verify_merge_commit(merge_sha, original_base)
    confirmed = api(pr_path)
    validate_pr(confirmed)
    if not confirmed.get('merged') or confirmed.get('merge_commit_sha') != merge_sha:
        raise RuntimeError('Merge completion was not confirmed; inspect the PR before recovery.')
    publish_merged(merge_sha)
    print(f'PR #{PR_NUMBER} merged and its exact release commit was verified: {merge_sha}')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError, KeyError) as error:
        detail = error.stderr if isinstance(error, subprocess.CalledProcessError) else str(error)
        raise SystemExit(f'Scheduled merge/release stopped: {detail or error}') from error
