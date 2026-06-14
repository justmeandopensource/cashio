import { useQuery } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import api from "@/lib/api";
import {
  Amc,
  AmcCreate,
  AmcUpdate,
  MutualFund,
  MutualFundCreate,
  MutualFundUpdate,
  MutualFundNavUpdate,
  MfTransaction,
  MfTransactionCreate,
  MfTransactionUpdate,
  MfSwitchCreate,
  MutualFundSummary,
  AmcSummary,
  BulkNavFetchRequest,
  BulkNavFetchResponse,
  BulkNavUpdateRequest,
  BulkNavUpdateResponse,
  YearlyInvestment,
} from "./types";

// AMC API functions
export const getAmcs = async (ledgerId: number): Promise<Amc[]> => {
  const response = await api.get(`/ledger/${ledgerId}/amcs`);
  return response.data;
};

export const createAmc = async (ledgerId: number, amc: AmcCreate): Promise<Amc> => {
  const response = await api.post(`/ledger/${ledgerId}/amc/create`, amc);
  return response.data;
};

export const updateAmc = async (ledgerId: number, amcId: number, amc: AmcUpdate): Promise<Amc> => {
  const response = await api.put(`/ledger/${ledgerId}/amc/${amcId}`, amc);
  return response.data;
};

export const deleteAmc = async (ledgerId: number, amcId: number): Promise<void> => {
  await api.delete(`/ledger/${ledgerId}/amc/${amcId}`);
};

// Mutual Fund API functions
export const getMutualFunds = async (ledgerId: number): Promise<MutualFund[]> => {
  const response = await api.get(`/ledger/${ledgerId}/mutual-funds`);
  return response.data;
};

export const getMutualFund = async (ledgerId: number, fundId: number): Promise<MutualFund> => {
  const response = await api.get(`/ledger/${ledgerId}/mutual-fund/${fundId}`);
  return response.data;
};

export const createMutualFund = async (ledgerId: number, fund: MutualFundCreate): Promise<MutualFund> => {
  const response = await api.post(`/ledger/${ledgerId}/mutual-fund/create`, fund);
  return response.data;
};

export const updateMutualFund = async (ledgerId: number, fundId: number, fund: MutualFundUpdate): Promise<MutualFund> => {
  const response = await api.put(`/ledger/${ledgerId}/mutual-fund/${fundId}`, fund);
  return response.data;
};

export const updateMutualFundNav = async (ledgerId: number, fundId: number, navUpdate: MutualFundNavUpdate): Promise<MutualFund> => {
  const response = await api.put(`/ledger/${ledgerId}/mutual-fund/${fundId}/update-nav`, navUpdate);
  return response.data;
};

export const deleteMutualFund = async (ledgerId: number, fundId: number): Promise<void> => {
  await api.delete(`/ledger/${ledgerId}/mutual-fund/${fundId}`);
};

// MF Transaction API functions
export const buyMutualFund = async (ledgerId: number, transaction: MfTransactionCreate): Promise<MfTransaction> => {
  const response = await api.post(`/ledger/${ledgerId}/mf-transaction/buy`, transaction);
  return response.data;
};

export const sellMutualFund = async (ledgerId: number, transaction: MfTransactionCreate): Promise<MfTransaction> => {
  const response = await api.post(`/ledger/${ledgerId}/mf-transaction/sell`, transaction);
  return response.data;
};

export const switchMutualFundUnits = async (ledgerId: number, switchData: MfSwitchCreate): Promise<MfTransaction[]> => {
  const response = await api.post(`/ledger/${ledgerId}/mf-transaction/switch`, switchData);
  return response.data;
};



export const getFundTransactions = async (ledgerId: number, fundId: number): Promise<MfTransaction[]> => {
  const response = await api.get(`/ledger/${ledgerId}/mutual-fund/${fundId}/transactions`);
  return response.data;
};

export const getAllMfTransactions = async (ledgerId: number): Promise<MfTransaction[]> => {
  const response = await api.get(`/ledger/${ledgerId}/mf-transactions`);
  return response.data;
};

export const updateMfTransaction = async (ledgerId: number, transactionId: number, update: MfTransactionUpdate): Promise<MfTransaction> => {
  const response = await api.patch(`/ledger/${ledgerId}/mf-transaction/${transactionId}`, update);
  return response.data;
};

export const deleteMfTransaction = async (ledgerId: number, transactionId: number): Promise<void> => {
  await api.delete(`/ledger/${ledgerId}/mf-transaction/${transactionId}`);
};

// Bulk NAV API functions

// Decide whether an axios failure is worth retrying. We only retry on
// network-layer errors and 5xx responses — 4xx is a permanent client-side
// problem and is passed straight through.
const isRetriableAxiosError = (error: unknown): boolean => {
  if (!(error instanceof AxiosError)) return false;
  if (!error.response) return true; // network error / timeout
  return error.response.status >= 500;
};

// Retry bulkFetchNav twice with short exponential backoff on transient
// network/5xx failures. This sits above the backend retry layer and
// guards only against client↔backend hiccups (the backend's own retry
// handles upstream NAV API flakiness).
export const bulkFetchNav = async (ledgerId: number, request: BulkNavFetchRequest): Promise<BulkNavFetchResponse> => {
  const url = `/ledger/${ledgerId}/mutual-funds/bulk-fetch-nav`;
  // mfapi.in can be slow and the backend retries up to 3 times; allow a
  // generous per-attempt timeout (60s), and retry the whole POST twice
  // more on client↔backend hiccups (5xx / network only).
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response: AxiosResponse<BulkNavFetchResponse> = await api.post(url, request, {
        timeout: 60000,
      });
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1 || !isRetriableAxiosError(error)) {
        throw error;
      }
      // 500ms, then 1000ms
      const delayMs = 500 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
};

export const bulkUpdateNav = async (ledgerId: number, request: BulkNavUpdateRequest): Promise<BulkNavUpdateResponse> => {
  const response = await api.put(`/ledger/${ledgerId}/mutual-funds/bulk-update-nav`, request);
  return response.data;
};

// Auto NAV update — status + manual trigger
export type NavUpdateRunStatus =
  | "idle"
  | "running"
  | "success"
  | "partial"
  | "failed"
  | "skipped_locked";

export interface NavUpdateLedgerResult {
  ledger_id: number;
  ledger_name: string | null;
  total_funds: number;
  updated: number;
  failed: number;
  skipped_no_code: number;
}

export interface NavUpdateRunState {
  status: NavUpdateRunStatus;
  started_at: string | null;
  finished_at: string | null;
  triggered_by: "schedule" | "manual" | null;
  total_ledgers: number;
  total_funds: number;
  total_updated: number;
  total_failed: number;
  error: string | null;
  ledgers: NavUpdateLedgerResult[];
}

export const getNavUpdateStatus = async (): Promise<NavUpdateRunState> => {
  const response = await api.get("/api/system/nav-update/status");
  return response.data;
};

export const triggerNavUpdate = async (): Promise<NavUpdateRunState> => {
  const response = await api.post("/api/system/nav-update/run");
  return response.data;
};

export const getYearlyInvestments = async (ledgerId: number, owner?: string): Promise<YearlyInvestment[]> => {
  const params = owner && owner !== 'all' ? { owner } : {};
  const response = await api.get(`/ledger/${ledgerId}/mutual-funds/yearly-investments`, { params });
  return response.data;
};

export const getCorpusGrowth = async (ledgerId: number, owner?: string, granularity?: string): Promise<YearlyInvestment[]> => {
  const params: any = {};
  if (owner && owner !== 'all') params.owner = owner;
  if (granularity) params.granularity = granularity;
  const response = await api.get(`/ledger/${ledgerId}/mutual-funds/corpus-growth`, { params });
  return response.data;
};

// Summary API functions (for dashboard)
export const getMutualFundSummaries = async (ledgerId: number): Promise<MutualFundSummary[]> => {
  // This would be a new endpoint for dashboard summaries
  // For now, we'll calculate on frontend
  const funds = await getMutualFunds(ledgerId);
  return funds.map(fund => {
    const totalUnits = toNumber(fund.total_units);
    const averageCost = toNumber(fund.average_cost_per_unit);
    const currentValue = toNumber(fund.current_value);
    const totalRealizedGain = toNumber(fund.total_realized_gain);
    const totalInvested = totalUnits * averageCost;
    return {
      mutual_fund_id: fund.mutual_fund_id,
      name: fund.name,
      plan: fund.plan,
      code: fund.code,
      owner: fund.owner,
      amc_name: fund.amc?.name || '',
      total_units: totalUnits,
      average_cost_per_unit: averageCost,
      latest_nav: toNumber(fund.latest_nav),
      current_value: currentValue,
      total_invested: totalInvested,
      total_realized_gain: totalRealizedGain,
      unrealized_pnl: currentValue - totalInvested,
      unrealized_pnl_percentage: totalInvested > 0
        ? ((currentValue - totalInvested) / totalInvested) * 100
        : 0,
    };
  });
};

const toNumber = (value: number | string): number =>
  typeof value === "string" ? parseFloat(value) : value;

export const getAmcSummaries = async (ledgerId: number): Promise<AmcSummary[]> => {
  // This would be a new endpoint for AMC summaries
  // For now, we'll calculate on frontend
  const funds = await getMutualFunds(ledgerId);
  const amcs = await getAmcs(ledgerId);

  return amcs.map(amc => {
    const amcFunds = funds.filter(fund => fund.amc_id === amc.amc_id);
    const totalUnits = amcFunds.reduce((sum, fund) => sum + toNumber(fund.total_units), 0);
    const totalInvested = amcFunds.reduce((sum, fund) => sum + toNumber(fund.total_invested_cash), 0);
    const currentValue = amcFunds.reduce((sum, fund) => sum + toNumber(fund.current_value), 0);
    const totalRealizedGain = amcFunds.reduce((sum, fund) => sum + toNumber(fund.total_realized_gain || 0), 0);

    return {
      amc_id: amc.amc_id,
      name: amc.name,
      total_funds: amcFunds.length,
      total_units: totalUnits,
      average_cost_per_unit: totalUnits > 0 ? totalInvested / totalUnits : 0,
      latest_nav: 0, // Would need to calculate weighted average
      current_value: currentValue,
      total_invested: totalInvested,
      total_realized_gain: totalRealizedGain,
      unrealized_pnl: currentValue - totalInvested,
      unrealized_pnl_percentage: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
    };
  });
};

// React Query hooks
export const useFundTransactions = (ledgerId: number, fundId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["fund-transactions", ledgerId, fundId],
    queryFn: () => getFundTransactions(ledgerId, fundId),
    enabled: !!ledgerId && !!fundId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Bulk NAV hooks
export const useBulkFetchNav = () => {
  // This will be used with mutations, not queries
  return {
    bulkFetchNav,
  };
};

export const useBulkUpdateNav = () => {
  // This will be used with mutations, not queries
  return {
    bulkUpdateNav,
  };
};