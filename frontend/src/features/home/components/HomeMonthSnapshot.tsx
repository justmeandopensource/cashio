import React from "react";
import {
  Box,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentMonthOverview } from "@/features/insights/api";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { queryKeys } from "@/lib/queryKeys";
import type { Ledger } from "@/types";

const MotionBox = motion(Box);

interface HomeMonthSnapshotProps {
  defaultLedgerId: number;
  ledgers: Ledger[];
}

interface MonthOverviewData {
  total_income: number;
  total_expense: number;
  prev_month_total_income: number;
  prev_month_total_expense: number;
}

const HomeMonthSnapshot: React.FC<HomeMonthSnapshotProps> = ({
  defaultLedgerId,
  ledgers,
}) => {
  const navigate = useNavigate();

  const defaultLedger = ledgers.find(
    (l) => String(l.ledger_id) === String(defaultLedgerId)
  );
  const sym = defaultLedger?.currency_symbol || "$";

  const { data, isLoading } = useQuery<MonthOverviewData>({
    queryKey: queryKeys.insights.currentMonth(defaultLedgerId),
    queryFn: ({ signal }) => getCurrentMonthOverview(defaultLedgerId, signal),
    staleTime: 5 * 60 * 1000,
  });

  const cardBg = useColorModeValue("white", "cardDarkBg");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const incomeColor = useColorModeValue("green.600", "green.300");
  const expenseColor = useColorModeValue("red.500", "red.300");
  const savingsPositiveColor = useColorModeValue("blue.600", "blue.300");
  const savingsNegativeColor = useColorModeValue("red.500", "red.300");
  const incomeAccent = useColorModeValue("green.400", "green.400");
  const expenseAccent = useColorModeValue("red.400", "red.400");
  const savingsAccent = useColorModeValue("blue.400", "blue.400");
  const rateAccent = useColorModeValue("purple.400", "purple.400");
  const rateBg = useColorModeValue("purple.50", "rgba(128,90,213,0.12)");
  const rateColor = useColorModeValue("purple.600", "purple.300");
  const changeGoodColor = useColorModeValue("green.600", "green.300");
  const changeBadColor = useColorModeValue("red.500", "red.300");
  const changeNeutralColor = useColorModeValue("gray.400", "gray.500");
  const changeBgGood = useColorModeValue("green.50", "rgba(72,187,120,0.1)");
  const changeBgBad = useColorModeValue("red.50", "rgba(245,101,101,0.1)");
  const changeBgNeutral = useColorModeValue("gray.50", "rgba(160,174,192,0.1)");
  const monthLabel = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton borderRadius="xl" h="100px" />
      </Box>
    );
  }

  if (!data) return null;

  const netSavings = data.total_income - data.total_expense;
  const isPositive = netSavings >= 0;
  const savingsRate =
    data.total_income > 0
      ? (netSavings / data.total_income) * 100
      : 0;

  const prevNetSavings = data.prev_month_total_income - data.prev_month_total_expense;

  // Calculate percentage change: null means no previous data to compare
  const pctChange = (current: number, previous: number): number | null => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = pctChange(data.total_income, data.prev_month_total_income);
  const expenseChange = pctChange(data.total_expense, data.prev_month_total_expense);
  const savingsChange = pctChange(netSavings, prevNetSavings);

  const stats = [
    {
      icon: TrendingUp,
      label: "Income",
      value: formatNumberAsCurrency(data.total_income, sym),
      color: incomeColor,
      accent: incomeAccent,
      delay: 0,
      change: incomeChange,
      positiveIsGood: true,
    },
    {
      icon: TrendingDown,
      label: "Expenses",
      value: formatNumberAsCurrency(data.total_expense, sym),
      color: expenseColor,
      accent: expenseAccent,
      delay: 0.05,
      change: expenseChange,
      positiveIsGood: false,
    },
    {
      icon: Wallet,
      label: "Net Savings",
      value: `${isPositive ? "+" : ""}${formatNumberAsCurrency(netSavings, sym)}`,
      color: isPositive ? savingsPositiveColor : savingsNegativeColor,
      accent: isPositive ? savingsAccent : expenseAccent,
      delay: 0.1,
      change: savingsChange,
      positiveIsGood: true,
    },
  ];

  return (
    <Box>
      {/* Section label */}
      <HStack spacing={1.5} mb={3}>
        <Icon as={Calendar} boxSize={3.5} color={labelColor} />
        <Text
          fontSize="xs"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="wider"
          color={labelColor}
        >
          {monthLabel}
        </Text>
      </HStack>

      <SimpleGrid columns={2} spacing={2.5}>
        {stats.map(({ icon, label, value, color, accent, delay, change, positiveIsGood }) => {
          const isUp = change !== null && change > 0;
          const isDown = change !== null && change < 0;
          const isGood = positiveIsGood ? isUp : isDown;
          const isBad = positiveIsGood ? isDown : isUp;

          return (
            <MotionBox
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay }}
              bg={cardBg}
              px={3}
              py={2.5}
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
              position="relative"
              overflow="hidden"
              cursor="pointer"
              onClick={() => navigate("/insights?visualization=current-month-overview")}
              _hover={{ borderColor: accent, transition: "border-color 0.2s" }}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="2px"
                bg={accent}
                opacity={0.6}
              />
              <Flex align="center" gap={1} mb={1}>
                <Icon as={icon} boxSize={3} color={labelColor} />
                <Text
                  fontSize="2xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color={labelColor}
                >
                  {label}
                </Text>
              </Flex>
              <Flex align="baseline" justify="space-between" gap={1}>
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color={color}
                  lineHeight="short"
                  letterSpacing="-0.01em"
                >
                  {value}
                </Text>
                {change !== null && (
                  <HStack
                    spacing={0.5}
                    px={1}
                    py={0.5}
                    borderRadius="md"
                    bg={isGood ? changeBgGood : isBad ? changeBgBad : changeBgNeutral}
                    flexShrink={0}
                  >
                    <Icon
                      as={isUp ? ArrowUp : ArrowDown}
                      boxSize={2}
                      color={isGood ? changeGoodColor : isBad ? changeBadColor : changeNeutralColor}
                    />
                    <Text
                      fontSize="2xs"
                      fontWeight="600"
                      color={isGood ? changeGoodColor : isBad ? changeBadColor : changeNeutralColor}
                      lineHeight="1"
                    >
                      {Math.abs(change).toFixed(1)}%
                    </Text>
                  </HStack>
                )}
              </Flex>
            </MotionBox>
          );
        })}

        {/* Savings Rate Card */}
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          bg={cardBg}
          px={3}
          py={2.5}
          borderRadius="lg"
          border="1px solid"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
          cursor="pointer"
          onClick={() => navigate("/insights?visualization=current-month-overview")}
          _hover={{ borderColor: rateAccent, transition: "border-color 0.2s" }}
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="2px"
            bg={rateAccent}
            opacity={0.6}
          />
          <Flex align="center" gap={1} mb={1}>
            <Icon as={PiggyBank} boxSize={3} color={labelColor} />
            <Text
              fontSize="2xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color={labelColor}
            >
              Savings Rate
            </Text>
          </Flex>
          <HStack spacing={1.5} align="baseline">
            <Text
              fontSize="md"
              fontWeight="bold"
              color={rateColor}
              lineHeight="short"
            >
              {data.total_income > 0 ? `${savingsRate.toFixed(1)}%` : "—"}
            </Text>
            {data.total_income > 0 && (
              <Box
                px={1.5}
                py={0.5}
                borderRadius="md"
                bg={rateBg}
              >
                <Text fontSize="2xs" fontWeight="600" color={rateColor}>
                  {isPositive ? "saving" : "overspend"}
                </Text>
              </Box>
            )}
          </HStack>
        </MotionBox>
      </SimpleGrid>
    </Box>
  );
};

export default HomeMonthSnapshot;
