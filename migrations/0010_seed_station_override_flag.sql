-- Manual NCEI station choice on the Degree Day Calculator (issue #40).
-- Starts 'targeted' (assigned users only); see docs/feature-flags.md.
INSERT INTO feature_flags (flag_key, description, created_at)
VALUES ('station-override', 'Choose a specific or alternate nearby NCEI station on the Degree Day Calculator', datetime('now'))
ON CONFLICT(flag_key) DO NOTHING;
