-- Pre-seeds the flag key referenced directly in code
-- (templates/collection_database.html, templates/label_data.html check
-- EntoFlags.has('gdrive-sync')) so it's assignable from the admin portal
-- without needing to type an exact-match key by hand.
INSERT INTO feature_flags (flag_key, description, created_at)
VALUES ('gdrive-sync', 'Google Drive backup/sync for the Sample Collection and Collection Database pages', datetime('now'))
ON CONFLICT(flag_key) DO NOTHING;
