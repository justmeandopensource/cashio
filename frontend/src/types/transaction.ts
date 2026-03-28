import type { TagItem } from "./tag";

export interface Transaction {
  transaction_id: string;
  date: string;
  category_id?: string;
  category_name: string;
  account_id?: string;
  account_name?: string;
  is_split: boolean;
  is_transfer: boolean;
  is_cross_ledger_transfer?: boolean;
  is_asset_transaction?: boolean;
  is_mf_transaction?: boolean;
  notes?: string;
  store?: string;
  location?: string;
  credit: number;
  debit: number;
  transfer_id?: string;
  transfer_type?: string;
  tags?: TagItem[];
  splits?: SplitTransaction[];
  filter_matched_split?: FilterMatchedSplit;
}

export interface TransactionCreate {
  debit: number;
  credit: number;
  category_id?: string;
  notes?: string;
  store?: string;
  location?: string;
  account_id?: string;
  is_split: boolean;
  splits?: Split[];
  tags?: { name: string }[];
}

export interface Split {
  amount: string;
  categoryId: string;
  notes?: string;
}

export interface ApiSplit {
  debit: number;
  credit: number;
  category_id: string;
  notes?: string;
}

export interface SplitTransaction {
  split_id: string;
  category_id?: string;
  category_name: string | null;
  debit: number;
  credit?: number;
  notes?: string;
}

export interface FilterMatchedSplit {
  split_id: string;
  category_id: string;
  category_name: string;
  debit: number;
  credit: number;
  notes?: string;
}

export interface TransferDetails {
  destination_account_name?: string;
  source_account_name?: string;
  destination_ledger_name?: string;
  source_ledger_name?: string;
}

export interface TransferEditData {
  transfer_id: string;
  source_transaction: Transaction;
  destination_transaction: Transaction;
  source_account_name: string;
  destination_account_name: string;
  source_ledger_id: number;
  destination_ledger_id: number;
  source_ledger_name: string;
  destination_ledger_name: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total_transactions: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  total_credit: number;
  total_debit: number;
  net_amount: number;
}

export interface Filters {
  account_id?: string;
  category_id?: string;
  tags?: { name: string }[];
  tags_match?: "any" | "all";
  search_text?: string;
  store?: string;
  location?: string;
  transaction_type?: "" | "income" | "expense" | "transfer";
  from_date?: Date | null;
  to_date?: Date | null;
  [key: string]: unknown;
}

export interface Pagination {
  total_pages: number;
  current_page: number;
}

export interface InitialTransactionState {
  date: Date;
  type: "expense" | "income";
  categoryId: string;
  notes: string;
  store: string;
  location: string;
  amount: string;
  isSplit: boolean;
  splits: Split[];
  tags: { name: string }[];
}
