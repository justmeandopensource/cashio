import { MutualFund, Amc } from "../../types";

// Helper function to convert string|number to number
export const toNumber = (value: number | string): number =>
  typeof value === "string" ? parseFloat(value) : value;

// Helper to get plan initials
export const getPlanInitials = (plan: string | null | undefined): string => {
  if (plan === "Direct Growth") return "DG";
  if (plan === "Regular Growth") return "RG";
  return "";
};

// Helper to get owner initials
export const getOwnerInitials = (owner: string | null | undefined): string => {
  if (!owner) return "";
  return owner
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

export type SortField =
  | "amc"
  | "fund"
  | "invested"
  | "value"
  | "unrealized_pnl"
  | "unrealized_pnl_percentage"
  | "cagr_percentage"
  | "xirr_percentage";

export type SortDirection = "asc" | "desc";

export type FundWithAmc = MutualFund & {
  amc_name: string;
  invested: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percentage: number;
  xirr_percentage: number | null;
  cagr_percentage: number | null;
};

export interface ExpandedFundRowProps {
  fund: FundWithAmc;
  currencySymbol: string | undefined;
  mutedColor: string;
  isExpanded: boolean;
  onTradeUnits: (fundId: number) => void;
  onTransferUnits: (fundId: number) => void;
  onUpdateNav: (fund: MutualFund) => void;
  onCloseFund: (fundId: number) => void;
  onViewTransactions: (fundId: number) => void;
  onViewAnalytics: (fund: MutualFund) => void;
  positiveColor: string;
  negativeColor: string;
}

export interface MobileFundCardProps {
  fund: FundWithAmc;
  onAmcClick: (amc: Amc) => void;
  onFundClick: (fund: MutualFund) => void;
  amcs: Amc[];
  currencySymbol: string | undefined;
  mutedColor: string;
  tertiaryTextColor: string;
  amcFundNameColor: string;
  positiveColor: string;
  negativeColor: string;
  onTradeUnits: (fundId: number) => void;
  onTransferUnits: (fundId: number) => void;
  onUpdateNav: (fund: MutualFund) => void;
  onCloseFund: (fundId: number) => void;
  onViewTransactions: (fundId: number) => void;
  onViewAnalytics: (fund: MutualFund) => void;
  defaultExpanded?: boolean;
}

export interface MutualFundsTableProps {
  amcs: Amc[];
  mutualFunds: MutualFund[];
  onTradeUnits: (fundId: number) => void;
  onTransferUnits: (fundId: number) => void;
  onUpdateNav: (fund: MutualFund) => void;
  onCloseFund: (fundId: number) => void;
  onViewTransactions: (fundId: number) => void;
  onViewAnalytics: (fund: MutualFund) => void;
  filters: {
    selectedAmc: string;
    selectedOwner: string;
    selectedAssetClass: string;
    showZeroBalance: boolean;
    searchTerm?: string;
  };
  onFiltersChange: (filters: {
    selectedAmc: string;
    selectedOwner: string;
    selectedAssetClass: string;
    showZeroBalance: boolean;
    searchTerm?: string;
  }) => void;
}
