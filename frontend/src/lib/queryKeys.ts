import type { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  ledgers: {
    all: ["ledgers"] as const,
    detail: (ledgerId: string | number) => ["ledger", ledgerId] as const,
    details: (ledgerId: string | number) => ["ledger-details", ledgerId] as const,
  },
  accounts: {
    all: (ledgerId: string | number) => ["accounts", ledgerId] as const,
    forFilter: (ledgerId: string | number) =>
      ["accounts", ledgerId, "transaction-filter"] as const,
    detail: (accountId: string | number) => ["account", accountId] as const,
    summary: (accountId: string | number) => ["account-summary", accountId] as const,
    insights: (accountId: string | number) => ["account-insights", accountId] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (
      ledgerId: string | number,
      accountId?: string,
      page?: number,
      filters?: Record<string, unknown>
    ) => ["transactions", ledgerId, accountId, page, filters] as const,
    count: (ledgerId: string | number) => ["transactions-count", ledgerId] as const,
  },
  categories: {
    all: ["categories"] as const,
    grouped: (categoryType: string) => ["groupCategories", categoryType] as const,
    forLedger: (ledgerId: string | number, type: string) =>
      ["categories", ledgerId, type] as const,
    expenseLeaf: ["expenseLeafCategories"] as const,
  },
  tags: {
    all: ["tags"] as const,
  },
  insights: {
    all: ["insights"] as const,
    currentMonth: (ledgerId?: string | number) =>
      ledgerId
        ? (["current-month-overview", ledgerId] as const)
        : (["current-month-overview"] as const),
    incomeExpense: (ledgerId: string | number, periodType: string) =>
      ["insights", ledgerId, periodType] as const,
    categoryTrend: (
      ledgerId?: string | number,
      category?: string,
      periodType?: string
    ) =>
      ledgerId
        ? (["categoryTrend", ledgerId, category, periodType] as const)
        : (["categoryTrend"] as const),
    tagTrend: (
      ledgerId?: string | number,
      tag?: string,
      periodType?: string
    ) =>
      ledgerId
        ? (["tag-trend", ledgerId, tag, periodType] as const)
        : (["tag-trend"] as const),
    expenseByStore: (ledgerId: string | number, periodType: string) =>
      ["expenseByStore", ledgerId, periodType] as const,
    storeCategoryBreakdown: (
      ledgerId: string | number,
      storeName: string,
      periodType: string
    ) => ["storeCategoryBreakdown", ledgerId, storeName, periodType] as const,
    expenseByLocation: (ledgerId: string | number, periodType: string) =>
      ["expenseByLocation", ledgerId, periodType] as const,
    locationCategoryBreakdown: (
      ledgerId: string | number,
      locationName: string,
      periodType: string
    ) =>
      ["locationCategoryBreakdown", ledgerId, locationName, periodType] as const,
    calendarHeatmap: (ledgerId: string | number, year?: number) =>
      ["expenseCalendar", ledgerId, year] as const,
  },
  budgets: {
    all: ["budgets"] as const,
    forLedger: (ledgerId: string | number, period?: string) =>
      period
        ? (["budgets", ledgerId, period] as const)
        : (["budgets", ledgerId] as const),
  },
  mutualFunds: {
    all: (ledgerId: number) => ["mutual-funds", ledgerId] as const,
    amcs: (ledgerId: number) => ["amcs", ledgerId] as const,
    amcSummaries: (ledgerId: number) => ["amc-summaries", ledgerId] as const,
    transactions: (ledgerId: number) => ["mf-transactions", ledgerId] as const,
    fundTransactions: (ledgerId: number, fundId: number) =>
      ["fund-transactions", ledgerId, fundId] as const,
    corpusGrowth: (
      ledgerId: number,
      owner: string,
      granularity: string
    ) => ["corpus-growth", ledgerId, owner, granularity] as const,
    yearlyInvestments: (ledgerId: number, owner: string) =>
      ["yearly-investments", ledgerId, owner] as const,
  },
  physicalAssets: {
    all: (ledgerId: number) => ["physical-assets", ledgerId] as const,
    detail: (ledgerId: number, assetId: number) =>
      ["physical-asset", ledgerId, assetId] as const,
    types: (ledgerId: number) => ["asset-types", ledgerId] as const,
    transactions: (ledgerId: number, assetId: number) =>
      ["asset-transactions", ledgerId, assetId] as const,
    allTransactions: (ledgerId: number) =>
      ["all-asset-transactions", ledgerId] as const,
  },
  netWorth: {
    forLedger: (ledgerId: string | number) =>
      ["net-worth", ledgerId] as const,
  },
  user: {
    profile: ["userProfile"] as const,
  },
  backups: {
    all: ["backups"] as const,
  },
} as const;

/**
 * Invalidate all queries commonly affected by transaction mutations
 * (transactions, insights, budgets, account balances).
 */
export const invalidateTransactionRelated = (
  queryClient: QueryClient,
  ledgerId: string | number,
  accountId?: string | number
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: ["current-month-overview"] });
  queryClient.invalidateQueries({ queryKey: ["insights"] });
  queryClient.invalidateQueries({ queryKey: ["categoryTrend"] });
  queryClient.invalidateQueries({ queryKey: ["tag-trend"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
  queryClient.invalidateQueries({
    queryKey: queryKeys.accounts.all(ledgerId),
  });
  if (accountId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.accounts.detail(accountId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.accounts.summary(accountId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.accounts.insights(accountId),
    });
  }
};

/**
 * Invalidate all queries commonly affected by physical asset mutations.
 */
export const invalidatePhysicalAssetRelated = (
  queryClient: QueryClient,
  ledgerId: number,
  assetId?: number
) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.physicalAssets.all(ledgerId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.physicalAssets.allTransactions(ledgerId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.accounts.all(ledgerId),
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  if (assetId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.physicalAssets.transactions(ledgerId, assetId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.physicalAssets.detail(ledgerId, assetId),
    });
  }
};

/**
 * Invalidate all queries commonly affected by mutual fund mutations.
 */
export const invalidateMutualFundRelated = (
  queryClient: QueryClient,
  ledgerId: number,
  fundId?: number
) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.mutualFunds.all(ledgerId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.mutualFunds.transactions(ledgerId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.mutualFunds.amcs(ledgerId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.mutualFunds.amcSummaries(ledgerId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.accounts.all(ledgerId),
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  if (fundId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.mutualFunds.fundTransactions(ledgerId, fundId),
    });
  }
};
