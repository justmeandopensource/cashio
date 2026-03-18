-- Upgrade NAV columns from 2 to 4 decimal places to match AMFI precision
-- Safe widening operation: existing 2-decimal values are preserved
ALTER TABLE mutual_funds ALTER COLUMN latest_nav TYPE numeric(15,4);
ALTER TABLE mf_transactions ALTER COLUMN nav_per_unit TYPE numeric(15,4);
