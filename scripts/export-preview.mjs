import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { build } from './build.mjs';

await build();

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const [html, css, byteLogic, snakeLogic, main, favicon] = await Promise.all([
  read('dist/index.html'), read('dist/styles.css'), read('dist/byte.mjs'),
  read('dist/logo-snake.mjs'), read('dist/main.js'), read('dist/favicon.svg'),
]);
const script = [byteLogic, snakeLogic].map((source) => source.replace(/^export /gm, '')).join('\n')
  + '\n' + main.replace(/^import .* from '\.\/(?:byte|logo-snake)\.mjs';\n/gm, '');
const preview = html
  .replace(/\s*<link rel="alternate" type="text\/markdown"[^>]*>/, '')
  .replace('<link rel="stylesheet" href="./styles.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="./main.js"></script>', () => `<script type="module">${script}</script>`)
  .replace('href="./favicon.svg"', () => `href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}"`);
await mkdir(new URL('.local/', root), { recursive: true });
await writeFile(new URL('.local/portfolio-preview.html', root), preview);
console.log('Standalone preview: .local/portfolio-preview.html');
