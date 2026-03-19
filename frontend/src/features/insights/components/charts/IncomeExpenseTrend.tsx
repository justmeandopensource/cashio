import React, { useState } from "react";
import {
  Box,
  HStack,
  Heading,
  Text,
  Select,
  useColorModeValue,
  Flex,
  Icon,
  Center,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
import config from "@/config";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

// Interfaces
interface TrendData {
  period: string;
  income: number;
  expense: number;
}

interface SummaryData {
  income: {
    total: number;
    highest: {
      period: string;
      amount: number;
    };
    average: number;
  };
  expense: {
    total: number;
    highest: {
      period: string;
      amount: number;
    };
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

// Period options
const periodOptions = [
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "monthly_since_beginning", label: "Monthly Overview" },
  { value: "yearly_since_beginning", label: "Yearly Snapshot" },
];

// Utility functions
const formatPeriod = (period: string) => {
  if (period.includes("-")) {
    const [year, month] = period.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      "en-US",
      {
        month: "short",
        year: "numeric",
      },
    );
  }
  return period;
};

const IncomeExpenseTrend: React.FC<IncomeExpenseTrendProps> = ({
  ledgerId,
}) => {
  const [periodType, setPeriodType] = useState<string>("last_12_months");
  const { currencySymbol } = useLedgerStore();

  // Color modes — aligned with LedgerMainAccounts patterns
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const tertiaryTextColor = useColorModeValue("gray.500", "gray.400");
  const gridStroke = useColorModeValue("#e2e8f0", "#2d3748");
  const axisTickColor = useColorModeValue("#718096", "#cbd5e0");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const expenseValueColor = useColorModeValue("red.500", "red.400");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const selectBg = useColorModeValue("gray.50", "gray.700");

  // Summary card accent colors
  const incomeAccentColor = useColorModeValue("teal.400", "teal.300");
  const expenseAccentColor = useColorModeValue("red.400", "red.300");
  const savingsAccentColor = useColorModeValue("blue.400", "blue.300");

  // Fetch data
  const { data, isLoading, isError } = useQuery<InsightsData>({
    queryKey: ["insights", ledgerId, periodType],
    queryFn: async () => {
      if (!ledgerId) return null;

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/ledger/${ledgerId}/insights/income-expense-trend?period_type=${periodType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch insights data");
      }

      return response.json();
    },
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Compute net savings
  const netSavings = data?.summary
    ? data.summary.income.total - data.summary.expense.total
    : 0;

  // Render loading state
  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
      >
        <Text color={secondaryTextColor}>Loading financial insights...</Text>
      </Box>
    );
  }

  // Render error state
  if (isError) {
    return (
      <Box
        bg={cardBg}
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
        textAlign="center"
      >
        <Icon as={TrendingDown} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load financial insights
        </Text>
      </Box>
    );
  }

  const summaryCards = [
    {
      icon: TrendingUp,
      label: "Income",
      value: data?.summary?.income.total ?? 0,
      accentColor: incomeAccentColor,
      valueColor: positiveColor,
      avg: data?.summary?.income.average ?? 0,
      highest: data?.summary?.income.highest,
      subIcon: ArrowUpRight,
    },
    {
      icon: TrendingDown,
      label: "Expenses",
      value: data?.summary?.expense.total ?? 0,
      accentColor: expenseAccentColor,
      valueColor: expenseValueColor,
      avg: data?.summary?.expense.average ?? 0,
      highest: data?.summary?.expense.highest,
      subIcon: ArrowDownRight,
    },
    {
      icon: Activity,
      label: "Net Savings",
      value: netSavings,
      accentColor: savingsAccentColor,
      valueColor: netSavings >= 0 ? positiveColor : expenseValueColor,
      avg: null,
      highest: null,
      subIcon: netSavings >= 0 ? ArrowUpRight : ArrowDownRight,
    },
  ];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Box
        borderRadius="xl"
        p={{ base: 0, md: 0 }}
      >
        {/* Header with Period Selector */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          flexDirection={{ base: "column", md: "row" }}
          gap={{ base: 3, md: 0 }}
          mb={{ base: 4, md: 5 }}
        >
          <Flex align="center" gap={2}>
            <Icon as={LineChart} boxSize={4} color={iconColor} />
            <Heading
              as="h2"
              size="md"
              color={primaryTextColor}
              letterSpacing="-0.02em"
            >
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
            columns={{ base: 1, sm: 3 }}
            spacing={{ base: 3, md: 4 }}
            mb={{ base: 4, md: 5 }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {summaryCards.map(
              ({ icon, label, value, accentColor, valueColor, avg, highest }) => (
                <MotionBox
                  key={label}
                  h="full"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.35, ease: "easeOut" },
                    },
                  }}
                >
                  <Box
                    bg={cardBg}
                    p={{ base: 3, md: 4 }}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={sectionBorderColor}
                    overflow="hidden"
                    position="relative"
                    transition="border-color 0.2s ease"
                    _hover={{ borderColor: accentColor }}
                    h="full"
                  >
                    {/* Accent line at top */}
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      h="2px"
                      bg={accentColor}
                      opacity={0.7}
                    />

                    <Flex align="center" gap={1.5} mb={2}>
                      <Flex
                        w={5}
                        h={5}
                        borderRadius="md"
                        bg={accentColor}
                        opacity={0.12}
                        position="absolute"
                      />
                      <Flex
                        w={5}
                        h={5}
                        borderRadius="md"
                        align="center"
                        justify="center"
                      >
                        <Icon as={icon} boxSize={3} color={accentColor} />
                      </Flex>
                      <Text
                        fontSize="2xs"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        color={columnHeaderColor}
                      >
                        {label}
                      </Text>
                    </Flex>

                    <HStack spacing={0} align="baseline" mb={highest || avg != null ? 2 : 0}>
                      <Text
                        fontSize={{ base: "lg", md: "xl" }}
                        fontWeight="bold"
                        color={valueColor}
                        lineHeight="short"
                        letterSpacing="-0.01em"
                      >
                        {
                          splitCurrencyForDisplay(
                            value,
                            currencySymbol || "₹",
                          ).main
                        }
                      </Text>
                      <Text
                        fontSize="xs"
                        color={valueColor}
                        opacity={0.6}
                      >
                        {
                          splitCurrencyForDisplay(
                            value,
                            currencySymbol || "₹",
                          ).decimals
                        }
                      </Text>
                    </HStack>

                    {avg != null && (
                      <Text fontSize="xs" color={tertiaryTextColor}>
                        Avg:{" "}
                        {formatNumberAsCurrency(
                          avg,
                          currencySymbol as string,
                        )}
                      </Text>
                    )}
                    {highest && (
                      <Text fontSize="xs" color={tertiaryTextColor}>
                        Peak:{" "}
                        {formatNumberAsCurrency(
                          highest.amount,
                          currencySymbol as string,
                        )}{" "}
                        in {formatPeriod(highest.period)}
                      </Text>
                    )}
                  </Box>
                </MotionBox>
              ),
            )}
          </MotionSimpleGrid>
        )}

        {/* Chart Section */}
        <Box
          height={{ base: "280px", md: "380px" }}
          width="full"
          mt={data?.summary && data.trend_data?.length > 0 ? 0 : 0}
        >
          {data?.trend_data && data.trend_data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.trend_data}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatPeriod}
                  tick={{
                    fontSize: "0.7rem",
                    fill: axisTickColor,
                  }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    value === 0
                      ? ""
                      : formatNumberAsCurrency(
                          value,
                          currencySymbol as string,
                        ).replace("£", "")
                  }
                  tick={{
                    fontSize: "0.7rem",
                    fill: axisTickColor,
                  }}
                />
                <Tooltip
                  formatter={(value) =>
                    formatNumberAsCurrency(
                      Number(value),
                      currencySymbol as string,
                    )
                  }
                  labelFormatter={formatPeriod}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderRadius: "10px",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#38B2AC"
                  fill="#38B2AC"
                  fillOpacity={0.3}
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#E53E3E"
                  fill="#E53E3E"
                  fillOpacity={0.3}
                  name="Expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Center
              height="full"
              bg={cardBg}
              borderRadius="lg"
              flexDirection="column"
              textAlign="center"
              p={6}
            >
              <Icon as={BarChart2} boxSize={6} color={tertiaryTextColor} mb={4} />
              <Heading size="md" mb={2} color={secondaryTextColor}>
                No Financial Data Available
              </Heading>
              <Text color={secondaryTextColor} fontSize="sm">
                Select a different time period or add some transactions to see
                your income and expense trends.
              </Text>
            </Center>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(IncomeExpenseTrend);
