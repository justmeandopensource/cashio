import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";
import useLedgerStore from "../../shared/store";
import { notify } from "@/components/shared/notify";
import type { Ledger, Transaction, TransferEditData } from "@/types";
import type { Account, Category } from "./types";

interface UseTransferFundsFormParams {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  onTransferCompleted: () => void;
  initialData?: Transaction;
  editTransferData?: TransferEditData;
}

export function useTransferFundsForm({
  isOpen,
  onClose,
  accountId,
  onTransferCompleted,
  initialData,
  editTransferData,
}: UseTransferFundsFormParams) {
  const [date, setDate] = useState<Date>(new Date());
  const [fromAccountId, setFromAccountId] = useState<string>(
    accountId?.toString() || "",
  );
  const [toAccountId, setToAccountId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isDifferentLedger, setIsDifferentLedger] = useState<boolean>(false);
  const [destinationLedgerId, setDestinationLedgerId] = useState<string>("");
  const [destinationCurrencySymbol, setDestinationCurrencySymbol] =
    useState<string>("");
  const [destinationAmount, setDestinationAmount] = useState<string>("");
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [destinationAccounts, setDestinationAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<number>(0);

  // Searchable dropdown state -- From Account
  const [fromAccountSearch, setFromAccountSearch] = useState<string>("");
  const [isFromAccountOpen, setIsFromAccountOpen] = useState<boolean>(false);
  const [highlightedFromIndex, setHighlightedFromIndex] = useState<number>(-1);

  // Searchable dropdown state -- To Account
  const [toAccountSearch, setToAccountSearch] = useState<string>("");
  const [isToAccountOpen, setIsToAccountOpen] = useState<boolean>(false);
  const [highlightedToIndex, setHighlightedToIndex] = useState<number>(-1);

  // Fee state
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [feeCategoryId, setFeeCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [feeCategorySearch, setFeeCategorySearch] = useState<string>("");
  const [isFeeCategoryOpen, setIsFeeCategoryOpen] = useState<boolean>(false);
  const [highlightedFeeCategoryIndex, setHighlightedFeeCategoryIndex] = useState<number>(-1);

  // Notes suggestions open state (for keyboard shortcut guard)
  const [isNotesSuggestionsOpen, setIsNotesSuggestionsOpen] = useState<boolean>(false);

  // Track initial edit state for change detection
  const initialEditStateRef = useRef<{
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    notes: string;
    date: string;
    isDifferentLedger: boolean;
    destinationLedgerId: string;
    destinationAmount: string;
    feeAmount: string;
    feeCategoryId: string;
  } | null>(null);

  const isEditMode = !!editTransferData;

  const queryClient = useQueryClient();
  const { ledgerId, currencySymbol } = useLedgerStore();

  function formatCurrency(value: number) {
    const locale = currencySymbol === "\u20B9" ? "en-IN" : "en-US";
    return `${currencySymbol}${Math.abs(value).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Computed filtered accounts -- From
  const selectedFromAccount = accounts.find(a => a.account_id === fromAccountId);
  const filteredFromAssetAccounts = accounts.filter(
    a => a.type === "asset" && a.name.toLowerCase().includes(fromAccountSearch.toLowerCase()),
  );
  const filteredFromLiabilityAccounts = accounts.filter(
    a => a.type === "liability" && a.name.toLowerCase().includes(fromAccountSearch.toLowerCase()),
  );
  const allFilteredFromAccounts = [...filteredFromAssetAccounts, ...filteredFromLiabilityAccounts];
  const hasFilteredFromResults = allFilteredFromAccounts.length > 0;

  // Computed filtered accounts -- To (excludes fromAccountId when same ledger)
  const toAccountsSource = (isDifferentLedger ? destinationAccounts : accounts).filter(
    a => a.account_id !== fromAccountId,
  );
  const selectedToAccount = isDifferentLedger
    ? destinationAccounts.find(a => a.account_id === toAccountId)
    : accounts.find(a => a.account_id === toAccountId);
  const filteredToAssetAccounts = toAccountsSource.filter(
    a => a.type === "asset" && a.name.toLowerCase().includes(toAccountSearch.toLowerCase()),
  );
  const filteredToLiabilityAccounts = toAccountsSource.filter(
    a => a.type === "liability" && a.name.toLowerCase().includes(toAccountSearch.toLowerCase()),
  );
  const allFilteredToAccounts = [...filteredToAssetAccounts, ...filteredToLiabilityAccounts];
  const hasFilteredToResults = allFilteredToAccounts.length > 0;

  // Computed fee category
  const selectedFeeCategory = categories.find(c => c.category_id === feeCategoryId);
  const filteredFeeCategories = categories.filter(
    c => c.name.toLowerCase().includes(feeCategorySearch.toLowerCase()),
  );

  const isOverBalance =
    !!fromAccountId &&
    !!amount &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) > selectedAccountBalance;

  const resetForm = useCallback(() => {
    setDate(new Date());
    setFromAccountId(accountId?.toString() || "");
    setToAccountId("");
    setAmount("");
    setNotes("");
    setIsDifferentLedger(false);
    setDestinationLedgerId("");
    setDestinationCurrencySymbol("");
    setDestinationAmount("");
    setFromAccountSearch("");
    setIsFromAccountOpen(false);
    setHighlightedFromIndex(-1);
    setToAccountSearch("");
    setIsToAccountOpen(false);
    setHighlightedToIndex(-1);
    setFeeAmount("");
    setFeeCategoryId("");
    setFeeCategorySearch("");
    setIsFeeCategoryOpen(false);
    setHighlightedFeeCategoryIndex(-1);
    setIsNotesSuggestionsOpen(false);
  }, [accountId]);

  const fetchLedgers = useCallback(async () => {
    try {
      const response = await api.get<Ledger[]>("/ledger/list");
      setLedgers(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description: axiosError.response?.data?.detail || "Failed to fetch ledgers.",
          status: "error",
        });
      }
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get<Account[]>(`/ledger/${ledgerId}/accounts`);
      setAccounts(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description: axiosError.response?.data?.detail || "Failed to fetch accounts.",
          status: "error",
        });
      }
    }
  }, [ledgerId]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<Category[]>("/category/list?ignore_group=true");
      setCategories(response.data.filter(c => c.type === "expense"));
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description: axiosError.response?.data?.detail || "Failed to fetch categories.",
          status: "error",
        });
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editTransferData) {
        // For edit mode, fetch all required data first, then populate form
        const initEditMode = async () => {
          // Fetch accounts, ledgers, and categories in parallel
          await Promise.all([fetchLedgers(), fetchAccounts(), fetchCategories()]);

          const srcTx = editTransferData.source_transaction;
          const destTx = editTransferData.destination_transaction;
          setDate(new Date(srcTx.date));
          setFromAccountId(srcTx.account_id ?? "");
          setNotes(srcTx.notes || "");

          // Check if cross-ledger
          const isCrossLedger = editTransferData.source_ledger_id !== editTransferData.destination_ledger_id;
          setIsDifferentLedger(isCrossLedger);
          if (isCrossLedger) {
            setDestinationAmount(String(destTx.credit));
            setDestinationLedgerId(String(editTransferData.destination_ledger_id ?? ""));
            // Fetch destination accounts so the To Account dropdown populates
            try {
              const destAccResponse = await api.get<Account[]>(
                `/ledger/${editTransferData.destination_ledger_id}/accounts`
              );
              setDestinationAccounts(destAccResponse.data);
            } catch {
              // Silently fail -- dropdown will be empty
            }
          } else {
            setDestinationAmount("");
            setDestinationLedgerId("");
          }

          // Now set toAccountId after destination accounts are loaded
          setToAccountId(destTx.account_id ?? "");

          setFromAccountSearch("");
          setIsFromAccountOpen(false);
          setHighlightedFromIndex(-1);
          setToAccountSearch("");
          setIsToAccountOpen(false);
          setHighlightedToIndex(-1);
          setIsNotesSuggestionsOpen(false);

          // If source tx has splits (fee), fetch them to separate transfer amount from fee
          let resolvedAmount = String(srcTx.debit);
          let resolvedFeeAmount = "";
          let resolvedFeeCategoryId: string | number = "";

          if (srcTx.is_split) {
            try {
              const splitsRes = await api.get(
                `/ledger/${ledgerId}/transaction/${srcTx.transaction_id}/splits`
              );
              const splits = splitsRes.data;
              const feeSplit = splits.find((s: any) => s.category_id !== null);
              const transferSplit = splits.find((s: any) => s.category_id === null);
              resolvedAmount = String(transferSplit ? transferSplit.debit : srcTx.debit);
              if (feeSplit) {
                resolvedFeeAmount = String(feeSplit.debit);
                // Keep as raw value (number) for dropdown matching
                resolvedFeeCategoryId = feeSplit.category_id ?? "";
              }
            } catch {
              // Keep defaults
            }
          }

          setAmount(resolvedAmount);
          setFeeAmount(resolvedFeeAmount);
          setFeeCategoryId(resolvedFeeCategoryId as string);
          setFeeCategorySearch("");
          setIsFeeCategoryOpen(false);
          setHighlightedFeeCategoryIndex(-1);

          // Save initial state for change detection -- stringify all IDs
          // so comparisons work consistently regardless of type
          const isCL = editTransferData.source_ledger_id !== editTransferData.destination_ledger_id;
          initialEditStateRef.current = {
            fromAccountId: String(srcTx.account_id ?? ""),
            toAccountId: String(destTx.account_id ?? ""),
            amount: resolvedAmount,
            notes: srcTx.notes || "",
            date: new Date(srcTx.date).toDateString(),
            isDifferentLedger: isCL,
            destinationLedgerId: isCL ? String(editTransferData.destination_ledger_id ?? "") : "",
            destinationAmount: isCL ? String(destTx.credit) : "",
            feeAmount: resolvedFeeAmount,
            feeCategoryId: String(resolvedFeeCategoryId),
          };
        };
        initEditMode();
      } else if (initialData) {
        if (initialData.is_transfer && initialData.transfer_id) {
          // For transfer copies, fetch full transfer details to properly
          // populate source/destination accounts, amounts, and fees
          const initCopyTransfer = async () => {
            const [,, , transferRes] = await Promise.all([
              fetchLedgers(),
              fetchAccounts(),
              fetchCategories(),
              api.get(`/ledger/transfer/${initialData.transfer_id}`),
            ]);
            const transferData = transferRes.data;
            const srcTx = transferData.source_transaction;
            const destTx = transferData.destination_transaction;

            setDate(new Date());
            setFromAccountId(srcTx.account_id ?? "");
            setNotes(srcTx.notes || "");

            // Cross-ledger detection
            const isCrossLedger = transferData.source_ledger_id !== transferData.destination_ledger_id;
            setIsDifferentLedger(isCrossLedger);
            if (isCrossLedger) {
              setDestinationAmount(String(destTx.credit));
              setDestinationLedgerId(String(transferData.destination_ledger_id ?? ""));
              try {
                const destAccResponse = await api.get<Account[]>(
                  `/ledger/${transferData.destination_ledger_id}/accounts`
                );
                setDestinationAccounts(destAccResponse.data);
              } catch {
                // Silently fail
              }
            } else {
              setDestinationAmount("");
              setDestinationLedgerId("");
            }

            setToAccountId(destTx.account_id ?? "");

            setFromAccountSearch("");
            setIsFromAccountOpen(false);
            setHighlightedFromIndex(-1);
            setToAccountSearch("");
            setIsToAccountOpen(false);
            setHighlightedToIndex(-1);
            setIsNotesSuggestionsOpen(false);

            // Handle fee splits
            let resolvedAmount = String(srcTx.debit);
            let resolvedFeeAmount = "";
            let resolvedFeeCategoryId: string | number = "";

            if (srcTx.is_split) {
              try {
                const splitsRes = await api.get(
                  `/ledger/${ledgerId}/transaction/${srcTx.transaction_id}/splits`
                );
                const splits = splitsRes.data;
                const feeSplit = splits.find((s: any) => s.category_id !== null);
                const transferSplit = splits.find((s: any) => s.category_id === null);
                resolvedAmount = String(transferSplit ? transferSplit.debit : srcTx.debit);
                if (feeSplit) {
                  resolvedFeeAmount = String(feeSplit.debit);
                  resolvedFeeCategoryId = feeSplit.category_id ?? "";
                }
              } catch {
                // Keep defaults
              }
            }

            setAmount(resolvedAmount);
            setFeeAmount(resolvedFeeAmount);
            setFeeCategoryId(resolvedFeeCategoryId as string);
            setFeeCategorySearch("");
            setIsFeeCategoryOpen(false);
            setHighlightedFeeCategoryIndex(-1);
          };
          initCopyTransfer();
        } else {
          // Non-transfer copy
          setDate(new Date());
          setFromAccountId(initialData.account_id || "");
          setToAccountId("");
          setAmount(
            initialData.debit > 0
              ? initialData.debit.toString()
              : initialData.credit.toString(),
          );
          setNotes(initialData.notes || "");
          setIsDifferentLedger(false);
          setDestinationLedgerId("");
          setDestinationAmount("");
          fetchLedgers();
          fetchAccounts();
          fetchCategories();
        }
      } else {
        resetForm();
        fetchLedgers();
        fetchAccounts();
        fetchCategories();
      }
    } else {
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setNotes("");
      setIsDifferentLedger(false);
      setDestinationLedgerId("");
      setDestinationAmount("");
      initialEditStateRef.current = null;
    }
  }, [isOpen, resetForm, fetchLedgers, fetchAccounts, fetchCategories, initialData, editTransferData, ledgerId]);

  const fetchDestinationAccounts = useCallback(
    async (destLedgerId: string) => {
      try {
        const response = await api.get<Account[]>(`/ledger/${destLedgerId}/accounts`);
        setDestinationAccounts(response.data);
      } catch (error) {
        const axiosError = error as AxiosError<{ detail: string }>;
        if (axiosError.response?.status !== 401) {
          notify({
            description: axiosError.response?.data?.detail || "Failed to fetch accounts.",
            status: "error",
            });
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (isDifferentLedger && destinationLedgerId) {
      fetchDestinationAccounts(destinationLedgerId);
      // Set currency symbol from ledger list if available
      const destLedger = ledgers.find(l => l.ledger_id.toString() === destinationLedgerId);
      if (destLedger) {
        setDestinationCurrencySymbol(destLedger.currency_symbol);
      }
    }
  }, [isDifferentLedger, destinationLedgerId, fetchDestinationAccounts, ledgers]);

  useEffect(() => {
    if (fromAccountId) {
      api.get(`/ledger/${ledgerId}/account/${fromAccountId}`)
        .then(response => {
          setSelectedAccountBalance(response.data.net_balance || 0);
        })
        .catch(() => setSelectedAccountBalance(0));
    } else {
      setSelectedAccountBalance(0);
    }
  }, [fromAccountId, ledgerId]);

  const getFilteredLedgers = (ledgerList: Ledger[]) =>
    ledgerList.filter(ledger => ledger.ledger_id != ledgerId);

  const handleFromAccountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredFromAccounts.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isFromAccountOpen) {
          setIsFromAccountOpen(true);
          setHighlightedFromIndex(0);
        } else {
          setHighlightedFromIndex(prev => total === 0 ? -1 : (prev + 1) % total);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isFromAccountOpen && total > 0) {
          setHighlightedFromIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        }
        break;
      case "Enter":
        if (isFromAccountOpen && highlightedFromIndex >= 0 && highlightedFromIndex < total) {
          e.preventDefault();
          const acc = allFilteredFromAccounts[highlightedFromIndex];
          setFromAccountId(acc.account_id);
          setFromAccountSearch("");
          setIsFromAccountOpen(false);
          setHighlightedFromIndex(-1);
        }
        break;
      case "Escape":
        setIsFromAccountOpen(false);
        setHighlightedFromIndex(-1);
        break;
      case "Tab":
        setIsFromAccountOpen(false);
        setHighlightedFromIndex(-1);
        break;
    }
  };

  const handleToAccountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredToAccounts.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isToAccountOpen) {
          setIsToAccountOpen(true);
          setHighlightedToIndex(0);
        } else {
          setHighlightedToIndex(prev => total === 0 ? -1 : (prev + 1) % total);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isToAccountOpen && total > 0) {
          setHighlightedToIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        }
        break;
      case "Enter":
        if (isToAccountOpen && highlightedToIndex >= 0 && highlightedToIndex < total) {
          e.preventDefault();
          const acc = allFilteredToAccounts[highlightedToIndex];
          setToAccountId(acc.account_id);
          setToAccountSearch("");
          setIsToAccountOpen(false);
          setHighlightedToIndex(-1);
        }
        break;
      case "Escape":
        setIsToAccountOpen(false);
        setHighlightedToIndex(-1);
        break;
      case "Tab":
        setIsToAccountOpen(false);
        setHighlightedToIndex(-1);
        break;
    }
  };

  const handleFeeCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = filteredFeeCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isFeeCategoryOpen) {
          setIsFeeCategoryOpen(true);
          setHighlightedFeeCategoryIndex(0);
        } else {
          setHighlightedFeeCategoryIndex(prev => total === 0 ? -1 : (prev + 1) % total);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isFeeCategoryOpen && total > 0) {
          setHighlightedFeeCategoryIndex(prev => prev <= 0 ? total - 1 : prev - 1);
        }
        break;
      case "Enter":
        if (isFeeCategoryOpen && highlightedFeeCategoryIndex >= 0 && highlightedFeeCategoryIndex < total) {
          e.preventDefault();
          const cat = filteredFeeCategories[highlightedFeeCategoryIndex];
          setFeeCategoryId(cat.category_id);
          setFeeCategorySearch("");
          setIsFeeCategoryOpen(false);
          setHighlightedFeeCategoryIndex(-1);
        }
        break;
      case "Escape":
        setIsFeeCategoryOpen(false);
        setHighlightedFeeCategoryIndex(-1);
        break;
      case "Tab":
        setIsFeeCategoryOpen(false);
        setHighlightedFeeCategoryIndex(-1);
        break;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        source_account_id: fromAccountId,
        destination_account_id: toAccountId,
        date: date.toISOString(),
        source_amount: parseFloat(amount),
        notes: notes || "Fund Transfer",
        destination_amount: destinationAmount ? parseFloat(destinationAmount) : null,
        fee_amount: feeAmount && parseFloat(feeAmount) > 0 ? parseFloat(feeAmount) : null,
        fee_category_id: feeCategoryId || null,
      };

      if (isEditMode && editTransferData) {
        await api.put(
          `/ledger/${ledgerId}/transfer/${editTransferData.transfer_id}`,
          payload,
        );
      } else {
        await api.post(`/ledger/${ledgerId}/transaction/transfer`, payload);
      }
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });

      notify({
        description: isEditMode
          ? "Transfer updated successfully."
          : "Transfer completed successfully.",
        status: "success",
      });

      onClose();
      onTransferCompleted();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        notify({
          description: axiosError.response?.data?.detail || (isEditMode ? "Update failed" : "Transfer failed"),
          status: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Always points to latest handleSubmit -- used in keyboard shortcut effect
  const handleSubmitRef = useRef<() => void>(() => {});
  handleSubmitRef.current = handleSubmit;

  // Check if form has changed from initial edit state
  // Use String() coercion for ID comparisons since values may be numbers or strings
  const hasEditChanges = isEditMode && initialEditStateRef.current ? (
    String(fromAccountId) !== initialEditStateRef.current.fromAccountId ||
    String(toAccountId) !== initialEditStateRef.current.toAccountId ||
    amount !== initialEditStateRef.current.amount ||
    notes !== initialEditStateRef.current.notes ||
    date.toDateString() !== initialEditStateRef.current.date ||
    isDifferentLedger !== initialEditStateRef.current.isDifferentLedger ||
    String(destinationLedgerId) !== initialEditStateRef.current.destinationLedgerId ||
    destinationAmount !== initialEditStateRef.current.destinationAmount ||
    feeAmount !== initialEditStateRef.current.feeAmount ||
    String(feeCategoryId) !== initialEditStateRef.current.feeCategoryId
  ) : true;

  const isSaveDisabled =
    !fromAccountId ||
    !toAccountId ||
    !amount ||
    (isDifferentLedger && (!destinationLedgerId || !destinationAmount)) ||
    (isEditMode && !hasEditChanges);

  // Keyboard shortcuts: Enter to submit, Escape closes dropdowns before the modal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFromAccountOpen) {
          e.stopPropagation();
          setIsFromAccountOpen(false);
          setHighlightedFromIndex(-1);
          return;
        }
        if (isToAccountOpen) {
          e.stopPropagation();
          setIsToAccountOpen(false);
          setHighlightedToIndex(-1);
          return;
        }
        if (isFeeCategoryOpen) {
          e.stopPropagation();
          setIsFeeCategoryOpen(false);
          setHighlightedFeeCategoryIndex(-1);
          return;
        }
        if (isNotesSuggestionsOpen) {
          return;
        }
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        if (isFromAccountOpen || isToAccountOpen || isFeeCategoryOpen || isNotesSuggestionsOpen) return;
        if (isSaveDisabled || isLoading) return;
        e.preventDefault();
        handleSubmitRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, isFromAccountOpen, isToAccountOpen, isFeeCategoryOpen, isNotesSuggestionsOpen, isSaveDisabled, isLoading, onClose]);

  return {
    // Core form state
    date,
    setDate,
    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
    amount,
    setAmount,
    notes,
    setNotes,
    isDifferentLedger,
    setIsDifferentLedger,
    destinationLedgerId,
    setDestinationLedgerId,
    destinationCurrencySymbol,
    destinationAmount,
    setDestinationAmount,
    ledgers,
    accounts,
    destinationAccounts,
    isLoading,
    selectedAccountBalance,

    // From account dropdown
    fromAccountSearch,
    setFromAccountSearch,
    isFromAccountOpen,
    setIsFromAccountOpen,
    highlightedFromIndex,
    setHighlightedFromIndex,

    // To account dropdown
    toAccountSearch,
    setToAccountSearch,
    isToAccountOpen,
    setIsToAccountOpen,
    highlightedToIndex,
    setHighlightedToIndex,

    // Fee state
    feeAmount,
    setFeeAmount,
    feeCategoryId,
    setFeeCategoryId,
    feeCategorySearch,
    setFeeCategorySearch,
    isFeeCategoryOpen,
    setIsFeeCategoryOpen,
    highlightedFeeCategoryIndex,
    setHighlightedFeeCategoryIndex,

    // Notes suggestions
    isNotesSuggestionsOpen,
    setIsNotesSuggestionsOpen,

    // Computed values
    isEditMode,
    ledgerId,
    currencySymbol,
    formatCurrency,
    isOverBalance,
    selectedFromAccount,
    filteredFromAssetAccounts,
    filteredFromLiabilityAccounts,
    allFilteredFromAccounts,
    hasFilteredFromResults,
    selectedToAccount,
    filteredToAssetAccounts,
    filteredToLiabilityAccounts,
    hasFilteredToResults,
    selectedFeeCategory,
    filteredFeeCategories,
    getFilteredLedgers,
    isSaveDisabled,

    // Handlers
    handleFromAccountKeyDown,
    handleToAccountKeyDown,
    handleFeeCategoryKeyDown,
    handleSubmit,
  };
}
