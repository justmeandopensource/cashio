import React, { useState } from "react";
import {
  Box,
  Text,
  Button,
  HStack,
  Collapse,
  IconButton,
  Flex,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  ArrowRightLeft,
  RefreshCw,
  XCircle,
  List,
  BarChart3,
} from "lucide-react";
import {
  calculateFundPnL,
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
  formatUnits,
  formatNav,
  calculateHighestPurchaseCost,
  calculateLowestPurchaseCost,
} from "../../utils";
import { useFundTransactions } from "../../api";
import {
  toNumber,
  getPlanInitials,
  getOwnerInitials,
  ExpandedFundRowProps,
  MobileFundCardProps,
} from "./types";

// Desktop expanded row shown beneath the main table row
const ExpandedFundRow: React.FC<ExpandedFundRowProps> = ({
  fund,
  currencySymbol,
  mutedColor,
  isExpanded,
  onTradeUnits,
  onTransferUnits,
  onUpdateNav,
  onCloseFund,
  onViewTransactions,
  onViewAnalytics,
  positiveColor,
  negativeColor,
}) => {
  const { realizedPnl } = calculateFundPnL(fund);
  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useFundTransactions(fund.ledger_id, fund.mutual_fund_id, {
      enabled: isExpanded,
    });

  // Convert transactions for cost calculations
  const purchaseTransactions = transactions.map((t) => ({
    transaction_type: t.transaction_type,
    nav_per_unit: toNumber(t.nav_per_unit),
  }));

  const highestPurchaseCost =
    calculateHighestPurchaseCost(purchaseTransactions);
  const lowestPurchaseCost = calculateLowestPurchaseCost(purchaseTransactions);

  // Compute transaction dates
  const transactionDates = transactions
    .map((t) => new Date(t.transaction_date))
    .filter((d) => !isNaN(d.getTime()));
  const firstTransactionDate =
    transactionDates.length > 0
      ? new Date(Math.min(...transactionDates.map((d) => d.getTime())))
      : null;
  const lastTransactionDate =
    transactionDates.length > 0
      ? new Date(Math.max(...transactionDates.map((d) => d.getTime())))
      : null;
  const navUpdatedDate = fund.last_nav_update
    ? new Date(fund.last_nav_update)
    : null;

  const boxBg = useColorModeValue("gray.50", "cardDarkBg");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tertiaryTextColor = useColorModeValue(
    "tertiaryTextColor",
    "tertiaryTextColor",
  );

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return (
    <Box
      py={{ base: 2, md: 3 }}
      px={{ base: 2, md: 3 }}
      pl={{ md: "4.5rem" }}
      bg={boxBg}
      borderTop="1px solid"
      borderColor={borderColor}
    >
      <Flex
        wrap="wrap"
        align="center"
        justify="space-between"
        columnGap={4}
        rowGap={3}
      >
        <HStack spacing={{ base: 3, md: 5 }} wrap="wrap">
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Lowest Cost
            </StatLabel>
            <HStack spacing={0} align="baseline">
              <StatNumber fontSize="sm" color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? "..."
                  : lowestPurchaseCost !== null
                    ? splitCurrencyForDisplay(
                        lowestPurchaseCost,
                        currencySymbol || "₹",
                      ).main
                    : "--"}
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? ""
                  : lowestPurchaseCost !== null
                    ? splitCurrencyForDisplay(
                        lowestPurchaseCost,
                        currencySymbol || "₹",
                      ).decimals
                    : ""}
              </Text>
            </HStack>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Avg. Cost
            </StatLabel>
            <HStack spacing={0} align="baseline">
              <StatNumber fontSize="sm" color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(fund.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).main
                }
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(fund.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).decimals
                }
              </Text>
            </HStack>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Highest Cost
            </StatLabel>
            <HStack spacing={0} align="baseline">
              <StatNumber fontSize="sm" color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? "..."
                  : highestPurchaseCost !== null
                    ? splitCurrencyForDisplay(
                        highestPurchaseCost,
                        currencySymbol || "₹",
                      ).main
                    : "--"}
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? ""
                  : highestPurchaseCost !== null
                    ? splitCurrencyForDisplay(
                        highestPurchaseCost,
                        currencySymbol || "₹",
                      ).decimals
                    : ""}
              </Text>
            </HStack>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Realized P&L
            </StatLabel>
            <HStack spacing={0} align="baseline">
              <StatNumber
                fontSize="sm"
                color={realizedPnl >= 0 ? positiveColor : negativeColor}
              >
                {
                  splitCurrencyForDisplay(
                    Math.abs(realizedPnl),
                    currencySymbol || "₹",
                  ).main
                }
              </StatNumber>
              <Text
                fontSize="xs"
                color={realizedPnl >= 0 ? positiveColor : negativeColor}
                opacity={0.7}
              >
                {
                  splitCurrencyForDisplay(
                    Math.abs(realizedPnl),
                    currencySymbol || "₹",
                  ).decimals
                }
              </Text>
            </HStack>
          </Stat>
        </HStack>

        <HStack spacing={{ base: 3, md: 5 }} wrap="wrap">
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              NAV Last Updated
            </StatLabel>
            <StatNumber fontSize="xs" color={tertiaryTextColor}>
              {navUpdatedDate ? formatDate(navUpdatedDate) : "--"}
            </StatNumber>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              First Transaction
            </StatLabel>
            <StatNumber fontSize="xs" color={tertiaryTextColor}>
              {isLoadingTransactions
                ? "..."
                : firstTransactionDate
                  ? formatDate(firstTransactionDate)
                  : "--"}
            </StatNumber>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Last Transaction
            </StatLabel>
            <StatNumber fontSize="xs" color={tertiaryTextColor}>
              {isLoadingTransactions
                ? "..."
                : lastTransactionDate
                  ? formatDate(lastTransactionDate)
                  : "--"}
            </StatNumber>
          </Stat>
        </HStack>

        <HStack spacing={2}>
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Icon as={ShoppingCart} boxSize={3} />}
            onClick={() => onTradeUnits(fund.mutual_fund_id)}
          >
            Buy/Sell
          </Button>
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Icon as={ArrowRightLeft} boxSize={3} />}
            onClick={() => onTransferUnits(fund.mutual_fund_id)}
            isDisabled={toNumber(fund.total_units) <= 0}
          >
            Transfer
          </Button>
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Icon as={List} boxSize={3} />}
            onClick={() => onViewTransactions(fund.mutual_fund_id)}
          >
            Transactions
          </Button>
          <Button
            size="xs"
            variant="outline"
            colorScheme="purple"
            leftIcon={<Icon as={BarChart3} boxSize={3} />}
            onClick={() => onViewAnalytics(fund)}
          >
            Analytics
          </Button>
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Icon as={RefreshCw} boxSize={3} />}
            onClick={() => onUpdateNav(fund)}
          >
            Update NAV
          </Button>
          <Button
            size="xs"
            variant="outline"
            colorScheme="red"
            leftIcon={<Icon as={XCircle} boxSize={3} />}
            onClick={() => onCloseFund(fund.mutual_fund_id)}
            isDisabled={toNumber(fund.total_units) > 0}
          >
            Close
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

// Mobile card for a single fund
const MobileFundCard: React.FC<MobileFundCardProps> = ({
  fund,
  onAmcClick,
  onFundClick,
  amcs,
  currencySymbol,
  mutedColor,
  tertiaryTextColor,
  amcFundNameColor,
  positiveColor,
  negativeColor,
  onTradeUnits,
  onTransferUnits,
  onUpdateNav,
  onCloseFund,
  onViewTransactions,
  onViewAnalytics,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const boxBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("white", "cardDarkBg");

  const { realizedPnl } = calculateFundPnL(fund);

  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useFundTransactions(fund.ledger_id, fund.mutual_fund_id, {
      enabled: isExpanded,
    });

  // Compute transaction dates
  const transactionDates = transactions
    .map((t) => new Date(t.transaction_date))
    .filter((d) => !isNaN(d.getTime()));
  const firstTransactionDate =
    transactionDates.length > 0
      ? new Date(Math.min(...transactionDates.map((d) => d.getTime())))
      : null;
  const lastTransactionDate =
    transactionDates.length > 0
      ? new Date(Math.max(...transactionDates.map((d) => d.getTime())))
      : null;
  const navUpdatedDate = fund.last_nav_update
    ? new Date(fund.last_nav_update)
    : null;

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      boxShadow="md"
    >
      <Box p={4}>
        <Flex justify="space-between" align="start">
          <Box maxW="80%">
            <HStack spacing={1} align="baseline" wrap="wrap">
              <Text
                fontWeight="medium"
                noOfLines={2}
                color={amcFundNameColor}
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
                onClick={() => onFundClick(fund)}
              >
                {fund.name}
              </Text>
              {getPlanInitials(fund.plan) && (
                <Text as="span" fontSize="xs" color="gray.500">
                  ({getPlanInitials(fund.plan)})
                </Text>
              )}
              {getOwnerInitials(fund.owner) && (
                <Text as="span" fontSize="xs" color="gray.500">
                  [{getOwnerInitials(fund.owner)}]
                </Text>
              )}
            </HStack>
            <Text
              fontSize="sm"
              color={amcFundNameColor}
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={() => {
                const amc = amcs.find((a) => a.amc_id === fund.amc_id);
                if (amc) onAmcClick(amc);
              }}
            >
              {fund.amc_name}
            </Text>
          </Box>
          <IconButton
            icon={
              isExpanded ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )
            }
            variant="ghost"
            size="sm"
            aria-label="Expand row"
            onClick={() => setIsExpanded(!isExpanded)}
            cursor="pointer"
          />
        </Flex>
        <SimpleGrid columns={2} spacing={4} mt={4}>
          <Stat>
            <StatLabel fontSize="xs" color={mutedColor}>
              Value
            </StatLabel>
            <StatNumber>
              <HStack spacing={0} align="baseline">
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color={tertiaryTextColor}
                >
                  {
                    splitCurrencyForDisplay(
                      fund.current_value,
                      currencySymbol || "₹",
                    ).main
                  }
                </Text>
                <Text fontSize="sm" fontWeight="bold" opacity={0.7}>
                  {
                    splitCurrencyForDisplay(
                      fund.current_value,
                      currencySymbol || "₹",
                    ).decimals
                  }
                </Text>
              </HStack>
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color={mutedColor}>
              P&L
            </StatLabel>
            <StatNumber>
              <HStack spacing={0} align="baseline">
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color={
                    fund.unrealized_pnl >= 0 ? positiveColor : negativeColor
                  }
                >
                  {
                    splitCurrencyForDisplay(
                      Math.abs(fund.unrealized_pnl),
                      currencySymbol || "₹",
                    ).main
                  }
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={
                    fund.unrealized_pnl >= 0 ? positiveColor : negativeColor
                  }
                  opacity={0.7}
                >
                  {
                    splitCurrencyForDisplay(
                      Math.abs(fund.unrealized_pnl),
                      currencySymbol || "₹",
                    ).decimals
                  }
                </Text>
              </HStack>
            </StatNumber>
            <HStack spacing={0} align="baseline">
              <Text
                fontSize="xs"
                color={
                  fund.unrealized_pnl_percentage >= 0
                    ? positiveColor
                    : negativeColor
                }
              >
                {
                  splitPercentageForDisplay(fund.unrealized_pnl_percentage)
                    .main
                }
              </Text>
              <Text
                fontSize="xs"
                color={
                  fund.unrealized_pnl_percentage >= 0
                    ? positiveColor
                    : negativeColor
                }
                opacity={0.7}
              >
                {
                  splitPercentageForDisplay(fund.unrealized_pnl_percentage)
                    .decimals
                }
              </Text>
            </HStack>
          </Stat>
        </SimpleGrid>
      </Box>
      <Collapse in={isExpanded} animateOpacity>
        <Box
          py={3}
          px={4}
          bg={boxBg}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <SimpleGrid columns={3} spacingX={4} spacingY={2} mb={4}>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                Invested
              </StatLabel>
              <HStack spacing={0} align="baseline">
                <StatNumber fontSize="sm" color={tertiaryTextColor}>
                  {
                    splitCurrencyForDisplay(
                      fund.invested,
                      currencySymbol || "₹",
                    ).main
                  }
                </StatNumber>
                <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                  {
                    splitCurrencyForDisplay(
                      fund.invested,
                      currencySymbol || "₹",
                    ).decimals
                  }
                </Text>
              </HStack>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                Units
              </StatLabel>
              <StatNumber fontSize="sm" color={tertiaryTextColor}>
                {formatUnits(fund.total_units)}
              </StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                NAV
              </StatLabel>
              <StatNumber fontSize="sm" color={tertiaryTextColor}>
                {currencySymbol || "₹"}
                {formatNav(fund.latest_nav)}
              </StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                Avg. Cost
              </StatLabel>
              <HStack spacing={0} align="baseline">
                <StatNumber fontSize="sm">
                  {
                    splitCurrencyForDisplay(
                      toNumber(fund.average_cost_per_unit),
                      currencySymbol || "₹",
                    ).main
                  }
                </StatNumber>
                <Text fontSize="xs" opacity={0.7}>
                  {
                    splitCurrencyForDisplay(
                      toNumber(fund.average_cost_per_unit),
                      currencySymbol || "₹",
                    ).decimals
                  }
                </Text>
              </HStack>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                Realized P&L
              </StatLabel>
              <HStack spacing={0} align="baseline">
                <StatNumber
                  fontSize="sm"
                  color={realizedPnl >= 0 ? positiveColor : negativeColor}
                >
                  {
                    splitCurrencyForDisplay(
                      Math.abs(realizedPnl),
                      currencySymbol || "₹",
                    ).main
                  }
                </StatNumber>
                <Text
                  fontSize="xs"
                  color={realizedPnl >= 0 ? positiveColor : negativeColor}
                  opacity={0.7}
                >
                  {
                    splitCurrencyForDisplay(
                      Math.abs(realizedPnl),
                      currencySymbol || "₹",
                    ).decimals
                  }
                </Text>
              </HStack>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                CAGR %
              </StatLabel>
              {fund.cagr_percentage != null ? (
                <HStack spacing={0} align="baseline">
                  <StatNumber
                    fontSize="sm"
                    color={
                      fund.cagr_percentage >= 0
                        ? positiveColor
                        : negativeColor
                    }
                  >
                    {splitPercentageForDisplay(fund.cagr_percentage).main}
                  </StatNumber>
                  <Text
                    fontSize="xs"
                    color={
                      fund.cagr_percentage >= 0
                        ? positiveColor
                        : negativeColor
                    }
                    opacity={0.7}
                  >
                    {splitPercentageForDisplay(fund.cagr_percentage).decimals}
                  </Text>
                </HStack>
              ) : (
                <StatNumber fontSize="sm" color={mutedColor}>
                  ---
                </StatNumber>
              )}
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                XIRR %
              </StatLabel>
              {fund.xirr_percentage != null ? (
                <HStack spacing={0} align="baseline">
                  <StatNumber
                    fontSize="sm"
                    color={
                      fund.xirr_percentage >= 0
                        ? positiveColor
                        : negativeColor
                    }
                  >
                    {splitPercentageForDisplay(fund.xirr_percentage).main}
                  </StatNumber>
                  <Text
                    fontSize="xs"
                    color={
                      fund.xirr_percentage >= 0
                        ? positiveColor
                        : negativeColor
                    }
                    opacity={0.7}
                  >
                    {splitPercentageForDisplay(fund.xirr_percentage).decimals}
                  </Text>
                </HStack>
              ) : (
                <StatNumber fontSize="sm" color={mutedColor}>
                  ---
                </StatNumber>
              )}
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                NAV Updated
              </StatLabel>
              <StatNumber fontSize="xs">
                {navUpdatedDate ? formatDate(navUpdatedDate) : "--"}
              </StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                First Trans
              </StatLabel>
              <StatNumber fontSize="xs">
                {isLoadingTransactions
                  ? "..."
                  : firstTransactionDate
                    ? formatDate(firstTransactionDate)
                    : "--"}
              </StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel fontSize="2xs" color={mutedColor}>
                Last Trans
              </StatLabel>
              <StatNumber fontSize="xs">
                {isLoadingTransactions
                  ? "..."
                  : lastTransactionDate
                    ? formatDate(lastTransactionDate)
                    : "--"}
              </StatNumber>
            </Stat>
          </SimpleGrid>
          <Flex gap={3} mt={4} justify="space-around">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon as={ShoppingCart} />}
              onClick={() => onTradeUnits(fund.mutual_fund_id)}
              aria-label="Buy/Sell"
              title="Buy/Sell"
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon as={ArrowRightLeft} />}
              onClick={() => onTransferUnits(fund.mutual_fund_id)}
              isDisabled={toNumber(fund.total_units) <= 0}
              aria-label="Transfer"
              title="Transfer"
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon as={List} />}
              onClick={() => onViewTransactions(fund.mutual_fund_id)}
              aria-label="Transactions"
              title="Transactions"
            />
            <IconButton
              size="sm"
              variant="ghost"
              colorScheme="purple"
              icon={<Icon as={BarChart3} />}
              onClick={() => onViewAnalytics(fund)}
              aria-label="Analytics"
              title="Analytics"
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon as={RefreshCw} />}
              onClick={() => onUpdateNav(fund)}
              aria-label="Update NAV"
              title="Update NAV"
            />
            <IconButton
              size="sm"
              variant="ghost"
              colorScheme="red"
              icon={<Icon as={XCircle} />}
              onClick={() => onCloseFund(fund.mutual_fund_id)}
              isDisabled={toNumber(fund.total_units) > 0}
              aria-label="Close"
              title="Close"
            />
          </Flex>
        </Box>
      </Collapse>
    </Box>
  );
};

export { ExpandedFundRow, MobileFundCard };
