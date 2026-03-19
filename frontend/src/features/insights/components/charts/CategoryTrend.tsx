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
  Badge,
  Center,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
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
import { TrendingUp, TrendingDown, ChevronDown, BarChart2, Layers } from "lucide-react";
import config from "@/config";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";

const MotionBox = motion(Box);

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
  const baseColors = [
    "#3182CE",
    "#38B2AC",
    "#4299E1",
    "#0BC5EA",
    "#319795",
    "#2B6CB0",
    "#00B5D8",
    "#2C7A7B",
    "#63B3ED",
    "#76E4F7",
    "#4FD1C5",
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  const extendedPalette = [...baseColors];
  let opacity = 0.9;
  while (extendedPalette.length < count) {
    baseColors.forEach((color) => {
      if (extendedPalette.length < count) {
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
    if (opacity < 0.5) opacity = 0.9;
  }

  return extendedPalette.slice(0, count);
};

const CategoryTrend: React.FC<CategoryTrendProps> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [periodType, setPeriodType] = useState<string>("last_12_months");
  const { ledgerId, currencySymbol } = useLedgerStore();

  // Color modes — aligned with IncomeExpenseTrend / LedgerMainAccounts patterns
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

  const incomeAccentColor = useColorModeValue("teal.400", "teal.300");
  const expenseAccentColor = useColorModeValue("red.400", "red.300");

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
    staleTime: 0,
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
    staleTime: 1000 * 60 * 5,
  });

  // Define a function to organize and render categories
  const renderOrganizedCategories = () => {
    if (!categories || isCategoriesLoading) return null;

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
      item.categories.forEach((cat) => {
        result[cat.category_name] = cat.amount;
      });
      return result;
    }) || [];

  // Render loading state
  if (isCategoriesLoading || (isTrendDataLoading && selectedCategory)) {
    return (
      <Box
        bg={cardBg}
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
      >
        <Text color={secondaryTextColor}>Loading category data...</Text>
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
          Unable to load category trend data
        </Text>
      </Box>
    );
  }

  const accentColor =
    trendData?.category_type === "income"
      ? incomeAccentColor
      : expenseAccentColor;
  const valueColor =
    trendData?.category_type === "income" ? positiveColor : expenseValueColor;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Box borderRadius="xl" p={{ base: 0, md: 0 }}>
        {/* Header with Category and Period Selector */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          flexDirection={{ base: "column", md: "row" }}
          gap={{ base: 3, md: 0 }}
          mb={{ base: 4, md: 5 }}
        >
          <Flex align="center" gap={2}>
            <Icon as={TrendingUp} boxSize={4} color={iconColor} />
            <Heading
              as="h2"
              size="md"
              color={primaryTextColor}
              letterSpacing="-0.02em"
            >
              Category Trend Analysis
            </Heading>
          </Flex>

          <Flex
            direction={{ base: "column", md: "row" }}
            gap={{ base: 2, md: 3 }}
            width={{ base: "full", md: "auto" }}
          >
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              maxW={{ base: "full", md: "220px" }}
              icon={<ChevronDown />}
              variant="filled"
              bg={selectBg}
              size="sm"
              borderRadius="lg"
              fontWeight="medium"
              fontSize="sm"
              placeholder="Select a category"
            >
              {renderOrganizedCategories()}
            </Select>

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
        </Flex>

        {/* Summary Card */}
        {trendData?.summary && transformedData.length > 0 && (
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            mb={{ base: 4, md: 5 }}
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
                  <Icon
                    as={
                      trendData.category_type === "income"
                        ? TrendingUp
                        : TrendingDown
                    }
                    boxSize={3}
                    color={accentColor}
                  />
                </Flex>
                <Text
                  fontSize="2xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color={columnHeaderColor}
                >
                  {trendData.category_name} Summary
                </Text>
              </Flex>

              <HStack spacing={0} align="baseline" mb={2}>
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  fontWeight="bold"
                  color={valueColor}
                  lineHeight="short"
                  letterSpacing="-0.01em"
                >
                  {
                    splitCurrencyForDisplay(
                      trendData.summary.total,
                      currencySymbol || "₹",
                    ).main
                  }
                </Text>
                <Text fontSize="xs" color={valueColor} opacity={0.6}>
                  {
                    splitCurrencyForDisplay(
                      trendData.summary.total,
                      currencySymbol || "₹",
                    ).decimals
                  }
                </Text>
              </HStack>

              <Flex
                gap={{ base: 2, md: 4 }}
                flexWrap="wrap"
                mb={trendData.is_group ? 2 : 0}
              >
                <Text fontSize="xs" color={tertiaryTextColor}>
                  Avg:{" "}
                  {formatNumberAsCurrency(
                    trendData.summary.average,
                    currencySymbol as string,
                  )}
                </Text>
                <Text fontSize="xs" color={tertiaryTextColor}>
                  Peak:{" "}
                  {formatNumberAsCurrency(
                    trendData.summary.highest.amount,
                    currencySymbol as string,
                  )}{" "}
                  in {formatPeriod(trendData.summary.highest.period)}
                </Text>
                <Flex align="center" gap={1}>
                  <Icon as={Layers} boxSize={2.5} color={tertiaryTextColor} />
                  <Text fontSize="xs" color={tertiaryTextColor}>
                    {uniqueSubcategories.length} subcategories
                  </Text>
                </Flex>
              </Flex>

              {trendData.is_group && (
                <HStack wrap="wrap" spacing={2}>
                  {uniqueSubcategories.slice(0, 3).map((subcat, index) => (
                    <Badge
                      key={subcat}
                      variant="subtle"
                      colorScheme={index % 2 === 0 ? "blue" : "cyan"}
                      fontSize="2xs"
                      borderRadius="md"
                    >
                      {subcat}
                    </Badge>
                  ))}
                  {uniqueSubcategories.length > 3 && (
                    <Badge
                      variant="subtle"
                      colorScheme="gray"
                      fontSize="2xs"
                      borderRadius="md"
                    >
                      +{uniqueSubcategories.length - 3} more
                    </Badge>
                  )}
                </HStack>
              )}
            </Box>
          </MotionBox>
        )}

        {/* Chart Section */}
        <Box height={{ base: "280px", md: "380px" }} width="full">
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
              borderRadius="lg"
              flexDirection="column"
              textAlign="center"
              p={6}
            >
              <Icon
                as={BarChart2}
                boxSize={6}
                color={tertiaryTextColor}
                mb={4}
              />
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
      </Box>
    </MotionBox>
  );
};

export default React.memo(CategoryTrend);
