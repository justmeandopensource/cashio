-- Migration 017: Add account subtypes and owner, remove group hierarchy
-- Date: 2026-03-24

-- Step 1: Create the account_subtype enum type
CREATE TYPE account_subtype AS ENUM (
    'current_account', 'savings_account', 'isa', 'fixed_deposit', 'recurring_deposit',
    'pension', 'gift_card', 'cash', 'fixed_asset', 'depreciating_asset',
    'investment', 'insurance', 'savings_scheme', 'chit_fund',
    'credit_card', 'loan', 'other'
);

-- Step 2: Add subtype column (nullable initially) and owner column
ALTER TABLE accounts ADD COLUMN subtype account_subtype;
ALTER TABLE accounts ADD COLUMN owner VARCHAR(100);

-- Step 3: Populate subtypes for non-group accounts based on their IMMEDIATE parent group name
UPDATE accounts a
SET subtype = CASE
    WHEN pg.name ILIKE '%current account%' THEN 'current_account'::account_subtype
    WHEN pg.name ILIKE '%savings account%' THEN 'savings_account'::account_subtype
    WHEN pg.name ILIKE 'ISA' THEN 'isa'::account_subtype
    WHEN pg.name ILIKE '%gift card%' THEN 'gift_card'::account_subtype
    WHEN pg.name ILIKE '%pension%' THEN 'pension'::account_subtype
    WHEN pg.name ILIKE '%fixed asset%' THEN 'fixed_asset'::account_subtype
    WHEN pg.name ILIKE '%depreciat%' THEN 'depreciating_asset'::account_subtype
    WHEN pg.name ILIKE '%credit card%' THEN 'credit_card'::account_subtype
    WHEN pg.name ILIKE '%loan%' OR pg.name ILIKE '%mortgage%' THEN 'loan'::account_subtype
    WHEN pg.name ILIKE '%savings scheme%' THEN 'savings_scheme'::account_subtype
    WHEN pg.name ILIKE '%chit%' THEN 'chit_fund'::account_subtype
    WHEN pg.name ILIKE '%other%' THEN 'other'::account_subtype
    ELSE 'other'::account_subtype
END
FROM accounts pg
WHERE a.parent_account_id = pg.account_id
  AND a.is_group = false
  AND pg.is_group = true;

-- Step 4: Handle specific accounts by name (special cases)
UPDATE accounts SET subtype = 'insurance'::account_subtype WHERE name = 'LIC Bima' AND is_group = false;
UPDATE accounts SET subtype = 'investment'::account_subtype WHERE name = 'Sovereign Gold Bond' AND is_group = false;
UPDATE accounts SET subtype = 'savings_scheme'::account_subtype WHERE name = 'Sukanya Samridhi' AND is_group = false;

-- Step 5: Handle standalone accounts (no parent, not a group)
UPDATE accounts
SET subtype = CASE
    WHEN name ILIKE '%wallet%' THEN 'cash'::account_subtype
    ELSE 'other'::account_subtype
END
WHERE parent_account_id IS NULL
  AND is_group = false
  AND subtype IS NULL;

-- Step 6: Set group accounts to 'other' temporarily (needed before we can make column NOT NULL)
UPDATE accounts SET subtype = 'other'::account_subtype WHERE is_group = true;

-- Step 7: Catch any remaining NULL subtypes
UPDATE accounts SET subtype = 'other'::account_subtype WHERE subtype IS NULL;

-- Step 8: Nullify parent_account_id for all accounts (before dropping the constraint)
UPDATE accounts SET parent_account_id = NULL;

-- Step 9: Delete all group accounts (no transactions reference them)
DELETE FROM accounts WHERE is_group = true;

-- Step 10: Make subtype NOT NULL with default
ALTER TABLE accounts ALTER COLUMN subtype SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN subtype SET DEFAULT 'other'::account_subtype;

-- Step 11: Drop old columns and constraints
ALTER TABLE accounts DROP CONSTRAINT accounts_parent_account_id_fkey;
ALTER TABLE accounts DROP COLUMN parent_account_id;
ALTER TABLE accounts DROP COLUMN is_group;

-- Step 12: Add indexes for subtype queries
CREATE INDEX idx_accounts_ledger_subtype ON accounts(ledger_id, subtype);
