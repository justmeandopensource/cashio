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

interface SplitTransaction {
  split_id: string;
  category_name: string;
  debit: number;
  notes?: string; // Added notes field to SplitTransaction
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
}

interface TransactionCardProps {
  transaction: Transaction;
  isExpanded: boolean;
  // eslint-disable-next-line no-unused-vars
  toggleExpand: (e: React.MouseEvent) => void;
  // eslint-disable-next-line no-unused-vars
  fetchSplitTransactions: (transactionId: string) => void;
  splitTransactions: SplitTransaction[];
  // eslint-disable-next-line no-unused-vars
  fetchTransferDetails: (transferId: string) => void;
  transferDetails?: TransferDetails;
  isSplitLoading: boolean;
  isTransferLoading: boolean;
  // eslint-disable-next-line no-unused-vars
  onDeleteTransaction: (transactionId: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  onEditTransaction: (transaction: Transaction) => void;
  // eslint-disable-next-line no-unused-vars
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
  const amount = formatAmount(
    transaction.credit,
    transaction.debit,
    currencySymbol as string
  );
  const amountValue = transaction.credit !== 0 ? transaction.credit : transaction.debit;

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
  const hoverBg = useColorModeValue("secondaryBg", "secondaryBg");
  const splitColor = useColorModeValue("split", "split");
  const transferColor = useColorModeValue("transfer", "transfer");
  const assetColor = useColorModeValue("asset", "asset");
  const mutualFundColor = useColorModeValue("mutualFund", "mutualFund");
  const accountLinkColor = useColorModeValue("brand.500", "brand.300");
  const storeTagBg = useColorModeValue("brand.50", "brand.900");
  const storeTagColor = useColorModeValue("brand.700", "brand.200");
  const storeTagBorderColor = useColorModeValue("brand.200", "brand.700");
  const splitBg = useColorModeValue("splitBg", "splitBg");
  const transferBg = useColorModeValue("transferBg", "transferBg");
  const modalBg = useColorModeValue("secondaryBg", "secondaryBg");

  return (
    <>
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        mb={3}
        bg={cardBg}
        boxShadow="sm"
        onClick={toggleExpand}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ bg: hoverBg }}
      >
        {/* Main row with essential info */}
        <Flex justify="space-between" align="flex-start">
          {/* Left side with date, category and notes */}
          <VStack align="flex-start" spacing={1} maxW="70%">
            <HStack spacing={2}>
              <Icon as={Calendar} color="tertiaryTextColor" />
              <Text fontSize="sm" color="secondaryTextColor">
                {formatDate(transaction.date)}
              </Text>

              {/* Transaction type indicators */}
              {(transaction.is_split || transaction.is_transfer || transaction.is_asset_transaction || transaction.is_mf_transaction) && (
                <HStack spacing={1}>
                  {transaction.is_split && (
                    <Tooltip label="Split Transaction">
                      <Square size="8px" bg={splitColor} borderRadius="md" />
                    </Tooltip>
                  )}
                  {transaction.is_transfer && (
                    <Tooltip label="Transfer">
                      <Square size="8px" bg={transferColor} borderRadius="md" />
                    </Tooltip>
                  )}
                    {transaction.is_asset_transaction && (
                      <Tooltip label="Asset Transaction">
                        <Square size="8px" bg={assetColor} borderRadius="md" />
                      </Tooltip>
                    )}
                    {transaction.is_mf_transaction && (
                      <Tooltip label="Mutual Fund Transaction">
                        <Square size="8px" bg={mutualFundColor} borderRadius="md" />
                      </Tooltip>
                    )}
                </HStack>
              )}
            </HStack>

            <Text fontWeight="medium">{transaction.category_name}</Text>

            {/* Notes section - visible by default */}
            {transaction.notes && (
              <Text fontSize="sm" color="secondaryTextColor" mt={1} noOfLines={2}>
                {transaction.notes}
              </Text>
            )}

            {/* Account name - displayed when showAccountName is true */}
            {showAccountName && transaction.account_name && transaction.account_id && (
              <ChakraLink as={Link} to={`/account/${transaction.account_id}`} fontSize="sm" color={accountLinkColor} mt={1}>
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
                <Text fontWeight="semibold" fontSize="lg" color={amount.color}>
                  {splitCurrencyForDisplay(amountValue, currencySymbol || "₹").main}
                </Text>
                <Text fontSize="xs" color={amount.color} opacity={0.7}>
                  {splitCurrencyForDisplay(amountValue, currencySymbol || "₹").decimals}
                </Text>
              </HStack>
            </Box>
        </Flex>

        {/* Expandable section */}
        {isExpanded && (
          <Box mt={4} pt={3} borderTopWidth="1px">
            {/* Tags section */}
            {transaction.tags && transaction.tags.length > 0 && (
              <Box mt={1}>
                <HStack mb={1}>
                  <Icon as={TagIcon} color="tertiaryTextColor" />
                  <Text fontSize="xs" fontWeight="medium" color="secondaryTextColor">
                    TAGS
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

            {/* Split transaction details */}
            {transaction.is_split && (
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
                >
                  View Split Details
                </Button>

                {isSplitLoading ? (
                  <SplitTransactionSkeleton />
                ) : (
                  splitTransactions.length > 0 && (
                    <Box
                      borderWidth="1px"
                      borderRadius="md"
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
                >
                  View Transfer Details
                </Button>

                {isTransferLoading ? (
                  <TransferDetailsSkeleton />
                ) : (
                  transferDetails && (
                    <Box borderWidth="1px" borderRadius="md" p={3} bg={transferBg}>
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
             <Flex justify="flex-end" mt={3} gap={2}>
                {!transaction.is_transfer && !transaction.is_asset_transaction && !transaction.is_mf_transaction && (
                  <>
                    <Button
                      size="md"
                      variant="ghost"
                      colorScheme="blue"
                      leftIcon={<Edit size={18} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTransaction(transaction);
                      }}
                      data-testid="transactioncard-edit-icon"
                    />
                    <Button
                      size="md"
                      variant="ghost"
                      colorScheme="gray"
                      leftIcon={<Copy size={18} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyTransaction(transaction);
                      }}
                      data-testid="transactioncard-copy-icon"
                    />
                  </>
                )}
                {!transaction.is_asset_transaction && !transaction.is_mf_transaction && (
                  <Button
                    size="md"
                    variant="ghost"
                    colorScheme="red"
                    leftIcon={<Trash2 size={18} />}
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={modalSize}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent
          margin={isMobile ? 0 : "auto"}
          borderRadius={isMobile ? 0 : "md"}
        >
          <ModalHeader>Delete Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this transaction?</Text>
            <Box mt={4} p={3} bg={modalBg} borderRadius="md">
              <Text fontWeight="bold">{transaction.category_name}</Text>
              <Text>{formatDate(transaction.date)}</Text>
                <HStack spacing={0} align="baseline">
                  <Text fontWeight="semibold" color={amount.color}>
                    {splitCurrencyForDisplay(amountValue, currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="xs" color={amount.color} opacity={0.7}>
                    {splitCurrencyForDisplay(amountValue, currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isDeleting}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isDeleting}
              loadingText="Deleting"
              leftIcon={<Trash2 size={18} />}
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
