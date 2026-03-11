import React, { useState } from "react";
import { formatDate } from "@/components/shared/utils";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  Popover,
  PopoverContent,
  PopoverBody,
  Stack,
  Box,
  Text,
  PopoverTrigger,
  PopoverArrow,
  Flex,
  PopoverHeader,
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
} from "@chakra-ui/react";
import { CreditCard, Trash2, Edit, Copy } from "lucide-react";
import { splitCurrencyForDisplay } from "../mutual-funds/utils";
import { Link } from "react-router-dom";
import { SplitTransactionSkeleton, TransferDetailsSkeleton } from "./Skeletons";
import useLedgerStore from "@/components/shared/store";

interface TagItem {
  tag_id: string;
  name: string;
}

interface SplitTransaction {
  split_id: string;
  category_name: string;
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

  const hoverBg = useColorModeValue("secondaryBg", "secondaryBg");
  const accountLinkColor = useColorModeValue("brand.500", "brand.300");
  const storeTagBg = useColorModeValue("brand.50", "brand.900");
  const storeTagColor = useColorModeValue("brand.700", "brand.200");
  const storeTagBorderColor = useColorModeValue("brand.200", "brand.700");
  const tagBg = useColorModeValue("tertiaryBg", "tertiaryBg");
  const tagColor = useColorModeValue("primaryTextColor", "primaryTextColor");
  const popoverBg = useColorModeValue("brand.100", "brand.800");
  const popoverArrowBg = useColorModeValue("brand.100", "brand.800");
  const popoverHeaderBg = useColorModeValue(
    "linear(to-r, brand.400, brand.600)",
    "linear(to-r, brand.600, brand.800)"
  );
  const popoverItemBorderColor = useColorModeValue("brand.200", "brand.700");
  const popoverItemHoverBg = useColorModeValue("brand.50", "brand.900");
  const popoverItemColor = useColorModeValue("brand.900", "brand.100");
  const creditColor = useColorModeValue("brand.500", "brand.300");
  const debitColor = useColorModeValue("red.500", "red.300");
  const editIconColor = useColorModeValue("blue.500", "blue.300");
  const editIconHoverColor = useColorModeValue("blue.600", "blue.400");
  const copyIconColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
  const copyIconHoverColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const deleteIconColor = useColorModeValue("red.500", "red.300");
  const deleteIconHoverColor = useColorModeValue("red.600", "red.400");
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");

  return (
    <>
      <Table variant="simple" size="sm" borderColor={useColorModeValue("gray.200", "gray.500")}>
        <Thead>
          <Tr>
            <Th width="8%">Date</Th>
            <Th width="15%">Category</Th>
            {showAccountName && <Th width="12%">Account</Th>}
            <Th>Notes</Th>
            <Th width="3%">Type</Th>
            <Th width="10%" isNumeric>
              Credit
            </Th>
            <Th width="10%" isNumeric>
              Debit
            </Th>
            <Th width="2%">Actions</Th>
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
            .map((transaction) => (
            <Tr
              key={transaction.transaction_id}
              _hover={{ bg: hoverBg }}
              sx={{
                "&:hover .action-icons": {
                  opacity: 1,
                },
              }}
            >
              <Td width="8%"><Text color={tertiaryTextColor}>{formatDate(transaction.date)}</Text></Td>
              <Td width="15%"><Text color={tertiaryTextColor}>{transaction.category_name}</Text></Td>
              {showAccountName && (
                <Td width="12%">
                  {transaction.account_name && transaction.account_id && (
                    <ChakraLink as={Link} to={`/account/${transaction.account_id}`} color={accountLinkColor}>
                      {transaction.account_name}
                    </ChakraLink>
                  )}
                </Td>
              )}
               <Td>
                 <Box>
                   {transaction.notes && <Text mb={((transaction.store || transaction.location) || (transaction.tags && transaction.tags.length > 0)) ? 2 : 0} color={tertiaryTextColor}>{transaction.notes}</Text>}
                   {(transaction.store || transaction.location) && (
                     <Box mb={transaction.tags && transaction.tags.length > 0 ? 2 : 0}>
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
                   {transaction.tags && transaction.tags.length > 0 && (
                     <Wrap spacing={2}>
                       {transaction.tags.map((tag) => (
                         <WrapItem key={tag.tag_id}>
                           <Tag
                             size="sm"
                             borderRadius="md"
                             bg={tagBg}
                             color={tagColor}
                           >
                             <TagLabel>{tag.name}</TagLabel>
                           </Tag>
                         </WrapItem>
                       ))}
                     </Wrap>
                   )}
                 </Box>
               </Td>
               <Td width="3%">
                 <Flex gap={1} flexWrap="wrap">
                   {transaction.is_split && (
                     <Popover
                       onOpen={() =>
                         fetchSplitTransactions(transaction.transaction_id)
                       }
                       strategy="fixed"
                       placement="right"
                       gutter={10}
                     >
                       <PopoverTrigger>
                         <Badge
                           colorScheme="purple"
                           variant="subtle"
                           cursor="pointer"
                           px={1}
                           borderRadius="md"
                           fontSize="0.65em"
                           data-testid="transactiontable-split-indicator"
                         >
                           SPLIT
                         </Badge>
                       </PopoverTrigger>
                    <PopoverContent
                      bg={popoverBg}
                      color="white"
                      minW="400px"
                      maxW="800px"
                      width="auto"
                      overflow="hidden"
                    >
                      <PopoverArrow bg={popoverArrowBg} />
                      <PopoverBody p={0}>
                        {isSplitLoading ? (
                          <Flex justify="center" align="center" minH="100px">
                            <SplitTransactionSkeleton />
                          </Flex>
                        ) : (
                          <Box>
                            <Flex
                              bgGradient={popoverHeaderBg}
                              p={2}
                              fontWeight="bold"
                            >
                              <Box flex="2" color="white">
                                Category
                              </Box>
                              <Box flex="1" textAlign="right" color="white">
                                Amount
                              </Box>
                              <Box flex="3" ml={4} color="white">
                                Notes
                              </Box>
                            </Flex>
                            {splitTransactions.map((split) => (
                              <Flex
                                key={split.split_id}
                                p={3}
                                borderBottomWidth="1px"
                                borderColor={popoverItemBorderColor}
                                _hover={{ bg: popoverItemHoverBg }}
                                align="center"
                              >
                                <Box
                                  flex="2"
                                  color={popoverItemColor}
                                  fontWeight="medium"
                                >
                                  {split.category_name}
                                </Box>
                                 <Box
                                   flex="1"
                                   textAlign="right"
                                   color={popoverItemColor}
                                 >
                                   <HStack spacing={0} align="baseline" justify="flex-end">
                                     <Text fontWeight="semibold">
                                       {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").main}
                                     </Text>
                                     <Text fontSize="xs" opacity={0.7}>
                                       {splitCurrencyForDisplay(split.debit, currencySymbol || "₹").decimals}
                                     </Text>
                                   </HStack>
                                 </Box>
                                <Box flex="3" ml={4} color={popoverItemColor}>
                                  {split.notes || "-"}
                                </Box>
                              </Flex>
                            ))}
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
                        px={1}
                        borderRadius="md"
                        fontSize="0.65em"
                      >
                        ASSET
                      </Badge>
                    )}
                    {transaction.is_mf_transaction && (
                      <Badge
                        colorScheme="green"
                        variant="subtle"
                        px={1}
                        borderRadius="md"
                        fontSize="0.65em"
                      >
                        FUND
                      </Badge>
                    )}
                   {transaction.is_transfer && (
                  <Popover
                    onOpen={() =>
                      fetchTransferDetails(transaction.transfer_id!)
                    }
                  >
                    <PopoverTrigger>
                      <Badge
                        colorScheme="blue"
                        variant="subtle"
                        cursor="pointer"
                        px={1}
                        borderRadius="md"
                        fontSize="0.65em"
                        data-testid="transactiontable-transfer-indicator"
                      >
                        TRANS
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent bg={popoverBg} color="white" maxW="300px">
                      <PopoverArrow bg={popoverArrowBg} />
                      <PopoverHeader
                        bgGradient={popoverHeaderBg}
                        color="white"
                        borderTopRadius="md"
                        py={3}
                        px={4}
                      >
                        <Flex align="center">
                          <Icon as={CreditCard} mr={2} />
                          <Text fontWeight="bold">
                            {transaction.debit > 0
                              ? "Funds transferred to"
                              : "Funds transferred from"}
                          </Text>
                        </Flex>
                      </PopoverHeader>
                      <PopoverBody>
                        {isTransferLoading ? (
                          <Flex justify="center" align="center" minH="100px">
                            <TransferDetailsSkeleton />
                          </Flex>
                        ) : transferDetails ? (
                          <Stack spacing={4} py={2}>
                            <Box
                              p={4}
                              borderWidth="1px"
                              borderRadius="md"
                              bg={popoverItemHoverBg}
                              boxShadow="sm"
                              textAlign="center"
                            >
                              <Text
                                fontSize="lg"
                                fontWeight="bold"
                                color={popoverItemColor}
                                mb={2}
                              >
                                {transaction.debit > 0
                                  ? transferDetails.destination_account_name ||
                                    "N/A"
                                  : transferDetails.source_account_name ||
                                    "N/A"}
                              </Text>
                              <Text fontSize="sm" color={popoverItemColor}>
                                {transaction.debit > 0
                                  ? transferDetails.destination_ledger_name ||
                                    "N/A"
                                  : transferDetails.source_ledger_name || "N/A"}
                              </Text>
                            </Box>
                          </Stack>
                        ) : (
                          <Text color={popoverItemColor}>
                            No transfer details available.
                          </Text>
                        )}
                      </PopoverBody>
                     </PopoverContent>
                     </Popover>
                   )}
                 </Flex>
               </Td>
               <Td width="10%" isNumeric>
                 {transaction.credit !== 0 && (
                   <HStack spacing={0} align="baseline" justify="flex-end">
                     <Text color={creditColor} fontWeight="semibold">
                       {splitCurrencyForDisplay(transaction.credit, currencySymbol || "₹").main}
                     </Text>
                     <Text fontSize="xs" color={creditColor} opacity={0.7}>
                       {splitCurrencyForDisplay(transaction.credit, currencySymbol || "₹").decimals}
                     </Text>
                   </HStack>
                 )}
               </Td>
               <Td width="10%" isNumeric>
                 {transaction.debit !== 0 && (
                   <HStack spacing={0} align="baseline" justify="flex-end">
                     <Text color={debitColor} fontWeight="semibold">
                       {splitCurrencyForDisplay(transaction.debit, currencySymbol || "₹").main}
                     </Text>
                     <Text fontSize="xs" color={debitColor} opacity={0.7}>
                       {splitCurrencyForDisplay(transaction.debit, currencySymbol || "₹").decimals}
                     </Text>
                   </HStack>
                 )}
               </Td>
              <Td width="2%">
                <Flex
                  gap={2}
                  opacity={0}
                  transition="opacity 0.2s"
                  className="action-icons"
                >
                    {!transaction.is_transfer && !transaction.is_asset_transaction && !transaction.is_mf_transaction && (
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
                            transition="opacity 0.2s"
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
                            transition="opacity 0.2s"
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
                          transition="opacity 0.2s"
                          data-testid="transactiontable-trash-icon"
                        />
                      </ChakraLink>
                    )}
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
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
            Are you sure you want to delete this transaction?
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete} leftIcon={<Trash2 size={18} />}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TransactionTable;