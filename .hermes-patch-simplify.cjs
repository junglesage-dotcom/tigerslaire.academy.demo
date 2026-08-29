// .hermes-patch-simplify.cjs — remove manual fallback (now done by not_found_handling)
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'worker/src/index.js');
let src = fs.readFileSync(p, 'utf8');

const old = `      // ===== STATIC FRONTEND (SPA fallback to index.html) =====
      // Anything that isn't /api/* is served from the bundled dist/ directory.
      // The Cloudflare Workers Static Assets binding is exposed as env.ASSETS.
      if (env.ASSETS) {
        // Try the asset directly first (e.g. /assets/index-xxx.js, /logo.svg).
        const assetResp = await env.ASSETS.fetch(request);
        if (assetResp.status !== 404) return assetResp;

        // SPA fallback: when the requested path has no file extension (i.e.
        // it's a client-side route like /admin, /dashboard, /mentors/abc),
        // serve index.html so the React router can handle it.
        // Requests with an extension (.json, .png, ...) are NOT rewritten
        // — a missing asset there should genuinely 404.
        if (method === 'GET') {
          const lastSegment = path.split('/').pop() || '';
          const hasExt = /\\.[a-zA-Z0-9]{1,8}$/.test(lastSegment);
          if (!hasExt) {
            const indexReq = new Request(new URL('/index.html', request.url), request);
            const indexResp = await env.ASSETS.fetch(indexReq);
            if (indexResp.ok) return indexResp;
          }
        }
      }
      return error('Not found', 404);`;

const next = `      // ===== STATIC FRONTEND =====
      // Anything that isn't /api/* is served from the bundled dist/ directory.
      // The Cloudflare Workers Static Assets binding is exposed as env.ASSETS.
      // The platform-level "not_found_handling = single-page-application" in
      // wrangler.toml makes missing routes fall back to index.html automatically,
      // so React Router can handle /admin, /dashboard, etc.
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return error('Not found', 404);`;

if (!src.includes(old)) { console.error('OLD_BLOCK_NOT_FOUND'); process.exit(1); }
src = src.replace(old, next);
fs.writeFileSync(p, src);
console.log('OK bytes=' + fs.statSync(p).size);