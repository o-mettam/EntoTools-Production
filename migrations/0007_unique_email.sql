-- Emails are unique, case-insensitively. Labels are normalised to lower-case
-- (the sign-up handler does the same before every lookup/insert) and a
-- UNIQUE index enforces it at the database, so even two concurrent sign-ups
-- for the same address can only ever create one account — the second INSERT
-- fails and the handler turns that into a 409.
UPDATE users SET label = lower(trim(label));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_label_unique ON users(label);
