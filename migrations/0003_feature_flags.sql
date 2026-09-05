-- Issue #37: per-user feature toggles for alpha/beta testing.

CREATE TABLE IF NOT EXISTS feature_flags (
  flag_key TEXT PRIMARY KEY,      -- e.g. "new-chart-ui"
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_feature_flags (
  user_id TEXT NOT NULL REFERENCES users(id),
  flag_key TEXT NOT NULL REFERENCES feature_flags(flag_key),
  enabled_at TEXT NOT NULL,
  PRIMARY KEY (user_id, flag_key)
);
