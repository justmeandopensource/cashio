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
  useBreakpointValue,
  HStack,
  Tooltip,
  Square,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, Calendar, Search } from "lucide-react";
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
import { notify } from "@/components/shared/notify";
import AssetTransactionNotesPopover from "./AssetTransactionNotesPopover";
import EmptyStateTransactions from "./EmptyStateTransactions";

const MotionBox = motion(Box);

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
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const accountLinkColor = useColorModeValue("brand.500", "brand.300");
  const notesColor = useColorModeValue("primaryTextColor", "primaryTextColor");
  const notesBg = useColorModeValue("gray.50", "gray.700");
  const mobileCardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const headerBg = useColorModeValue("primaryBg", "cardDarkBg");
  const tableBorderColor = useColorModeValue("gray.100", "gray.600");
  const headerColor = useColorModeValue("gray.400", "gray.500");
  const tableRowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const cardBorder = useColorModeValue("gray.100", "gray.600");
  const cardHoverBorder = useColorModeValue("gray.200", "gray.500");
  const expandedBorder = useColorModeValue("brand.200", "brand.600");
  const expandedSectionBorder = useColorModeValue("gray.100", "gray.600");
  const deleteIconColor = useColorModeValue("red.500", "red.300");
  const deleteIconHoverColor = useColorModeValue("red.600", "red.400");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorderColor = useColorModeValue("gray.100", "gray.700");
  const modalDetailBg = useColorModeValue("gray.50", "gray.700");
  const navPillBg = useColorModeValue("gray.100", "gray.700");

  const isMobile = useBreakpointValue({ base: true, md: false });

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [assetFilter, setAssetFilter] = useState<string>(initialAssetFilter || "all");

  const {
    data: fetchedTransactions = [],
    isLoading,
    error,
  } = useAllAssetTransactions(Number(ledgerId) || 0);

  const transactions = propTransactions || fetchedTransactions;

  const deleteAssetTransactionMutation = useDeleteAssetTransaction();

  // Filter transactions
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

  const handleDelete = async () => {
    if (!selectedTransactionId || !ledgerId) return;
    try {
      await deleteAssetTransactionMutation.mutateAsync({
        ledgerId: Number(ledgerId),
        assetTransactionId: selectedTransactionId,
      });
      setSelectedTransactionId(null);
      onClose();
      onDataChange();
      notify({
        title: "Transaction Deleted",
        description: "The asset transaction has been successfully deleted.",
        status: "success",
      });
    } catch (error) {
      console.error("Error deleting asset transaction:", error);
      notify({
        title: "Error",
        description: "Failed to delete the asset transaction.",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleCardToggle = (transactionId: number) => {
    setExpandedCardId(expandedCardId === transactionId ? null : transactionId);
  };

  const handlePopoverOpen = (transactionId: number) => {
    setOpenPopoverId(transactionId);
  };

  const handlePopoverClose = () => {
    setOpenPopoverId(null);
  };

  const handleRowMouseLeave = () => {
    setOpenPopoverId(null);
  };

  // Mobile card view
  const renderMobileCards = () => (
    <VStack spacing={1} align="stretch">
      {filteredTransactions.map((transaction, index) => {
        const isExpanded = expandedCardId === transaction.asset_transaction_id;
        const isBuy = transaction.transaction_type === "buy";

        return (
          <MotionBox
            key={transaction.asset_transaction_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
          >
            <Box
              p={4}
              border="1px solid"
              borderColor={isExpanded ? expandedBorder : cardBorder}
              borderRadius="xl"
              mb={3}
              bg={mobileCardBg}
              onClick={() => handleCardToggle(transaction.asset_transaction_id)}
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{ borderColor: cardHoverBorder }}
            >
              <Flex justify="space-between" align="flex-start">
                <VStack align="flex-start" spacing={1} maxW="70%">
                  <HStack spacing={2}>
                    <Icon as={Calendar} color={tertiaryTextColor} boxSize={3.5} />
                    <Text fontSize="sm" color={tertiaryTextColor}>
                      {formatDate(transaction.transaction_date)}
                    </Text>
                    <Tooltip label={isBuy ? "Buy Transaction" : "Sell Transaction"}>
                      <Square
                        size="7px"
                        bg={isBuy ? "green.400" : "red.400"}
                        borderRadius="sm"
                      />
                    </Tooltip>
                  </HStack>

                  <Text fontWeight="semibold" fontSize="md">
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

                <VStack align="flex-end" spacing={1}>
                  <HStack spacing={0} align="baseline" justify="flex-end">
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color={getPnLColor(isBuy ? -transaction.total_amount : transaction.total_amount)}
                      letterSpacing="-0.01em"
                    >
                      {splitCurrencyForDisplay(transaction.total_amount, currencySymbol || "$").main}
                    </Text>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      opacity={0.6}
                      color={getPnLColor(isBuy ? -transaction.total_amount : transaction.total_amount)}
                    >
                      {splitCurrencyForDisplay(transaction.total_amount, currencySymbol || "$").decimals}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={tertiaryTextColor} fontWeight="medium">
                    {formatQuantity(transaction.quantity)}{" "}
                    {transaction.physical_asset?.asset_type?.unit_symbol || ""}
                  </Text>
                  <Box
                    bg={navPillBg}
                    color={tertiaryTextColor}
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="medium"
                  >
                    {formatCurrencyWithSymbol(transaction.price_per_unit, currencySymbol || "$")}/{transaction.physical_asset?.asset_type?.unit_symbol || ""}
                  </Box>
                </VStack>
              </Flex>

              {isExpanded && (
                <Box mt={4} pt={3} borderTop="1px solid" borderColor={expandedSectionBorder}>
                  {transaction.notes && (
                    <Box mb={2}>
                      <Text
                        fontSize="sm"
                        color={notesColor}
                        bg={notesBg}
                        p={2.5}
                        borderRadius="lg"
                        whiteSpace="pre-wrap"
                      >
                        {transaction.notes}
                      </Text>
                    </Box>
                  )}

                  <Flex justify="flex-end" mt={transaction.notes ? 1 : 0} gap={1}>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      leftIcon={<Trash2 size={14} />}
                      borderRadius="lg"
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
          </MotionBox>
        );
      })}
    </VStack>
  );

  if (isLoading) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Spinner size="lg" color="brand.500" />
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
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <MotionBox
          mb={{ base: 0, md: 4 }}
          p={{ base: 0, md: 6 }}
          bg={{ base: "transparent", md: headerBg }}
          borderRadius={{ base: "none", md: "xl" }}
          border={{ base: "none", md: "1px solid" }}
          borderColor={{ base: "transparent", md: tableBorderColor }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "start", md: "center" }}
            gap={{ base: 4, md: 0 }}
            mb={4}
          >
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="800"
              color={tertiaryTextColor}
              letterSpacing="-0.02em"
            >
              Transactions
            </Text>
          </Flex>

          <Flex
            direction={{ base: "column", md: "row" }}
            gap={{ base: 3, md: 3 }}
            align={{ base: "stretch", md: "center" }}
            wrap="wrap"
          >
            <Select
              size="sm"
              maxW={{ base: "full", md: "150px" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              borderRadius="lg"
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
              borderRadius="lg"
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
              borderRadius="lg"
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
                borderRadius="lg"
              />
            </InputGroup>
          </Flex>
        </MotionBox>

        {/* Content */}
        {isMobile ? (
          renderMobileCards()
        ) : (
          <MotionBox
            borderRadius="xl"
            overflow="hidden"
            border="1px solid"
            borderColor={tableBorderColor}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          >
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Date</Th>
                    <Th color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Asset</Th>
                    <Th color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Type</Th>
                    <Th isNumeric color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Quantity</Th>
                    <Th isNumeric color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Price/Unit</Th>
                    <Th isNumeric color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Total Amount</Th>
                    <Th color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Account</Th>
                    <Th width="2%" borderBottomColor={tableBorderColor}>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredTransactions.map((transaction) => (
                    <Tr
                      key={transaction.asset_transaction_id}
                      _hover={{ bg: tableRowHoverBg }}
                      transition="background 0.15s ease"
                      onMouseLeave={handleRowMouseLeave}
                      sx={{
                        "&:hover .action-icons": {
                          opacity: 1,
                        },
                      }}
                    >
                      <Td borderBottomColor={tableBorderColor}>
                        <Text fontSize="sm" color={tertiaryTextColor}>
                          {formatDate(transaction.transaction_date)}
                        </Text>
                      </Td>
                      <Td borderBottomColor={tableBorderColor}>
                        <Text fontSize="sm" fontWeight="medium" color={tertiaryTextColor}>
                          {transaction.physical_asset?.name || "N/A"}
                        </Text>
                      </Td>
                      <Td borderBottomColor={tableBorderColor}>
                        <Badge
                          colorScheme={transaction.transaction_type === "buy" ? "green" : "red"}
                          variant="subtle"
                          px={1.5}
                          borderRadius="md"
                          fontSize="0.6em"
                          fontWeight="bold"
                          letterSpacing="0.03em"
                        >
                          {transaction.transaction_type.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td isNumeric borderBottomColor={tableBorderColor}>
                        <Text fontSize="sm" fontWeight="medium" color={tertiaryTextColor}>
                          {formatQuantity(transaction.quantity)}{" "}
                          {transaction.physical_asset?.asset_type?.unit_symbol || ""}
                        </Text>
                      </Td>
                      <Td isNumeric borderBottomColor={tableBorderColor}>
                        <Text fontSize="sm" fontWeight="medium" color={tertiaryTextColor}>
                          {formatCurrencyWithSymbol(transaction.price_per_unit, currencySymbol || "$")}
                        </Text>
                      </Td>
                      <Td isNumeric borderBottomColor={tableBorderColor}>
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
                            opacity={0.6}
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
                      <Td borderBottomColor={tableBorderColor}>
                        <ChakraLink
                          as={Link}
                          to={`/account/${transaction.account_id}`}
                          color={accountLinkColor}
                          fontSize="sm"
                        >
                          {transaction.account_name || `Account ${transaction.account_id}`}
                        </ChakraLink>
                      </Td>
                      <Td width="2%" borderBottomColor={tableBorderColor}>
                        <Flex
                          gap={2}
                          opacity={0}
                          transition="opacity 0.2s ease"
                          className="action-icons"
                        >
                          <AssetTransactionNotesPopover
                            transaction={transaction}
                            isOpen={openPopoverId === transaction.asset_transaction_id}
                            onOpen={() => handlePopoverOpen(transaction.asset_transaction_id)}
                            onClose={handlePopoverClose}
                          />
                          <ChakraLink
                            onClick={() => {
                              setSelectedTransactionId(transaction.asset_transaction_id);
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
          </MotionBox>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isOpen}
          returnFocusOnClose={false}
          onClose={onClose}
          size={isMobile ? "full" : "md"}
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
            <ModalHeader fontWeight="800" letterSpacing="-0.02em">Delete Asset Transaction</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>
                Are you sure you want to delete this asset transaction? This will
                also delete the associated financial transaction and cannot be
                undone.
              </Text>
              {selectedTransactionId && (
                <Box p={3} bg={modalDetailBg} borderRadius="xl" border="1px solid" borderColor={modalBorderColor}>
                  <Text fontWeight="bold">
                    {filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.physical_asset?.name || "Asset"}
                  </Text>
                  <Text fontSize="sm" color={tertiaryTextColor}>
                    {selectedTransactionId && formatDate(
                      filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.transaction_date || ""
                    )}
                  </Text>
                  <HStack spacing={0} align="baseline" mt={1}>
                    <Text fontSize="sm" fontWeight="bold" color={
                      filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.transaction_type === "buy"
                        ? "red.500"
                        : "green.500"
                    }>
                      {selectedTransactionId && splitCurrencyForDisplay(
                        filteredTransactions.find(t => t.asset_transaction_id === selectedTransactionId)?.total_amount || 0,
                        currencySymbol || "$"
                      ).main}
                    </Text>
                    <Text fontSize="xs" fontWeight="semibold" opacity={0.6} color={
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
                variant="ghost"
                mr={3}
                onClick={onClose}
                isDisabled={deleteAssetTransactionMutation.isPending}
                borderRadius="lg"
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                isLoading={deleteAssetTransactionMutation.isPending}
                loadingText="Deleting..."
                leftIcon={<Trash2 size={16} />}
                borderRadius="lg"
                fontWeight="bold"
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </MotionBox>
  );
};

export default AssetTransactionHistory;
