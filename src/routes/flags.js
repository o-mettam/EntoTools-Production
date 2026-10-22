/**
 * Feature flag routes — issue #37. The public half (any visitor reading the
 * flags in effect for them); the admin half (defining flags, assigning them to users)
 * is dispatched from src/routes/admin.js since it's Access-gated the same
 * way as the rest of the admin portal.
 */
import * as db from '../lib/db.js';
import { requireSession } from './account.js';

function jsonResponse(data, status = 200) {
  // no-store: this reflects session state, and Safari has been observed
  // reusing a cached GET response here across a login that changed the
  // session cookie (issues #38/#39) — see the matching note in
  // src/routes/account.js.
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

// A flag being off is always the safe default (#37 security checklist) — any
// failure to resolve a session still returns only the 'ga' flags, so a bug
// here can only ever hide a beta feature, never show one to someone who
// shouldn't have it. Signed-out visitors get the 'ga' flags too.
export async function handleMyFlags(request, env) {
  const session = await requireSession(request, env);
  const flags = await db.getEffectiveFlags(env, session ? session.user_id : null);
  return jsonResponse({ flags });
}

// Server-side gate for flagged endpoints (docs/feature-flags.md). Same
// fail-closed rule: any error means "not enabled".
export async function hasFlag(request, env, flagKey) {
  try {
    const session = await requireSession(request, env);
    const flags = await db.getEffectiveFlags(env, session ? session.user_id : null);
    return flags.includes(flagKey);
  } catch (err) {
    console.error('[Worker:flags] hasFlag failed for', flagKey, '-', err.message);
    return false;
  }
}
