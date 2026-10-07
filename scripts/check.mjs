import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, loadData, validateData } from '../src/data.mjs';

const data = validateData(await loadData());
async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) await checkDirectory(url);
    else if (/\.(mjs|js)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', fileURLToPath(url)], { encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr);
    }
  }
}
await checkDirectory(new URL('src/', ROOT));
await checkDirectory(new URL('scripts/', ROOT));
await checkDirectory(new URL('tests/', ROOT));
const css = await readFile(new URL('src/assets/styles.css', ROOT), 'utf8');
const logo = await readFile(new URL('src/partials/logo.html', ROOT), 'utf8');
const defined = new Set([...Object.keys(data.theme).map((key) => `--${key}`), ...[...css.matchAll(/(--[\w-]+):/g)].map((match) => match[1])]);
for (const [, key] of (css + logo).matchAll(/var\((--[\w-]+)\)/g)) if (!defined.has(key)) throw new Error(`Undefined CSS token ${key}`);
console.log('Content, source syntax, and CSS tokens verified.');
