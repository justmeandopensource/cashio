-- Migration: Add default_ledger_id to users table
-- Date: 2026-04-03

ALTER TABLE users
ADD COLUMN default_ledger_id INTEGER REFERENCES ledgers(ledger_id) ON DELETE SET NULL;

-- Auto-set default ledger for users who have exactly one ledger
UPDATE users u
SET default_ledger_id = (
    SELECT l.ledger_id FROM ledgers l WHERE l.user_id = u.user_id
)
WHERE (SELECT COUNT(*) FROM ledgers l WHERE l.user_id = u.user_id) = 1;
