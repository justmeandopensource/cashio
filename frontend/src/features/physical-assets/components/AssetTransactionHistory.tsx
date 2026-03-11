import { FC, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  VStack,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Link as ChakraLink,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  useDisclosure,
  useToast,
  useBreakpointValue,
  HStack,
  Tooltip,
  Square,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Card,
} from "@chakra-ui/react";
import { AlertTriangle, Trash2, X, Calendar, Search } from "lucide-react";
import { useAllAssetTransactions, useDeleteAssetTransaction } from "../api";
import { AssetTransactionHistoryProps } from "../types";
import {
  formatCurrencyWithSymbol,
  formatDate,
  getPnLColor,
  formatQuantity,
  splitCurrencyForDisplay,
} from "../utils";
import useLedgerStore from "@/components/shared/store";
import { toastDefaults } from "@/components/shared/utils";
import AssetTransactionNotesPopover from "./AssetTransactionNotesPopover";
import EmptyStateTransactions from "./EmptyStateTransactions";


const AssetTransactionHistory: FC<AssetTransactionHistoryProps> = ({
  assetTypes,
  physicalAssets,
  transactions: propTransactions,
  onDataChange,
  initialAssetFilter,
}) => {
  const { currencySymbol } = useLedgerStore();
  const { ledgerId } = useLedgerStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
   const toast = useToast();
   const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
   const accountLinkColor = useColorModeValue("blue.500", "blue.300");
   const notesColor = useColorModeValue("primaryTextColor", "primaryTextColor");
   const modalDeleteBg = useColorModeValue("secondaryBg", "secondaryBg");
   const mobileCardBg = useColorModeValue("white", "cardDarkBg");
   const hoverBg = useColorModeValue("secondaryBg", "secondaryBg");
   const headerBg = useColorModeValue("primaryBg", "cardDarkBg");
   const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
   const tableBorderColor = useColorModeValue("gray.200", "gray.500");
   const tableRowHoverBg = useColorModeValue("secondaryBg", "secondaryBg");

   // Responsive breakpoint
   const isMobile = useBreakpointValue({ base: true, md: false });

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [assetFilter, setAssetFilter] = useState<string>(initialAssetFilter || "all");

  // Use prop transactions if provided, otherwise fetch all
  const {
    data: fetchedTransactions = [],
    isLoading,
    error,
  } = useAllAssetTransactions(Number(ledgerId) || 0);

  const transactions = propTransactions || fetchedTransactions;

  const deleteAssetTransactionMutation = useDeleteAssetTransaction();

  // Filter transactions (sorted by date descending by default)
  const allFilteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = searchTerm === "" ||
        transaction.physical_asset?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.physical_asset?.asset_type?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || transaction.transaction_type === typeFilter;
      const matchesAsset = assetFilter === "all" || transaction.physical_asset_id.toString() === assetFilter;
      const matchesAssetType = assetTypeFilter === "all" || transaction.physical_asset?.asset_type_id.toString() === assetTypeFilter;

      return matchesSearch && matchesType && matchesAsset && matchesAssetType;
    })
    .sort((a, b) => {
      const dateComparison = new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      if (dateComparison === 0) {
        return b.asset_transaction_id - a.asset_transaction_id;
      }
      return dateComparison;
    });

  const filteredTransactions = assetFilter === "all" && allFilteredTransactions.length > 10
    ? allFilteredTransactions.slice(0, 10)
    : allFilteredTransactions;

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!selectedTransactionId || !ledgerId) return;
    try {
      await deleteAssetTransactionMutation.mutateAsync({
        ledgerId: Number(ledgerId),
        assetTransactionId: selectedTransactionId,
      });
      setSelectedTransactionId(null); // Clear selected transaction ID
      onClose();
      onDataChange(); // Call the onDataChange callback
      toast({
        ...toastDefaults,
        title: "Transaction Deleted",
        description: "The asset transaction has been successfully deleted.",
        status: "success",
      });
    } catch (error) {
      console.error("Error deleting asset transaction:", error);
      toast({
        ...toastDefaults,
        title: "Error",
        description: "Failed to delete the asset transaction.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };



  // Handle card expansion
  const handleCardToggle = (transactionId: number) => {
    setExpandedCardId(expandedCardId === transactionId ? null : transactionId);
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

  // Render mobile card view
  const renderMobileCards = () => (
    <VStack spacing={3} align="stretch">
      {filteredTransactions.map((transaction) => {
        const isExpanded = expandedCardId === transaction.asset_transaction_id;
        const isBuy = transaction.transaction_type === "buy";

        return (
           <Box
             key={transaction.asset_transaction_id}
             p={4}
             borderWidth="1px"
             borderRadius="lg"
             bg={mobileCardBg}
             boxShadow="sm"
             onClick={() => handleCardToggle(transaction.asset_transaction_id)}
             cursor="pointer"
             transition="all 0.2s"
             _hover={{ bg: hoverBg }}
          >
            {/* Main row with essential info */}
            <Flex justify="space-between" align="flex-start">
              {/* Left side with date and asset */}
              <VStack align="flex-start" spacing={1} maxW="70%">
                <HStack spacing={2}>
                  <Icon as={Calendar} color={tertiaryTextColor} />
                  <Text fontSize="sm" color={tertiaryTextColor}>
                    {formatDate(transaction.transaction_date)}
                  </Text>
                  <Tooltip label={isBuy ? "Buy Transaction" : "Sell Transaction"}>
                    <Square
                      size="6px"
                      bg={isBuy ? "green.400" : "red.400"}
                      borderRadius="md"
                    />
                  </Tooltip>
                </HStack>

                <Text fontWeight="medium" color={tertiaryTextColor}>
                  {transaction.physical_asset?.name || "N/A"}
                </Text>

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
              </VStack>

              {/* Right side with amount and quantity */}
              <VStack align="flex-end" spacing={1}>
                 <HStack spacing={0} align="baseline" justify="flex-end">
                   <Text
                     fontSize="sm"
                     fontWeight="semibold"
                     color={getPnLColor(
                       isBuy ? -transaction.total_amount : transaction.total_amount
                     )}
                   >
                     {splitCurrencyForDisplay(transaction.total_amount, currencySymbol || "$").main}
                   </Text>
                   <Text
                     fontSize="xs"
                     fontWeight="semibold"
                     opacity={0.7}
                     color={getPnLColor(
                       isBuy ? -transaction.total_amount : transaction.total_amount
                     )}
                   >
                     {splitCurrencyForDisplay(transaction.total_amount, currencySymbol || "$").decimals}
                   </Text>
                 </HStack>
                <Text fontSize="sm" color={tertiaryTextColor} fontWeight="medium">
                  {formatQuantity(transaction.quantity)}{" "}
                  {transaction.physical_asset?.asset_type?.unit_symbol || ""}
                </Text>
                <Box
                  bg="gray.100"
                  color={tertiaryTextColor}
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="medium"
                  display="inline-block"
                  _dark={{
                    bg: "gray.700",
                    color: "gray.300"
                  }}
                >
                  {formatCurrencyWithSymbol(
                    transaction.price_per_unit,
                    currencySymbol || "$"
                  )}/{transaction.physical_asset?.asset_type?.unit_symbol || ""}
                </Box>
              </VStack>
            </Flex>

            {/* Expandable section */}
            {isExpanded && (
              <Box
                mt={transaction.notes ? 4 : 2}
                pt={transaction.notes ? 3 : 1}
                pb={transaction.notes ? 2 : -1}
                borderTopWidth="1px"
              >
                {/* Notes section - only show if notes exist */}
                {transaction.notes && (
                  <Box mb={2}>
                    <Text
                      fontSize="sm"
                      color={notesColor}
                      bg="gray.50"
                      p={2}
                      borderRadius="md"
                      whiteSpace="pre-wrap"
                    >
                      {transaction.notes}
                    </Text>
                  </Box>
                )}

                {/* Action buttons - compact spacing */}
                <Flex justify="flex-end" mt={transaction.notes ? 1 : 0} gap={2} mb={-1}>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    leftIcon={<Trash2 size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTransactionId(transaction.asset_transaction_id);
                      onOpen();
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

  if (isLoading) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Spinner size="lg" color="teal.500" />
          <Text color={tertiaryTextColor}>Loading transaction history...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="md">
          <AlertIcon as={AlertTriangle} />
          <AlertTitle>Failed to Load Transactions!</AlertTitle>
          <AlertDescription>
            Unable to load transaction history for this asset. Please try
            refreshing the page or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  if (filteredTransactions.length === 0) {
    return <EmptyStateTransactions />;
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
                 </Select>

                 <Select
                   size="sm"
                   maxW={{ base: "full", md: "200px" }}
                   value={assetTypeFilter}
                   onChange={(e) => setAssetTypeFilter(e.target.value)}
                 >
                   <option value="all">All Asset Types</option>
                   {assetTypes.map(assetType => (
                     <option key={assetType.asset_type_id} value={assetType.asset_type_id.toString()}>
                       {assetType.name}
                     </option>
                   ))}
                 </Select>

                 <Select
                   size="sm"
                   maxW={{ base: "full", md: "200px" }}
                   value={assetFilter}
                   onChange={(e) => setAssetFilter(e.target.value)}
                 >
                   <option value="all">All Assets</option>
                   {physicalAssets.map(asset => (
                     <option key={asset.physical_asset_id} value={asset.physical_asset_id.toString()}>
                       {asset.name}
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

        {/* Transactions Table/Cards */}
         <Card bg={cardBg} p={{ base: 3, md: 4, lg: 6 }} borderRadius="lg">
          {isMobile ? (
        renderMobileCards()
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm" borderColor={tableBorderColor}>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Asset</Th>
                <Th>Type</Th>
                <Th isNumeric>Quantity</Th>
                <Th isNumeric>Price/Unit</Th>
                <Th isNumeric>Total Amount</Th>
                <Th>Account</Th>
                <Th width="2%">Actions</Th>
              </Tr>
            </Thead>
             <Tbody>
               {filteredTransactions.map((transaction) => (
                 <Tr
                   key={transaction.asset_transaction_id}
                   _hover={{ bg: tableRowHoverBg }}
                   onMouseLeave={handleRowMouseLeave}
                  sx={{
                    "&:hover .action-icons": {
                      opacity: 1,
                    },
                  }}
                >
                  <Td>
                    <Text fontWeight="medium" color={tertiaryTextColor}>
                      {formatDate(transaction.transaction_date)}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontWeight="medium" color={tertiaryTextColor}>
                      {transaction.physical_asset?.name || "N/A"}
                    </Text>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        transaction.transaction_type === "buy" ? "green" : "red"
                      }
                      variant="subtle"
                    >
                      {transaction.transaction_type.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="medium" color={tertiaryTextColor}>
                      {formatQuantity(transaction.quantity)}{" "}
                      {transaction.physical_asset?.asset_type?.unit_symbol || ""}
                    </Text>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="medium" color={tertiaryTextColor}>
                      {formatCurrencyWithSymbol(
                        transaction.price_per_unit,
                        currencySymbol || "$",
                      )}
                    </Text>
                  </Td>
                   <Td isNumeric>
                     <HStack spacing={0} align="baseline" justify="flex-end">
                       <Text
                         fontSize="sm"
                         fontWeight="semibold"
                         color={getPnLColor(
                           transaction.transaction_type === "buy"
                             ? -transaction.total_amount
                             : transaction.total_amount,
                         )}
                       >
                         {splitCurrencyForDisplay(transaction.total_amount, currencySymbol || "$").main}
                       </Text>
                       <Text
                         fontSize="xs"
                         fontWeight="semibold"
                         opacity={0.7}
                         color={getPnLColor(
                           transaction.transaction_type === "buy"
                             ? -transaction.total_amount
                             : transaction.total_amount,
                         )}
                       >
                         {splitCurrencyForDisplay(transaction.total_amount, currencySymbol || "$").decimals}
                       </Text>
                     </HStack>
                   </Td>
                  <Td>
                     <ChakraLink
                       as={Link}
                       to={`/account/${transaction.account_id}`}
                       color={accountLinkColor}
                       fontSize="sm"
                     >
                      {transaction.account_name ||
                        `Account ${transaction.account_id}`}
                    </ChakraLink>
                  </Td>
                  <Td width="2%">
                    <Flex
                      gap={2}
                      opacity={0}
                      transition="opacity 0.2s"
                      className="action-icons"
                    >
                      <AssetTransactionNotesPopover
                        transaction={transaction}
                        isOpen={openPopoverId === transaction.asset_transaction_id}
                        onOpen={() =>
                          handlePopoverOpen(transaction.asset_transaction_id)
                        }
                        onClose={handlePopoverClose}
                      />
                      <ChakraLink
                        onClick={() => {
                          setSelectedTransactionId(
                            transaction.asset_transaction_id,
                          );
                          onOpen();
                        }}
                        _hover={{ textDecoration: "none" }}
                      >
                        <Icon
                          as={Trash2}
                          boxSize={4}
                          color="red.500"
                          _hover={{ color: "red.600" }}
                          transition="opacity 0.2s"
                          data-testid="asset-transaction-delete-icon"
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
        </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={isMobile ? "full" : "md"}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent
          margin={isMobile ? 0 : "auto"}
          borderRadius={isMobile ? 0 : "md"}
        >
          <ModalHeader>Delete Asset Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Are you sure you want to delete this asset transaction? This will
              also delete the associated financial transaction and cannot be
              undone.
            </Text>
            {selectedTransactionId && (
              <Box p={3} bg={modalDeleteBg} borderRadius="md">
                <Text fontWeight="bold">
                  {filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.physical_asset?.name || "Asset"}
                </Text>
                <Text fontSize="sm" color={tertiaryTextColor}>
                  {selectedTransactionId && formatDate(
                    filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.transaction_date || ""
                  )}
                </Text>
                 <HStack spacing={0} align="baseline">
                   <Text fontSize="sm" fontWeight="semibold" color={
                     filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.transaction_type === "buy"
                       ? "red.500"
                       : "green.500"
                   }>
                     {selectedTransactionId && splitCurrencyForDisplay(
                       filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.total_amount || 0,
                       currencySymbol || "$"
                     ).main}
                   </Text>
                   <Text fontSize="xs" fontWeight="semibold" opacity={0.7} color={
                     filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.transaction_type === "buy"
                       ? "red.500"
                       : "green.500"
                   }>
                     {selectedTransactionId && splitCurrencyForDisplay(
                       filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.total_amount || 0,
                       currencySymbol || "$"
                     ).decimals}
                   </Text>
                 </HStack>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              mr={3}
              onClick={onClose}
              leftIcon={<X size={18} />}
              isDisabled={deleteAssetTransactionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={deleteAssetTransactionMutation.isPending}
              loadingText="Deleting..."
              leftIcon={<Trash2 size={18} />}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </VStack>
    </Box>
  );
};

export default AssetTransactionHistory;

