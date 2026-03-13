import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Select,
  useColorModeValue,
  Flex,
  Icon,
  Center,
} from "@chakra-ui/react";
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
import { LineChart, TrendingUp, TrendingDown, ChevronDown, BarChart2 } from "lucide-react";
import config from "@/config";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";

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

  // Color modes
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const gridStroke = useColorModeValue("#e2e8f0", "#2d3748");
  const axisTickColor = useColorModeValue("#718096", "#cbd5e0");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const sectionBorderColor = useColorModeValue("gray.200", "gray.700");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const expenseValueColor = useColorModeValue("red.500", "red.400");
  const incomeTopAccent = useColorModeValue("green.400", "green.400");
  const expenseTopAccent = useColorModeValue("red.400", "red.400");

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

  // Render loading or error states
  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" bg={cardBg} p={6} borderRadius="lg">
        <Text color={secondaryTextColor}>Loading financial insights...</Text>
      </VStack>
    );
  }

  if (isError) {
    return (
      <VStack spacing={4} align="center" bg={cardBg} p={6} borderRadius="lg">
        <Icon as={TrendingDown} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load financial insights
        </Text>
      </VStack>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="lg" p={{ base: 4, md: 6 }} boxShadow="lg">
      {/* Header with Period Selector */}
      <VStack spacing={4} align="stretch" mb={6}>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          flexDirection={{ base: "column", md: "row" }}
          gap={4}
        >
          <VStack align="flex-start" spacing={1} flex={1}>
            <Flex alignItems="center" gap={3}>
              <Icon as={LineChart} w={5} h={5} color={primaryTextColor} />
              <Heading as="h2" size="md" color={primaryTextColor}>
                Income vs Expense Trend
              </Heading>
            </Flex>
            <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
              {periodOptions.find((opt) => opt.value === periodType)?.label}
            </Text>
          </VStack>

          <Select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            maxW={{ base: "full", md: "250px" }}
            icon={<ChevronDown />}
            variant="filled"
            bg={cardBg}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Flex>
      </VStack>

      {/* Chart Section */}
      <Box height={{ base: "300px", md: "400px" }} width="full">
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
            bg={bgColor}
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

      {/* Summary Cards */}
      {data?.summary && data.trend_data && data.trend_data.length > 0 && (
        <HStack
          spacing={{ base: 3, md: 4 }}
          mt={6}
          width="full"
          flexDirection={{ base: "column", md: "row" }}
        >
          {/* Income Summary */}
          <Box
            bg={cardBg}
            p={{ base: 3, md: 4 }}
            borderRadius="md"
            boxShadow="sm"
            border="1px solid"
            borderColor={sectionBorderColor}
            borderTopWidth="3px"
            borderTopColor={incomeTopAccent}
            width="full"
          >
            <Flex align="center" gap={1.5} mb={1}>
              <Icon as={TrendingUp} boxSize={3} color={columnHeaderColor} />
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={columnHeaderColor}
              >
                Income
              </Text>
            </Flex>
            <Text
              fontSize={{ base: "md", md: "xl" }}
              fontWeight="bold"
              color={positiveColor}
              lineHeight="short"
              mb={2}
            >
              {formatNumberAsCurrency(data.summary.income.total, currencySymbol as string)}
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Avg: {formatNumberAsCurrency(data.summary.income.average, currencySymbol as string)}
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Highest: {formatNumberAsCurrency(data.summary.income.highest.amount, currencySymbol as string)}{" "}
              in {formatPeriod(data.summary.income.highest.period)}
            </Text>
          </Box>

          {/* Expense Summary */}
          <Box
            bg={cardBg}
            p={{ base: 3, md: 4 }}
            borderRadius="md"
            boxShadow="sm"
            border="1px solid"
            borderColor={sectionBorderColor}
            borderTopWidth="3px"
            borderTopColor={expenseTopAccent}
            width="full"
          >
            <Flex align="center" gap={1.5} mb={1}>
              <Icon as={TrendingDown} boxSize={3} color={columnHeaderColor} />
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={columnHeaderColor}
              >
                Expenses
              </Text>
            </Flex>
            <Text
              fontSize={{ base: "md", md: "xl" }}
              fontWeight="bold"
              color={expenseValueColor}
              lineHeight="short"
              mb={2}
            >
              {formatNumberAsCurrency(data.summary.expense.total, currencySymbol as string)}
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Avg: {formatNumberAsCurrency(data.summary.expense.average, currencySymbol as string)}
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Highest: {formatNumberAsCurrency(data.summary.expense.highest.amount, currencySymbol as string)}{" "}
              in {formatPeriod(data.summary.expense.highest.period)}
            </Text>
          </Box>
        </HStack>
      )}
    </Box>
  );
};

export default React.memo(IncomeExpenseTrend);
