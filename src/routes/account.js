/**
 * Account routes — issue #35 phase 1 (backend only, no frontend UI yet;
 * intended to be exercised directly, e.g. via curl/Postman, per the phasing
 * in #35). WebAuthn registration + login, session cookie management.
 *
 * Requires the @simplewebauthn/server npm dependency and an actual bundling
 * step to run — neither exists in this repo yet as of this commit; see
 * README "Account system setup" for the exact commands to provision this
 * (npm install, wrangler d1 create, running the migrations).
 */
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { rpConfigFor, decodeClientDataChallenge } from '../lib/webauthn.js';
import * as db from '../lib/db.js';

const CHALLENGE_TTL_SECONDS = 300;       // 5 minutes to complete a ceremony
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const REREGISTER_TOKEN_TTL_SECONDS = 15 * 60;  // matches #36's "short-lived" requirement
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same check used in public/feedback.js, public/account.js

// extraHeaders values may be arrays — needed for multiple Set-Cookie headers
// on one response, which a plain object literal can't express.
function jsonResponse(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const [name, value] of Object.entries(extraHeaders)) {
    for (const v of (Array.isArray(value) ? value : [value])) headers.append(name, v);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

// Without an explicit Domain, the cookie is host-only — set while visiting
// entotools.org it would NOT be sent on www.entotools.org, or vice versa
// (this was a real bug: sign up on one exact host, then look logged-out on
// the other). A bare "entotools.org" Domain (no leading dot) covers both
// per the modern Cookie spec. Local dev keeps a host-only cookie — browsers
// don't reliably accept a Domain attribute for "localhost".
function cookieDomainAttr(url) {
  const host = url.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return '';
  return '; Domain=entotools.org';
}

// The ghost-cookie problem (#38/#39): sessions issued before v1.6.3 set a
// HOST-ONLY ento_session cookie (no Domain attribute). Adding Domain= made
// every later cookie a *different* cookie as far as browsers are concerned
// (host-only flag is part of a cookie's identity), so a browser that still
// held the old one sent BOTH — and per RFC 6265 §5.4 the older cookie is
// listed first. The server took the first match, looked up a long-revoked
// session, and answered 401 right after a perfectly good login. Two-part
// fix: (1) every response that sets the session cookie also clears the
// host-only variant, and (2) requireSession() tries every ento_session
// value it's sent rather than only the first.
const HOST_ONLY_CLEAR = 'ento_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

function sessionCookies(id, maxAgeSeconds, url) {
  const domain = cookieDomainAttr(url);
  const set = `ento_session=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}${domain}`;
  // On localhost the real cookie IS host-only — clearing it would undo the login.
  return domain ? [set, HOST_ONLY_CLEAR] : [set];
}

function clearSessionCookies(url) {
  const domain = cookieDomainAttr(url);
  const clear = `ento_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0${domain}`;
  return domain ? [clear, HOST_ONLY_CLEAR] : [clear];
}

function getSessionIdsFromCookie(request) {
  const cookie = request.headers.get('Cookie') || '';
  const ids = [];
  const re = /(?:^|;\s*)ento_session=([^;]*)/g;
  let m;
  while ((m = re.exec(cookie)) !== null) if (m[1]) ids.push(m[1]);
  return ids;
}

// Challenges are short-lived and single-use — KV (already bound as
// GEOCODE_CACHE) is a better fit than a D1 table: TTL expiry is automatic,
// and nothing here needs to survive being read once.
async function storeChallenge(env, challenge, contextJson) {
  await env.GEOCODE_CACHE.put(`webauthn-challenge:${challenge}`, contextJson, {
    expirationTtl: CHALLENGE_TTL_SECONDS,
  });
}
async function consumeChallenge(env, challenge) {
  const key = `webauthn-challenge:${challenge}`;
  const value = await env.GEOCODE_CACHE.get(key);
  if (value) await env.GEOCODE_CACHE.delete(key);
  return value;
}

// Used by both the account session endpoint and #37's flags endpoint.
export async function requireSession(request, env) {
  for (const sessionId of getSessionIdsFromCookie(request)) {
    const session = await db.getSession(env, sessionId);
    if (session && new Date(session.expires_at).getTime() >= Date.now()) return session;
  }
  return null;
}

// ── Registration ────────────────────────────────────────────────
// body: { label } for a brand-new account, OR { reregisterToken } to attach
// a fresh passkey to an existing account after an admin-issued reset (#36).
export async function handleRegisterOptions(request, env) {
  const url = new URL(request.url);
  const { rpID } = rpConfigFor(url);
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid request body.' }, 400); }

  let userId, label, isNewUser;
  const session = await requireSession(request, env);
  if (session) {
    // Already logged in — this is "add another passkey to my account," not a
    // new signup. Ignores any label/reregisterToken in the body; the target
    // account is always the session's own, never client-supplied.
    const existing = await db.getUser(env, session.user_id);
    if (!existing) return jsonResponse({ error: 'Account not found.' }, 404);
    userId = existing.id;
    label = existing.label;
    isNewUser = false;
  } else if (body.reregisterToken) {
    const existingUserId = await env.GEOCODE_CACHE.get(`reregister-token:${body.reregisterToken}`);
    if (!existingUserId) {
      return jsonResponse({ error: 'This re-registration link has expired or already been used.' }, 400);
    }
    await env.GEOCODE_CACHE.delete(`reregister-token:${body.reregisterToken}`); // single-use
    const existing = await db.getUser(env, existingUserId);
    if (!existing) return jsonResponse({ error: 'Account not found.' }, 404);
    userId = existing.id;
    label = existing.label;
    isNewUser = false;
  } else {
    label = (body.label || '').trim().slice(0, 200);
    // Never trust client-side validation alone — accounts require an email,
    // not an arbitrary display name (same check as public/account.js).
    if (!EMAIL_RE.test(label)) return jsonResponse({ error: 'A valid email address is required.' }, 400);
    userId = crypto.randomUUID();
    isNewUser = true;
  }

  const existingCredentials = isNewUser ? [] : await db.getUserCredentials(env, userId);
  const options = await generateRegistrationOptions({
    rpName: 'EntoTools',
    rpID,
    userName: label,
    userID: new TextEncoder().encode(userId),
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
    // Stop the same physical authenticator being registered twice for one account.
    excludeCredentials: (existingCredentials || []).map((c) => ({ id: c.credential_id })),
  });

  await storeChallenge(env, options.challenge, JSON.stringify({ userId, label, isNewUser }));
  return jsonResponse(options);
}

export async function handleRegisterVerify(request, env) {
  const url = new URL(request.url);
  const { rpID, origin } = rpConfigFor(url);
  let credential;
  try { credential = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid request body.' }, 400); }

  const challenge = decodeClientDataChallenge(credential);
  if (!challenge) return jsonResponse({ error: 'Malformed passkey response.' }, 400);
  const pendingRaw = await consumeChallenge(env, challenge);
  if (!pendingRaw) return jsonResponse({ error: 'Registration expired. Please try again.' }, 400);
  const pending = JSON.parse(pendingRaw);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (err) {
    console.error('[Worker:account] registration verify failed:', err.message);
    return jsonResponse({ error: 'Could not verify passkey.' }, 400);
  }
  if (!verification.verified || !verification.registrationInfo) {
    return jsonResponse({ error: 'Passkey verification failed.' }, 400);
  }

  const { credential: regCred } = verification.registrationInfo;
  if (pending.isNewUser) {
    await db.createUser(env, { id: pending.userId, label: pending.label });
  }
  await db.saveCredential(env, {
    credentialId: regCred.id,
    userId: pending.userId,
    publicKey: regCred.publicKey,
    signCount: regCred.counter,
    deviceLabel: 'Unnamed device',
  });

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db.createSession(env, { id: sessionId, userId: pending.userId, expiresAt });

  return jsonResponse({ success: true }, 200, { 'Set-Cookie': sessionCookies(sessionId, SESSION_TTL_SECONDS, url) });
}

// ── Login ───────────────────────────────────────────────────────
// No allowCredentials — a discoverable/resident credential lets the browser
// show its own "which passkey?" picker (usernameless login).
export async function handleLoginOptions(request, env) {
  const url = new URL(request.url);
  const { rpID } = rpConfigFor(url);
  const options = await generateAuthenticationOptions({ rpID, userVerification: 'preferred' });
  await storeChallenge(env, options.challenge, '1');
  return jsonResponse(options);
}

export async function handleLoginVerify(request, env) {
  const url = new URL(request.url);
  const { rpID, origin } = rpConfigFor(url);
  let credential;
  try { credential = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid request body.' }, 400); }

  const challenge = decodeClientDataChallenge(credential);
  if (!challenge) return jsonResponse({ error: 'Malformed passkey response.' }, 400);
  const pending = await consumeChallenge(env, challenge);
  if (!pending) return jsonResponse({ error: 'Login expired. Please try again.' }, 400);

  const credentialId = credential.id;
  const stored = credentialId ? await db.getCredential(env, credentialId) : null;
  if (!stored) return jsonResponse({ error: 'Unknown passkey.' }, 400);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.credential_id,
        publicKey: new Uint8Array(stored.public_key),
        counter: stored.sign_count,
      },
    });
  } catch (err) {
    console.error('[Worker:account] login verify failed:', err.message);
    return jsonResponse({ error: 'Could not verify passkey.' }, 400);
  }
  if (!verification.verified) return jsonResponse({ error: 'Passkey verification failed.' }, 400);

  // A non-increasing counter is a strong signal of a cloned authenticator —
  // verifyAuthenticationResponse already checks this and throws if it fails,
  // so reaching here means it's safe to persist the new value.
  await db.updateCredentialCounter(env, stored.credential_id, verification.authenticationInfo.newCounter);

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db.createSession(env, { id: sessionId, userId: stored.user_id, expiresAt });
  // Best-effort housekeeping; never let it fail a login.
  try { await db.purgeExpiredSessions(env); } catch (e) { console.warn('[Worker:account] session purge failed:', e.message); }

  return jsonResponse({ success: true }, 200, { 'Set-Cookie': sessionCookies(sessionId, SESSION_TTL_SECONDS, url) });
}

// ── Session / logout ────────────────────────────────────────────
// Cache-Control: no-store on every handler below that reflects session
// state — Safari has been observed reusing a cached GET response for these
// exact URLs across a login that changed the session cookie, leaving the
// client stuck showing the pre-login state even though the server session
// is valid (issues #38/#39). The client now also sends cache: 'no-store',
// but this is cheap defense in depth against any other cache in the path.
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function handleSession(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ user: null }, 401, NO_STORE);
  const user = await db.getUser(env, session.user_id);
  return jsonResponse({ user: user ? { id: user.id, label: user.label } : null }, 200, NO_STORE);
}

export async function handleLogout(request, env) {
  const url = new URL(request.url);
  // Every id the browser sent, not just the first — a stale ghost cookie
  // must not shield the real session from being revoked.
  for (const sessionId of getSessionIdsFromCookie(request)) await db.deleteSession(env, sessionId);
  return jsonResponse({ success: true }, 200, { 'Set-Cookie': clearSessionCookies(url) });
}

// ── Self-service credential management (#35 phase 2) ─────────────
export async function handleListCredentials(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401, NO_STORE);
  const credentials = await db.getOwnCredentials(env, session.user_id);
  return jsonResponse({ credentials }, 200, NO_STORE);
}

export async function handleDeleteCredential(request, env, credentialId) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  const count = await db.countUserCredentials(env, session.user_id);
  if (count <= 1) {
    return jsonResponse({ error: 'This is your only passkey — add another before removing it, or you’ll be locked out.' }, 400);
  }
  await db.deleteOwnCredential(env, session.user_id, credentialId);
  return jsonResponse({ success: true });
}

// PATCH /api/account/credentials/:id  body: { device_label } — lets a user
// give each passkey a recognisable name ("Work laptop") instead of the
// "Unnamed device" default. Scoped to the caller's own credentials via the
// user_id in the UPDATE's WHERE clause; a foreign id is a plain 404.
const DEVICE_LABEL_MAX = 60;
export async function handleRenameCredential(request, env, credentialId) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid request body.' }, 400); }
  const label = typeof body.device_label === 'string'
    ? body.device_label.replace(/[\u0000-\u001f\u007f]/g, '').trim() // strip control chars
    : '';
  if (!label || label.length > DEVICE_LABEL_MAX) {
    return jsonResponse({ error: `A name between 1 and ${DEVICE_LABEL_MAX} characters is required.` }, 400);
  }
  const changed = await db.renameCredential(env, session.user_id, credentialId, label);
  if (!changed) return jsonResponse({ error: 'Passkey not found.' }, 404);
  return jsonResponse({ success: true, device_label: label });
}

// ── Account-backed collection sync (#35 phase 3) ─────────────────
// Mirrors EntoDriveProvider's pull()/push() shape exactly (see
// public/sync/provider-gdrive.js) so public/sync/provider-account.js can
// implement the same StorageProvider interface with no server-side merge
// logic — merging stays entirely client-side in EntoStore.mergeEnvelopes().
export async function handleGetCollection(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  const row = await db.getCollection(env, session.user_id);
  if (!row) return jsonResponse({ json: null, meta: {} });
  let parsed = null;
  try { parsed = JSON.parse(row.envelope); }
  catch (e) { console.warn('[Worker:account] stored collection envelope failed to parse:', e.message); }
  return jsonResponse({ json: parsed, meta: { revision: row.revision, updatedAt: row.updated_at } });
}

// Hard caps on what one account may store. A real collection of a few
// thousand specimens serialises to a few hundred KB; anything near these
// limits is either a bug or someone using the endpoint as free blob storage.
// (Security assessment 2026-09: previously unbounded.)
const COLLECTION_MAX_BYTES = 1_000_000;
const COLLECTION_MAX_ENTRIES = 20_000;

export async function handlePutCollection(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  const tooLarge = () => jsonResponse({ error: 'Collection is too large to sync to your account (limit 1 MB / 20,000 entries).' }, 413);
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > COLLECTION_MAX_BYTES) return tooLarge();
  let raw;
  try { raw = await request.text(); } catch (e) { return jsonResponse({ error: 'Invalid request body.' }, 400); }
  if (new TextEncoder().encode(raw).length > COLLECTION_MAX_BYTES) return tooLarge();
  let snapshot;
  try { snapshot = JSON.parse(raw); } catch (e) { return jsonResponse({ error: 'Invalid request body.' }, 400); }
  if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.entries)) {
    return jsonResponse({ error: 'Malformed snapshot.' }, 400);
  }
  if (snapshot.entries.length > COLLECTION_MAX_ENTRIES) return tooLarge();
  const revision = Number(snapshot.revision) || 1;
  await db.saveCollection(env, session.user_id, JSON.stringify(snapshot), revision);
  const updatedAt = new Date().toISOString();
  return jsonResponse({ modifiedTime: updatedAt, revision });
}

export { REREGISTER_TOKEN_TTL_SECONDS };
