import api from "@/lib/api";
import type { BudgetItemData } from "./components/BudgetItem";

export interface BudgetData {
  period: string;
  period_label: string;
  total_budgeted: number;
  total_spent: number;
  budgets: BudgetItemData[];
}

export const getBudgets = async (
  ledgerId: number | string,
  period: string,
): Promise<BudgetData> => {
  const response = await api.get(
    `/ledger/${ledgerId}/budgets?period=${period}`,
  );
  return response.data;
};

export const createBudget = async (
  ledgerId: number | string,
  data: { category_id: number; period: string; amount: number },
) => {
  const response = await api.post(`/ledger/${ledgerId}/budgets`, data);
  return response.data;
};

export const updateBudget = async (
  ledgerId: number | string,
  budgetId: number,
  data: { amount: number },
) => {
  const response = await api.put(
    `/ledger/${ledgerId}/budgets/${budgetId}`,
    data,
  );
  return response.data;
};

export const deleteBudget = async (
  ledgerId: number | string,
  budgetId: number,
): Promise<void> => {
  await api.delete(`/ledger/${ledgerId}/budgets/${budgetId}`);
};
