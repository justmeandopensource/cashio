import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  Icon,
  Center,
  Stat,
  StatLabel,
  StatNumber,
  Select,
  FormControl,
} from "@chakra-ui/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Store, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import config from "@/config";

// Color palette for pie chart segments
const STORE_COLORS = [
  "#3182CE", // blue
  "#38B2AC", // teal
  "#4299E1", // light blue
  "#0BC5EA", // cyan
  "#319795", // dark teal
  "#2B6CB0", // dark blue
  "#00B5D8", // bright cyan
  "#2C7A7B", // medium teal
  "#63B3ED", // pale blue
  "#76E4F7", // pale cyan
];

interface StoreExpenseData {
  store: string;
  amount: number;
  percentage: number;
}

interface ExpenseByStoreResponse {
  store_data: StoreExpenseData[];
  total_expense: number;
  period_type: "all_time" | "last_12_months" | "this_month";
}

interface ExpenseByStoreProps {
  ledgerId?: string;
}

const periodOptions = [
  { value: "all_time", label: "All Time" },
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "this_month", label: "This Month" },
];

const ExpenseByStore: React.FC<ExpenseByStoreProps> = ({ ledgerId }) => {
  const [periodType, setPeriodType] = useState<string>("all_time");
  const [hoveredItem, setHoveredItem] = useState<StoreExpenseData | null>(null);
  const { currencySymbol } = useLedgerStore();

  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const legendHoverBg = useColorModeValue("gray.100", "gray.600");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

  // Fetch expense by store data
  const { data, isLoading, isError } = useQuery<ExpenseByStoreResponse>({
    queryKey: ["expenseByStore", ledgerId, periodType],
    queryFn: async () => {
      if (!ledgerId) return null;

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/ledger/${ledgerId}/insights/expense-by-store?period_type=${periodType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch expense by store data");
      }

      return response.json();
    },
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const totalExpense = data?.total_expense || 0;

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" bg={cardBg} p={6} borderRadius="lg">
        <Text color={secondaryTextColor}>Loading expense by store data...</Text>
      </VStack>
    );
  }

  if (isError) {
    return (
      <VStack spacing={4} align="center" bg={cardBg} p={6} borderRadius="lg">
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load expense by store data
        </Text>
      </VStack>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="lg" p={{ base: 4, md: 6 }} boxShadow="lg">
      <VStack spacing={4} align="stretch" mb={6}>
        <Flex justifyContent="space-between" alignItems="center" direction={{ base: "column", md: "row" }} gap={4}>
          <VStack align="start" spacing={1} flex={1}>
            <Flex alignItems="center" gap={3}>
              <Icon as={Store} w={5} h={5} color={primaryTextColor} />
              <Heading as="h2" size="md" color={primaryTextColor}>
                Expense by Store
              </Heading>
            </Flex>
            <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
              Top 10 stores by spending • {periodOptions.find((opt) => opt.value === periodType)?.label}
            </Text>
          </VStack>
          <FormControl maxW={{ base: "full", md: "200px" }}>
            <Select value={periodType} onChange={(e) => setPeriodType(e.target.value)} size="sm" bg={cardBg}>
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </Flex>
      </VStack>

      <Box height={{ base: "400px", md: "500px" }} width="full" mb={8}>
        {data?.store_data && data.store_data.length > 0 ? (
          <Flex height="100%" direction={{ base: "column", md: "row" }}>
            <Box position="relative" flex={2}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.store_data}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="amount"
                    labelLine={false}
                    label={false}
                    onMouseEnter={setHoveredItem}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {data.store_data.map((entry, idx) => (
                      <Cell
                        key={`store-${idx}`}
                        fill={STORE_COLORS[idx % STORE_COLORS.length]}
                        opacity={!hoveredItem || hoveredItem.store === entry.store ? 1 : 0.3}
                        stroke={hoveredItem?.store === entry.store ? "#000" : "none"}
                        strokeWidth={hoveredItem?.store === entry.store ? 2 : 0}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Center position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none">
                <VStack spacing={0}>
                  {hoveredItem && (
                    <>
                      <Text fontWeight="bold" fontSize="lg" color={primaryTextColor} textAlign="center">
                        {hoveredItem.store}
                      </Text>
                      <Text fontSize="md" color={primaryTextColor} mt={2}>
                        {formatNumberAsCurrency(hoveredItem.amount, currencySymbol as string)}
                      </Text>
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {hoveredItem.percentage.toFixed(1)}% of total
                      </Text>
                    </>
                  )}
                </VStack>
              </Center>
            </Box>
            <Box flex={1} pl={{ base: 0, md: 4 }} pt={{ base: 4, md: 0 }} overflowY="auto" maxH="400px">
              <Text fontSize="sm" fontWeight="bold" color={primaryTextColor} mb={3}>Store Breakdown</Text>
              <VStack spacing={2} align="stretch">
                {data.store_data.map((store, idx) => (
                  <Box
                    key={store.store}
                    p={2}
                    bg={hoveredItem && hoveredItem.store === store.store ? legendHoverBg : cardBg}
                    borderRadius="md"
                    onMouseEnter={() => setHoveredItem(store)}
                    onMouseLeave={() => setHoveredItem(null)}
                    transition="background-color 0.2s ease-in-out"
                    cursor="pointer"
                  >
                    <Flex align="center">
                      <Box w={3} h={3} bg={STORE_COLORS[idx % STORE_COLORS.length]} borderRadius="full" mr={2} flexShrink={0} />
                      <Box flex={1}>
                        <Text fontSize="xs" fontWeight="medium" color={primaryTextColor} isTruncated>{store.store}</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          {store.percentage.toFixed(1)}%
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
          </Flex>
        ) : (
          <Center height="full" bg={bgColor} borderRadius="lg" flexDirection="column" textAlign="center" p={6}>
            <Icon as={PieChartIcon} boxSize={6} color={tertiaryTextColor} mb={4} />
            <Heading size="md" mb={2} color={secondaryTextColor}>
              No Store Data Available
            </Heading>
            <Text color={secondaryTextColor} fontSize="sm">
              No expense transactions with store information found for the selected period.
            </Text>
          </Center>
        )}
      </Box>

      {data?.store_data && data.store_data.length > 0 && (
        <VStack spacing={4} mt={6} width="full">
          <HStack spacing={4} width="full" flexDirection={{ base: "column", md: "row" }}>
            <Box bg={cardBg} p={6} borderRadius="lg" width="full" boxShadow="md">
              <Stat>
                <StatLabel color={secondaryTextColor}>Total Expense</StatLabel>
                <StatNumber color={primaryTextColor}>
                  {formatNumberAsCurrency(totalExpense, currencySymbol as string)}
                </StatNumber>
              </Stat>
            </Box>
            <Box bg={cardBg} p={6} borderRadius="lg" width="full" boxShadow="md">
              <Stat>
                <StatLabel color={secondaryTextColor}>Stores Tracked</StatLabel>
                <StatNumber color={primaryTextColor}>{data.store_data.length}</StatNumber>
              </Stat>
            </Box>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default React.memo(ExpenseByStore);