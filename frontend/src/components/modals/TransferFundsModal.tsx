import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Text,
  VStack,
  HStack,
  useToast,
  Box,
  useColorModeValue,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  InputRightElement,
  FormHelperText,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@chakra-ui/react";
import { ArrowRightLeft, Check, X, Search, ChevronDown, AlertTriangle } from "lucide-react";
import { AxiosError } from "axios";
import ChakraDatePicker from "@components/shared/ChakraDatePicker";
import api from "@/lib/api";
import FormNotes from "../shared/FormNotes";
import useLedgerStore from "../shared/store";
import { toastDefaults } from "../shared/utils";
import {
  handleNumericInput,
  handleNumericPaste,
} from "@/components/shared/numericInputUtils";

interface Ledger {
  ledger_id: string;
  name: string;
  currency_symbol: string;
}

interface Category {
  category_id: string;
  name: string;
  type: string;
}

interface Account {
  account_id: string;
  name: string;
  type: string;
  net_balance?: number;
  is_group: boolean;
}

interface Transaction {
  transaction_id: string;
  date: string;
  category_id?: string;
  category_name: string;
  account_id?: string;
  account_name?: string;
  is_split: boolean;
  is_transfer: boolean;
  notes?: string;
  credit: number;
  debit: number;
  transfer_id?: string;
  splits?: any[];
  tags?: any[];
}

interface TransferEditData {
  transfer_id: string;
  source_transaction: any;
  destination_transaction: any;
  source_account_name: string;
  destination_account_name: string;
  source_ledger_name: string;
  destination_ledger_name: string;
}

interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  onTransferCompleted: () => void;
  initialData?: Transaction;
  editTransferData?: TransferEditData;
}

const TransferFundsModal: React.FC<TransferFundsModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onTransferCompleted,
  initialData,
  editTransferData,
}) => {
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

  // Searchable dropdown state — From Account
  const [fromAccountSearch, setFromAccountSearch] = useState<string>("");
  const [isFromAccountOpen, setIsFromAccountOpen] = useState<boolean>(false);
  const [highlightedFromIndex, setHighlightedFromIndex] = useState<number>(-1);

  // Searchable dropdown state — To Account
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

  const toast = useToast();
  const queryClient = useQueryClient();
  const { ledgerId, currencySymbol } = useLedgerStore();

  function formatCurrency(value: number) {
    const locale = currencySymbol === "₹" ? "en-IN" : "en-US";
    return `${currencySymbol}${Math.abs(value).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Modern theme colors — matching CreateTransactionModal
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.300");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const addonColor = useColorModeValue("gray.600", "gray.200");
  const tealTextColor = useColorModeValue("teal.700", "teal.300");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");

  // Hero section colors (teal for transfers)
  const heroTransferBg = useColorModeValue("teal.50", "teal.900");
  const heroTransferBorder = useColorModeValue("teal.200", "teal.800");
  const heroTransferColor = useColorModeValue("teal.600", "teal.300");
  const heroTransferPlaceholder = useColorModeValue("teal.300", "teal.700");

  // Hero warning colors (when amount exceeds available balance)
  const heroWarningBg = useColorModeValue("red.50", "red.900");
  const heroWarningBorder = useColorModeValue("red.200", "red.800");
  const heroWarningColor = useColorModeValue("red.500", "red.300");
  const heroWarningPlaceholder = useColorModeValue("red.300", "red.700");

  const isOverBalance =
    !!fromAccountId &&
    !!amount &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) > selectedAccountBalance;

  const heroBg = isOverBalance ? heroWarningBg : heroTransferBg;
  const heroBorderColor = isOverBalance ? heroWarningBorder : heroTransferBorder;
  const heroColor = isOverBalance ? heroWarningColor : heroTransferColor;
  const heroPlaceholder = isOverBalance ? heroWarningPlaceholder : heroTransferPlaceholder;

  // Computed filtered accounts — From
  const selectedFromAccount = accounts.find(a => a.account_id === fromAccountId);
  const filteredFromAssetAccounts = accounts.filter(
    a => a.type === "asset" && a.name.toLowerCase().includes(fromAccountSearch.toLowerCase()),
  );
  const filteredFromLiabilityAccounts = accounts.filter(
    a => a.type === "liability" && a.name.toLowerCase().includes(fromAccountSearch.toLowerCase()),
  );
  const allFilteredFromAccounts = [...filteredFromAssetAccounts, ...filteredFromLiabilityAccounts];
  const hasFilteredFromResults = allFilteredFromAccounts.length > 0;

  // Computed filtered accounts — To (excludes fromAccountId when same ledger)
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
        toast({
          description: axiosError.response?.data?.detail || "Failed to fetch ledgers.",
          status: "error",
          ...toastDefaults,
        });
      }
    }
  }, [toast]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get<Account[]>(`/ledger/${ledgerId}/accounts`);
      setAccounts(response.data.filter(a => !a.is_group));
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description: axiosError.response?.data?.detail || "Failed to fetch accounts.",
          status: "error",
          ...toastDefaults,
        });
      }
    }
  }, [ledgerId, toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<Category[]>("/category/list?ignore_group=true");
      setCategories(response.data.filter(c => c.type === "expense"));
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description: axiosError.response?.data?.detail || "Failed to fetch categories.",
          status: "error",
          ...toastDefaults,
        });
      }
    }
  }, [toast]);

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
          // Use raw values (not .toString()) — account_id/category_id from API
          // are numbers, and dropdown handlers also set them as numbers.
          // Using .toString() would cause strict equality mismatches in .find().
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
              setDestinationAccounts(destAccResponse.data.filter(a => !a.is_group));
            } catch {
              // Silently fail — dropdown will be empty
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

          // Save initial state for change detection — stringify all IDs
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
                setDestinationAccounts(destAccResponse.data.filter((a: Account) => !a.is_group));
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
  }, [isOpen, resetForm, fetchLedgers, fetchAccounts, fetchCategories, initialData, editTransferData]);

  const fetchDestinationAccounts = useCallback(
    async (destLedgerId: string) => {
      try {
        const response = await api.get<Account[]>(`/ledger/${destLedgerId}/accounts`);
        setDestinationAccounts(response.data.filter(a => !a.is_group));
      } catch (error) {
        const axiosError = error as AxiosError<{ detail: string }>;
        if (axiosError.response?.status !== 401) {
          toast({
            description: axiosError.response?.data?.detail || "Failed to fetch accounts.",
            status: "error",
            ...toastDefaults,
          });
        }
      }
    },
    [toast],
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

  // Computed fee category
  const selectedFeeCategory = categories.find(c => c.category_id === feeCategoryId);
  const filteredFeeCategories = categories.filter(
    c => c.name.toLowerCase().includes(feeCategorySearch.toLowerCase()),
  );

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

      toast({
        description: isEditMode
          ? "Transfer updated successfully."
          : "Transfer completed successfully.",
        status: "success",
        ...toastDefaults,
      });

      onClose();
      onTransferCompleted();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      if (axiosError.response?.status !== 401) {
        toast({
          description: axiosError.response?.data?.detail || (isEditMode ? "Update failed" : "Transfer failed"),
          status: "error",
          ...toastDefaults,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Always points to latest handleSubmit — used in keyboard shortcut effect
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <Modal
      isOpen={isOpen}
      returnFocusOnClose={false}
      onClose={onClose}
      size={{ base: "full", sm: "xl" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <ModalContent
        bg={bgColor}
        borderRadius={{ base: 0, sm: "xl" }}
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        mx={{ base: 0, sm: 4 }}
        my={{ base: 0, sm: "auto" }}
        maxHeight={{ base: "100%", md: "90vh" }}
        display="flex"
        flexDirection="column"
      >
        {/* Gradient accent line */}
        <Box
          h="3px"
          bgGradient="linear(to-r, brand.400, brand.600, teal.300)"
        />
        {/* Flat header */}
        <Box
          px={{ base: 4, sm: 8 }}
          py={5}
          borderBottom="1px solid"
          borderColor={modalHeaderBorderColor}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={ArrowRightLeft} boxSize={5} mt="3px" color={modalIconColor} />
            <Box>
              <Box fontSize="lg" fontWeight="800" letterSpacing="-0.02em" color={modalTitleColor}>
                {isEditMode ? "Edit Transfer" : "Transfer Funds"}
              </Box>
              <Box fontSize="sm" color={modalSubtitleColor}>
                {isEditMode ? "Update transfer details" : "Move money between accounts"}
              </Box>
            </Box>
          </HStack>
        </Box>

        <ModalBody
          px={{ base: 4, sm: 8 }}
          py={{ base: 4, sm: 6 }}
          flex="1"
          display="flex"
          flexDirection="column"
          overflowY="auto"
          overflowX="hidden"
          justifyContent={{ base: "space-between", sm: "flex-start" }}
        >
          <VStack
            spacing={{ base: 5, sm: 6 }}
            align="stretch"
            w="100%"
            sx={{ "& .chakra-form__required-indicator": { display: "none" } }}
          >
            {/* Hero Amount Section */}
            <Box
              bg={heroBg}
              borderRadius="xl"
              p={{ base: 5, sm: 7 }}
              border="2px solid"
              borderColor={heroBorderColor}
              textAlign="center"
              sx={{ transition: "background-color 0.2s, border-color 0.2s" }}
            >
              <HStack justify="center" spacing={1.5} mb={3}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  color={heroColor}
                  opacity={0.7}
                  sx={{ transition: "color 0.2s" }}
                >
                  Transfer Amount
                </Text>
                {amount && parseFloat(amount) > 0 && !isOverBalance && (
                  <Icon as={Check} boxSize={3.5} color={heroColor} opacity={0.8} />
                )}
                {isOverBalance && (
                  <Icon as={AlertTriangle} boxSize={3.5} color={heroColor} opacity={0.9} />
                )}
              </HStack>
              <Box position="relative" width="100%" display="flex" alignItems="center">
                <Text
                  position="absolute"
                  left={4}
                  fontSize={{ base: "xl", sm: "2xl" }}
                  fontWeight="bold"
                  color={heroColor}
                  lineHeight="1"
                  userSelect="none"
                  pointerEvents="none"
                  sx={{ transition: "color 0.2s" }}
                >
                  {currencySymbol}
                </Text>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => handleNumericInput(e, amount)}
                  onPaste={(e) => handleNumericPaste(e, setAmount)}
                  placeholder="0.00"
                  fontSize={{ base: "4xl", sm: "5xl" }}
                  fontWeight="bold"
                  color={heroColor}
                  _placeholder={{ color: heroPlaceholder }}
                  textAlign="center"
                  variant="unstyled"
                  autoFocus
                  width="100%"
                  sx={{ transition: "color 0.2s" }}
                  data-testid="transferfundsmodal-amount-input"
                />
              </Box>
              {fromAccountId && (
                <HStack justify="center" spacing={1} mt={2}>
                  {isOverBalance && (
                    <Icon as={AlertTriangle} boxSize={3} color={heroColor} opacity={0.8} />
                  )}
                  <Text
                    fontSize="xs"
                    color={heroColor}
                    opacity={isOverBalance ? 0.9 : 0.6}
                    fontWeight={isOverBalance ? "semibold" : "normal"}
                    sx={{ transition: "color 0.2s, opacity 0.2s" }}
                  >
                    {isOverBalance
                      ? `Exceeds available balance of ${formatCurrency(selectedAccountBalance)}`
                      : `Available: ${formatCurrency(selectedAccountBalance)}`}
                  </Text>
                </HStack>
              )}
            </Box>

            {/* Basic Info Card: Date + From Account */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                {/* Date Picker */}
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                    Transaction date
                    <Icon as={Check} boxSize={3.5} color="teal.500" />
                  </FormLabel>
                  <Box
                    sx={{
                      ".react-datepicker-wrapper": { width: "100%" },
                      ".react-datepicker__input-container input": {
                        width: "100%",
                        height: "48px",
                        borderWidth: "2px",
                        borderColor: inputBorderColor,
                        borderRadius: "lg",
                        bg: inputBg,
                        fontSize: "lg",
                        _hover: { borderColor: "brand.300" },
                        _focus: {
                          borderColor: focusBorderColor,
                          boxShadow: `0 0 0 1px ${focusBorderColor}`,
                        },
                      },
                    }}
                  >
                    <ChakraDatePicker
                      selected={date}
                      onChange={(d: Date | null) => { if (d) setDate(d); }}
                      shouldCloseOnSelect={true}
                      data-testid="transferfundsmodal-date-picker"
                    />
                  </Box>
                </FormControl>

                {/* From Account (only shown if no accountId — at ledger level) */}
                {!accountId && accounts.length > 0 && (
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                      From Account
                      {fromAccountId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                    </FormLabel>
                    <Popover
                      isOpen={isFromAccountOpen}
                      onClose={() => { setIsFromAccountOpen(false); setHighlightedFromIndex(-1); }}
                      matchWidth
                      placement="bottom-start"
                      autoFocus={false}
                      returnFocusOnClose={false}
                    >
                      <PopoverTrigger>
                        <InputGroup size="lg">
                          <InputLeftElement pointerEvents="none" height="100%">
                            <Icon as={Search} boxSize={4} color={helperTextColor} />
                          </InputLeftElement>
                          <Input
                            value={isFromAccountOpen ? fromAccountSearch : (selectedFromAccount?.name ?? "")}
                            onChange={(e) => {
                              setFromAccountSearch(e.target.value);
                              setFromAccountId("");
                              setHighlightedFromIndex(-1);
                              setIsFromAccountOpen(true);
                            }}
                            onFocus={() => {
                              setFromAccountSearch("");
                              setHighlightedFromIndex(-1);
                              setIsFromAccountOpen(true);
                            }}
                            onKeyDown={handleFromAccountKeyDown}
                            placeholder="Search accounts..."
                            borderWidth="2px"
                            borderColor={fromAccountId ? "teal.400" : inputBorderColor}
                            bg={inputBg}
                            borderRadius="lg"
                            _hover={{ borderColor: "brand.300" }}
                            _focus={{
                              borderColor: focusBorderColor,
                              boxShadow: `0 0 0 1px ${focusBorderColor}`,
                            }}
                            autoComplete="off"
                            data-testid="transferfundsmodal-from-account-dropdown"
                          />
                          <InputRightElement height="100%" pr={1}>
                            {fromAccountId ? (
                              <Icon
                                as={X}
                                boxSize={4}
                                color={helperTextColor}
                                cursor="pointer"
                                onClick={() => {
                                  setFromAccountId("");
                                  setFromAccountSearch("");
                                  setIsFromAccountOpen(false);
                                  setHighlightedFromIndex(-1);
                                }}
                              />
                            ) : (
                              <Icon
                                as={ChevronDown}
                                boxSize={4}
                                color={helperTextColor}
                                cursor="pointer"
                                onClick={() => setIsFromAccountOpen(!isFromAccountOpen)}
                              />
                            )}
                          </InputRightElement>
                        </InputGroup>
                      </PopoverTrigger>
                      <PopoverContent
                        p={0}
                        bg={bgColor}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="md"
                        boxShadow="lg"
                        maxH="220px"
                        overflowY="auto"
                        _focus={{ outline: "none" }}
                      >
                        {filteredFromAssetAccounts.length > 0 && (
                          <>
                            <Box px={3} py={2} bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
                              <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                                Asset
                              </Text>
                            </Box>
                            {filteredFromAssetAccounts.map((acc, i) => (
                              <Box
                                key={acc.account_id}
                                px={4} py={3}
                                cursor="pointer"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                bg={fromAccountId === acc.account_id || i === highlightedFromIndex ? highlightColor : "transparent"}
                                _hover={{ bg: highlightColor }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFromAccountId(acc.account_id);
                                  setFromAccountSearch("");
                                  setIsFromAccountOpen(false);
                                  setHighlightedFromIndex(-1);
                                }}
                              >
                                <Text fontSize="sm" fontWeight={fromAccountId === acc.account_id ? "semibold" : "normal"}>
                                  {acc.name}
                                </Text>
                                {fromAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                              </Box>
                            ))}
                          </>
                        )}
                        {filteredFromLiabilityAccounts.length > 0 && (
                          <>
                            <Box
                              px={3} py={2} bg={cardBg}
                              borderBottom="1px solid" borderColor={borderColor}
                              borderTop={filteredFromAssetAccounts.length > 0 ? "1px solid" : undefined}
                              borderTopColor={borderColor}
                            >
                              <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                                Liability
                              </Text>
                            </Box>
                            {filteredFromLiabilityAccounts.map((acc, i) => {
                              const flatIndex = filteredFromAssetAccounts.length + i;
                              return (
                                <Box
                                  key={acc.account_id}
                                  px={4} py={3}
                                  cursor="pointer"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  bg={fromAccountId === acc.account_id || flatIndex === highlightedFromIndex ? highlightColor : "transparent"}
                                  _hover={{ bg: highlightColor }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setFromAccountId(acc.account_id);
                                    setFromAccountSearch("");
                                    setIsFromAccountOpen(false);
                                    setHighlightedFromIndex(-1);
                                  }}
                                >
                                  <Text fontSize="sm" fontWeight={fromAccountId === acc.account_id ? "semibold" : "normal"}>
                                    {acc.name}
                                  </Text>
                                  {fromAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                                </Box>
                              );
                            })}
                          </>
                        )}
                        {!hasFilteredFromResults && (
                          <Box px={4} py={5} textAlign="center">
                            <Text fontSize="sm" color={helperTextColor}>No accounts found</Text>
                          </Box>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormHelperText mt={2} color={helperTextColor}>
                      Select the account to transfer funds from
                    </FormHelperText>
                  </FormControl>
                )}
              </VStack>
            </Box>

            {/* Different Ledger Toggle Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <HStack justifyContent="space-between" align="center">
                <Box>
                  <Text fontWeight="semibold" mb={1}>
                    Transfer to Different Ledger
                  </Text>
                  <Text fontSize="sm" color={secondaryTextColor}>
                    Send funds across ledger books
                  </Text>
                </Box>
                <Switch
                  colorScheme="brand"
                  size="lg"
                  isChecked={isDifferentLedger}
                  onChange={(e) => {
                    setIsDifferentLedger(e.target.checked);
                    setToAccountId("");
                    setToAccountSearch("");
                    setIsToAccountOpen(false);
                    setHighlightedToIndex(-1);
                    if (!e.target.checked) {
                      setDestinationLedgerId("");
                      setDestinationAmount("");
                    }
                  }}
                />
              </HStack>
            </Box>

            {/* Destination Card */}
            <Box
              bg={highlightColor}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="2px solid"
              borderColor="teal.200"
            >
              <VStack spacing={5} align="stretch">
                <Text fontWeight="bold" color={tealTextColor}>
                  Destination
                </Text>

                {/* Destination Ledger (if different ledger) */}
                {isDifferentLedger && (
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                      Destination Ledger
                      {destinationLedgerId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                    </FormLabel>
                    <Select
                      value={destinationLedgerId}
                      onChange={(e) => {
                        const selectedLedger = ledgers.find(
                          ledger => ledger.ledger_id == e.target.value,
                        );
                        setDestinationLedgerId(e.target.value);
                        if (selectedLedger) {
                          setDestinationCurrencySymbol(selectedLedger.currency_symbol);
                        }
                        setToAccountId("");
                        setToAccountSearch("");
                      }}
                      placeholder="Select destination ledger"
                      borderWidth="2px"
                      borderColor={destinationLedgerId ? "teal.400" : inputBorderColor}
                      bg={inputBg}
                      size="lg"
                      borderRadius="lg"
                      _hover={{ borderColor: "brand.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                      data-testid="transferfundsmodal-to-ledger-dropdown"
                    >
                      {getFilteredLedgers(ledgers).map((ledger) => (
                        <option key={ledger.ledger_id} value={ledger.ledger_id}>
                          {ledger.name}
                        </option>
                      ))}
                    </Select>
                    <FormHelperText mt={2} color={helperTextColor}>
                      Choose the destination ledger
                    </FormHelperText>
                  </FormControl>
                )}

                {/* To Account — searchable Popover */}
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                    To Account
                    {toAccountId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                  </FormLabel>
                  <Popover
                    isOpen={isToAccountOpen}
                    onClose={() => { setIsToAccountOpen(false); setHighlightedToIndex(-1); }}
                    matchWidth
                    placement="bottom-start"
                    autoFocus={false}
                    returnFocusOnClose={false}
                  >
                    <PopoverTrigger>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none" height="100%">
                          <Icon as={Search} boxSize={4} color={helperTextColor} />
                        </InputLeftElement>
                        <Input
                          value={isToAccountOpen ? toAccountSearch : (selectedToAccount?.name ?? "")}
                          onChange={(e) => {
                            setToAccountSearch(e.target.value);
                            setToAccountId("");
                            setHighlightedToIndex(-1);
                            setIsToAccountOpen(true);
                          }}
                          onFocus={() => {
                            setToAccountSearch("");
                            setHighlightedToIndex(-1);
                            setIsToAccountOpen(true);
                          }}
                          onKeyDown={handleToAccountKeyDown}
                          placeholder="Search accounts..."
                          borderWidth="2px"
                          borderColor={toAccountId ? "teal.400" : inputBorderColor}
                          bg={inputBg}
                          borderRadius="lg"
                          _hover={{ borderColor: "brand.300" }}
                          _focus={{
                            borderColor: focusBorderColor,
                            boxShadow: `0 0 0 1px ${focusBorderColor}`,
                          }}
                          autoComplete="off"
                          data-testid="transferfundsmodal-to-account-dropdown"
                        />
                        <InputRightElement height="100%" pr={1}>
                          {toAccountId ? (
                            <Icon
                              as={X}
                              boxSize={4}
                              color={helperTextColor}
                              cursor="pointer"
                              onClick={() => {
                                setToAccountId("");
                                setToAccountSearch("");
                                setIsToAccountOpen(false);
                                setHighlightedToIndex(-1);
                              }}
                            />
                          ) : (
                            <Icon
                              as={ChevronDown}
                              boxSize={4}
                              color={helperTextColor}
                              cursor="pointer"
                              onClick={() => setIsToAccountOpen(!isToAccountOpen)}
                            />
                          )}
                        </InputRightElement>
                      </InputGroup>
                    </PopoverTrigger>
                    <PopoverContent
                      p={0}
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      boxShadow="lg"
                      maxH="220px"
                      overflowY="auto"
                      _focus={{ outline: "none" }}
                    >
                      {filteredToAssetAccounts.length > 0 && (
                        <>
                          <Box px={3} py={2} bg={cardBg} borderBottom="1px solid" borderColor={borderColor}>
                            <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                              Asset
                            </Text>
                          </Box>
                          {filteredToAssetAccounts.map((acc, i) => (
                            <Box
                              key={acc.account_id}
                              px={4} py={3}
                              cursor="pointer"
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              bg={toAccountId === acc.account_id || i === highlightedToIndex ? highlightColor : "transparent"}
                              _hover={{ bg: highlightColor }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setToAccountId(acc.account_id);
                                setToAccountSearch("");
                                setIsToAccountOpen(false);
                                setHighlightedToIndex(-1);
                              }}
                            >
                              <Text fontSize="sm" fontWeight={toAccountId === acc.account_id ? "semibold" : "normal"}>
                                {acc.name}
                              </Text>
                              {toAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                            </Box>
                          ))}
                        </>
                      )}
                      {filteredToLiabilityAccounts.length > 0 && (
                        <>
                          <Box
                            px={3} py={2} bg={cardBg}
                            borderBottom="1px solid" borderColor={borderColor}
                            borderTop={filteredToAssetAccounts.length > 0 ? "1px solid" : undefined}
                            borderTopColor={borderColor}
                          >
                            <Text fontSize="xs" fontWeight="semibold" color={helperTextColor} textTransform="uppercase" letterSpacing="wider">
                              Liability
                            </Text>
                          </Box>
                          {filteredToLiabilityAccounts.map((acc, i) => {
                            const flatIndex = filteredToAssetAccounts.length + i;
                            return (
                              <Box
                                key={acc.account_id}
                                px={4} py={3}
                                cursor="pointer"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                bg={toAccountId === acc.account_id || flatIndex === highlightedToIndex ? highlightColor : "transparent"}
                                _hover={{ bg: highlightColor }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setToAccountId(acc.account_id);
                                  setToAccountSearch("");
                                  setIsToAccountOpen(false);
                                  setHighlightedToIndex(-1);
                                }}
                              >
                                <Text fontSize="sm" fontWeight={toAccountId === acc.account_id ? "semibold" : "normal"}>
                                  {acc.name}
                                </Text>
                                {toAccountId === acc.account_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                              </Box>
                            );
                          })}
                        </>
                      )}
                      {!hasFilteredToResults && (
                        <Box px={4} py={5} textAlign="center">
                          <Text fontSize="sm" color={helperTextColor}>No accounts found</Text>
                        </Box>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormHelperText mt={2} color={helperTextColor}>
                    Select the account to transfer funds to
                  </FormHelperText>
                </FormControl>

                {/* Destination Amount (if different ledger) */}
                {isDifferentLedger && (
                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                      Destination Amount
                      {destinationAmount && parseFloat(destinationAmount) > 0 && (
                        <Icon as={Check} boxSize={3.5} color="teal.500" />
                      )}
                    </FormLabel>
                    <InputGroup size="lg">
                      <InputLeftAddon
                        bg={inputBorderColor}
                        borderWidth="2px"
                        borderColor={inputBorderColor}
                        color={addonColor}
                        fontWeight="semibold"
                      >
                        {destinationCurrencySymbol || currencySymbol}
                      </InputLeftAddon>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={destinationAmount}
                        onChange={(e) => setDestinationAmount(e.target.value)}
                        onKeyDown={(e) => handleNumericInput(e, destinationAmount)}
                        onPaste={(e) => handleNumericPaste(e, setDestinationAmount)}
                        placeholder="0.00"
                        borderWidth="2px"
                        borderColor={destinationAmount && parseFloat(destinationAmount) > 0 ? "teal.400" : inputBorderColor}
                        bg={inputBg}
                        borderRadius="lg"
                        _hover={{ borderColor: "brand.300" }}
                        _focus={{
                          borderColor: focusBorderColor,
                          boxShadow: `0 0 0 1px ${focusBorderColor}`,
                        }}
                      />
                    </InputGroup>
                    <FormHelperText mt={2} color={helperTextColor}>
                      Enter the amount in the destination ledger's currency
                    </FormHelperText>
                  </FormControl>
                )}
              </VStack>
            </Box>

            {/* Transfer Fee Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={5} align="stretch">
                <Text fontWeight="semibold" color={secondaryTextColor} fontSize="sm">
                  Transfer Fee <Text as="span" fontWeight="normal">(optional)</Text>
                </Text>

                {/* Fee Amount */}
                <FormControl>
                  <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                    Fee Amount
                    {feeAmount && parseFloat(feeAmount) > 0 && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftAddon
                      bg={inputBorderColor}
                      borderWidth="2px"
                      borderColor={inputBorderColor}
                      color={addonColor}
                      fontWeight="semibold"
                    >
                      {currencySymbol}
                    </InputLeftAddon>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      onKeyDown={(e) => handleNumericInput(e, feeAmount)}
                      onPaste={(e) => handleNumericPaste(e, setFeeAmount)}
                      placeholder="0.00"
                      borderWidth="2px"
                      borderColor={feeAmount && parseFloat(feeAmount) > 0 ? "teal.400" : inputBorderColor}
                      bg={inputBg}
                      borderRadius="lg"
                      _hover={{ borderColor: "brand.300" }}
                      _focus={{
                        borderColor: focusBorderColor,
                        boxShadow: `0 0 0 1px ${focusBorderColor}`,
                      }}
                    />
                  </InputGroup>
                  <FormHelperText mt={2} color={helperTextColor}>
                    Fee charged by the transfer service (e.g. Wise, Remitly)
                  </FormHelperText>
                </FormControl>

                {/* Fee Category */}
                <FormControl>
                  <FormLabel fontWeight="semibold" mb={2} display="flex" alignItems="center" gap={1.5}>
                    Fee Category
                    {feeCategoryId && <Icon as={Check} boxSize={3.5} color="teal.500" />}
                  </FormLabel>
                  <Popover
                    isOpen={isFeeCategoryOpen}
                    onClose={() => { setIsFeeCategoryOpen(false); setHighlightedFeeCategoryIndex(-1); }}
                    matchWidth
                    placement="bottom-start"
                    autoFocus={false}
                    returnFocusOnClose={false}
                  >
                    <PopoverTrigger>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none" height="100%">
                          <Icon as={Search} boxSize={4} color={helperTextColor} />
                        </InputLeftElement>
                        <Input
                          value={isFeeCategoryOpen ? feeCategorySearch : (selectedFeeCategory?.name ?? "")}
                          onChange={(e) => {
                            setFeeCategorySearch(e.target.value);
                            setFeeCategoryId("");
                            setHighlightedFeeCategoryIndex(-1);
                            setIsFeeCategoryOpen(true);
                          }}
                          onFocus={() => {
                            setFeeCategorySearch("");
                            setHighlightedFeeCategoryIndex(-1);
                            setIsFeeCategoryOpen(true);
                          }}
                          onKeyDown={handleFeeCategoryKeyDown}
                          placeholder="Search expense categories..."
                          borderWidth="2px"
                          borderColor={feeCategoryId ? "teal.400" : inputBorderColor}
                          bg={inputBg}
                          borderRadius="lg"
                          _hover={{ borderColor: "brand.300" }}
                          _focus={{
                            borderColor: focusBorderColor,
                            boxShadow: `0 0 0 1px ${focusBorderColor}`,
                          }}
                          autoComplete="off"
                        />
                        <InputRightElement height="100%" pr={1}>
                          {feeCategoryId ? (
                            <Icon
                              as={X}
                              boxSize={4}
                              color={helperTextColor}
                              cursor="pointer"
                              onClick={() => {
                                setFeeCategoryId("");
                                setFeeCategorySearch("");
                                setIsFeeCategoryOpen(false);
                                setHighlightedFeeCategoryIndex(-1);
                              }}
                            />
                          ) : (
                            <Icon
                              as={ChevronDown}
                              boxSize={4}
                              color={helperTextColor}
                              cursor="pointer"
                              onClick={() => setIsFeeCategoryOpen(!isFeeCategoryOpen)}
                            />
                          )}
                        </InputRightElement>
                      </InputGroup>
                    </PopoverTrigger>
                    <PopoverContent
                      p={0}
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      boxShadow="lg"
                      maxH="220px"
                      overflowY="auto"
                      _focus={{ outline: "none" }}
                    >
                      {filteredFeeCategories.length > 0 ? (
                        filteredFeeCategories.map((cat, i) => (
                          <Box
                            key={cat.category_id}
                            px={4} py={3}
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            bg={feeCategoryId === cat.category_id || i === highlightedFeeCategoryIndex ? highlightColor : "transparent"}
                            _hover={{ bg: highlightColor }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFeeCategoryId(cat.category_id);
                              setFeeCategorySearch("");
                              setIsFeeCategoryOpen(false);
                              setHighlightedFeeCategoryIndex(-1);
                            }}
                          >
                            <Text fontSize="sm" fontWeight={feeCategoryId === cat.category_id ? "semibold" : "normal"}>
                              {cat.name}
                            </Text>
                            {feeCategoryId === cat.category_id && <Icon as={Check} boxSize={4} color="teal.500" />}
                          </Box>
                        ))
                      ) : (
                        <Box px={4} py={5} textAlign="center">
                          <Text fontSize="sm" color={helperTextColor}>No categories found</Text>
                        </Box>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormHelperText mt={2} color={helperTextColor}>
                    Expense category for tracking the fee (e.g. Bank Charges)
                  </FormHelperText>
                </FormControl>
              </VStack>
            </Box>

            {/* Notes Card */}
            <Box
              bg={cardBg}
              p={{ base: 4, sm: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <FormNotes
                ledgerId={ledgerId as string}
                notes={notes}
                setNotes={setNotes}
                borderColor={inputBorderColor}
                onDropdownOpenChange={setIsNotesSuggestionsOpen}
              />
            </Box>
          </VStack>

          {/* Mobile-only action buttons that stay at bottom */}
          <Box display={{ base: "block", sm: "none" }} mt={6}>
            <Button
              onClick={handleSubmit}
              colorScheme="brand"
              size="lg"
              width="100%"
              mb={3}
              borderRadius="lg"
              fontWeight="bold"
              isLoading={isLoading}
              loadingText={isEditMode ? "Updating..." : "Transferring..."}
              isDisabled={isSaveDisabled}
            >
              {isEditMode ? "Save Changes" : "Complete Transfer"}
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={onClose}
              size="lg"
              width="100%"
              borderRadius="lg"
              isDisabled={isLoading}
            >
              Cancel
            </Button>
          </Box>
        </ModalBody>

        {/* Desktop-only footer */}
        <ModalFooter
          display={{ base: "none", sm: "flex" }}
          px={8}
          py={6}
          bg={footerBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <Button
            colorScheme="brand"
            mr={3}
            onClick={handleSubmit}
            px={8}
            py={3}
            borderRadius="lg"
            fontWeight="bold"
            isLoading={isLoading}
            loadingText={isEditMode ? "Updating..." : "Transferring..."}
            isDisabled={isSaveDisabled}
          >
            {isEditMode ? "Save Changes" : "Complete Transfer"}
          </Button>
          <Button
            variant="ghost"
            colorScheme="gray"
            onClick={onClose}
            isDisabled={isLoading}
            px={6}
            py={3}
            borderRadius="lg"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TransferFundsModal;
