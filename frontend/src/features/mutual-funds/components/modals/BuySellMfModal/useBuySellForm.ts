import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { buyMutualFund, sellMutualFund } from "../../../api";
import type { MfTransactionCreate } from "../../../types";
import useLedgerStore from "@/components/shared/store";
import type { Account } from "@/types";
import type { FormData, BuySellMfModalProps } from "./types";

export function useBuySellForm({
  isOpen,
  onClose,
  fund,
  onSuccess,
}: BuySellMfModalProps) {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const queryClient = useQueryClient();
  const [tabIndex, setTabIndex] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    mutual_fund_id: fund?.mutual_fund_id.toString() || "",
    units: "",
    amount_excluding_charges: "",
    other_charges: "",
    expense_category_id: "",
    account_id: "",
    transaction_date: new Date(),
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Searchable dropdown state — Account
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [highlightedAccountIndex, setHighlightedAccountIndex] =
    useState<number>(-1);

  // Searchable dropdown state — Expense Category
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] =
    useState<number>(-1);

  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["accounts", ledgerId],
    queryFn: async () => {
      const response = await api.get(`/ledger/${Number(ledgerId)}/accounts`);
      return response.data;
    },
    enabled: !!ledgerId && isOpen,
  });

  const { data: expenseCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", ledgerId, "expense"],
    queryFn: async () => {
      const response = await api.get(
        `/category/list?type=expense&ignore_group=true`,
      );
      return response.data;
    },
    enabled: !!ledgerId && isOpen,
  });

  const resetDropdownState = () => {
    setAccountSearch("");
    setIsAccountOpen(false);
    setHighlightedAccountIndex(-1);
    setCategorySearch("");
    setIsCategoryOpen(false);
    setHighlightedCategoryIndex(-1);
  };

  const transactionMutation = useMutation({
    mutationFn: (transactionData: MfTransactionCreate) => {
      if (transactionData.transaction_type === "buy") {
        return buyMutualFund(Number(ledgerId), transactionData);
      } else {
        return sellMutualFund(Number(ledgerId), transactionData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mutual-funds", ledgerId],
      });
      queryClient.invalidateQueries({ queryKey: ["accounts", ledgerId] });
      queryClient.invalidateQueries({
        queryKey: ["transactions", ledgerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["fund-transactions", ledgerId],
      });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else {
        setErrors({
          general: `Failed to ${tabIndex === 0 ? "buy" : "sell"} mutual fund units. Please try again.`,
        });
      }
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && fund) {
      setTabIndex(0);
      setFormData({
        mutual_fund_id: fund.mutual_fund_id.toString(),
        units: "",
        amount_excluding_charges: "",
        other_charges: "",
        expense_category_id: "",
        account_id: "",
        transaction_date: new Date(),
        notes: "",
      });
      setErrors({});
      resetDropdownState();
    }
  }, [isOpen, fund]);

  // Computed filtered accounts
  const selectedAccount = (accounts || []).find(
    (a) => a.account_id.toString() === formData.account_id,
  );
  const filteredAssetAccounts = (accounts || []).filter(
    (a) =>
      a.type === "asset" &&
      a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const filteredLiabilityAccounts = (accounts || []).filter(
    (a) =>
      a.type === "liability" &&
      a.name.toLowerCase().includes(accountSearch.toLowerCase()),
  );
  const allFilteredAccounts = [
    ...filteredAssetAccounts,
    ...filteredLiabilityAccounts,
  ];
  const hasFilteredAccountResults = allFilteredAccounts.length > 0;

  // Computed filtered expense categories
  const selectedCategory = (expenseCategories || []).find(
    (c: any) => c.category_id.toString() === formData.expense_category_id,
  );
  const filteredCategories = (expenseCategories || []).filter((c: any) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const hasFilteredCategoryResults = filteredCategories.length > 0;

  const handleAccountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allFilteredAccounts.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isAccountOpen) {
          setIsAccountOpen(true);
          setHighlightedAccountIndex(0);
        } else {
          setHighlightedAccountIndex((prev) =>
            total === 0 ? -1 : (prev + 1) % total,
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isAccountOpen && total > 0)
          setHighlightedAccountIndex((prev) =>
            prev <= 0 ? total - 1 : prev - 1,
          );
        break;
      case "Enter":
        if (
          isAccountOpen &&
          highlightedAccountIndex >= 0 &&
          highlightedAccountIndex < total
        ) {
          e.preventDefault();
          const acc = allFilteredAccounts[highlightedAccountIndex];
          handleInputChange("account_id", acc.account_id.toString());
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

  const handleCategoryKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    const total = filteredCategories.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isCategoryOpen) {
          setIsCategoryOpen(true);
          setHighlightedCategoryIndex(0);
        } else {
          setHighlightedCategoryIndex((prev) =>
            total === 0 ? -1 : (prev + 1) % total,
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isCategoryOpen && total > 0)
          setHighlightedCategoryIndex((prev) =>
            prev <= 0 ? total - 1 : prev - 1,
          );
        break;
      case "Enter":
        if (
          isCategoryOpen &&
          highlightedCategoryIndex >= 0 &&
          highlightedCategoryIndex < total
        ) {
          e.preventDefault();
          const cat = filteredCategories[highlightedCategoryIndex];
          handleInputChange("expense_category_id", cat.category_id.toString());
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
  };

  const handleClose = () => {
    transactionMutation.reset();
    setFormData({
      mutual_fund_id: fund?.mutual_fund_id.toString() || "",
      units: "",
      amount_excluding_charges: "",
      other_charges: "",
      expense_category_id: "",
      account_id: "",
      transaction_date: new Date(),
      notes: "",
    });
    setErrors({});
    resetDropdownState();
    onClose();
  };

  const handleInputChange = (field: keyof FormData, value: string | Date) => {
    let processedValue: string | Date = value;

    // For transaction_date field, value is Date
    if (field === "transaction_date") {
      processedValue = value as Date;
    } else {
      // For units field, limit to 3 decimal places
      if (field === "units") {
        const stringValue = value as string;
        // Allow empty string, numbers, and decimal point
        if (stringValue === "" || /^\d*\.?\d*$/.test(stringValue)) {
          // Check if there are more than 3 decimal places
          const decimalPart = stringValue.split(".")[1];
          if (decimalPart && decimalPart.length > 3) {
            // Truncate to 3 decimal places
            const integerPart = stringValue.split(".")[0];
            processedValue = `${integerPart}.${decimalPart.substring(0, 3)}`;
          }
        } else {
          // If invalid characters, don't update
          return;
        }
      }

      // For amount_excluding_charges and other_charges fields, limit to 2 decimal places
      if (field === "amount_excluding_charges" || field === "other_charges") {
        const stringValue = value as string;
        // Allow empty string, numbers, and decimal point
        if (stringValue === "" || /^\d*\.?\d*$/.test(stringValue)) {
          // Check if there are more than 2 decimal places
          const decimalPart = stringValue.split(".")[1];
          if (decimalPart && decimalPart.length > 2) {
            // Truncate to 2 decimal places
            const integerPart = stringValue.split(".")[0];
            processedValue = `${integerPart}.${decimalPart.substring(0, 2)}`;
          }
        } else {
          // If invalid characters, don't update
          return;
        }
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const selectedFund = fund;
  const totalUnits = selectedFund ? Number(selectedFund.total_units) : 0;
  const currentType = tabIndex === 0 ? ("buy" as const) : ("sell" as const);
  const amountExcludingCharges =
    parseFloat(formData.amount_excluding_charges) || 0;
  const units = parseFloat(formData.units) || 0;
  const navPerUnit = units > 0 ? amountExcludingCharges / units : 0;

  const isFormValid = () => {
    return (
      formData.units &&
      formData.amount_excluding_charges &&
      formData.account_id &&
      (parseFloat(formData.units) || 0) > 0 &&
      (parseFloat(formData.amount_excluding_charges) || 0) > 0 &&
      parseFloat(formData.other_charges || "0") >= 0 &&
      (!(parseFloat(formData.other_charges || "0") > 0) ||
        formData.expense_category_id) &&
      !(
        currentType === "sell" &&
        selectedFund &&
        parseFloat(formData.units) > totalUnits
      ) &&
      Object.keys(errors).length === 0
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.units || parseFloat(formData.units) <= 0) {
      newErrors.units = "Units must be greater than 0";
    }
    if (
      !formData.amount_excluding_charges ||
      parseFloat(formData.amount_excluding_charges) <= 0
    ) {
      newErrors.amount_excluding_charges =
        "Amount excluding charges must be greater than 0";
    }
    if (parseFloat(formData.other_charges || "0") < 0) {
      newErrors.other_charges = "Other charges cannot be negative";
    }
    if (
      parseFloat(formData.other_charges || "0") > 0 &&
      !formData.expense_category_id
    ) {
      newErrors.expense_category_id =
        "Expense category is required when other charges are present";
    }
    if (!formData.account_id) {
      newErrors.account_id = "Please select an account.";
    }
    if (
      !formData.transaction_date ||
      isNaN(formData.transaction_date.getTime())
    ) {
      newErrors.transaction_date = "Transaction date is required.";
    }

    // Additional validation for sell transactions
    if (
      tabIndex === 1 &&
      selectedFund &&
      parseFloat(formData.units) > totalUnits
    ) {
      newErrors.units = `Cannot sell more than available units (${totalUnits}).`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const transactionData: MfTransactionCreate = {
      mutual_fund_id: fund!.mutual_fund_id,
      transaction_type: tabIndex === 0 ? "buy" : "sell",
      units: parseFloat(formData.units),
      amount_excluding_charges: parseFloat(formData.amount_excluding_charges),
      other_charges: parseFloat(formData.other_charges || "0"),
      expense_category_id: formData.expense_category_id
        ? parseInt(formData.expense_category_id)
        : undefined,
      account_id: parseInt(formData.account_id),
      transaction_date: formData.transaction_date.toISOString(),
      notes: formData.notes.trim() || undefined,
    };

    transactionMutation.mutate(transactionData);
  };

  return {
    // State
    tabIndex,
    setTabIndex,
    formData,
    errors,
    currencySymbol,

    // Queries
    accounts,
    accountsLoading,
    expenseCategories,
    categoriesLoading,

    // Mutations
    transactionMutation,

    // Computed
    selectedAccount,
    filteredAssetAccounts,
    filteredLiabilityAccounts,
    allFilteredAccounts,
    hasFilteredAccountResults,
    selectedCategory,
    filteredCategories,
    hasFilteredCategoryResults,
    selectedFund,
    totalUnits,
    currentType,
    navPerUnit,

    // Dropdown state
    accountSearch,
    setAccountSearch,
    isAccountOpen,
    setIsAccountOpen,
    highlightedAccountIndex,
    setHighlightedAccountIndex,
    categorySearch,
    setCategorySearch,
    isCategoryOpen,
    setIsCategoryOpen,
    highlightedCategoryIndex,
    setHighlightedCategoryIndex,

    // Handlers
    handleInputChange,
    handleAccountKeyDown,
    handleCategoryKeyDown,
    handleClose,
    handleSubmit,
    isFormValid,
  };
}
