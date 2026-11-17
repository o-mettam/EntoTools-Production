-- Security assessment 2026-11, #3: single-use secrets move from KV to D1.
-- KV is eventually consistent (a delete can take ~60 s to be seen
-- everywhere), so "read, then delete" let the same passkey challenge or
-- re-registration link be redeemed twice in that window. D1 consumes each
-- row with one DELETE … RETURNING statement, so only one request can ever
-- get it back.
--
-- Apply BEFORE deploying the code that uses these tables:
--   wrangler d1 execute entotools-accounts --remote --file=migrations/0011_single_use_tokens.sql

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  challenge TEXT PRIMARY KEY,   -- base64url challenge issued in *_options
  context TEXT NOT NULL,        -- '1' for a login, JSON for registration / re-auth
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);

CREATE TABLE IF NOT EXISTS reregister_tokens (
  token TEXT PRIMARY KEY,       -- random UUID, sent to the user as /#reregister=<token>
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reregister_tokens_expires_at ON reregister_tokens(expires_at);
