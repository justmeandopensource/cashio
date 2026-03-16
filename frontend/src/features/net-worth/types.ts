export interface AccountNetWorthItem {
  account_id: number;
  name: string;
  type: string;
  net_balance: number | string;
}

export interface MutualFundNetWorthItem {
  mutual_fund_id: number;
  name: string;
  current_value: number | string;
  total_invested_cash: number | string;
  unrealized_gain: number | string;
}

export interface PhysicalAssetNetWorthItem {
  physical_asset_id: number;
  name: string;
  asset_type_name: string;
  current_value: number | string;
}

export interface AssetAllocationItem {
  label: string;
  value: number | string;
  percentage: number;
}

export interface NetWorthResponse {
  net_worth: number | string;
  total_assets: number | string;
  total_liabilities: number | string;
  accounts_assets_total: number | string;
  accounts_liabilities_total: number | string;
  mutual_funds_total: number | string;
  physical_assets_total: number | string;
  mutual_funds_total_invested: number | string;
  mutual_funds_unrealized_gain: number | string;
  asset_accounts: AccountNetWorthItem[];
  liability_accounts: AccountNetWorthItem[];
  mutual_funds: MutualFundNetWorthItem[];
  physical_assets: PhysicalAssetNetWorthItem[];
  asset_allocation: AssetAllocationItem[];
}
