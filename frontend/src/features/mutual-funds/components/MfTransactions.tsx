import { FC, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Text,
  Button,
  VStack,
  Card,
  CardBody,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Flex,
  Link as ChakraLink,
  Icon,
  useBreakpointValue,
  Tooltip,
  Square,
  useColorModeValue,
} from "@chakra-ui/react";
import { Search, Trash2, Calendar } from "lucide-react";

import { Amc, MutualFund, MfTransaction } from "../types";
import { formatUnits, formatNav, getTransactionTypeText, splitCurrencyForDisplay } from "../utils";
import { formatDate } from "../../physical-assets/utils";
import { deleteMfTransaction } from "../api";

import useLedgerStore from "@/components/shared/store";
import MfTransactionNotesPopover from "./MfTransactionNotesPopover";


interface MfTransactionsProps {
  amcs: Amc[];
  mutualFunds: MutualFund[];
  transactions?: MfTransaction[];
  onDataChange: () => void;
  onAccountDataChange?: () => void;
  initialFundFilter?: string;
}

const MfTransactions: FC<MfTransactionsProps> = ({
  amcs,
  mutualFunds,
  transactions = [],
  onDataChange,
  onAccountDataChange,
  initialFundFilter,
}) => {
  const { ledgerId, currencySymbol } = useLedgerStore();
   const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
   const mutedColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
  const emptyStateBg = useColorModeValue("secondaryBg", "secondaryBg");
   const emptyStateTextColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
   const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
   const positiveColor = useColorModeValue("green.500", "green.300");
   const negativeColor = useColorModeValue("red.500", "red.300");

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [fundFilter, setFundFilter] = useState<string>(initialFundFilter || "all");
  const [amcFilter, setAmcFilter] = useState<string>("all");

  // Delete transaction state
  const [transactionToDelete, setTransactionToDelete] = useState<MfTransaction | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Responsive breakpoint
  const [hasResolvedBreakpoint, setHasResolvedBreakpoint] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

  useEffect(() => {
    setHasResolvedBreakpoint(true);
  }, []);

  // Filter transactions (sorted by date descending by default)
  const allFilteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = searchTerm === "" ||
        transaction.mutual_fund?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.target_fund_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || transaction.transaction_type === typeFilter;
      const matchesFund = fundFilter === "all" || transaction.mutual_fund_id.toString() === fundFilter;
      const matchesAmc = amcFilter === "all" || transaction.mutual_fund?.amc_id.toString() === amcFilter;

      return matchesSearch && matchesType && matchesFund && matchesAmc;
    })
    .sort((a, b) => {
      const dateComparison = new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      if (dateComparison === 0) {
        return b.mf_transaction_id - a.mf_transaction_id;
      }
      return dateComparison;
    });

  const filteredTransactions = fundFilter === "all" && allFilteredTransactions.length > 10
    ? allFilteredTransactions.slice(0, 10)
    : allFilteredTransactions;

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete || !ledgerId) return;

    try {
      await deleteMfTransaction(Number(ledgerId), transactionToDelete.mf_transaction_id);
      onDataChange();
      // Also refresh account data if callback is provided
      if (onAccountDataChange) {
        onAccountDataChange();
      }
      onDeleteClose();
      setTransactionToDelete(null);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  // Handle card expansion
  const handleCardToggle = (transactionId: number) => {
    setExpandedCardId(expandedCardId === transactionId ? null : transactionId);
  };

  const getTransactionTypeColor = (type: MfTransaction['transaction_type']) => {
    switch (type) {
      case 'buy': return 'green';
      case 'sell': return 'red';
      case 'switch_out': return 'purple';
      case 'switch_in': return 'orange';
      default: return 'gray';
    }
  };

  // Handle popover functions (for desktop table)
  const handlePopoverOpen = (transactionId: number) => {
    setOpenPopoverId(transactionId);
  };

  const handlePopoverClose = () => {
    setOpenPopoverId(null);
  };

  const handleRowMouseLeave = () => {
    setOpenPopoverId(null);
  };

  const hoverBg = useColorModeValue("secondaryBg", "secondaryBg");
  const iconColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
   const transactionTypeIndicatorColor = (type: MfTransaction['transaction_type']) => {
     switch (type) {
       case 'buy': return buyIndicatorColor;
       case 'sell': return sellIndicatorColor;
       case 'switch_out': return switchOutIndicatorColor;
       case 'switch_in': return switchInIndicatorColor;
       default: return defaultIndicatorColor;
     }
   };
  const accountLinkColor = useColorModeValue("brand.500", "brand.300");
   const navBg = useColorModeValue("secondaryBg", "secondaryBg");
   const notesBg = useColorModeValue("secondaryBg", "secondaryBg");
  const notesColor = useColorModeValue("primaryTextColor", "primaryTextColor");
   const headerBg = useColorModeValue("primaryBg", "cardDarkBg");
  const headerColor = useColorModeValue("primaryTextColor", "primaryTextColor");
  const emptyStateBorderColor = useColorModeValue("tertiaryBg", "tertiaryBg");
  const tableHoverBg = useColorModeValue("secondaryBg", "secondaryBg");
  const deleteIconColor = useColorModeValue("red.500", "red.300");
   const deleteIconHoverColor = useColorModeValue("red.600", "red.400");
   const modalDeleteBg = useColorModeValue("secondaryBg", "secondaryBg");
   const buyIndicatorColor = useColorModeValue("green.400", "green.300");
   const sellIndicatorColor = useColorModeValue("red.400", "red.300");
   const switchOutIndicatorColor = useColorModeValue("purple.400", "purple.300");
   const switchInIndicatorColor = useColorModeValue("orange.400", "orange.300");
   const defaultIndicatorColor = useColorModeValue("gray.400", "gray.300");
   const tableBorderColor = useColorModeValue("gray.200", "gray.500");

  // Render mobile card view
  const renderMobileCards = () => (
    <VStack spacing={3} align="stretch">
      {filteredTransactions.map((transaction) => {
        const isExpanded = expandedCardId === transaction.mf_transaction_id;

        return (
          <Box
            key={transaction.mf_transaction_id}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg={cardBg}
            boxShadow="sm"
            onClick={() => handleCardToggle(transaction.mf_transaction_id)}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: hoverBg }}
          >
             {/* Main row with essential info */}
             <VStack spacing={3} align="stretch">
               {/* Top section with date and type */}
               <HStack spacing={2}>
                 <Icon as={Calendar} color={iconColor} />
                 <Text fontSize="sm" color={tertiaryTextColor}>
                   {formatDate(transaction.transaction_date)}
                 </Text>
                 <Tooltip label={getTransactionTypeText(transaction.transaction_type)}>
                   <Square
                     size="6px"
                     bg={transactionTypeIndicatorColor(transaction.transaction_type)}
                     borderRadius="md"
                   />
                 </Tooltip>
               </HStack>

               {/* Fund name */}
               <Text fontWeight="medium" color={tertiaryTextColor}>
                 {transaction.mutual_fund?.name}
               </Text>

               {/* Account or target fund */}
               {transaction.transaction_type === 'switch_out' || transaction.transaction_type === 'switch_in' ? (
                 <Text fontSize="sm" color={accountLinkColor} fontWeight="medium">
                   {transaction.target_fund_name}
                 </Text>
               ) : (
                 <ChakraLink
                   as={Link}
                   to={`/account/${transaction.account_id}`}
                   color={accountLinkColor}
                   fontSize="sm"
                   fontWeight="medium"
                   _hover={{ textDecoration: "underline" }}
                 >
                   {transaction.account_name || `Account ${transaction.account_id}`}
                 </ChakraLink>
               )}

               {/* Financial details */}
               <Flex justify="space-between" align="baseline">
                 <VStack align="start" spacing={0.5}>
                   <HStack spacing={0} align="baseline">
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color={
                          transaction.transaction_type === 'buy'
                            ? positiveColor
                            : transaction.transaction_type === 'sell'
                            ? negativeColor
                            : transaction.transaction_type === 'switch_out'
                            ? negativeColor
                            : positiveColor // switch_in = neutral, default to positive
                        }
                      >
                       {splitCurrencyForDisplay(Number(transaction.amount_excluding_charges), currencySymbol || "₹").main}
                     </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        opacity={0.7}
                        color={
                          transaction.transaction_type === 'buy'
                            ? positiveColor
                            : transaction.transaction_type === 'sell'
                            ? negativeColor
                            : transaction.transaction_type === 'switch_out'
                            ? negativeColor
                            : positiveColor // switch_in = neutral, default to positive
                        }
                      >
                       {splitCurrencyForDisplay(Number(transaction.amount_excluding_charges), currencySymbol || "₹").decimals}
                     </Text>
                   </HStack>
                   {Number(transaction.other_charges) > 0 && (
                     <HStack spacing={0} align="baseline">
                       <Text fontSize="xs" color={deleteIconColor} fontWeight="medium">
                         {splitCurrencyForDisplay(Number(transaction.other_charges), currencySymbol || "₹").main}{splitCurrencyForDisplay(Number(transaction.other_charges), currencySymbol || "₹").decimals}
                       </Text>
                     </HStack>
                   )}
                 </VStack>
                 <VStack align="end" spacing={0.5}>
                   <Text fontSize="sm" color={tertiaryTextColor} fontWeight="medium">
                     {formatUnits(transaction.units)} units
                   </Text>
                   <Box
                     bg={navBg}
                     color={tertiaryTextColor}
                     px={2}
                     py={0.5}
                     borderRadius="full"
                     fontSize="xs"
                     fontWeight="medium"
                   >
                     {currencySymbol || "₹"}{formatNav(Number(transaction.nav_per_unit))}/unit
                   </Box>
                 </VStack>
               </Flex>
             </VStack>

            {/* Expandable section */}
            {isExpanded && (
              <Box
                mt={4}
                pt={3}
                pb={2}
                borderTopWidth="1px"
              >
                {/* Notes section */}
                <Box mb={2}>
                  <Text
                    fontSize="sm"
                    color={notesColor}
                    bg={notesBg}
                    p={2}
                    borderRadius="md"
                    whiteSpace="pre-wrap"
                  >
                    {transaction.notes || "No notes for this transaction."}
                  </Text>
                </Box>

                {/* Action buttons */}
                <Flex justify="flex-end" mt={1} gap={2} mb={-1}>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    leftIcon={<Trash2 size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTransactionToDelete(transaction);
                      onDeleteOpen();
                    }}
                    aria-label="Delete transaction"
                  />
                </Flex>
              </Box>
            )}
          </Box>
        );
      })}
    </VStack>
  );



  if (!hasResolvedBreakpoint) {
    return null; // Or a loading spinner if preferred
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
         {/* Header */}
         <Box mb={6} p={{ base: 4, md: 6 }} bg={headerBg} borderRadius="lg" boxShadow="sm">
           <Flex
             direction={{ base: "column", md: "row" }}
             justify="space-between"
             align={{ base: "start", md: "center" }}
              gap={{ base: 4, md: 0 }}
              mb={4}
           >
             <Flex align="center" mb={{ base: 2, md: 0 }}>
                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold" color={tertiaryTextColor}>
                  Transactions
                </Text>
             </Flex>
           </Flex>

            {/* Search and Filters */}
            <Box>
               <Flex
                 direction={{ base: "column", md: "row" }}
                 gap={{ base: 3, md: 4 }}
                 align={{ base: "stretch", md: "center" }}
                 wrap="wrap"
                 mb={4}
               >
                  <Select
                    size="sm"
                    maxW={{ base: "full", md: "150px" }}
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                    <option value="switch_out">Switch Out</option>
                    <option value="switch_in">Switch In</option>
                  </Select>

                  <Select
                    size="sm"
                    maxW={{ base: "full", md: "200px" }}
                    value={amcFilter}
                    onChange={(e) => setAmcFilter(e.target.value)}
                  >
                    <option value="all">All AMCs</option>
                    {amcs.map(amc => (
                      <option key={amc.amc_id} value={amc.amc_id.toString()}>
                        {amc.name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    size="sm"
                    maxW={{ base: "full", md: "200px" }}
                    value={fundFilter}
                    onChange={(e) => setFundFilter(e.target.value)}
                  >
                    <option value="all">All Funds</option>
                    {mutualFunds.map(fund => (
                      <option key={fund.mutual_fund_id} value={fund.mutual_fund_id.toString()}>
                        {fund.name}
                      </option>
                    ))}
                  </Select>

                 <InputGroup size="sm" maxW={{ base: "full", md: "300px" }}>
                   <InputLeftElement>
                     <Search size={16} />
                   </InputLeftElement>
                   <Input
                     placeholder="Search transactions..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                 </InputGroup>

               </Flex>


            </Box>
         </Box>



        {/* Empty State */}
        {amcs.length === 0 ? (
          <Box
            p={8}
            textAlign="center"
            bg={emptyStateBg}
            borderRadius="lg"
            border="2px dashed"
            borderColor={emptyStateBorderColor}
          >
            <VStack spacing={4}>
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold" color={headerColor}>
                  No Transactions Yet
                </Text>
                <Text fontSize="sm" color={emptyStateTextColor} maxW="300px">
                  Create your first Asset Management Company to start recording transactions
                </Text>
              </VStack>
            </VStack>
          </Box>
        ) : mutualFunds.length === 0 ? (
          <Box
            p={8}
            textAlign="center"
            bg={emptyStateBg}
            borderRadius="lg"
            border="2px dashed"
            borderColor={emptyStateBorderColor}
          >
            <VStack spacing={4}>
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold" color={headerColor}>
                  No Transactions Yet
                </Text>
                <Text fontSize="sm" color={emptyStateTextColor} maxW="300px">
                  Create your first mutual fund to start recording transactions
                </Text>
              </VStack>
            </VStack>
          </Box>
        ) : transactions.length === 0 ? (
          <Box
            p={8}
            textAlign="center"
            bg={emptyStateBg}
            borderRadius="lg"
            border="2px dashed"
            borderColor={emptyStateBorderColor}
          >
            <VStack spacing={4}>
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold" color={headerColor}>
                  No Transactions Recorded Yet
                </Text>
                <Text fontSize="sm" color={emptyStateTextColor} maxW="300px">
                  Start by buying units in one of your mutual funds
                </Text>
              </VStack>
            </VStack>
          </Box>
         ) : (
           /* Transactions Table/Cards */
           <Card bg={cardBg}>
             <CardBody>
               {isMobile ? (
                 renderMobileCards()
               ) : (
                 <Box overflowX="auto">
                    <Table variant="simple" size="sm" borderColor={tableBorderColor}>
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Fund</Th>
                          <Th>AMC</Th>
                          <Th>Type</Th>
                          <Th isNumeric>Units</Th>
                          <Th isNumeric>NAV</Th>
                           <Th isNumeric>Amount</Th>
                          <Th isNumeric>Charges</Th>
                           <Th>Account</Th>
                          <Th width="2%">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredTransactions.map(transaction => (
                          <Tr
                            key={transaction.mf_transaction_id}
                            _hover={{ bg: tableHoverBg }}
                            onMouseLeave={handleRowMouseLeave}
                            sx={{
                              "&:hover .action-icons": {
                                opacity: 1,
                              },
                            }}
                          >
                            <Td>
                              <Text fontSize="sm" color={tertiaryTextColor}>
                                {formatDate(transaction.transaction_date)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontWeight="medium" color={tertiaryTextColor}>
                                {transaction.mutual_fund?.name}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontWeight="medium" color={tertiaryTextColor}>
                                {transaction.mutual_fund?.amc?.name}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getTransactionTypeColor(transaction.transaction_type)} size="sm">
                                {getTransactionTypeText(transaction.transaction_type)}
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              <Text fontSize="sm" color={tertiaryTextColor}>{formatUnits(transaction.units)}</Text>
                            </Td>
                              <Td isNumeric>
                                <Text fontSize="sm" color={tertiaryTextColor}>{currencySymbol || "₹"}{formatNav(Number(transaction.nav_per_unit))}</Text>
                              </Td>
                              <Td isNumeric>
                                 <HStack spacing={0} align="baseline" justify="flex-end">
                                    <Text
                                      fontSize="sm"
                                      fontWeight="semibold"
                                      color={
                                        transaction.transaction_type === 'buy'
                                          ? positiveColor
                                          : transaction.transaction_type === 'sell'
                                          ? negativeColor
                                          : transaction.transaction_type === 'switch_out'
                                          ? negativeColor
                                          : positiveColor // switch_in = neutral, default to positive
                                      }
                                    >
                                     {splitCurrencyForDisplay(
                                       transaction.transaction_type === 'sell' || transaction.transaction_type === 'switch_out'
                                         ? Number(transaction.amount_excluding_charges)
                                         : Number(transaction.amount_excluding_charges),
                                       currencySymbol || "₹"
                                     ).main}
                                   </Text>
                                    <Text
                                      fontSize="xs"
                                      fontWeight="semibold"
                                      opacity={0.7}
                                      color={
                                        transaction.transaction_type === 'buy'
                                          ? positiveColor
                                          : transaction.transaction_type === 'sell'
                                          ? negativeColor
                                          : transaction.transaction_type === 'switch_out'
                                          ? negativeColor
                                          : positiveColor // switch_in = neutral, default to positive
                                      }
                                    >
                                     {splitCurrencyForDisplay(
                                       transaction.transaction_type === 'sell' || transaction.transaction_type === 'switch_out'
                                         ? Number(transaction.amount_excluding_charges)
                                         : Number(transaction.amount_excluding_charges),
                                       currencySymbol || "₹"
                                     ).decimals}
                                   </Text>
                                 </HStack>
                              </Td>
                               <Td isNumeric>
                                 {Number(transaction.other_charges) > 0 && (
                                   <HStack spacing={0} align="baseline" justify="flex-end">
                                     <Text
                                       fontSize="sm"
                                       fontWeight="semibold"
                                       color={deleteIconColor}
                                     >
                                       {splitCurrencyForDisplay(
                                         Number(transaction.other_charges),
                                         currencySymbol || "₹"
                                       ).main}
                                     </Text>
                                     <Text
                                       fontSize="xs"
                                       fontWeight="semibold"
                                       opacity={0.7}
                                       color={deleteIconColor}
                                     >
                                       {splitCurrencyForDisplay(
                                         Number(transaction.other_charges),
                                         currencySymbol || "₹"
                                       ).decimals}
                                     </Text>
                                   </HStack>
                                 )}
                               </Td>
                              <Td>
                                {transaction.transaction_type === 'switch_out' || transaction.transaction_type === 'switch_in' ? (
                                  <Text fontSize="sm" color={mutedColor}>
                                    {transaction.target_fund_name}
                                  </Text>
                                ) : (
                                  <ChakraLink
                                    as={Link}
                                    to={`/account/${transaction.account_id}`}
                                    color={accountLinkColor}
                                    fontSize="sm"
                                    fontWeight="medium"
                                    _hover={{ textDecoration: "underline" }}
                                  >
                                    {transaction.account_name || `Account ${transaction.account_id}`}
                                  </ChakraLink>
                                )}
                              </Td>
                              <Td width="2%">
                                <Flex
                                  gap={2}
                                  opacity={0}
                                  transition="opacity 0.2s"
                                  className="action-icons"
                                >
                                  <MfTransactionNotesPopover
                                    transaction={transaction}
                                    isOpen={openPopoverId === transaction.mf_transaction_id}
                                    onOpen={() => handlePopoverOpen(transaction.mf_transaction_id)}
                                    onClose={handlePopoverClose}
                                  />
                                  <ChakraLink
                                    onClick={() => {
                                      setTransactionToDelete(transaction);
                                      onDeleteOpen();
                                    }}
                                    _hover={{ textDecoration: "none" }}
                                  >
                                    <Icon
                                      as={Trash2}
                                      boxSize={4}
                                      color={deleteIconColor}
                                      _hover={{ color: deleteIconHoverColor }}
                                      transition="opacity 0.2s"
                                    />
                                  </ChakraLink>
                                </Flex>
                              </Td>
                          </Tr>
                        ))}
                      </Tbody>
                   </Table>
                 </Box>
               )}
             </CardBody>
           </Card>
         )}
      </VStack>

       {/* Delete Confirmation Modal */}
       <Modal
         isOpen={isDeleteOpen}
         onClose={onDeleteClose}
         size={isMobile ? "full" : "md"}
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
              <Text mb={4}>
                Are you sure you want to delete this transaction? This action cannot be undone and will reverse all associated financial transactions.
              </Text>
             {transactionToDelete && (
               <Box p={3} bg={modalDeleteBg} borderRadius="md">
                 <Text fontWeight="bold">
                   {transactionToDelete.mutual_fund?.name}
                 </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    {formatDate(transactionToDelete.transaction_date)}
                  </Text>
                  <VStack align="start" spacing={1}>
                     <HStack spacing={0} align="baseline">
                         <Text
                           fontSize="sm"
                           fontWeight="semibold"
                           color={
                             transactionToDelete.transaction_type === 'buy'
                               ? positiveColor
                               : transactionToDelete.transaction_type === 'sell'
                               ? negativeColor
                               : transactionToDelete.transaction_type === 'switch_out'
                               ? negativeColor
                               : positiveColor // switch_in = neutral, default to positive
                           }
                         >
                           {splitCurrencyForDisplay(Number(transactionToDelete.amount_excluding_charges), currencySymbol || "₹").main}
                        </Text>
                         <Text
                           fontSize="xs"
                           fontWeight="semibold"
                           opacity={0.7}
                           color={
                             transactionToDelete.transaction_type === 'buy'
                               ? positiveColor
                               : transactionToDelete.transaction_type === 'sell'
                               ? negativeColor
                               : transactionToDelete.transaction_type === 'switch_out'
                               ? negativeColor
                               : positiveColor // switch_in = neutral, default to positive
                           }
                         >
                           {splitCurrencyForDisplay(Number(transactionToDelete.amount_excluding_charges), currencySymbol || "₹").decimals}
                        </Text>
                      <Text fontSize="xs" color={mutedColor} ml={1}>
                        (excl. charges)
                      </Text>
                    </HStack>
                     {Number(transactionToDelete.other_charges) > 0 && (
                       <HStack spacing={0} align="baseline">
                         <Text fontSize="xs" color={deleteIconColor} fontWeight="medium">
                           +{currencySymbol || "₹"}{splitCurrencyForDisplay(Number(transactionToDelete.other_charges), currencySymbol || "₹").main}{splitCurrencyForDisplay(Number(transactionToDelete.other_charges), currencySymbol || "₹").decimals} charges
                         </Text>
                       </HStack>
                     )}
                  </VStack>
               </Box>
             )}
           </ModalBody>
           <ModalFooter>
             <Button
               variant="outline"
               mr={3}
               onClick={onDeleteClose}
               leftIcon={<Icon as={Trash2} size={16} />}
             >
               Cancel
             </Button>
             <Button
               colorScheme="red"
               onClick={handleDeleteTransaction}
               leftIcon={<Trash2 size={16} />}
             >
               Delete
             </Button>
           </ModalFooter>
         </ModalContent>
       </Modal>
    </Box>
    );
  };
export default MfTransactions;