-- Feature flag lifecycle: a flag is either assigned per user (the #37
-- behaviour), on for everyone including signed-out visitors, or off for
-- everyone. See docs/feature-flags.md for the rollout workflow.
--   targeted — only users in user_feature_flags (default; existing flags)
--   ga       — everyone, signed in or not
--   off      — nobody, even assigned users (kill switch)
-- Assignments are kept across status changes so a rollback from ga/off to
-- targeted restores the original tester list.

ALTER TABLE feature_flags ADD COLUMN status TEXT NOT NULL DEFAULT 'targeted'
  CHECK (status IN ('targeted', 'ga', 'off'));
ALTER TABLE feature_flags ADD COLUMN status_changed_at TEXT;
