export interface FundFlowNode {
  account_id: number;
  account_name: string;
  ledger_id: number;
  ledger_name: string;
  currency_symbol: string;
  account_type: string;
  account_subtype: string;
  total_outflow: number;
  total_inflow: number;
  total_volume: number;
}

export interface FundFlowLink {
  source_account_id: number;
  source_account_name: string;
  source_ledger_name: string;
  target_account_id: number;
  target_account_name: string;
  target_ledger_name: string;
  total_amount: number;
  transfer_count: number;
  is_cross_ledger: boolean;
  target_amount?: number;
  source_currency: string;
  target_currency: string;
}

export interface FundFlowSummary {
  total_transfer_volume: number;
  total_transfer_count: number;
  cross_ledger_count: number;
  unique_corridors: number;
  most_active_corridor_source?: string;
  most_active_corridor_target?: string;
  most_active_corridor_amount?: number;
}

export interface FundFlowData {
  nodes: FundFlowNode[];
  links: FundFlowLink[];
  summary: FundFlowSummary;
  period_type: string;
}
