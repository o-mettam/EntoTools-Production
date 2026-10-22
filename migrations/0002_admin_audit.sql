-- Issue #36: audit trail for admin actions (passkey/session resets, re-registration
-- tokens). No "admins" table — who is an admin is a Cloudflare Access policy,
-- not application data (see issue #36 for why).

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_identity TEXT NOT NULL,   -- email claim from the verified Access JWT
  action TEXT NOT NULL,           -- e.g. "reset_credentials", "revoke_sessions"
  target_user_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
