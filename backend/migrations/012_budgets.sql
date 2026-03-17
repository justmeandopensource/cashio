-- Migration: Add budgets table
-- Date: 2026-03-17 | Risk: LOW
CREATE TYPE budget_period AS ENUM ('monthly', 'yearly');

CREATE TABLE budgets (
    budget_id   SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    ledger_id   INTEGER NOT NULL REFERENCES ledgers(ledger_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    period      budget_period NOT NULL,
    amount      NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_budget_user_ledger_category_period
        UNIQUE (user_id, ledger_id, category_id, period)
);
CREATE INDEX idx_budgets_user_id     ON budgets(user_id);
CREATE INDEX idx_budgets_ledger_id   ON budgets(ledger_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
