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

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function sessionCookie(id, maxAgeSeconds) {
  return `ento_session=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearSessionCookie() {
  return 'ento_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

function getSessionIdFromCookie(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)ento_session=([^;]+)/);
  return match ? match[1] : null;
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
  const sessionId = getSessionIdFromCookie(request);
  if (!sessionId) return null;
  const session = await db.getSession(env, sessionId);
  if (!session || new Date(session.expires_at).getTime() < Date.now()) return null;
  return session;
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
  if (body.reregisterToken) {
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
    if (!label) return jsonResponse({ error: 'A label (email or name) is required.' }, 400);
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

  return jsonResponse({ success: true }, 200, { 'Set-Cookie': sessionCookie(sessionId, SESSION_TTL_SECONDS) });
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

  return jsonResponse({ success: true }, 200, { 'Set-Cookie': sessionCookie(sessionId, SESSION_TTL_SECONDS) });
}

// ── Session / logout ────────────────────────────────────────────
export async function handleSession(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ user: null }, 401);
  const user = await db.getUser(env, session.user_id);
  return jsonResponse({ user: user ? { id: user.id, label: user.label } : null });
}

export async function handleLogout(request, env) {
  const sessionId = getSessionIdFromCookie(request);
  if (sessionId) await db.deleteSession(env, sessionId);
  return jsonResponse({ success: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

export { REREGISTER_TOKEN_TTL_SECONDS };
