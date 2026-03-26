import React, { useState, useMemo } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Select,
  useColorModeValue,
  useBreakpointValue,
  Flex,
  Icon,
  Center,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ResponsiveLine } from "@nivo/line";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import api from "@/lib/api";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import {
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
} from "../../../mutual-funds/utils";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

const INCOME_COLOR = "#38B2AC";
const EXPENSE_COLOR = "#E53E3E";

// Interfaces
interface TrendData {
  period: string;
  income: number;
  expense: number;
}

interface SummaryData {
  income: {
    total: number;
    highest: { period: string; amount: number };
    average: number;
  };
  expense: {
    total: number;
    highest: { period: string; amount: number };
    average: number;
  };
}

interface InsightsData {
  trend_data: TrendData[];
  summary: SummaryData;
}

interface IncomeExpenseTrendProps {
  ledgerId?: string;
}

const periodOptions = [
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "monthly_since_beginning", label: "Monthly Overview" },
  { value: "yearly_since_beginning", label: "Yearly Snapshot" },
];

const formatPeriod = (period: string) => {
  if (period.includes("-")) {
    const [year, month] = period.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return period;
};

const IncomeExpenseTrend: React.FC<IncomeExpenseTrendProps> = ({
  ledgerId,
}) => {
  const [periodType, setPeriodType] = useState<string>("last_12_months");
  const { currencySymbol } = useLedgerStore();

  // Color modes
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const tertiaryTextColor = useColorModeValue("gray.500", "gray.400");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const expenseValueColor = useColorModeValue("red.500", "red.400");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const selectBg = useColorModeValue("gray.50", "gray.700");

  // Nivo theme colors
  const textColor = useColorModeValue("#4A5568", "#A0AEC0");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tooltipBg = useColorModeValue("#FFFFFF", "#1A202C");
  const tooltipBorder = useColorModeValue("#E2E8F0", "#4A5568");

  // Summary card accent colors
  const incomeAccentColor = useColorModeValue("teal.400", "teal.300");
  const expenseAccentColor = useColorModeValue("red.400", "red.300");
  const savingsAccentColor = useColorModeValue("blue.400", "blue.300");
  const ratioAccentColor = useColorModeValue("purple.400", "purple.300");

  const sym = currencySymbol || "₹";
  const maxTicks = useBreakpointValue({ base: 5, md: 10 }) || 5;

  // Fetch data
  const { data, isLoading, isError } = useQuery<InsightsData>({
    queryKey: ["insights", ledgerId, periodType],
    queryFn: async () => {
      if (!ledgerId) return null;
      const response = await api.get(
        `/ledger/${ledgerId}/insights/income-expense-trend?period_type=${periodType}`,
      );
      return response.data;
    },
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Nivo line data
  const lineData = useMemo(() => {
    if (!data?.trend_data?.length) return [];
    return [
      {
        id: "Income",
        data: data.trend_data.map(d => ({ x: d.period, y: d.income })),
      },
      {
        id: "Expense",
        data: data.trend_data.map(d => ({ x: d.period, y: d.expense })),
      },
    ];
  }, [data]);

  // Tick values for x-axis
  const tickValues = useMemo(() => {
    if (!data?.trend_data?.length) return undefined;
    const xValues = data.trend_data.map(d => d.period);
    if (xValues.length <= maxTicks) return undefined;
    const step = Math.ceil(xValues.length / maxTicks);
    const ticks = xValues.filter((_, i) => i % step === 0);
    if (ticks[ticks.length - 1] !== xValues[xValues.length - 1]) {
      ticks.push(xValues[xValues.length - 1]);
    }
    return ticks;
  }, [data, maxTicks]);

  // Aggregates
  const netSavings = data?.summary
    ? data.summary.income.total - data.summary.expense.total
    : 0;
  const savingsRate = data?.summary && data.summary.income.total > 0
    ? (netSavings / data.summary.income.total) * 100
    : 0;
  const isSavingsPositive = netSavings >= 0;

  if (isLoading) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor}>
        <Text color={secondaryTextColor}>Loading financial insights...</Text>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor} textAlign="center">
        <Icon as={TrendingDown} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">Unable to load financial insights</Text>
      </Box>
    );
  }

  const summaryCards = [
    {
      icon: TrendingUp,
      label: "Income",
      accentColor: incomeAccentColor,
      renderValue: () => (
        <VStack spacing={0} align="flex-start">
          <HStack spacing={0} align="baseline">
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={positiveColor} lineHeight="short" letterSpacing="-0.01em">
              {splitCurrencyForDisplay(data?.summary?.income.total ?? 0, sym).main}
            </Text>
            <Text fontSize="xs" color={positiveColor} opacity={0.6}>
              {splitCurrencyForDisplay(data?.summary?.income.total ?? 0, sym).decimals}
            </Text>
          </HStack>
          <Text fontSize="xs" color={tertiaryTextColor}>
            Avg: {formatNumberAsCurrency(data?.summary?.income.average ?? 0, sym)}
          </Text>
          {data?.summary?.income.highest && (
            <Text fontSize="xs" color={tertiaryTextColor}>
              Peak: {formatNumberAsCurrency(data.summary.income.highest.amount, sym)} in {formatPeriod(data.summary.income.highest.period)}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      icon: TrendingDown,
      label: "Expenses",
      accentColor: expenseAccentColor,
      renderValue: () => (
        <VStack spacing={0} align="flex-start">
          <HStack spacing={0} align="baseline">
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={expenseValueColor} lineHeight="short" letterSpacing="-0.01em">
              {splitCurrencyForDisplay(data?.summary?.expense.total ?? 0, sym).main}
            </Text>
            <Text fontSize="xs" color={expenseValueColor} opacity={0.6}>
              {splitCurrencyForDisplay(data?.summary?.expense.total ?? 0, sym).decimals}
            </Text>
          </HStack>
          <Text fontSize="xs" color={tertiaryTextColor}>
            Avg: {formatNumberAsCurrency(data?.summary?.expense.average ?? 0, sym)}
          </Text>
          {data?.summary?.expense.highest && (
            <Text fontSize="xs" color={tertiaryTextColor}>
              Peak: {formatNumberAsCurrency(data.summary.expense.highest.amount, sym)} in {formatPeriod(data.summary.expense.highest.period)}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      icon: Activity,
      label: "Net Savings",
      accentColor: savingsAccentColor,
      renderValue: () => {
        const color = isSavingsPositive ? positiveColor : expenseValueColor;
        return (
          <VStack spacing={0} align="flex-start">
            <HStack spacing={0} align="baseline">
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={color} lineHeight="short" letterSpacing="-0.01em">
                {isSavingsPositive ? "+" : "-"}{splitCurrencyForDisplay(Math.abs(netSavings), sym).main}
              </Text>
              <Text fontSize="xs" color={color} opacity={0.6}>
                {splitCurrencyForDisplay(Math.abs(netSavings), sym).decimals}
              </Text>
            </HStack>
          </VStack>
        );
      },
    },
    {
      icon: isSavingsPositive ? ArrowUpRight : ArrowDownRight,
      label: "Savings Rate",
      accentColor: ratioAccentColor,
      renderValue: () => {
        const color = isSavingsPositive ? positiveColor : expenseValueColor;
        const pctDisplay = splitPercentageForDisplay(savingsRate);
        return (
          <HStack spacing={0} align="baseline">
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={color} lineHeight="short" letterSpacing="-0.01em">
              {isSavingsPositive ? "+" : "-"}{pctDisplay.main}
            </Text>
            <Text fontSize="xs" color={color} opacity={0.6}>
              {pctDisplay.decimals}
            </Text>
          </HStack>
        );
      },
    },
  ];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Box borderRadius="xl" p={{ base: 0, md: 0 }}>
        {/* Header */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          flexDirection={{ base: "column", md: "row" }}
          gap={{ base: 3, md: 0 }}
          mb={{ base: 4, md: 5 }}
        >
          <Flex align="center" gap={2}>
            <Icon as={LineChart} boxSize={4} color={iconColor} />
            <Heading as="h2" size="md" color={primaryTextColor} letterSpacing="-0.02em">
              Income vs Expense Trend
            </Heading>
          </Flex>

          <Select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            maxW={{ base: "full", md: "220px" }}
            icon={<ChevronDown />}
            variant="filled"
            bg={selectBg}
            size="sm"
            borderRadius="lg"
            fontWeight="medium"
            fontSize="sm"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Flex>

        {/* Summary Cards */}
        {data?.summary && data.trend_data && data.trend_data.length > 0 && (
          <MotionSimpleGrid
            columns={{ base: 2, sm: 4 }}
            spacing={{ base: 3, md: 4 }}
            mb={{ base: 4, md: 5 }}
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {summaryCards.map(({ icon, label, accentColor, renderValue }) => (
              <MotionBox
                key={label}
                h="full"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
                }}
              >
                <Box
                  bg={cardBg} p={{ base: 3, md: 4 }} borderRadius="xl"
                  border="1px solid" borderColor={sectionBorderColor}
                  overflow="hidden" position="relative"
                  transition="border-color 0.2s ease"
                  _hover={{ borderColor: accentColor }}
                  h="full"
                >
                  <Box position="absolute" top={0} left={0} right={0} h="2px" bg={accentColor} opacity={0.7} />
                  <Flex align="center" gap={1.5} mb={2}>
                    <Flex w={5} h={5} borderRadius="md" bg={accentColor} opacity={0.12} position="absolute" />
                    <Flex w={5} h={5} borderRadius="md" align="center" justify="center">
                      <Icon as={icon} boxSize={3} color={accentColor} />
                    </Flex>
                    <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor}>
                      {label}
                    </Text>
                  </Flex>
                  {renderValue()}
                </Box>
              </MotionBox>
            ))}
          </MotionSimpleGrid>
        )}

        {/* Chart Section */}
        <Box width="full">
          {lineData.length > 0 ? (
            <>
              <Box height={{ base: "300px", md: "380px" }}>
              <ResponsiveLine
                data={lineData}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{ type: "point" }}
                yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
                curve="monotoneX"
                colors={[INCOME_COLOR, EXPENSE_COLOR]}
                lineWidth={2}
                enablePoints={data?.trend_data ? data.trend_data.length <= 20 : true}
                pointSize={6}
                pointColor={{ theme: "background" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                enableArea={true}
                areaOpacity={0.12}
                useMesh={true}
                enableCrosshair={true}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: (data?.trend_data?.length ?? 0) > 8 ? -45 : 0,
                  format: formatPeriod,
                  tickValues,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  format: (v) => {
                    const abs = Math.abs(Number(v));
                    if (abs >= 100000) return `${sym}${(abs / 100000).toFixed(1)}L`;
                    if (abs >= 1000) return `${sym}${(abs / 1000).toFixed(1)}K`;
                    if (abs === 0) return "";
                    return `${sym}${v}`;
                  },
                }}
                tooltip={({ point }) => {
                  const isIncome = point.seriesId === "Income";
                  const color = isIncome ? INCOME_COLOR : EXPENSE_COLOR;
                  return (
                    <Box
                      bg={tooltipBg}
                      border="1px solid"
                      borderColor={tooltipBorder}
                      borderRadius="md"
                      px={3}
                      py={2}
                      boxShadow="lg"
                      fontSize="xs"
                      minW="160px"
                      whiteSpace="nowrap"
                    >
                      <Text fontWeight="bold" color={textColor} mb={0.5}>
                        {formatPeriod(point.data.xFormatted as string)}
                      </Text>
                      <Flex align="center" gap={2}>
                        <Box w={2} h={2} borderRadius="full" bg={color} flexShrink={0} />
                        <Flex justify="space-between" flex={1} gap={3}>
                          <Text color={textColor} opacity={0.7}>{point.seriesId}</Text>
                          <Text fontWeight="600" color={color}>
                            {splitCurrencyForDisplay(Number(point.data.y), sym).main}
                            {splitCurrencyForDisplay(Number(point.data.y), sym).decimals}
                          </Text>
                        </Flex>
                      </Flex>
                    </Box>
                  );
                }}
                theme={{
                  axis: {
                    ticks: { text: { fill: textColor, fontSize: 11 } },
                  },
                  grid: { line: { stroke: gridColor, strokeWidth: 1 } },
                  crosshair: { line: { stroke: textColor, strokeWidth: 1, strokeOpacity: 0.35 } },
                }}
              />
              </Box>
              {/* Legend */}
              <Flex gap={4} justify="center" mt={3} wrap="wrap">
                <Flex align="center" gap={1.5}>
                  <Box w={3} h={0.5} borderRadius="full" bg={INCOME_COLOR} />
                  <Text fontSize="xs" color={textColor}>Income</Text>
                </Flex>
                <Flex align="center" gap={1.5}>
                  <Box w={3} h={0.5} borderRadius="full" bg={EXPENSE_COLOR} />
                  <Text fontSize="xs" color={textColor}>Expense</Text>
                </Flex>
              </Flex>
            </>
          ) : (
            <Center height={{ base: "300px", md: "380px" }} bg={cardBg} borderRadius="lg" flexDirection="column" textAlign="center" p={6}>
              <Icon as={BarChart2} boxSize={6} color={tertiaryTextColor} mb={4} />
              <Heading size="md" mb={2} color={secondaryTextColor}>No Financial Data Available</Heading>
              <Text color={secondaryTextColor} fontSize="sm">
                Select a different time period or add some transactions to see your income and expense trends.
              </Text>
            </Center>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(IncomeExpenseTrend);
