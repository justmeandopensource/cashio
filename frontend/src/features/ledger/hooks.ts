import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getLedgers,
  getLedger,
  createLedger,
  getAccounts,
  getLedgerDetails,
  updateLedger,
  createAccount,
  updateAccount,
  type CreateLedgerData,
  type CreateAccountPayload,
} from "./api";
import type { Ledger } from "@/types";

export const useLedgers = () => {
  return useQuery({
    queryKey: queryKeys.ledgers.all,
    queryFn: ({ signal }) => getLedgers(signal),
  });
};

export const useLedger = (ledgerId: string | number | undefined) => {
  return useQuery({
    queryKey: queryKeys.ledgers.detail(ledgerId!),
    queryFn: ({ signal }) => getLedger(ledgerId!, signal),
    enabled: !!ledgerId,
  });
};

export const useCreateLedger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLedgerData) => createLedger(data),
    onSuccess: (data: Ledger) => {
      queryClient.setQueryData(
        queryKeys.ledgers.all,
        (oldData: Ledger[] | undefined) => [...(oldData || []), data],
      );
    },
  });
};

export const useAccounts = (ledgerId: string | number | undefined) => {
  return useQuery({
    queryKey: queryKeys.accounts.all(ledgerId!),
    queryFn: ({ signal }) => getAccounts(ledgerId!, signal),
    enabled: !!ledgerId,
  });
};

export const useLedgerDetails = (
  ledgerId: string | number | undefined,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: queryKeys.ledgers.details(ledgerId!),
    queryFn: ({ signal }) => getLedgerDetails(ledgerId!, signal),
    enabled: !!ledgerId && enabled,
  });
};

export const useUpdateLedger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      data,
    }: {
      ledgerId: string | number;
      data: Partial<CreateLedgerData>;
    }) => updateLedger(ledgerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ledgers.detail(variables.ledgerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.ledgers.details(variables.ledgerId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledgers.all });
    },
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      data,
    }: {
      ledgerId: string | number;
      data: CreateAccountPayload;
    }) => createAccount(ledgerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.all(variables.ledgerId),
      });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      accountId,
      data,
    }: {
      ledgerId: string | number;
      accountId: string | number;
      data: Partial<CreateAccountPayload>;
    }) => updateAccount(ledgerId, accountId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.all(variables.ledgerId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts.detail(variables.accountId),
      });
    },
  });
};
