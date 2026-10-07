import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { rebuild } from '../scripts/rebuild.mjs';

test('development rebuilds reload changed imported generator modules', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-rebuild-'));
  const root = pathToFileURL(directory + '/');
  try {
    await mkdir(new URL('scripts/', root));
    await writeFile(new URL('scripts/build.mjs', root), "import { value } from './renderer.mjs'; console.log(value);\n");
    await writeFile(new URL('scripts/renderer.mjs', root), "export const value = 'before';\n");
    assert.equal((await rebuild(root)).trim(), 'before');
    await writeFile(new URL('scripts/renderer.mjs', root), "export const value = 'after';\n");
    assert.equal((await rebuild(root)).trim(), 'after');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
