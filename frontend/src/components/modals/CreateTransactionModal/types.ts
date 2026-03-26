import type React from "react";
import type { Split, Tag, TransactionCreate } from "@/types";

export interface Category {
  category_id: string;
  name: string;
  type: string;
}

export interface Account {
  account_id: string;
  name: string;
  type: string;
}

export interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  onTransactionAdded: () => void;
  initialData?: TransactionCreate;
}

export interface CreateTransactionFormProps {
  // Form state
  date: Date;
  setDate: (date: Date) => void;
  type: "expense" | "income";
  setType: (type: "expense" | "income") => void;
  amount: string;
  setAmount: (amount: string) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  store: string;
  setStore: (store: string) => void;
  location: string;
  setLocation: (location: string) => void;
  isSplit: boolean;
  splits: Split[];
  setSplits: (splits: Split[]) => void;
  tags: Tag[];
  setTags: (tags: Tag[]) => void;

  // Category dropdown
  categorySearch: string;
  setCategorySearch: (search: string) => void;
  isCategoryOpen: boolean;
  setIsCategoryOpen: (open: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;

  // Account dropdown
  accountSearch: string;
  setAccountSearch: (search: string) => void;
  isAccountOpen: boolean;
  setIsAccountOpen: (open: boolean) => void;
  highlightedAccountIndex: number;
  setHighlightedAccountIndex: (index: number) => void;

  // Computed values
  categories: Category[];
  accounts: Account[];
  selectedCategory: Category | undefined;
  selectedAccount: Account | undefined;
  filteredIncomeCategories: Category[];
  filteredExpenseCategories: Category[];
  hasFilteredResults: boolean;
  allFilteredCategories: Category[];
  filteredAssetAccounts: Account[];
  filteredLiabilityAccounts: Account[];
  hasFilteredAccountResults: boolean;
  allFilteredAccounts: Account[];

  // Handlers
  handleCategoryKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleAccountKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSplitToggle: (isChecked: boolean) => void;
  calculateRemainingAmount: () => number;
  handleSubmit: () => void;

  // Suggestion states
  setIsNotesSuggestionsOpen: (open: boolean) => void;
  setIsStoreSuggestionsOpen: (open: boolean) => void;
  setIsLocationSuggestionsOpen: (open: boolean) => void;
  setIsTagInputActive: (active: boolean) => void;
  setIsSplitDropdownOpen: (open: boolean) => void;

  // Context
  accountId?: string;
  ledgerId: string;
  currencySymbol: string;
  isLoading: boolean;
  isSaveDisabled: boolean;
  onClose: () => void;
}

export interface ApiErrorResponse {
  detail?: string;
}
