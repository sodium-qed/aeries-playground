import { readdir, readFile, realpath } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ignoredDirectories = new Set([
  '.git', 'node_modules', 'coverage', 'private-debug', 'page-dumps', 'browser-profile',
]);

// Keep examples out of link checks. Preserve line breaks for useful diagnostics.
export function proseOnly(source) {
  let fence = null;
  return source.replace(/<!--[\s\S]*?-->/g, text => text.replace(/[^\n]/g, ' '))
    .split('\n').map(line => {
      const match = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
      if (fence) {
        if (match && match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) fence = null;
        return '';
      }
      if (match) { fence = match[1]; return ''; }
      return line;
    }).join('\n');
}

/** Anchors used by this repository's ATX headings and explicit HTML IDs. */
export function headingAnchors(source) {
  const text = proseOnly(source);
  const anchors = new Set();
  const used = new Set();
  for (const match of text.matchAll(/<(?:a|[a-z][a-z0-9]*)\b[^>]*\b(?:id|name)=["']([^"']+)["'][^>]*>/gi)) anchors.add(match[1]);
  for (const line of text.split('\n')) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!heading) continue;
    const plain = heading[1].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '');
    const base = plain.toLowerCase().replace(/[^\p{L}\p{M}\p{N}_\- ]/gu, '').replace(/ /g, '-');
    let slug = base;
    for (let suffix = 1; used.has(slug); suffix++) slug = `${base}-${suffix}`;
    used.add(slug);
    anchors.add(slug);
  }
  return anchors;
}

/** Read inline Markdown destinations, including nested parentheses and titles. */
export function inlineLinks(source) {
  const text = proseOnly(source).replace(/(`+)[^\n]*?\1/g, match => ' '.repeat(match.length));
  const links = [];
  const start = /!?\[[^\]\n]*\]\(/g;
  for (let match; (match = start.exec(text));) {
    let index = start.lastIndex;
    while (/\s/.test(text[index] || '') && index < text.length) index++;
    let target = '';
    if (text[index] === '<') {
      const end = text.indexOf('>', index + 1);
      if (end < 0) continue;
      target = text.slice(index + 1, end);
    } else {
      let depth = 0;
      for (; index < text.length; index++) {
        const char = text[index];
        if (char === '\\' && index + 1 < text.length) { target += text[++index]; continue; }
        if (char === '(') depth++;
        if (char === ')') { if (!depth) break; depth--; }
        if (/\s/.test(char) && !depth) break;
        target += char;
      }
    }
    links.push({ target, line: text.slice(0, match.index).split('\n').length });
  }
  return links;
}

async function markdownFiles(root) {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) await walk(path);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
    }
  }
  await walk(root);
  return files.sort();
}

/** Check local inline links; no network requests or browser rendering. */
export async function checkDocumentation(root) {
  root = await realpath(resolve(root));
  const files = await markdownFiles(root);
  const documents = new Map(await Promise.all(files.map(async file => [file, await readFile(file, 'utf8')])));
  const anchors = new Map([...documents].map(([file, text]) => [file, headingAnchors(text)]));
  const errors = [];
  let checked = 0;
  for (const [file, text] of documents) {
    for (const { target, line } of inlineLinks(text)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target)) continue;
      checked++;
      const label = `${relative(root, file)}:${line}: ${target || '(empty link)'}`;
      if (!target) { errors.push(`${label}: missing destination`); continue; }
      const hash = target.indexOf('#');
      const rawPath = (hash < 0 ? target : target.slice(0, hash)).split('?')[0];
      let path, fragment;
      try {
        path = decodeURIComponent(rawPath);
        fragment = hash < 0 ? '' : decodeURIComponent(target.slice(hash + 1));
      }
      catch { errors.push(`${label}: invalid URL escape`); continue; }
      const destination = path ? resolve(dirname(file), path) : file;
      if (destination !== root && !destination.startsWith(root + sep)) {
        errors.push(`${label}: outside repository`); continue;
      }
      let canonical;
      try { canonical = await realpath(destination); }
      catch { errors.push(`${label}: missing file or directory`); continue; }
      if (canonical !== root && !canonical.startsWith(root + sep)) {
        errors.push(`${label}: outside repository through a symlink`); continue;
      }
      if (fragment && anchors.has(canonical) && !anchors.get(canonical).has(fragment)) errors.push(`${label}: missing heading or explicit anchor`);
    }
  }
  return { files: files.length, checked, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) {
    console.error('Usage: node scripts/check-documentation.mjs');
    process.exitCode = 2;
  } else {
    try {
      const result = await checkDocumentation(process.cwd());
      for (const error of result.errors) console.error(`FAIL ${error}`);
      console.log(`Checked ${result.checked} local inline links in ${result.files} Markdown files; ${result.errors.length} failed. External URLs, reference-style links, YAML, and rendered layout are not checked.`);
      process.exitCode = result.errors.length ? 1 : 0;
    } catch (error) {
      console.error(`Unable to check documentation: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
