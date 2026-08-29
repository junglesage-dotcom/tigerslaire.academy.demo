// .hermes-patch-fallback.cjs — fix SPA fallback to serve index.html for any non-API GET miss
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'worker/src/index.js');
let src = fs.readFileSync(p, 'utf8');

const oldBlock = [
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

if (!src.includes(oldBlock)) {
  console.error('OLDBLOCK_NOT_FOUND');
  process.exit(1);
}

const newBlock = [
  "      // ===== STATIC FRONTEND (SPA fallback to index.html) =====",
  "      // Anything that isn't /api/* is served from the bundled dist/ directory.",
  "      // The Cloudflare Workers Static Assets binding is exposed as env.ASSETS.",
  "      if (env.ASSETS) {",
  "        // Try the asset directly first (e.g. /assets/index-xxx.js, /logo.svg).",
  "        const assetResp = await env.ASSETS.fetch(request);",
  "        if (assetResp.status !== 404) return assetResp;",
  "",
  "        // SPA fallback: when the requested path has no file extension (i.e.",
  "        // it's a client-side route like /admin, /dashboard, /mentors/abc),",
  "        // serve index.html so the React router can handle it.",
  "        // Requests with an extension (.json, .png, ...) are NOT rewritten",
  "        // — a missing asset there should genuinely 404.",
  "        if (method === 'GET') {",
  "          const lastSegment = path.split('/').pop() || '';",
  "          const hasExt = /\\.[a-zA-Z0-9]{1,8}$/.test(lastSegment);",
  "          if (!hasExt) {",
  "            const indexReq = new Request(new URL('/index.html', request.url), request);",
  "            const indexResp = await env.ASSETS.fetch(indexReq);",
  "            if (indexResp.ok) return indexResp;",
  "          }",
  "        }",
  "      }",
  "      return error('Not found', 404);",
].join('\n');

src = src.replace(oldBlock, newBlock);
fs.writeFileSync(p, src);
console.log('OK bytes=' + fs.statSync(p).size);