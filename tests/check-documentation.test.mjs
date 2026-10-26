import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { headingAnchors, inlineLinks, checkDocumentation } from '../scripts/check-documentation.mjs';

test('anchors preserve Unicode and distinguish repeated and colliding headings', () => {
  const anchors = headingAnchors('# Café: `Score` & settings\n## Grade\n## Grade\n## Grade-1\n<a id="old-guide"></a>');
  for (const name of ['café-score--settings', 'grade', 'grade-1', 'grade-1-1', 'old-guide']) assert.ok(anchors.has(name), name);
});

test('fenced examples, inline code, and HTML comments do not create links or headings', () => {
  const source = '# Real\n```md\n# Fake\n[broken](missing.md)\n```\n~~~\n[another](missing.md)\n~~~\n`[code](missing.md)`\n<!-- [hidden](missing.md) -->\n[real](#real)';
  assert.deepEqual(inlineLinks(source).map(x => x.target), ['#real']);
  assert.deepEqual([...headingAnchors(source)], ['real']);
});

test('inline destinations support titles, escaped parentheses, and angle paths', () => {
  assert.deepEqual(inlineLinks('[a](a(b).md "title") [b](file\\(x\\).md) [c](<file name.md>)').map(x => x.target), ['a(b).md', 'file(x).md', 'file name.md']);
});

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'playground-docs-'));
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
}

test('local paths, headings, explicit anchors, and encoded spaces resolve across directories', async () => fixture(async root => {
  await mkdir(join(root, 'docs'));
  await writeFile(join(root, 'README.md'), '# Home\n[guide](docs/guide.md?plain=1#setup) [old](docs/guide.md#legacy) [asset](docs/file%20name.txt) [folder](docs) [hash](docs/file%23name.txt)');
  await writeFile(join(root, 'docs/guide.md'), '# Setup\n<a id="legacy"></a>\n[home](../README.md#home)');
  await writeFile(join(root, 'docs/file name.txt'), 'example');
  await writeFile(join(root, 'docs/file#name.txt'), 'example');
  const result = await checkDocumentation(root);
  assert.equal(result.checked, 6);
  assert.deepEqual(result.errors, []);
}));

test('missing files, missing anchors, invalid escapes, and escaping the repository fail', async () => fixture(async root => {
  await writeFile(join(root, 'README.md'), '# Home\n[a](missing.md) [b](#absent) [c](bad%Q0.md) [d](../outside.md) [empty]()');
  const result = await checkDocumentation(root);
  assert.equal(result.errors.length, 5);
  for (const kind of ['missing file', 'missing heading', 'invalid URL escape', 'outside repository', 'missing destination']) assert.ok(result.errors.some(x => x.includes(kind)), kind);
}));

test('external URLs are not fetched and ignored directories and symlinks are not traversed', async () => fixture(async root => {
  await mkdir(join(root, 'private-debug'));
  await writeFile(join(root, 'private-debug/private.md'), '[secret](missing.md)');
  await symlink(join(root, 'private-debug'), join(root, 'linked-private'));
  await writeFile(join(root, 'README.md'), '# Home\n[external](https://example.invalid/missing) [mail](mailto:test@example.invalid)');
  const result = await checkDocumentation(root);
  assert.equal(result.files, 1);
  assert.equal(result.checked, 0);
  assert.deepEqual(result.errors, []);
}));

test('linked targets cannot escape through symlinks and internal aliases check real anchors', { skip: process.platform === 'win32' }, async () => fixture(async root => fixture(async outside => {
  await writeFile(join(outside, 'secret.md'), '# Secret');
  await symlink(outside, join(root, 'escape'));
  await writeFile(join(root, 'guide.md'), '# Real');
  await symlink(join(root, 'guide.md'), join(root, 'alias.md'));
  await writeFile(join(root, 'README.md'), '[outside](escape/secret.md#secret) [valid](alias.md#real) [broken](alias.md#absent)');
  const result = await checkDocumentation(root);
  assert.equal(result.files, 2);
  assert.equal(result.errors.length, 2);
  assert.ok(result.errors.some(error => error.includes('outside repository through a symlink')));
  assert.ok(result.errors.some(error => error.includes('missing heading')));
})));
