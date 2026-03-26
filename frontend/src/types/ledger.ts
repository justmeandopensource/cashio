export interface Ledger {
  ledger_id: string;
  name: string;
  currency_symbol: string;
  description?: string;
  notes?: string;
  nav_service_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LedgerCreate {
  name: string;
  currency_symbol: string;
  description?: string;
}

export interface LedgerUpdate {
  name?: string;
  currency_symbol?: string;
  description?: string;
}
