/**
 * Per-IP rate limiting backed by KV (the GEOCODE_CACHE binding), shared by
 * the public API (search/feedback/status), passkey ceremony starts, and the
 * sign-up limits in src/routes/account.js.
 *
 * Windows are fixed wall-clock buckets (`floor(now / windowSeconds)`), so a
 * caller can never be locked out for longer than one window. Callers are
 * counted per IPv4 address or per IPv6 /64, HMAC-hashed into the key under
 * the IP_HASH_KEY secret — no cleartext address is ever persisted. The
 * read-modify-write is not atomic, so a burst of concurrent requests from
 * one IP can undercount; this is best-effort abuse control, not accounting.
 * (Cloudflare WAF rate-limiting rules are the atomic option if ever needed.)
 */

// Every per-IP limit in one place — enforced by src/index.js and
// src/routes/account.js, and displayed on the admin portal's Status tab.
export const LIMITS = {
  search:         { limit: 60,  windowSeconds: 3600, applies: 'POST /api/search' },
  feedback:       { limit: 5,   windowSeconds: 3600, applies: 'POST /api/feedback' },
  status:         { limit: 120, windowSeconds: 3600, applies: 'GET /api/status/check' },
  normals:        { limit: 30,  windowSeconds: 3600, applies: 'POST /api/normals (season-normals flag)' },
  ceremony:       { limit: 20,  windowSeconds: 3600, applies: 'Passkey ceremony starts (register / login / re-auth options)' },
  signupAttempts: { limit: 6,   windowSeconds: 7200, applies: 'Sign-up attempts (register/options for a new account)' },
  signupAccounts: { limit: 3,   windowSeconds: 7200, applies: 'Accounts created (also mirrored in a per-browser cookie)' },
};

// Mask an IP before logging (privacy): keep enough to spot patterns in the
// logs, drop enough that a single user can't be identified from them.
// IPv4 → first three octets (1.2.3.x); IPv6 → first two hextets (a:b::…).
export function maskIp(ip) {
  if (!ip) return '(unknown)';
  if (ip.includes(':')) return ip.split(':').slice(0, 2).join(':') + '::…';
  return ip.split('.').slice(0, 3).join('.') + '.x';
}

// The unit a limit is counted against (assessment 2026-11, #1). IPv4: the
// address itself. IPv6: its /64 prefix. A single home connection or cloud
// server is normally given a whole /64, so keying on the full /128 let one
// caller rotate through billions of addresses and never hit a limit.
export function rateLimitSubject(ip) {
  if (!ip || !ip.includes(':')) return ip;
  const addr = ip.split('%')[0].toLowerCase(); // drop any zone id
  // An IPv4-mapped address (::ffff:1.2.3.4) is really IPv4.
  const mapped = addr.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return mapped[1];
  const [head, tail] = addr.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const fill = addr.includes('::') ? Math.max(0, 8 - h.length - t.length) : 0;
  const groups = [...h, ...Array(fill).fill('0'), ...t];
  return groups.slice(0, 4).map((g) => g.padStart(4, '0')).join(':') + '::/64';
}

// HMAC-SHA-256 under the IP_HASH_KEY secret → first 16 hex chars (assessment
// 2026-11, #6). A plain SHA-256 of an IPv4 address is reversible by trying
// all 2^32 of them in seconds; with a secret key it isn't. Without the
// secret (local dev, or before it's configured) this falls back to plain
// SHA-256 so limits keep working — set the secret in production.
let hmacKeyCache = null;   // { secret, key } — isolate-local
let warnedNoKey = false;
async function hmacKey(secret) {
  if (hmacKeyCache && hmacKeyCache.secret === secret) return hmacKeyCache.key;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  hmacKeyCache = { secret, key };
  return key;
}

export async function hashIp(ip, env) {
  try {
    const data = new TextEncoder().encode(ip);
    const secret = env && env.IP_HASH_KEY;
    let digest;
    if (secret) {
      digest = await crypto.subtle.sign('HMAC', await hmacKey(secret), data);
    } else {
      if (!warnedNoKey) { console.warn('[Worker:ratelimit] IP_HASH_KEY is not set — rate-limit keys use unkeyed SHA-256'); warnedNoKey = true; }
      digest = await crypto.subtle.digest('SHA-256', data);
    }
    return Array.from(new Uint8Array(digest).slice(0, 8))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    return 'nohash'; // crypto unavailable: still never store the raw IP
  }
}

async function bucketKey(env, ip, prefix, windowSeconds) {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  return `${prefix}:${bucket}:${await hashIp(rateLimitSubject(ip), env)}`;
}

async function readCount(env, key) {
  try { return parseInt(await env.GEOCODE_CACHE.get(key), 10) || 0; }
  catch (e) { return null; } // KV read failed → callers fail open
}

// Count this request and return true if the caller is now over the limit.
export async function rateLimited(env, ip, prefix, limit, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return false; // can't identify caller — don't hard-block
  const key = await bucketKey(env, ip, prefix, windowSeconds);
  const count = await readCount(env, key);
  if (count === null) return false;
  if (count >= limit) return true;
  try { await env.GEOCODE_CACHE.put(key, String(count + 1), { expirationTtl: windowSeconds }); }
  catch (e) { /* fail open on KV write error */ }
  return false;
}

// Read-only: is the caller at/over the limit? (Nothing is counted.)
export async function atRateLimit(env, ip, prefix, limit, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return false;
  const count = await readCount(env, await bucketKey(env, ip, prefix, windowSeconds));
  return count !== null && count >= limit;
}

// Count one event without checking — for limits on *successful* outcomes
// (e.g. accounts actually created), checked separately with atRateLimit().
export async function bumpRateLimit(env, ip, prefix, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return;
  const key = await bucketKey(env, ip, prefix, windowSeconds);
  const count = (await readCount(env, key)) || 0;
  try { await env.GEOCODE_CACHE.put(key, String(count + 1), { expirationTtl: windowSeconds }); }
  catch (e) { /* ignore */ }
}
