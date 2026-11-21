// Shadow Gallery — a small static file server for local play-testing.
// `node serve.ts` serves game/ on http://localhost:8080 (or --port N).
// It only ever serves files inside game/, sends the right content type for
// the few kinds a browser game needs, and never does anything else.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = resolve(fileURLToPath(new URL('./game', import.meta.url)));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

function pickPort() {
  const at = process.argv.indexOf('--port');
  const value = at === -1 ? 8080 : Number(process.argv[at + 1]);
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : 8080;
}

createServer((req, res) => {
  let path = '/';
  try {
    path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(join(gameDir, normalize(path)));
  if (file !== gameDir && !file.startsWith(gameDir + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let size;
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(pickPort(), '127.0.0.1', () => {
  console.log(`game/ is on http://localhost:${pickPort()}`);
  console.log('shots: ?shot=start | ?shot=play | ?shot=sneak | ?shot=end (add &seed=1)');
});
