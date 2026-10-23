import React, { useState } from "react";
import { useColorModeValue } from "../../../../components/ui/color-mode";
import {
  Box,
  Text,
  Button,
  HStack,
  Collapsible,
  IconButton,
  Flex,
  Stat,
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
        <HStack gap={{ base: 3, md: 5 }} wrap="wrap">
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Lowest Cost
            </Stat.Label>
            <HStack gap={0} align="baseline">
              <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? "..."
                  : lowestPurchaseCost !== null
                    ? splitCurrencyForDisplay(
                        lowestPurchaseCost,
                        currencySymbol || "₹",
                      ).main
                    : "--"}
              </Stat.ValueText>
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
          </Stat.Root>
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Avg. Cost
            </Stat.Label>
            <HStack gap={0} align="baseline">
              <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(fund.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).main
                }
              </Stat.ValueText>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(fund.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).decimals
                }
              </Text>
            </HStack>
          </Stat.Root>
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Highest Cost
            </Stat.Label>
            <HStack gap={0} align="baseline">
              <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? "..."
                  : highestPurchaseCost !== null
                    ? splitCurrencyForDisplay(
                        highestPurchaseCost,
                        currencySymbol || "₹",
                      ).main
                    : "--"}
              </Stat.ValueText>
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
          </Stat.Root>
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Realized P&L
            </Stat.Label>
            <HStack gap={0} align="baseline">
              <Stat.ValueText
                fontSize="sm"
                color={realizedPnl >= 0 ? positiveColor : negativeColor}
              >
                {
                  splitCurrencyForDisplay(
                    Math.abs(realizedPnl),
                    currencySymbol || "₹",
                  ).main
                }
              </Stat.ValueText>
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
          </Stat.Root>
        </HStack>

        <HStack gap={{ base: 3, md: 5 }} wrap="wrap">
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              NAV Last Updated
            </Stat.Label>
            <Stat.ValueText fontSize="xs" color={tertiaryTextColor}>
              {navUpdatedDate ? formatDate(navUpdatedDate) : "--"}
            </Stat.ValueText>
          </Stat.Root>
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              First Transaction
            </Stat.Label>
            <Stat.ValueText fontSize="xs" color={tertiaryTextColor}>
              {isLoadingTransactions
                ? "..."
                : firstTransactionDate
                  ? formatDate(firstTransactionDate)
                  : "--"}
            </Stat.ValueText>
          </Stat.Root>
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Last Transaction
            </Stat.Label>
            <Stat.ValueText fontSize="xs" color={tertiaryTextColor}>
              {isLoadingTransactions
                ? "..."
                : lastTransactionDate
                  ? formatDate(lastTransactionDate)
                  : "--"}
            </Stat.ValueText>
          </Stat.Root>
        </HStack>

        <HStack gap={2}>
          <Button
            size="xs"
            variant="outline"
            onClick={() => onTradeUnits(fund.mutual_fund_id)}><Icon boxSize={3} asChild><ShoppingCart /></Icon>Buy/Sell
                      </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => onTransferUnits(fund.mutual_fund_id)}
            disabled={toNumber(fund.total_units) <= 0}><Icon boxSize={3} asChild><ArrowRightLeft /></Icon>Transfer
                      </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => onViewTransactions(fund.mutual_fund_id)}><Icon boxSize={3} asChild><List /></Icon>Transactions
                      </Button>
          <Button
            size="xs"
            variant="outline"
            colorPalette="purple"
            onClick={() => onViewAnalytics(fund)}><Icon boxSize={3} asChild><BarChart3 /></Icon>Analytics
                      </Button>
          <Button size="xs" variant="outline" onClick={() => onUpdateNav(fund)}><Icon boxSize={3} asChild><RefreshCw /></Icon>Update NAV
                      </Button>
          <Button
            size="xs"
            variant="outline"
            colorPalette="red"
            onClick={() => onCloseFund(fund.mutual_fund_id)}
            disabled={toNumber(fund.total_units) > 0}><Icon boxSize={3} asChild><XCircle /></Icon>Close
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
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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
      data-fund-id={fund.mutual_fund_id}
    >
      <Box p={4}>
        <Flex justify="space-between" align="start">
          <Box maxW="80%">
            <HStack gap={1} align="baseline" wrap="wrap">
              <Text
                fontWeight="medium"
                lineClamp={2}
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
            variant="ghost"
            size="sm"
            aria-label="Expand row"
            onClick={() => setIsExpanded(!isExpanded)}
            cursor="pointer">{isExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}</IconButton>
        </Flex>
        <SimpleGrid columns={2} gap={4} mt={4}>
          <Stat.Root>
            <Stat.Label fontSize="xs" color={mutedColor}>
              Value
            </Stat.Label>
            <Stat.ValueText>
              <HStack gap={0} align="baseline">
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
            </Stat.ValueText>
          </Stat.Root>
          <Stat.Root>
            <Stat.Label fontSize="xs" color={mutedColor}>
              P&L
            </Stat.Label>
            <Stat.ValueText>
              <HStack gap={0} align="baseline">
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
            </Stat.ValueText>
            <HStack gap={0} align="baseline">
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
          </Stat.Root>
        </SimpleGrid>
      </Box>
      <Collapsible.Root open={isExpanded}>
        <Collapsible.Content>
          <Box
            py={3}
            px={4}
            bg={boxBg}
            borderTop="1px solid"
            borderColor={borderColor}
          >
            <SimpleGrid columns={3} columnGap={4} rowGap={2} mb={4}>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  Invested
                </Stat.Label>
                <HStack gap={0} align="baseline">
                  <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                    {
                      splitCurrencyForDisplay(
                        fund.invested,
                        currencySymbol || "₹",
                      ).main
                    }
                  </Stat.ValueText>
                  <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                    {
                      splitCurrencyForDisplay(
                        fund.invested,
                        currencySymbol || "₹",
                      ).decimals
                    }
                  </Text>
                </HStack>
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  Units
                </Stat.Label>
                <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                  {formatUnits(fund.total_units)}
                </Stat.ValueText>
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  NAV
                </Stat.Label>
                <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                  {currencySymbol || "₹"}
                  {formatNav(fund.latest_nav)}
                </Stat.ValueText>
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  Avg. Cost
                </Stat.Label>
                <HStack gap={0} align="baseline">
                  <Stat.ValueText fontSize="sm">
                    {
                      splitCurrencyForDisplay(
                        toNumber(fund.average_cost_per_unit),
                        currencySymbol || "₹",
                      ).main
                    }
                  </Stat.ValueText>
                  <Text fontSize="xs" opacity={0.7}>
                    {
                      splitCurrencyForDisplay(
                        toNumber(fund.average_cost_per_unit),
                        currencySymbol || "₹",
                      ).decimals
                    }
                  </Text>
                </HStack>
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  Realized P&L
                </Stat.Label>
                <HStack gap={0} align="baseline">
                  <Stat.ValueText
                    fontSize="sm"
                    color={realizedPnl >= 0 ? positiveColor : negativeColor}
                  >
                    {
                      splitCurrencyForDisplay(
                        Math.abs(realizedPnl),
                        currencySymbol || "₹",
                      ).main
                    }
                  </Stat.ValueText>
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
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  CAGR %
                </Stat.Label>
                {fund.cagr_percentage != null ? (
                  <HStack gap={0} align="baseline">
                    <Stat.ValueText
                      fontSize="sm"
                      color={
                        fund.cagr_percentage >= 0
                          ? positiveColor
                          : negativeColor
                      }
                    >
                      {splitPercentageForDisplay(fund.cagr_percentage).main}
                    </Stat.ValueText>
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
                  <Stat.ValueText fontSize="sm" color={mutedColor}>
                    ---
                  </Stat.ValueText>
                )}
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  XIRR %
                </Stat.Label>
                {fund.xirr_percentage != null ? (
                  <HStack gap={0} align="baseline">
                    <Stat.ValueText
                      fontSize="sm"
                      color={
                        fund.xirr_percentage >= 0
                          ? positiveColor
                          : negativeColor
                      }
                    >
                      {splitPercentageForDisplay(fund.xirr_percentage).main}
                    </Stat.ValueText>
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
                  <Stat.ValueText fontSize="sm" color={mutedColor}>
                    ---
                  </Stat.ValueText>
                )}
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  NAV Updated
                </Stat.Label>
                <Stat.ValueText fontSize="xs">
                  {navUpdatedDate ? formatDate(navUpdatedDate) : "--"}
                </Stat.ValueText>
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  First Trans
                </Stat.Label>
                <Stat.ValueText fontSize="xs">
                  {isLoadingTransactions
                    ? "..."
                    : firstTransactionDate
                      ? formatDate(firstTransactionDate)
                      : "--"}
                </Stat.ValueText>
              </Stat.Root>
              <Stat.Root size="sm">
                <Stat.Label fontSize="2xs" color={mutedColor}>
                  Last Trans
                </Stat.Label>
                <Stat.ValueText fontSize="xs">
                  {isLoadingTransactions
                    ? "..."
                    : lastTransactionDate
                      ? formatDate(lastTransactionDate)
                      : "--"}
                </Stat.ValueText>
              </Stat.Root>
            </SimpleGrid>
            <Flex gap={3} mt={4} justify="space-around">
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => onTradeUnits(fund.mutual_fund_id)}
                aria-label="Buy/Sell"
                title="Buy/Sell"><Icon asChild><ShoppingCart /></Icon></IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => onTransferUnits(fund.mutual_fund_id)}
                disabled={toNumber(fund.total_units) <= 0}
                aria-label="Transfer"
                title="Transfer"><Icon asChild><ArrowRightLeft /></Icon></IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => onViewTransactions(fund.mutual_fund_id)}
                aria-label="Transactions"
                title="Transactions"><Icon asChild><List /></Icon></IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                colorPalette="purple"
                onClick={() => onViewAnalytics(fund)}
                aria-label="Analytics"
                title="Analytics"><Icon asChild><BarChart3 /></Icon></IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => onUpdateNav(fund)}
                aria-label="Update NAV"
                title="Update NAV"><Icon asChild><RefreshCw /></Icon></IconButton>
              <IconButton
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={() => onCloseFund(fund.mutual_fund_id)}
                disabled={toNumber(fund.total_units) > 0}
                aria-label="Close"
                title="Close"><Icon asChild><XCircle /></Icon></IconButton>
            </Flex>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export { ExpandedFundRow, MobileFundCard };
