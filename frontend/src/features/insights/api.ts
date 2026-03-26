import api from "@/lib/api";

export const getCurrentMonthOverview = async (ledgerId: number | string) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/current-month-overview`,
  );
  return response.data;
};

export const getIncomeExpenseTrend = async (
  ledgerId: number | string,
  periodType: string,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/income-expense-trend?period_type=${periodType}`,
  );
  return response.data;
};

export const getCategoryTrend = async (
  ledgerId: number | string,
  categoryId: number | string,
  periodType: string,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/category-trend?category_id=${categoryId}&period_type=${periodType}`,
  );
  return response.data;
};

export const getTagTrend = async (
  ledgerId: number | string,
  tagNames: string[],
) => {
  const params = tagNames
    .map((name) => `tag_names=${encodeURIComponent(name)}`)
    .join("&");
  const response = await api.get(
    `/ledger/${ledgerId}/insights/tag-trend?${params}`,
  );
  return response.data;
};

export const getExpenseByStore = async (
  ledgerId: number | string,
  periodType: string,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-by-store?period_type=${periodType}`,
  );
  return response.data;
};

export const getStoreCategoryBreakdown = async (
  ledgerId: number | string,
  storeName: string,
  periodType: string,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-by-store/categories?store_name=${encodeURIComponent(storeName)}&period_type=${periodType}`,
  );
  return response.data;
};

export const getExpenseByLocation = async (
  ledgerId: number | string,
  periodType: string,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-by-location?period_type=${periodType}`,
  );
  return response.data;
};

export const getLocationCategoryBreakdown = async (
  ledgerId: number | string,
  locationName: string,
  periodType: string,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-by-location/categories?location_name=${encodeURIComponent(locationName)}&period_type=${periodType}`,
  );
  return response.data;
};

export const getExpenseCalendar = async (
  ledgerId: number | string,
  year: number,
) => {
  const response = await api.get(
    `/ledger/${ledgerId}/insights/expense-calendar?year=${year}`,
  );
  return response.data;
};
