// .hermes-patch-worker.js — one-shot script to graft static-asset serving onto the worker.
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'worker/src/index.js');
let src = fs.readFileSync(p, 'utf8');

const deadEnd = "      return error('Not found', 404);";

if (!src.includes(deadEnd)) {
  console.error('DEADEND_NOT_FOUND — worker layout may have changed');
  process.exit(1);
}

const replacement = [
  "      // ===== STATIC FRONTEND (SPA fallback to index.html) =====",
  "      // Anything that isn't /api/* is served from the bundled dist/ directory.",
  "      // The Cloudflare Workers Static Assets binding is exposed as env.ASSETS.",
  "      if (env.ASSETS) {",
  "        // Try the asset directly first (e.g. /assets/index-xxx.js).",
  "        const assetResp = await env.ASSETS.fetch(request);",
  "        if (assetResp.status !== 404) return assetResp;",
  "",
  "        // SPA fallback: for navigation requests, serve index.html so",
  "        // client-side routes (/dashboard, /mentors, /admin, ...) work.",
  "        const accepts = request.headers.get('Accept') || '';",
  "        if (request.method === 'GET' && (accepts.includes('text/html') || path === '/')) {",
  "          const indexReq = new Request(new URL('/index.html', request.url), request);",
  "          const indexResp = await env.ASSETS.fetch(indexReq);",
  "          if (indexResp.ok) return indexResp;",
  "        }",
  "      }",
  "      return error('Not found', 404);",
].join('\n');

src = src.replace(deadEnd, replacement);
fs.writeFileSync(p, src);
console.log('OK bytes=' + fs.statSync(p).size);