import api from "@/lib/api";
import type { Account } from "@/types";

/** Account with all fields populated (as returned from the detail endpoint) */
export interface AccountData extends Account {
  ledger_id: string;
  type: "asset" | "liability";
  subtype: string;
  net_balance: number;
  opening_balance: number;
  balance: number;
}

export interface AccountSummaryData {
  total_credit: number;
  total_debit: number;
  transaction_count: number;
  first_transaction_date: string | null;
  last_transaction_date: string | null;
}

export interface TrendItem {
  period: string;
  income: number;
  expense: number;
}

export interface CategoryItem {
  name: string;
  amount: number;
  percentage: number;
}

export interface AccountInsightsData {
  trend_data: TrendItem[];
  top_categories: CategoryItem[];
  summary: {
    total_income: number;
    total_expense: number;
    avg_income: number;
    avg_expense: number;
  };
}

export const getAccount = async (
  ledgerId: string | number,
  accountId: string | number
): Promise<AccountData> => {
  const response = await api.get(`/ledger/${ledgerId}/account/${accountId}`);
  return response.data;
};

export const getAccountSummary = async (
  ledgerId: string | number,
  accountId: string | number
): Promise<AccountSummaryData> => {
  const response = await api.get(
    `/ledger/${ledgerId}/account/${accountId}/summary`
  );
  return response.data;
};

export const getAccountInsights = async (
  ledgerId: string | number,
  accountId: string | number
): Promise<AccountInsightsData> => {
  const response = await api.get(
    `/ledger/${ledgerId}/account/${accountId}/insights`
  );
  return response.data;
};
