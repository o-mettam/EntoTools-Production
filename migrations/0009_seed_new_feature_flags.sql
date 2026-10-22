-- Flags for the features shipped behind toggles in v1.12.0. All start as
-- 'targeted' (assigned users only); see docs/feature-flags.md.
INSERT INTO feature_flags (flag_key, description, created_at) VALUES
  ('collection-map', 'Map of saved collection records on the Collection Database page', datetime('now')),
  ('season-normals', 'Season vs. 30-year normal and previous-year GDD comparison on the Degree Day Calculator', datetime('now')),
  ('share-links', 'Copy a link that reopens the current Degree Day Calculator search', datetime('now'))
ON CONFLICT(flag_key) DO NOTHING;
