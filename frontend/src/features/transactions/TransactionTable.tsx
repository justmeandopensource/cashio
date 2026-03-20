import React, { useState } from "react";
import { formatDate } from "@/components/shared/utils";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  Popover,
  PopoverContent,
  PopoverBody,
  Box,
  Text,
  PopoverTrigger,
  PopoverArrow,
  Flex,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Badge,
  Link as ChakraLink,
  useBreakpointValue,
  useColorModeValue,
  HStack,
  VStack,
  Divider,
} from "@chakra-ui/react";
import { Trash2, Edit, Copy, ArrowDown } from "lucide-react";
import { splitCurrencyForDisplay } from "../mutual-funds/utils";
import { Link } from "react-router-dom";
import { SplitTransactionSkeleton, TransferDetailsSkeleton } from "./Skeletons";
import useLedgerStore from "@/components/shared/store";

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
  account_id?: string;
  account_name?: string;
  tags?: TagItem[];
  is_split: boolean;
  is_transfer: boolean;
  is_asset_transaction: boolean;
  is_mf_transaction: boolean;
  notes?: string;
  store?: string;
  location?: string;
  credit: number;
  debit: number;
  transfer_id?: string;
  transfer_type?: string;
  filter_matched_split?: FilterMatchedSplit;
}

interface TransactionTableProps {
  transactions: Transaction[];
  // eslint-disable-next-line no-unused-vars
  fetchSplitTransactions: (transactionId: string) => void;
  // eslint-disable-next-line no-unused-vars
  fetchTransferDetails: (transferId: string) => void;
  isSplitLoading: boolean;
  splitTransactions: SplitTransaction[];
  isTransferLoading: boolean;
  transferDetails?: TransferDetails;
  // eslint-disable-next-line no-unused-vars
  onDeleteTransaction: (transactionId: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  onEditTransaction: (transaction: Transaction) => void;
  // eslint-disable-next-line no-unused-vars
  onCopyTransaction: (transaction: Transaction) => void;
  showAccountName?: boolean;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  fetchSplitTransactions,
  fetchTransferDetails,
  isSplitLoading,
  splitTransactions,
  isTransferLoading,
  transferDetails,
  onDeleteTransaction,
  onEditTransaction,
  onCopyTransaction,
  showAccountName = false,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);

  const { currencySymbol } = useLedgerStore();

  // Responsive modal settings
  const modalSize = useBreakpointValue({ base: "full", md: "md" });
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!selectedTransactionId) return;
    try {
      await onDeleteTransaction(selectedTransactionId);
      onClose();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tableBorderColor = useColorModeValue("gray.100", "gray.600");
  const headerColor = useColorModeValue("gray.400", "gray.500");
  const accountLinkColor = useColorModeValue("brand.500", "brand.300");
  const storeTagBg = useColorModeValue("brand.50", "brand.800");
  const storeTagColor = useColorModeValue("brand.700", "brand.200");
  const storeTagBorderColor = useColorModeValue("brand.200", "brand.600");
  const tagBg = useColorModeValue("gray.100", "gray.600");
  const tagColor = useColorModeValue("gray.600", "gray.200");
  const creditColor = useColorModeValue("brand.500", "brand.300");
  const debitColor = useColorModeValue("red.500", "red.300");
  const editIconColor = useColorModeValue("blue.500", "blue.300");
  const editIconHoverColor = useColorModeValue("blue.600", "blue.400");
  const copyIconColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
  const copyIconHoverColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const deleteIconColor = useColorModeValue("red.500", "red.300");
  const deleteIconHoverColor = useColorModeValue("red.600", "red.400");
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const transferTooltipBg = useColorModeValue("white", "gray.800");
  const transferTooltipBorderColor = useColorModeValue("gray.100", "gray.600");
  const transferTooltipLabelColor = useColorModeValue("gray.400", "gray.500");
  const transferTooltipAccountColor = useColorModeValue("gray.800", "gray.100");
  const transferTooltipLedgerColor = useColorModeValue("gray.500", "gray.400");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorderColor = useColorModeValue("gray.100", "gray.700");

  return (
    <>
      <Box
        borderRadius="xl"
        overflow="hidden"
        border="1px solid"
        borderColor={tableBorderColor}
      >
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th width="8%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Date</Th>
              <Th width="15%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Category</Th>
              {showAccountName && <Th width="12%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Account</Th>}
              <Th color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Notes</Th>
              <Th width="6%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Type</Th>
              <Th width="10%" isNumeric color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>
                Credit
              </Th>
              <Th width="10%" isNumeric color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>
                Debit
              </Th>
              <Th width="2%" borderBottomColor={tableBorderColor}>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
             {transactions
               .sort((a, b) => {
                 const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
                 if (dateComparison === 0) {
                   return parseInt(b.transaction_id) - parseInt(a.transaction_id);
                 }
                 return dateComparison;
               })
              .map((transaction) => {
                const displayCredit = transaction.filter_matched_split?.credit ?? transaction.credit;
                const displayDebit = transaction.filter_matched_split?.debit ?? transaction.debit;
                const displayCategoryName = transaction.filter_matched_split?.category_name ?? transaction.category_name;
                return (
              <Tr
                key={transaction.transaction_id}
                _hover={{ bg: hoverBg }}
                transition="background 0.15s ease"
                sx={{
                  "&:hover .action-icons": {
                    opacity: 1,
                  },
                }}
              >
                <Td width="8%" borderBottomColor={tableBorderColor}><Text color={tertiaryTextColor} fontSize="sm">{formatDate(transaction.date)}</Text></Td>
                <Td width="15%" borderBottomColor={tableBorderColor}><Text color={tertiaryTextColor} isTruncated title={displayCategoryName} fontSize="sm">{displayCategoryName}</Text></Td>
                {showAccountName && (
                  <Td width="12%" borderBottomColor={tableBorderColor}>
                    {transaction.account_name && transaction.account_id && (
                      <ChakraLink as={Link} to={`/account/${transaction.account_id}`} color={accountLinkColor} isTruncated display="block" title={transaction.account_name} fontSize="sm">
                        {transaction.account_name}
                      </ChakraLink>
                    )}
                  </Td>
                )}
                 <Td borderBottomColor={tableBorderColor}>
                   <Flex alignItems="center" flexWrap="wrap" gap={2}>
                     {transaction.notes && (
                       <Text color={tertiaryTextColor} title={transaction.notes} flexShrink={1} minW={0} fontSize="sm">
                         {transaction.notes}
                       </Text>
                     )}
                     {(transaction.store || transaction.location) && (
                       <Tag
                         size="sm"
                         borderRadius="full"
                         bg={storeTagBg}
                         color={storeTagColor}
                         border="1px solid"
                         borderColor={storeTagBorderColor}
                         fontSize="xs"
                         fontWeight="medium"
                         flexShrink={0}
                       >
                         <TagLabel>
                           {[transaction.store, transaction.location].filter(Boolean).join(", ")}
                         </TagLabel>
                       </Tag>
                     )}
                     {transaction.tags && transaction.tags.map((tag) => (
                       <Tag
                         key={tag.tag_id}
                         size="sm"
                         borderRadius="md"
                         bg={tagBg}
                         color={tagColor}
                         flexShrink={0}
                         fontSize="xs"
                       >
                         <TagLabel>{tag.name}</TagLabel>
                       </Tag>
                     ))}
                   </Flex>
                 </Td>
                 <Td width="6%" borderBottomColor={tableBorderColor}>
                   <Flex gap={1} flexWrap="nowrap">
                     {transaction.is_split && !transaction.is_transfer && (
                       <Popover
                         trigger="hover"
                         openDelay={250}
                         closeDelay={100}
                         onOpen={() => fetchSplitTransactions(transaction.transaction_id)}
                         strategy="fixed"
                         placement="right"
                         gutter={10}
                       >
                         <PopoverTrigger>
                           <Badge
                             colorScheme="purple"
                             variant="subtle"
                             cursor="default"
                             px={1.5}
                             borderRadius="md"
                             fontSize="0.6em"
                             fontWeight="bold"
                             letterSpacing="0.03em"
                             data-testid="transactiontable-split-indicator"
                           >
                             SPLIT
                           </Badge>
                         </PopoverTrigger>
                         <PopoverContent
                           bg={transferTooltipBg}
                           borderColor={transferTooltipBorderColor}
                           borderWidth="1px"
                           boxShadow="0 8px 24px -4px rgba(0,0,0,0.12)"
                           borderRadius="xl"
                           width="auto"
                           minW="260px"
                           maxW="420px"
                           _focus={{ outline: "none" }}
                         >
                           <PopoverArrow bg={transferTooltipBg} shadowColor={transferTooltipBorderColor} />
                           <PopoverBody p={0}>
                             {isSplitLoading ? (
                               <Flex justify="center" align="center" minH="80px" p={3}>
                                 <SplitTransactionSkeleton />
                               </Flex>
                             ) : (
                               <Box>
                                 <Box px={3} pt={3} pb={2}>
                                   <Text
                                     fontSize="10px"
                                     fontWeight="bold"
                                     textTransform="uppercase"
                                     letterSpacing="wider"
                                     color={transferTooltipLabelColor}
                                   >
                                     Split Details
                                   </Text>
                                 </Box>
                                 <Divider borderColor={transferTooltipBorderColor} />
                                 <VStack spacing={0} align="stretch" divider={<Divider borderColor={transferTooltipBorderColor} />}>
                                   {splitTransactions.map((split) => (
                                     <Box key={split.split_id} px={3} py={2.5}>
                                       <Flex justify="space-between" align="baseline" gap={4}>
                                         <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor} noOfLines={1}>
                                           {split.category_name}
                                         </Text>
                                         <HStack spacing={0} align="baseline" flexShrink={0}>
                                           <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor}>
                                             {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").main}
                                           </Text>
                                           <Text fontSize="xs" color={transferTooltipLedgerColor}>
                                             {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").decimals}
                                           </Text>
                                         </HStack>
                                       </Flex>
                                       {split.notes && (
                                         <Text fontSize="xs" color={transferTooltipLedgerColor} mt={0.5} noOfLines={1}>
                                           {split.notes}
                                         </Text>
                                       )}
                                     </Box>
                                   ))}
                                 </VStack>
                               </Box>
                             )}
                           </PopoverBody>
                         </PopoverContent>
                       </Popover>
                     )}
                     {transaction.is_transfer && transaction.is_split && (
                       <Popover
                         trigger="hover"
                         openDelay={250}
                         closeDelay={100}
                         onOpen={() => fetchSplitTransactions(transaction.transaction_id)}
                         strategy="fixed"
                         placement="right"
                         gutter={10}
                       >
                         <PopoverTrigger>
                           <Badge
                             colorScheme="orange"
                             variant="subtle"
                             cursor="default"
                             px={1.5}
                             borderRadius="md"
                             fontSize="0.6em"
                             fontWeight="bold"
                             letterSpacing="0.03em"
                           >
                             FEE
                           </Badge>
                         </PopoverTrigger>
                         <PopoverContent
                           bg={transferTooltipBg}
                           borderColor={transferTooltipBorderColor}
                           borderWidth="1px"
                           boxShadow="0 8px 24px -4px rgba(0,0,0,0.12)"
                           borderRadius="xl"
                           width="auto"
                           minW="220px"
                           maxW="360px"
                           _focus={{ outline: "none" }}
                         >
                           <PopoverArrow bg={transferTooltipBg} shadowColor={transferTooltipBorderColor} />
                           <PopoverBody p={0}>
                             {isSplitLoading ? (
                               <Flex justify="center" align="center" minH="60px" p={3}>
                                 <SplitTransactionSkeleton />
                               </Flex>
                             ) : (
                               <Box>
                                 <Box px={3} pt={3} pb={2}>
                                   <Text
                                     fontSize="10px"
                                     fontWeight="bold"
                                     textTransform="uppercase"
                                     letterSpacing="wider"
                                     color={transferTooltipLabelColor}
                                   >
                                     Transfer Fee
                                   </Text>
                                 </Box>
                                 <Divider borderColor={transferTooltipBorderColor} />
                                 <VStack spacing={0} align="stretch" divider={<Divider borderColor={transferTooltipBorderColor} />}>
                                   {splitTransactions
                                     .filter(s => s.category_name)
                                     .map(s => (
                                       <Box key={s.split_id} px={3} py={2.5}>
                                         <Flex justify="space-between" align="baseline" gap={4}>
                                           <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor} noOfLines={1}>
                                             {s.category_name}
                                           </Text>
                                           <HStack spacing={0} align="baseline" flexShrink={0}>
                                             <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor}>
                                               {splitCurrencyForDisplay(s.debit, currencySymbol || "₹").main}
                                             </Text>
                                             <Text fontSize="xs" color={transferTooltipLedgerColor}>
                                               {splitCurrencyForDisplay(s.debit, currencySymbol || "₹").decimals}
                                             </Text>
                                           </HStack>
                                         </Flex>
                                       </Box>
                                     ))}
                                 </VStack>
                               </Box>
                             )}
                           </PopoverBody>
                         </PopoverContent>
                       </Popover>
                     )}
                      {transaction.is_asset_transaction && (
                        <Badge
                          colorScheme="orange"
                          variant="subtle"
                          px={1.5}
                          borderRadius="md"
                          fontSize="0.6em"
                          fontWeight="bold"
                          letterSpacing="0.03em"
                        >
                          ASSET
                        </Badge>
                      )}
                      {transaction.is_mf_transaction && (
                        <Badge
                          colorScheme="green"
                          variant="subtle"
                          px={1.5}
                          borderRadius="md"
                          fontSize="0.6em"
                          fontWeight="bold"
                          letterSpacing="0.03em"
                        >
                          FUND
                        </Badge>
                      )}
                     {transaction.is_transfer && (
                    <Popover
                      trigger="hover"
                      openDelay={250}
                      closeDelay={100}
                      onOpen={() => fetchTransferDetails(transaction.transfer_id!)}
                      placement="right"
                      gutter={10}
                    >
                      <PopoverTrigger>
                        <Badge
                          colorScheme="blue"
                          variant="subtle"
                          cursor="default"
                          px={1.5}
                          borderRadius="md"
                          fontSize="0.6em"
                          fontWeight="bold"
                          letterSpacing="0.03em"
                          data-testid="transactiontable-transfer-indicator"
                        >
                          TRANS
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent
                        bg={transferTooltipBg}
                        borderColor={transferTooltipBorderColor}
                        borderWidth="1px"
                        boxShadow="0 8px 24px -4px rgba(0,0,0,0.12)"
                        borderRadius="xl"
                        width="220px"
                        _focus={{ outline: "none" }}
                      >
                        <PopoverArrow bg={transferTooltipBg} shadowColor={transferTooltipBorderColor} />
                        <PopoverBody p={3}>
                          {isTransferLoading ? (
                            <Flex justify="center" align="center" minH="60px">
                              <TransferDetailsSkeleton />
                            </Flex>
                          ) : transferDetails ? (
                            <VStack spacing={2} align="stretch">
                              <Box>
                                <Text
                                  fontSize="10px"
                                  fontWeight="bold"
                                  textTransform="uppercase"
                                  letterSpacing="wider"
                                  color={transferTooltipLabelColor}
                                  mb={0.5}
                                >
                                  From
                                </Text>
                                <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor} lineHeight="short">
                                  {transferDetails.source_account_name}
                                </Text>
                                <Text fontSize="xs" color={transferTooltipLedgerColor}>
                                  {transferDetails.source_ledger_name}
                                </Text>
                              </Box>
                              <Flex align="center" gap={2}>
                                <Divider borderColor={transferTooltipBorderColor} />
                                <Icon as={ArrowDown} boxSize={3} color={transferTooltipLabelColor} flexShrink={0} />
                                <Divider borderColor={transferTooltipBorderColor} />
                              </Flex>
                              <Box>
                                <Text
                                  fontSize="10px"
                                  fontWeight="bold"
                                  textTransform="uppercase"
                                  letterSpacing="wider"
                                  color={transferTooltipLabelColor}
                                  mb={0.5}
                                >
                                  To
                                </Text>
                                <Text fontSize="sm" fontWeight="semibold" color={transferTooltipAccountColor} lineHeight="short">
                                  {transferDetails.destination_account_name}
                                </Text>
                                <Text fontSize="xs" color={transferTooltipLedgerColor}>
                                  {transferDetails.destination_ledger_name}
                                </Text>
                              </Box>
                            </VStack>
                          ) : null}
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>
                     )}
                   </Flex>
                 </Td>
                 <Td width="10%" isNumeric borderBottomColor={tableBorderColor}>
                   {displayCredit !== 0 && (
                     <HStack spacing={0} align="baseline" justify="flex-end">
                       <Text color={creditColor} fontWeight="semibold" fontSize="sm">
                         {splitCurrencyForDisplay(displayCredit, currencySymbol || "₹").main}
                       </Text>
                       <Text fontSize="xs" color={creditColor} opacity={0.7}>
                         {splitCurrencyForDisplay(displayCredit, currencySymbol || "₹").decimals}
                       </Text>
                     </HStack>
                   )}
                 </Td>
                 <Td width="10%" isNumeric borderBottomColor={tableBorderColor}>
                   {displayDebit !== 0 && (
                     <HStack spacing={0} align="baseline" justify="flex-end">
                       <Text color={debitColor} fontWeight="semibold" fontSize="sm">
                         {splitCurrencyForDisplay(displayDebit, currencySymbol || "₹").main}
                       </Text>
                       <Text fontSize="xs" color={debitColor} opacity={0.7}>
                         {splitCurrencyForDisplay(displayDebit, currencySymbol || "₹").decimals}
                       </Text>
                     </HStack>
                   )}
                 </Td>
                <Td width="2%" borderBottomColor={tableBorderColor}>
                  <Flex
                    gap={2}
                    opacity={0}
                    transition="opacity 0.2s ease"
                    className="action-icons"
                  >
                      {!transaction.is_asset_transaction && !transaction.is_mf_transaction && transaction.transfer_type !== "destination" && (
                        <>
                          <ChakraLink
                            onClick={() => onEditTransaction(transaction)}
                            _hover={{ textDecoration: "none" }}
                          >
                            <Icon
                              as={Edit}
                              boxSize={4}
                              color={editIconColor}
                              _hover={{ color: editIconHoverColor }}
                              transition="color 0.15s ease"
                              data-testid="transactiontable-edit-icon"
                            />
                          </ChakraLink>
                          <ChakraLink
                            onClick={() => onCopyTransaction(transaction)}
                            _hover={{ textDecoration: "none" }}
                          >
                            <Icon
                              as={Copy}
                              boxSize={4}
                              color={copyIconColor}
                              _hover={{ color: copyIconHoverColor }}
                              transition="color 0.15s ease"
                              data-testid="transactiontable-copy-icon"
                            />
                          </ChakraLink>
                        </>
                      )}
                      {!transaction.is_asset_transaction && !transaction.is_mf_transaction && (
                        <ChakraLink
                          onClick={() => {
                            setSelectedTransactionId(transaction.transaction_id);
                            onOpen();
                          }}
                          _hover={{ textDecoration: "none" }}
                        >
                          <Icon
                            as={Trash2}
                            boxSize={4}
                            color={deleteIconColor}
                            _hover={{ color: deleteIconHoverColor }}
                            transition="color 0.15s ease"
                            data-testid="transactiontable-trash-icon"
                          />
                        </ChakraLink>
                      )}
                  </Flex>
                </Td>
              </Tr>
                );
              })}
          </Tbody>
        </Table>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isOpen}
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
            Are you sure you want to delete this transaction?
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="lg">
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete} leftIcon={<Trash2 size={18} />} borderRadius="lg" fontWeight="bold">
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TransactionTable;
