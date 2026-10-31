"""Record verified 3.1.0 publication without changing source, tags, or assets.

Called only after the exact-commit publisher succeeds. Reverify public evidence,
prepare one documentation tree against current main, and update main without
force. A concurrent branch advance rejects the update. Issue closure follows
documentation success and can be recovered independently on a later run.
"""

from datetime import datetime, timezone
from pathlib import Path
import base64
import hashlib
import json
import os
import re
import subprocess
import sys

REPOSITORY = 'sodium-qed/aeries-playground'
PR_NUMBER = 10
HEAD_BRANCH = 'release/unify-developer-public-3.1.0'
EXPECTED_HEAD_SHA = '858a0a1fac820163d1185664baa039624767928e'
TAG = 'v3.1.0'
STABLE_TAG = 'v3.0.0'
ISSUE_NUMBER = 8
SOURCE_NAME = 'aeries-playground.user.js'
LAUNCH_TIME = datetime(2026, 11, 2, 7, 59, tzinfo=timezone.utc)
RESULT_PATH = 'docs/MERGE-RESULT.md'
PUBLICATION_GUIDES = ('SECURITY.md', 'docs/SETTINGS.md', 'docs/CALCULATIONS.md', 'docs/TROUBLESHOOTING.md')
DOCUMENT_PATHS = ('README.md', 'docs/FEATURES.md', 'docs/MERGE-PLAN.md', RESULT_PATH,
                  'docs/README.md', 'docs/MAINTENANCE.md', 'CONTRIBUTING.md',
                  'docs/DEVELOPMENT.md', *PUBLICATION_GUIDES)
COMPLETION_MARKER = '<!-- aeries-playground-3.1.0-completion -->'
RESULT_MARKER = '<!-- aeries-playground-3.1.0-result -->'
ROOT_URL = f'https://github.com/{REPOSITORY}'
RELEASE_URL = f'{ROOT_URL}/releases/tag/{TAG}'

# Only these reviewed passages are replaced. Unrelated or concurrently added
# documentation remains intact; an unfamiliar passage requires human review.
OLD_README_HEADING = '## Developer and public editions are being unified'
OLD_README_PARAGRAPH = 'The Developer **2.X** build and public **3.0.0** edition are planned to become one maintained **3.1.0** edition. Merge execution is scheduled for **Sunday, November 1, 2026, at 11:59 p.m. Pacific Standard Time** (`America/Los_Angeles`; November 2 at 07:59 UTC), subject to the prepared candidate passing its checks. The merge and release have not happened yet; the existing stable download remains available.'
OLD_README_DETAILS = "The integration brings over Developer assignment multipliers, native forecast display, additional validated score-precision recovery, and conservative rounding estimates while retaining the public edition's audited fixes. See the [merge plan, upgrade steps, and verification status](docs/MERGE-PLAN.md). Keep one installation enabled; no settings reset is required just to prepare for the merge."
OLD_STABLE_CHOICE = f'| [Stable release]({ROOT_URL}/releases/latest) | Open **Assets** and choose the attached `aeries-playground.user.js`. The current stable release is **3.0.0**; planned Developer additions are identified separately. |'
OLD_SOURCE_CHOICE = f'| [Install current source]({ROOT_URL}/raw/refs/heads/main/aeries-playground.user.js) | The moving `main` source. The scheduled integration introduces **3.1.0** source; source availability can precede verification of its stable release asset. Use a tagged download for a fixed version. |'
OLD_FEATURE_INTRO = 'This guide describes the published **3.0.0 stable release**, verified as Latest on October 26, 2026. The moving `main` source and a tagged asset remain distinct downloads.'
OLD_FEATURE_RELEASE_ROW = f'| [3.0.0 release]({ROOT_URL}/releases/tag/v3.0.0) · [3.0.0 userscript]({ROOT_URL}/releases/download/v3.0.0/aeries-playground.user.js) | The published stable artifact for the audited source. |'
OLD_LATEST_ROW = f'| [Latest stable release]({ROOT_URL}/releases/latest) | **3.0.0**, verified at publication; this shortcut can select a later stable release in the future. |'
OLD_FEATURE_PLAN = 'The supplied Developer **2.X** build and public **3.0.0** edition are being unified for **3.1.0**, with merge execution scheduled for **November 1, 2026, at 11:59 p.m. America/Los_Angeles (PST)**. This is a plan, not a published download. See the [merge plan](MERGE-PLAN.md) for candidate status and upgrade instructions.'
OLD_PLAN_INTRO = 'The supplied Developer **2.X** build and public **3.0.0** edition are being prepared as one maintained **3.1.0** edition. This document records the planned transition; it does not claim that a merge or publication has already succeeded.'
OLD_HUB_STATUS = 'The Developer and public editions are being prepared for one maintained 3.1.0 edition. See the [November 1 merge plan](MERGE-PLAN.md) for the scheduled time, feature differences, upgrade guidance, checks, and rollback. Planned features are not yet part of the published 3.0.0 asset.'
OLD_MAINT_STATUS = f'The next planned change is the Developer/public integration tracked in [issue #8]({ROOT_URL}/issues/8). Merge execution is scheduled for **Sunday, November 1, 2026, at 11:59 p.m. PST** (`America/Los_Angeles`, **2026-11-02T07:59:00Z**). The [merge plan](MERGE-PLAN.md) is the current runbook for scope, candidate verification, migration, publication, and recovery.'
OLD_MAINT_BASELINE = 'Public **3.0.0** remains the stable release during preparation. The supplied Developer **2.X** build predates its audit and will be integrated selectively, preserving newer public fixes. The planned **3.1.0** release needs its own frozen source fingerprint and guarded publisher; the 3.0.0 publisher must not be reused with an unverified replacement. Documentation preparation does not merge the runtime candidate or publish a release.'
OLD_CONTRIBUTING_STATUS = f'Developer and public editions are currently being prepared for a unified 3.1.0 release. Coordinate changes affecting that integration through [issue #8]({ROOT_URL}/issues/8) and the [merge plan](docs/MERGE-PLAN.md). Continue using focused pull requests; keep the scheduled integration candidate unmerged until its announced time and retain public audit fixes when resolving conflicts.'
OLD_DEVELOPMENT_STATUS = "The candidate source's **3.1.0** metadata identifies the Developer/public integration. Public **3.0.0** remains the last verified stable release, published October 26, 2026, until 3.1.0 publication is verified. A version label, source edit, or document edit does not prove publication. Keep current `main` distinct from frozen tagged assets and check the release itself before claiming availability."
PUBLICATION_NOTE_MARKER = '<!-- aeries-playground-3.1.0-publication-note -->'


def run(args, **kwargs):
    return subprocess.run(args, check=True, text=True, capture_output=True,
                          timeout=60, **kwargs)


def api(path, method='GET', payload=None):
    args = ['gh', 'api', path]
    if method != 'GET':
        args += ['--method', method, '--input', '-']
    result = run(args, input=json.dumps(payload) if payload is not None else None)
    return json.loads(result.stdout)


def require_sha(value, label):
    if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{40}', value):
        raise RuntimeError(f'{label} is not a valid commit SHA.')
    return value


def decoded_file(item, path):
    if not isinstance(item, dict) or item.get('type') != 'file' or item.get('encoding') != 'base64':
        raise RuntimeError(f'{path} is not an ordinary base64-encoded repository file.')
    content = item.get('content')
    if not isinstance(content, str):
        raise RuntimeError(f'{path} has no readable content.')
    return base64.b64decode(''.join(content.split()), validate=True)


def verify_source(sha, expected_hash, expected_size):
    item = api(f'repos/{REPOSITORY}/contents/{SOURCE_NAME}?ref={sha}')
    data = decoded_file(item, SOURCE_NAME)
    if len(data) != expected_size or hashlib.sha256(data).hexdigest() != expected_hash:
        raise RuntimeError('The source differs from the verified 3.1.0 artifact.')


def verify_release(merge_sha, source_hash, source_size):
    pr = api(f'repos/{REPOSITORY}/pulls/{PR_NUMBER}')
    if (pr.get('number') != PR_NUMBER or pr.get('merged') is not True
            or pr.get('state') != 'closed' or pr.get('merge_commit_sha') != merge_sha
            or pr.get('head', {}).get('sha') != EXPECTED_HEAD_SHA
            or pr.get('head', {}).get('ref') != HEAD_BRANCH
            or pr.get('head', {}).get('repo', {}).get('full_name') != REPOSITORY
            or pr.get('base', {}).get('ref') != 'main'
            or pr.get('base', {}).get('repo', {}).get('full_name') != REPOSITORY):
        raise RuntimeError('The prepared PR is not merged at its approved head and expected commit.')
    commit = api(f'repos/{REPOSITORY}/git/commits/{merge_sha}')
    parents = commit.get('parents', [])
    if (commit.get('sha') != merge_sha or len(parents) != 2
            or parents[1].get('sha') != EXPECTED_HEAD_SHA):
        raise RuntimeError('The merge commit does not contain the approved integration parent.')
    require_sha(parents[0].get('sha'), 'Merge base parent')
    tag = api(f'repos/{REPOSITORY}/git/ref/tags/{TAG}').get('object', {})
    for _ in range(5):
        if tag.get('type') != 'tag':
            break
        tag_sha = require_sha(tag.get('sha'), 'Annotated tag')
        tag = api(f'repos/{REPOSITORY}/git/tags/{tag_sha}').get('object', {})
    if tag.get('type') != 'commit' or tag.get('sha') != merge_sha:
        raise RuntimeError('The release tag does not resolve to the verified merge commit.')
    release = api(f'repos/{REPOSITORY}/releases/tags/{TAG}')
    stable = api(f'repos/{REPOSITORY}/releases/tags/{STABLE_TAG}')
    latest = api(f'repos/{REPOSITORY}/releases/latest')
    release_id = release.get('id')
    if (not isinstance(release_id, int) or release_id <= 0
            or release.get('tag_name') != TAG or release.get('draft') is not False
            or release.get('prerelease') is not True
            or not isinstance(stable.get('id'), int) or stable['id'] <= 0
            or stable.get('tag_name') != STABLE_TAG or stable.get('draft') is not False
            or stable.get('prerelease') is not False
            or latest.get('id') != stable['id'] or latest.get('tag_name') != STABLE_TAG
            or latest.get('draft') is not False or latest.get('prerelease') is not False):
        raise RuntimeError('The intended prerelease is not published or the stable Latest selection changed.')
    published_at = release.get('published_at')
    if not isinstance(published_at, str):
        raise RuntimeError('GitHub supplied no release publication timestamp.')
    published_time = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
    if published_time.tzinfo is None or published_time < LAUNCH_TIME:
        raise RuntimeError('The release publication time precedes the approved launch.')
    assets = [asset for asset in release.get('assets', []) if asset.get('name') == SOURCE_NAME]
    if len(assets) != 1:
        raise RuntimeError('The release has no unique userscript asset.')
    asset = assets[0]
    if (not isinstance(asset.get('id'), int) or asset['id'] <= 0
            or asset.get('state') != 'uploaded' or asset.get('size') != source_size
            or asset.get('digest') != 'sha256:' + source_hash):
        raise RuntimeError('The public asset metadata does not match the verified bytes and digest.')
    verify_source(merge_sha, source_hash, source_size)
    return {'merge_sha': merge_sha, 'source_sha256': source_hash, 'source_size': source_size,
            'published_at': published_at, 'release_id': release_id, 'asset_id': asset['id'],
            'stable_release_id': stable['id']}


def replace_once(text, old, new, label):
    old_count, new_count = text.count(old), text.count(new)
    if old_count == 1 and new_count == 0:
        return text.replace(old, new, 1)
    if old_count == 0 and new_count == 1:
        return text
    raise RuntimeError(f'{label} changed unexpectedly; completion documentation needs review.')


def contextualize_guide(text, path):
    target = 'docs/MERGE-RESULT.md' if path == 'SECURITY.md' else 'MERGE-RESULT.md'
    note = f'{PUBLICATION_NOTE_MARKER}\n\n**Publication update:** Unified **3.1.0** has been published and verified as a **prerelease**; see [the merge result]({target}). Sections labeled **Planned 3.1.0** and references to a candidate below preserve the preparation-era labels and describe additions included in that prerelease. **3.0.0 remains the stable Latest release.** The recorded browser-verification limits still apply.\n\n'
    if PUBLICATION_NOTE_MARKER in text:
        if text.count(PUBLICATION_NOTE_MARKER) != 1 or text.count(note) != 1:
            raise RuntimeError(f'{path} has an unfamiliar publication note; review before changing it.')
        return text
    heading = re.match(r'\A# [^\n]+\n\n', text)
    if not heading:
        raise RuntimeError(f'{path} has an unfamiliar document heading.')
    return text[:heading.end()] + note + text[heading.end():]


def result_document(facts):
    return f'''# Verified Developer/public merge result

{RESULT_MARKER}

The Developer and public editions were unified in the **3.1.0 prerelease**. GitHub evidence was checked before this record was written. **3.0.0 remains the stable Latest release.**

| Evidence | Verified value |
| --- | --- |
| Integration PR | [#{PR_NUMBER}]({ROOT_URL}/pull/{PR_NUMBER}) |
| Approved integration head | `{EXPECTED_HEAD_SHA}` |
| Merge commit | [`{facts['merge_sha']}`]({ROOT_URL}/commit/{facts['merge_sha']}) |
| Prerelease | [{TAG}]({RELEASE_URL}) — published with `prerelease: true`; not selected as stable Latest |
| Stable Latest | [{STABLE_TAG}]({ROOT_URL}/releases/tag/{STABLE_TAG}) — unchanged; release ID `{facts['stable_release_id']}` |
| Publication timestamp reported by GitHub | `{facts['published_at']}` |
| Release / asset IDs | `{facts['release_id']}` / `{facts['asset_id']}` |
| Userscript bytes | `{facts['source_size']}` |
| Userscript SHA-256 | `{facts['source_sha256']}` |

The scheduled merger and guarded publisher run the complete regression suite, userscript syntax/basic-metadata checker, local documentation-link checker, and whitespace checks before publication. The [workflow runs]({ROOT_URL}/actions/workflows/scheduled-merge.yml) contain execution evidence. The [original preparation record](MERGE-PLAN.md#original-schedule-and-preparation-record) preserves its historical test counts; this completion record does not invent a new test count.

This recorder independently checked the merged PR and approved head, merge parents, exact tag target, public prerelease state, unchanged 3.0.0 stable Latest selection, unique asset size and SHA-256 metadata, and repository source bytes. The publisher separately downloads and hashes the asset before requesting this record. Live Aeries rendering, actual userscript-manager migration, live schedule accuracy, and audible media remain unverified.

Install one copy using the [manual update instructions](SETTINGS.md#update-the-userscript). Historical releases and their tags/assets remain preserved.
'''


def render_documents(originals, facts):
    record = result_document(facts)
    existing_record = originals.get(RESULT_PATH)
    if existing_record is not None and existing_record != record:
        raise RuntimeError('An existing merge-result record differs; do not overwrite historical evidence.')
    readme = originals['README.md']
    readme = replace_once(readme, OLD_README_HEADING, '## Developer and public editions are unified', 'README announcement heading')
    readme = replace_once(readme, OLD_README_PARAGRAPH,
        f'The Developer **2.X** build and public **3.0.0** edition are now unified in the [3.1.0 prerelease]({RELEASE_URL}), which has been published and verified. **3.0.0 remains the stable Latest release.** See the [merge result](docs/MERGE-RESULT.md) for the exact commit, artifact fingerprint, and verification limits.', 'README announcement')
    readme = replace_once(readme, OLD_README_DETAILS,
        "The integration adds Developer assignment multipliers, native forecast display, additional validated score-precision recovery, and conservative rounding estimates while retaining the public edition's audited fixes. Follow the [upgrade steps](docs/MERGE-PLAN.md#upgrade-from-either-edition), keep one installation enabled, and review the saved settings after updating. An ordinary update does not require clearing settings.", 'README integration details')
    readme = replace_once(readme, OLD_STABLE_CHOICE,
        f'| [Stable release]({ROOT_URL}/releases/latest) | **3.0.0** remains the verified stable Latest release. Open **Assets** and choose `aeries-playground.user.js`. |\n| [3.1.0 prerelease]({RELEASE_URL}) | The unified edition is available separately as a prerelease; use its tagged asset for a fixed version. |', 'README stable download')
    readme = replace_once(readme, OLD_SOURCE_CHOICE,
        f'| [Install current source]({ROOT_URL}/raw/refs/heads/main/aeries-playground.user.js) | The moving `main` source includes the unified **3.1.0** integration. Later development can differ from the tagged prerelease asset. |', 'README source download')
    features = originals['docs/FEATURES.md']
    features = replace_once(features, OLD_FEATURE_INTRO,
        'This guide includes the published **3.1.0 unified prerelease**. See the [verified merge result](MERGE-RESULT.md) for publication and artifact evidence. **3.0.0 remains the stable Latest release**; its October 26, 2026 verification remains valid audit evidence. The moving `main` source and a tagged asset remain distinct downloads.', 'Feature release introduction')
    new_release_rows = f'| [3.1.0 prerelease]({RELEASE_URL}) · [3.1.0 userscript]({ROOT_URL}/releases/download/{TAG}/{SOURCE_NAME}) | The verified unified prerelease artifact. |\n' + OLD_FEATURE_RELEASE_ROW.replace('The published stable artifact for the audited source.', 'The audited stable artifact, still selected as Latest.')
    features = replace_once(features, OLD_FEATURE_RELEASE_ROW, new_release_rows, 'Feature release rows')
    features = replace_once(features, OLD_LATEST_ROW, f'| [Latest stable release]({ROOT_URL}/releases/latest) | **3.0.0** remains the stable Latest release after 3.1.0 prerelease publication. |', 'Feature Latest row')
    features = replace_once(features, '### Planned Developer and public integration',
        '<a id="planned-developer-and-public-integration"></a>\n\n### Developer and public integration in 3.1.0', 'Feature integration heading')
    features = replace_once(features, OLD_FEATURE_PLAN,
        'The supplied Developer **2.X** build and public **3.0.0** edition have been unified in the **3.1.0 prerelease**. The [verified merge result](MERGE-RESULT.md) records publication; the [merge plan](MERGE-PLAN.md) retains the original November 1, 2026, 11:59 p.m. America/Los_Angeles (PST) schedule and upgrade instructions.', 'Feature integration status')
    features = replace_once(features, '| Feature | Public 3.0.0 | Planned unified 3.1.0 |',
        '| Feature | Public 3.0.0 | Unified 3.1.0 |', 'Feature comparison heading')
    plan = originals['docs/MERGE-PLAN.md']
    plan = replace_once(plan, OLD_PLAN_INTRO,
        'The supplied Developer **2.X** build and public **3.0.0** edition were unified as the **3.1.0 prerelease**. **3.0.0 remains stable Latest.** The completion evidence below is current; the original schedule, preparation counts, and execution instructions remain preserved as a historical record.', 'Merge plan introduction')
    outcome = f'''## Verified completion

{COMPLETION_MARKER}

[PR #{PR_NUMBER}]({ROOT_URL}/pull/{PR_NUMBER}) merged as [`{facts['merge_sha']}`]({ROOT_URL}/commit/{facts['merge_sha']}). [{TAG}]({RELEASE_URL}) was published at `{facts['published_at']}` and verified as a prerelease. **3.0.0 remains the stable Latest release.** The userscript is **{facts['source_size']} bytes**, SHA-256 `{facts['source_sha256']}`. The guarded workflow runs its full checks before publication; original preparation test counts below remain unchanged. See [the result and evidence limits](MERGE-RESULT.md).

## Original schedule and preparation record'''
    plan = replace_once(plan, '## Schedule and current status', outcome, 'Merge plan completion status')
    hub = replace_once(originals['docs/README.md'], OLD_HUB_STATUS,
        'The Developer and public editions are unified in the published **3.1.0 prerelease**. See the [verified merge result](MERGE-RESULT.md) for artifact evidence and the [original merge plan](MERGE-PLAN.md) for the preserved schedule, upgrade guidance, checks, and rollback. **3.0.0 remains the stable Latest release.**', 'Documentation hub status')
    maintenance = replace_once(originals['docs/MAINTENANCE.md'],
        '## Active Developer and public merge preparation', '## Verified Developer and public integration', 'Maintenance status heading')
    maintenance = replace_once(maintenance, OLD_MAINT_STATUS,
        f'The Developer/public integration tracked in [issue #8]({ROOT_URL}/issues/8) has completed. The [3.1.0 prerelease]({RELEASE_URL}) and its exact artifact were verified; **3.0.0 remains stable Latest**. See the [merge result](MERGE-RESULT.md). The original scheduled start was **Sunday, November 1, 2026, at 11:59 p.m. PST** (`America/Los_Angeles`, **2026-11-02T07:59:00Z**); the [merge plan](MERGE-PLAN.md) preserves preparation and recovery details.', 'Maintenance integration status')
    maintenance = replace_once(maintenance, OLD_MAINT_BASELINE,
        'Public **3.0.0** remains the stable Latest release. The **3.1.0 prerelease** selectively integrates Developer **2.X** features into the audited public base, preserving newer fixes. Its publisher uses the frozen 3.1.0 fingerprint and retained safeguards. The 3.0.0 tag, asset, and audit remain unchanged; the preparation test count below remains the count recorded on its original date.', 'Maintenance stable baseline')
    result = {'README.md': readme, 'docs/FEATURES.md': features,
              'docs/MERGE-PLAN.md': plan, RESULT_PATH: record,
              'docs/README.md': hub, 'docs/MAINTENANCE.md': maintenance}
    result['CONTRIBUTING.md'] = replace_once(originals['CONTRIBUTING.md'], OLD_CONTRIBUTING_STATUS,
        'Developer and public editions are unified in the verified **3.1.0 prerelease**. **3.0.0 remains stable Latest.** The [merge result](docs/MERGE-RESULT.md) records the completed integration; the [merge plan](docs/MERGE-PLAN.md) preserves its original schedule and recovery instructions. Continue using focused pull requests and retain the public audit fixes when resolving conflicts.', 'Contribution integration status')
    result['docs/DEVELOPMENT.md'] = replace_once(originals['docs/DEVELOPMENT.md'], OLD_DEVELOPMENT_STATUS,
        'The **3.1.0** source metadata identifies the published Developer/public integration prerelease, verified in the [merge result](MERGE-RESULT.md). **3.0.0**, published October 26, 2026, remains the stable Latest release. A version label alone does not prove publication. Keep current `main` distinct from frozen tagged assets and check the release itself before claiming availability.', 'Development release status')
    result.update({path: contextualize_guide(originals[path], path) for path in PUBLICATION_GUIDES})
    return result


def read_main():
    ref = api(f'repos/{REPOSITORY}/git/ref/heads/main')
    if ref.get('object', {}).get('type') != 'commit':
        raise RuntimeError('Main does not point to a commit.')
    return require_sha(ref['object'].get('sha'), 'Main head')


def commit_documents(facts):
    parent = read_main()
    comparison = api(f"repos/{REPOSITORY}/compare/{facts['merge_sha']}...{parent}")
    if (comparison.get('status') not in {'ahead', 'identical'}
            or comparison.get('merge_base_commit', {}).get('sha') != facts['merge_sha']):
        raise RuntimeError('Current main no longer contains the verified merge.')
    verify_source(parent, facts['source_sha256'], facts['source_size'])
    parent_commit = api(f'repos/{REPOSITORY}/git/commits/{parent}')
    tree_sha = require_sha(parent_commit.get('tree', {}).get('sha'), 'Main tree')
    tree = api(f'repos/{REPOSITORY}/git/trees/{tree_sha}?recursive=1')
    if tree.get('truncated') is not False:
        raise RuntimeError('The repository tree is incomplete.')
    by_path = {item['path']: item for item in tree.get('tree', []) if isinstance(item, dict) and isinstance(item.get('path'), str)}
    originals = {}
    for path in DOCUMENT_PATHS:
        entry = by_path.get(path)
        if entry is None and path == RESULT_PATH:
            originals[path] = None
            continue
        if not entry or entry.get('type') != 'blob' or entry.get('mode') != '100644':
            raise RuntimeError(f'{path} is missing or not an ordinary documentation file.')
        item = api(f'repos/{REPOSITORY}/contents/{path}?ref={parent}')
        originals[path] = decoded_file(item, path).decode('utf-8')
    updated = render_documents(originals, facts)
    changes = {path: content for path, content in updated.items() if content != originals[path]}
    if not changes:
        return parent
    # Build one tree/commit, then optimistically lease the branch. The nonforce
    # update rejects a concurrent main advance even if it races the second read.
    elements = []
    for path, content in changes.items():
        blob = api(f'repos/{REPOSITORY}/git/blobs', method='POST', payload={'content': content, 'encoding': 'utf-8'})
        elements.append({'path': path, 'mode': '100644', 'type': 'blob', 'sha': require_sha(blob.get('sha'), 'Documentation blob')})
    new_tree = api(f'repos/{REPOSITORY}/git/trees', method='POST', payload={'base_tree': tree_sha, 'tree': elements})
    new_commit = api(f'repos/{REPOSITORY}/git/commits', method='POST', payload={
        'message': 'Record verified Developer/public 3.1.0 publication',
        'tree': require_sha(new_tree.get('sha'), 'Documentation tree'), 'parents': [parent]})
    new_sha = require_sha(new_commit.get('sha'), 'Documentation commit')
    if verify_release(facts['merge_sha'], facts['source_sha256'], facts['source_size']) != facts:
        raise RuntimeError('Publication evidence changed during documentation preparation.')
    if read_main() != parent:
        raise RuntimeError('Main changed during documentation preparation; retry without forcing the branch.')
    updated_ref = api(f'repos/{REPOSITORY}/git/refs/heads/main', method='PATCH', payload={'sha': new_sha, 'force': False})
    if updated_ref.get('object', {}).get('type') != 'commit' or updated_ref['object'].get('sha') != new_sha:
        raise RuntimeError('GitHub did not confirm the documentation ref update; inspect main before recovery.')
    return new_sha


def close_tracking_issue():
    path = f'repos/{REPOSITORY}/issues/{ISSUE_NUMBER}'
    issue = api(path)
    if issue.get('number') != ISSUE_NUMBER or issue.get('pull_request') is not None:
        raise RuntimeError('The tracking issue identity changed.')
    # Do not rewrite the issue body or add a message: the linked merge plan and
    # result file contain the evidence. State-only closure preserves other edits.
    if issue.get('state') != 'closed' or issue.get('state_reason') != 'completed':
        updated = api(path, method='PATCH', payload={'state': 'closed', 'state_reason': 'completed'})
        if (updated.get('number') != ISSUE_NUMBER or updated.get('state') != 'closed'
                or updated.get('state_reason') != 'completed'):
            raise RuntimeError('GitHub did not confirm completion of the tracking issue.')


def main(merge_sha, source_sha256, source_size, now=None):
    if (os.environ.get('GITHUB_ACTIONS') != 'true'
            or os.environ.get('GITHUB_REPOSITORY') != REPOSITORY
            or os.environ.get('GITHUB_REF') != 'refs/heads/main'):
        raise RuntimeError('Completion recording requires the intended main-branch Actions workflow.')
    if (now or datetime.now(timezone.utc)) < LAUNCH_TIME:
        raise RuntimeError('The approved launch time has not arrived.')
    require_sha(merge_sha, 'Merge commit')
    require_sha(EXPECTED_HEAD_SHA, 'Approved integration head')
    if (not isinstance(source_sha256, str) or not re.fullmatch(r'[0-9a-f]{64}', source_sha256)
            or not isinstance(source_size, int) or isinstance(source_size, bool) or source_size <= 0):
        raise RuntimeError('The expected source fingerprint is invalid.')
    facts = verify_release(merge_sha, source_sha256, source_size)
    commit = commit_documents(facts)
    close_tracking_issue()
    print(f'Verified publication recorded in documentation commit {commit}; issue #{ISSUE_NUMBER} is complete.')


if __name__ == '__main__':
    try:
        if len(sys.argv) != 4:
            raise RuntimeError('Usage: record-merge-completion.py MERGE_SHA SOURCE_SHA256 SOURCE_SIZE')
        main(sys.argv[1], sys.argv[2], int(sys.argv[3]))
    except (RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired,
            ValueError, KeyError, TypeError) as error:
        detail = error.stderr if isinstance(error, subprocess.CalledProcessError) else str(error)
        raise SystemExit(f'Publication verified previously; completion documentation/issue recording stopped: {detail or error}') from error
