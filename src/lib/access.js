/**
 * Cloudflare Access JWT verification for the admin portal (#36).
 *
 * Access itself is the real gate: it sits in front of the Worker and an
 * unauthenticated request never reaches this code. This verification is
 * defense-in-depth for the case where Access is ever misconfigured (wrong
 * path, policy accidentally removed, etc.) — if the JWT is missing or
 * invalid, treat the request exactly like Access was never there: 404, not
 * 401, so an unauthorized prober sees an ordinary "not found" (see #36).
 *
 * Requires two things set as Pages environment variables/secrets AFTER the
 * Access application is created in the Cloudflare dashboard — this cannot be
 * done from the repo (see README "Admin portal setup"):
 *   CF_ACCESS_TEAM_DOMAIN  e.g. "yourteam.cloudflareaccess.com"
 *   CF_ACCESS_AUD          the Access application's "Audience" (AUD) tag
 *
 * Uses only Web Crypto (crypto.subtle.verify) — no JWT library — this is
 * the standard, Cloudflare-documented pattern for validating an Access JWT at
 * the application layer.
 */

// JWKS rarely rotates; a short in-memory cache avoids fetching it on every
// admin request without needing a KV round-trip. Isolate-local, so this is
// just an optimization — correctness never depends on the cache hitting.
let jwksCache = null;
let jwksCachedAt = 0;
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;

async function getJwks(env) {
  if (jwksCache && Date.now() - jwksCachedAt < JWKS_CACHE_TTL_MS) return jwksCache;
  const resp = await fetch(`https://${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  if (!resp.ok) throw new Error('Failed to fetch Access JWKS: ' + resp.status);
  const jwks = await resp.json();
  jwksCache = jwks;
  jwksCachedAt = Date.now();
  return jwks;
}

function base64UrlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToJson(b64url) {
  const bytes = base64UrlToBytes(b64url);
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Returns the verified token payload (contains `.email`) or null. Never
// throws — any failure (missing header, bad signature, expired, wrong
// audience/issuer, JWKS fetch failure) is treated as "not authorized."
export async function verifyAccessRequest(request, env) {
  try {
    if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) return null;
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const header = base64UrlToJson(headerB64);
    const payload = base64UrlToJson(payloadB64);
    if (header.alg !== 'RS256') return null;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    if (typeof payload.iss !== 'string' || payload.iss !== `https://${env.CF_ACCESS_TEAM_DOMAIN}`) return null;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.CF_ACCESS_AUD)) return null;

    const jwks = await getJwks(env);
    const jwk = (jwks.keys || []).find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const publicKey = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
    );
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToBytes(sigB64);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, signedData);
    if (!valid) return null;

    return payload;
  } catch (e) {
    console.error('[Worker:access] verification error:', e.message);
    return null;
  }
}
