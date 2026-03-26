import type { MutualFund } from "../../../types";

export interface BuySellMfModalProps {
  isOpen: boolean;
  onClose: () => void;
  fund?: MutualFund;
  onSuccess: () => void;
}

export interface FormData {
  mutual_fund_id: string;
  units: string;
  amount_excluding_charges: string;
  other_charges: string;
  expense_category_id: string;
  account_id: string;
  transaction_date: Date;
  notes: string;
}
