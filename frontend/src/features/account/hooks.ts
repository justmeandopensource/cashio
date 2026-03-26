import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getAccount,
  getAccountSummary,
  getAccountInsights,
} from "./api";
import type { AccountData, AccountSummaryData, AccountInsightsData } from "./api";

export const useAccount = (
  ledgerId: string | number,
  accountId: string | number
) => {
  return useQuery<AccountData>({
    queryKey: queryKeys.accounts.detail(accountId),
    queryFn: () => getAccount(ledgerId, accountId),
    enabled: !!ledgerId && !!accountId,
  });
};

export const useAccountSummary = (
  ledgerId: string | number,
  accountId: string | number
) => {
  return useQuery<AccountSummaryData>({
    queryKey: queryKeys.accounts.summary(accountId),
    queryFn: () => getAccountSummary(ledgerId, accountId),
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
    queryFn: () => getAccountInsights(ledgerId, accountId),
    enabled: !!ledgerId && !!accountId,
    staleTime: 5 * 60 * 1000,
  });
};
