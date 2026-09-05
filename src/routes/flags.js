/**
 * Feature flag routes — issue #37. The public half (a logged-in user reading
 * their own flags); the admin half (defining flags, assigning them to users)
 * is dispatched from src/routes/admin.js since it's Access-gated the same
 * way as the rest of the admin portal.
 */
import * as db from '../lib/db.js';
import { requireSession } from './account.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

// A flag being off is always the safe default (#37 security checklist) — any
// failure to resolve a session falls through to an empty flag list rather
// than an error, so a bug here can only ever hide a beta feature, never show
// one to someone who shouldn't have it.
export async function handleMyFlags(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ flags: [] });
  const flags = await db.getUserFlags(env, session.user_id);
  return jsonResponse({ flags });
}
