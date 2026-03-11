// AMC Types
export interface Amc {
  amc_id: number;
  name: string;
  notes?: string;
  ledger_id: number;
  created_at: string;
  updated_at: string;
}

export interface AmcCreate {
  name: string;
  notes?: string;
}

export interface AmcUpdate {
  name?: string;
  notes?: string;
}

// Mutual Fund Types
export interface MutualFund {
  mutual_fund_id: number;
  name: string;
  plan?: string;
  code?: string;
  owner?: string;
  asset_class?: string;
  asset_sub_class?: string;
  amc_id: number;
  ledger_id: number;
  total_units: number | string;
  average_cost_per_unit: number | string;
  latest_nav: number | string;
  last_nav_update?: string;
  current_value: number | string;
  notes?: string;
  created_at: string;
  updated_at: string;
  total_realized_gain: number | string;
  total_invested_cash: number | string;
  xirr_percentage?: number;
  amc?: Amc;
}

export interface MutualFundCreate {
  name: string;
  plan?: string;
  code?: string;
  owner?: string;
  asset_class?: string;
  asset_sub_class?: string;
  amc_id: number;
  notes?: string;
}

export interface MutualFundUpdate {
  name?: string;
  plan?: string;
  code?: string;
  owner?: string;
  asset_class?: string;
  asset_sub_class?: string;
  amc_id?: number;
  notes?: string;
}

export interface MutualFundNavUpdate {
  latest_nav: number;
}

// MF Transaction Types
export interface MfTransaction {
  mf_transaction_id: number;
  mutual_fund_id: number;
  transaction_type: 'buy' | 'sell' | 'switch_out' | 'switch_in';
  units: number | string;
  nav_per_unit: number | string;
  total_amount: number | string;
  amount_excluding_charges: number | string;
  other_charges: number | string;
  account_id?: number;
  target_fund_id?: number;
  transaction_date: string;
  notes?: string;
  ledger_id: number;
  created_at: string;
  linked_transaction_id?: number;
  linked_charge_transaction_id?: number;
  realized_gain?: number | string;
  cost_basis_of_units_sold?: number | string;
  mutual_fund?: MutualFund;
  account_name?: string;
  target_fund_name?: string;
}

export interface MfTransactionCreate {
  mutual_fund_id: number;
  transaction_type: 'buy' | 'sell' | 'switch_out' | 'switch_in';
  units: number;
  nav_per_unit?: number; // For switches, buy/sell use amount_excluding_charges
  amount_excluding_charges: number; // For buy/sell transactions
  other_charges?: number;
  expense_category_id?: number;
  account_id?: number;
  target_fund_id?: number;
  transaction_date: string;
  notes?: string;
  to_nav?: number;
  linked_transaction_id?: number;
  realized_gain?: number;
  cost_basis_of_units_sold?: number;
}

export interface MfTransactionUpdate {
  notes?: string;
}

// Switch Types
export interface MfSwitchCreate {
  source_mutual_fund_id: number;
  target_mutual_fund_id: number;
  source_units: number;
  source_amount: number;
  target_units: number;
  target_amount: number;
  transaction_date: Date;
  notes?: string;
}

// Summary and Analytics Types
export interface MutualFundSummary {
  mutual_fund_id: number;
  name: string;
  plan?: string;
  code?: string;
  owner?: string;
  amc_name: string;
  total_units: number | string;
  average_cost_per_unit: number | string;
  latest_nav: number | string;
  current_value: number | string;
  total_invested: number | string;
  total_realized_gain: number | string;
  unrealized_pnl: number | string;
  unrealized_pnl_percentage: number | string;
}

export interface AmcSummary {
  amc_id: number;
  name: string;
  total_funds: number;
  total_units: number | string;
  average_cost_per_unit: number | string;
  latest_nav: number | string;
  current_value: number | string;
  total_invested: number | string;
  total_realized_gain: number | string;
  unrealized_pnl: number | string;
  unrealized_pnl_percentage: number | string;
}

// Bulk NAV Types
export interface NavFetchResult {
  scheme_code: string;
  fund_name?: string;
  nav_value?: number;
  nav_date?: string;
  success: boolean;
  error_message?: string;
}

export interface BulkNavFetchRequest {
  scheme_codes: string[];
}

export interface BulkNavFetchResponse {
  results: NavFetchResult[];
  total_requested: number;
  total_successful: number;
  total_failed: number;
}

export interface BulkNavUpdateRequest {
  updates: Array<{
    mutual_fund_id: number;
    latest_nav: number;
    nav_date: string;
  }>;
}

export interface BulkNavUpdateResponse {
  updated_funds: number[];
  total_updated: number;
}

export interface YearlyInvestment {
  year: number;
  month?: number;
  total_invested: number;
}

// Form Types
export interface BuySellFormData {
  mutual_fund_id: number;
  units: number;
  amount_excluding_charges: number;
  other_charges?: number;
  expense_category_id?: number;
  account_id: number;
  transaction_date: string;
  notes?: string;
}