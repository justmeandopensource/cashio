export type AccountType = "asset" | "liability";

export interface Account {
  account_id: string;
  ledger_id?: string;
  name: string;
  type: AccountType | string;
  subtype?: string;
  owner?: string;
  opening_balance?: number;
  balance?: number;
  net_balance?: number;
  description?: string;
  notes?: string;
  last_transaction_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccountCreate {
  name: string;
  type: string;
  subtype: string;
  owner?: string;
  opening_balance?: number;
  description?: string;
  notes?: string;
}

export interface AccountUpdate {
  name?: string;
  subtype?: string;
  owner?: string;
  opening_balance?: number;
  description?: string;
  notes?: string;
}
