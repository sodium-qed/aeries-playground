import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const publisher = fileURLToPath(new URL('../scripts/publish-scheduled-prereleases.py', import.meta.url));

function python(source, scenario = '', version = '3.1.0') {
  const result = spawnSync('python3', ['-c', source, publisher, scenario, version], {
    encoding: 'utf8', timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

// Execute the actual publisher with synthetic files and a local GitHub model.
// Every subprocess is intercepted: no GitHub, Git, Node, stable publisher, or
// other external process may run from this Python harness.
const harness = String.raw`
import base64, contextlib, copy, hashlib, importlib.util, io, json, os, subprocess, sys, tempfile
from datetime import timedelta
from pathlib import Path
from types import SimpleNamespace
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('publisher', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
scenario, version = sys.argv[2], sys.argv[3]
commits = {'3.1.0': 'a' * 40, '3.1.1': 'b' * 40}
base, other = 'c' * 40, 'd' * 40
sources = {v: ('// ==UserScript==\n// @name Synthetic\n// @version ' + v + '\n// @description Invented fixture\n// @match https://example.invalid/*\n// ==/UserScript==\n(() => {})();\n').encode() for v in p.SPECS}
if scenario == 'duplicate-version': sources[version] = sources[version].replace(b'// ==/UserScript==', ('// @version ' + version + '\n// ==/UserScript==').encode())
if scenario == 'comment-version': sources[version] = sources[version].replace(('@version ' + version).encode(), b'@version 2.4.0') + ('// @version ' + version + '\n').encode()
if scenario == 'unknown-version': sources[version] = sources[version].replace(('@version ' + version).encode(), b'@version 9.9.9')
for v, data in sources.items():
    p.SPECS[v]['sha256'] = hashlib.sha256(data).hexdigest()
    p.SPECS[v]['size'] = len(data)
os.environ.update(GITHUB_ACTIONS='true', GITHUB_REPOSITORY=p.REPOSITORY,
                  GITHUB_REF='refs/heads/main', GITHUB_EVENT_NAME='workflow_dispatch', GITHUB_SHA=commits[version])
for case, key, value in [
    ('wrong-repo', 'GITHUB_REPOSITORY', 'somebody/fork'),
    ('wrong-ref', 'GITHUB_REF', 'refs/heads/other'),
    ('wrong-event', 'GITHUB_EVENT_NAME', 'schedule'),
    ('not-actions', 'GITHUB_ACTIONS', 'false'),
    ('invalid-sha', 'GITHUB_SHA', 'main'),
    ('wrong-merge-commit', 'GITHUB_SHA', other),
]:
    if scenario == case: os.environ[key] = value
if scenario == 'push-mismatch': os.environ['GITHUB_EVENT_NAME'] = 'push'
now = p.SPECS[version]['launch']
if scenario == 'before-time': now -= timedelta(seconds=1)
if scenario == 'second-at-first-deadline': now = p.SPECS['3.1.0']['launch']

states = {v: {'tag': None, 'release': None, 'assets': []} for v in p.SPECS}
def seed(v, draft=False, missing_asset=False):
    states[v]['tag'] = {'object': {'type': 'commit', 'sha': commits[v]}}
    states[v]['release'] = {'id': 10 if v == '3.1.0' else 11, 'tag_name': 'v' + v,
        'target_commitish': commits[v], 'name': p.release_title(v), 'body': p.release_body(v, commits[v]),
        'draft': draft, 'prerelease': True}
    states[v]['assets'] = [] if missing_asset else [{'id': 20, 'name': p.SOURCE.name,
        'size': len(sources[v]), 'state': 'uploaded', 'digest': 'sha256:' + p.SPECS[v]['sha256']}]
if version == '3.1.1': seed('3.1.0')
existing = {'already-published', 'recovery-draft', 'recovery-missing-asset', 'draft-missing-tag',
    'tag-conflict', 'tag-race', 'tag-tree', 'tag-loop', 'annotated-tag', 'draft-target-conflict',
    'body-conflict', 'title-conflict', 'existing-stable', 'published-missing-tag',
    'asset-size-conflict', 'asset-digest-conflict', 'asset-state-conflict', 'asset-bytes-conflict',
    'asset-symlink', 'duplicate-assets', 'duplicate-releases', 'download-failure', 'upload-failure'}
if scenario in existing:
    seed(version, draft=scenario not in {'already-published', 'existing-stable', 'published-missing-tag'},
         missing_asset=scenario in {'recovery-missing-asset', 'upload-failure'})
focus = states[version]
if scenario in {'draft-missing-tag', 'published-missing-tag'}: focus['tag'] = None
if scenario == 'tag-only': focus['tag'] = {'object': {'type': 'commit', 'sha': commits[version]}}
if scenario == 'tag-conflict': focus['tag']['object']['sha'] = other
if scenario == 'tag-tree': focus['tag']['object']['type'] = 'tree'
if scenario in {'annotated-tag', 'tag-loop'}: focus['tag']['object'] = {'type': 'tag', 'sha': 'e' * 40}
if scenario == 'draft-target-conflict': focus['release']['target_commitish'] = other
if scenario == 'body-conflict': focus['release']['body'] += '\nUnexpected edit'
if scenario == 'title-conflict': focus['release']['name'] = 'Different title'
if scenario == 'existing-stable': focus['release']['prerelease'] = False
if scenario == 'asset-size-conflict': focus['assets'][0]['size'] += 1
if scenario == 'asset-digest-conflict': focus['assets'][0]['digest'] = 'sha256:' + 'f' * 64
if scenario == 'asset-state-conflict': focus['assets'][0]['state'] = 'starter'
if scenario == 'duplicate-assets': focus['assets'].append(dict(focus['assets'][0], id=21))
if scenario == 'prior-missing': states['3.1.0'] = {'tag': None, 'release': None, 'assets': []}
if scenario == 'prior-draft': states['3.1.0']['release']['draft'] = True
if scenario == 'prior-stable': states['3.1.0']['release']['prerelease'] = False
if scenario == 'prior-wrong-tag': states['3.1.0']['tag']['object']['sha'] = other
if scenario == 'prior-missing-asset': states['3.1.0']['assets'] = []
stable = {'id': 1, 'tag_name': 'v3.0.0', 'draft': False, 'prerelease': False}
latest = copy.deepcopy(stable)
if scenario == 'stable-draft': stable['draft'] = True
if scenario == 'stable-prerelease': stable['prerelease'] = True
if scenario == 'latest-changed': latest = {'id': 7, 'tag_name': 'v4.0.0', 'draft': False, 'prerelease': False}
calls, gates, writes, downloads, errors = [], [], [], [], []
policy_reads, faults = 0, 0
tag_reads = {v: 0 for v in p.SPECS}

def result(value=None, status=0, stderr=''):
    return SimpleNamespace(returncode=status, stdout=json.dumps(value) if value is not None else '', stderr=stderr)

def mock_run(args, check=False, **kwargs):
    global policy_reads, latest, faults
    calls.append(args)
    assert not any('publish-release.py' in str(arg) or 'publish-previews.py' in str(arg) for arg in args), args
    assert '--clobber' not in args and '--force' not in args, args
    if args[0] != 'gh':
        assert args[0] in {'node', 'git'}, args
        gates.append(args)
        if scenario == 'tests-change-source' and args[:2] == ['node', '--test']:
            p.SOURCE.write_bytes(sources[version] + b'changed')
        failure = {'tests-fail': ['node', '--test'], 'syntax-fail': ['node', 'scripts/check-userscripts.mjs'],
                   'docs-fail': ['node', 'scripts/check-documentation.mjs'], 'whitespace-fail': ['git', 'diff', '--check']}.get(scenario)
        if failure and args[:len(failure)] == failure: raise subprocess.CalledProcessError(1, args)
        return result()
    assert len(gates) == 4, 'GitHub contacted before all local checks passed'
    assert gates[0] == ['node', '--test', 'tests/first.test.mjs', 'tests/second.test.mjs'], gates
    if args[1] == 'api':
        route = args[2]
        if '--method' in args:
            method = args[args.index('--method') + 1]
            payload = json.loads(kwargs['input'])
            if route.endswith('/git/refs'):
                assert method == 'POST' and payload == {'ref': 'refs/tags/v' + version, 'sha': commits[version]}, payload
                assert focus['tag'] is None
                focus['tag'] = {'object': {'type': 'commit', 'sha': commits[version]}}
                writes.append(['tag', copy.deepcopy(payload)])
                return result(focus['tag'])
            assert route.endswith('/releases/' + str(focus['release']['id'])) and method == 'PATCH', (route, method)
            assert payload['tag_name'] == 'v' + version and payload['draft'] is False
            assert payload['prerelease'] is True and payload['make_latest'] == 'false', payload
            assert any(v == version for v in downloads) and focus['assets'] and focus['tag']
            if scenario == 'publish-failure' and faults == 0:
                faults += 1
                return result(status=1, stderr='temporary publish failure (HTTP 503)')
            focus['release'].update(payload)
            writes.append(['publish', copy.deepcopy(payload)])
            if scenario == 'latest-after-publish': latest = {'id': 7, 'tag_name': 'v4.0.0', 'draft': False, 'prerelease': False}
            return result(focus['release'])
        if route.endswith('/actions/workflows/release.yml'):
            policy_reads += 1
            state = 'disabled_manually'
            if scenario == 'legacy-active' or scenario == 'legacy-reactivated' and policy_reads >= 2: state = 'active'
            if scenario == 'legacy-inactivity': state = 'disabled_inactivity'
            if scenario == 'legacy-after-upload' and policy_reads >= 3: state = 'active'
            return result({'path': '.github/workflows/not-release.yml' if scenario == 'wrong-workflow-path' else '.github/workflows/release.yml', 'state': state})
        if route.endswith('/releases/tags/v3.0.0'):
            if scenario == 'api-auth-error': return result(status=1, stderr='unauthorized (HTTP 403)')
            return result(stable)
        if route.endswith('/releases/latest'):
            if scenario == 'latest-race' and policy_reads >= 2: latest = {'id': 7, 'tag_name': 'v4.0.0', 'draft': False, 'prerelease': False}
            return result(latest)
        if '/pulls/' in route:
            v = next(v for v in p.SPECS if route.endswith('/' + str(p.SPECS[v]['pr'])))
            pr = {'number': p.SPECS[v]['pr'], 'merged': True, 'state': 'closed', 'merge_commit_sha': commits[v],
                  'head': {'sha': p.SPECS[v]['head'], 'repo': {'full_name': p.REPOSITORY}},
                  'base': {'ref': 'main', 'repo': {'full_name': p.REPOSITORY}}}
            if v == version:
                if scenario == 'pr-unmerged': pr.update(merged=False, state='open')
                if scenario == 'wrong-head': pr['head']['sha'] = other
                if scenario == 'foreign-pr': pr['head']['repo']['full_name'] = 'someone/fork'
                if scenario == 'wrong-base': pr['base']['ref'] = 'other'
            elif scenario == 'prior-unmerged': pr.update(merged=False, state='open')
            elif scenario == 'prior-wrong-head': pr['head']['sha'] = other
            return result(pr)
        if '/git/commits/' in route:
            v = next(v for v in p.SPECS if route.endswith('/' + commits[v]))
            parents = [{'sha': base}, {'sha': p.SPECS[v]['head']}]
            if scenario == 'wrong-parent' and v == version or scenario == 'prior-wrong-parent' and v != version: parents[1]['sha'] = other
            if scenario == 'squash-merge' and v == version: parents.pop()
            return result({'sha': commits[v], 'parents': parents})
        if '/contents/' in route:
            v = next(v for v in p.SPECS if route.endswith('?ref=' + commits[v]))
            data = sources[v]
            if scenario == 'source-conflict' and v == version or scenario == 'prior-source-conflict' and v != version: data += b'changed'
            return result({'type': 'symlink' if scenario == 'source-not-file' and v == version else 'file', 'encoding': 'base64', 'content': base64.b64encode(data).decode()})
        if '/git/ref/tags/' in route:
            v = route.rsplit('/v', 1)[1]
            tag_reads[v] += 1
            if scenario == 'tag-race' and v == version and tag_reads[v] >= 2: states[v]['tag']['object']['sha'] = other
            return result(states[v]['tag']) if states[v]['tag'] else result(status=1, stderr='not found (HTTP 404)')
        if '/git/tags/' in route:
            return result({'object': {'type': 'tag', 'sha': 'e' * 40} if scenario == 'tag-loop' else {'type': 'commit', 'sha': commits[version]}})
        if route.endswith('/releases?per_page=100'):
            assert '--paginate' in args and '--slurp' in args
            items = [copy.deepcopy(state['release']) for state in states.values() if state['release']]
            if scenario == 'duplicate-releases': items.append(dict(focus['release'], id=99))
            return result({'bad': 'page'} if scenario == 'malformed-pagination' else [[], items])
        if '/assets?per_page=100' in route:
            assert '--paginate' in args and '--slurp' in args
            state = next(state for state in states.values() if state['release'] and '/releases/' + str(state['release']['id']) + '/' in route)
            return result([[], state['assets']])
        if '/commits/' in route:
            return result({'sha': route.rsplit('/', 1)[1]})
        raise AssertionError('Unexpected API route: ' + route)
    assert args[1] == 'release' and args[3] in {'v3.1.0', 'v3.1.1'}, args
    v = args[3][1:]
    state = states[v]
    if args[2] == 'download':
        assert state['assets']
        if scenario == 'download-failure' and v == version: raise subprocess.CalledProcessError(1, args)
        data = sources[v]
        if scenario == 'asset-bytes-conflict' and v == version or scenario == 'prior-asset-bytes-conflict' and v != version: data = data[:-1] + b'x'
        destination = Path(args[args.index('--dir') + 1]) / p.SOURCE.name
        if scenario == 'asset-symlink' and v == version:
            target = destination.parent / 'target'
            target.write_bytes(data)
            destination.symlink_to(target)
        else: destination.write_bytes(data)
        downloads.append(v)
        return result()
    assert v == version, 'A prerequisite release must never be changed'
    if args[2] == 'create':
        assert state['release'] is None and state['tag']
        assert '--verify-tag' in args and '--draft' in args and '--prerelease' in args and '--latest=false' in args
        assert args[args.index('--target') + 1] == commits[v]
        assert Path(args[4]).read_bytes() == sources[v]
        assert Path(args[args.index('--notes-file') + 1]).read_text() == p.release_body(v, commits[v])
        if scenario == 'create-failure' and faults == 0:
            faults += 1
            raise subprocess.CalledProcessError(1, args)
        seed(v, draft=True, missing_asset=scenario == 'missing-asset-after-create')
        writes.append(['draft', v])
        return result()
    if args[2] == 'upload':
        assert state['release'] and not state['assets']
        if scenario == 'upload-failure' and faults == 0:
            faults += 1
            raise subprocess.CalledProcessError(1, args)
        assert Path(args[4]).read_bytes() == sources[v]
        state['assets'] = [{'id': 20, 'name': p.SOURCE.name, 'size': len(sources[v]), 'state': 'uploaded', 'digest': 'sha256:' + p.SPECS[v]['sha256']}]
        writes.append(['upload', v])
        return result()
    raise AssertionError('Unexpected command: ' + repr(args))

p.subprocess.run = mock_run
with tempfile.TemporaryDirectory() as folder:
    os.chdir(folder)
    p.SOURCE.write_bytes(sources[version] + (b'changed' if scenario in {'push-mismatch', 'manual-mismatch'} else b''))
    if scenario == 'local-source-symlink':
        p.SOURCE.rename('target.user.js')
        p.SOURCE.symlink_to('target.user.js')
    Path('tests').mkdir()
    if scenario != 'no-tests':
        Path('tests/first.test.mjs').write_text('// first')
        Path('tests/second.test.mjs').write_text('// second')
    def once():
        try:
            with contextlib.redirect_stdout(io.StringIO()): p.main(now=now)
        except (RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired, ValueError, KeyError, TypeError) as error:
            errors.append(str(error))
    once()
    if scenario in {'idempotent', 'create-failure', 'upload-failure', 'publish-failure'}:
        gates.clear()
        once()
print(json.dumps({'errors': errors, 'calls': calls, 'gates': gates, 'writes': writes,
                  'states': states, 'latest': latest, 'downloads': downloads}))
`;

test('scheduled prerelease specs freeze both original dates, candidates, and files', () => {
  const config = python(String.raw`
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('publisher', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
print(json.dumps({'repository': p.REPOSITORY, 'stable': p.STABLE_TAG,
 'specs': {v: dict(s, launch=s['launch'].isoformat()) for v, s in p.SPECS.items()}}))
`);
  assert.deepEqual(config, {
    repository: 'sodium-qed/aeries-playground', stable: 'v3.0.0',
    specs: {
      '3.1.0': { pr: 10, head: '858a0a1fac820163d1185664baa039624767928e', size: 379864,
        sha256: '5e37b76082308c0eb0f2bc1e472cb33bc4bd3b360a713ddbf8e192c655b33773', launch: '2026-11-02T07:59:00+00:00' },
      '3.1.1': { pr: 12, head: '8fad3af92e680e67d6872f52dc998cbfde14d7fc', size: 383784,
        sha256: '3920c6c72f6b0d4ddfac82dad5d6f3bb560510cfe1d1ed193d43e3bb28136c4b', launch: '2026-11-09T07:59:00+00:00' },
    },
  });
});

for (const version of ['3.1.0', '3.1.1']) {
  for (const scenario of ['before-time', 'push-mismatch']) {
    test(`${version} skips ${scenario} before subprocesses or remote writes`, () => {
      const result = python(harness, scenario, version);
      assert.deepEqual(result.errors, []);
      assert.deepEqual(result.calls, []);
      assert.deepEqual(result.writes, []);
    });
  }
  for (const scenario of ['fresh', 'recovery-draft', 'recovery-missing-asset', 'draft-missing-tag', 'tag-only', 'annotated-tag', 'already-published']) {
    test(`${version} safely completes ${scenario} as a prerelease and preserves stable Latest`, () => {
      const result = python(harness, scenario, version);
      assert.deepEqual(result.errors, []);
      const release = result.states[version].release;
      assert.equal(release.tag_name, `v${version}`);
      assert.equal(release.draft, false);
      assert.equal(release.prerelease, true);
      assert.deepEqual(result.latest, { id: 1, tag_name: 'v3.0.0', draft: false, prerelease: false });
      assert.ok(result.downloads.includes(version));
      if (scenario === 'already-published') assert.deepEqual(result.writes, []);
      if (version === '3.1.1') {
        assert.equal(result.states['3.1.0'].release.prerelease, true);
        assert.ok(result.downloads.includes('3.1.0'));
      }
    });
  }
}

test('3.1.1 cannot publish at the earlier 3.1.0 deadline', () => {
  const result = python(harness, 'second-at-first-deadline', '3.1.1');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.calls, []);
  assert.deepEqual(result.writes, []);
});

for (const scenario of ['wrong-repo', 'wrong-ref', 'wrong-event', 'not-actions', 'invalid-sha',
  'manual-mismatch', 'duplicate-version', 'comment-version', 'unknown-version', 'local-source-symlink',
  'no-tests', 'tests-fail', 'syntax-fail', 'docs-fail', 'whitespace-fail', 'tests-change-source',
  'legacy-active', 'legacy-inactivity', 'wrong-workflow-path', 'legacy-reactivated', 'stable-draft',
  'stable-prerelease', 'latest-changed', 'latest-race', 'api-auth-error', 'pr-unmerged', 'wrong-head',
  'foreign-pr', 'wrong-base', 'wrong-merge-commit', 'wrong-parent', 'squash-merge', 'source-conflict',
  'source-not-file', 'tag-conflict', 'tag-race', 'tag-tree', 'tag-loop', 'draft-target-conflict',
  'body-conflict', 'title-conflict', 'existing-stable', 'published-missing-tag', 'asset-size-conflict',
  'asset-digest-conflict', 'asset-state-conflict', 'asset-bytes-conflict', 'asset-symlink',
  'duplicate-assets', 'duplicate-releases', 'download-failure', 'malformed-pagination']) {
  test(`prerelease publisher blocks ${scenario} before any mutation`, () => {
    const result = python(harness, scenario);
    assert.equal(result.errors.length, 1, JSON.stringify(result));
    assert.deepEqual(result.writes, [], result.errors.join('\n'));
  });
}

for (const scenario of ['prior-unmerged', 'prior-wrong-head', 'prior-wrong-parent', 'prior-source-conflict',
  'prior-missing', 'prior-draft', 'prior-stable', 'prior-wrong-tag', 'prior-missing-asset', 'prior-asset-bytes-conflict']) {
  test(`3.1.1 blocks ${scenario} before creating its own tag or release`, () => {
    const result = python(harness, scenario, '3.1.1');
    assert.equal(result.errors.length, 1, JSON.stringify(result));
    assert.deepEqual(result.writes, []);
    assert.equal(result.states['3.1.1'].release, null);
  });
}

for (const scenario of ['create-failure', 'upload-failure', 'publish-failure']) {
  test(`partial ${scenario} recovers without replacing tags, assets, or stable Latest`, () => {
    const result = python(harness, scenario);
    assert.equal(result.errors.length, 1);
    assert.equal(result.states['3.1.0'].release.draft, false);
    assert.equal(result.states['3.1.0'].release.prerelease, true);
    assert.equal(result.writes.filter(write => write[0] === 'tag').length, scenario === 'upload-failure' ? 0 : 1);
    assert.equal(result.writes.filter(write => write[0] === 'publish').length, 1);
    assert.equal(result.latest.tag_name, 'v3.0.0');
  });
}

test('a fully completed scheduled prerelease is idempotent', () => {
  const result = python(harness, 'idempotent');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.writes.map(write => write[0]), ['tag', 'draft', 'publish']);
});

for (const scenario of ['missing-asset-after-create', 'legacy-after-upload']) {
  test(`${scenario} leaves only an unpublished draft`, () => {
    const result = python(harness, scenario);
    assert.equal(result.errors.length, 1);
    assert.equal(result.states['3.1.0'].release.draft, true);
    assert.equal(result.writes.filter(write => write[0] === 'publish').length, 0);
  });
}

test('a concurrent Latest selection after publication is reported without undoing it', () => {
  const result = python(harness, 'latest-after-publish');
  assert.equal(result.errors.length, 1);
  assert.equal(result.latest.tag_name, 'v4.0.0');
  assert.equal(result.writes.filter(write => write[0] === 'publish').length, 1);
});

test('the dedicated workflow runs the guarded prerelease path with only its required permissions', async () => {
  const workflow = await readFile(new URL('../.github/workflows/scheduled-prereleases.yml', import.meta.url), 'utf8');
  assert.match(workflow, /branches: \[main\]\n    paths:\n      - 'aeries-playground\.user\.js'\n  workflow_dispatch:/);
  assert.match(workflow, /run: python3 scripts\/publish-scheduled-prereleases\.py/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /node-version: '24'/);
  assert.doesNotMatch(workflow, /run: .*publish-release\.py|publish-previews\.py|pull_request_target|--clobber|--force/);
});
