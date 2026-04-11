import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { queryKeys, invalidateTransactionRelated } from "@/lib/queryKeys";
import { getTransactions, deleteTransaction } from "./api";
import api from "@/lib/api";
import { notify } from "@/components/shared/notify";
import useLedgerStore from "@/components/shared/store";
import type {
  Transaction,
  TransactionsResponse,
  SplitTransaction,
  TransferDetails,
  Filters,
  Pagination,
} from "@/types";

export const useTransactions = (
  ledgerId: string | number,
  accountId: string | undefined,
  page: number,
  filters: Filters,
  enabled: boolean = true
) => {
  return useQuery<TransactionsResponse>({
    queryKey: queryKeys.transactions.list(ledgerId, accountId, page, filters),
    queryFn: ({ signal }) =>
      getTransactions(ledgerId, {
        page,
        per_page: 50,
        account_id: accountId,
        filters,
      }, signal),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteTransaction = (
  ledgerId: string | number,
  accountId?: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) =>
      deleteTransaction(ledgerId, transactionId),
    onMutate: async (transactionId) => {
      // Cancel outgoing refetches for all transaction queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.all,
      });

      // Return context for rollback — we don't do granular optimistic update
      // here since the query key includes page/filters which vary by caller.
      return { transactionId };
    },
    onError: (err) => {
      const axiosError = err as AxiosError<{ detail: string }>;
      notify({
        description:
          axiosError.response?.data?.detail || "Failed to delete transaction.",
        status: "error",
      });
    },
    onSuccess: () => {
      notify({
        description: "Transaction deleted",
        status: "success",
      });
    },
    onSettled: () => {
      invalidateTransactionRelated(queryClient, ledgerId, accountId);
    },
  });
};

// ---------------------------------------------------------------------------
// useTransactionPageState – consolidated page-level state for Transactions.tsx
// ---------------------------------------------------------------------------

interface UseTransactionPageStateParams {
  accountId?: string;
  shouldFetch?: boolean;
  onTransactionDeleted?: () => void;
  onTransactionUpdated?: () => void;
  onEditTransfer?: (tx: Transaction) => void;
}

export function useTransactionPageState({
  accountId,
  shouldFetch = true,
  onTransactionDeleted,
  onTransactionUpdated,
  onEditTransfer,
}: UseTransactionPageStateParams) {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- URL-synced filters ------------------------------------------------
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    const next: Filters = {};
    for (const key of searchParams.keys()) {
      if (key === "tab") continue;
      if (key === "tags") {
        next.tags = searchParams.getAll("tags").map((t) => ({ name: t }));
      } else {
        next[key] = searchParams.get(key);
      }
    }
    setFilters(next);
  }, [searchParams]);

  const hasActiveFilters = Object.keys(filters).length > 0;

  // --- Pagination --------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);

  // --- Transactions query (reuses the existing useTransactions hook) ------
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
  } = useTransactions(
    ledgerId || "",
    accountId,
    currentPage,
    filters,
    shouldFetch,
  );

  const pagination: Pagination = {
    total_pages: transactionsData?.total_pages ?? 1,
    current_page: transactionsData?.current_page ?? currentPage,
  };

  // --- Expansion state ---------------------------------------------------
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(
    null,
  );
  const [splitTransactions, setSplitTransactions] = useState<
    SplitTransaction[]
  >([]);
  const [transferDetails, setTransferDetails] =
    useState<TransferDetails | null>(null);
  const [isSplitLoading, setIsSplitLoading] = useState(false);
  const [isTransferLoading, setIsTransferLoading] = useState(false);

  // Caches to avoid re-fetching on repeated hovers (item #27)
  const splitCache = useRef<Record<string, SplitTransaction[]>>({});
  const transferCache = useRef<Record<string, TransferDetails>>({});
  const splitRequestId = useRef<string | null>(null);
  const transferRequestId = useRef<string | null>(null);

  // Clear caches when the transaction list changes (page, filter, mutation)
  useEffect(() => {
    splitCache.current = {};
    transferCache.current = {};
  }, [transactionsData]);

  // --- Edit-modal state --------------------------------------------------
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // --- Filter / pagination handlers --------------------------------------
  const handleApplyFilters = (newFilters: Filters) => {
    setCurrentPage(1);
    const cleaned: Record<string, unknown> = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      if (
        value !== "" &&
        value !== null &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        cleaned[key] = value;
      }
    });
    setSearchParams(cleaned as Record<string, string>);
  };

  const handleResetFilters = () => {
    setCurrentPage(1);
    const tab = searchParams.get("tab");
    setSearchParams(tab ? { tab } : {});
  };

  const handleQuickFilter = (field: string, value: string) => {
    setCurrentPage(1);
    const next: Record<string, string> = { [field]: value };
    const tab = searchParams.get("tab");
    if (tab) next.tab = tab;
    setSearchParams(next);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  // --- Expansion handlers ------------------------------------------------
  const toggleExpand = (transactionId: string, e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLButtonElement ||
      (e.target instanceof Element && e.target.closest("button")) ||
      e.target instanceof SVGElement ||
      e.target instanceof SVGPathElement
    ) {
      return;
    }
    if (expandedTransaction === transactionId) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(transactionId);
    }
    setTransferDetails(null);
    setSplitTransactions([]);
  };

  const fetchSplitTransactions = async (transactionId: string) => {
    if (splitCache.current[transactionId]) {
      setSplitTransactions(splitCache.current[transactionId]);
      return;
    }

    splitRequestId.current = transactionId;
    setIsSplitLoading(true);
    try {
      const res = await api.get(
        `/ledger/${ledgerId}/transaction/${transactionId}/splits`,
      );
      splitCache.current[transactionId] = res.data;
      if (splitRequestId.current === transactionId) {
        setSplitTransactions(res.data);
      }
    } finally {
      if (splitRequestId.current === transactionId) {
        setIsSplitLoading(false);
      }
    }
  };

  const fetchTransferDetails = async (transferId: string) => {
    if (transferCache.current[transferId]) {
      setTransferDetails(transferCache.current[transferId]);
      return;
    }

    transferRequestId.current = transferId;
    setIsTransferLoading(true);
    try {
      const res = await api.get(`/ledger/transfer/${transferId}`);
      transferCache.current[transferId] = res.data;
      if (transferRequestId.current === transferId) {
        setTransferDetails(res.data);
      }
    } finally {
      if (transferRequestId.current === transferId) {
        setIsTransferLoading(false);
      }
    }
  };

  // --- Edit-modal handlers -----------------------------------------------
  const handleEditTransaction = (transaction: Transaction) => {
    if (transaction.is_transfer && onEditTransfer) {
      onEditTransfer(transaction);
      return;
    }
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => setIsEditModalOpen(false);

  const handleTransactionUpdated = () => {
    setIsEditModalOpen(false);
    onTransactionUpdated?.();
    invalidateTransactionRelated(queryClient, ledgerId || "", accountId);
  };

  // --- Delete with optimistic removal ------------------------------------
  const deleteMutation = useMutation({
    mutationFn: (transactionId: string) =>
      deleteTransaction(ledgerId || "", transactionId),
    onMutate: async (transactionId) => {
      const key = queryKeys.transactions.list(
        ledgerId || "",
        accountId,
        currentPage,
        filters,
      );
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData<TransactionsResponse>(key, (old) =>
        old
          ? {
              ...old,
              transactions: old.transactions.filter(
                (t) => t.transaction_id !== transactionId,
              ),
            }
          : old,
      );
      return { previous, key };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
      const axiosError = err as AxiosError<{ detail: string }>;
      notify({
        description:
          axiosError.response?.data?.detail || "Failed to delete transaction.",
        status: "error",
      });
    },
    onSuccess: () => {
      onTransactionDeleted?.();
      notify({ description: "Transaction deleted", status: "success" });
    },
    onSettled: () => {
      invalidateTransactionRelated(queryClient, ledgerId || "", accountId);
    },
  });

  const handleDeleteTransaction = async (transactionId: string) => {
    deleteMutation.mutate(transactionId);
  };

  return {
    ledgerId,

    // Data
    transactionsData,
    isTransactionsLoading,
    isTransactionsError,

    // Filters & pagination
    filters,
    pagination,
    hasActiveFilters,
    handleApplyFilters,
    handleResetFilters,
    handleQuickFilter,
    handlePageChange,

    // Expansion
    expandedTransaction,
    splitTransactions,
    transferDetails,
    isSplitLoading,
    isTransferLoading,
    toggleExpand,
    fetchSplitTransactions,
    fetchTransferDetails,

    // Edit modal
    isEditModalOpen,
    selectedTransaction,
    handleEditTransaction,
    closeEditModal,
    handleTransactionUpdated,

    // Delete
    handleDeleteTransaction,
  };
}
