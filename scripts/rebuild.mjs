import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { ROOT } from '../src/data.mjs';

const execute = promisify(execFile);

export async function rebuild(root = ROOT) {
  // Reload the full module graph, so renderer edits work as well as data edits.
  const { stdout } = await execute(process.execPath, [fileURLToPath(new URL('scripts/build.mjs', root))]);
  return stdout;
}
