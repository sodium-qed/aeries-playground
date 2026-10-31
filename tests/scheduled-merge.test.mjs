import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import test from 'node:test';

const merger = fileURLToPath(new URL('../scripts/merge-prepared-release.py', import.meta.url));

// Exercise the actual controller and its remote validators with invented GitHub
// responses. Combination/publication subprocesses get independent tests below.
// No request, checkout, merge, publisher, or other external process can run here.
const harness = String.raw`
import base64, contextlib, copy, hashlib, importlib.util, io, json, os, sys
from datetime import datetime, timezone
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('merger', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
scenario = sys.argv[2]
head, base, merged_sha, changed = 'a' * 40, 'b' * 40, 'c' * 40, 'd' * 40
source = b'// Synthetic reviewed source\n'
p.PR_NUMBER = 17
p.EXPECTED_HEAD_SHA = head
p.EXPECTED_SOURCE_SHA256 = hashlib.sha256(source).hexdigest()
p.EXPECTED_SOURCE_SIZE = len(source)
os.environ.update(GITHUB_ACTIONS='true', GITHUB_REPOSITORY=p.REPOSITORY,
                  GITHUB_REF='refs/heads/main', GITHUB_EVENT_NAME='schedule')
now = p.LAUNCH_TIME
if scenario == 'before-time': now = datetime(2026, 11, 2, 7, 58, 59, tzinfo=timezone.utc)
if scenario == 'window-end': now = p.SCHEDULE_WINDOW_END
if scenario == 'next-year': now = datetime(2027, 11, 2, 7, 59, tzinfo=timezone.utc)
if scenario == 'manual-recovery-late':
    os.environ['GITHUB_EVENT_NAME'] = 'workflow_dispatch'
    now = datetime(2026, 11, 4, 8, 0, tzinfo=timezone.utc)
for case, (key, value) in {
    'wrong-repository': ('GITHUB_REPOSITORY', 'somebody/fork'),
    'wrong-event': ('GITHUB_EVENT_NAME', 'push'),
    'wrong-ref': ('GITHUB_REF', 'refs/heads/other'),
    'not-actions': ('GITHUB_ACTIONS', 'false'),
}.items():
    if scenario == case: os.environ[key] = value
if scenario == 'unpinned': p.EXPECTED_HEAD_SHA = 'REPLACE_WITH_REVIEWED_PR_HEAD'
if scenario == 'unprepared-source': p.EXPECTED_SOURCE_SHA256 = 'REPLACE_WITH_FINAL_SHA256'
pr = {'number': p.PR_NUMBER, 'state': 'open', 'draft': False, 'merged': False,
      'mergeable': True, 'mergeable_state': 'clean', 'merge_commit_sha': None,
      'head': {'ref': p.HEAD_BRANCH, 'sha': head, 'repo': {'full_name': p.REPOSITORY}},
      'base': {'ref': 'main', 'sha': base, 'repo': {'full_name': p.REPOSITORY}}}
if scenario == 'wrong-head': pr['head']['sha'] = changed
if scenario == 'wrong-branch': pr['head']['ref'] = 'unrelated-change'
if scenario == 'foreign-head-repo': pr['head']['repo']['full_name'] = 'somebody/fork'
if scenario == 'draft': pr['draft'] = True
if scenario == 'closed': pr['state'] = 'closed'
if scenario == 'conflict': pr.update(mergeable=False, mergeable_state='dirty')
if scenario == 'pending-mergeability': pr.update(mergeable=None, mergeable_state='unknown')
if scenario in {'already-merged', 'already-merged-wrong-head', 'already-merged-wrong-parent', 'already-merged-squash'}:
    pr.update(merged=True, state='closed', merge_commit_sha=merged_sha)
    if scenario == 'already-merged-wrong-head': pr['head']['sha'] = changed
calls, writes, combined, published, errors = [], [], [], [], []
pr_reads, base_reads, check_reads, review_reads, publish_attempts, latest_reads = 0, 0, 0, 0, 0, 0
path = f'repos/{p.REPOSITORY}/pulls/{p.PR_NUMBER}'

def api(route, method='GET', payload=None, paginate=False):
    global pr_reads, base_reads, check_reads, review_reads, latest_reads
    calls.append([route, method, paginate])
    if route == path and method == 'GET':
        pr_reads += 1
        result = copy.deepcopy(pr)
        if scenario in {'concurrent-merge', 'concurrent-wrong-base'} and pr_reads >= 2:
            result.update(merged=True, state='closed', merge_commit_sha=merged_sha)
        if scenario == 'head-race' and pr_reads >= 2: result['head']['sha'] = changed
        if scenario == 'confirmation-missing' and pr_reads >= 3: result['merged'] = False
        if scenario == 'confirmation-wrong-sha' and pr_reads >= 3: result['merge_commit_sha'] = changed
        return result
    if route == path + '/merge':
        assert method == 'PUT' and payload['sha'] == head and payload['merge_method'] == 'merge', (method, payload)
        assert combined == [[base, head]], combined
        assert check_reads == 2 and review_reads == 2 and base_reads == 2, calls
        writes.append(copy.deepcopy(payload))
        if scenario == 'merge-rejected': return {'merged': False, 'message': 'blocked'}
        pr.update(merged=True, state='closed', merge_commit_sha=merged_sha)
        return {'merged': True, 'sha': merged_sha}
    if '/contents/' in route:
        assert route.endswith('?ref=' + head)
        content = source + b'changed' if scenario == 'source-mismatch' else source
        return {'type': 'file', 'encoding': 'base64', 'content': base64.b64encode(content).decode()}
    if route.endswith('/git/ref/heads/main'):
        base_reads += 1
        return {'object': {'type': 'commit', 'sha': changed if scenario == 'base-race' and base_reads >= 2 else base}}
    if route.endswith('/reviews?per_page=100'):
        assert paginate
        review_reads += 1
        reviews = []
        if scenario in {'changes-requested', 'comment-does-not-clear-review', 'approved-later', 'dismissed-review'} or scenario == 'late-review' and review_reads >= 2:
            reviews = [{'id': 1, 'user': {'login': 'reviewer'}, 'state': 'CHANGES_REQUESTED'}]
        if scenario == 'comment-does-not-clear-review': reviews.append({'id': 2, 'user': {'login': 'reviewer'}, 'state': 'COMMENTED'})
        if scenario == 'approved-later': reviews.append({'id': 2, 'user': {'login': 'reviewer'}, 'state': 'APPROVED'})
        if scenario == 'dismissed-review': reviews.append({'id': 2, 'user': {'login': 'reviewer'}, 'state': 'DISMISSED'})
        return [[], reviews]
    if '/check-runs?' in route:
        assert paginate and 'filter=latest' in route
        check_reads += 1
        checks = [{'name': p.REQUIRED_CHECK_NAME, 'head_sha': head, 'status': 'completed', 'conclusion': 'success'}]
        if scenario == 'missing-check': checks = []
        if scenario == 'failed-check' or scenario == 'late-check' and check_reads >= 2: checks[0]['conclusion'] = 'failure'
        if scenario == 'pending-check': checks[0].update(status='in_progress', conclusion=None)
        if scenario == 'foreign-check': checks[0]['head_sha'] = changed
        if scenario == 'skipped-check': checks[0]['conclusion'] = 'skipped'
        return [{'check_runs': []}, {'check_runs': checks}]
    if route.endswith('/status'):
        return {'sha': changed if scenario == 'wrong-status-sha' else head,
                'total_count': 1, 'state': 'failure' if scenario == 'failed-status' else 'pending' if scenario == 'pending-status' else 'success'}
    if route.endswith('/git/commits/' + merged_sha):
        parents = [{'sha': changed if scenario in {'postmerge-base-race', 'concurrent-wrong-base'} else base}, {'sha': changed if scenario == 'already-merged-wrong-parent' else head}]
        if scenario == 'already-merged-squash': parents.pop()
        return {'sha': merged_sha, 'parents': parents}
    if route.endswith('/releases/tags/v3.0.0'):
        return {'id': 1, 'tag_name': 'v3.0.0', 'draft': scenario == 'previous-stable-draft', 'prerelease': scenario == 'previous-stable-prerelease'}
    if route.endswith('/releases/latest'):
        latest_reads += 1
        other_latest = scenario == 'latest-changed' or scenario == 'late-latest-change' and latest_reads >= 2
        return {'id': 9 if other_latest else 1, 'tag_name': 'v4.0.0' if other_latest else 'v3.0.0', 'draft': False, 'prerelease': scenario == 'latest-prerelease'}
    if route.endswith('/releases?per_page=100'):
        assert paginate
        return [[], [{'id': 3, 'tag_name': 'v3.1.0', 'draft': True}]] if scenario == 'existing-release' else [[]]
    if '/git/matching-refs/tags/v3.1.0' in route:
        assert paginate
        return [[{'ref': 'refs/tags/v3.1.0', 'object': {'type': 'commit', 'sha': changed}}]] if scenario == 'existing-tag' else [[]]
    raise AssertionError('Unexpected API route: ' + route)

def validate_combination(base_sha, head_sha):
    combined.append([base_sha, head_sha])
    if scenario == 'combined-tests-fail': raise RuntimeError('Synthetic combined check failed')

def publish_merged(sha):
    global publish_attempts
    publish_attempts += 1
    assert sha == merged_sha, sha
    if scenario == 'recover-after-publication-failure' and publish_attempts == 1:
        raise RuntimeError('Synthetic transient publication failure')
    published.append(sha)

def forbidden(*args, **kwargs):
    raise AssertionError('Controller escaped local test harness')

p.api = api
p.validate_combination = validate_combination
p.publish_merged = publish_merged
p.subprocess.run = forbidden
def once():
    try:
        with contextlib.redirect_stdout(io.StringIO()): p.main(now=now)
    except RuntimeError as error: errors.append(str(error))
once()
if scenario in {'idempotent', 'recover-after-publication-failure'}: once()
print(json.dumps({'errors': errors, 'calls': calls, 'writes': writes, 'combined': combined,
                  'published': published, 'publish_attempts': publish_attempts}))
`;

function python(source, scenario = '') {
  const result = spawnSync('python3', ['-c', source, merger, scenario], {
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('scheduled merge has the exact post-DST deadline and a bounded automatic window', () => {
  const config = python(String.raw`
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('merger', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
print(json.dumps({'repository': p.REPOSITORY, 'branch': p.HEAD_BRANCH, 'launch': p.LAUNCH_TIME.isoformat(), 'end': p.SCHEDULE_WINDOW_END.isoformat()}))
`);
  assert.deepEqual(config, {
    repository: 'sodium-qed/aeries-playground',
    branch: 'release/unify-developer-public-3.1.0',
    launch: '2026-11-02T07:59:00+00:00',
    end: '2026-11-03T07:59:00+00:00',
  });
});

for (const scenario of ['before-time', 'window-end', 'next-year']) {
  test(`scheduled merge skips ${scenario} before any external action`, () => {
    const result = python(harness, scenario);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.calls, []);
    assert.deepEqual(result.writes, []);
    assert.deepEqual(result.published, []);
  });
}

for (const scenario of ['fresh', 'manual-recovery-late', 'approved-later', 'dismissed-review']) {
  test(`scheduled merge validates both sides and publishes the exact merge for ${scenario}`, () => {
    const result = python(harness, scenario);
    assert.deepEqual(result.errors, []);
    assert.equal(result.writes.length, 1);
    assert.equal(result.writes[0].sha, 'a'.repeat(40));
    assert.equal(result.writes[0].merge_method, 'merge');
    assert.deepEqual(result.combined, [['b'.repeat(40), 'a'.repeat(40)]]);
    assert.deepEqual(result.published, ['c'.repeat(40)]);
  });
}

for (const scenario of ['wrong-repository', 'wrong-event', 'wrong-ref', 'not-actions', 'unpinned', 'unprepared-source', 'wrong-head', 'wrong-branch', 'foreign-head-repo', 'draft', 'closed', 'conflict', 'pending-mergeability', 'source-mismatch', 'changes-requested', 'comment-does-not-clear-review', 'missing-check', 'failed-check', 'pending-check', 'foreign-check', 'skipped-check', 'failed-status', 'pending-status', 'wrong-status-sha', 'combined-tests-fail', 'head-race', 'base-race', 'late-check', 'late-review', 'already-merged-wrong-head', 'previous-stable-draft', 'previous-stable-prerelease', 'latest-prerelease', 'latest-changed', 'late-latest-change', 'existing-release', 'existing-tag', 'already-merged-wrong-parent', 'already-merged-squash', 'concurrent-wrong-base']) {
  test(`scheduled merge blocks ${scenario} without a merge or publication`, () => {
    const result = python(harness, scenario);
    assert.equal(result.errors.length, 1, JSON.stringify(result));
    assert.deepEqual(result.writes, []);
    assert.deepEqual(result.published, []);
  });
}

for (const scenario of ['merge-rejected', 'postmerge-base-race', 'confirmation-missing', 'confirmation-wrong-sha']) {
  test(`scheduled merge stops publication when ${scenario}`, () => {
    const result = python(harness, scenario);
    assert.equal(result.errors.length, 1, JSON.stringify(result));
    assert.equal(result.writes.length, 1);
    assert.deepEqual(result.published, []);
  });
}

test('an already merged approved PR recovers its original release without merging again', () => {
  const result = python(harness, 'already-merged');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.writes, []);
  assert.deepEqual(result.combined, []);
  assert.deepEqual(result.published, ['c'.repeat(40)]);
});

test('a concurrent approved merge is verified against the tested base before publication', () => {
  const result = python(harness, 'concurrent-merge');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.writes, []);
  assert.deepEqual(result.combined, [['b'.repeat(40), 'a'.repeat(40)]]);
  assert.deepEqual(result.published, ['c'.repeat(40)]);
});

test('a completed run is idempotent with respect to the repository merge', () => {
  const result = python(harness, 'idempotent');
  assert.deepEqual(result.errors, []);
  assert.equal(result.writes.length, 1);
  assert.deepEqual(result.published, ['c'.repeat(40), 'c'.repeat(40)]);
});

test('publication recovery never remerges an already merged PR', () => {
  const result = python(harness, 'recover-after-publication-failure');
  assert.equal(result.errors.length, 1);
  assert.equal(result.writes.length, 1);
  assert.equal(result.publish_attempts, 2);
  assert.deepEqual(result.published, ['c'.repeat(40)]);
});

const helperHarness = String.raw`
import contextlib, hashlib, importlib.util, io, json, os, subprocess, sys, tempfile
from pathlib import Path
from types import SimpleNamespace
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('merger', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
scenario = sys.argv[2]
source = b'// Synthetic reviewed source\n'
p.EXPECTED_SOURCE_SHA256 = hashlib.sha256(source).hexdigest()
p.EXPECTED_SOURCE_SIZE = len(source)
head, base, merged_sha = 'a' * 40, 'b' * 40, 'c' * 40
calls, errors = [], []
os.environ.update(GITHUB_REPOSITORY=p.REPOSITORY, GITHUB_REF='refs/heads/main',
                  GITHUB_EVENT_NAME='schedule', GITHUB_SHA='d' * 40,
                  SYNTHETIC_INHERITED_SETTING='retained')
def run(args, check=True, **kwargs):
    assert isinstance(args, list), args
    entry = {'args': args, 'check': check}
    if 'timeout' in kwargs: entry['timeout'] = kwargs['timeout']
    if 'env' in kwargs:
        env = kwargs['env']
        entry['env'] = {key: env.get(key) for key in ['GITHUB_REPOSITORY', 'GITHUB_REF', 'GITHUB_EVENT_NAME', 'GITHUB_SHA', 'SYNTHETIC_INHERITED_SETTING']}
    calls.append(entry)
    if args == ['python3', 'scripts/publish-scheduled-prereleases.py'] and scenario == 'publication-fails':
        raise subprocess.CalledProcessError(1, args, stderr='synthetic publication failure')
    if args[:2] == ['python3', 'scripts/record-merge-completion.py'] and scenario == 'completion-fails':
        raise subprocess.CalledProcessError(1, args, stderr='synthetic completion failure')
    if args[:2] == ['node', '--test']:
        if scenario == 'failing-tests': raise subprocess.CalledProcessError(1, args, stderr='synthetic failure')
        if scenario == 'changed-during-tests': p.SOURCE.write_bytes(source + b'changed')
    return SimpleNamespace(returncode=0, stdout='', stderr='')
def forbidden(*args, **kwargs): raise AssertionError('Helper escaped local harness')
p.run = run
p.subprocess.run = forbidden
with tempfile.TemporaryDirectory() as folder:
    os.chdir(folder)
    p.SOURCE.write_bytes(source)
    Path('tests').mkdir()
    if scenario != 'missing-tests':
        Path('tests/z.test.mjs').write_text('// synthetic')
        Path('tests/a.test.mjs').write_text('// synthetic')
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            if scenario in {'publication', 'publication-fails', 'completion-fails'}: p.publish_merged(merged_sha)
            else: p.validate_combination(base, head)
    except (RuntimeError, subprocess.CalledProcessError) as error: errors.append(str(error))
print(json.dumps({'calls': calls, 'errors': errors}))
`;

test('prospective merge runs every suite and both tree whitespace checks before cleanup', () => {
  const result = python(helperHarness, 'combination');
  assert.deepEqual(result.errors, []);
  const commands = result.calls.map(call => call.args);
  assert.deepEqual(commands[0], ['git', 'fetch', '--no-tags', 'https://github.com/sodium-qed/aeries-playground.git', 'b'.repeat(40)]);
  assert.deepEqual(commands[1], ['git', 'checkout', '--detach', '--force', 'b'.repeat(40)]);
  assert.deepEqual(commands[2], ['git', 'fetch', '--no-tags', 'https://github.com/sodium-qed/aeries-playground.git', 'a'.repeat(40)]);
  assert.ok(commands.some(args => args.includes('merge') && args.includes('--no-commit') && args.at(-1) === 'a'.repeat(40)));
  assert.deepEqual(commands.slice(-6), [
    ['node', '--test', 'tests/a.test.mjs', 'tests/z.test.mjs'],
    ['node', 'scripts/check-userscripts.mjs'],
    ['node', 'scripts/check-documentation.mjs'],
    ['git', 'diff', '--check'],
    ['git', 'diff', '--cached', '--check'],
    ['git', 'merge', '--abort'],
  ]);
  assert.equal(result.calls.at(-1).check, false);
  assert.ok(commands.every(args => !args.includes('push')));
});

for (const scenario of ['failing-tests', 'missing-tests', 'changed-during-tests']) {
  test(`prospective merge fails ${scenario} and always aborts its disposable local merge`, () => {
    const result = python(helperHarness, scenario);
    assert.equal(result.errors.length, 1);
    assert.deepEqual(result.calls.at(-1).args, ['git', 'merge', '--abort']);
    assert.equal(result.calls.at(-1).check, false);
    assert.ok(result.calls.every(call => call.args[0] !== 'gh' && call.args[0] !== 'python3'));
  });
}

test('inline publication checks out the exact merged commit and records completion only after success', () => {
  const result = python(helperHarness, 'publication');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.calls.map(call => call.args), [
    ['git', 'fetch', '--no-tags', 'https://github.com/sodium-qed/aeries-playground.git', 'c'.repeat(40)],
    ['git', 'checkout', '--detach', '--force', 'c'.repeat(40)],
    ['python3', 'scripts/publish-scheduled-prereleases.py'],
    ['python3', 'scripts/record-merge-completion.py', 'c'.repeat(40),
      createHash('sha256').update('// Synthetic reviewed source\n').digest('hex'), '29'],
  ]);
  assert.deepEqual(result.calls[2].env, {
    GITHUB_REPOSITORY: 'sodium-qed/aeries-playground',
    GITHUB_REF: 'refs/heads/main',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_SHA: 'c'.repeat(40),
    SYNTHETIC_INHERITED_SETTING: 'retained',
  });
  assert.deepEqual(result.calls[3].env, result.calls[2].env);
  assert.equal(result.calls[2].timeout, 900);
});

test('failed publication cannot record successful completion or close the tracking issue', () => {
  const result = python(helperHarness, 'publication-fails');
  assert.equal(result.errors.length, 1);
  assert.equal(result.calls.length, 3);
  assert.deepEqual(result.calls.at(-1).args, ['python3', 'scripts/publish-scheduled-prereleases.py']);
});

test('completion failure reports the verified release as a partial outcome without merging again', () => {
  const result = python(helperHarness, 'completion-fails');
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /Merge and release verified, but completion documentation\/issue updates remain pending/);
  assert.equal(result.calls.length, 4);
  assert.equal(result.calls.filter(call => call.args[1] === 'scripts/publish-scheduled-prereleases.py').length, 1);
  assert.equal(result.calls.filter(call => call.args[1] === 'scripts/record-merge-completion.py').length, 1);
});

test('scheduled workflow uses the intended UTC cron, safe recovery, and inline publisher path', async () => {
  const workflow = await readFile(new URL('../.github/workflows/scheduled-merge.yml', import.meta.url), 'utf8');
  assert.match(workflow, /cron: '59 7 2 11 \*'/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /github\.repository == 'sodium-qed\/aeries-playground' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /group: aeries-playground-3-1-release/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /node-version: '24'/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /run: python3 scripts\/merge-prepared-release\.py/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\.|--admin|--clobber/);
});
