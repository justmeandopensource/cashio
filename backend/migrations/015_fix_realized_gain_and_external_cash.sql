-- Fix realized_gain on sell transactions where charges were double-counted.
-- Previously: realized_gain = (amount_excluding_charges - other_charges) - cost_basis_of_units_sold
-- Correct:   realized_gain = amount_excluding_charges - cost_basis_of_units_sold
-- Delta to add back = other_charges (for each affected sell transaction)

-- Step 1: Fix individual mf_transaction realized_gain values
UPDATE mf_transactions
SET realized_gain = amount_excluding_charges - cost_basis_of_units_sold
WHERE transaction_type = 'sell'
  AND other_charges > 0
  AND cost_basis_of_units_sold IS NOT NULL;

-- Step 2: Recalculate total_realized_gain on each fund from its transactions
UPDATE mutual_funds mf
SET total_realized_gain = COALESCE(
    (SELECT SUM(t.realized_gain)
     FROM mf_transactions t
     WHERE t.mutual_fund_id = mf.mutual_fund_id
       AND t.realized_gain IS NOT NULL
       AND t.transaction_type IN ('sell', 'switch_out')),
    0
);

-- Step 3: Fix negative external_cash_invested (from switch-in then sell scenario)
UPDATE mutual_funds
SET external_cash_invested = 0
WHERE external_cash_invested < 0;
