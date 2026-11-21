-- Removes the gdrive-sync flag. The Google Drive backup module was removed
-- from the site and nothing checks this flag any more.
-- Assignments first: D1 doesn't enforce the foreign key.
DELETE FROM user_feature_flags WHERE flag_key = 'gdrive-sync';
DELETE FROM feature_flags WHERE flag_key = 'gdrive-sync';
