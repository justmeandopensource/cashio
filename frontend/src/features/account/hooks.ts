import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getAccount,
  getAccountSummary,
  getAccountInsights,
  getAccountBalanceHistory,
  getAccountFundsFlow,
} from "./api";
import type { AccountData, AccountSummaryData, AccountInsightsData, AccountBalanceHistoryData, AccountFundsFlowData } from "./api";

export const useAccount = (
  ledgerId: string | number,
  accountId: string | number
) => {
  return useQuery<AccountData>({
    queryKey: queryKeys.accounts.detail(accountId),
    queryFn: ({ signal }) => getAccount(ledgerId, accountId, signal),
    enabled: !!ledgerId && !!accountId,
  });
};

export const useAccountSummary = (
  ledgerId: string | number,
  accountId: string | number
) => {
  return useQuery<AccountSummaryData>({
    queryKey: queryKeys.accounts.summary(accountId),
    queryFn: ({ signal }) => getAccountSummary(ledgerId, accountId, signal),
    enabled: !!ledgerId && !!accountId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAccountInsights = (
  ledgerId: string | number,
  accountId: string | number
) => {
  return useQuery<AccountInsightsData>({
    queryKey: queryKeys.accounts.insights(accountId),
    queryFn: ({ signal }) => getAccountInsights(ledgerId, accountId, signal),
    enabled: !!ledgerId && !!accountId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAccountBalanceHistory = (
  ledgerId: string | number,
  accountId: string | number
) => {
  return useQuery<AccountBalanceHistoryData>({
    queryKey: queryKeys.accounts.balanceHistory(accountId),
    queryFn: ({ signal }) => getAccountBalanceHistory(ledgerId, accountId, signal),
    enabled: !!ledgerId && !!accountId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAccountFundsFlow = (
  ledgerId: string | number,
  accountId: string | number
) => {
  return useQuery<AccountFundsFlowData>({
    queryKey: queryKeys.accounts.fundsFlow(accountId),
    queryFn: ({ signal }) => getAccountFundsFlow(ledgerId, accountId, signal),
    enabled: !!ledgerId && !!accountId,
    staleTime: 5 * 60 * 1000,
  });
};
