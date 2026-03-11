import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Select,
  useColorModeValue,
  Flex,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Center,
  HStack,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import {
  BarChart,
  Bar,
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
import { TrendingUp, TrendingDown, ChevronDown, BarChart2 } from "lucide-react";
import config from "@/config";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";

// Interfaces
interface Category {
  category_id: string;
  name: string;
  type: "income" | "expense";
  is_group: boolean;
}

interface CategoryAmount {
  amount: number;
  category_name: string;
}

interface TrendData {
  period: string;
  categories: CategoryAmount[];
}

interface SummaryData {
  total: number;
  highest: {
    period: string;
    amount: number;
  };
  average: number;
}

interface CategoryTrendData {
  category_name: string;
  category_type: "income" | "expense";
  is_group: boolean;
  trend_data: TrendData[];
  summary: SummaryData;
}

interface CategoryTrendProps {
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

// Generate unique colors for each subcategory
const generateColorPalette = (count: number) => {
  // Base colors for income and expense categories
  const baseColors = [
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
    "#4FD1C5", // pale teal
  ];

  // If we need more colors than we have in our base palette, we'll generate variations
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Generate additional colors by cycling through the base colors with varying opacity
  const extendedPalette = [...baseColors];
  let opacity = 0.9;
  while (extendedPalette.length < count) {
    baseColors.forEach((color) => {
      if (extendedPalette.length < count) {
        // Adjust the color's opacity
        const rgbMatch = color.match(
          /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
        );
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1], 16);
          const g = parseInt(rgbMatch[2], 16);
          const b = parseInt(rgbMatch[3], 16);
          extendedPalette.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
        }
      }
    });
    opacity -= 0.1;
    if (opacity < 0.5) opacity = 0.9; // Reset opacity if it gets too low
  }

  return extendedPalette.slice(0, count);
};

const CategoryTrend: React.FC<CategoryTrendProps> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [periodType, setPeriodType] = useState<string>("last_12_months");
  const { ledgerId, currencySymbol } = useLedgerStore();

  // Color modes
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const gridStroke = useColorModeValue("#e2e8f0", "#2d3748");
  const axisTickColor = useColorModeValue("#718096", "#cbd5e0");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${config.apiBaseUrl}/category/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      return response.json();
    },
    staleTime: 0, // Refetch on every mount to ensure freshness
  });

  // Fetch trend data
  const {
    data: trendData,
    isLoading: isTrendDataLoading,
    isError,
  } = useQuery<CategoryTrendData>({
    queryKey: ["categoryTrend", ledgerId, selectedCategory, periodType],
    queryFn: async () => {
      if (!ledgerId || !selectedCategory) return null;

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/ledger/${ledgerId}/insights/category-trend?category_id=${selectedCategory}&period_type=${periodType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch category trend data");
      }

      return response.json();
    },
    enabled: !!ledgerId && !!selectedCategory,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Define a function to organize and render categories
  const renderOrganizedCategories = () => {
    if (!categories || isCategoriesLoading) return null;

    // Separate categories by type
    const incomeCategories = categories.filter((cat) => cat.type === "income");
    const expenseCategories = categories.filter(
      (cat) => cat.type === "expense",
    );

    return (
      <>
        <optgroup label="Income Categories">
          {incomeCategories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.name} {category.is_group && "(Group)"}
            </option>
          ))}
        </optgroup>
        <optgroup label="Expense Categories">
          {expenseCategories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.name} {category.is_group && "(Group)"}
            </option>
          ))}
        </optgroup>
      </>
    );
  };

  // Determine if we should use bar chart or area chart based on number of data points
  const shouldUseBarChart = (trendData?.trend_data?.length || 0) <= 13;

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // Get unique subcategories for the selected category
  const getUniqueSubcategories = () => {
    if (!trendData?.trend_data) return [];

    const allSubcategories = new Set<string>();
    trendData.trend_data.forEach((item) => {
      item.categories.forEach((cat) => {
        allSubcategories.add(cat.category_name);
      });
    });

    return Array.from(allSubcategories);
  };

  const uniqueSubcategories = getUniqueSubcategories();
  const colorPalette = generateColorPalette(uniqueSubcategories.length);

  // Transform data for recharts
  const transformedData =
    trendData?.trend_data?.map((item) => {
      const result: any = { period: item.period };

      // Add each subcategory amount to the period data
      item.categories.forEach((cat) => {
        result[cat.category_name] = cat.amount;
      });

      return result;
    }) || [];

  

  // Render loading state
  if (isCategoriesLoading || (isTrendDataLoading && selectedCategory)) {
    return (
      <VStack spacing={4} align="stretch" bg={cardBg} p={6} borderRadius="lg">
        <Text color={secondaryTextColor}>Loading category data...</Text>
      </VStack>
    );
  }

  // Render error state
  if (isError) {
    return (
      <VStack spacing={4} align="center" bg={cardBg} p={6} borderRadius="lg">
        <Icon as={TrendingDown} color="red.500" boxSize={10} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load category trend data
        </Text>
      </VStack>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="lg" p={{ base: 4, md: 6 }} boxShadow="lg">
      {/* Header with Category and Period Selector */}
      <VStack spacing={4} align="stretch" mb={6}>
        <Flex
          justifyContent="space-between"
          alignItems="flex-start"
          flexDirection={{ base: "column", md: "row" }}
          gap={4}
        >
          <VStack align="flex-start" spacing={1} flex={1}>
            <Flex alignItems="center" gap={3}>
              <Icon as={TrendingUp} w={5} h={5} color={primaryTextColor} />
              <Heading as="h2" size="md" color={primaryTextColor}>
                Category Trend Analysis
              </Heading>
            </Flex>
            <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
              {periodOptions.find((opt) => opt.value === periodType)?.label}
            </Text>
          </VStack>

          <Flex
            direction={{ base: "column", md: "row" }}
            gap={4}
            width={{ base: "full", md: "auto" }}
          >
            <Box width={{ base: "full", md: "250px" }}>
              <FormControl>
                <FormLabel color={secondaryTextColor} fontSize="sm" mb={1}>
                  Select Category
                </FormLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  icon={<ChevronDown />}
                  variant="filled"
                  bg={cardBg}
                >
                  <option value="">Select a category</option>
                  {renderOrganizedCategories()}
                </Select>
              </FormControl>
            </Box>

            <Box width={{ base: "full", md: "250px" }}>
              <FormControl>
                <FormLabel color={secondaryTextColor} fontSize="sm" mb={1}>
                  Time Period
                </FormLabel>
                <Select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
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
              </FormControl>
            </Box>
          </Flex>
        </Flex>
      </VStack>

      {/* Chart Section */}
      <Box height={{ base: "300px", md: "400px" }} width="full">
        {transformedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {shouldUseBarChart ? (
              <BarChart
                data={transformedData}
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
                {!isMobile && (
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                )}
                {uniqueSubcategories.map((subcategory, index) => (
                  <Bar
                    key={subcategory}
                    dataKey={subcategory}
                    name={subcategory}
                    stackId="a"
                    fill={colorPalette[index]}
                  />
                ))}
              </BarChart>
            ) : (
              <AreaChart
                data={transformedData}
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
                {!isMobile && (
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                )}
                {uniqueSubcategories.map((subcategory, index) => (
                  <Area
                    key={subcategory}
                    type="monotone"
                    dataKey={subcategory}
                    name={subcategory}
                    stackId="1"
                    stroke={colorPalette[index]}
                    fill={colorPalette[index]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            )}
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
            <Icon as={BarChart2} boxSize={16} color={tertiaryTextColor} mb={4} />
            <Heading size="md" mb={2} color={secondaryTextColor}>
              No Category Data Available
            </Heading>
            <Text color={secondaryTextColor} fontSize="sm">
              {!selectedCategory
                ? "Please select a category to view trend data"
                : "Select a different time period or category to see financial trends"}
            </Text>
          </Center>
        )}
      </Box>

      {/* Summary Card */}
      {trendData?.summary && transformedData.length > 0 && (
        <VStack spacing={4} mt={6} width="full">
          <Box bg={cardBg} p={6} borderRadius="lg" width="full" boxShadow="md">
            <VStack align="stretch" spacing={4}>
              <HStack justifyContent="space-between">
                <Heading
                  size="md"
                  color={
                    trendData.category_type === "income"
                      ? "teal.500"
                      : "red.500"
                  }
                >
                  {trendData.category_name} Summary
                </Heading>
                <Icon
                  as={
                    trendData.category_type === "income"
                      ? TrendingUp
                      : TrendingDown
                  }
                  color={
                    trendData.category_type === "income"
                      ? "teal.500"
                      : "red.500"
                  }
                  boxSize={6}
                />
              </HStack>

              <HStack
                spacing={6}
                justifyContent="space-between"
                flexDirection={{ base: "column", md: "row" }}
                align={{ base: "flex-start", md: "center" }}
              >
                <Stat>
                  <StatLabel color={secondaryTextColor}>
                    Total{" "}
                    {trendData.category_type === "income"
                      ? "Income"
                      : "Expense"}
                  </StatLabel>
                  <StatNumber color={primaryTextColor}>
                    {formatNumberAsCurrency(
                      trendData.summary.total,
                      currencySymbol as string,
                    )}
                  </StatNumber>
                  <StatHelpText>
                    <Badge
                      colorScheme={
                        trendData.category_type === "income" ? "teal" : "red"
                      }
                      variant="subtle"
                    >
                      Avg:{" "}
                      {formatNumberAsCurrency(
                        trendData.summary.average,
                        currencySymbol as string,
                      )}
                    </Badge>
                  </StatHelpText>
                </Stat>

                <Box>
                  <Text fontWeight="medium" color={primaryTextColor}>
                    Subcategories: {uniqueSubcategories.length}
                  </Text>
                  <Text fontSize="sm" color={secondaryTextColor} mt={1}>
                    Highest:{" "}
                    {formatNumberAsCurrency(
                      trendData.summary.highest.amount,
                      currencySymbol as string,
                    )}{" "}
                    in {formatPeriod(trendData.summary.highest.period)}
                  </Text>
                </Box>

                {trendData.is_group && (
                  <Box>
                    <Text fontWeight="medium" color={primaryTextColor}>
                      Breakdown
                    </Text>
                    <HStack mt={1} wrap="wrap" spacing={2}>
                      {uniqueSubcategories.slice(0, 3).map((subcat, index) => (
                        <Badge
                          key={subcat}
                          variant="subtle"
                          colorScheme={index % 2 === 0 ? "blue" : "cyan"}
                        >
                          {subcat}
                        </Badge>
                      ))}
                      {uniqueSubcategories.length > 3 && (
                        <Badge variant="subtle" colorScheme="gray">
                          +{uniqueSubcategories.length - 3} more
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                )}
              </HStack>
            </VStack>
          </Box>
        </VStack>
      )}
    </Box>
  );
};

export default React.memo(CategoryTrend);
