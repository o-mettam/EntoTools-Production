/**
 * Admin portal — issue #36, mounted at /frost/admin/*, plus the admin half
 * of feature flags (#37). Gated by Cloudflare Access (verified in
 * src/lib/access.js); any request that doesn't carry a valid Access JWT gets
 * a plain 404, never a 401/redirect that would confirm this path exists.
 *
 * Nothing here is linked from any public page/template/nav — reachable only
 * by knowing the exact path, and even then only past Access.
 */
import { verifyAccessRequest } from '../lib/access.js';
import * as db from '../lib/db.js';
import { REREGISTER_TOKEN_TTL_SECONDS } from './account.js';
import { cspForAdmin, TAILWIND_HASH, BUILD_GENERATED_AT } from '../lib/csp.js';
import { LIMITS } from '../lib/ratelimit.js';
import { checkAllServices } from '../lib/status.js';
import pkg from '../../package.json' with { type: 'json' };

// Catalogue for the Status tab — what exists, who may call it, and what
// protects it. Restricted view: this is more than the public /status page
// says, by design.
const API_ENDPOINTS = [
  { method: 'POST',   path: '/api/search',                     auth: 'none',           protection: 'per-IP limit, input caps (ranges/days)', purpose: 'Weather + station lookup for the calculator' },
  { method: 'POST',   path: '/api/feedback',                   auth: 'none',           protection: 'Origin allowlist, per-IP limit, PII redaction, Markdown neutralised', purpose: 'Feedback widget → public GitHub issue' },
  { method: 'GET',    path: '/api/status/ping',                auth: 'none',           protection: '—', purpose: 'Worker liveness' },
  { method: 'GET',    path: '/api/status/check?service=',      auth: 'none',           protection: 'per-IP limit, allow-listed targets', purpose: 'One upstream service probe (public /status page)' },
  { method: 'POST',   path: '/api/account/register/options',   auth: 'none / session', protection: 'Origin, ceremony + sign-up limits, unique email, re-auth when adding', purpose: 'Start passkey registration' },
  { method: 'POST',   path: '/api/account/register/verify',    auth: 'none / session', protection: 'Origin, single-use challenge, UV required, unique email', purpose: 'Finish registration → session' },
  { method: 'POST',   path: '/api/account/login/options',      auth: 'none',           protection: 'Origin, ceremony limit', purpose: 'Start passkey login (username-less)' },
  { method: 'POST',   path: '/api/account/login/verify',       auth: 'none',           protection: 'Origin, single-use challenge, UV required, sign-counter', purpose: 'Finish login → session' },
  { method: 'POST',   path: '/api/account/reauth/options',     auth: 'session',        protection: 'Origin, ceremony limit', purpose: 'Start step-up assertion' },
  { method: 'POST',   path: '/api/account/reauth/verify',      auth: 'session',        protection: 'Origin, challenge bound to session + user, UV required', purpose: 'Finish step-up (single-use, ≤ 2 min)' },
  { method: 'GET',    path: '/api/account/session',            auth: 'session',        protection: 'SameSite=Lax cookie, no-store', purpose: 'Who am I' },
  { method: 'POST',   path: '/api/account/logout',             auth: 'session',        protection: 'Origin', purpose: 'End this session' },
  { method: 'GET',    path: '/api/account/credentials',        auth: 'session',        protection: 'no-store', purpose: 'List own passkeys' },
  { method: 'PATCH',  path: '/api/account/credentials/:id',    auth: 'session',        protection: 'Origin, step-up required, scoped to owner', purpose: 'Rename a passkey' },
  { method: 'DELETE', path: '/api/account/credentials/:id',    auth: 'session',        protection: 'Origin, step-up required, last-passkey guard, revokes its sessions', purpose: 'Remove a passkey' },
  { method: 'GET',    path: '/api/account/sessions',           auth: 'session',        protection: 'no-store, ids never returned', purpose: 'List signed-in devices' },
  { method: 'DELETE', path: '/api/account/sessions',           auth: 'session',        protection: 'Origin', purpose: 'Sign out everywhere else' },
  { method: 'GET',    path: '/api/account/collection',         auth: 'session',        protection: '—', purpose: 'Pull account-synced collection' },
  { method: 'PUT',    path: '/api/account/collection',         auth: 'session',        protection: 'Origin, 1 MB / 20k-entry cap', purpose: 'Push collection' },
  { method: 'GET',    path: '/api/account/flags',              auth: 'session',        protection: 'fail-closed (empty on error)', purpose: 'Own feature flags' },
  { method: 'GET',    path: '/api/account/export',             auth: 'session',        protection: 'no-store, attachment', purpose: 'Data export (JSON)' },
  { method: 'DELETE', path: '/api/account',                    auth: 'session',        protection: 'Origin, step-up required', purpose: 'Delete own account' },
  { method: '*',      path: '/frost/admin/**',                 auth: 'Cloudflare Access + JWT', protection: 'Access JWT (RS256, aud/iss/exp), CSRF guard on writes, 404 on failure, audit log', purpose: 'This portal' },
];

async function probeKv(env) {
  if (!env.GEOCODE_CACHE) return { bound: false, ok: false, error: 'KV binding missing' };
  const key = `admin-probe:${crypto.randomUUID()}`;
  const start = Date.now();
  try {
    await env.GEOCODE_CACHE.put(key, '1', { expirationTtl: 60 });
    const back = await env.GEOCODE_CACHE.get(key);
    await env.GEOCODE_CACHE.delete(key);
    return { bound: true, ok: back === '1', latencyMs: Date.now() - start };
  } catch (err) {
    return { bound: true, ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}
// Bundled as a raw string (esbuild --loader:.html=text) and returned
// directly, rather than served via env.ASSETS.fetch(). That was tried first
// and caused an infinite redirect loop: requesting the exact index.html path
// explicitly (to work around ASSETS.fetch not doing directory-index
// resolution from in here) collided with Cloudflare Pages' own automatic
// redirect of explicit /index.html requests back to the clean directory URL
// — our code and Cloudflare's redirect kept bouncing off each other.
// Embedding the HTML sidesteps Pages' static-asset routing entirely.
import adminHtmlRaw from '../../templates/admin.html';
// Same cache-busting stamp the public pages get at build time (gen-csp.js);
// the link tag isn't inside a <script>, so the CSP hashes are unaffected.
const adminHtml = adminHtmlRaw.replace('href="/tailwind.css"', `href="/tailwind.css?h=${TAILWIND_HASH}"`);

// public/_headers only applies to responses served through Cloudflare Pages'
// static-asset pipeline (env.ASSETS.fetch()) — every response here is built
// directly in the Worker instead, so none of that file's security headers
// (CSP, X-Frame-Options, etc.) reach this route on their own. Attached here
// to match. No Cache-Control override — Cloudflare Access already wraps
// this path in its own strong no-store/no-cache headers.
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  // Hash-based script-src, no 'unsafe-inline', no CDN (src/lib/csp.js).
  'Content-Security-Policy': cspForAdmin(),
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS } });
}
function notFound() { return new Response('Not found', { status: 404, headers: SECURITY_HEADERS }); }

// CSRF guard for state-changing admin calls (security assessment 2026-09).
// The Access session cookie rides along on any request the browser makes to
// this origin, so without this a page elsewhere could try to POST/DELETE
// here on a signed-in admin's behalf. Browsers always send Sec-Fetch-Site
// (and Origin on non-GET), so a request from a browser that isn't
// same-origin is rejected; a request with neither header (curl, a script
// using an Access service token) isn't a CSRF vector and passes through.
const ADMIN_ORIGINS = new Set(['https://entotools.org', 'https://www.entotools.org']);
function crossSiteWrite(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return false;
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin' && site !== 'none') return true;
  const origin = request.headers.get('Origin');
  if (origin && !ADMIN_ORIGINS.has(origin) && !origin.startsWith('http://localhost:')) return true;
  return false;
}

export async function handleAdminRoute(request, env, path) {
  const identity = await verifyAccessRequest(request, env);
  if (!identity || !identity.email) return notFound();
  const adminEmail = identity.email;
  if (crossSiteWrite(request)) {
    console.warn('[Worker:admin] rejected cross-site write for', adminEmail);
    return notFound();
  }

  const url = new URL(request.url);
  const method = request.method;

  // The admin GUI itself — see the adminHtml import comment above for why
  // this returns the bundled HTML directly instead of going through
  // env.ASSETS.fetch().
  if ((path === '/frost/admin' || path === '/frost/admin/') && method === 'GET') {
    return new Response(adminHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS } });
  }

  // Machine-readable equivalent, used by the GUI's own init() to confirm the
  // Access → JWT-verification chain worked and show who's signed in.
  if (path === '/frost/admin/status' && method === 'GET') {
    return jsonResponse({
      ok: true,
      admin: adminEmail,
      routes: [
        'GET    /frost/admin/users?q=',
        'GET    /frost/admin/users/:id',
        'DELETE /frost/admin/users/:id',
        'DELETE /frost/admin/users/:id/credentials',
        'DELETE /frost/admin/users/:id/sessions',
        'POST   /frost/admin/users/:id/reregister-token',
        'GET    /frost/admin/audit-log',
        'GET    /frost/admin/status/internal',
        'GET    /frost/admin/status/upstream',
        'GET    /frost/admin/flags',
        'POST   /frost/admin/flags',
        'GET    /frost/admin/flags/:key/users',
        'PUT    /frost/admin/users/:id/flags/:key',
        'DELETE /frost/admin/users/:id/flags/:key',
      ],
    });
  }

  // ── #36: user lookup + passkey/session reset ──────────────────
  if (path === '/frost/admin/users' && method === 'GET') {
    const users = await db.searchUsers(env, url.searchParams.get('q') || '');
    return jsonResponse({ users });
  }

  let m = path.match(/^\/frost\/admin\/users\/([^/]+)$/);
  if (m && method === 'GET') {
    const detail = await db.getUserDetail(env, m[1]);
    if (!detail) return jsonResponse({ error: 'Not found' }, 404);
    return jsonResponse(detail);
  }
  if (m && method === 'DELETE') {
    const userId = m[1];
    const existing = await db.getUser(env, userId);
    if (!existing) return jsonResponse({ error: 'Not found' }, 404);
    await db.deleteUser(env, userId);
    await db.writeAuditLog(env, { adminIdentity: adminEmail, action: 'delete_user', targetUserId: userId, detail: existing.label });
    return jsonResponse({ success: true });
  }

  m = path.match(/^\/frost\/admin\/users\/([^/]+)\/credentials$/);
  if (m && method === 'DELETE') {
    const userId = m[1];
    // Resetting credentials also revokes sessions in the same operation — a
    // stale session shouldn't survive a credential reset (#36 checklist).
    await db.deleteAllUserCredentials(env, userId);
    await db.deleteAllUserSessions(env, userId);
    await db.writeAuditLog(env, { adminIdentity: adminEmail, action: 'reset_credentials', targetUserId: userId });
    return jsonResponse({ success: true });
  }

  m = path.match(/^\/frost\/admin\/users\/([^/]+)\/sessions$/);
  if (m && method === 'DELETE') {
    const userId = m[1];
    await db.deleteAllUserSessions(env, userId);
    await db.writeAuditLog(env, { adminIdentity: adminEmail, action: 'revoke_sessions', targetUserId: userId });
    return jsonResponse({ success: true });
  }

  m = path.match(/^\/frost\/admin\/users\/([^/]+)\/reregister-token$/);
  if (m && method === 'POST') {
    const userId = m[1];
    const user = await db.getUser(env, userId);
    if (!user) return jsonResponse({ error: 'Not found' }, 404);
    const token = crypto.randomUUID();
    await env.GEOCODE_CACHE.put(`reregister-token:${token}`, userId, {
      expirationTtl: REREGISTER_TOKEN_TTL_SECONDS,
    });
    await db.writeAuditLog(env, { adminIdentity: adminEmail, action: 'issue_reregister_token', targetUserId: userId });
    return jsonResponse({ token, expiresInSeconds: REREGISTER_TOKEN_TTL_SECONDS });
  }

  if (path === '/frost/admin/audit-log' && method === 'GET') {
    return jsonResponse({ log: await db.getAuditLog(env) });
  }

  // ── Status tab ───────────────────────────────────────────────
  // Internal health: bindings, configuration, data counts, limits, the API
  // catalogue. Fast (one D1 batch + one KV round-trip).
  if (path === '/frost/admin/status/internal' && method === 'GET') {
    let d1;
    const t0 = Date.now();
    try {
      const stats = await db.getStats(env);
      d1 = { bound: true, ok: true, latencyMs: Date.now() - t0, ...stats };
    } catch (err) {
      d1 = { bound: !!env.DB, ok: false, latencyMs: Date.now() - t0, error: err.message };
    }
    const kv = await probeKv(env);
    const cf = request.cf || {};
    return jsonResponse({
      checkedAt: new Date().toISOString(),
      worker: {
        version: pkg.version,
        builtAt: BUILD_GENERATED_AT,
        colo: cf.colo || null,
        servedFromCountry: cf.country || null,
        cfRay: request.headers.get('cf-ray'),
      },
      config: {
        accessConfigured: !!(env.CF_ACCESS_TEAM_DOMAIN && env.CF_ACCESS_AUD),
        accessTeamDomain: env.CF_ACCESS_TEAM_DOMAIN || null,
        githubTokenConfigured: !!env.GITHUB_TOKEN,
        d1Bound: !!env.DB,
        kvBound: !!env.GEOCODE_CACHE,
        assetsBound: !!env.ASSETS,
      },
      d1,
      kv,
      limits: LIMITS,
      endpoints: API_ENDPOINTS,
    });
  }
  // Upstream services, all in parallel. Slower (up to the longest timeout).
  if (path === '/frost/admin/status/upstream' && method === 'GET') {
    return jsonResponse({ services: await checkAllServices() });
  }

  // ── #37: feature flag administration ───────────────────────────
  if (path === '/frost/admin/flags' && method === 'GET') {
    return jsonResponse({ flags: await db.listFlags(env) });
  }
  if (path === '/frost/admin/flags' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid request body.' }, 400); }
    const key = (body.key || '').trim();
    if (!key) return jsonResponse({ error: 'A flag key is required.' }, 400);
    await db.defineFlag(env, { key, description: body.description });
    await db.writeAuditLog(env, { adminIdentity: adminEmail, action: 'define_flag', detail: key });
    return jsonResponse({ success: true });
  }

  m = path.match(/^\/frost\/admin\/flags\/([^/]+)\/users$/);
  if (m && method === 'GET') {
    return jsonResponse({ users: await db.listFlagUsers(env, m[1]) });
  }

  m = path.match(/^\/frost\/admin\/flags\/([^/]+)$/);
  if (m && method === 'DELETE') {
    const key = m[1];
    await db.deleteFlag(env, key);
    await db.writeAuditLog(env, { adminIdentity: adminEmail, action: 'delete_flag', detail: key });
    return jsonResponse({ success: true });
  }

  m = path.match(/^\/frost\/admin\/users\/([^/]+)\/flags\/([^/]+)$/);
  if (m) {
    const [, userId, flagKey] = m;
    if (method === 'PUT') {
      await db.enableUserFlag(env, userId, flagKey);
      await db.writeAuditLog(env, { adminIdentity: adminEmail, action: 'enable_flag', targetUserId: userId, detail: flagKey });
      return jsonResponse({ success: true });
    }
    if (method === 'DELETE') {
      await db.disableUserFlag(env, userId, flagKey);
      await db.writeAuditLog(env, { adminIdentity: adminEmail, action: 'disable_flag', targetUserId: userId, detail: flagKey });
      return jsonResponse({ success: true });
    }
  }

  return jsonResponse({ error: 'Not found' }, 404);
}
