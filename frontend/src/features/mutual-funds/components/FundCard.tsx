import React, { FC } from "react";
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  Collapse,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { MutualFund } from "../types";
import {
  formatUnits,
  formatNav,
  calculateFundPnL,
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
  calculateHighestPurchaseCost,
  calculateLowestPurchaseCost,
} from "../utils";
import { useFundTransactions } from "../api";
import useLedgerStore from "../../../components/shared/store";

/* eslint-disable no-unused-vars */
interface FundCardProps {
  fund: MutualFund;
  isExpanded: boolean;
  onToggleExpansion: (fundId: number) => void;
  onTradeUnits: (fundId: number) => void;
  onTransferUnits: (fundId: number) => void;
  onUpdateNav: (fund: MutualFund) => void;
  onCloseFund: (fundId: number) => void;
}
/* eslint-enable no-unused-vars */

const FundCard: FC<FundCardProps> = ({
  fund,
  isExpanded,
  onToggleExpansion,
  onTradeUnits,
  onTransferUnits,
  onUpdateNav,
  onCloseFund,
}) => {
  const { currencySymbol } = useLedgerStore();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const expandedBorder = useColorModeValue("brand.200", "brand.600");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const nameColor = useColorModeValue("gray.800", "gray.100");
  const statColor = useColorModeValue("gray.600", "gray.300");
  const expandedSectionBorder = useColorModeValue("gray.100", "gray.600");
  const expandedBg = useColorModeValue("gray.50", "gray.750");

  const { unrealizedPnl, realizedPnl } = calculateFundPnL(fund);
  const totalUnits = Number(fund.total_units);
  const totalInvestedCash = Number(fund.total_invested_cash);
  const averageCost = Number(fund.average_cost_per_unit);
  const costBasis = totalInvestedCash || (totalUnits * averageCost);
  const invested = totalInvestedCash || (totalUnits * averageCost);
  const unrealizedPercentage =
    costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

  // Fetch transactions for cost calculations only when expanded
  const { data: transactions = [], isLoading: isLoadingTransactions } = useFundTransactions(fund.ledger_id, fund.mutual_fund_id, { enabled: isExpanded });
  const transactionsForCost = transactions.map(tx => ({ ...tx, nav_per_unit: Number(tx.nav_per_unit) }));
  const highestPurchaseCost = isExpanded ? calculateHighestPurchaseCost(transactionsForCost) : null;
  const lowestPurchaseCost = isExpanded ? calculateLowestPurchaseCost(transactionsForCost) : null;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onToggleExpansion(fund.mutual_fund_id);
  };

  return (
    <Card
      bg={cardBg}
      borderColor={isExpanded ? expandedBorder : borderColor}
      borderWidth={1}
      size="sm"
      cursor="pointer"
      onClick={handleCardClick}
      borderRadius="xl"
      overflow="hidden"
      _hover={{ borderColor: isExpanded ? expandedBorder : useColorModeValue("gray.200", "gray.600") }}
      transition="all 0.2s ease"
    >
      <CardBody>
        <HStack justify="space-between" align="start" mb={3}>
          <VStack align="start" spacing={1} flex={1}>
            <Text
              fontSize="md"
              fontWeight="bold"
              color={nameColor}
              noOfLines={1}
              letterSpacing="-0.01em"
            >
              {fund.name}
            </Text>
            {fund.plan && (
              <Text
                fontSize="sm"
                color={mutedColor}
                noOfLines={1}
              >
                {fund.plan}
              </Text>
            )}
            <HStack spacing={{ base: 4, md: 6 }} color={mutedColor} align="start" mt={1}>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                  Units
                </Text>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="md" color={statColor} fontWeight="semibold">
                    {formatUnits(fund.total_units).split(".")[0]}.
                  </Text>
                  <Text fontSize="sm" color={statColor} opacity={0.6}>
                    {formatUnits(fund.total_units).split(".")[1]}
                  </Text>
                </HStack>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                  Invested
                </Text>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="md" color={statColor} fontWeight="semibold">
                    {splitCurrencyForDisplay(invested, currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="sm" color={statColor} opacity={0.6}>
                    {splitCurrencyForDisplay(invested, currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                  Value
                </Text>
                 <HStack spacing={0} align="baseline">
                   <Text fontSize="md" color={statColor} fontWeight="semibold">
                     {splitCurrencyForDisplay(Number(fund.current_value), currencySymbol || "₹").main}
                   </Text>
                   <Text fontSize="sm" color={statColor} opacity={0.6}>
                     {splitCurrencyForDisplay(Number(fund.current_value), currencySymbol || "₹").decimals}
                   </Text>
                 </HStack>
              </VStack>
            </HStack>
          </VStack>
           <Badge
             colorScheme={unrealizedPnl >= 0 ? "green" : "red"}
             size="sm"
             fontWeight="bold"
             px={2}
             py={0.5}
             borderRadius="lg"
           >
             <Text fontSize="sm" fontWeight="bold">
               {splitPercentageForDisplay(unrealizedPercentage).main}
               <Text as="span" fontSize="xs" opacity={0.7}>
                 {splitPercentageForDisplay(unrealizedPercentage).decimals}
               </Text>
             </Text>
           </Badge>
        </HStack>

          <Collapse in={isExpanded} animateOpacity>
            <Box pt={3}>
              <Box borderTop="1px solid" borderColor={expandedSectionBorder} pt={3} mb={3} />
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={3}>
                <Stat size="sm">
                  <StatLabel fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                    NAV
                  </StatLabel>
                   <StatNumber fontSize="sm" color={statColor} fontWeight="semibold">
                     {currencySymbol || "₹"}{formatNav(Number(fund.latest_nav))}
                   </StatNumber>
                </Stat>
                <Stat size="sm">
                  <StatLabel fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                    Realized P&L
                  </StatLabel>
                  <HStack spacing={0} align="baseline">
                    <StatNumber
                      fontSize="sm"
                      color={realizedPnl >= 0 ? "green.500" : "red.500"}
                      fontWeight="semibold"
                    >
                       {splitCurrencyForDisplay(Math.abs(realizedPnl), currencySymbol || "₹").main}
                    </StatNumber>
                    <Text
                      fontSize="xs"
                      color={realizedPnl >= 0 ? "green.500" : "red.500"}
                      opacity={0.6}
                    >
                      {splitCurrencyForDisplay(Math.abs(realizedPnl), currencySymbol || "₹").decimals}
                    </Text>
                  </HStack>
                </Stat>
                <Stat size="sm">
                  <StatLabel fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                    Unrealized P&L
                  </StatLabel>
                  <HStack spacing={0} align="baseline">
                    <StatNumber
                      fontSize="sm"
                      color={unrealizedPnl >= 0 ? "green.500" : "red.500"}
                      fontWeight="semibold"
                    >
                       {splitCurrencyForDisplay(Math.abs(unrealizedPnl), currencySymbol || "₹").main}
                    </StatNumber>
                    <Text
                      fontSize="xs"
                      color={unrealizedPnl >= 0 ? "green.500" : "red.500"}
                      opacity={0.6}
                    >
                      {splitCurrencyForDisplay(Math.abs(unrealizedPnl), currencySymbol || "₹").decimals}
                    </Text>
                  </HStack>
                </Stat>
              </SimpleGrid>
              <Box bg={expandedBg} borderRadius="lg" p={3} mb={3}>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                  <Stat size="sm">
                    <StatLabel fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                      Avg. Cost
                    </StatLabel>
                    <HStack spacing={0} align="baseline">
                        <StatNumber fontSize="sm" color={statColor} fontWeight="semibold">
                          {splitCurrencyForDisplay(Number(fund.average_cost_per_unit), currencySymbol || "₹").main}
                        </StatNumber>
                        <Text fontSize="xs" color={statColor} opacity={0.6}>
                          {splitCurrencyForDisplay(Number(fund.average_cost_per_unit), currencySymbol || "₹").decimals}
                        </Text>
                    </HStack>
                  </Stat>
                   <Stat size="sm">
                     <StatLabel fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                       Lowest Cost
                     </StatLabel>
                     <HStack spacing={0} align="baseline">
                       <StatNumber fontSize="sm" color={statColor} fontWeight="semibold">
                          {isLoadingTransactions
                            ? "..."
                            : lowestPurchaseCost !== null
                            ? splitCurrencyForDisplay(lowestPurchaseCost, currencySymbol || "₹").main
                            : "--"}
                        </StatNumber>
                        <Text fontSize="xs" color={statColor} opacity={0.6}>
                          {isLoadingTransactions
                            ? ""
                            : lowestPurchaseCost !== null
                            ? splitCurrencyForDisplay(lowestPurchaseCost, currencySymbol || "₹").decimals
                            : ""}
                       </Text>
                     </HStack>
                   </Stat>
                   <Stat size="sm">
                     <StatLabel fontSize="xs" color={mutedColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                       Highest Cost
                     </StatLabel>
                     <HStack spacing={0} align="baseline">
                       <StatNumber fontSize="sm" color={statColor} fontWeight="semibold">
                          {isLoadingTransactions
                            ? "..."
                            : highestPurchaseCost !== null
                            ? splitCurrencyForDisplay(highestPurchaseCost, currencySymbol || "₹").main
                            : "--"}
                        </StatNumber>
                        <Text fontSize="xs" color={statColor} opacity={0.6}>
                          {isLoadingTransactions
                            ? ""
                            : highestPurchaseCost !== null
                            ? splitCurrencyForDisplay(highestPurchaseCost, currencySymbol || "₹").decimals
                            : ""}
                       </Text>
                     </HStack>
                   </Stat>
                </SimpleGrid>
              </Box>

              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} w="full">
                <Button
                  size="sm"
                  colorScheme="teal"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTradeUnits(fund.mutual_fund_id);
                  }}
                  fontSize="xs"
                  fontWeight="bold"
                  w="full"
                  borderRadius="lg"
                >
                  Buy/Sell
                </Button>
                <Button
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransferUnits(fund.mutual_fund_id);
                  }}
                  fontSize="xs"
                  fontWeight="bold"
                  isDisabled={totalUnits <= 0}
                  w="full"
                  borderRadius="lg"
                >
                  Transfer
                </Button>
                <Button
                  size="sm"
                  colorScheme="orange"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateNav(fund);
                  }}
                  fontSize="xs"
                  fontWeight="bold"
                  w="full"
                  borderRadius="lg"
                >
                  Update NAV
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFund(fund.mutual_fund_id);
                  }}
                  isDisabled={totalUnits > 0}
                  fontSize="xs"
                  fontWeight="bold"
                  w="full"
                  borderRadius="lg"
                >
                  Close Fund
                </Button>
              </SimpleGrid>
           </Box>
         </Collapse>
      </CardBody>
    </Card>
  );
};

export default FundCard;
