import type { Tag, Filters } from "@/types";

/** Internal filter state with all fields required for form management */
export interface InternalFilters {
  account_id: string;
  category_id: string;
  tags: Tag[];
  tags_match: "any" | "all";
  search_text: string;
  store: string;
  location: string;
  transaction_type: "" | "income" | "expense" | "transfer";
  from_date: Date | null;
  to_date: Date | null;
}

export interface TransactionFilterProps {
  ledgerId: string;
  accountId?: string;
  initialFilters?: Partial<Filters>;
  onApplyFilters: (filters: Partial<Filters>) => void;
  currentFilters?: Partial<Filters>;
  onResetFilters?: () => void;
}

export interface FilterThemeColors {
  bgColor: string;
  borderColor: string;
  cardBg: string;
  footerBg: string;
  inputBg: string;
  inputBorderColor: string;
  focusBorderColor: string;
  highlightColor: string;
  helperTextColor: string;
  secondaryTextColor: string;
}

export const TRANSACTION_TYPE_OPTIONS = [
  { value: "" as const, label: "All Types", scheme: "gray" },
  { value: "income" as const, label: "Income", scheme: "teal" },
  { value: "expense" as const, label: "Expense", scheme: "red" },
  { value: "transfer" as const, label: "Transfer", scheme: "blue" },
];
