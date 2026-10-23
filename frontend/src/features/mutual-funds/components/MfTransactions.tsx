import { FC, useState, useEffect } from "react";
import { useColorModeValue } from "../../../components/ui/color-mode";
import { Link } from "react-router-dom";
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Table,
  NativeSelect,
  Input,
  IconButton,
  useDisclosure,
  Button,
  Flex,
  Link as ChakraLink,
  Icon,
  useBreakpointValue,
  Square,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { Tooltip } from '@/components/ui/tooltip';
import { InputGroup } from "@/components/ui/input-group";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import { Search, Trash2, Calendar, BookOpen } from "lucide-react";

import { Amc, MutualFund, MfTransaction } from "../types";
import { formatUnits, formatNav, getTransactionTypeText, splitCurrencyForDisplay } from "../utils";
import { formatDate } from "../../physical-assets/utils";
import { deleteMfTransaction } from "../api";

import useLedgerStore from "@/components/shared/store";
import MfTransactionNotesPopover from "./MfTransactionNotesPopover";

const MotionBox = motion.create(Box);

const floatKeyframes = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

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
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const mutedColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
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
  const { open: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

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
      if (onAccountDataChange) {
        onAccountDataChange();
      }
      onDeleteClose();
      setTransactionToDelete(null);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

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

  const handlePopoverOpen = (transactionId: number) => {
    setOpenPopoverId(transactionId);
  };

  const handlePopoverClose = () => {
    setOpenPopoverId(null);
  };

  const handleRowMouseLeave = () => {
    setOpenPopoverId(null);
  };

  // Helper for amount color
  const getAmountColor = (type: MfTransaction['transaction_type']) => {
    if (type === 'buy' || type === 'switch_in') return positiveColor;
    return negativeColor;
  };

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
  const notesBg = useColorModeValue("gray.50", "gray.700");
  const notesColor = useColorModeValue("primaryTextColor", "primaryTextColor");
  const headerBg = useColorModeValue("primaryBg", "cardDarkBg");
  const tableBorderColor = useColorModeValue("gray.100", "gray.600");
  const headerColor = useColorModeValue("gray.400", "gray.500");
  const tableHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const deleteIconColor = useColorModeValue("red.500", "red.300");
  const deleteIconHoverColor = useColorModeValue("red.600", "red.400");
  const buyIndicatorColor = useColorModeValue("green.400", "green.300");
  const sellIndicatorColor = useColorModeValue("red.400", "red.300");
  const switchOutIndicatorColor = useColorModeValue("purple.400", "purple.300");
  const switchInIndicatorColor = useColorModeValue("orange.400", "orange.300");
  const defaultIndicatorColor = useColorModeValue("gray.400", "gray.300");
  const cardBorder = useColorModeValue("gray.100", "gray.600");
  const cardHoverBorder = useColorModeValue("gray.200", "gray.500");
  const expandedBorder = useColorModeValue("brand.200", "brand.600");
  const expandedSectionBorder = useColorModeValue("gray.100", "gray.600");
  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.12)");
  const emptyTitleColor = useColorModeValue("gray.800", "gray.100");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorderColor = useColorModeValue("gray.100", "gray.700");
  const modalDetailBg = useColorModeValue("gray.50", "gray.700");

  // Empty state component
  const EmptyState: FC<{ title: string; message: string }> = ({ title, message }) => (
    <MotionBox
      textAlign="center"
      py={14}
      px={6}
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
        <Icon boxSize={8} color="brand.500" strokeWidth={1.5} asChild><BookOpen /></Icon>
      </Box>
      <Text fontSize="xl" fontWeight="800" color={emptyTitleColor} mb={2} letterSpacing="-0.02em">
        {title}
      </Text>
      <Text fontSize="sm" color={emptySubColor} maxW="320px" lineHeight="1.6">
        {message}
      </Text>
    </MotionBox>
  );

  // Render mobile card view
  const renderMobileCards = () => (
    <VStack gap={1} align="stretch">
      {filteredTransactions.map((transaction, index) => {
        const isExpanded = expandedCardId === transaction.mf_transaction_id;

        return (
          <MotionBox
            key={transaction.mf_transaction_id}
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
              bg={cardBg}
              onClick={() => handleCardToggle(transaction.mf_transaction_id)}
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{ borderColor: cardHoverBorder }}
            >
              <VStack gap={3} align="stretch">
                <HStack gap={2}>
                  <Icon color={iconColor} boxSize={3.5} asChild><Calendar /></Icon>
                  <Text fontSize="sm" color={tertiaryTextColor}>
                    {formatDate(transaction.transaction_date)}
                  </Text>
                  <Tooltip content={getTransactionTypeText(transaction.transaction_type)}>
                    <Square
                      size="7px"
                      bg={transactionTypeIndicatorColor(transaction.transaction_type)}
                      borderRadius="sm"
                    />
                  </Tooltip>
                </HStack>

                <Text fontWeight="semibold" fontSize="md">
                  {transaction.mutual_fund?.name}
                </Text>

                {transaction.transaction_type === 'switch_out' || transaction.transaction_type === 'switch_in' ? (
                  <Text fontSize="sm" color={accountLinkColor} fontWeight="medium">
                    {transaction.target_fund_name}
                  </Text>
                ) : (
                  <ChakraLink
                    color={accountLinkColor}
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ textDecoration: "underline" }}
                    asChild><Link to={`/account/${transaction.account_id}`}>
                      {transaction.account_name || `Account ${transaction.account_id}`}
                    </Link></ChakraLink>
                )}

                <Flex justify="space-between" align="baseline">
                  <VStack align="start" gap={0.5}>
                    <HStack gap={0} align="baseline">
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color={getAmountColor(transaction.transaction_type)}
                        letterSpacing="-0.01em"
                      >
                        {splitCurrencyForDisplay(Number(transaction.amount_excluding_charges), currencySymbol || "₹").main}
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        opacity={0.6}
                        color={getAmountColor(transaction.transaction_type)}
                      >
                        {splitCurrencyForDisplay(Number(transaction.amount_excluding_charges), currencySymbol || "₹").decimals}
                      </Text>
                    </HStack>
                    {Number(transaction.other_charges) > 0 && (
                      <Text fontSize="xs" color={deleteIconColor} fontWeight="medium">
                        {splitCurrencyForDisplay(Number(transaction.other_charges), currencySymbol || "₹").main}{splitCurrencyForDisplay(Number(transaction.other_charges), currencySymbol || "₹").decimals}
                      </Text>
                    )}
                  </VStack>
                  <VStack align="end" gap={0.5}>
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

              {isExpanded && (
                <Box mt={4} pt={3} borderTop="1px solid" borderColor={expandedSectionBorder}>
                  <Box mb={2}>
                    <Text
                      fontSize="sm"
                      color={notesColor}
                      bg={notesBg}
                      p={2.5}
                      borderRadius="lg"
                      whiteSpace="pre-wrap"
                      fontStyle={transaction.notes ? "normal" : "italic"}
                    >
                      {transaction.notes || "No notes for this transaction."}
                    </Text>
                  </Box>

                  <Flex justify="flex-end" mt={1} gap={1}>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      borderRadius="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransactionToDelete(transaction);
                        onDeleteOpen();
                      }}
                      aria-label="Delete transaction"><Trash2 size={16} /></IconButton>
                  </Flex>
                </Box>
              )}
            </Box>
          </MotionBox>
        );
      })}
    </VStack>
  );

  if (!hasResolvedBreakpoint) {
    return null;
  }

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <VStack gap={6} align="stretch">
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
            <NativeSelect.Root size="sm" maxW={{ base: "full", md: "150px" }}>
              <NativeSelect.Field
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                borderRadius="lg">
                <option value="all">All Types</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="switch_out">Switch Out</option>
                <option value="switch_in">Switch In</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>

            <NativeSelect.Root size="sm" maxW={{ base: "full", md: "200px" }}>
              <NativeSelect.Field
                value={amcFilter}
                onChange={(e) => setAmcFilter(e.target.value)}
                borderRadius="lg">
                <option value="all">All AMCs</option>
                {amcs.map(amc => (
                  <option key={amc.amc_id} value={amc.amc_id.toString()}>
                    {amc.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>

            <NativeSelect.Root size="sm" maxW={{ base: "full", md: "200px" }}>
              <NativeSelect.Field
                value={fundFilter}
                onChange={(e) => setFundFilter(e.target.value)}
                borderRadius="lg">
                <option value="all">All Funds</option>
                {mutualFunds.map(fund => (
                  <option key={fund.mutual_fund_id} value={fund.mutual_fund_id.toString()}>
                    {fund.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>

            <InputGroup maxW={{ base: "full", md: "300px" }} startElement={<Search size={16} />}>
              <Input
                size="sm"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="lg"
              />
            </InputGroup>
          </Flex>
        </MotionBox>

        {/* Content */}
        {amcs.length === 0 ? (
          <EmptyState
            title="No Transactions Yet"
            message="Create your first Asset Management Company to start recording transactions"
          />
        ) : mutualFunds.length === 0 ? (
          <EmptyState
            title="No Transactions Yet"
            message="Create your first mutual fund to start recording transactions"
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No Transactions Recorded Yet"
            message="Start by buying units in one of your mutual funds"
          />
        ) : isMobile ? (
          renderMobileCards()
        ) : (
          /* Desktop Table */
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
              <Table.Root variant="line" size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Date</Table.ColumnHeader>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Fund</Table.ColumnHeader>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>AMC</Table.ColumnHeader>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Type</Table.ColumnHeader>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor} textAlign='end'>Units</Table.ColumnHeader>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor} textAlign='end'>NAV</Table.ColumnHeader>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor} textAlign='end'>Amount</Table.ColumnHeader>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor} textAlign='end'>Charges</Table.ColumnHeader>
                    <Table.ColumnHeader color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Account</Table.ColumnHeader>
                    <Table.ColumnHeader width="2%" color={headerColor} fontSize="2xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" borderBottomColor={tableBorderColor}>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredTransactions.map(transaction => (
                    <Table.Row
                      key={transaction.mf_transaction_id}
                      _hover={{ bg: tableHoverBg }}
                      transition="background 0.15s ease"
                      onMouseLeave={handleRowMouseLeave}
                      css={{
                        '&:hover .action-icons': {
                          opacity: 1,
                        }
                      }}
                    >
                      <Table.Cell borderBottomColor={tableBorderColor}>
                        <Text fontSize="sm" color={tertiaryTextColor}>
                          {formatDate(transaction.transaction_date)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell borderBottomColor={tableBorderColor}>
                        <Text fontSize="sm" fontWeight="medium" color={tertiaryTextColor}>
                          {transaction.mutual_fund?.name}
                        </Text>
                      </Table.Cell>
                      <Table.Cell borderBottomColor={tableBorderColor}>
                        <Text fontSize="sm" fontWeight="medium" color={tertiaryTextColor}>
                          {transaction.mutual_fund?.amc?.name}
                        </Text>
                      </Table.Cell>
                      <Table.Cell borderBottomColor={tableBorderColor}>
                        <Badge
                          colorPalette={getTransactionTypeColor(transaction.transaction_type)}
                          size="sm"
                          px={1.5}
                          borderRadius="md"
                          fontSize="0.6em"
                          fontWeight="bold"
                          letterSpacing="0.03em"
                        >
                          {getTransactionTypeText(transaction.transaction_type)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell borderBottomColor={tableBorderColor} textAlign='end'>
                        <Text fontSize="sm" color={tertiaryTextColor}>{formatUnits(transaction.units)}</Text>
                      </Table.Cell>
                      <Table.Cell borderBottomColor={tableBorderColor} textAlign='end'>
                        <Text fontSize="sm" color={tertiaryTextColor}>{currencySymbol || "₹"}{formatNav(Number(transaction.nav_per_unit))}</Text>
                      </Table.Cell>
                      <Table.Cell borderBottomColor={tableBorderColor} textAlign='end'>
                        <HStack gap={0} align="baseline" justify="flex-end">
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={getAmountColor(transaction.transaction_type)}
                          >
                            {splitCurrencyForDisplay(Number(transaction.amount_excluding_charges), currencySymbol || "₹").main}
                          </Text>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            opacity={0.6}
                            color={getAmountColor(transaction.transaction_type)}
                          >
                            {splitCurrencyForDisplay(Number(transaction.amount_excluding_charges), currencySymbol || "₹").decimals}
                          </Text>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell borderBottomColor={tableBorderColor} textAlign='end'>
                        {Number(transaction.other_charges) > 0 && (
                          <HStack gap={0} align="baseline" justify="flex-end">
                            <Text fontSize="sm" fontWeight="semibold" color={deleteIconColor}>
                              {splitCurrencyForDisplay(Number(transaction.other_charges), currencySymbol || "₹").main}
                            </Text>
                            <Text fontSize="xs" fontWeight="semibold" opacity={0.6} color={deleteIconColor}>
                              {splitCurrencyForDisplay(Number(transaction.other_charges), currencySymbol || "₹").decimals}
                            </Text>
                          </HStack>
                        )}
                      </Table.Cell>
                      <Table.Cell borderBottomColor={tableBorderColor}>
                        {transaction.transaction_type === 'switch_out' || transaction.transaction_type === 'switch_in' ? (
                          <Text fontSize="sm" color={mutedColor}>
                            {transaction.target_fund_name}
                          </Text>
                        ) : (
                          <ChakraLink
                            color={accountLinkColor}
                            fontSize="sm"
                            fontWeight="medium"
                            _hover={{ textDecoration: "underline" }}
                            asChild><Link to={`/account/${transaction.account_id}`}>
                              {transaction.account_name || `Account ${transaction.account_id}`}
                            </Link></ChakraLink>
                        )}
                      </Table.Cell>
                      <Table.Cell width="2%" borderBottomColor={tableBorderColor}>
                        <Flex
                          gap={2}
                          opacity={0}
                          transition="opacity 0.2s ease"
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
                              boxSize={4}
                              color={deleteIconColor}
                              _hover={{ color: deleteIconHoverColor }}
                              transition="color 0.15s ease"
                              asChild><Trash2 /></Icon>
                          </ChakraLink>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </MotionBox>
        )}
      </VStack>

      {/* Delete Confirmation Modal */}
      <Dialog.Root
        open={isDeleteOpen}
        size={isMobile ? "full" : "md"}
        motionPreset="slide-in-bottom"
        onOpenChange={e => {
          if (!e.open) {
            onDeleteClose();
          }
        }}
      >
        <Portal>

          <Dialog.Backdrop backdropFilter="blur(4px)" bg="blackAlpha.300" />
          <Dialog.Positioner>
            <Dialog.Content
              margin={isMobile ? 0 : "auto"}
              borderRadius={isMobile ? 0 : "xl"}
              bg={modalBg}
              border="1px solid"
              borderColor={modalBorderColor}
              boxShadow="2xl">
              <Dialog.Header fontWeight="800" letterSpacing="-0.02em">Delete Transaction</Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                <Text mb={4}>
                  Are you sure you want to delete this transaction? This action cannot be undone and will reverse all associated financial transactions.
                </Text>
                {transactionToDelete && (
                  <Box p={3} bg={modalDetailBg} borderRadius="xl" border="1px solid" borderColor={modalBorderColor}>
                    <Text fontWeight="bold">
                      {transactionToDelete.mutual_fund?.name}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      {formatDate(transactionToDelete.transaction_date)}
                    </Text>
                    <VStack align="start" gap={1} mt={1}>
                      <HStack gap={0} align="baseline">
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color={getAmountColor(transactionToDelete.transaction_type)}
                        >
                          {splitCurrencyForDisplay(Number(transactionToDelete.amount_excluding_charges), currencySymbol || "₹").main}
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          opacity={0.6}
                          color={getAmountColor(transactionToDelete.transaction_type)}
                        >
                          {splitCurrencyForDisplay(Number(transactionToDelete.amount_excluding_charges), currencySymbol || "₹").decimals}
                        </Text>
                        <Text fontSize="xs" color={mutedColor} ml={1}>
                          (excl. charges)
                        </Text>
                      </HStack>
                      {Number(transactionToDelete.other_charges) > 0 && (
                        <Text fontSize="xs" color={deleteIconColor} fontWeight="medium">
                          +{splitCurrencyForDisplay(Number(transactionToDelete.other_charges), currencySymbol || "₹").main}{splitCurrencyForDisplay(Number(transactionToDelete.other_charges), currencySymbol || "₹").decimals} charges
                        </Text>
                      )}
                    </VStack>
                  </Box>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="ghost" mr={3} onClick={onDeleteClose} borderRadius="lg">
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleDeleteTransaction}
                  borderRadius="lg"
                  fontWeight="bold"><Trash2 size={16} />Delete
                              </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>

        </Portal>
      </Dialog.Root>
    </MotionBox>
  );
};
export default MfTransactions;
