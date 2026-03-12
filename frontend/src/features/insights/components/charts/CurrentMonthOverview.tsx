import React, { PureComponent, useMemo, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  useColorModeValue,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Center,
  Grid,
  GridItem,
  Collapse,
  Flex,
} from "@chakra-ui/react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, TrendingDown, PieChart, BarChart2, ChevronRight, ChevronDown } from "lucide-react";
import config from "@/config";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";

// Distinct base colors — one per top-level category.
// Children get HSL-derived shades of their parent's base color.
const BASE_COLORS_LIGHT = [
  "#0d9488", // teal
  "#2563eb", // blue
  "#ea580c", // orange
  "#7c3aed", // violet
  "#16a34a", // green
  "#db2777", // pink
  "#ca8a04", // yellow
  "#dc2626", // red
  "#0891b2", // cyan
  "#9333ea", // purple
];

const BASE_COLORS_DARK = [
  "#2dd4bf", // teal-400
  "#60a5fa", // blue-400
  "#fb923c", // orange-400
  "#a78bfa", // violet-400
  "#4ade80", // green-400
  "#f472b6", // pink-400
  "#facc15", // yellow-400
  "#f87171", // red-400
  "#22d3ee", // cyan-400
  "#c084fc", // purple-400
];

// --- Color helpers ---

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100, ll = l / 100;
  const a = sl * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateShades(baseHex: string, count: number): string[] {
  if (count <= 1) return [baseHex];
  const [h, s, l] = hexToHsl(baseHex);
  const spread = Math.min(20, 40 / count);
  return Array.from({ length: count }, (_, i) => {
    const lightness = Math.max(20, Math.min(80, l - (spread * (count - 1)) / 2 + spread * i));
    return hslToHex(h, s, lightness);
  });
}

function assignColorsToCategories(categories: CategoryData[], baseColors: string[]): CategoryData[] {
  return categories.map((category, index) => {
    const baseColor = baseColors[index % baseColors.length];
    if (category.children && category.children.length > 0) {
      const shades = generateShades(baseColor, category.children.length);
      return {
        ...category,
        color: baseColor,
        children: category.children.map((child, childIndex) => ({
          ...child,
          color: shades[childIndex],
        })),
      };
    }
    return { ...category, color: baseColor };
  });
}

interface CategoryData {
  name: string;
  value: number;
  color?: string;
  children?: CategoryData[] | null;
}

interface CurrentMonthOverviewData {
  total_income: number;
  total_expense: number;
  income_categories_breakdown: CategoryData[];
  expense_categories_breakdown: CategoryData[];
}

interface CustomizedTreemapContentProps {
  root?: {
    name?: string;
    value?: number;
    children?: any[];
  };
  depth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  color?: string;
  colors: string[];
  strokeColor: string;
}

interface NestedCategoryBreakdownProps {
  categories: CategoryData[];
  type: "income" | "expense";
  currencySymbol: string;
  primaryTextColor: string;
}

const NestedCategoryBreakdown: React.FC<NestedCategoryBreakdownProps> = ({
  categories,
  type,
  currencySymbol,
  primaryTextColor,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const topLevelIncomeTextColor = useColorModeValue("teal.700", "teal.400");
  const topLevelExpenseTextColor = useColorModeValue("red.700", "red.400");
  const hoverBgIncome = useColorModeValue("teal.100", "teal.800");
  const hoverBgExpense = useColorModeValue("red.100", "red.800");
  const headingIncomeColor = useColorModeValue("teal.600", "teal.300");
  const headingExpenseColor = useColorModeValue("red.600", "red.300");
  const breakdownBg = useColorModeValue("gray.50", "gray.700");

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName],
    );
  };

  const renderCategory = (category: CategoryData, level = 0) => {
    const isExpanded = expandedCategories.includes(category.name);
    const hasChildren = category.children && category.children.length > 0;

    const categoryTextColor = level === 0 ? (type === "income" ? topLevelIncomeTextColor : topLevelExpenseTextColor) : primaryTextColor;

    return (
      <Box key={category.name}>
        <Flex
          align="center"
          p={2}
          borderRadius="md"
          mb={1}
          pl={`${level * 15 + 10}px`}
          cursor={hasChildren ? "pointer" : "default"}
          onClick={
            hasChildren ? () => toggleCategory(category.name) : undefined
          }
          _hover={{
            bg: type === "income" ? hoverBgIncome : hoverBgExpense,
          }}
        >
          {hasChildren && (
            <Icon
              as={isExpanded ? ChevronDown : ChevronRight}
              mr={2}
              color={categoryTextColor}
            />
          )}
          <Box flex={1}>
            <Text fontWeight="medium" color={categoryTextColor} fontSize="sm">
              {category.name}
            </Text>
          </Box>
          <Text color={categoryTextColor}>
            {formatNumberAsCurrency(category.value, currencySymbol)}
          </Text>
        </Flex>
        {hasChildren && isExpanded && (
          <Collapse in={isExpanded}>
            <Box pl={`${level * 15 + 25}px`}>
              {category.children?.map((child) =>
                renderCategory(child, level + 1),
              )}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Heading
        size="sm"
        color={type === "income" ? headingIncomeColor : headingExpenseColor}
        mb={4}
        display="flex"
        alignItems="center"
      >
        <Icon
          as={BarChart2}
          mr={2}
          color={type === "income" ? "teal.500" : "red.500"}
        />
        {type === "income" ? "Income" : "Expense"} Categories
      </Heading>
      <VStack
        align="stretch"
        spacing={2}
        bg={breakdownBg}
        p={4}
        borderRadius="lg"
      >
        {categories.map((category) => renderCategory(category))}
      </VStack>
    </Box>
  );
};

class CustomizedTreemapContent extends PureComponent<CustomizedTreemapContentProps> {
  render() {
    const {
      root,
      depth = 0,
      x = 0,
      y = 0,
      width = 0,
      height = 0,
      index = 0,
      color,
      colors,
      strokeColor,
    } = this.props;

    const fallbackColor = colors[Math.floor((index / (root?.children?.length || 1)) * colors.length)];
    const fillColor = color ?? (depth < 2 ? fallbackColor : "#ffffff00");

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
      </g>
    );
  }
}

// Main Component
const CurrentMonthOverview: React.FC = () => {
  // Color modes
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
   const customToolTipBorderColor = useColorModeValue("gray.200", "gray.600");
   const treemapStrokeColor = useColorModeValue("#fff", "gray.800");
   const expenseColor = useColorModeValue("red.500", "red.400");

  const baseColors = useColorModeValue(BASE_COLORS_LIGHT, BASE_COLORS_DARK);

  // Currency symbol from global store
  const { ledgerId, currencySymbol } = useLedgerStore();

  // Fetch data
  const { data, isLoading, isError } = useQuery<CurrentMonthOverviewData>({
    queryKey: ["current-month-overview", ledgerId],
    queryFn: async () => {
      if (!ledgerId) return null;

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/ledger/${ledgerId}/insights/current-month-overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch current month overview");
      }

      return response.json();
    },
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  const coloredIncomeData = useMemo(
    () => assignColorsToCategories(data?.income_categories_breakdown ?? [], baseColors),
    [data?.income_categories_breakdown, baseColors]
  );
  const coloredExpenseData = useMemo(
    () => assignColorsToCategories(data?.expense_categories_breakdown ?? [], baseColors),
    [data?.expense_categories_breakdown, baseColors]
  );

  // Render loading state
  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" bg={cardBg} p={6} borderRadius="xl">
        <Text color={secondaryTextColor}>Loading financial insights...</Text>
      </VStack>
    );
  }

  // Render error state
  if (isError || !data) {
    return (
      <VStack spacing={4} align="center" bg={cardBg} p={6} borderRadius="xl">
        <Icon as={TrendingDown} color="red.500" boxSize={10} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load financial insights
        </Text>
      </VStack>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalValue = data.root?.value || data.value;
      const parentName = data.root?.name;
      return (
        <Box
          bg={bgColor}
          p={3}
          borderRadius="md"
          boxShadow="md"
          border="1px solid"
          borderColor={customToolTipBorderColor}
        >
          <Text fontWeight="bold" color={primaryTextColor}>
            {data.name}
          </Text>
          {parentName && (
            <Text fontSize="sm" color={secondaryTextColor}>
              {parentName}
            </Text>
          )}
          <Text fontWeight="bold" color={secondaryTextColor}>
            {formatNumberAsCurrency(data.value, currencySymbol as string)}
          </Text>
          <Text fontSize="sm" color={secondaryTextColor}>
            {((data.value / totalValue) * 100).toFixed(1)}%{" "}
            {parentName
              ? `of ${parentName} ${formatNumberAsCurrency(totalValue, currencySymbol as string)}`
              : ""}
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box bg={bgColor} borderRadius="lg" p={{ base: 4, md: 6 }} boxShadow="lg">
      <VStack align="flex-start" spacing={1} flex={1}>
        <Flex alignItems="center" gap={3}>
          <Icon as={Calendar} w={5} h={5} color={primaryTextColor} />
          <Heading as="h2" size="md" color={primaryTextColor}>
            Current Month Overview
          </Heading>
        </Flex>
        <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
          Your financial snapshot for the current month
        </Text>
      </VStack>

      {/* Summary Cards */}
      <HStack
        spacing={4}
        mt={6}
        mb={10}
        flexDirection={{ base: "column", md: "row" }}
      >
        {/* Income Card */}
        <Box bg={cardBg} p={6} borderRadius="lg" width="full" boxShadow="md">
          <VStack align="stretch" spacing={4}>
            <HStack justifyContent="space-between">
              <Heading size="md" color="teal.500">
                Income
              </Heading>
              <Icon as={TrendingUp} color="teal.500" size={24} />
            </HStack>

            <Stat>
              <StatLabel color={secondaryTextColor}>Total Income</StatLabel>
              <StatNumber color={primaryTextColor}>
                {formatNumberAsCurrency(
                  data.total_income,
                  currencySymbol as string,
                )}
              </StatNumber>
              <StatHelpText>
                <Badge colorScheme="teal" variant="subtle">
                  This Month
                </Badge>
              </StatHelpText>
            </Stat>
          </VStack>
        </Box>

        {/* Expense Card */}
        <Box bg={cardBg} p={6} borderRadius="lg" width="full" boxShadow="md">
          <VStack align="stretch" spacing={4}>
            <HStack justifyContent="space-between">
               <Heading size="md" color={expenseColor}>
                 Expenses
               </Heading>
               <Icon as={TrendingDown} color={expenseColor} size={24} />
            </HStack>

            <Stat>
              <StatLabel color={secondaryTextColor}>Total Expenses</StatLabel>
              <StatNumber color={primaryTextColor}>
                {formatNumberAsCurrency(
                  data.total_expense,
                  currencySymbol as string,
                )}
              </StatNumber>
              <StatHelpText>
                <Badge colorScheme="red" variant="subtle">
                  This Month
                </Badge>
              </StatHelpText>
            </Stat>
          </VStack>
        </Box>
      </HStack>

      {/* Treemap Visualizations with Side-by-Side Layout */}
      {(coloredIncomeData.length > 0 || coloredExpenseData.length > 0) && (
        <Grid
          templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
          gap={6}
          width="full"
        >
          {/* Income Treemap */}
          {coloredIncomeData.length > 0 && (
            <GridItem>
              <Box width="full">
                <Heading
                  size="sm"
                  color={primaryTextColor}
                  mb={4}
                  display="flex"
                  alignItems="center"
                >
                  <Icon as={PieChart} mr={2} color="teal.500" />
                  Income Breakdown
                </Heading>
                <Box height="300px" width="full">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={coloredIncomeData}
                      dataKey="value"
                      aspectRatio={4 / 3}
                      stroke={treemapStrokeColor}
                      content={
                        <CustomizedTreemapContent
                          colors={baseColors}
                          strokeColor={treemapStrokeColor}
                        />
                      }
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </GridItem>
          )}

          {/* Expense Treemap */}
          {coloredExpenseData.length > 0 && (
            <GridItem>
              <Box width="full">
                <Heading
                  size="sm"
                  color={primaryTextColor}
                  mb={4}
                  display="flex"
                  alignItems="center"
                >
                   <Icon as={PieChart} mr={2} color={expenseColor} />
                  Expense Breakdown
                </Heading>
                <Box height="300px" width="full">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={coloredExpenseData}
                      dataKey="value"
                      aspectRatio={4 / 3}
                      stroke={treemapStrokeColor}
                      content={
                        <CustomizedTreemapContent
                          colors={baseColors}
                          strokeColor={treemapStrokeColor}
                        />
                      }
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </GridItem>
          )}

          {/* Nested Category Breakdown Section */}
          {coloredIncomeData.length > 0 && (
            <GridItem>
               <NestedCategoryBreakdown
                 categories={coloredIncomeData}
                 type="income"
                 currencySymbol={currencySymbol as string}
                 primaryTextColor={primaryTextColor}
               />
            </GridItem>
          )}

          {coloredExpenseData.length > 0 && (
            <GridItem>
               <NestedCategoryBreakdown
                 categories={coloredExpenseData}
                 type="expense"
                 currencySymbol={currencySymbol as string}
                 primaryTextColor={primaryTextColor}
               />
            </GridItem>
          )}
        </Grid>
      )}

      {/* No Data State */}
      {coloredIncomeData.length === 0 && coloredExpenseData.length === 0 && (
          <Center
            height="300px"
            bg={bgColor}
            borderRadius="lg"
            flexDirection="column"
            textAlign="center"
            p={6}
          >
            <Icon as={BarChart2} boxSize={16} color={secondaryTextColor} mb={4} />
            <Heading size="md" mb={2} color={secondaryTextColor}>
              No Financial Data Available
            </Heading>
            <Text color={secondaryTextColor} fontSize="sm">
              Add some transactions to see your current month breakdown
            </Text>
          </Center>
        )}
    </Box>
  );
};

export default React.memo(CurrentMonthOverview);
