-- Drop the api_key column from ledgers (Alpha Vantage no longer used; replaced by Yahoo Finance)
ALTER TABLE ledgers DROP COLUMN IF EXISTS api_key;

-- Drop price_in_pence from mutual_funds (Yahoo Finance auto-detects GBp vs GBP)
ALTER TABLE mutual_funds DROP COLUMN IF EXISTS price_in_pence;
