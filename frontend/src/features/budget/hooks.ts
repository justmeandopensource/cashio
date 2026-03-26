import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getBudgets, createBudget, updateBudget, deleteBudget } from "./api";

export const useBudgets = (ledgerId: number | string, period: string) => {
  return useQuery({
    queryKey: queryKeys.budgets.forLedger(ledgerId, period),
    queryFn: () => getBudgets(ledgerId, period),
    enabled: !!ledgerId,
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      data,
    }: {
      ledgerId: number | string;
      data: { category_id: number; period: string; amount: number };
    }) => createBudget(ledgerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets.forLedger(variables.ledgerId),
      });
    },
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      budgetId,
      data,
    }: {
      ledgerId: number | string;
      budgetId: number;
      data: { amount: number };
    }) => updateBudget(ledgerId, budgetId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets.forLedger(variables.ledgerId),
      });
    },
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerId,
      budgetId,
    }: {
      ledgerId: number | string;
      budgetId: number;
    }) => deleteBudget(ledgerId, budgetId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budgets.forLedger(variables.ledgerId),
      });
    },
  });
};
