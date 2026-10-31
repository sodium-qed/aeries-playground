import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const publisher = fileURLToPath(new URL('../scripts/publish-release.py', import.meta.url));

// Run the real publisher against a fully local GitHub/CLI model. No subprocess
// from the publisher may reach a shell, GitHub, Node, Git, or the network here.
const harness = String.raw`
import base64, contextlib, hashlib, importlib.util, io, json, os, subprocess, sys, tempfile
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('publisher', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
scenario = sys.argv[2]
commit = 'a' * 40
other_commit = 'b' * 40
source = b'// ==UserScript==\n// @name Synthetic\n// @version 3.1.1\n// @description Fictional release fixture\n// @match https://example.invalid/*\n// ==/UserScript==\n(() => {})();\n'
if scenario == 'wrong-version': source = source.replace(b'@version 3.1.1', b'@version 2.4.0')
if scenario == 'comment-version': source = source.replace(b'@version 3.1.1', b'@version 2.4.0') + b'// @version 3.1.1\n'
if scenario == 'duplicate-version': source = source.replace(b'// ==/UserScript==', b'// @version 3.1.1\n// ==/UserScript==')
p.EXPECTED_SHA256 = hashlib.sha256(source).hexdigest()
p.EXPECTED_SIZE = len(source)
expected_body = '# Synthetic release\n\nVerified userscript: ' + str(len(source)) + ' bytes; SHA-256 ' + chr(96) + p.EXPECTED_SHA256 + chr(96) + '.\n'
os.environ.update(GITHUB_REPOSITORY=p.REPOSITORY, GITHUB_SHA=commit, GITHUB_REF='refs/heads/main', GITHUB_EVENT_NAME='workflow_dispatch')
for key, value in {'wrong-repo': ('GITHUB_REPOSITORY', 'somebody/fork'), 'wrong-ref': ('GITHUB_REF', 'refs/heads/other'), 'wrong-event': ('GITHUB_EVENT_NAME', 'pull_request'), 'invalid-sha': ('GITHUB_SHA', 'main')}.items():
    if scenario == key: os.environ[value[0]] = value[1]
if scenario == 'unprepared': p.EXPECTED_SHA256 = 'REPLACE_WITH_FINAL_SHA256'
if scenario == 'push-mismatch': os.environ['GITHUB_EVENT_NAME'] = 'push'
now = p.LAUNCH_TIME
if scenario == 'before-time': now = datetime(2026, 11, 9, 7, 58, 59, tzinfo=timezone.utc)

stable = {'id': 1, 'tag_name': 'v3.1.0', 'draft': False, 'prerelease': False}
newer = {'id': 9, 'tag_name': 'v3.2.0', 'draft': False, 'prerelease': False}
existing_scenarios = {'recovery-draft', 'recovery-missing-asset', 'recovery-draft-missing-tag', 'recovery-annotated-tag', 'recovery-prerelease', 'already-published', 'tag-conflict', 'tag-race', 'tag-tree', 'tag-loop', 'draft-target-conflict', 'asset-size-conflict', 'asset-digest-conflict', 'asset-bytes-conflict', 'asset-state-conflict', 'duplicate-assets', 'duplicate-drafts', 'published-missing-tag', 'second-page-draft', 'second-page-asset-conflict', 'upload-failure', 'download-failure'}
release = None
assets = []
tag = None
if scenario in existing_scenarios:
    tag = {'object': {'type': 'commit', 'sha': commit}}
    release = {'id': 3, 'tag_name': p.TAG, 'target_commitish': commit, 'draft': True, 'prerelease': False, 'name': p.TITLE, 'body': expected_body, 'html_url': 'https://github.com/' + p.REPOSITORY + '/releases/tag/' + p.TAG}
    assets = [{'id': 7, 'name': p.SOURCE.name, 'size': len(source), 'state': 'uploaded', 'digest': 'sha256:' + p.EXPECTED_SHA256}]
if scenario in {'recovery-missing-asset', 'upload-failure'}: assets = []
if scenario in {'recovery-draft-missing-tag', 'published-missing-tag'}: tag = None
if scenario == 'tag-conflict': tag['object']['sha'] = other_commit
if scenario == 'tag-tree': tag['object']['type'] = 'tree'
if scenario in {'recovery-annotated-tag', 'tag-loop'}: tag['object'] = {'type': 'tag', 'sha': 'c' * 40}
if scenario == 'draft-target-conflict': release['target_commitish'] = other_commit
if scenario in {'recovery-prerelease', 'already-published', 'published-missing-tag'}: release['draft'] = False
if scenario == 'recovery-prerelease': release['prerelease'] = True
if scenario == 'asset-size-conflict': assets[0]['size'] += 1
if scenario in {'asset-digest-conflict', 'second-page-asset-conflict'}: assets[0]['digest'] = 'sha256:' + 'd' * 64
if scenario == 'asset-state-conflict': assets[0]['state'] = 'starter'
if scenario == 'duplicate-assets': assets.append(dict(assets[0], id=8))
if scenario == 'stable-corrupt': stable['prerelease'] = True
latest = release if scenario == 'already-published' else newer if scenario == 'latest-conflict' else stable
calls, gates, writes = [], [], []
latest_calls, tag_calls, downloads, fault_count = 0, 0, 0, 0


def result(value=None, status=0, stderr=''):
    return SimpleNamespace(returncode=status, stdout=json.dumps(value) if value is not None else '', stderr=stderr)


def mock_run(args, check=False, **kwargs):
    global tag, release, assets, latest, latest_calls, tag_calls, downloads, fault_count
    calls.append(args)
    if args[0] != 'gh':
        assert args[0] in {'node', 'git'}, args
        gates.append(args)
        if scenario == 'tests-modify-source' and args[:2] == ['node', '--test']:
            p.SOURCE.write_bytes(source + b'changed')
        fail = {'test-failure': ['node', '--test'], 'syntax-failure': ['node', 'scripts/check-userscripts.mjs'], 'documentation-failure': ['node', 'scripts/check-documentation.mjs'], 'whitespace-failure': ['git', 'diff', '--check']}.get(scenario)
        if fail and args[:len(fail)] == fail: raise subprocess.CalledProcessError(1, args)
        return result()
    assert len(gates) == 4, 'GitHub was contacted before all local checks passed'
    assert gates[0] == ['node', '--test', 'tests/first.test.mjs', 'tests/second.test.mjs'], gates
    assert '--clobber' not in args and '--force' not in args, args
    if args[1] == 'api':
        route = args[2]
        if '--method' in args:
            method = args[args.index('--method') + 1]
            payload = json.loads(kwargs['input'])
            if route.endswith('/git/refs'):
                assert method == 'POST' and payload == {'ref': 'refs/tags/v3.1.1', 'sha': commit}, (route, payload)
                assert tag is None, 'Existing tag must never be overwritten'
                tag = {'object': {'type': 'commit', 'sha': commit}}
                writes.append(['tag', payload])
                return result(tag)
            assert route == 'repos/' + p.REPOSITORY + '/releases/3' and method == 'PATCH', (route, method)
            assert downloads and tag and assets, 'Publication requires a verified uploaded asset and tag'
            assert payload['draft'] is False and payload['prerelease'] is False and payload['make_latest'] == 'true', payload
            if scenario == 'publish-failure' and fault_count == 0:
                fault_count += 1
                return result(status=1, stderr='temporary publish failure (HTTP 503)')
            release.update(payload)
            latest = newer if scenario == 'latest-after-publish' else release
            writes.append(['publish', payload])
            return result(release)
        if route.endswith('/releases/tags/v3.1.0'):
            if scenario == 'api-auth-error': return result(status=1, stderr='not authorized (HTTP 403)')
            return result(stable)
        if route.endswith('/releases/latest'):
            latest_calls += 1
            if scenario == 'latest-race' and latest_calls >= 2: latest = newer
            if scenario == 'latest-after-upload' and release is not None: latest = newer
            return result(latest) if latest else result(status=1, stderr='not found (HTTP 404)')
        if '/contents/' in route:
            assert route.endswith('?ref=' + commit), route
            data = source + b'changed' if scenario == 'source-conflict' else source
            return result({'type': 'file', 'encoding': 'base64', 'content': base64.b64encode(data).decode()})
        if '/git/ref/tags/' in route:
            tag_calls += 1
            if scenario == 'tag-race' and tag_calls >= 2: tag['object']['sha'] = other_commit
            return result(tag) if tag else result(status=1, stderr='not found (HTTP 404)')
        if '/git/tags/' in route:
            return result({'object': {'type': 'tag', 'sha': 'c' * 40} if scenario == 'tag-loop' else {'type': 'commit', 'sha': commit}})
        if route.endswith('/releases/tags/v3.1.1'):
            if scenario == 'api-rate-error': return result(status=1, stderr='rate limited (HTTP 429)')
            return result(release) if release and not release['draft'] else result(status=1, stderr='not found (HTTP 404)')
        if route.endswith('/releases?per_page=100'):
            assert '--paginate' in args and '--slurp' in args
            pages = [[], [release]] if release else [[]]
            if scenario == 'duplicate-drafts': pages.append([dict(release, id=4)])
            return result(pages)
        if '/commits/' in route: return result({'sha': release['target_commitish']})
        if route.endswith('/releases/3/assets?per_page=100'):
            assert '--paginate' in args and '--slurp' in args
            return result([[], assets])
        raise AssertionError('Unexpected API call: ' + repr(args))
    assert args[1] == 'release' and args[3] == p.TAG, args
    if args[2] == 'download':
        if scenario == 'download-failure': raise subprocess.CalledProcessError(1, args)
        assert assets, 'An absent asset must not be downloaded'
        data = source[:-1] + b'x' if scenario == 'asset-bytes-conflict' else source
        Path(args[args.index('--dir') + 1], p.SOURCE.name).write_bytes(data)
        downloads += 1
        return result()
    if args[2] == 'create':
        assert release is None and tag is not None
        assert '--verify-tag' in args and '--draft' in args and '--latest=false' in args and '--prerelease' not in args
        assert args[args.index('--target') + 1] == commit
        assert Path(args[args.index('--notes-file') + 1]).read_text() == expected_body
        if scenario == 'create-failure' and fault_count == 0:
            fault_count += 1
            raise subprocess.CalledProcessError(1, args)
        release = {'id': 3, 'tag_name': p.TAG, 'target_commitish': commit, 'draft': True, 'prerelease': False, 'name': p.TITLE, 'body': expected_body, 'html_url': 'https://github.com/' + p.REPOSITORY + '/releases/tag/' + p.TAG}
        assets = [] if scenario == 'asset-missing-after-upload' else [{'id': 7, 'name': p.SOURCE.name, 'state': 'uploaded', 'size': len(source), 'digest': 'sha256:' + p.EXPECTED_SHA256}]
        writes.append(['draft', commit])
        return result()
    if args[2] == 'upload':
        assert release and not assets, 'Existing assets must never be overwritten'
        if scenario == 'upload-failure' and fault_count == 0:
            fault_count += 1
            raise subprocess.CalledProcessError(1, args)
        assets = [{'id': 7, 'name': p.SOURCE.name, 'state': 'uploaded', 'size': len(source), 'digest': 'sha256:' + p.EXPECTED_SHA256}]
        writes.append(['upload', p.SOURCE.name])
        return result()
    raise AssertionError('Unexpected release command: ' + repr(args))


p.subprocess.run = mock_run
with tempfile.TemporaryDirectory() as folder:
    os.chdir(folder)
    p.SOURCE.write_bytes(source)
    if scenario in {'push-mismatch', 'manual-mismatch'}: p.SOURCE.write_bytes(source + b'changed')
    p.NOTES.parent.mkdir()
    if scenario != 'missing-notes': p.NOTES.write_text('' if scenario == 'empty-notes' else '# Synthetic release\n')
    Path('tests').mkdir()
    if scenario != 'no-tests':
        Path('tests/first.test.mjs').write_text('// first')
        Path('tests/second.test.mjs').write_text('// second')
    errors = []
    def run_once():
        try:
            with contextlib.redirect_stdout(io.StringIO()): p.main(now=now)
        except (SystemExit, subprocess.CalledProcessError) as error:
            errors.append(str(error))
    run_once()
    writes_before_retry = len(writes)
    if scenario in {'create-failure', 'upload-failure', 'publish-failure'}:
        gates.clear()
        run_once()
        assert len(errors) == 1, errors
        assert release and not release['draft'] and latest['id'] == 3
    elif not errors and release and not release['draft'] and latest['id'] == 3:
        gates.clear()
        run_once()
        assert len(writes) == writes_before_retry, 'An identical completed release must be idempotent'
    print(json.dumps({'errors': errors, 'writes': writes, 'calls': len(calls), 'gates': gates, 'tag': tag, 'release': release, 'latest': latest, 'downloads': downloads}))
`;

function publication(scenario) {
  const result = spawnSync('python3', ['-c', harness, publisher, scenario], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('bonus release configuration uses the following Sunday deadline and preserves unified 3.1.0', () => {
  const inspect = String.raw`
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('publisher', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
print(json.dumps({'version': p.VERSION, 'tag': p.TAG, 'title': p.TITLE, 'previous': p.PREVIOUS_STABLE_TAG, 'notes': str(p.NOTES), 'launch': p.LAUNCH_TIME.isoformat()}))
`;
  const result = spawnSync('python3', ['-c', inspect, publisher], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), {
    version: '3.1.1', tag: 'v3.1.1', title: 'Aeries Playground 3.1.1',
    previous: 'v3.1.0', notes: 'docs/RELEASE-3.1.1.md',
    launch: '2026-11-09T07:59:00+00:00',
  });
});

for (const scenario of ['fresh', 'recovery-draft', 'recovery-missing-asset', 'recovery-draft-missing-tag', 'recovery-annotated-tag', 'recovery-prerelease', 'already-published', 'second-page-draft']) {
  test(`stable publication safely completes ${scenario}`, () => {
    const result = publication(scenario);
    assert.deepEqual(result.errors, []);
    assert.equal(result.release.tag_name, 'v3.1.1');
    assert.equal(result.release.name, 'Aeries Playground 3.1.1');
    assert.equal(result.release.draft, false);
    assert.equal(result.release.prerelease, false);
    assert.equal(result.latest.id, result.release.id);
    assert.ok(result.downloads > 0);
    if (scenario === 'already-published') assert.deepEqual(result.writes, []);
    if (scenario === 'recovery-draft') assert.deepEqual(result.writes.map(write => write[0]), ['publish']);
    if (scenario === 'recovery-missing-asset') assert.deepEqual(result.writes.map(write => write[0]), ['upload', 'publish']);
  });
}

for (const scenario of ['push-mismatch', 'before-time']) {
  test(`publication skips ${scenario} without subprocesses or API changes`, () => {
    const result = publication(scenario);
    assert.deepEqual(result.errors, []);
    assert.equal(result.calls, 0);
    assert.deepEqual(result.writes, []);
  });
}

for (const scenario of ['wrong-repo', 'wrong-ref', 'wrong-event', 'invalid-sha', 'unprepared', 'manual-mismatch', 'wrong-version', 'comment-version', 'duplicate-version', 'missing-notes', 'empty-notes', 'no-tests', 'test-failure', 'syntax-failure', 'documentation-failure', 'whitespace-failure', 'tests-modify-source', 'tag-conflict', 'tag-race', 'tag-tree', 'tag-loop', 'draft-target-conflict', 'source-conflict', 'asset-size-conflict', 'asset-digest-conflict', 'asset-bytes-conflict', 'asset-state-conflict', 'duplicate-assets', 'duplicate-drafts', 'published-missing-tag', 'second-page-asset-conflict', 'download-failure', 'stable-corrupt', 'api-auth-error', 'api-rate-error', 'latest-conflict', 'latest-race']) {
  test(`publication rejects ${scenario} before any mutation`, () => {
    const result = publication(scenario);
    assert.equal(result.errors.length, 1, JSON.stringify(result));
    assert.deepEqual(result.writes, [], result.errors.join('\n'));
  });
}

for (const scenario of ['create-failure', 'upload-failure', 'publish-failure']) {
  test(`publication recovers ${scenario} without replacing a tag or asset`, () => {
    const result = publication(scenario);
    assert.equal(result.errors.length, 1);
    assert.equal(result.release.draft, false);
    assert.equal(result.latest.id, result.release.id);
    assert.equal(result.writes.filter(write => write[0] === 'tag').length, scenario === 'upload-failure' ? 0 : 1);
    assert.equal(result.writes.filter(write => write[0] === 'publish').length, 1);
  });
}

for (const scenario of ['asset-missing-after-upload', 'latest-after-upload']) {
  test(`publication leaves an unpublished draft on ${scenario}`, () => {
    const result = publication(scenario);
    assert.equal(result.errors.length, 1);
    assert.equal(result.release.draft, true);
    assert.equal(result.writes.filter(write => write[0] === 'publish').length, 0);
  });
}

test('a concurrent Latest selection after publication is reported and preserved', () => {
  const result = publication('latest-after-publish');
  assert.equal(result.errors.length, 1);
  assert.equal(result.latest.tag_name, 'v3.2.0');
  assert.equal(result.writes.filter(write => write[0] === 'publish').length, 1);
});

test('CI discovers every regression suite and publishing retains guarded source-only triggers', async () => {
  const checks = await readFile(new URL('../.github/workflows/checks.yml', import.meta.url), 'utf8');
  const release = await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
  assert.match(checks, /run: node --test tests\/\*\.test\.mjs/);
  assert.match(release, /branches: \[main\]\n    paths:\n      - 'aeries-playground\.user\.js'\n  workflow_dispatch:/);
  assert.match(release, /github\.repository == 'sodium-qed\/aeries-playground' && github\.ref == 'refs\/heads\/main'/);
  assert.match(release, /cancel-in-progress: false/);
  assert.match(release, /node-version: '24'/);
  assert.match(release, /run: python3 scripts\/publish-release\.py/);
  assert.doesNotMatch(release, /pull_request_target|--clobber|--force/);
});
