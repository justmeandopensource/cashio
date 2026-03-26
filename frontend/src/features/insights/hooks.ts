import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getCurrentMonthOverview,
  getIncomeExpenseTrend,
  getCategoryTrend,
  getTagTrend,
  getExpenseByStore,
  getStoreCategoryBreakdown,
  getExpenseByLocation,
  getLocationCategoryBreakdown,
  getExpenseCalendar,
} from "./api";

export const useCurrentMonthOverview = (ledgerId?: number | string) => {
  return useQuery({
    queryKey: queryKeys.insights.currentMonth(ledgerId),
    queryFn: () => getCurrentMonthOverview(ledgerId!),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useIncomeExpenseTrend = (
  ledgerId: number | string,
  periodType: string,
) => {
  return useQuery({
    queryKey: queryKeys.insights.incomeExpense(ledgerId, periodType),
    queryFn: () => getIncomeExpenseTrend(ledgerId, periodType),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoryTrend = (
  ledgerId?: number | string,
  categoryId?: number | string,
  periodType?: string,
) => {
  return useQuery({
    queryKey: queryKeys.insights.categoryTrend(
      ledgerId,
      String(categoryId),
      periodType,
    ),
    queryFn: () => getCategoryTrend(ledgerId!, categoryId!, periodType!),
    enabled: !!ledgerId && !!categoryId && !!periodType,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTagTrend = (
  ledgerId?: number | string,
  tagNames?: string[],
  options?: { enabled?: boolean },
) => {
  const tagKey = tagNames?.join(",") ?? "";
  return useQuery({
    queryKey: queryKeys.insights.tagTrend(ledgerId, tagKey),
    queryFn: () => getTagTrend(ledgerId!, tagNames!),
    enabled:
      !!ledgerId &&
      !!tagNames &&
      tagNames.length > 0 &&
      (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
};

export const useExpenseByStore = (
  ledgerId: number | string,
  periodType: string,
) => {
  return useQuery({
    queryKey: queryKeys.insights.expenseByStore(ledgerId, periodType),
    queryFn: () => getExpenseByStore(ledgerId, periodType),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useStoreCategoryBreakdown = (
  ledgerId: number | string,
  storeName: string,
  periodType: string,
) => {
  return useQuery({
    queryKey: queryKeys.insights.storeCategoryBreakdown(
      ledgerId,
      storeName,
      periodType,
    ),
    queryFn: () => getStoreCategoryBreakdown(ledgerId, storeName, periodType),
    enabled: !!ledgerId && !!storeName,
    staleTime: 5 * 60 * 1000,
  });
};

export const useExpenseByLocation = (
  ledgerId: number | string,
  periodType: string,
) => {
  return useQuery({
    queryKey: queryKeys.insights.expenseByLocation(ledgerId, periodType),
    queryFn: () => getExpenseByLocation(ledgerId, periodType),
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLocationCategoryBreakdown = (
  ledgerId: number | string,
  locationName: string,
  periodType: string,
) => {
  return useQuery({
    queryKey: queryKeys.insights.locationCategoryBreakdown(
      ledgerId,
      locationName,
      periodType,
    ),
    queryFn: () =>
      getLocationCategoryBreakdown(ledgerId, locationName, periodType),
    enabled: !!ledgerId && !!locationName,
    staleTime: 5 * 60 * 1000,
  });
};

export const useExpenseCalendar = (
  ledgerId: number | string,
  year?: number,
) => {
  return useQuery({
    queryKey: queryKeys.insights.calendarHeatmap(ledgerId, year),
    queryFn: () => getExpenseCalendar(ledgerId, year!),
    enabled: !!ledgerId && !!year,
    staleTime: 5 * 60 * 1000,
  });
};
