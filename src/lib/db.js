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
    'SELECT s.id, s.created_at, s.expires_at, s.last_seen_at, c.device_label FROM sessions s ' +
    'LEFT JOIN credentials c ON c.credential_id = s.credential_id WHERE s.user_id = ? ORDER BY s.created_at DESC'
  ).bind(userId).all();
  return { user, credentials, sessions };
}

// Everything the account holds about a user, for the self-service data
// export (R7). Public keys and session ids are deliberately left out — they
// aren't the user's data in any meaningful sense and one of them is a secret.
export async function exportUserData(env, userId) {
  const user = await getUser(env, userId);
  if (!user) return null;
  const { results: credentials } = await env.DB.prepare(
    'SELECT device_label, created_at, last_used_at FROM credentials WHERE user_id = ? ORDER BY created_at'
  ).bind(userId).all();
  const { results: flags } = await env.DB.prepare(
    'SELECT flag_key, enabled_at FROM user_feature_flags WHERE user_id = ?'
  ).bind(userId).all();
  const collectionRow = await getCollection(env, userId);
  let collection = null;
  if (collectionRow) {
    try { collection = JSON.parse(collectionRow.envelope); } catch (e) { collection = { unparseable: true }; }
  }
  return {
    account: { id: user.id, email: user.label, created_at: user.created_at },
    passkeys: credentials,
    feature_flags: flags,
    collection,
    collection_updated_at: collectionRow ? collectionRow.updated_at : null,
  };
}

// Deletes a user and everything referencing them — D1 doesn't enforce the
// FK constraints by default, so each table has to be cleared explicitly, in
// an order that leaves nothing orphaned even if this were interrupted
// partway through (the users row itself goes last).
export async function deleteUser(env, userId) {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM credentials WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM user_feature_flags WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM collections WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
  ]);
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
// A fresh login counts as a recent re-authentication (reauth_at = now), so
// adding a second passkey right after signing up doesn't prompt twice.
export async function createSession(env, { id, userId, expiresAt, credentialId }) {
  const now = nowIso();
  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at, credential_id, reauth_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, now, expiresAt, now, credentialId || null, now).run();
}

export async function getSession(env, id) {
  return env.DB.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first();
}

export async function touchSession(env, id) {
  await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(nowIso(), id).run();
}

export async function markSessionReauth(env, id) {
  await env.DB.prepare('UPDATE sessions SET reauth_at = ? WHERE id = ?').bind(nowIso(), id).run();
}

// The user's own view of their sessions. Never returns session ids — the id
// IS the cookie, and listing it would turn any XSS into full session theft.
export async function listOwnSessions(env, userId) {
  const { results } = await env.DB.prepare(
    'SELECT s.id, s.created_at, s.last_seen_at, s.expires_at, c.device_label FROM sessions s ' +
    'LEFT JOIN credentials c ON c.credential_id = s.credential_id ' +
    'WHERE s.user_id = ? AND s.expires_at > ? ORDER BY COALESCE(s.last_seen_at, s.created_at) DESC'
  ).bind(userId, nowIso()).all();
  return results;
}

export async function deleteOtherSessions(env, userId, keepId) {
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').bind(userId, keepId).run();
}

// Sessions opened by one passkey, except the one doing the removing (that
// device just proved presence via re-auth; the passkey being removed is on
// some other, possibly lost, device).
export async function deleteSessionsForCredential(env, userId, credentialId, keepId) {
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND credential_id = ? AND id != ?')
    .bind(userId, credentialId, keepId).run();
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

// Returns the number of rows changed — 0 means the credential doesn't exist
// or doesn't belong to this user (deliberately indistinguishable).
export async function renameCredential(env, userId, credentialId, deviceLabel) {
  const res = await env.DB.prepare('UPDATE credentials SET device_label = ? WHERE user_id = ? AND credential_id = ?')
    .bind(deviceLabel, userId, credentialId).run();
  return res && res.meta ? (res.meta.changes || 0) : 0;
}

// Housekeeping: expired sessions are useless but were never removed, so the
// table only ever grew. Called opportunistically on each successful login.
export async function purgeExpiredSessions(env) {
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(nowIso()).run();
}
