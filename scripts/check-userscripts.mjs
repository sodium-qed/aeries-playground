import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Script } from 'node:vm';

const ignoredDirectories = new Set([
  '.git', 'node_modules', 'coverage', 'private-debug', 'page-dumps', 'browser-profile',
]);

/** Parse classic userscript syntax and basic metadata without executing the code. */
export function checkSource(source, filename = 'example.user.js') {
  if (typeof source !== 'string') throw new TypeError('Source must be a string.');
  const errors = [];
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const header = text.match(/^\/\/[ \t]*==UserScript==[ \t]*\n([\s\S]*?)\n\/\/[ \t]*==\/UserScript==[ \t]*(?:\n|$)/);

  if (!header) {
    errors.push('A complete userscript metadata header must be the first content.');
  } else {
    const entries = new Map();
    for (const line of header[1].split('\n')) {
      const entry = line.match(/^\/\/[ \t]*@(\S+)(?:[ \t]+(.*))?$/);
      if (entry && entry[2]?.trim()) entries.set(entry[1], entry[2].trim());
    }
    for (const key of ['name', 'version', 'description']) {
      if (!entries.has(key)) errors.push(`Missing non-empty @${key}.`);
    }
    if (!entries.has('match') && !entries.has('include')) {
      errors.push('Missing a non-empty @match or @include URL rule.');
    }
  }

  try {
    // Compilation only: never call runInContext/runInNewContext/runInThisContext.
    new Script(text, { filename });
  } catch (error) {
    errors.push(`JavaScript syntax error: ${error.message}`);
  }
  return errors;
}

/** Discover regular .user.js files; do not follow symlinks into other locations. */
export async function findUserscripts(root) {
  const files = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) await walk(path);
      else if (entry.isFile() && entry.name.endsWith('.user.js')) files.push(path);
    }
  }
  await walk(root);
  return files.sort();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--allow-empty')) {
    console.error('Usage: node scripts/check-userscripts.mjs [--allow-empty]');
    process.exitCode = 2;
    return;
  }

  const root = process.cwd();
  const files = await findUserscripts(root);
  if (!files.length) {
    const message = 'No .user.js files found. This is repository setup, not a tested userscript release.';
    console.warn(message);
    process.exitCode = args.includes('--allow-empty') ? 0 : 1;
    return;
  }

  let failures = 0;
  for (const file of files) {
    const name = relative(root, file);
    const errors = checkSource(await readFile(file, 'utf8'), name);
    if (errors.length) {
      failures += 1;
      console.error(`FAIL ${name}\n${errors.map((error) => `  ${error}`).join('\n')}`);
    } else {
      console.log(`PASS ${name} (syntax and basic metadata only)`);
    }
  }
  console.log(`Checked ${files.length} userscript(s); ${failures} failed.`);
  process.exitCode = failures ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Unable to check userscripts: ${error.message}`);
    process.exitCode = 1;
  });
}
