import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  Icon,
  Square,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  IconButton,
  useBreakpointValue,
  Link as ChakraLink,
  useColorModeValue,
} from "@chakra-ui/react";
import { Calendar, Tag as TagIcon, Info, CreditCard, Trash2, MessageSquare, Edit, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatAmount,
  formatDate,
} from "@/components/shared/utils";
import { SplitTransactionSkeleton, TransferDetailsSkeleton } from "./Skeletons";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../mutual-funds/utils";

interface TagItem {
  tag_id: string;
  name: string;
}

interface FilterMatchedSplit {
  split_id: string;
  category_id: string;
  category_name: string;
  debit: number;
  credit: number;
  notes?: string;
}

interface SplitTransaction {
  split_id: string;
  category_name: string | null;
  debit: number;
  notes?: string;
}

interface TransferDetails {
  destination_account_name?: string;
  source_account_name?: string;
  destination_ledger_name?: string;
  source_ledger_name?: string;
}

interface Transaction {
  transaction_id: string;
  date: string;
  category_name: string;
  notes?: string;
  store?: string;
  location?: string;
  account_id?: string;
  account_name?: string;
  is_split: boolean;
  is_transfer: boolean;
  is_asset_transaction: boolean;
  is_mf_transaction: boolean;
  credit: number;
  debit: number;
  tags?: TagItem[];
  transfer_id?: string;
  transfer_type?: string;
  filter_matched_split?: FilterMatchedSplit;
}

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
  showAccountName = false,
}) => {
  const { currencySymbol } = useLedgerStore();
  const displayCredit = transaction.filter_matched_split?.credit ?? transaction.credit;
  const displayDebit = transaction.filter_matched_split?.debit ?? transaction.debit;
  const displayCategoryName = transaction.filter_matched_split?.category_name ?? transaction.category_name;
  const amount = formatAmount(displayCredit, displayDebit, currencySymbol as string);
  const amountValue = displayCredit !== 0 ? displayCredit : displayDebit;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const modalSize = useBreakpointValue({ base: "full", md: "md" });
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDeleteTransaction(transaction.transaction_id);
      onClose();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setIsDeleting(false);
    }
  };

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
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorderColor = useColorModeValue("gray.100", "gray.700");
  const modalDetailBg = useColorModeValue("gray.50", "gray.700");
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
        sx={{ '@media (hover: hover)': { '&:hover': { borderColor: cardHoverBorder } } }}
      >
        {/* Main row with essential info */}
        <Flex justify="space-between" align="flex-start">
          {/* Left side with date, category and notes */}
          <VStack align="flex-start" spacing={1} maxW="70%">
            <HStack spacing={2}>
              <Icon as={Calendar} color="tertiaryTextColor" boxSize={3.5} />
              <Text fontSize="sm" color="secondaryTextColor">
                {formatDate(transaction.date)}
              </Text>

              {/* Transaction type indicators */}
              {(transaction.is_split || transaction.is_transfer || transaction.is_asset_transaction || transaction.is_mf_transaction) && (
                <HStack spacing={1}>
                  {transaction.is_split && !transaction.is_transfer && (
                    <Tooltip label="Split Transaction">
                      <Square size="7px" bg={splitColor} borderRadius="sm" />
                    </Tooltip>
                  )}
                  {transaction.is_transfer && (
                    <Tooltip label="Transfer">
                      <Square size="7px" bg={transferColor} borderRadius="sm" />
                    </Tooltip>
                  )}
                  {transaction.is_transfer && transaction.is_split && (
                    <Tooltip label="Transfer Fee">
                      <Square size="7px" bg="orange.400" borderRadius="sm" />
                    </Tooltip>
                  )}
                    {transaction.is_asset_transaction && (
                      <Tooltip label="Asset Transaction">
                        <Square size="7px" bg={assetColor} borderRadius="sm" />
                      </Tooltip>
                    )}
                    {transaction.is_mf_transaction && (
                      <Tooltip label="Mutual Fund Transaction">
                        <Square size="7px" bg={mutualFundColor} borderRadius="sm" />
                      </Tooltip>
                    )}
                </HStack>
              )}
            </HStack>

            <Text fontWeight="semibold" fontSize="md">{displayCategoryName}</Text>

            {/* Notes section - visible by default */}
            {transaction.notes && (
              <Text fontSize="sm" color="secondaryTextColor" mt={0.5} noOfLines={2} lineHeight="1.5">
                {transaction.notes}
              </Text>
            )}

            {/* Account name - displayed when showAccountName is true */}
            {showAccountName && transaction.account_name && transaction.account_id && (
              <ChakraLink as={Link} to={`/account/${transaction.account_id}`} fontSize="sm" color={accountLinkColor} mt={0.5}>
                {transaction.account_name}
              </ChakraLink>
            )}

            {/* Store and Location - displayed at bottom of visible area */}
            {(transaction.store || transaction.location) && (
              <Box mt={1}>
                <Tag
                  size="sm"
                  borderRadius="full"
                  bg={storeTagBg}
                  color={storeTagColor}
                  border="1px solid"
                  borderColor={storeTagBorderColor}
                  fontSize="xs"
                  fontWeight="medium"
                >
                  <TagLabel>
                    {[transaction.store, transaction.location].filter(Boolean).join(", ")}
                  </TagLabel>
                </Tag>
              </Box>
            )}
           </VStack>

            {/* Right side with amount */}
            <Box textAlign="right">
              <HStack spacing={0} align="baseline">
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
                  <Icon as={TagIcon} color="tertiaryTextColor" boxSize={3.5} />
                  <Text fontSize="xs" fontWeight="bold" color="secondaryTextColor" textTransform="uppercase" letterSpacing="wider">
                    Tags
                  </Text>
                </HStack>
                <Wrap spacing={2} ml={6}>
                  {transaction.tags.map((tag) => (
                    <WrapItem key={tag.tag_id}>
                      <Tag
                        size="sm"
                        borderRadius="md"
                        variant="subtle"
                        colorScheme="brand"
                      >
                        <TagLabel>{tag.name}</TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            {/* Split transaction details (non-transfer splits only) */}
            {transaction.is_split && !transaction.is_transfer && (
              <Box mt={3}>
                <Button
                  size="xs"
                  leftIcon={<Info size={14} />}
                  colorScheme="purple"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchSplitTransactions(transaction.transaction_id);
                  }}
                  mb={2}
                  borderRadius="lg"
                  fontWeight="bold"
                >
                  View Split Details
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
                             <HStack spacing={0} align="baseline">
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
                              <Icon
                                as={MessageSquare}
                                color="tertiaryTextColor"
                                mr={1}
                                fontSize="xs"
                              />
                              <Text
                                fontSize="xs"
                                color="secondaryTextColor"
                                noOfLines={2}
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

            {/* Transfer fee details */}
            {transaction.is_transfer && transaction.is_split && (
              <Box mt={3}>
                <Button
                  size="xs"
                  leftIcon={<Info size={14} />}
                  colorScheme="orange"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchSplitTransactions(transaction.transaction_id);
                  }}
                  mb={2}
                  borderRadius="lg"
                  fontWeight="bold"
                >
                  View Fee Details
                </Button>

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
                              <HStack spacing={0} align="baseline">
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
                  leftIcon={<CreditCard size={14} />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchTransferDetails(transaction.transfer_id!);
                  }}
                  mb={2}
                  borderRadius="lg"
                  fontWeight="bold"
                >
                  View Transfer Details
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
                      colorScheme="blue"
                      icon={<Edit size={16} />}
                      aria-label="Edit transaction"
                      borderRadius="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTransaction(transaction);
                      }}
                      data-testid="transactioncard-edit-icon"
                    />
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                      icon={<Copy size={16} />}
                      aria-label="Copy transaction"
                      borderRadius="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyTransaction(transaction);
                      }}
                      data-testid="transactioncard-copy-icon"
                    />
                  </>
                )}
                {!transaction.is_asset_transaction && !transaction.is_mf_transaction && transaction.transfer_type !== "destination" && (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    icon={<Trash2 size={16} />}
                    aria-label="Delete transaction"
                    borderRadius="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen();
                    }}
                    data-testid="transactioncard-delete-icon"
                  />
                )}
             </Flex>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isOpen}
        returnFocusOnClose={false}
        onClose={onClose}
        size={modalSize}
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <ModalContent
          margin={isMobile ? 0 : "auto"}
          borderRadius={isMobile ? 0 : "xl"}
          bg={modalBg}
          border="1px solid"
          borderColor={modalBorderColor}
          boxShadow="2xl"
        >
          <ModalHeader fontWeight="800" letterSpacing="-0.02em">Delete Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this transaction?</Text>
            <Box mt={4} p={3} bg={modalDetailBg} borderRadius="xl" border="1px solid" borderColor={modalBorderColor}>
              <Text fontWeight="bold">{transaction.category_name}</Text>
              <Text fontSize="sm" color="secondaryTextColor">{formatDate(transaction.date)}</Text>
                <HStack spacing={0} align="baseline" mt={1}>
                  <Text fontWeight="bold" color={amount.color}>
                    {splitCurrencyForDisplay(amountValue, currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="xs" color={amount.color} opacity={0.6}>
                    {splitCurrencyForDisplay(amountValue, currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isDeleting} borderRadius="lg">
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isDeleting}
              loadingText="Deleting"
              leftIcon={<Trash2 size={16} />}
              borderRadius="lg"
              fontWeight="bold"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default React.memo(TransactionCard);
