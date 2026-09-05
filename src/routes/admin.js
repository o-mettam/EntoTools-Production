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
// Bundled as a raw string (esbuild --loader:.html=text) and returned
// directly, rather than served via env.ASSETS.fetch(). That was tried first
// and caused an infinite redirect loop: requesting the exact index.html path
// explicitly (to work around ASSETS.fetch not doing directory-index
// resolution from in here) collided with Cloudflare Pages' own automatic
// redirect of explicit /index.html requests back to the clean directory URL
// — our code and Cloudflare's redirect kept bouncing off each other.
// Embedding the HTML sidesteps Pages' static-asset routing entirely.
import adminHtml from '../../templates/admin.html';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
function notFound() { return new Response('Not found', { status: 404 }); }

export async function handleAdminRoute(request, env, path) {
  const identity = await verifyAccessRequest(request, env);
  if (!identity || !identity.email) return notFound();
  const adminEmail = identity.email;

  const url = new URL(request.url);
  const method = request.method;

  // The admin GUI itself — see the adminHtml import comment above for why
  // this returns the bundled HTML directly instead of going through
  // env.ASSETS.fetch().
  if ((path === '/frost/admin' || path === '/frost/admin/') && method === 'GET') {
    return new Response(adminHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
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
        'DELETE /frost/admin/users/:id/credentials',
        'DELETE /frost/admin/users/:id/sessions',
        'POST   /frost/admin/users/:id/reregister-token',
        'GET    /frost/admin/audit-log',
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
