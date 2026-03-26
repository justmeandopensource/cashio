import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";
import useLedgerStore from "@/components/shared/store";
import { notify } from "@/components/shared/notify";
import type { Split, ApiSplit, Tag, InitialTransactionState, Category } from "@/types";

const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export function useEditTransactionForm(
  isOpen: boolean,
  transaction: any,
  onClose: () => void,
  onTransactionUpdated: () => void,
) {
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [store, setStore] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initialTransactionState, setInitialTransactionState] =
    useState<InitialTransactionState | null>(null);
  const [isNotesSuggestionsOpen, setIsNotesSuggestionsOpen] = useState<boolean>(false);
  const [isStoreSuggestionsOpen, setIsStoreSuggestionsOpen] = useState<boolean>(false);
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState<boolean>(false);
  const [isTagInputActive, setIsTagInputActive] = useState<boolean>(false);
  const [isSplitDropdownOpen, setIsSplitDropdownOpen] = useState<boolean>(false);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);

  const selectedCategory = categories.find((c) => String(c.category_id) === String(categoryId));
  const filteredIncomeCategories = categories.filter(
    (c) => c.type === "income" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const filteredExpenseCategories = categories.filter(
    (c) => c.type === "expense" && c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const hasFilteredResults =
    filteredIncomeCategories.length > 0 || filteredExpenseCategories.length > 0;
  const allFilteredCategories = [...filteredIncomeCategories, ...filteredExpenseCategories];

  const fetchSplits = useCallback(
    async (transactionId: string): Promise<Split[]> => {
      try {
        const response = await api.get<ApiSplit[]>(
          `/ledger/${ledgerId}/transaction/${transactionId}/splits`,
        );
        const fetchedSplits = response.data.map((split) => ({
          amount: (split.debit > 0 ? split.debit : split.credit).toString(),
          categoryId: split.category_id.toString(),
          notes: split.notes,
        }));
        setSplits(fetchedSplits);
        return fetchedSplits;
      } catch (error) {
        const axiosError = error as AxiosError<{ detail: string }>;
        if (axiosError.response?.status !== 401) {
          notify({
            description:
              axiosError.response?.data?.detail || "Failed to fetch splits.",
            status: "error",
              });
        }
        return [];
      }
    },
    [ledgerId],
  );

  useEffect(() => {
    if (isOpen && transaction) {
      const initialType = transaction.credit > 0 ? "income" : "expense";
      const initialAmount =
        transaction.credit > 0
          ? transaction.credit.toString()
          : transaction.debit.toString();
      const initialDate = new Date(transaction.date);
      const initialNotes = transaction.notes || "";
      const initialStore = transaction.store || "";
      const initialLocation = transaction.location || "";
      const initialTags = transaction.tags || [];
      const initialCategoryId = transaction.category_id
        ? String(transaction.category_id)
        : "";
      const initialIsSplit = transaction.is_split;

      setDate(initialDate);
      setNotes(initialNotes);
      setStore(initialStore);
      setLocation(initialLocation);
      setTags(initialTags);
      setType(initialType);
      setCategoryId(initialCategoryId);
      setAmount(initialAmount);
      setIsSplit(initialIsSplit);
      setCategorySearch("");
      setIsCategoryOpen(false);
      setHighlightedIndex(-1);
      setIsNotesSuggestionsOpen(false);
      setIsStoreSuggestionsOpen(false);
      setIsLocationSuggestionsOpen(false);
      setIsTagInputActive(false);

      if (initialIsSplit) {
        fetchSplits(transaction.transaction_id).then((fetchedSplits) => {
          setInitialTransactionState({
            date: initialDate,
            type: initialType,
            categoryId: initialCategoryId,
            notes: initialNotes,
            store: initialStore,
            location: initialLocation,
            amount: initialAmount,
            isSplit: initialIsSplit,
            splits: fetchedSplits,
            tags: initialTags,
          });
        });
      } else {
        setInitialTransactionState({
          date: initialDate,
          type: initialType,
          categoryId: initialCategoryId,
          notes: initialNotes,
          store: initialStore,
          location: initialLocation,
          amount: initialAmount,
          isSplit: initialIsSplit,
          splits: [],
          tags: initialTags,
        });
      }
    }
  }, [isOpen, transaction, fetchSplits]);

  // Fetch categories based on the transaction type
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

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

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

  // Handle split transaction toggle
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

  // Always points to latest handleSubmit — used in keyboard shortcut effect
  const handleSubmitRef = useRef<() => void>(() => {});

  // Handle form submission
  const handleSubmit = async () => {
    if (categories.length === 0) {
      notify({
        description: "No categories found. Please create categories first.",
        status: "error",
      });
      return;
    }

    // Validate all splits have categories if split is enabled
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
        category_id: parseInt(categoryId, 10),
        type: type,
        date: date.toISOString(),
        notes: notes,
        store: store,
        location: location,
        credit: type === "income" ? parseFloat(amount) || 0 : 0,
        debit: type === "expense" ? parseFloat(amount) || 0 : 0,
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
      await api.put(
        `/ledger/${ledgerId}/transaction/${transaction.transaction_id}`,
        payload,
      );

      notify({
        description: "Transaction updated successfully.",
        status: "success",
      });

      onClose();
      onTransactionUpdated();
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

  // Update ref on every render so the keyboard effect never goes stale
  handleSubmitRef.current = handleSubmit;

  const hasFormChanged = useCallback(() => {
    if (!initialTransactionState) return false;

    if (
      date.toISOString() !== initialTransactionState.date.toISOString() ||
      type !== initialTransactionState.type ||
      categoryId !== initialTransactionState.categoryId ||
      notes !== initialTransactionState.notes ||
      store !== initialTransactionState.store ||
      location !== initialTransactionState.location ||
      parseFloat(amount) !== parseFloat(initialTransactionState.amount) ||
      isSplit !== initialTransactionState.isSplit
    ) {
      return true;
    }

    if (splits.length !== initialTransactionState.splits.length) {
      return true;
    }
    for (let i = 0; i < splits.length; i++) {
      if (
        parseFloat(splits[i].amount) !==
          parseFloat(initialTransactionState.splits[i].amount) ||
        splits[i].categoryId !== initialTransactionState.splits[i].categoryId ||
        splits[i].notes !== initialTransactionState.splits[i].notes
      ) {
        return true;
      }
    }

    if (tags.length !== initialTransactionState.tags.length) {
      return true;
    }
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].name !== initialTransactionState.tags[i].name) {
        return true;
      }
    }

    return false;
  }, [
    date,
    type,
    categoryId,
    notes,
    store,
    location,
    amount,
    isSplit,
    splits,
    tags,
    initialTransactionState,
  ]);

  const isSaveDisabled =
    isLoading ||
    !hasFormChanged() ||
    (isSplit &&
      (splits.some(
        (split) => (parseFloat(split.amount) || 0) > 0 && !split.categoryId,
      ) ||
        calculateRemainingAmount() !== 0)) ||
    (!isSplit && !categoryId) ||
    !amount;

  // Keyboard shortcuts: Enter to submit, Escape closes dropdowns before the modal
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
        if (isCategoryOpen || isNotesSuggestionsOpen || isStoreSuggestionsOpen || isLocationSuggestionsOpen || isTagInputActive || isSplitDropdownOpen) return;
        if (isSaveDisabled || isLoading) return;
        e.preventDefault();
        handleSubmitRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, isCategoryOpen, isNotesSuggestionsOpen, isStoreSuggestionsOpen, isLocationSuggestionsOpen, isTagInputActive, isSplitDropdownOpen, isSaveDisabled, isLoading, onClose]);

  return {
    // State values
    date,
    setDate,
    type,
    setType,
    categoryId,
    setCategoryId,
    notes,
    setNotes,
    store,
    setStore,
    location,
    setLocation,
    amount,
    setAmount,
    isSplit,
    splits,
    setSplits,
    categories,
    tags,
    setTags,
    isLoading,
    categorySearch,
    setCategorySearch,
    isCategoryOpen,
    setIsCategoryOpen,
    highlightedIndex,
    setHighlightedIndex,
    ledgerId,
    currencySymbol,

    // Derived values
    selectedCategory,
    filteredIncomeCategories,
    filteredExpenseCategories,
    hasFilteredResults,
    isSaveDisabled,

    // Handlers
    handleCategoryKeyDown,
    handleSplitToggle,
    calculateRemainingAmount,
    handleSubmit,

    // Dropdown state setters (for child components)
    setIsNotesSuggestionsOpen,
    setIsStoreSuggestionsOpen,
    setIsLocationSuggestionsOpen,
    setIsTagInputActive,
    setIsSplitDropdownOpen,
  };
}
