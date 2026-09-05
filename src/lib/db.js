/**
 * D1 data access for accounts (#35), the admin portal (#36), and feature
 * flags (#37). Thin query wrappers only — no business logic here, that lives
 * in src/routes/*.js.
 *
 * env.DB is the D1 binding (see wrangler.toml — must be created with
 * `wrangler d1 create` and the resulting database_id pasted in; see README).
 */

function nowIso() { return new Date().toISOString(); }

// ── Users ───────────────────────────────────────────────────────
export async function createUser(env, { id, label }) {
  await env.DB.prepare('INSERT INTO users (id, label, created_at) VALUES (?, ?, ?)')
    .bind(id, label, nowIso()).run();
}

export async function getUser(env, id) {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}

// Admin user search — label/id are not secrets, so a simple substring match
// on either is fine. Matches on id too so an admin can paste a user ID
// (e.g. from the audit log or a support conversation) directly into search.
export async function searchUsers(env, query) {
  const like = `%${query}%`;
  const { results } = await env.DB.prepare(
    'SELECT id, label, created_at FROM users WHERE label LIKE ? OR id LIKE ? ORDER BY created_at DESC LIMIT 50'
  ).bind(like, like).all();
  return results;
}

export async function getUserDetail(env, userId) {
  const user = await getUser(env, userId);
  if (!user) return null;
  const { results: credentials } = await env.DB.prepare(
    'SELECT credential_id, device_label, created_at, last_used_at FROM credentials WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();
  const { results: sessions } = await env.DB.prepare(
    'SELECT id, created_at, expires_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();
  return { user, credentials, sessions };
}

// ── Credentials ─────────────────────────────────────────────────
export async function saveCredential(env, { credentialId, userId, publicKey, signCount, deviceLabel }) {
  await env.DB.prepare(
    'INSERT INTO credentials (credential_id, user_id, public_key, sign_count, device_label, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(credentialId, userId, publicKey, signCount, deviceLabel || 'Unnamed device', nowIso()).run();
}

export async function getUserCredentials(env, userId) {
  const { results } = await env.DB.prepare(
    'SELECT credential_id FROM credentials WHERE user_id = ?'
  ).bind(userId).all();
  return results;
}

export async function getCredential(env, credentialId) {
  return env.DB.prepare('SELECT * FROM credentials WHERE credential_id = ?').bind(credentialId).first();
}

export async function updateCredentialCounter(env, credentialId, newCounter) {
  await env.DB.prepare('UPDATE credentials SET sign_count = ?, last_used_at = ? WHERE credential_id = ?')
    .bind(newCounter, nowIso(), credentialId).run();
}

export async function deleteAllUserCredentials(env, userId) {
  await env.DB.prepare('DELETE FROM credentials WHERE user_id = ?').bind(userId).run();
}

// ── Sessions ────────────────────────────────────────────────────
export async function createSession(env, { id, userId, expiresAt }) {
  await env.DB.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(id, userId, nowIso(), expiresAt).run();
}

export async function getSession(env, id) {
  return env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first();
}

export async function deleteSession(env, id) {
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
}

export async function deleteAllUserSessions(env, userId) {
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

// ── Admin audit log (#36) ───────────────────────────────────────
export async function writeAuditLog(env, { adminIdentity, action, targetUserId, detail }) {
  await env.DB.prepare(
    'INSERT INTO admin_audit_log (id, admin_identity, action, target_user_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID(), adminIdentity, action, targetUserId || null, detail || null, nowIso()).run();
}

export async function getAuditLog(env, limit = 100) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT ?'
  ).bind(limit).all();
  return results;
}

// ── Feature flags (#37) ─────────────────────────────────────────
export async function listFlags(env) {
  const { results } = await env.DB.prepare('SELECT * FROM feature_flags ORDER BY flag_key').all();
  return results;
}

export async function defineFlag(env, { key, description }) {
  await env.DB.prepare(
    'INSERT INTO feature_flags (flag_key, description, created_at) VALUES (?, ?, ?) ' +
    'ON CONFLICT(flag_key) DO UPDATE SET description = excluded.description'
  ).bind(key, description || null, nowIso()).run();
}

// D1 doesn't enforce the FK from user_feature_flags.flag_key by default, so
// deleting a flag without also clearing its assignments would leave orphaned
// rows — which would silently reappear "assigned" if a flag with the same
// key were ever created again later. Delete assignments first.
export async function deleteFlag(env, flagKey) {
  await env.DB.prepare('DELETE FROM user_feature_flags WHERE flag_key = ?').bind(flagKey).run();
  await env.DB.prepare('DELETE FROM feature_flags WHERE flag_key = ?').bind(flagKey).run();
}

export async function listFlagUsers(env, flagKey) {
  const { results } = await env.DB.prepare(
    'SELECT u.id, u.label, f.enabled_at FROM user_feature_flags f ' +
    'JOIN users u ON u.id = f.user_id WHERE f.flag_key = ? ORDER BY f.enabled_at DESC'
  ).bind(flagKey).all();
  return results;
}

export async function getUserFlags(env, userId) {
  const { results } = await env.DB.prepare(
    'SELECT flag_key FROM user_feature_flags WHERE user_id = ?'
  ).bind(userId).all();
  return results.map((r) => r.flag_key);
}

export async function enableUserFlag(env, userId, flagKey) {
  await env.DB.prepare(
    'INSERT INTO user_feature_flags (user_id, flag_key, enabled_at) VALUES (?, ?, ?) ' +
    'ON CONFLICT(user_id, flag_key) DO NOTHING'
  ).bind(userId, flagKey, nowIso()).run();
}

export async function disableUserFlag(env, userId, flagKey) {
  await env.DB.prepare('DELETE FROM user_feature_flags WHERE user_id = ? AND flag_key = ?')
    .bind(userId, flagKey).run();
}

// ── Collections (#35 phase 3) ───────────────────────────────────
export async function getCollection(env, userId) {
  return env.DB.prepare('SELECT * FROM collections WHERE user_id = ?').bind(userId).first();
}

export async function saveCollection(env, userId, envelopeJson, revision) {
  await env.DB.prepare(
    'INSERT INTO collections (user_id, envelope, revision, updated_at) VALUES (?, ?, ?, ?) ' +
    'ON CONFLICT(user_id) DO UPDATE SET envelope = excluded.envelope, revision = excluded.revision, updated_at = excluded.updated_at'
  ).bind(userId, envelopeJson, revision, nowIso()).run();
}

// ── Self-service credential management (#35 phase 2) ────────────
// Distinct from the admin equivalents in this file — these are always
// scoped to the calling user's own userId (enforced by the route handler
// deriving userId from the session, never from client input).
export async function getOwnCredentials(env, userId) {
  const { results } = await env.DB.prepare(
    'SELECT credential_id, device_label, created_at, last_used_at FROM credentials WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();
  return results;
}

export async function deleteOwnCredential(env, userId, credentialId) {
  await env.DB.prepare('DELETE FROM credentials WHERE user_id = ? AND credential_id = ?')
    .bind(userId, credentialId).run();
}

export async function countUserCredentials(env, userId) {
  const row = await env.DB.prepare('SELECT COUNT(*) as n FROM credentials WHERE user_id = ?').bind(userId).first();
  return row ? row.n : 0;
}

export async function renameCredential(env, userId, credentialId, deviceLabel) {
  await env.DB.prepare('UPDATE credentials SET device_label = ? WHERE user_id = ? AND credential_id = ?')
    .bind(deviceLabel, userId, credentialId).run();
}
