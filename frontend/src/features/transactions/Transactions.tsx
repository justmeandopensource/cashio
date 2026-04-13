import React, { lazy, Suspense } from "react";
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

import TransactionCard from "./TransactionCard";
import TransactionTable from "./TransactionTable";
import TransactionFilter from "./TransactionFilter";
import TransactionFilterStats from "./TransactionFilterStats";
import { useTransactionPageState } from "./hooks";
import { notify } from "@/components/shared/notify";
import type { Transaction } from "@/types";

const EditTransactionModal = lazy(() => import("@components/modals/EditTransactionModal/EditTransactionModal"));

const MotionBox = motion.create(Box);

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
  const {
    ledgerId,
    transactionsData,
    isTransactionsLoading,
    isTransactionsError,
    filters,
    pagination,
    hasActiveFilters,
    handleApplyFilters,
    handleResetFilters,
    handleQuickFilter,
    handlePageChange,
    expandedTransaction,
    splitTransactions,
    transferDetails,
    isSplitLoading,
    isTransferLoading,
    toggleExpand,
    fetchSplitTransactions,
    fetchTransferDetails,
    isEditModalOpen,
    selectedTransaction,
    handleEditTransaction,
    closeEditModal,
    handleTransactionUpdated,
    handleDeleteTransaction,
  } = useTransactionPageState({
    accountId,
    shouldFetch,
    onTransactionDeleted,
    onTransactionUpdated,
    onEditTransfer,
  });

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
              onQuickFilter={handleQuickFilter}
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
                     onQuickFilter={handleQuickFilter}
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
          <EditTransactionModal isOpen={isEditModalOpen} onClose={closeEditModal} transaction={selectedTransaction} onTransactionUpdated={handleTransactionUpdated} />
        </Suspense>
      )}
    </Box>
  );
};

export default Transactions;
