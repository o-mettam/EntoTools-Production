# Entotools.com

Please visit [entotools.com/documentation](https://entotools.com/documentation/) for the documentation on this website.

**This is a port from a Fork Version of this Project by the same authors.**

## Account system setup (#35, #36, #37)

The code for passkey accounts, the hidden admin portal, and per-user feature
flags is implemented, but four things can only be done from a machine with
Node/wrangler installed and Cloudflare account access — none of this can be
scripted from inside the repo. **The site keeps working exactly as it does
today until all of these are done** — `public/_worker.js` isn't rebuilt with
the new routes until step 1 runs.

1. **Install dependencies and bundle the Worker.**
   ```
   npm install
   npm run build-public
   ```
   `src/index.js` now imports `@simplewebauthn/server`, so it's bundled with
   esbuild (`npm run build-worker`, called by `build-public.sh`) instead of
   being copied verbatim like the rest of `public/`.

2. **Create the D1 database and apply the schema.**
   ```
   wrangler d1 create entotools-accounts
   ```
   Paste the `database_id` it prints into `wrangler.toml` in place of
   `REPLACE_AFTER_D1_CREATE`, then run each migration (add `--remote` once
   you've checked it against a local copy):
   ```
   wrangler d1 execute entotools-accounts --file=migrations/0001_accounts.sql
   wrangler d1 execute entotools-accounts --file=migrations/0002_admin_audit.sql
   wrangler d1 execute entotools-accounts --file=migrations/0003_feature_flags.sql
   ```

3. **Create a Cloudflare Access application for the admin portal (#36).**
   In the Cloudflare Zero Trust dashboard: Access → Applications → Add an
   application, path `entotools.com/frost/admin*`, with a policy scoped to
   your own email only. Free for up to 50 users.

4. **Set two Pages environment variables** (dashboard → this Pages project →
   Settings → Environment variables), from the Access application you just
   created:
   ```
   CF_ACCESS_TEAM_DOMAIN   e.g. yourteam.cloudflareaccess.com
   CF_ACCESS_AUD           the application's "Audience" (AUD) tag
   ```
   Without these, `/frost/admin/*` fails closed (returns 404 to everyone,
   including you) rather than failing open — see `src/lib/access.js`.

None of #35's frontend (sign-up/login UI), #36's admin UI, or #37's flag
management UI exist yet — this is backend-only, matching the phasing agreed
in each issue. All three are exercised directly (curl/Postman) until a
frontend phase is picked up.
