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
  Divider,
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
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.600", "gray.400");

  const { unrealizedPnl, realizedPnl } = calculateFundPnL(fund);
  const totalUnits = Number(fund.total_units);
  const averageCost = Number(fund.average_cost_per_unit);
  const totalInvestedCash = Number(fund.total_invested_cash);
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
    // Prevent expansion if clicking on interactive elements
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onToggleExpansion(fund.mutual_fund_id);
  };

  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth={1}
      size="sm"
      cursor="pointer"
      onClick={handleCardClick}
      shadow="sm"
      _hover={{ shadow: "md", borderColor: "teal.300" }}
      transition="all 0.2s"
    >
      <CardBody>
        <HStack justify="space-between" align="start" mb={3}>
          <VStack align="start" spacing={1} flex={1}>
            <Text
              fontSize="md"
              fontWeight="semibold"
              color="gray.700"
              noOfLines={1}
            >
              {fund.name}
            </Text>
            {fund.plan && (
              <Text
                fontSize="sm"
                color={mutedColor}
                opacity={0.8}
                noOfLines={1}
              >
                {fund.plan}
              </Text>
            )}
            <HStack spacing={{ base: 4, md: 6 }} color={mutedColor} align="start">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color={mutedColor}>
                  Units
                </Text>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="md">
                    {formatUnits(fund.total_units).split(".")[0]}.
                  </Text>
                  <Text fontSize="sm" opacity={0.7}>
                    {formatUnits(fund.total_units).split(".")[1]}
                  </Text>
                </HStack>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color={mutedColor}>
                  Invested
                </Text>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="md">
                    {splitCurrencyForDisplay(invested, currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="sm" opacity={0.7}>
                    {splitCurrencyForDisplay(invested, currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color={mutedColor}>
                  Value
                </Text>
                 <HStack spacing={0} align="baseline">
                   <Text fontSize="md">
                     {splitCurrencyForDisplay(Number(fund.current_value), currencySymbol || "₹").main}
                   </Text>
                   <Text fontSize="sm" opacity={0.7}>
                     {
                       splitCurrencyForDisplay(Number(fund.current_value), currencySymbol || "₹")
                         .decimals
                     }
                   </Text>
                 </HStack>
              </VStack>
            </HStack>
          </VStack>
           <Badge
             colorScheme={unrealizedPnl >= 0 ? "green" : "red"}
             size="sm"
             fontWeight="medium"
             px={2}
             py={0.5}
             borderRadius="md"
           >
             <Text fontSize="sm" fontWeight="semibold">
               {splitPercentageForDisplay(unrealizedPercentage).main}
               <Text as="span" fontSize="xs" opacity={0.7}>
                 {splitPercentageForDisplay(unrealizedPercentage).decimals}
               </Text>
             </Text>
           </Badge>
        </HStack>

          <Collapse in={isExpanded} animateOpacity>
            <Box pt={2}>
              <Divider mb={3} />
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={3}>
                <Stat size="sm">
                  <StatLabel fontSize="xs" color={mutedColor}>
                    NAV
                  </StatLabel>
                   <StatNumber fontSize="sm" color="gray.600">
                     {currencySymbol || "₹"}{formatNav(Number(fund.latest_nav))}
                   </StatNumber>
                </Stat>
                <Stat size="sm">
                  <StatLabel fontSize="xs" color={mutedColor}>
                    Realized P&L
                  </StatLabel>
                  <HStack spacing={0} align="baseline">
                    <StatNumber
                      fontSize="sm"
                      color={realizedPnl >= 0 ? "green.500" : "red.500"}
                    >
                       {splitCurrencyForDisplay(Math.abs(realizedPnl), currencySymbol || "₹").main}
                    </StatNumber>
                    <Text
                      fontSize="xs"
                      color={realizedPnl >= 0 ? "green.500" : "red.500"}
                      opacity={0.7}
                    >
                      {
                        splitCurrencyForDisplay(Math.abs(realizedPnl), currencySymbol || "₹")
                          .decimals
                      }
                    </Text>
                  </HStack>
                </Stat>
                <Stat size="sm">
                  <StatLabel fontSize="xs" color={mutedColor}>
                    Unrealized P&L
                  </StatLabel>
                  <HStack spacing={0} align="baseline">
                    <StatNumber
                      fontSize="sm"
                      color={unrealizedPnl >= 0 ? "green.500" : "red.500"}
                    >
                       {
                         splitCurrencyForDisplay(Math.abs(unrealizedPnl), currencySymbol || "₹")
                           .main
                       }
                    </StatNumber>
                    <Text
                      fontSize="xs"
                      color={unrealizedPnl >= 0 ? "green.500" : "red.500"}
                      opacity={0.7}
                    >
                      {
                        splitCurrencyForDisplay(Math.abs(unrealizedPnl), currencySymbol || "₹")
                          .decimals
                      }
                    </Text>
                  </HStack>
                </Stat>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={3}>
                <Stat size="sm">
                  <StatLabel fontSize="xs" color={mutedColor}>
                    Avg. Cost
                  </StatLabel>
                  <HStack spacing={0} align="baseline">
                      <StatNumber fontSize="sm" color="gray.600">
                        {
                          splitCurrencyForDisplay(Number(fund.average_cost_per_unit), currencySymbol || "₹")
                            .main
                        }
                      </StatNumber>
                      <Text fontSize="xs" color="gray.600" opacity={0.7}>
                        {
                          splitCurrencyForDisplay(Number(fund.average_cost_per_unit), currencySymbol || "₹")
                            .decimals
                        }
                      </Text>
                  </HStack>
                </Stat>
                 <Stat size="sm">
                   <StatLabel fontSize="xs" color={mutedColor}>
                     Lowest Cost
                   </StatLabel>
                   <HStack spacing={0} align="baseline">
                     <StatNumber fontSize="sm" color="gray.600">
                        {isLoadingTransactions
                          ? "Loading..."
                          : lowestPurchaseCost !== null
                          ? splitCurrencyForDisplay(lowestPurchaseCost, currencySymbol || "₹").main
                          : "--"}
                      </StatNumber>
                      <Text fontSize="xs" color="gray.600" opacity={0.7}>
                        {isLoadingTransactions
                          ? ""
                          : lowestPurchaseCost !== null
                          ? splitCurrencyForDisplay(lowestPurchaseCost, currencySymbol || "₹").decimals
                          : ""}
                     </Text>
                   </HStack>
                 </Stat>
                 <Stat size="sm">
                   <StatLabel fontSize="xs" color={mutedColor}>
                     Highest Cost
                   </StatLabel>
                   <HStack spacing={0} align="baseline">
                     <StatNumber fontSize="sm" color="gray.600">
                        {isLoadingTransactions
                          ? "Loading..."
                          : highestPurchaseCost !== null
                          ? splitCurrencyForDisplay(highestPurchaseCost, currencySymbol || "₹").main
                          : "--"}
                      </StatNumber>
                      <Text fontSize="xs" color="gray.600" opacity={0.7}>
                        {isLoadingTransactions
                          ? ""
                          : highestPurchaseCost !== null
                          ? splitCurrencyForDisplay(highestPurchaseCost, currencySymbol || "₹").decimals
                          : ""}
                     </Text>
                   </HStack>
                 </Stat>
              </SimpleGrid>

             <Divider mb={3} />

              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} w="full">
                <Button
                  size="sm"
                  colorScheme="teal"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTradeUnits(fund.mutual_fund_id);
                  }}
                  sx={{ fontSize: "xs" }}
                  w="full"
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
                  sx={{ fontSize: "xs" }}
                   isDisabled={totalUnits <= 0}
                  w="full"
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
                  sx={{ fontSize: "xs" }}
                  w="full"
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
                  sx={{ fontSize: "xs" }}
                  w="full"
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