import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const recorder = fileURLToPath(new URL('../scripts/record-merge-completion.py', import.meta.url));

// Exercise the actual recorder against invented GitHub objects and an in-memory
// commit graph. No command, checkout, network request, or real write can escape.
const harness = String.raw`
import base64, contextlib, copy, hashlib, importlib.util, io, json, os, sys
from datetime import timedelta
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('recorder', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
scenario = sys.argv[2]
head, merged, merge_base, initial_main, new_main = [char * 40 for char in 'abcde']
initial_tree, new_tree, other = 'f' * 40, '1' * 40, '9' * 40
source = b'// Synthetic approved source\n'
source_hash, source_size = hashlib.sha256(source).hexdigest(), len(source)
p.EXPECTED_HEAD_SHA = head
os.environ.update(GITHUB_ACTIONS='true', GITHUB_REPOSITORY=p.REPOSITORY,
                  GITHUB_REF='refs/heads/main')
for name, (key, value) in {
    'not-actions': ('GITHUB_ACTIONS', 'false'),
    'wrong-repository': ('GITHUB_REPOSITORY', 'somebody/fork'),
    'wrong-ref': ('GITHUB_REF', 'refs/heads/other'),
}.items():
    if scenario == name: os.environ[key] = value
now = p.LAUNCH_TIME - timedelta(seconds=1) if scenario == 'before-time' else p.LAUNCH_TIME + timedelta(minutes=10)
pr = {'number': p.PR_NUMBER, 'merged': True, 'state': 'closed', 'merge_commit_sha': merged,
      'head': {'sha': head, 'ref': p.HEAD_BRANCH, 'repo': {'full_name': p.REPOSITORY}},
      'base': {'ref': 'main', 'repo': {'full_name': p.REPOSITORY}}}
if scenario == 'wrong-pr': pr['number'] += 1
if scenario == 'not-merged': pr['merged'] = False
if scenario == 'wrong-merge': pr['merge_commit_sha'] = other
if scenario == 'wrong-head': pr['head']['sha'] = other
if scenario == 'foreign-head': pr['head']['repo']['full_name'] = 'somebody/fork'
if scenario == 'wrong-head-branch': pr['head']['ref'] = 'unrelated'
if scenario == 'wrong-base-branch': pr['base']['ref'] = 'other'
stable = {'id': 30, 'tag_name': p.STABLE_TAG, 'draft': False, 'prerelease': False}
if scenario == 'stable-draft': stable['draft'] = True
if scenario == 'stable-prerelease': stable['prerelease'] = True
release = {'id': 31, 'tag_name': p.TAG, 'draft': False, 'prerelease': True,
           'published_at': '2026-11-02T08:00:00Z',
           'assets': [{'id': 41, 'name': p.SOURCE_NAME, 'state': 'uploaded',
                       'size': source_size, 'digest': 'sha256:' + source_hash}]}
if scenario == 'draft': release['draft'] = True
if scenario == 'unexpected-stable-release': release['prerelease'] = False
if scenario == 'wrong-release-tag': release['tag_name'] = 'v4.0.0'
if scenario == 'early-publication': release['published_at'] = '2026-11-02T07:58:59Z'
if scenario == 'missing-publication-time': release.pop('published_at')
if scenario == 'no-asset': release['assets'] = []
if scenario == 'duplicate-assets': release['assets'].append(copy.deepcopy(release['assets'][0]))
if scenario == 'wrong-asset-size': release['assets'][0]['size'] += 1
if scenario == 'wrong-asset-digest': release['assets'][0]['digest'] = 'sha256:' + '0' * 64
if scenario == 'asset-not-uploaded': release['assets'][0]['state'] = 'starter'
if scenario == 'missing-asset-digest': release['assets'][0].pop('digest')

originals = {
    'README.md': '# Synthetic README\n\n' + '\n\n'.join([
        p.OLD_README_HEADING, p.OLD_README_PARAGRAPH, p.OLD_README_DETAILS,
        p.OLD_STABLE_CHOICE, p.OLD_SOURCE_CHOICE]) + '\n\nUnrelated README prose survives.\n',
    'docs/FEATURES.md': '# Synthetic features\n\n' + '\n\n'.join([
        p.OLD_FEATURE_INTRO, p.OLD_FEATURE_RELEASE_ROW, p.OLD_LATEST_ROW,
        '### Planned Developer and public integration', p.OLD_FEATURE_PLAN,
        '| Feature | Public 3.0.0 | Planned unified 3.1.0 |']) + '\n\nUnrelated feature prose survives.\n',
    'docs/MERGE-PLAN.md': '# Synthetic plan\n\n' + p.OLD_PLAN_INTRO + '\n\n## Schedule and current status\n\n'
        'Original schedule: November 1, 2026, 11:59 p.m. PST.\nPreparation tests: **195/195 tests**.\n'
        'Unrelated plan prose survives.\n',
}
if scenario == 'changed-prose': originals['README.md'] = originals['README.md'].replace(p.OLD_README_PARAGRAPH, 'A concurrently revised announcement.')
if scenario == 'duplicate-prose': originals['README.md'] += '\n' + p.OLD_README_PARAGRAPH
if scenario == 'mixed-prose': originals['README.md'] += '\n## Developer and public editions are unified'
originals['CONTRIBUTING.md'] = '# Synthetic contributing\n\n' + p.OLD_CONTRIBUTING_STATUS + '\n\nUnrelated contributor prose survives.\n'
originals['docs/DEVELOPMENT.md'] = '# Synthetic development\n\n' + p.OLD_DEVELOPMENT_STATUS + '\n\nUnrelated developer prose survives.\n'
originals['docs/README.md'] = '# Synthetic hub\n\n' + p.OLD_HUB_STATUS + '\n\nUnrelated hub prose survives.\n'
originals['docs/MAINTENANCE.md'] = '# Synthetic maintenance\n\n## Active Developer and public merge preparation\n\n' + p.OLD_MAINT_STATUS + '\n\n' + p.OLD_MAINT_BASELINE + '\n\nPreparation tests: **195/195 tests**.\n'
for extra in ['SECURITY.md', 'docs/SETTINGS.md', 'docs/CALCULATIONS.md', 'docs/TROUBLESHOOTING.md']:
    originals[extra] = '# Synthetic reference\n\nHistorical baseline and Planned 3.1.0 headings remain as preparation context.\n'
if scenario == 'conflicting-record': originals[p.RESULT_PATH] = '# Different historical result\n'
docs_by_commit = {initial_main: copy.deepcopy(originals)}
main_sha, tree_sha = initial_main, initial_tree
issue = {'number': p.ISSUE_NUMBER, 'body': 'Synthetic original tracking body.\n', 'state': 'open', 'state_reason': None}
if scenario == 'wrong-issue': issue['number'] += 1
if scenario == 'issue-is-pr': issue['pull_request'] = {'url': 'https://example.invalid/pr'}
calls, writes, visible, errors, outputs = [], [], [], [], []
blobs, staged_docs = {}, None
main_reads, issue_attempts, ref_attempts, release_reads, tag_reads, latest_reads = 0, 0, 0, 0, 0, 0
prefix = 'repos/' + p.REPOSITORY

def encoded(data):
    if isinstance(data, str): data = data.encode()
    return {'type': 'file', 'encoding': 'base64', 'content': base64.b64encode(data).decode()}

def api(route, method='GET', payload=None):
    global main_sha, tree_sha, staged_docs, main_reads, issue_attempts, ref_attempts, release_reads, tag_reads, latest_reads
    calls.append([route, method])
    if method != 'GET':
        assert route in {prefix + '/git/blobs', prefix + '/git/trees', prefix + '/git/commits',
                         prefix + '/git/refs/heads/main', prefix + '/issues/' + str(p.ISSUE_NUMBER)}, route
        writes.append([route, method, copy.deepcopy(payload)])
    if route == prefix + '/pulls/' + str(p.PR_NUMBER):
        assert method == 'GET'
        return copy.deepcopy(pr)
    if route == prefix + '/git/commits/' + merged:
        parents = [{'sha': merge_base}, {'sha': other if scenario == 'wrong-parent' else head}]
        if scenario == 'squash-parent': parents = parents[:1]
        if scenario == 'invalid-base-parent': parents[0]['sha'] = 'not-a-sha'
        return {'sha': other if scenario == 'wrong-commit-response' else merged, 'parents': parents}
    if route == prefix + '/git/ref/tags/' + p.TAG:
        tag_reads += 1
        if scenario == 'late-tag' and tag_reads >= 2: return {'object': {'type': 'commit', 'sha': other}}
        return {'object': {'type': 'tag' if scenario in {'annotated-tag', 'tag-loop'} else 'tree' if scenario == 'tag-is-tree' else 'commit',
                           'sha': '2' * 40 if scenario in {'annotated-tag', 'tag-loop'} else other if scenario == 'wrong-tag' else merged}}
    if route == prefix + '/git/tags/' + '2' * 40:
        return {'object': {'type': 'tag' if scenario == 'tag-loop' else 'commit', 'sha': '2' * 40 if scenario == 'tag-loop' else merged}}
    if route == prefix + '/releases/tags/' + p.TAG:
        release_reads += 1
        result = copy.deepcopy(release)
        if scenario == 'late-asset' and release_reads >= 2: result['assets'][0]['digest'] = 'sha256:' + '0' * 64
        return result
    if route == prefix + '/releases/tags/' + p.STABLE_TAG:
        return copy.deepcopy(stable)
    if route == prefix + '/releases/latest':
        latest_reads += 1
        result = copy.deepcopy(stable)
        if scenario == 'not-latest' or scenario == 'late-latest' and latest_reads >= 2: result.update(id=90, tag_name='v4.0.0')
        return result
    if route.startswith(prefix + '/contents/' + p.SOURCE_NAME + '?ref='):
        ref = route.split('?ref=')[1]
        assert ref in {merged, initial_main, new_main}
        bad = scenario == 'source-mismatch' or scenario == 'main-source-mismatch' and ref != merged
        result = encoded(source + b' changed' if bad else source)
        if scenario == 'source-symlink': result['type'] = 'symlink'
        return result
    if route == prefix + '/git/ref/heads/main':
        main_reads += 1
        if scenario == 'base-race' and main_reads == 2: main_sha = other
        return {'object': {'type': 'commit', 'sha': main_sha}}
    if route.startswith(prefix + '/compare/' + merged + '...'):
        return {'status': 'diverged' if scenario == 'main-diverged' else 'ahead',
                'merge_base_commit': {'sha': other if scenario == 'wrong-merge-base' else merged}}
    if route in {prefix + '/git/commits/' + initial_main, prefix + '/git/commits/' + new_main}:
        return {'tree': {'sha': initial_tree if route.endswith(initial_main) else new_tree}}
    if route.startswith(prefix + '/git/trees/') and route.endswith('?recursive=1'):
        docs = docs_by_commit[main_sha]
        entries = [{'path': path, 'type': 'blob', 'mode': '120000' if scenario == 'docs-symlink' and path == 'README.md' else '100644'} for path in docs]
        return {'truncated': scenario == 'truncated-tree', 'tree': entries}
    if route.startswith(prefix + '/contents/'):
        path, ref = route[len(prefix + '/contents/'):].split('?ref=')
        return encoded(docs_by_commit[ref][path])
    if route == prefix + '/git/blobs':
        assert method == 'POST' and payload['encoding'] == 'utf-8'
        sha = hashlib.sha1(payload['content'].encode()).hexdigest()
        blobs[sha] = payload['content']
        return {'sha': sha}
    if route == prefix + '/git/trees':
        assert method == 'POST' and payload['base_tree'] == tree_sha
        assert {entry['path'] for entry in payload['tree']} == {
            'README.md', 'docs/FEATURES.md', 'docs/MERGE-PLAN.md', 'docs/MERGE-RESULT.md',
            'docs/README.md', 'docs/MAINTENANCE.md', 'SECURITY.md', 'docs/SETTINGS.md',
            'docs/CALCULATIONS.md', 'docs/TROUBLESHOOTING.md', 'CONTRIBUTING.md', 'docs/DEVELOPMENT.md'}, payload
        staged_docs = copy.deepcopy(docs_by_commit[main_sha])
        for entry in payload['tree']:
            assert entry['type'] == 'blob' and entry['mode'] == '100644'
            staged_docs[entry['path']] = blobs[entry['sha']]
        return {'sha': new_tree}
    if route == prefix + '/git/commits':
        assert method == 'POST' and payload['parents'] == [main_sha] and payload['tree'] == new_tree
        return {'sha': new_main}
    if route == prefix + '/git/refs/heads/main':
        ref_attempts += 1
        assert method == 'PATCH' and payload == {'sha': new_main, 'force': False}
        if scenario == 'ref-conflict':
            main_sha = other
            raise RuntimeError('Synthetic non-fast-forward rejection')
        assert main_sha == initial_main
        docs_by_commit[new_main] = copy.deepcopy(staged_docs)
        main_sha, tree_sha = new_main, new_tree
        visible.append('main')
        return {'object': {'type': 'commit', 'sha': other if scenario == 'wrong-ref-response' else new_main}}
    if route == prefix + '/issues/' + str(p.ISSUE_NUMBER):
        if method == 'GET': return copy.deepcopy(issue)
        issue_attempts += 1
        assert visible == ['main'], 'Issue completion must follow the atomic documentation update'
        assert payload == {'state': 'closed', 'state_reason': 'completed'}, 'Issue updates must preserve the body without posting messages'
        if scenario == 'recover-issue-failure' and issue_attempts == 1:
            raise RuntimeError('Synthetic transient issue failure')
        issue.update(payload)
        visible.append('issue')
        result = copy.deepcopy(issue)
        if scenario == 'wrong-issue-response': result['state'] = 'open'
        return result
    raise AssertionError('Unexpected GitHub route: ' + route)

def forbidden(*args, **kwargs):
    raise AssertionError('Completion recorder escaped local test harness')

p.api = api
p.run = forbidden
p.subprocess.run = forbidden
arg_merge = 'invalid' if scenario == 'invalid-merge-sha' else merged
arg_hash = 'invalid' if scenario == 'invalid-source-hash' else source_hash
arg_size = True if scenario == 'boolean-source-size' else 0 if scenario == 'invalid-source-size' else source_size
def once():
    try:
        stream = io.StringIO()
        with contextlib.redirect_stdout(stream): p.main(arg_merge, arg_hash, arg_size, now=now)
        outputs.append(stream.getvalue())
    except (RuntimeError, ValueError) as error: errors.append(str(error))
once()
if scenario in {'idempotent', 'recover-issue-failure'}: once()
print(json.dumps({'errors': errors, 'outputs': outputs, 'calls': calls, 'writes': writes,
                  'visible': visible, 'main_sha': main_sha, 'docs': docs_by_commit.get(main_sha),
                  'issue': issue, 'issue_attempts': issue_attempts, 'ref_attempts': ref_attempts}))
`;

function scenario(name) {
  const result = spawnSync('python3', ['-c', harness, recorder, name], {
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

for (const name of ['fresh', 'annotated-tag']) {
  test(`completion recorder verifies ${name} evidence before one atomic docs update and issue closure`, () => {
    const result = scenario(name);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.visible, ['main', 'issue']);
    assert.equal(result.ref_attempts, 1);
    assert.equal(result.issue_attempts, 1);
    assert.match(result.docs['README.md'], /editions are unified/);
    assert.doesNotMatch(result.docs['README.md'], /merge and release have not happened/);
    assert.match(result.docs['docs/FEATURES.md'], /3\.1\.0 unified prerelease/);
    assert.match(result.docs['docs/MERGE-PLAN.md'], /Original schedule and preparation record/);
    assert.match(result.docs['docs/MERGE-PLAN.md'], /195\/195 tests/);
    assert.match(result.docs['docs/MERGE-PLAN.md'], /November 1, 2026, 11:59 p\.m\. PST/);
    for (const [path, preserved] of [
      ['README.md', 'Unrelated README prose survives.'],
      ['docs/FEATURES.md', 'Unrelated feature prose survives.'],
      ['docs/MERGE-PLAN.md', 'Unrelated plan prose survives.'],
    ]) assert.ok(result.docs[path].includes(preserved));
    assert.match(result.docs['docs/MERGE-RESULT.md'], /aeries-playground-3\.1\.0-result/);
    assert.match(result.docs['docs/MERGE-RESULT.md'], /does not invent a new test count/);
    assert.match(result.docs['docs/MERGE-RESULT.md'], /prerelease: true/);
    assert.match(result.docs['docs/MERGE-RESULT.md'], /3\.0\.0 remains the stable Latest/);
    assert.match(result.docs['README.md'], /3\.1\.0 prerelease/);
    assert.match(result.docs['README.md'], /3\.0\.0.*stable Latest/);
    assert.doesNotMatch(result.docs['README.md'], /3\.1\.0.*unified stable/);
    assert.equal(result.issue.body, 'Synthetic original tracking body.\n');
    assert.equal(result.issue.state, 'closed');
    assert.equal(result.issue.state_reason, 'completed');
    assert.equal(result.writes.filter(([route]) => route.endsWith('/git/trees')).length, 1);
    assert.equal(result.writes.filter(([route]) => route.endsWith('/git/commits')).length, 1);
    assert.ok(result.writes.every(([route]) => !route.includes('/releases') && !route.includes('/tags')));
  });
}

for (const name of ['before-time', 'not-actions', 'wrong-repository', 'wrong-ref',
  'invalid-merge-sha', 'invalid-source-hash', 'invalid-source-size', 'boolean-source-size']) {
  test(`completion recorder rejects ${name} without GitHub access`, () => {
    const result = scenario(name);
    assert.equal(result.errors.length, 1);
    assert.deepEqual(result.calls, []);
    assert.deepEqual(result.visible, []);
  });
}

for (const name of ['wrong-pr', 'not-merged', 'wrong-merge', 'wrong-head', 'foreign-head',
  'wrong-head-branch', 'wrong-base-branch', 'wrong-parent', 'squash-parent',
  'invalid-base-parent', 'wrong-commit-response', 'wrong-tag', 'tag-is-tree', 'tag-loop',
  'draft', 'unexpected-stable-release', 'stable-draft', 'stable-prerelease', 'wrong-release-tag', 'early-publication', 'missing-publication-time',
  'no-asset', 'duplicate-assets', 'wrong-asset-size', 'wrong-asset-digest',
  'asset-not-uploaded', 'missing-asset-digest', 'not-latest', 'source-mismatch',
  'main-source-mismatch', 'source-symlink', 'main-diverged', 'wrong-merge-base',
  'truncated-tree', 'docs-symlink', 'changed-prose', 'duplicate-prose', 'mixed-prose', 'conflicting-record']) {
  test(`completion recorder rejects ${name} before creating documentation objects`, () => {
    const result = scenario(name);
    assert.equal(result.errors.length, 1);
    assert.deepEqual(result.writes, []);
    assert.deepEqual(result.visible, []);
    assert.equal(result.issue.state, 'open');
  });
}

for (const name of ['base-race', 'ref-conflict']) {
  test(`completion recorder preserves a concurrent main advance for ${name}`, () => {
    const result = scenario(name);
    assert.equal(result.errors.length, 1);
    assert.deepEqual(result.visible, []);
    assert.equal(result.main_sha, '9'.repeat(40));
    assert.equal(result.issue.state, 'open');
    assert.equal(result.ref_attempts, name === 'base-race' ? 0 : 1);
    for (const [, , payload] of result.writes) assert.notEqual(payload.force, true);
  });
}

test('completion recorder replay does not create a second docs commit or repeat issue closure', () => {
  const result = scenario('idempotent');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.visible, ['main', 'issue']);
  assert.equal(result.outputs.length, 2);
  assert.equal(result.ref_attempts, 1);
  assert.equal(result.issue_attempts, 1);
  assert.equal(result.issue.body, 'Synthetic original tracking body.\n');
});

test('completion recorder recovers issue closure after docs succeeded without another docs commit', () => {
  const result = scenario('recover-issue-failure');
  assert.deepEqual(result.errors, ['Synthetic transient issue failure']);
  assert.deepEqual(result.visible, ['main', 'issue']);
  assert.equal(result.ref_attempts, 1);
  assert.equal(result.issue_attempts, 2);
  assert.equal(result.issue.body, 'Synthetic original tracking body.\n');
});

for (const name of ['wrong-issue', 'issue-is-pr']) {
  test(`completion recorder leaves ${name} unchanged after reporting partial completion`, () => {
    const result = scenario(name);
    assert.equal(result.errors.length, 1);
    assert.deepEqual(result.visible, ['main']);
    assert.equal(result.issue_attempts, 0);
    assert.equal(result.issue.state, 'open');
  });
}

for (const name of ['late-tag', 'late-latest', 'late-asset']) {
  test(`completion recorder rejects ${name} after preparing objects but before changing main`, () => {
    const result = scenario(name);
    assert.equal(result.errors.length, 1);
    assert.ok(result.writes.some(([route]) => route.endsWith('/git/commits')));
    assert.deepEqual(result.visible, []);
    assert.equal(result.ref_attempts, 0);
    assert.equal(result.issue_attempts, 0);
    assert.equal(result.main_sha, 'd'.repeat(40));
  });
}

test('completion recorder does not close the issue without a matching ref-update response', () => {
  const result = scenario('wrong-ref-response');
  assert.equal(result.errors.length, 1);
  assert.deepEqual(result.visible, ['main']);
  assert.equal(result.issue_attempts, 0);
  assert.equal(result.issue.state, 'open');
});

test('completion recorder reports an unconfirmed issue response after preserved-body state closure', () => {
  const result = scenario('wrong-issue-response');
  assert.equal(result.errors.length, 1);
  assert.deepEqual(result.visible, ['main', 'issue']);
  assert.equal(result.issue.body, 'Synthetic original tracking body.\n');
});
