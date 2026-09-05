#!/usr/bin/env node
/**
 * gen-csp.js — builds src/csp-hashes.json (security assessment 2026-09, R4).
 *
 * The Content-Security-Policy no longer allows 'unsafe-inline' for scripts.
 * Every page's inline <script> blocks are hashed here, at build time, and
 * the Worker (src/lib/csp.js) emits the matching 'sha256-…' sources for the
 * route being served. Inline event handlers (onclick="…") and javascript:
 * URLs can't be hashed, so this script FAILS THE BUILD if any remain — they
 * must use the data-action / data-change / data-input delegation in
 * public/theme.js instead.
 *
 * Hashes are taken from the BUILT files in public/ (what's actually served),
 * plus templates/admin.html (bundled verbatim into the Worker). Run after
 * the templates are copied and before esbuild bundles the Worker.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'src', 'csp-hashes.json');

function fail(msg) { console.error('✗ gen-csp: ' + msg); process.exit(1); }

function inlineScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (/\bsrc\s*=/i.test(m[1])) continue;                    // external — covered by 'self' / host list
    if (/\btype\s*=\s*["'](?!text\/javascript|module)/i.test(m[1])) continue; // JSON-LD etc. isn't executed
    out.push(m[2]);
  }
  return out;
}

function hashOf(src) {
  return 'sha256-' + crypto.createHash('sha256').update(src, 'utf8').digest('base64');
}

// Everything outside <script> blocks — inline handlers live in markup.
function markupOnly(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

function guard(label, html) {
  const markup = markupOnly(html);
  const handlers = markup.match(/\son[a-z]+\s*=\s*["']/gi);
  if (handlers) {
    fail(`${label}: ${handlers.length} inline event handler(s) remain (${[...new Set(handlers.map((h) => h.trim()))].join(' ')}) — use data-action/data-change/data-input`);
  }
  if (/\b(href|src|action)\s*=\s*["']\s*javascript:/i.test(markup)) fail(`${label}: javascript: URL`);
}

function routeFor(rel) {
  // public/index.html → "/", public/status/index.html → "/status", public/404.html → "/404.html"
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  return '/' + rel;
}

function walkHtml(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const rel = base ? base + '/' + entry.name : entry.name;
    if (entry.isDirectory()) out.push(...walkHtml(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

// Cache-busting stamp for the static Tailwind stylesheet: templates link
// "/tailwind.css"; the built copies get "?h=<content hash>" so a new build
// is a new URL (the same lesson as account.js?v=N). The admin GUI, bundled
// from templates/, gets the same stamp at runtime from this manifest.
const twPath = path.join(PUBLIC, 'tailwind.css');
if (!fs.existsSync(twPath)) fail('public/tailwind.css is missing — run the Tailwind build first (scripts/build-public.sh does)');
const tailwindHash = crypto.createHash('sha256').update(fs.readFileSync(twPath)).digest('hex').slice(0, 12);

const routes = {};
for (const rel of walkHtml(PUBLIC).sort()) {
  const file = path.join(PUBLIC, rel);
  let html = fs.readFileSync(file, 'utf8');
  const stamped = html.replace(/href="\/tailwind\.css(?:\?h=[^"]*)?"/g, `href="/tailwind.css?h=${tailwindHash}"`);
  if (stamped !== html) { fs.writeFileSync(file, stamped); html = stamped; }
  guard('public/' + rel, html);
  routes[routeFor(rel)] = inlineScripts(html).map(hashOf);
}

const adminHtml = fs.readFileSync(path.join(ROOT, 'templates', 'admin.html'), 'utf8');
guard('templates/admin.html', adminHtml);
const admin = inlineScripts(adminHtml).map(hashOf);

const manifest = { generated: new Date().toISOString(), tailwindHash, routes, admin };
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
const total = Object.values(routes).reduce((n, a) => n + a.length, 0) + admin.length;
console.log(`✓ gen-csp: ${Object.keys(routes).length} routes + admin, ${total} inline script hash(es) → src/csp-hashes.json`);
