import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useDisclosure } from "@chakra-ui/react";
import api from "@/lib/api";
import type { Tag, Account, Category, Filters } from "@/types";
import type { InternalFilters } from "./types";

const DEFAULT_FILTERS: InternalFilters = {
  account_id: "",
  category_id: "",
  tags: [],
  tags_match: "any",
  search_text: "",
  store: "",
  location: "",
  transaction_type: "",
  from_date: null,
  to_date: null,
};

interface UseTransactionFiltersOptions {
  ledgerId: string;
  initialFilters?: Partial<Filters>;
  currentFilters?: Partial<Filters>;
  onApplyFilters: (filters: Partial<Filters>) => void;
  onResetFilters?: () => void;
}

export function useTransactionFilters({
  ledgerId,
  initialFilters = {},
  currentFilters = {},
  onApplyFilters,
  onResetFilters,
}: UseTransactionFiltersOptions) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State for filter form values
  const [filters, setFilters] = useState<InternalFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Searchable dropdown state -- Account
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [highlightedAccountIndex, setHighlightedAccountIndex] = useState<number>(-1);

  // Searchable dropdown state -- Category
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number>(-1);

  // Track if filters have changed from current applied filters
  const [hasChanged, setHasChanged] = useState(false);

  // Initialize filters when modal opens with current filters
  useEffect(() => {
    if (isOpen) {
      let normalizedTags: Tag[] = [];
      if (currentFilters.tags) {
        normalizedTags = Array.isArray(currentFilters.tags)
          ? (currentFilters.tags
              .map((tag) => {
                if (typeof tag === "string") return { name: tag };
                else if (tag && typeof tag === "object" && tag.name) return { ...tag };
                return null;
              })
              .filter(Boolean) as Tag[])
          : [];
      }

      const normalizedFilters: InternalFilters = {
        account_id: currentFilters.account_id || "",
        category_id: currentFilters.category_id || "",
        tags: normalizedTags,
        tags_match: currentFilters.tags_match || "any",
        search_text: currentFilters.search_text || "",
        store: currentFilters.store || "",
        location: currentFilters.location || "",
        transaction_type: currentFilters.transaction_type || "",
        from_date: currentFilters.from_date ? new Date(currentFilters.from_date) : null,
        to_date: currentFilters.to_date ? new Date(currentFilters.to_date) : null,
      };

      setFilters(normalizedFilters);

      // Reset dropdown search state
      setAccountSearch("");
      setIsAccountOpen(false);
      setHighlightedAccountIndex(-1);
      setCategorySearch("");
      setIsCategoryOpen(false);
      setHighlightedCategoryIndex(-1);
    }
  }, [isOpen, currentFilters]);

  // Fetch accounts for the current ledger
  const accountsQuery: UseQueryResult<Account[]> = useQuery<Account[]>({
    queryKey: ["accounts", ledgerId, "transaction-filter"],
    queryFn: async () => {
      const response = await api.get(`/ledger/${ledgerId}/accounts`);
      return response.data;
    },
    enabled: !!ledgerId,
    staleTime: 5 * 60 * 1000,
  });
  const accounts = accountsQuery.data ?? [];

  // Fetch categories
  const categoriesQuery: UseQueryResult<Category[]> = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get(`/category/list?ignore_group=true`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const categories = categoriesQuery.data ?? [];

  // Computed filtered accounts
  const selectedAccount = accounts.find(a => a.account_id === filters.account_id);
  const filteredAssetAccounts = accounts.filter(
    a => a.type === "asset" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const filteredLiabilityAccounts = accounts.filter(
    a => a.type === "liability" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const allFilteredAccounts = useMemo(
    () => [...filteredAssetAccounts, ...filteredLiabilityAccounts],
    [filteredAssetAccounts, filteredLiabilityAccounts],
  );
  const hasFilteredAccountResults = allFilteredAccounts.length > 0;

  // Computed filtered categories
  const selectedCategory = categories.find(c => c.category_id === filters.category_id);
  const filteredIncomeCategories = categories.filter(
    c => c.type === "income" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const filteredExpenseCategories = categories.filter(
    c => c.type === "expense" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const allFilteredCategories = useMemo(
    () => [...filteredIncomeCategories, ...filteredExpenseCategories],
    [filteredIncomeCategories, filteredExpenseCategories],
  );
  const hasFilteredCategoryResults = allFilteredCategories.length > 0;

  // Check if filters have changed when the form is opened or filters change
  useEffect(() => {
    const checkIfChanged = () => {
      if (filters.account_id !== (currentFilters.account_id || "")) return true;
      if (filters.category_id !== (currentFilters.category_id || "")) return true;
      if (filters.search_text !== (currentFilters.search_text || "")) return true;
      if (filters.store !== (currentFilters.store || "")) return true;
      if (filters.location !== (currentFilters.location || "")) return true;
      if (filters.transaction_type !== (currentFilters.transaction_type || "")) return true;
      if (filters.tags_match !== (currentFilters.tags_match || "any")) return true;

      const currentTags = currentFilters.tags || [];
      if (filters.tags.length !== currentTags.length) return true;
      const tagNames = [...filters.tags].map(t => t.name).sort();
      const currentTagNames = [...currentTags].map(t => t.name).sort();
      for (let i = 0; i < tagNames.length; i++) {
        if (tagNames[i] !== currentTagNames[i]) return true;
      }

      if ((filters.from_date && !currentFilters.from_date) || (!filters.from_date && currentFilters.from_date)) return true;
      if ((filters.to_date && !currentFilters.to_date) || (!filters.to_date && currentFilters.to_date)) return true;

      if (filters.from_date && currentFilters.from_date) {
        if (new Date(filters.from_date).toDateString() !== new Date(currentFilters.from_date).toDateString()) return true;
      }
      if (filters.to_date && currentFilters.to_date) {
        if (new Date(filters.to_date).toDateString() !== new Date(currentFilters.to_date).toDateString()) return true;
      }

      return false;
    };
    setHasChanged(checkIfChanged());
  }, [filters, currentFilters]);

  const handleInputChange = useCallback(<K extends keyof InternalFilters>(field: K, value: InternalFilters[K]) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setAccountSearch("");
    setIsAccountOpen(false);
    setHighlightedAccountIndex(-1);
    setCategorySearch("");
    setIsCategoryOpen(false);
    setHighlightedCategoryIndex(-1);
    if (onResetFilters) onResetFilters();
  }, [onResetFilters]);

  const handleApplyFilters = useCallback(() => {
    const cleanedFilters: Partial<Filters> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value === "" || value === null) return;
      if (Array.isArray(value) && value.length === 0) return;

      if (key === "from_date" || key === "to_date") {
        if (value) {
          const dateValue = value instanceof Date ? value : new Date(value);
          const isSameDay = filters.from_date && filters.to_date &&
            (filters.from_date instanceof Date ? filters.from_date : new Date(filters.from_date)).toDateString() ===
            (filters.to_date instanceof Date ? filters.to_date : new Date(filters.to_date)).toDateString();

          if (isSameDay) {
            if (key === "to_date") dateValue.setHours(23, 59, 59, 999);
            else if (key === "from_date") dateValue.setHours(0, 0, 0, 0);
          }
          (cleanedFilters as any)[key] = dateValue.toISOString();
        }
        return;
      }
      if (key === "tags" && value.length > 0) {
        (cleanedFilters as any)[key] = [...value].map((tag: Tag) => tag.name);
        return;
      }
      cleanedFilters[key as keyof Filters] = value;
    });
    onApplyFilters(cleanedFilters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (currentFilters.account_id) count++;
    if (currentFilters.category_id) count++;
    if (currentFilters.tags && currentFilters.tags.length > 0) count++;
    if (currentFilters.search_text) count++;
    if (currentFilters.store) count++;
    if (currentFilters.location) count++;
    if (currentFilters.transaction_type) count++;
    if (currentFilters.from_date) count++;
    if (currentFilters.to_date) count++;
    return count;
  }, [currentFilters]);

  const handleAccountKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredAccounts.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isAccountOpen) { setIsAccountOpen(true); setHighlightedAccountIndex(0); }
        else { setHighlightedAccountIndex(prev => total === 0 ? -1 : (prev + 1) % total); }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isAccountOpen && total > 0) setHighlightedAccountIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        break;
      case "Enter":
        if (isAccountOpen && highlightedAccountIndex >= 0 && highlightedAccountIndex < total) {
          e.preventDefault();
          const acc = allFilteredAccounts[highlightedAccountIndex];
          handleInputChange("account_id", String(acc.account_id));
          setAccountSearch("");
          setIsAccountOpen(false);
          setHighlightedAccountIndex(-1);
        }
        break;
      case "Escape":
        setIsAccountOpen(false);
        setHighlightedAccountIndex(-1);
        break;
      case "Tab":
        setIsAccountOpen(false);
        setHighlightedAccountIndex(-1);
        break;
    }
  }, [allFilteredAccounts, isAccountOpen, highlightedAccountIndex, handleInputChange]);

  const handleCategoryKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isCategoryOpen) { setIsCategoryOpen(true); setHighlightedCategoryIndex(0); }
        else { setHighlightedCategoryIndex(prev => total === 0 ? -1 : (prev + 1) % total); }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isCategoryOpen && total > 0) setHighlightedCategoryIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        break;
      case "Enter":
        if (isCategoryOpen && highlightedCategoryIndex >= 0 && highlightedCategoryIndex < total) {
          e.preventDefault();
          const cat = allFilteredCategories[highlightedCategoryIndex];
          handleInputChange("category_id", String(cat.category_id));
          setCategorySearch("");
          setIsCategoryOpen(false);
          setHighlightedCategoryIndex(-1);
        }
        break;
      case "Escape":
        setIsCategoryOpen(false);
        setHighlightedCategoryIndex(-1);
        break;
      case "Tab":
        setIsCategoryOpen(false);
        setHighlightedCategoryIndex(-1);
        break;
    }
  }, [allFilteredCategories, isCategoryOpen, highlightedCategoryIndex, handleInputChange]);

  return {
    // Modal state
    isOpen,
    onOpen,
    onClose,

    // Filter state
    filters,
    hasChanged,
    handleInputChange,
    handleResetFilters,
    handleApplyFilters,
    getActiveFilterCount,

    // Account dropdown
    accounts,
    isAccountsLoading: accountsQuery.isLoading,
    selectedAccount,
    accountSearch,
    setAccountSearch,
    isAccountOpen,
    setIsAccountOpen,
    highlightedAccountIndex,
    setHighlightedAccountIndex,
    filteredAssetAccounts,
    filteredLiabilityAccounts,
    allFilteredAccounts,
    hasFilteredAccountResults,
    handleAccountKeyDown,

    // Category dropdown
    categories,
    isCategoriesLoading: categoriesQuery.isLoading,
    selectedCategory,
    categorySearch,
    setCategorySearch,
    isCategoryOpen,
    setIsCategoryOpen,
    highlightedCategoryIndex,
    setHighlightedCategoryIndex,
    filteredIncomeCategories,
    filteredExpenseCategories,
    allFilteredCategories,
    hasFilteredCategoryResults,
    handleCategoryKeyDown,
  };
}
