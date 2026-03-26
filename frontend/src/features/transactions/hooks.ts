import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { queryKeys, invalidateTransactionRelated } from "@/lib/queryKeys";
import { getTransactions, deleteTransaction } from "./api";
import { notify } from "@/components/shared/notify";
import type { TransactionsResponse, Filters } from "@/types";

export const useTransactions = (
  ledgerId: string | number,
  accountId: string | undefined,
  page: number,
  filters: Filters,
  enabled: boolean = true
) => {
  return useQuery<TransactionsResponse>({
    queryKey: queryKeys.transactions.list(ledgerId, accountId, page, filters),
    queryFn: ({ signal }) =>
      getTransactions(ledgerId, {
        page,
        per_page: 50,
        account_id: accountId,
        filters,
      }, signal),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteTransaction = (
  ledgerId: string | number,
  accountId?: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) =>
      deleteTransaction(ledgerId, transactionId),
    onMutate: async (transactionId) => {
      // Cancel outgoing refetches for all transaction queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.all,
      });

      // Return context for rollback — we don't do granular optimistic update
      // here since the query key includes page/filters which vary by caller.
      return { transactionId };
    },
    onError: (err) => {
      const axiosError = err as AxiosError<{ detail: string }>;
      notify({
        description:
          axiosError.response?.data?.detail || "Failed to delete transaction.",
        status: "error",
      });
    },
    onSuccess: () => {
      notify({
        description: "Transaction deleted",
        status: "success",
      });
    },
    onSettled: () => {
      invalidateTransactionRelated(queryClient, ledgerId, accountId);
    },
  });
};
