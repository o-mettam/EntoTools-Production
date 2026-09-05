# EntoTools — Security Assessment (September 2026)

**Scope:** everything in this repository that runs on entotools.org — the Cloudflare Pages Worker (`src/`), the D1 schema (`migrations/`), the client-side account/sync/feedback code (`public/`), the admin portal (`templates/admin.html`), and the deployment configuration (`wrangler.toml`, `public/_headers`). Cloudflare dashboard settings (Access policy, WAF, DNS) were **not** inspected — they aren't in the repo and need a dashboard session; they're called out under "Outside the repo" below.

**Method:** full read of the code paths above, `npm audit`, live header checks against entotools.org, and an end-to-end browser run (headless Chrome with a virtual passkey) of the sign-up → session → rename → reload flow after the fixes below shipped.

**Bottom line:** the fundamentals are sound — every D1 query is parameterised, every `innerHTML` interpolation goes through an escaper, the admin portal fails closed to a 404, passkeys use resident keys with sign-counter checks and single-use challenges, public bug reports are PII-redacted server-side, and there are no secrets in the repo. The findings that mattered were all in the *seams* between components (CORS grants, CSRF on the admin API, an unbounded upload). Those are fixed in v1.8.0. What remains is a short list of design-level improvements, the most important of which is that **account email addresses are never verified**.

---

## Fixed in v1.8.0 (this assessment)

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| 1 | **Medium** | **Admin API had no CSRF guard beyond the Access cookie's own SameSite setting.** The Access session cookie rides along on any browser request to the origin; a page elsewhere could attempt `POST /frost/admin/users/:id/reregister-token` (no body needed) on a signed-in admin's behalf. Not exploitable for exfiltration (the response is unreadable cross-origin) and blocked if Access uses SameSite=Lax — but that's a dashboard setting, not something the code enforced. | `src/routes/admin.js` now rejects any non-GET request whose `Sec-Fetch-Site` isn't `same-origin`/`none` or whose `Origin` isn't entotools.org (answered with the same 404 as an unauthenticated probe). Non-browser clients (no such headers) are unaffected. |
| 2 | **Medium** | **CORS preflight granted `Access-Control-Allow-Origin: *` for every path on the site**, including `/api/account/*` and `/frost/admin/*`, and account-route error responses (403/429/500) carried `*` too. Credentialed cross-origin reads were still refused by the browser (a `*` grant never pairs with cookies), so no data was exposed — but it advertised endpoints that are strictly same-origin. | Preflight now returns a bare 204 (no grant) except for the genuinely public `/api/search` and `/api/status/*`; account/flags/404 responses use a CORS-less `privateJson()`. |
| 3 | **Medium** | **`PUT /api/account/collection` accepted a body of any size.** A logged-in user could store arbitrarily large blobs in D1 (storage abuse; large rows also degrade D1 performance for everyone). | 1 MB / 20,000-entry cap, checked against `Content-Length` *and* the decoded body; returns 413. |
| 4 | Low | Expired sessions were never deleted, so the `sessions` table only ever grew (and the admin "Sessions" list showed dead rows). | Purged opportunistically on every successful login. |
| 5 | Low | Access JWKS cache: an unknown `kid` (key rotation) returned "unauthorized" until the 5-minute cache expired — a brief admin lock-out on every Cloudflare key rotation. | Unknown `kid` now forces one JWKS refetch. |
| 6 | Low | The shared `esc()` helpers escaped `<`, `>`, `&` but **not quotes**, so a value placed inside an HTML attribute (e.g. `data-description="…"` in the admin page, `title="…"` on a passkey row) could break out of the attribute. Only self-XSS in practice (the injected value was always the viewer's own or an admin's own input) but it's the kind of gap that becomes real the day a value from another user is rendered in an attribute. | Both `esc()` helpers (`public/account.js`, `public/ento-gdd.js`) now escape `"` and `'`; the new inline rename UI assigns the current name via `.value` rather than interpolating it at all. |
| 7 | Low | `@simplewebauthn/server` 14.0.0 → 14.0.1 (patch). `npm audit`: 0 vulnerabilities. | Updated. |

Also fixed earlier the same day, for context (v1.7.4): the Origin allowlist was applied to same-origin GETs (which carry no `Origin`), breaking session reads entirely; and the pre-v1.6.3 host-only session cookie was never cleared, so browsers sent two `ento_session` cookies and the server only read the first.

---

## Recommended — needs a product decision or dashboard work

### R1. Verify email addresses at sign-up  *(highest priority)*
An account's `label` is whatever email the visitor typed. It is never confirmed, and it is not unique — two accounts can carry the same address. The label is deliberately never used for authentication (only the passkey is), so this is **not** an account-takeover path. It *is* a problem for the recovery process: the admin portal identifies users by label, and a re-registration link is the one thing that can attach a new passkey to an existing account. An attacker who registers `victim@example.com` and then asks the admin for "my" recovery link gets a link to *their own* account, not the victim's — but the admin now has two accounts with the same email and has to tell them apart by user ID.

- **Do:** send a one-time verification link before an account becomes usable (needs an email sender — Cloudflare Email Workers, Resend, or Postmark), then add a `UNIQUE` index on `users.label`.
- **Until then:** write down the identity check the admin performs before issuing a re-registration link (reply from the address on file, or a shared secret), and have the admin portal flag duplicate labels in search results.

### R2. Session policy
Sessions are a fixed 30 days from login: no idle timeout, no rotation, not tied to the passkey that created them (removing a passkey doesn't end the sessions it opened), and the user has no "sign out everywhere". Suggested: 30-day absolute + 7-day idle, store `credential_id` on the session and revoke on passkey removal, list active sessions under Manage account with a revoke-all button.

### R3. Require user verification for sensitive actions
Registration and login use `userVerification: 'preferred'`, so a passkey on an authenticator that skipped biometrics/PIN is accepted as a single possession factor. Switch to `'required'` (all platform passkeys support it), and re-prompt for a fresh assertion before deleting a passkey or the account.

### R4. Content Security Policy — remove `'unsafe-inline'`
Every page relies on inline `<script>` blocks and the Tailwind Play CDN, so CSP allows `'unsafe-inline'` — which neutralises most of CSP's XSS protection. There *is* now a build step (esbuild), so this is tractable: build Tailwind to a static stylesheet (also removes a runtime dependency on `cdn.tailwindcss.com` and a ~300 KB script), move inline scripts into files, and for `templates/admin.html` (bundled into the Worker as a string) a hash-based CSP can be generated at build time. Do the admin page first — it's the highest-value target and the smallest change.

### R5. Re-registration link handling
The token is consumed when the *options* call is made, so a user who cancels the browser prompt burns the link and needs a new one. Consume it on successful *verify* instead. The token also travels in the URL (`/?reregister=…`), so it lands in browser history and Cloudflare request logs; the 15-minute single-use window keeps this low-risk, but a `POST`-based hand-off or a fragment (`#reregister=`) would keep it out of logs entirely.

### R6. Outside the repo — Cloudflare dashboard
Worth a 15-minute check: (a) the Access application for `/frost/admin` has SameSite=Strict and a policy that lists admin emails explicitly; (b) a WAF rate-limiting rule on `/api/account/*` (the code's KV-based limiter is best-effort and not atomic); (c) Bot Fight Mode; (d) **Logpush or Workers Logs** — there is currently no persistent server-side log, which is why diagnosing #38 required reproducing it in a browser; (e) the `GITHUB_TOKEN` secret is a fine-grained token scoped to *issues: write* on this one repo only.

### R7. Privacy
Bug reports include the user agent, timezone, language, and viewport — disclosed in the widget text, but consider trimming to the user agent alone. Offer self-service account deletion and a data export (the collection envelope is already JSON) under Manage account.

### R8. Cookie scope
The session cookie is `Domain=entotools.org`, so it's sent to every subdomain. Fine today (only apex + www exist); if another subdomain is ever deployed, either redirect www → apex and go back to a host-only cookie, or make sure that subdomain is trusted.

---

## What was checked and found sound

- **Injection:** all D1 access uses `prepare().bind()`; the only dynamic SQL is `LIKE ?` with a bound pattern. Drive queries escape values (`driveQ`). No `eval`/`Function`.
- **XSS:** every `innerHTML` in `account.js`, `admin.html`, `feedback.js` interpolates through `esc()`; user-typed values never reach `document.write`/`href` unescaped. Public GitHub issues neutralise Markdown/HTML and redact PII server-side (client redaction is treated as untrusted).
- **Authentication:** WebAuthn via `@simplewebauthn/server` with resident keys, `attestation: none`, RP ID pinned to `entotools.org`, origin allow-list, sign-counter enforcement, `excludeCredentials` on add-passkey, single-use challenges in KV with a 5-minute TTL. Session IDs are `crypto.randomUUID()` (122 bits). Cookie: `HttpOnly; Secure; SameSite=Lax`.
- **Authorization:** every self-service credential/collection query is scoped by the session's `user_id` in SQL, never by a client-supplied id. Admin routes verify the Access JWT (RS256, `exp`, `iss`, `aud`, `kid`, signature) and fail closed to 404; every mutating admin action writes an audit row.
- **Feature flags:** fail closed (any error → empty set); gated code isn't just hidden, it isn't loaded.
- **Headers:** HSTS, X-Frame-Options DENY, `frame-ancestors 'none'`, Referrer-Policy, Permissions-Policy, `object-src 'none'`, `base-uri 'self'`; SRI on the pinned jsDelivr script.
- **Secrets:** none tracked; `.dev.vars` ignored; KV/D1 IDs and the Google OAuth *client* ID are public by design.
- **Rate limiting:** per-IP (hashed, never stored in clear) on search, feedback, status, and passkey ceremony starts.
- **Error handling:** generic messages to clients; stacks only to the Worker console; admin path never leaks an error.

---

## Update — v1.9.0 / v1.10.0 (2026-09-05)

R2, R3, R4 and R7 above are now **implemented**, plus three further requirements raised during the work. Everything below was verified end-to-end in headless Chrome with virtual passkeys against the live site.

| Item | What shipped |
|---|---|
| **R2 Session policy** (v1.9.0, migration 0006) | 7-day idle timeout inside the 30-day lifetime (`last_seen_at`, refreshed at most hourly). Sessions record the passkey that opened them; removing a passkey revokes the sessions it created (except the one doing the removing). Manage account lists signed-in devices (passkey name, last active, "this device" — session ids are never sent to the client) with **Sign out everywhere else**. "Add a passkey" no longer replaces the current session. |
| **R3 User verification + step-up** (v1.9.0) | `userVerification: 'required'` for registration, login and re-auth, `requireUserVerification` on every verify. `POST /api/account/reauth/{options,verify}` issues a fresh assertion bound to the *current* session (challenge carries user + session id; a re-auth challenge can't be redeemed as a login and vice versa). **Every** passkey change (add, rename, remove) and account deletion requires its **own** assertion: the step-up mark is single-use (consumed atomically by the action, at most 2 minutes old) and logging in never sets it — there is no grace period and no reuse across actions (v1.10.1). |
| **R4 CSP without `'unsafe-inline'`** (v1.10.0) | Tailwind is compiled at build time (`tailwind.config.js` reads the palette from `theme.js`; 25 KB stylesheet replaces the ~300 KB Play-CDN script). All 108 inline `on*="…"` handlers were replaced by `data-action` / `data-change` / `data-input` delegation in `theme.js`. `scripts/gen-csp.js` hashes every page's inline `<script>` at build time and **fails the build** if any inline handler or `javascript:` URL remains; the Worker attaches a per-route policy (`src/lib/csp.js`) to every HTML response. `script-src` is now `'self'` + the page's hashes + three named hosts. `style-src` keeps `'unsafe-inline'` (inline CSS is not a script vector; removing it is not worth the refactor). |
| **R7 Privacy** (v1.9.0) | `GET /api/account/export` (JSON attachment: account, passkey names, flags, collection — no public keys or session ids). `DELETE /api/account` (re-auth gated). Startup diagnostics in bug reports trimmed to version/page/theme/user-agent. |
| **Unique emails** (v1.10.0, migration 0007) | Labels are lower-cased; `UNIQUE` index on `users.label`. Checked at sign-up start (409 with a clear message) and again at verify; the index makes a concurrent race impossible. *This closes the non-uniqueness half of R1; verification of address ownership is still open.* |
| **Sign-up limits** (v1.10.0) | Per IP, 2-hour window: **6 sign-up attempts** (each `register/options` for a new account) and **3 accounts created**, checked at options and at verify. A browser cookie counting created accounts (3) is a soft second layer. IP is the primary control because it is the only identity an anonymous visitor can't change for free; the general passkey-ceremony limit (20/hour/IP) still applies on top. |
| **Session hygiene** | Expired sessions purged on login; re-auth window 5 min; `ento_su` sign-up cookie expires with its window. |

### SQL injection review (sign-up and login paths)

Every D1 statement in the codebase is a **string literal** passed to `prepare()` with runtime values supplied exclusively through `bind()`. There is no template literal or string concatenation of a runtime value into SQL anywhere (`grep -rn 'prepare(\`\|prepare(.*\${' src/` → none; the only `+` inside `prepare()` joins two literal fragments). Specifically on the paths asked about:

| Step | Statement | Runtime values (all bound) |
|---|---|---|
| Sign-up: uniqueness | `SELECT … FROM users WHERE label = ?` | email, after `EMAIL_RE` (no whitespace, exactly one `@`), lower-cased, ≤ 200 chars |
| Sign-up: create | `INSERT INTO users (id, label, created_at) VALUES (?, ?, ?)` | server-generated UUID, email, timestamp |
| Sign-up: passkey | `INSERT INTO credentials (credential_id, user_id, public_key, sign_count, device_label, created_at) VALUES (?, ?, ?, ?, ?, ?)` | credential id (base64url from the authenticator, after signature verification), UUID, COSE key bytes, counter |
| Login: lookup | `SELECT * FROM credentials WHERE credential_id = ?` | credential id from the assertion (only used after the challenge is found in KV) |
| Login: counter | `UPDATE credentials SET sign_count = ?, last_used_at = ? WHERE credential_id = ?` | integer from the verified assertion |
| Session | `INSERT INTO sessions (…) VALUES (?, ?, ?, ?, ?, ?, ?)` / `SELECT * FROM sessions WHERE id = ?` | UUIDs and timestamps; the cookie value is bound, never interpolated |
| Admin search | `… WHERE label LIKE ? OR id LIKE ?` | the pattern `%q%` is a bound parameter; `%`/`_` in `q` only widen the match |

Login abuse beyond injection: login is username-less (discoverable credentials), so there is nothing to enumerate; a `login/verify` needs a challenge that exists in KV (single-use, 5-minute TTL) and a signature over it by a registered key; the sign counter rejects cloned authenticators; ceremony starts are rate-limited per IP.

### Still open

- **R1 — verify that the sign-up email is actually the visitor's.** Uniqueness is now enforced, but ownership is not. Needs an email sender (Cloudflare Email Workers / Resend / Postmark) and a one-time link before the account becomes usable. Until then, the admin procedure for issuing re-registration links should include an out-of-band identity check.
- **R5** — consume the re-registration token on verify rather than options; move it out of the URL.
- **R6** — dashboard items (Access SameSite, WAF rate limit, Workers Logs, `GITHUB_TOKEN` scope).

*Last updated with v1.10.0. Re-run this assessment when email verification (R1) lands or when a new data-bearing endpoint is added.*
