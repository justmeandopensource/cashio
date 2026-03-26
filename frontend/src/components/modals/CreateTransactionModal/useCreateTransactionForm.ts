import React, { useState, useEffect, useCallback, useRef } from "react";
import { AxiosError } from "axios";
import api from "@/lib/api";
import useLedgerStore from "@/components/shared/store";
import { notify } from "@/components/shared/notify";
import type { Split, Tag, TransactionCreate } from "@/types";
import type { Category, Account } from "./types";

const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

interface UseCreateTransactionFormOptions {
  isOpen: boolean;
  accountId?: string;
  initialData?: TransactionCreate;
  onClose: () => void;
  onTransactionAdded: () => void;
}

export function useCreateTransactionForm({
  isOpen,
  accountId,
  initialData,
  onClose,
  onTransactionAdded,
}: UseCreateTransactionFormOptions) {
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [store, setStore] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotesSuggestionsOpen, setIsNotesSuggestionsOpen] = useState<boolean>(false);
  const [isStoreSuggestionsOpen, setIsStoreSuggestionsOpen] = useState<boolean>(false);
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState<boolean>(false);
  const [isTagInputActive, setIsTagInputActive] = useState<boolean>(false);
  const [isSplitDropdownOpen, setIsSplitDropdownOpen] = useState<boolean>(false);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [highlightedAccountIndex, setHighlightedAccountIndex] = useState<number>(-1);
  const { ledgerId, currencySymbol } = useLedgerStore();

  // Computed values
  const selectedCategory = categories.find((c) => c.category_id === categoryId);
  const filteredIncomeCategories = categories.filter(
    (c) => c.type === "income" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const filteredExpenseCategories = categories.filter(
    (c) => c.type === "expense" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const hasFilteredResults =
    filteredIncomeCategories.length > 0 || filteredExpenseCategories.length > 0;
  const allFilteredCategories = [...filteredIncomeCategories, ...filteredExpenseCategories];

  const selectedAccount = accounts.find((a) => a.account_id === selectedAccountId);
  const filteredAssetAccounts = accounts.filter(
    (a) => a.type === "asset" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const filteredLiabilityAccounts = accounts.filter(
    (a) => a.type === "liability" && a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const hasFilteredAccountResults =
    filteredAssetAccounts.length > 0 || filteredLiabilityAccounts.length > 0;
  const allFilteredAccounts = [...filteredAssetAccounts, ...filteredLiabilityAccounts];

  const resetForm = () => {
    setDate(new Date());
    setType("expense");
    setCategoryId("");
    setNotes("");
    setStore("");
    setLocation("");
    setAmount("");
    setIsSplit(false);
    setSplits([]);
    setTags([]);
    setCategorySearch("");
    setIsCategoryOpen(false);
    setHighlightedIndex(-1);
    setSelectedAccountId("");
    setAccountSearch("");
    setIsAccountOpen(false);
    setHighlightedAccountIndex(-1);
    setIsNotesSuggestionsOpen(false);
    setIsStoreSuggestionsOpen(false);
    setIsLocationSuggestionsOpen(false);
    setIsTagInputActive(false);
  };

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<Category[]>(
        `/category/list?ignore_group=true`,
      );
      setCategories(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description:
            axiosError.response?.data?.detail || "Failed to fetch categories.",
          status: "error",
        });
      }
    }
  }, []);

  // Fetch accounts if no accountId is provided
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get<Account[]>(
        `/ledger/${ledgerId}/accounts`,
      );
      setAccounts(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description:
            axiosError.response?.data?.detail || "Failed to fetch accounts.",
          status: "error",
        });
      }
    }
  }, [ledgerId]);

  // Initialize form on open
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(new Date());
        setType(initialData.debit > 0 ? "expense" : "income");
        setCategoryId(initialData.category_id || "");
        setNotes(initialData.notes || "");
        setStore(initialData.store || "");
        setLocation(initialData.location || "");
        setAmount(
          initialData.debit > 0
            ? initialData.debit.toString()
            : initialData.credit.toString(),
        );
        setSelectedAccountId(initialData.account_id || "");
        setIsSplit(initialData.is_split);
        setSplits(initialData.splits || []);
        setTags(initialData.tags || []);
      } else {
        resetForm();
      }
      fetchCategories();
      if (!accountId) {
        fetchAccounts();
      }
    }
  }, [isOpen, accountId, fetchCategories, fetchAccounts, initialData]);

  // Category keyboard handler
  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isCategoryOpen) {
          setIsCategoryOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => (total === 0 ? -1 : (prev + 1) % total));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isCategoryOpen && total > 0) {
          setHighlightedIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
        }
        break;
      case "Enter":
        if (isCategoryOpen && highlightedIndex >= 0 && highlightedIndex < total) {
          e.preventDefault();
          const cat = allFilteredCategories[highlightedIndex];
          setCategoryId(cat.category_id);
          setCategorySearch("");
          setIsCategoryOpen(false);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        setIsCategoryOpen(false);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        setIsCategoryOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Account keyboard handler
  const handleAccountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredAccounts.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isAccountOpen) {
          setIsAccountOpen(true);
          setHighlightedAccountIndex(0);
        } else {
          setHighlightedAccountIndex((prev) => (total === 0 ? -1 : (prev + 1) % total));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isAccountOpen && total > 0) {
          setHighlightedAccountIndex((prev) => (prev <= 0 ? total - 1 : prev - 1));
        }
        break;
      case "Enter":
        if (isAccountOpen && highlightedAccountIndex >= 0 && highlightedAccountIndex < total) {
          e.preventDefault();
          const acc = allFilteredAccounts[highlightedAccountIndex];
          setSelectedAccountId(acc.account_id);
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
  };

  // Split toggle handler
  const handleSplitToggle = (isChecked: boolean) => {
    if (!amount || parseFloat(amount) <= 0) {
      notify({
        description: "Amount required before enabling split transactions.",
        status: "error",
      });
      return;
    }

    setIsSplit(isChecked);

    if (isChecked) {
      setSplits([{ amount: amount, categoryId: "" }]);
    } else {
      setSplits([]);
    }
  };

  // Calculate remaining amount
  const calculateRemainingAmount = () => {
    const allocatedAmount = roundToTwoDecimals(
      splits.reduce((sum, split) => {
        return roundToTwoDecimals(
          sum + roundToTwoDecimals(parseFloat(split.amount) || 0),
        );
      }, 0),
    );

    return roundToTwoDecimals((parseFloat(amount) || 0) - allocatedAmount);
  };

  // Submit ref for keyboard shortcut
  const handleSubmitRef = useRef<() => void>(() => {});

  // Form submission
  const handleSubmit = async () => {
    if (categories.length === 0) {
      notify({
        description: "No categories found. Please create categories first.",
        status: "error",
      });
      return;
    }

    if (isSplit) {
      const invalidSplits = splits.filter(
        (split) => !split.categoryId && (parseFloat(split.amount) || 0) > 0,
      );
      if (invalidSplits.length > 0) {
        notify({
          description: "Please select a category for each split.",
          status: "error",
        });
        return;
      }

      const totalSplitAmount = splits.reduce(
        (sum, split) => sum + (parseFloat(split.amount) || 0),
        0,
      );

      if (Math.abs(totalSplitAmount - (parseFloat(amount) || 0)) > 0.01) {
        notify({
          description:
            "The sum of split amounts must equal the total transaction amount.",
          status: "error",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        account_id: parseInt(accountId || selectedAccountId, 10),
        category_id: parseInt(categoryId, 10),
        type: type,
        date: date.toISOString(),
        notes: notes,
        store: store,
        location: location,
        credit: type === "income" ? parseFloat(amount) || 0 : 0,
        debit: type === "expense" ? parseFloat(amount) || 0 : 0,
        is_transfer: false,
        transfer_id: null,
        transfer_type: null,
        is_split: isSplit,
        splits: isSplit
          ? splits
              .filter((split) => (parseFloat(split.amount) || 0) > 0)
              .map((split) => ({
                credit: type === "income" ? parseFloat(split.amount) || 0 : 0,
                debit: type === "expense" ? parseFloat(split.amount) || 0 : 0,
                category_id: parseInt(split.categoryId, 10),
                notes: split.notes,
              }))
          : [],
        tags: tags.map((tag) => ({ name: tag.name })),
      };

      const endpoint =
        type === "income"
          ? `/ledger/${ledgerId}/transaction/income`
          : `/ledger/${ledgerId}/transaction/expense`;

      await api.post(endpoint, payload);

      notify({
        description: "Transaction added successfully.",
        status: "success",
      });

      onClose();
      onTransactionAdded();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description:
            axiosError.response?.data?.detail || "Transaction failed",
          status: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  handleSubmitRef.current = handleSubmit;

  const isSaveDisabled =
    (isSplit && splits.some((split) => (parseFloat(split.amount) || 0) > 0 && !split.categoryId)) ||
    (!isSplit && (!categoryId || (accountId ? !accountId : !selectedAccountId))) ||
    !amount ||
    (isSplit && calculateRemainingAmount() !== 0) ||
    (isSplit && !accountId && !selectedAccountId);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCategoryOpen) {
          e.stopPropagation();
          setIsCategoryOpen(false);
          setHighlightedIndex(-1);
          return;
        }
        if (isAccountOpen) {
          e.stopPropagation();
          setIsAccountOpen(false);
          setHighlightedAccountIndex(-1);
          return;
        }
        if (isNotesSuggestionsOpen || isStoreSuggestionsOpen || isLocationSuggestionsOpen || isSplitDropdownOpen) {
          return;
        }
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        if (isCategoryOpen || isAccountOpen || isNotesSuggestionsOpen || isStoreSuggestionsOpen || isLocationSuggestionsOpen || isTagInputActive || isSplitDropdownOpen) return;
        if (isSaveDisabled || isLoading) return;
        e.preventDefault();
        handleSubmitRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, isCategoryOpen, isAccountOpen, isNotesSuggestionsOpen, isStoreSuggestionsOpen, isLocationSuggestionsOpen, isTagInputActive, isSplitDropdownOpen, isSaveDisabled, isLoading, onClose]);

  return {
    // Form state
    date,
    setDate,
    type,
    setType,
    amount,
    setAmount,
    categoryId,
    setCategoryId,
    selectedAccountId,
    setSelectedAccountId,
    notes,
    setNotes,
    store,
    setStore,
    location,
    setLocation,
    isSplit,
    splits,
    setSplits,
    tags,
    setTags,
    isLoading,

    // Category dropdown
    categorySearch,
    setCategorySearch,
    isCategoryOpen,
    setIsCategoryOpen,
    highlightedIndex,
    setHighlightedIndex,

    // Account dropdown
    accountSearch,
    setAccountSearch,
    isAccountOpen,
    setIsAccountOpen,
    highlightedAccountIndex,
    setHighlightedAccountIndex,

    // Computed values
    categories,
    accounts,
    selectedCategory,
    selectedAccount,
    filteredIncomeCategories,
    filteredExpenseCategories,
    hasFilteredResults,
    allFilteredCategories,
    filteredAssetAccounts,
    filteredLiabilityAccounts,
    hasFilteredAccountResults,
    allFilteredAccounts,

    // Handlers
    handleCategoryKeyDown,
    handleAccountKeyDown,
    handleSplitToggle,
    calculateRemainingAmount,
    handleSubmit,

    // Suggestion states
    setIsNotesSuggestionsOpen,
    setIsStoreSuggestionsOpen,
    setIsLocationSuggestionsOpen,
    setIsTagInputActive,
    setIsSplitDropdownOpen,

    // Context
    ledgerId: ledgerId as string,
    currencySymbol: currencySymbol as string,
    isSaveDisabled,
  };
}
