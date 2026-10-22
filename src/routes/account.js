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
import { rateLimited, atRateLimit, bumpRateLimit, maskIp, LIMITS } from '../lib/ratelimit.js';

// ── Sign-up abuse limits ──────────────────────────────────────────
// An anonymous visitor's only stable identity is their IP, so that's the
// primary control (per 2-hour window): a cap on sign-up ATTEMPTS (each
// register/options call for a brand-new account) and a stricter cap on
// accounts actually CREATED. A browser cookie counting created accounts is
// a soft second layer — trivially cleared, but it stops a single browser
// churning out accounts by accident, and costs nothing. The general
// passkey-ceremony limit (20/hour/IP, src/index.js) applies on top.
// Numbers live in LIMITS (src/lib/ratelimit.js) so the admin Status tab
// shows exactly what is enforced.
const SIGNUP_WINDOW_SECONDS = LIMITS.signupAccounts.windowSeconds;
const SIGNUP_ATTEMPTS_PER_WINDOW = LIMITS.signupAttempts.limit;
const SIGNUP_ACCOUNTS_PER_WINDOW = LIMITS.signupAccounts.limit;
const SIGNUP_COOKIE = 'ento_su';

function signupCookieCount(request) {
  const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)ento_su=(\d+)/);
  return m ? parseInt(m[1], 10) || 0 : 0;
}
function signupCookie(count, url) {
  return `${SIGNUP_COOKIE}=${count}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SIGNUP_WINDOW_SECONDS}${cookieDomainAttr(url)}`;
}
const SIGNUP_LIMIT_MESSAGE = 'Too many accounts have been created from your network recently. Please try again in a couple of hours.';
const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists. Sign in with your passkey instead — or, if you’ve lost it, contact an admin for a re-registration link.';

const CHALLENGE_TTL_SECONDS = 300;       // 5 minutes to complete a ceremony
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const REREGISTER_TOKEN_TTL_SECONDS = 15 * 60;  // matches #36's "short-lived" requirement
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same check used in public/feedback.js, public/account.js

// Session policy (security assessment 2026-09, R2/R3). SESSION_TTL_SECONDS
// above is the absolute lifetime; a session unused for SESSION_IDLE_SECONDS
// is rejected before that. last_seen_at is refreshed at most once per
// SESSION_TOUCH_SECONDS so a busy page doesn't write D1 on every request.
// Every sensitive action (add / rename / remove a passkey, delete the
// account) needs its OWN fresh passkey assertion, regardless of how recently
// the user logged in or last confirmed: the step-up mark set by
// reauth/verify is single-use and must be at most REAUTH_WINDOW_SECONDS old
// (just long enough to cover the round-trip from the prompt to the action).
const SESSION_IDLE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_TOUCH_SECONDS = 60 * 60;
const REAUTH_WINDOW_SECONDS = 2 * 60;

// Spends the session's step-up mark. True exactly once per assertion.
async function consumeReauth(env, session) {
  const notBefore = new Date(Date.now() - REAUTH_WINDOW_SECONDS * 1000).toISOString();
  return (await db.consumeSessionReauth(env, session.id, notBefore)) > 0;
}
const reauthRequired = () => jsonResponse({ error: 'reauth_required' }, 403);

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
  const now = Date.now();
  for (const sessionId of getSessionIdsFromCookie(request)) {
    const session = await db.getSession(env, sessionId);
    if (!session) continue;
    if (Date.parse(session.expires_at) < now) continue;
    // Idle timeout — sessions from before migration 0006 have no
    // last_seen_at yet; their creation time stands in for it.
    const lastSeen = Date.parse(session.last_seen_at || session.created_at) || 0;
    if (now - lastSeen > SESSION_IDLE_SECONDS * 1000) {
      try { await db.deleteSession(env, sessionId); } catch (e) { /* best effort */ }
      continue;
    }
    if (now - lastSeen > SESSION_TOUCH_SECONDS * 1000) {
      try { await db.touchSession(env, sessionId); } catch (e) { /* never fail a request over this */ }
    }
    return session;
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

  let userId, label, isNewUser, viaToken = false;
  const session = await requireSession(request, env);
  if (session) {
    // Already logged in — this is "add another passkey to my account," not a
    // new signup. Ignores any label/reregisterToken in the body; the target
    // account is always the session's own, never client-supplied. Adding a
    // passkey is how a hijacked session would make itself permanent, so it
    // needs its own fresh assertion first (R3); consumed here, before the
    // registration challenge is issued.
    if (!(await consumeReauth(env, session))) return reauthRequired();
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
    viaToken = true;
  } else {
    // Brand-new account. The label is lower-cased: emails are matched and
    // kept unique case-insensitively (migration 0007).
    label = (body.label || '').trim().toLowerCase().slice(0, 200);
    // Never trust client-side validation alone — accounts require an email,
    // not an arbitrary display name (same check as public/account.js).
    if (!EMAIL_RE.test(label)) return jsonResponse({ error: 'A valid email address is required.' }, 400);
    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (await rateLimited(env, ip, 'signup-att', SIGNUP_ATTEMPTS_PER_WINDOW, SIGNUP_WINDOW_SECONDS)
        || await atRateLimit(env, ip, 'signup-ok', SIGNUP_ACCOUNTS_PER_WINDOW, SIGNUP_WINDOW_SECONDS)
        || signupCookieCount(request) >= SIGNUP_ACCOUNTS_PER_WINDOW) {
      console.warn('[Worker:account] sign-up limit reached for IP:', maskIp(ip));
      return jsonResponse({ error: SIGNUP_LIMIT_MESSAGE }, 429);
    }
    if (await db.getUserByLabel(env, label)) return jsonResponse({ error: EMAIL_TAKEN_MESSAGE }, 409);
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
    // userVerification 'required' (R3): possession of the authenticator alone
    // is not enough — the platform must have checked biometrics/PIN.
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    // Stop the same physical authenticator being registered twice for one account.
    excludeCredentials: (existingCredentials || []).map((c) => ({ id: c.credential_id })),
  });

  await storeChallenge(env, options.challenge, JSON.stringify({ userId, label, isNewUser, viaToken }));
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
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('[Worker:account] registration verify failed:', err.message);
    return jsonResponse({ error: 'Could not verify passkey.' }, 400);
  }
  if (!verification.verified || !verification.registrationInfo) {
    return jsonResponse({ error: 'Passkey verification failed.' }, 400);
  }

  const { credential: regCred } = verification.registrationInfo;
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (pending.isNewUser) {
    // Re-checked here as well as at options time: the challenge lives for
    // five minutes, and the UNIQUE index is the final word on a race.
    if (await atRateLimit(env, ip, 'signup-ok', SIGNUP_ACCOUNTS_PER_WINDOW, SIGNUP_WINDOW_SECONDS)) {
      return jsonResponse({ error: SIGNUP_LIMIT_MESSAGE }, 429);
    }
    if (await db.getUserByLabel(env, pending.label)) return jsonResponse({ error: EMAIL_TAKEN_MESSAGE }, 409);
    try {
      await db.createUser(env, { id: pending.userId, label: pending.label });
    } catch (err) {
      if (/UNIQUE/i.test(err.message || '')) return jsonResponse({ error: EMAIL_TAKEN_MESSAGE }, 409);
      throw err;
    }
    await bumpRateLimit(env, ip, 'signup-ok', SIGNUP_WINDOW_SECONDS);
  }
  await db.saveCredential(env, {
    credentialId: regCred.id,
    userId: pending.userId,
    publicKey: regCred.publicKey,
    signCount: regCred.counter,
    deviceLabel: 'Unnamed device',
  });

  // "Add a passkey" while logged in keeps the existing session — only a
  // brand-new account or a token-based re-registration starts a new one.
  if (!pending.isNewUser && !pending.viaToken) {
    return jsonResponse({ success: true });
  }
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db.createSession(env, { id: sessionId, userId: pending.userId, expiresAt, credentialId: regCred.id });

  const cookies = sessionCookies(sessionId, SESSION_TTL_SECONDS, url);
  if (pending.isNewUser) cookies.push(signupCookie(signupCookieCount(request) + 1, url));
  return jsonResponse({ success: true }, 200, { 'Set-Cookie': cookies });
}

// ── Login ───────────────────────────────────────────────────────
// No allowCredentials — a discoverable/resident credential lets the browser
// show its own "which passkey?" picker (usernameless login).
export async function handleLoginOptions(request, env) {
  const url = new URL(request.url);
  const { rpID } = rpConfigFor(url);
  const options = await generateAuthenticationOptions({ rpID, userVerification: 'required' });
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
  // '1' is the login marker; a re-auth challenge (JSON) must never be
  // redeemable as a login.
  if (pending !== '1') return jsonResponse({ error: 'Login expired. Please try again.' }, 400);

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
      requireUserVerification: true,
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
  await db.createSession(env, { id: sessionId, userId: stored.user_id, expiresAt, credentialId: stored.credential_id });
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
  if (!(await consumeReauth(env, session))) return reauthRequired();
  const count = await db.countUserCredentials(env, session.user_id);
  if (count <= 1) {
    return jsonResponse({ error: 'This is your only passkey — add another before removing it, or you’ll be locked out.' }, 400);
  }
  await db.deleteOwnCredential(env, session.user_id, credentialId);
  // R2: a removed passkey takes the sessions it opened with it (a lost or
  // stolen device stays logged out), except the session doing the removing.
  await db.deleteSessionsForCredential(env, session.user_id, credentialId, session.id);
  return jsonResponse({ success: true });
}

// ── Step-up re-authentication (R3) ───────────────────────────────
// A fresh passkey assertion on the CURRENT session. Required, once per
// action, before anything that could lock the user out or entrench an
// attacker: adding, renaming or removing a passkey, deleting the account.
export async function handleReauthOptions(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  const url = new URL(request.url);
  const { rpID } = rpConfigFor(url);
  const creds = await db.getUserCredentials(env, session.user_id);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: creds.map((c) => ({ id: c.credential_id })),
  });
  await storeChallenge(env, options.challenge, JSON.stringify({ reauth: true, userId: session.user_id, sessionId: session.id }));
  return jsonResponse(options);
}

export async function handleReauthVerify(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  const url = new URL(request.url);
  const { rpID, origin } = rpConfigFor(url);
  let credential;
  try { credential = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid request body.' }, 400); }
  const challenge = decodeClientDataChallenge(credential);
  if (!challenge) return jsonResponse({ error: 'Malformed passkey response.' }, 400);
  const pendingRaw = await consumeChallenge(env, challenge);
  let pending = null;
  try { pending = pendingRaw && pendingRaw !== '1' ? JSON.parse(pendingRaw) : null; } catch (e) { pending = null; }
  // The challenge must be a re-auth challenge issued to THIS session for
  // THIS user — a login challenge, or another session's, is rejected.
  if (!pending || !pending.reauth || pending.userId !== session.user_id || pending.sessionId !== session.id) {
    return jsonResponse({ error: 'Confirmation expired. Please try again.' }, 400);
  }
  const stored = credential.id ? await db.getCredential(env, credential.id) : null;
  if (!stored || stored.user_id !== session.user_id) return jsonResponse({ error: 'Unknown passkey.' }, 400);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential, expectedChallenge: challenge, expectedOrigin: origin, expectedRPID: rpID,
      requireUserVerification: true,
      credential: { id: stored.credential_id, publicKey: new Uint8Array(stored.public_key), counter: stored.sign_count },
    });
  } catch (err) {
    console.error('[Worker:account] reauth verify failed:', err.message);
    return jsonResponse({ error: 'Could not verify passkey.' }, 400);
  }
  if (!verification.verified) return jsonResponse({ error: 'Passkey verification failed.' }, 400);
  await db.updateCredentialCounter(env, stored.credential_id, verification.authenticationInfo.newCounter);
  await db.markSessionReauth(env, session.id);
  return jsonResponse({ success: true, validForSeconds: REAUTH_WINDOW_SECONDS });
}

// ── Sessions (R2) ────────────────────────────────────────────────
export async function handleListSessions(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401, NO_STORE);
  const rows = await db.listOwnSessions(env, session.user_id);
  // Ids are never sent to the client (see db.listOwnSessions); "current"
  // is the only per-row identity the UI needs.
  const sessions = rows.map((r) => ({
    current: r.id === session.id,
    device_label: r.device_label || null,
    created_at: r.created_at,
    last_seen_at: r.last_seen_at || r.created_at,
    expires_at: r.expires_at,
  }));
  return jsonResponse({ sessions }, 200, NO_STORE);
}

// "Sign out everywhere else" — protective, so no re-auth needed.
export async function handleRevokeOtherSessions(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  await db.deleteOtherSessions(env, session.user_id, session.id);
  return jsonResponse({ success: true });
}

// ── Data export + account deletion (R7) ──────────────────────────
export async function handleExport(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  const data = await db.exportUserData(env, session.user_id);
  if (!data) return jsonResponse({ error: 'Account not found.' }, 404);
  const body = JSON.stringify({ exported_at: new Date().toISOString(), source: 'entotools.org', ...data }, null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="entotools-account-export.json"',
      'Cache-Control': 'no-store',
    },
  });
}

export async function handleDeleteAccount(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  if (!(await consumeReauth(env, session))) return reauthRequired();
  const url = new URL(request.url);
  await db.deleteUser(env, session.user_id); // passkeys, sessions, flags, collection, then the user row
  console.log('[Worker:account] account deleted by its owner');
  return jsonResponse({ success: true }, 200, { 'Set-Cookie': clearSessionCookies(url) });
}

// PATCH /api/account/credentials/:id  body: { device_label } — lets a user
// give each passkey a recognisable name ("Work laptop") instead of the
// "Unnamed device" default. Scoped to the caller's own credentials via the
// user_id in the UPDATE's WHERE clause; a foreign id is a plain 404.
const DEVICE_LABEL_MAX = 60;
export async function handleRenameCredential(request, env, credentialId) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: 'Not logged in.' }, 401);
  if (!(await consumeReauth(env, session))) return reauthRequired(); // any passkey edit needs the passkey
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
