import React from "react";
import { useColorModeValue } from "../../components/ui/color-mode";
import {
  Box,
  Flex,
  Text,
  HStack,
  Icon,
  Square,
  VStack,
  Wrap,
  WrapItem,
  Tag,
  useDisclosure,
  Button,
  IconButton,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Tooltip } from '@/components/ui/tooltip';
import { Calendar, Tag as TagIcon, Info, CreditCard, Trash2, MessageSquare, Edit, Copy } from "lucide-react";
import DeleteTransactionModal from "./DeleteTransactionModal";
import { Link } from "react-router-dom";
import {
  formatAmount,
  formatDate,
} from "@/components/shared/utils";
import { SplitTransactionSkeleton, TransferDetailsSkeleton } from "./Skeletons";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../mutual-funds/utils";
import type { SplitTransaction, TransferDetails, Transaction } from "@/types";

interface TransactionCardProps {
  transaction: Transaction;
  isExpanded: boolean;
   
  toggleExpand: (e: React.MouseEvent) => void;
   
  fetchSplitTransactions: (transactionId: string) => void;
  splitTransactions: SplitTransaction[];
   
  fetchTransferDetails: (transferId: string) => void;
  transferDetails?: TransferDetails;
  isSplitLoading: boolean;
  isTransferLoading: boolean;
   
  onDeleteTransaction: (transactionId: string) => Promise<void>;
   
  onEditTransaction: (transaction: Transaction) => void;
   
  onCopyTransaction: (transaction: Transaction) => void;
  onQuickFilter?: (field: string, value: string) => void;
  showAccountName?: boolean;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  isExpanded,
  toggleExpand,
  fetchSplitTransactions,
  splitTransactions,
  fetchTransferDetails,
  transferDetails,
  isSplitLoading,
  isTransferLoading,
  onDeleteTransaction,
  onEditTransaction,
  onCopyTransaction,
  onQuickFilter,
  showAccountName = false,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const displayCredit = transaction.filter_matched_split?.credit ?? transaction.credit;
  const displayDebit = transaction.filter_matched_split?.debit ?? transaction.debit;
  const displayCategoryName = transaction.filter_matched_split?.category_name ?? transaction.category_name;
  const displayCategoryId = transaction.filter_matched_split?.category_id ?? transaction.category_id;
  const amount = formatAmount(displayCredit, displayDebit, currencySymbol as string);
  const amountValue = displayCredit !== 0 ? displayCredit : displayDebit;

  const { open, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const cardBorder = useColorModeValue("gray.100", "gray.600");
  const cardHoverBorder = useColorModeValue("gray.200", "gray.500");
  const expandedBorder = useColorModeValue("brand.200", "brand.600");
  const splitColor = useColorModeValue("split", "split");
  const transferColor = useColorModeValue("transfer", "transfer");
  const assetColor = useColorModeValue("asset", "asset");
  const mutualFundColor = useColorModeValue("mutualFund", "mutualFund");
  const accountLinkColor = useColorModeValue("brand.500", "brand.300");
  const storeTagBg = useColorModeValue("brand.50", "brand.800");
  const storeTagColor = useColorModeValue("brand.700", "brand.200");
  const storeTagBorderColor = useColorModeValue("brand.200", "brand.600");
  const splitBg = useColorModeValue("splitBg", "splitBg");
  const transferBg = useColorModeValue("transferBg", "transferBg");
  const expandedSectionBorder = useColorModeValue("gray.100", "gray.600");

  return (
    <>
      <Box
        p={4}
        border="1px solid"
        borderColor={isExpanded ? expandedBorder : cardBorder}
        borderRadius="xl"
        mb={3}
        bg={cardBg}
        onClick={toggleExpand}
        cursor="pointer"
        transition="all 0.2s ease"
        _hover={{
          borderColor: cardHoverBorder,
        }}
        css={{
          '& @media (hover: hover)': { '&:hover': { borderColor: cardHoverBorder } }
        }}
      >
        {/* Main row with essential info */}
        <Flex justify="space-between" align="flex-start">
          {/* Left side with date, category and notes */}
          <VStack align="flex-start" gap={1} maxW="70%">
            <HStack gap={2}>
              <Icon color="tertiaryTextColor" boxSize={3.5} asChild><Calendar /></Icon>
              <Text fontSize="sm" color="secondaryTextColor">
                {formatDate(transaction.date)}
              </Text>

              {/* Transaction type indicators */}
              {(transaction.is_split || transaction.is_transfer || transaction.is_asset_transaction || transaction.is_mf_transaction) && (
                <HStack gap={1}>
                  {transaction.is_split && !transaction.is_transfer && !transaction.is_mf_transaction && (
                    <Tooltip content="Split Transaction">
                      <Square size="7px" bg={splitColor} borderRadius="sm" />
                    </Tooltip>
                  )}
                  {transaction.is_transfer && (
                    <Tooltip content="Transfer">
                      <Square size="7px" bg={transferColor} borderRadius="sm" />
                    </Tooltip>
                  )}
                  {(transaction.is_transfer || transaction.is_mf_transaction) && transaction.is_split && (
                    <Tooltip content={transaction.is_mf_transaction ? "MF Charges" : "Transfer Fee"}>
                      <Square size="7px" bg="orange.400" borderRadius="sm" />
                    </Tooltip>
                  )}
                    {transaction.is_asset_transaction && (
                      <Tooltip content="Asset Transaction">
                        <Square size="7px" bg={assetColor} borderRadius="sm" />
                      </Tooltip>
                    )}
                    {transaction.is_mf_transaction && (
                      <Tooltip content="Mutual Fund Transaction">
                        <Square size="7px" bg={mutualFundColor} borderRadius="sm" />
                      </Tooltip>
                    )}
                </HStack>
              )}
            </HStack>

            {onQuickFilter && displayCategoryId ? (
              <Text
                fontWeight="semibold"
                fontSize="md"
                color={accountLinkColor}
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
                onClick={(e) => { e.stopPropagation(); onQuickFilter("category_id", displayCategoryId); }}
              >
                {displayCategoryName}
              </Text>
            ) : (
              <Text fontWeight="semibold" fontSize="md">{displayCategoryName}</Text>
            )}

            {/* Notes section - visible by default */}
            {transaction.notes && (
              <Text fontSize="sm" color="secondaryTextColor" mt={0.5} lineClamp={2} lineHeight="1.5">
                {transaction.notes}
              </Text>
            )}

            {/* Account name - displayed when showAccountName is true */}
            {showAccountName && transaction.account_name && transaction.account_id && (
              <ChakraLink fontSize="sm" color={accountLinkColor} mt={0.5} asChild><Link to={`/account/${transaction.account_id}`}>
                  {transaction.account_name}
                </Link></ChakraLink>
            )}

            {/* Store and Location - displayed at bottom of visible area */}
            {(transaction.store || transaction.location) && (
              <HStack mt={1} gap={1.5}>
                {transaction.store && (
                  <Tag.Root
                    size="sm"
                    borderRadius="full"
                    bg={storeTagBg}
                    color={storeTagColor}
                    border="1px solid"
                    borderColor={storeTagBorderColor}
                    fontSize="xs"
                    fontWeight="medium"
                    cursor={onQuickFilter ? "pointer" : undefined}
                    _hover={onQuickFilter ? { opacity: 0.8 } : undefined}
                    onClick={onQuickFilter ? (e) => { e.stopPropagation(); onQuickFilter("store", transaction.store!); } : undefined}
                  >
                    <Tag.Label>{transaction.store}</Tag.Label>
                  </Tag.Root>
                )}
                {transaction.location && (
                  <Tag.Root
                    size="sm"
                    borderRadius="full"
                    bg={storeTagBg}
                    color={storeTagColor}
                    border="1px solid"
                    borderColor={storeTagBorderColor}
                    fontSize="xs"
                    fontWeight="medium"
                    cursor={onQuickFilter ? "pointer" : undefined}
                    _hover={onQuickFilter ? { opacity: 0.8 } : undefined}
                    onClick={onQuickFilter ? (e) => { e.stopPropagation(); onQuickFilter("location", transaction.location!); } : undefined}
                  >
                    <Tag.Label>{transaction.location}</Tag.Label>
                  </Tag.Root>
                )}
              </HStack>
            )}
           </VStack>

            {/* Right side with amount */}
            <Box textAlign="right">
              <HStack gap={0} align="baseline">
                <Text fontWeight="bold" fontSize="lg" color={amount.color} letterSpacing="-0.01em">
                  {splitCurrencyForDisplay(amountValue, currencySymbol || "₹").main}
                </Text>
                <Text fontSize="xs" color={amount.color} opacity={0.6}>
                  {splitCurrencyForDisplay(amountValue, currencySymbol || "₹").decimals}
                </Text>
              </HStack>
            </Box>
        </Flex>

        {/* Expandable section */}
        {isExpanded && (
          <Box mt={4} pt={3} borderTop="1px solid" borderColor={expandedSectionBorder}>
            {/* Tags section */}
            {transaction.tags && transaction.tags.length > 0 && (
              <Box mt={1}>
                <HStack mb={1}>
                  <Icon color="tertiaryTextColor" boxSize={3.5} asChild><TagIcon /></Icon>
                  <Text fontSize="xs" fontWeight="bold" color="secondaryTextColor" textTransform="uppercase" letterSpacing="wider">
                    Tags
                  </Text>
                </HStack>
                <Wrap gap={2} ml={6}>
                  {transaction.tags.map((tag) => (
                    <WrapItem key={tag.tag_id}>
                      <Tag.Root
                        size="sm"
                        borderRadius="md"
                        variant="subtle"
                        colorPalette="brand"
                        cursor={onQuickFilter ? "pointer" : undefined}
                        _hover={onQuickFilter ? { opacity: 0.8 } : undefined}
                        onClick={onQuickFilter ? (e) => { e.stopPropagation(); onQuickFilter("tags", tag.name); } : undefined}
                      >
                        <Tag.Label>{tag.name}</Tag.Label>
                      </Tag.Root>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            {/* Split transaction details (non-transfer, non-MF splits only) */}
            {transaction.is_split && !transaction.is_transfer && !transaction.is_mf_transaction && (
              <Box mt={3}>
                <Button
                  size="xs"
                  colorPalette="purple"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchSplitTransactions(transaction.transaction_id);
                  }}
                  mb={2}
                  borderRadius="lg"
                  fontWeight="bold"><Info size={14} />View Split Details
                                  </Button>

                {isSplitLoading ? (
                  <SplitTransactionSkeleton />
                ) : (
                  splitTransactions.length > 0 && (
                    <Box
                      border="1px solid"
                      borderColor={expandedSectionBorder}
                      borderRadius="xl"
                      p={2}
                      bg={splitBg}
                    >
                      {splitTransactions.map((split) => (
                        <Box
                          key={split.split_id}
                          p={2}
                          borderBottomWidth={
                            splitTransactions.indexOf(split) !==
                            splitTransactions.length - 1
                              ? "1px"
                              : "0"
                          }
                          borderColor={expandedSectionBorder}
                        >
                          {/* Split main row with category and amount */}
                          <Flex justify="space-between">
                            <Text fontSize="sm" fontWeight="medium">
                              {split.category_name}
                            </Text>
                             <HStack gap={0} align="baseline">
                               <Text fontSize="sm" fontWeight="semibold">
                                 {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").main}
                               </Text>
                               <Text fontSize="xs" opacity={0.7}>
                                 {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").decimals}
                               </Text>
                             </HStack>
                          </Flex>

                          {/* Split notes row - only displayed if notes exist */}
                          {split.notes && (
                            <Flex align="center" mt={1}>
                              <Icon color="tertiaryTextColor" mr={1} fontSize="xs" asChild><MessageSquare /></Icon>
                              <Text
                                fontSize="xs"
                                color="secondaryTextColor"
                                lineClamp={2}
                              >
                                {split.notes}
                              </Text>
                            </Flex>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )
                )}
              </Box>
            )}

            {/* Transfer fee / MF charges details */}
            {(transaction.is_transfer || transaction.is_mf_transaction) && transaction.is_split && (
              <Box mt={3}>
                <Button
                  size="xs"
                  colorPalette="orange"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchSplitTransactions(transaction.transaction_id);
                  }}
                  mb={2}
                  borderRadius="lg"
                  fontWeight="bold"><Info size={14} />{transaction.is_mf_transaction ? "View Charge Details" : "View Fee Details"}</Button>

                {isSplitLoading ? (
                  <SplitTransactionSkeleton />
                ) : (
                  splitTransactions.filter(s => s.category_name).length > 0 && (
                    <Box
                      border="1px solid"
                      borderColor={expandedSectionBorder}
                      borderRadius="xl"
                      p={2}
                      bg={splitBg}
                    >
                      {splitTransactions
                        .filter(s => s.category_name)
                        .map((split) => (
                          <Box key={split.split_id} p={2}>
                            <Flex justify="space-between">
                              <Text fontSize="sm" fontWeight="medium">
                                {split.category_name}
                              </Text>
                              <HStack gap={0} align="baseline">
                                <Text fontSize="sm" fontWeight="semibold">
                                  {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").main}
                                </Text>
                                <Text fontSize="xs" opacity={0.7}>
                                  {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").decimals}
                                </Text>
                              </HStack>
                            </Flex>
                          </Box>
                        ))}
                    </Box>
                  )
                )}
              </Box>
            )}

            {/* Transfer details */}
            {transaction.is_transfer && (
              <Box mt={3}>
                <Button
                  size="xs"
                  colorPalette="blue"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchTransferDetails(transaction.transfer_id!);
                  }}
                  mb={2}
                  borderRadius="lg"
                  fontWeight="bold"><CreditCard size={14} />View Transfer Details
                                  </Button>

                {isTransferLoading ? (
                  <TransferDetailsSkeleton />
                ) : (
                  transferDetails && (
                    <Box border="1px solid" borderColor={expandedSectionBorder} borderRadius="xl" p={3} bg={transferBg}>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        {transaction.debit > 0
                          ? "Transferred to:"
                          : "Transferred from:"}
                      </Text>
                      <Text fontSize="md" fontWeight="bold">
                        {transaction.debit > 0
                          ? transferDetails.destination_account_name || "N/A"
                          : transferDetails.source_account_name || "N/A"}
                      </Text>
                      <Text fontSize="xs" color="secondaryTextColor">
                        {transaction.debit > 0
                          ? transferDetails.destination_ledger_name || "N/A"
                          : transferDetails.source_ledger_name || "N/A"}
                      </Text>
                    </Box>
                  )
                )}
              </Box>
            )}
            {/* Action Icons */}
             <Flex justify="flex-end" mt={3} gap={1}>
                {!transaction.is_asset_transaction && !transaction.is_mf_transaction && transaction.transfer_type !== "destination" && (
                  <>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorPalette="blue"
                      aria-label="Edit transaction"
                      borderRadius="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTransaction(transaction);
                      }}
                      data-testid="transactioncard-edit-icon"><Edit size={16} /></IconButton>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorPalette="gray"
                      aria-label="Copy transaction"
                      borderRadius="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyTransaction(transaction);
                      }}
                      data-testid="transactioncard-copy-icon"><Copy size={16} /></IconButton>
                  </>
                )}
                {!transaction.is_asset_transaction && !transaction.is_mf_transaction && transaction.transfer_type !== "destination" && (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    aria-label="Delete transaction"
                    borderRadius="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen();
                    }}
                    data-testid="transactioncard-delete-icon"><Trash2 size={16} /></IconButton>
                )}
             </Flex>
          </Box>
        )}
      </Box>

      <DeleteTransactionModal
        isOpen={open}
        onClose={onClose}
        onDelete={onDeleteTransaction}
        transaction={transaction}
        currencySymbol={currencySymbol || "₹"}
        amountColor={amount.color}
        amountValue={amountValue}
      />
    </>
  );
};

export default React.memo(TransactionCard);
