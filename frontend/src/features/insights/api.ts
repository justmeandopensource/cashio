import api from "@/lib/api";

export const getCurrentMonthOverview = async (ledgerId: number | string, signal?: AbortSignal) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/current-month-overview`,
    { signal },
  );
  return response.data;
};

export const getIncomeExpenseTrend = async (
  ledgerId: number | string,
  periodType: string,
  signal?: AbortSignal,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/income-expense-trend?period_type=${periodType}`,
    { signal },
  );
  return response.data;
};

export const getCategoryTrend = async (
  ledgerId: number | string,
  categoryId: number | string,
  periodType: string,
  signal?: AbortSignal,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/category-trend?category_id=${categoryId}&period_type=${periodType}`,
    { signal },
  );
  return response.data;
};

export const getTagTrend = async (
  ledgerId: number | string,
  tagNames: string[],
  signal?: AbortSignal,
) => {
  const params = tagNames
    .map((name) => `tag_names=${encodeURIComponent(name)}`)
    .join("&");
  const response = await api.get(
    `/ledger/${ledgerId}/insights/tag-trend?${params}`,
    { signal },
  );
  return response.data;
};

export const getExpenseByStore = async (
  ledgerId: number | string,
  periodType: string,
  signal?: AbortSignal,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-by-store?period_type=${periodType}`,
    { signal },
  );
  return response.data;
};

export const getStoreCategoryBreakdown = async (
  ledgerId: number | string,
  storeName: string,
  periodType: string,
  signal?: AbortSignal,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-by-store/categories?store_name=${encodeURIComponent(storeName)}&period_type=${periodType}`,
    { signal },
  );
  return response.data;
};

export const getExpenseByLocation = async (
  ledgerId: number | string,
  periodType: string,
  signal?: AbortSignal,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-by-location?period_type=${periodType}`,
    { signal },
  );
  return response.data;
};

export const getLocationCategoryBreakdown = async (
  ledgerId: number | string,
  locationName: string,
  periodType: string,
  signal?: AbortSignal,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-by-location/categories?location_name=${encodeURIComponent(locationName)}&period_type=${periodType}`,
    { signal },
  );
  return response.data;
};

export const getFundFlow = async (
  periodType: string,
  signal?: AbortSignal,
) => {
  const response = await api.get(
    `/insights/fund-flow?period_type=${periodType}`,
    { signal },
  );
  return response.data;
};

export const getExpenseCalendar = async (
  ledgerId: number | string,
  year: number,
  signal?: AbortSignal,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-calendar?year=${year}`,
    { signal },
  );
  return response.data;
};
