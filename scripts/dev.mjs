import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rebuild } from './rebuild.mjs';
import { ROOT } from '../src/data.mjs';

process.stdout.write(await rebuild());
const root = fileURLToPath(new URL('dist/', ROOT));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.md': 'text/markdown', '.xml': 'application/xml' };
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let path = resolve(root, `.${pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep) && path !== resolve(root)) { response.writeHead(403); response.end('Forbidden'); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const body = await readFile(path);
    response.writeHead(200, { 'Content-Type': `${types[extname(path)] || 'application/octet-stream'}${extname(path) === '.png' ? '' : '; charset=utf-8'}`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404); response.end('Not found'); }
});
server.on('error', (error) => { console.error(`Preview server: ${error.message}`); process.exit(1); });
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}`));

let pending;
let queue = Promise.resolve();
const watchers = ['data', 'src'].map((directory) => watch(new URL(`${directory}/`, ROOT), { recursive: true }, () => {
  clearTimeout(pending);
  pending = setTimeout(() => {
    queue = queue.then(() => rebuild()).then((output) => { process.stdout.write(output); console.log('Updated. Refresh your browser.'); }).catch((error) => console.error(error.stderr || error.message));
  }, 150);
}));
const stop = () => { clearTimeout(pending); watchers.forEach((watcher) => watcher.close()); server.close(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
