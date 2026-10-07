import { deflateSync } from 'node:zlib';

// A small bitmap alphabet keeps the social card in the portfolio's pixel style,
// with no fonts, browser, image service, or native dependency needed at build time.
const FONT = {
  A:[14,17,17,31,17,17,17], B:[30,17,17,30,17,17,30], C:[14,17,16,16,16,17,14],
  D:[30,17,17,17,17,17,30], E:[31,16,16,30,16,16,31], F:[31,16,16,30,16,16,16],
  G:[14,17,16,23,17,17,15], H:[17,17,17,31,17,17,17], I:[31,4,4,4,4,4,31],
  J:[7,2,2,2,18,18,12], K:[17,18,20,24,20,18,17], L:[16,16,16,16,16,16,31],
  M:[17,27,21,21,17,17,17], N:[17,25,25,21,19,19,17], O:[14,17,17,17,17,17,14],
  P:[30,17,17,30,16,16,16], Q:[14,17,17,17,21,18,13], R:[30,17,17,30,20,18,17],
  S:[15,16,16,14,1,1,30], T:[31,4,4,4,4,4,4], U:[17,17,17,17,17,17,14],
  V:[17,17,17,17,17,10,4], W:[17,17,17,21,21,21,10], X:[17,17,10,4,10,17,17],
  Y:[17,17,10,4,4,4,4], Z:[31,1,2,4,8,16,31],
  '0':[14,17,19,21,25,17,14], '1':[4,12,4,4,4,4,14], '2':[14,17,1,2,4,8,31],
  '3':[30,1,1,14,1,1,30], '4':[2,6,10,18,31,2,2], '5':[31,16,16,30,1,1,30],
  '6':[14,16,16,30,17,17,14], '7':[31,1,2,4,8,8,8], '8':[14,17,17,14,17,17,14],
  '9':[14,17,17,15,1,1,14], '&':[12,18,20,8,21,18,13], '.':[0,0,0,0,0,12,12],
  '/':[1,1,2,4,8,16,16], '-':[0,0,0,31,0,0,0], '+':[0,4,4,31,4,4,0],
  ',':[0,0,0,0,0,4,8], ':':[0,12,12,0,12,12,0], '[':[14,8,8,8,8,8,14],
  ']':[14,2,2,2,2,2,14], '?':[14,17,1,2,4,0,4], ' ':[0,0,0,0,0,0,0],
};
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, content) {
  const name = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(content.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, content])));
  return Buffer.concat([length, name, content, crc]);
}
export function createSocialCard({ profile, projects, theme }) {
  const width = 1200, height = 630;
  const pixels = Buffer.alloc(width * height * 3);
  const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  function rect(x, y, w, h, color) {
    const channels = rgb(color);
    for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
      for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
        const offset = (py * width + px) * 3;
        channels.forEach((channel, i) => { pixels[offset + i] = channel; });
      }
    }
  }
  function text(value, x, y, scale, color, maxWidth = 1040) {
    const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const size = Math.max(1, Math.min(scale, Math.floor(maxWidth / Math.max(1, normalized.length * 6))));
    const clipped = normalized.slice(0, Math.floor(maxWidth / (6 * size)));
    [...clipped].forEach((character, index) => {
      (FONT[character] || FONT['?']).forEach((row, dy) => {
        for (let dx = 0; dx < 5; dx++) if (row & (1 << (4 - dx))) rect(x + (index * 6 + dx) * size, y + dy * size, size, size, color);
      });
    });
  }
  rect(0, 0, width, height, theme.bg);
  rect(0, 0, 12, height, theme.accent);
  text(`[${profile.brand.initial}] ${profile.brand.name}${profile.brand.suffix}`, 80, 64, 4, theme.secondary, 580);
  text(`${profile.location.city}, ${profile.location.country}`, 800, 70, 3, theme.subtle, 320);
  text(profile.intro, 80, 174, 3, theme.muted);
  text(profile.name, 80, 252, 10, theme.text, 870);
  text(profile.role, 80, 363, 4, theme.accent, 870);
  text(profile.brand.initial, 1010, 240, 14, theme.secondary, 100);
  rect(80, 475, 1040, 2, theme.border);
  text(projects.map((project) => project.name).join(' / '), 80, 525, 3, theme.muted);
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let row = 0; row < height; row++) pixels.copy(raw, row * (width * 3 + 1) + 1, row * width * 3, (row + 1) * width * 3);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
