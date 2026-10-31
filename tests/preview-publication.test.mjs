import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const publisher = fileURLToPath(new URL('../scripts/publish-previews.py', import.meta.url));

function python(source, scenario = '') {
  const result = spawnSync('python3', ['-c', source, publisher, scenario], {
    encoding: 'utf8', timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('preview specifications pin both approved files without reusing stable tags', () => {
  const configuration = python(String.raw`
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('previews', sys.argv[1])
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
print(json.dumps({'repository': p.REPOSITORY, 'previews': [{k: item[k] for k in ('version', 'tag', 'commit', 'size', 'sha256', 'pr')} for item in p.PREVIEWS]}))
`);
  assert.deepEqual(configuration, {
    repository: 'sodium-qed/aeries-playground',
    previews: [
      {
        version: '3.1.0', tag: 'v3.1.0-preview.1',
        commit: '858a0a1fac820163d1185664baa039624767928e', size: 379864,
        sha256: '5e37b76082308c0eb0f2bc1e472cb33bc4bd3b360a713ddbf8e192c655b33773', pr: 10,
      },
      {
        version: '3.1.1', tag: 'v3.1.1-preview.1',
        commit: '8fad3af92e680e67d6872f52dc998cbfde14d7fc', size: 383784,
        sha256: '3920c6c72f6b0d4ddfac82dad5d6f3bb560510cfe1d1ed193d43e3bb28136c4b', pr: 12,
      },
    ],
  });
});

const exercise = String.raw`
import base64, contextlib, copy, hashlib, importlib.util, io, json, os, pathlib, subprocess, sys
sys.dont_write_bytecode = True
module = importlib.util.spec_from_file_location('previews', sys.argv[1])
p = importlib.util.module_from_spec(module); module.loader.exec_module(p)
scenario = sys.argv[2]
specs = [dict(item) for item in p.PREVIEWS]
blobs = {}
for item in specs:
    text = '// ==UserScript==\n// @name Synthetic preview\n// @version ' + item['version'] + '\n// @match https://example.invalid/*\n// ==/UserScript==\nvoid 0;\n'
    if scenario == 'second-bad-metadata' and item == specs[1]: text = text.replace(item['version'], '0.0.0')
    if scenario == 'second-bad-syntax' and item == specs[1]: text += 'function {'
    data = text.encode(); item['size'] = len(data); item['sha256'] = hashlib.sha256(data).hexdigest(); blobs[item['tag']] = data
p.PREVIEWS = tuple(specs)
by_tag = {item['tag']: item for item in specs}; by_commit = {item['commit']: item for item in specs}
tags = {}; releases = {}; assets = {}; writes = []; source_reads = []; downloads = []; calls = []
latest = {'id':1, 'tag_name':'v3.0.0', 'draft':False, 'prerelease':False}
if scenario == 'different-current-stable': latest['tag_name'] = 'v3.1.0'; latest['id'] = 2
if scenario == 'invalid-latest': latest['prerelease'] = True
prefix = 'repos/' + p.REPOSITORY + '/'

def release(item, draft=False, asset=True):
    tag = item['tag']; tags[tag] = item['commit']; rid = 100 + item['pr']
    releases[tag] = {'id':rid,'tag_name':tag,'target_commitish':item['commit'],'name':p.title(item),'body':p.notes(item),'draft':draft,'prerelease':True}
    assets[tag] = [{'id':rid+1000,'name':p.SOURCE_NAME,'state':'uploaded','size':item['size'],'digest':'sha256:'+item['sha256']}] if asset else []

if scenario in {'published','draft','missing-asset','draft-conflict','notes-conflict','asset-conflict','download-conflict','stable-preview','duplicate-asset','missing-tag'}:
    for item in specs: release(item, draft=scenario in {'draft','missing-asset','draft-conflict'}, asset=scenario!='missing-asset')
    first = specs[0]['tag']
    if scenario == 'draft-conflict': releases[first]['target_commitish'] = 'e'*40
    if scenario == 'notes-conflict': releases[first]['body'] += ' conflicting edit'
    if scenario == 'asset-conflict': assets[first][0]['digest'] = 'sha256:'+'e'*64
    if scenario == 'stable-preview': releases[first]['prerelease'] = False
    if scenario == 'duplicate-asset': assets[first].append(dict(assets[first][0]))
    if scenario == 'missing-tag': del tags[first]
if scenario == 'tag-conflict': tags[specs[1]['tag']] = 'e'*40
if scenario == 'merged-recovery':
    for item in specs: release(item)

def api(path, absent_ok=False, paginate=False):
    calls.append(path)
    if path == 'repos/'+p.REPOSITORY:
        return {'full_name':p.REPOSITORY,'default_branch':'main','archived':scenario=='archived'}
    assert path.startswith(prefix), path
    path=path[len(prefix):]
    if path == 'releases/latest': return dict(latest)
    if path == 'releases?per_page=100':
        assert paginate
        return copy.deepcopy(list(releases.values()))
    if path.startswith('git/ref/tags/'):
        tag=path.removeprefix('git/ref/tags/')
        if tag not in tags:
            assert absent_ok
            return None
        return {'object':{'type':'commit','sha':tags[tag]}}
    if path.startswith('releases/') and path.endswith('/assets?per_page=100'):
        assert paginate
        rid=int(path.split('/')[1]); tag=next(k for k,r in releases.items() if r['id']==rid)
        return copy.deepcopy(assets[tag])
    if path.startswith('pulls/'):
        number=int(path.split('/')[1]); item=next(s for s in specs if s['pr']==number)
        head=item['commit']
        if scenario=='second-head-changed' and item==specs[1]:head='e'*40
        merged=scenario in {'merged-recovery','merged-without-preview'}
        return {'number':number,'state':'closed' if merged else 'open','draft':scenario=='draft-pr','merged':merged,
                'head':{'sha':head,'repo':{'full_name':p.REPOSITORY}},'base':{'ref':'main','repo':{'full_name':p.REPOSITORY}}}
    if path.startswith('commits/'):
        parts=path.split('/'); commit=parts[1]
        if len(parts)==2:return {'sha':commit}
        item=by_commit[commit]
        if parts[2].startswith('check-runs'):
            runs=[{'head_sha':commit,'name':p.REQUIRED_CHECK,'status':'completed','conclusion':'success'}]
            if scenario=='second-check-failed' and item==specs[1]:runs[0]['conclusion']='failure'
            if scenario=='missing-required-check':runs=[]
            return {'total_count':len(runs)+(1 if scenario=='truncated-checks' else 0),'check_runs':runs}
        if parts[2]=='status':return {'sha':commit,'total_count':1,'state':'pending' if scenario=='pending-status' else 'success'}
    if path.startswith('contents/'):
        commit=path.split('?ref=')[1];item=by_commit[commit];source_reads.append(item['tag']);data=blobs[item['tag']]
        if scenario=='second-source-conflict' and item==specs[1]:data+=b'changed'
        return {'type':'file','encoding':'base64','content':base64.b64encode(data).decode()}
    raise AssertionError(path)

def write(path, method, payload):
    # The real code must prepare and syntax-check both source files before any
    # mutation and may never operate on either scheduled stable release.
    assert set(source_reads)==set(by_tag), source_reads
    assert path.startswith(prefix)
    short=path[len(prefix):]
    if short=='git/refs':
        assert method=='POST'
        tag=payload['ref'].removeprefix('refs/tags/');assert tag in by_tag and tag not in tags
        assert payload['sha']==by_tag[tag]['commit'];tags[tag]=payload['sha']
        writes.append(['tag',tag]);return {'ref':payload['ref'],'object':{'sha':payload['sha'],'type':'commit'}}
    if short.startswith('releases/'):
        assert method=='PATCH'
        assert payload['prerelease'] is True and payload['draft'] is False and payload['make_latest']=='false'
        tag=payload['tag_name'];assert tag in by_tag and short=='releases/'+str(releases[tag]['id'])
        releases[tag].update({k:v for k,v in payload.items() if k!='make_latest'})
        writes.append(['publish',tag])
        if scenario=='latest-race':latest.update({'id':3,'tag_name':'v9.0.0'})
        return dict(releases[tag])
    raise AssertionError((path,method,payload))

failed_once=False

def gh(*args, check=True, **kwargs):
    global failed_once
    assert args[0]=='release',args
    action=args[1];tag=args[2];assert tag in by_tag;item=by_tag[tag]
    assert '--repo' in args and args[args.index('--repo')+1]==p.REPOSITORY
    if action=='download':
        folder=pathlib.Path(args[args.index('--dir')+1]);data=blobs[tag]
        if scenario in {'download-conflict','fresh-download-conflict'}:data+=b'corrupt'
        (folder/p.SOURCE_NAME).write_bytes(data);downloads.append(tag)
    elif action=='create':
        assert set(source_reads)==set(by_tag)
        assert tag not in releases and tags[tag]==item['commit']
        assert '--verify-tag' in args and '--draft' in args and '--prerelease' in args and '--latest=false' in args
        assert args[args.index('--target')+1]==item['commit']
        assert args[args.index('--title')+1]==p.title(item)
        assert pathlib.Path(args[args.index('--notes-file')+1]).read_text()==p.notes(item)
        assert pathlib.Path(args[3]).read_bytes()==blobs[tag]
        release(item,draft=True);writes.append(['create',tag])
        if scenario=='transient-create' and not failed_once:
            failed_once=True;raise RuntimeError('Synthetic create connection loss')
    elif action=='upload':
        assert not assets[tag] and '--clobber' not in args
        assert pathlib.Path(args[3]).read_bytes()==blobs[tag]
        assets[tag]=[{'id':1000+item['pr'],'name':p.SOURCE_NAME,'state':'uploaded','size':item['size'],'digest':'sha256:'+item['sha256']}]
        writes.append(['upload',tag])
    else:raise AssertionError(args)
    return subprocess.CompletedProcess(args,0,'{}','')

p.api=api;p.api_write=write;p.gh=gh
os.environ.update({'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':p.REPOSITORY,'GITHUB_REF':'refs/heads/main','GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_SHA':'a'*40})
if scenario.startswith('guard-'):
    field={'guard-actions':'GITHUB_ACTIONS','guard-repository':'GITHUB_REPOSITORY','guard-ref':'GITHUB_REF','guard-event':'GITHUB_EVENT_NAME','guard-sha':'GITHUB_SHA'}[scenario]
    os.environ[field]='wrong'
error=None;retry_error=None;first_write_count=None
with contextlib.redirect_stdout(io.StringIO()):
    try:p.main()
    except (RuntimeError,ValueError,subprocess.CalledProcessError) as exc:error=str(exc)
    if scenario in {'fresh','draft','missing-asset','transient-create'}:
        first_write_count=len(writes)
        try:p.main()
        except (RuntimeError,ValueError,subprocess.CalledProcessError) as exc:retry_error=str(exc)
print(json.dumps({'error':error,'retry_error':retry_error,'writes':writes,'first_write_count':first_write_count,'latest':latest,
                  'source_reads':source_reads,'downloads':downloads,'calls':len(calls),'tags':tags,'releases':list(releases.values())}))
`;

for (const scenario of ['fresh','draft','missing-asset','published','merged-recovery','different-current-stable']) {
  test(`approved preview publication succeeds safely for ${scenario}`, () => {
    const result=python(exercise,scenario);
    assert.equal(result.error,null);assert.equal(result.retry_error,null);
    assert.equal(result.latest.tag_name,scenario==='different-current-stable'?'v3.1.0':'v3.0.0');
    assert.deepEqual(Object.keys(result.tags).sort(),['v3.1.0-preview.1','v3.1.1-preview.1']);
    assert.equal(result.releases.length,2);
    for(const release of result.releases){assert.equal(release.draft,false);assert.equal(release.prerelease,true);}
    assert.ok(result.downloads.includes('v3.1.0-preview.1')&&result.downloads.includes('v3.1.1-preview.1'));
    if(['published','merged-recovery'].includes(scenario))assert.deepEqual(result.writes,[]);
    if(result.first_write_count!==null)assert.equal(result.writes.length,result.first_write_count,'Retry must not duplicate writes');
  });
}

for(const scenario of ['second-source-conflict','second-bad-metadata','second-bad-syntax','second-head-changed','second-check-failed',
  'tag-conflict','draft-conflict','notes-conflict','asset-conflict','download-conflict','stable-preview','duplicate-asset','missing-tag',
  'draft-pr','merged-without-preview','missing-required-check','truncated-checks','pending-status','archived','invalid-latest']) {
  test(`preview preflight rejects ${scenario} before any GitHub mutation`,()=>{
    const result=python(exercise,scenario);
    assert.ok(result.error);assert.deepEqual(result.writes,[]);
    assert.equal(result.latest.tag_name,'v3.0.0');
  });
}

for(const scenario of ['guard-actions','guard-repository','guard-ref','guard-event','guard-sha']) {
  test(`preview publisher rejects ${scenario} before GitHub access`,()=>{
    const result=python(exercise,scenario);assert.ok(result.error);assert.equal(result.calls,0);assert.deepEqual(result.writes,[]);
  });
}

test('a partial create recovers the exact draft without overwriting or duplicating its asset',()=>{
  const result=python(exercise,'transient-create');
  assert.match(result.error,/connection loss/);assert.equal(result.retry_error,null);
  assert.equal(result.writes.filter(([action,tag])=>action==='create'&&tag==='v3.1.0-preview.1').length,1);
  assert.equal(result.writes.filter(([action])=>action==='upload').length,0);
  assert.equal(result.releases.length,2);assert.ok(result.releases.every(r=>r.prerelease===true&&r.draft===false));
  assert.equal(result.latest.tag_name,'v3.0.0');
});

test('a concurrent Latest change stops publication and is preserved without resetting it',()=>{
  const result=python(exercise,'latest-race');assert.match(result.error,/Latest changed concurrently/);
  assert.equal(result.latest.tag_name,'v9.0.0');
  assert.deepEqual(result.writes.map(([action])=>action),['tag','create','publish']);
  assert.equal(result.releases[0].prerelease,true);assert.equal(result.releases.length,1);
});

test('a newly uploaded asset must pass an independent download check before its draft becomes public',()=>{
  const result=python(exercise,'fresh-download-conflict');
  assert.match(result.error,/fingerprint/);
  assert.deepEqual(result.writes.map(([action])=>action),['tag','create']);
  assert.equal(result.releases.length,1);assert.equal(result.releases[0].draft,true);
  assert.equal(result.latest.tag_name,'v3.0.0');
});
