import React, { useState, lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Box,
  Text,
  Button,
  Flex,
  VStack,
  IconButton,
  Icon,
  Skeleton,
  SkeletonText,
  useColorModeValue,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, Filter, AlignLeft, BookOpen } from "lucide-react";

import api from "@/lib/api";
import TransactionCard from "./TransactionCard";
import TransactionTable from "./TransactionTable";
import TransactionFilter from "./TransactionFilter";
import TransactionFilterStats from "./TransactionFilterStats";
import { AxiosError } from "axios";
import useLedgerStore from "@/components/shared/store";
import { notify } from "@/components/shared/notify";
import type { Transaction, TransferDetails, SplitTransaction, TransactionsResponse, Filters, Pagination } from "@/types";
const EditTransactionModal = lazy(() => import("@components/modals/EditTransactionModal/EditTransactionModal"));

const MotionBox = motion(Box);

const floatKeyframes = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

interface TransactionsProps {
  accountId?: string;
  onAddTransaction: () => void;
  onTransactionDeleted?: () => void;
  onTransactionUpdated?: () => void;
   
  onCopyTransaction: (tx: Transaction) => Promise<void>;
   
  onEditTransfer?: (tx: Transaction) => void;
  shouldFetch?: boolean;
}

const Transactions: React.FC<TransactionsProps> = ({
  accountId,
  onAddTransaction,
  onTransactionDeleted,
  onTransactionUpdated,
  onCopyTransaction,
  onEditTransfer,
  shouldFetch = true,
}) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const queryClient = useQueryClient();

  const [splitTransactions, setSplitTransactions] = useState<
    SplitTransaction[]
  >([]);
  const [transferDetails, setTransferDetails] =
    useState<TransferDetails | null>(null);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(
    null
  );

  const [isSplitLoading, setIsSplitLoading] = useState(false);
  const [isTransferLoading, setIsTransferLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(
    null
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({});
  const [pagination, setPagination] = useState<Pagination>({
    total_pages: 1,
    current_page: 1,
  });

  useEffect(() => {
    const newFilters: Filters = {};
    for (const key of searchParams.keys()) {
        if (key === 'tab') continue;
        if (key === 'tags') {
            newFilters.tags = searchParams.getAll('tags').map(t => ({ name: t }));
        } else {
            newFilters[key] = searchParams.get(key);
        }
    }
    setFilters(newFilters);
  }, [searchParams]);

  // Add state to track if filters are active
  const hasActiveFilters = Object.keys(filters).length > 0;

  const handleApplyFilters = (newFilters: Filters) => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    const cleanedFilters: { [key: string]: any } = {};
    Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && (!Array.isArray(value) || value.length > 0)) {
            cleanedFilters[key] = value;
        }
    });
    setSearchParams(cleanedFilters as any);
  };

  const handleResetFilters = () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    setSearchParams({});
  };

  const handleEditTransaction = (transaction: Transaction) => {
    if (transaction.is_transfer && onEditTransfer) {
      onEditTransfer(transaction);
      return;
    }
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleTransactionUpdated = () => {
    setIsEditModalOpen(false);
    if (onTransactionUpdated) {
      onTransactionUpdated();
    }
    queryClient.invalidateQueries({
      queryKey: [
        "transactions",
        ledgerId,
        accountId,
        pagination.current_page,
        { ...filters },
      ],
    });
    queryClient.refetchQueries({ queryKey: ["account", accountId] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
  } = useQuery<TransactionsResponse>({
    queryKey: [
      "transactions",
      ledgerId,
      accountId,
      pagination.current_page,
      filters,
    ],
    queryFn: async ({ queryKey }) => {
      const [,,,, filtersFromKey] = queryKey as [string, string, string | undefined, number, Filters];
      const params = new URLSearchParams();
      params.append("page", pagination.current_page.toString());
      params.append("per_page", "50");

      if (accountId) {
        params.append("account_id", accountId);
      }

      Object.entries(filtersFromKey).forEach(([key, value]) => {
        if (key === "tags" && Array.isArray(value)) {
          value.forEach((tag) => {
            params.append("tags", tag);
          });
        } else if (value !== null && value !== undefined && value !== "") {
          params.append(key, value as string);
        }
      });

      const response = await api.get(`/ledger/${ledgerId}/transactions`, { params });

      setPagination({
        total_pages: response.data.total_pages,
        current_page: response.data.current_page,
      });
      return response.data;
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Optimistic delete mutation
  const deleteMutation = useMutation({
    mutationFn: (transactionId: string) =>
      api.delete(`/ledger/${ledgerId}/transaction/${transactionId}`),
    onMutate: async (_transactionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["transactions", ledgerId, accountId, pagination.current_page, { ...filters }],
      });

      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData([
        "transactions",
        ledgerId,
        accountId,
        pagination.current_page,
        { ...filters },
      ]);

      // Optimistically remove the transaction
      queryClient.setQueryData(
        ["transactions", ledgerId, accountId, pagination.current_page, { ...filters }],
        (old: TransactionsResponse | undefined) =>
          old ? { ...old, transactions: old.transactions.filter((t) => t.transaction_id !== _transactionId) } : old
      );

      // Return context with snapshotted value
      return { previousTransactions };
    },
    onError: (err, _transactionId, context) => {
      // If mutation fails, use the context to roll back
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          ["transactions", ledgerId, accountId, pagination.current_page, { ...filters }],
          context.previousTransactions
        );
      }
      const axiosError = err as AxiosError<{ detail: string }>;
      notify({
        description: axiosError.response?.data?.detail || "Failed to delete transaction.",
        status: "error",
      });
    },
    onSuccess: () => {
      if (onTransactionDeleted) {
        onTransactionDeleted();
      }
      queryClient.invalidateQueries({ queryKey: ["account", accountId] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      notify({
        description: "Transaction deleted",
        status: "success",
      });
    },
  });

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
  };

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
      setTransferDetails(null);
      setSplitTransactions([]);
    } else {
      setExpandedTransaction(transactionId);
      setTransferDetails(null);
      setSplitTransactions([]);
    }
  };

  const fetchSplitTransactions = async (transactionId: string) => {
    setIsSplitLoading(true);
    try {
      const response = await api.get(
        `/ledger/${ledgerId}/transaction/${transactionId}/splits`
      );
      setSplitTransactions(response.data);
    } finally {
      setIsSplitLoading(false);
    }
  };

  const fetchTransferDetails = async (transferId: string) => {
    setIsTransferLoading(true);
    try {
      const response = await api.get(`/ledger/transfer/${transferId}`);
      setTransferDetails(response.data);
    } finally {
      setIsTransferLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    deleteMutation.mutate(transactionId);
  };

  const boxBg = undefined;
  const skeletonBg = useColorModeValue("primaryBg", "primaryBg");
  const skeletonBorder = useColorModeValue("gray.100", "gray.700");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.12)");
  const emptyTitleColor = useColorModeValue("gray.800", "gray.100");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");
  const paginationBg = useColorModeValue("white", "gray.700");
  const paginationBorder = useColorModeValue("gray.100", "gray.600");
  const paginationTextColor = useColorModeValue("gray.600", "gray.300");
  const btnGlow = useColorModeValue(
    "0 0 20px rgba(53,169,163,0.25)",
    "0 0 20px rgba(78,194,188,0.2)"
  );

  if (shouldFetch && isTransactionsLoading) {
    return (
      <Box bg={boxBg} p={{ base: 2, lg: 6 }} borderRadius="lg">
        <Flex justify="space-between" align="center" mb={4}>
          <Flex align="center" gap={2}>
            <Skeleton height="6" width="6" borderRadius="md" />
            <Skeleton height="6" width="32" borderRadius="md" />
          </Flex>
          <Skeleton height="8" width="24" borderRadius="lg" />
        </Flex>
        <VStack spacing={3} align="stretch">
          {Array.from({ length: 5 }).map((_, index) => (
            <MotionBox
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
            >
              <Box
                bg={skeletonBg}
                p={4}
                borderRadius="xl"
                border="1px solid"
                borderColor={skeletonBorder}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <Skeleton height="4" width="20" borderRadius="md" />
                  <Skeleton height="5" width="16" borderRadius="md" />
                </Flex>
                <SkeletonText noOfLines={2} spacing="2" />
              </Box>
            </MotionBox>
          ))}
        </VStack>
      </Box>
    );
  }

  if (isTransactionsError) {
    notify({
      description: "Failed to fetch transactions",
      status: "error",
    });
    return null;
  }

  return (
    <Box bg={boxBg} p={{ base: 2, lg: 6 }} borderRadius="lg">
      {!shouldFetch || !transactionsData || transactionsData.transactions.length === 0 ? (
        <MotionBox
          textAlign="center"
          py={{ base: 8, lg: 14 }}
          px={{ base: 3, lg: 6 }}
          display="flex"
          flexDirection="column"
          alignItems="center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Box
            w="72px"
            h="72px"
            borderRadius="2xl"
            bg={emptyIconBg}
            display="flex"
            alignItems="center"
            justifyContent="center"
            mb={5}
            css={{ animation: `${floatKeyframes} 3s ease-in-out infinite` }}
          >
            <Icon as={hasActiveFilters ? Filter : BookOpen} boxSize={8} color="brand.500" strokeWidth={1.5} />
          </Box>

          <Text fontSize="xl" fontWeight="800" mb={2} color={emptyTitleColor} letterSpacing="-0.02em">
            {hasActiveFilters
              ? "No Matching Transactions"
              : "No Transactions Found"}
          </Text>
          <Text color={emptySubColor} mb={8} fontSize="sm" maxW="320px" lineHeight="1.6">
            {hasActiveFilters
              ? "No transactions match your filter criteria."
              : "You do not have any transactions for this account yet."}
          </Text>

          <MotionBox whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            {hasActiveFilters ? (
              <Button
                leftIcon={<Filter size={16} />}
                colorScheme="brand"
                onClick={handleResetFilters}
                borderRadius="lg"
                fontWeight="bold"
                px={6}
                _hover={{ boxShadow: btnGlow }}
                transition="all 0.2s ease"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                leftIcon={<Plus size={16} />}
                colorScheme="brand"
                onClick={onAddTransaction}
                borderRadius="lg"
                fontWeight="bold"
                px={6}
                _hover={{ boxShadow: btnGlow }}
                transition="all 0.2s ease"
              >
                Add Transaction
              </Button>
            )}
          </MotionBox>
        </MotionBox>
      ) : (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {hasActiveFilters && (
            <TransactionFilterStats
              totalTransactions={transactionsData.total_transactions}
              totalCredit={transactionsData.total_credit}
              totalDebit={transactionsData.total_debit}
              netAmount={transactionsData.net_amount}
            />
          )}

          <Flex justify="space-between" align="center" mb={4}>
            <Flex align="center" gap={2}>
              <Icon as={AlignLeft} size={24} color="secondaryTextColor" />
              <Text fontSize={{ base: "lg", lg: "xl" }} fontWeight="800" color={tertiaryTextColor} letterSpacing="-0.02em">
                Transactions
              </Text>
            </Flex>
            <TransactionFilter
              ledgerId={ledgerId as string}
              accountId={accountId}
              initialFilters={filters}
              onApplyFilters={handleApplyFilters}
              currentFilters={filters}
              onResetFilters={handleResetFilters}
            />
          </Flex>

          <Box display={{ base: "none", lg: "block" }}>
            <TransactionTable
              transactions={transactionsData.transactions}
              fetchSplitTransactions={fetchSplitTransactions}
              fetchTransferDetails={fetchTransferDetails}
              isSplitLoading={isSplitLoading}
              splitTransactions={splitTransactions}
              isTransferLoading={isTransferLoading}
              transferDetails={transferDetails || undefined}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={handleEditTransaction}
              onCopyTransaction={onCopyTransaction}
              showAccountName={!accountId}
            />
          </Box>

           <Box display={{ base: "block", lg: "none" }}>
             <VStack spacing={1} align="stretch">
               {transactionsData.transactions.map((transaction, index) => (
                 <MotionBox
                   key={transaction.transaction_id}
                   initial={{ opacity: 0, y: 8 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                 >
                   <TransactionCard
                     transaction={transaction}
                     isExpanded={
                       expandedTransaction === transaction.transaction_id
                     }
                     toggleExpand={(e) =>
                       toggleExpand(transaction.transaction_id, e)
                     }
                     fetchSplitTransactions={() =>
                       fetchSplitTransactions(transaction.transaction_id)
                     }
                     splitTransactions={splitTransactions}
                     fetchTransferDetails={() =>
                       transaction.transfer_id
                         ? fetchTransferDetails(transaction.transfer_id)
                         : undefined
                     }
                     transferDetails={transferDetails || undefined}
                     isSplitLoading={isSplitLoading}
                     isTransferLoading={isTransferLoading}
                     onDeleteTransaction={handleDeleteTransaction}
                     onEditTransaction={handleEditTransaction}
                     onCopyTransaction={onCopyTransaction}
                     showAccountName={!accountId}
                   />
                 </MotionBox>
               ))}
             </VStack>
           </Box>

          {pagination.total_pages > 1 && (
            <Flex
              justifyContent="center"
              mt={6}
              alignItems="center"
            >
              <Flex
                align="center"
                bg={paginationBg}
                border="1px solid"
                borderColor={paginationBorder}
                borderRadius="xl"
                px={2}
                py={1}
              >
                <IconButton
                  icon={<ChevronLeft size={16} />}
                  isDisabled={pagination.current_page === 1}
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  variant="ghost"
                  size="sm"
                  aria-label="Previous page"
                  data-testid="transactions-prev-page-icon"
                  borderRadius="lg"
                />
                <Text
                  mx={4}
                  fontSize="sm"
                  fontWeight="semibold"
                  color={paginationTextColor}
                  letterSpacing="0.02em"
                >
                  {pagination.current_page} / {pagination.total_pages}
                </Text>
                <IconButton
                  icon={<ChevronRight size={16} />}
                  isDisabled={pagination.current_page === pagination.total_pages}
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  variant="ghost"
                  size="sm"
                  aria-label="Next page"
                  data-testid="transactions-next-page-icon"
                  borderRadius="lg"
                />
              </Flex>
            </Flex>
          )}
        </MotionBox>
      )}
      {isEditModalOpen && selectedTransaction && (
        <Suspense fallback={<div>Loading...</div>}>
          <EditTransactionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={selectedTransaction} onTransactionUpdated={handleTransactionUpdated} />
        </Suspense>
      )}
    </Box>
  );
};

export default Transactions;
