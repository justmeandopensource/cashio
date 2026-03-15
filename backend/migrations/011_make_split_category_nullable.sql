-- Migration: Make category_id nullable in transaction_splits
-- Description: Allows transfer fee splits to exist without a category on the transfer portion
-- Date: 2026-03-15
-- Risk: LOW

ALTER TABLE transaction_splits
  ALTER COLUMN category_id DROP NOT NULL;

COMMENT ON COLUMN transaction_splits.category_id IS 'Category for this split; NULL for the transfer portion of a transfer-with-fee';
