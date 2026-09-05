-- Security assessment 2026-09, R2 + R3: idle timeout, passkey-bound sessions,
-- and step-up re-authentication.
--   last_seen_at   — refreshed at most hourly while the session is used; a
--                    session idle for 7 days is rejected even inside its
--                    30-day absolute lifetime.
--   credential_id  — the passkey that opened the session, so removing that
--                    passkey revokes the sessions it created.
--   reauth_at      — last fresh passkey assertion on this session; sensitive
--                    actions (remove passkey, add passkey, delete account)
--                    require one within the last 5 minutes. Set at login.
-- Additive only: code that predates this migration keeps working.
ALTER TABLE sessions ADD COLUMN last_seen_at TEXT;
ALTER TABLE sessions ADD COLUMN credential_id TEXT;
ALTER TABLE sessions ADD COLUMN reauth_at TEXT;
CREATE INDEX IF NOT EXISTS idx_sessions_credential_id ON sessions(credential_id);
