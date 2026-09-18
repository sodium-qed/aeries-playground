import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { checkSource, findUserscripts } from '../scripts/check-userscripts.mjs';

const valid = `// ==UserScript==
// @name Example
// @version 0.1.0
// @description Synthetic checker fixture
// @match https://example.invalid/*
// ==/UserScript==
(() => { document.title = 'Example'; })();
`;
const cli = fileURLToPath(new URL('../scripts/check-userscripts.mjs', import.meta.url));

async function temporaryDirectory(t) {
  const root = await mkdtemp(join(tmpdir(), 'aeries-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function runCLI(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
}

test('accepts a classic userscript without executing browser-specific code', () => {
  assert.deepEqual(checkSource(valid), []);
  assert.deepEqual(checkSource(valid + "throw new Error('Do not execute');"), []);
});

test('accepts BOM and Windows line endings', () => {
  assert.deepEqual(checkSource('\uFEFF' + valid.replace(/\n/g, '\r\n')), []);
});

test('accepts include as an alternative URL rule', () => {
  assert.deepEqual(checkSource(valid.replace('@match', '@include')), []);
});

test('rejects missing, incomplete, or misplaced headers', () => {
  for (const text of ['const a = 1;', valid.replace('// ==/UserScript==', '// missing'), '0;\n' + valid]) {
    assert.ok(checkSource(text).some((error) => error.includes('header')));
  }
});

test('requires non-empty project metadata fields', () => {
  for (const key of ['name', 'version', 'description', 'match']) {
    const text = valid.replace(new RegExp(`// @${key}[^\\n]*`), `// @${key}   `);
    assert.ok(checkSource(text).some((error) => error.includes(`@${key}`)), key);
  }
});

test('reports a JavaScript syntax error', () => {
  assert.ok(checkSource(valid + '\nconst = ;').some((error) => error.includes('syntax')));
});

test('discovers nested userscripts but skips dependencies and private directories', async (t) => {
  const root = await temporaryDirectory(t);
  for (const directory of ['src', 'node_modules', '.git', 'private-debug']) {
    await mkdir(join(root, directory));
    await writeFile(join(root, directory, 'sample.user.js'), valid);
  }
  await writeFile(join(root, 'ordinary.js'), '');
  assert.deepEqual(await findUserscripts(root), [join(root, 'src', 'sample.user.js')]);
});

test('does not follow symlinked scripts or directories', { skip: process.platform === 'win32' }, async (t) => {
  const root = await temporaryDirectory(t);
  const outside = await temporaryDirectory(t);
  await writeFile(join(outside, 'sample.user.js'), valid);
  await symlink(outside, join(root, 'linked-directory'));
  await symlink(join(outside, 'sample.user.js'), join(root, 'linked.user.js'));
  assert.deepEqual(await findUserscripts(root), []);
});

test('empty repository fails strict checking but explicitly passes bootstrap mode', async (t) => {
  const root = await temporaryDirectory(t);
  assert.equal(runCLI(root).status, 1);
  const bootstrap = runCLI(root, '--allow-empty');
  assert.equal(bootstrap.status, 0);
  assert.match(bootstrap.stderr, /not a tested userscript release/);
});

test('CLI rejects unknown flags and fails a broken script even in bootstrap mode', async (t) => {
  const root = await temporaryDirectory(t);
  assert.equal(runCLI(root, '--unknown').status, 2);
  await writeFile(join(root, 'broken.user.js'), 'const = ;');
  assert.equal(runCLI(root, '--allow-empty').status, 1);
});

test('CLI validates a script without executing it', async (t) => {
  const root = await temporaryDirectory(t);
  await writeFile(join(root, 'example.user.js'), valid + "throw new Error('Do not execute');");
  const result = runCLI(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 userscript\(s\); 0 failed/);
});
