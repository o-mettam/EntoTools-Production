-- Issue #35 phase 1: account storage (users + WebAuthn credentials + sessions).
-- Apply with: wrangler d1 execute entotools-accounts --file=migrations/0001_accounts.sql
-- (add --remote once the local copy has been checked)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,          -- uuid, generated at registration
  label TEXT NOT NULL,          -- email or display name — for the user to recognize
                                 -- their own account; never used to look up a
                                 -- credential, so it is not a login secret
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
  credential_id TEXT PRIMARY KEY,   -- base64url credential ID from the authenticator
  user_id TEXT NOT NULL REFERENCES users(id),
  public_key BLOB NOT NULL,         -- COSE public key — never a secret, safe at rest
  sign_count INTEGER NOT NULL DEFAULT 0,
  device_label TEXT,                -- e.g. "iPhone", user-editable later
  created_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,          -- the session cookie value — random, unguessable
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
