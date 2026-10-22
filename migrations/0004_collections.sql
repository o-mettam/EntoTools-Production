-- Issue #35 phase 3: account-backed collection sync. Mirrors the envelope
-- shape already used by the Google Drive sync provider (public/sync/sync-core.js)
-- so the existing client-side merge logic (mergeEnvelopes) works unchanged —
-- the server only stores/retrieves the blob, exactly like Drive does.

CREATE TABLE IF NOT EXISTS collections (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  envelope TEXT NOT NULL,
  revision INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
