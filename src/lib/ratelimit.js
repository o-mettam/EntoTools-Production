/**
 * Per-IP rate limiting backed by KV (the GEOCODE_CACHE binding), shared by
 * the public API (search/feedback/status), passkey ceremony starts, and the
 * sign-up limits in src/routes/account.js.
 *
 * Windows are fixed wall-clock buckets (`floor(now / windowSeconds)`), so a
 * caller can never be locked out for longer than one window. The IP is
 * SHA-256-hashed into the key — no cleartext address is ever persisted. The
 * read-modify-write is not atomic, so a burst of concurrent requests from
 * one IP can undercount; this is best-effort abuse control, not accounting.
 * (Cloudflare WAF rate-limiting rules are the atomic option if ever needed.)
 */

// Mask an IP before logging (privacy): keep enough to spot patterns in the
// logs, drop enough that a single user can't be identified from them.
// IPv4 → first three octets (1.2.3.x); IPv6 → first two hextets (a:b::…).
export function maskIp(ip) {
  if (!ip) return '(unknown)';
  if (ip.includes(':')) return ip.split(':').slice(0, 2).join(':') + '::…';
  return ip.split('.').slice(0, 3).join('.') + '.x';
}

// SHA-256 → first 16 hex chars: ample to avoid collisions within one time
// bucket while keeping no reversible record of the caller's address.
export async function hashIp(ip) {
  try {
    const data = new TextEncoder().encode(ip);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest).slice(0, 8))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    return 'nohash'; // crypto unavailable: still never store the raw IP
  }
}

async function bucketKey(ip, prefix, windowSeconds) {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  return `${prefix}:${bucket}:${await hashIp(ip)}`;
}

async function readCount(env, key) {
  try { return parseInt(await env.GEOCODE_CACHE.get(key), 10) || 0; }
  catch (e) { return null; } // KV read failed → callers fail open
}

// Count this request and return true if the caller is now over the limit.
export async function rateLimited(env, ip, prefix, limit, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return false; // can't identify caller — don't hard-block
  const key = await bucketKey(ip, prefix, windowSeconds);
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
  const count = await readCount(env, await bucketKey(ip, prefix, windowSeconds));
  return count !== null && count >= limit;
}

// Count one event without checking — for limits on *successful* outcomes
// (e.g. accounts actually created), checked separately with atRateLimit().
export async function bumpRateLimit(env, ip, prefix, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return;
  const key = await bucketKey(ip, prefix, windowSeconds);
  const count = (await readCount(env, key)) || 0;
  try { await env.GEOCODE_CACHE.put(key, String(count + 1), { expirationTtl: windowSeconds }); }
  catch (e) { /* ignore */ }
}
