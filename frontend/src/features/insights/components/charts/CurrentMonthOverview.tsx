import React, { PureComponent, useMemo, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  useColorModeValue,
  Icon,
  Center,
  Grid,
  GridItem,
  Flex,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart2,
  ChevronRight,
  ChevronDown,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// --- Color palettes ---

const BASE_COLORS_LIGHT = [
  "#0d9488", "#2563eb", "#ea580c", "#7c3aed", "#16a34a",
  "#db2777", "#ca8a04", "#dc2626", "#0891b2", "#9333ea",
];

const BASE_COLORS_DARK = [
  "#2dd4bf", "#60a5fa", "#fb923c", "#a78bfa", "#4ade80",
  "#f472b6", "#facc15", "#f87171", "#22d3ee", "#c084fc",
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

// --- Interfaces ---

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
  root?: { name?: string; value?: number; children?: any[] };
  depth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
  color?: string;
  colors: string[];
  strokeColor: string;
  textColor: string;
  currencySymbol: string;
}

interface CategoryBarBreakdownProps {
  categories: CategoryData[];
  total: number;
  type: "income" | "expense";
  currencySymbol: string;
}

// --- Treemap content with labels ---

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
          rx={depth === 1 ? 3 : 0}
        />
      </g>
    );
  }
}

// --- Category bar breakdown ---

const CategoryBarBreakdown: React.FC<CategoryBarBreakdownProps> = ({
  categories,
  total,
  type,
  currencySymbol,
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const barTrackBg = useColorModeValue("gray.100", "gray.600");
  const primaryText = useColorModeValue("gray.700", "gray.200");
  const secondaryText = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const childBg = useColorModeValue("gray.50", "gray.700");
  const headingColor = useColorModeValue(
    type === "income" ? "green.600" : "red.600",
    type === "income" ? "green.300" : "red.300",
  );

  return (
    <Box>
      <Flex align="center" gap={2} mb={4}>
        <Icon
          as={BarChart2}
          boxSize={4}
          color={headingColor}
        />
        <Heading size="sm" color={headingColor} letterSpacing="-0.01em">
          {type === "income" ? "Income" : "Expense"} Categories
        </Heading>
      </Flex>
      <VStack align="stretch" spacing={0}>
        {categories.map((category, idx) => {
          const pct = total > 0 ? (category.value / total) * 100 : 0;
          const hasChildren = category.children && category.children.length > 0;
          const isExpanded = expanded === category.name;

          return (
            <Box key={category.name}>
              <MotionFlex
                align="center"
                gap={3}
                py={2.5}
                px={3}
                borderRadius="md"
                cursor={hasChildren ? "pointer" : "default"}
                onClick={hasChildren ? () => setExpanded(isExpanded ? null : category.name) : undefined}
                _hover={{ bg: hoverBg }}
                style={{ transition: "background 0.15s ease" }}
                initial={false}
              >
                {/* Color dot */}
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={category.color}
                  flexShrink={0}
                />

                {/* Name + bar */}
                <Box flex={1} minW={0}>
                  <Flex justify="space-between" align="baseline" mb={1}>
                    <HStack spacing={1.5}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color={primaryText}
                        noOfLines={1}
                      >
                        {category.name}
                      </Text>
                      {hasChildren && (
                        <Icon
                          as={isExpanded ? ChevronDown : ChevronRight}
                          boxSize={3.5}
                          color={secondaryText}
                        />
                      )}
                    </HStack>
                    <HStack spacing={2} flexShrink={0}>
                      <Text fontSize="xs" color={secondaryText}>
                        {pct.toFixed(1)}%
                      </Text>
                      <Text fontSize="sm" fontWeight="semibold" color={primaryText}>
                        {formatNumberAsCurrency(category.value, currencySymbol)}
                      </Text>
                    </HStack>
                  </Flex>
                  {/* Proportional bar */}
                  <Box
                    h="4px"
                    borderRadius="full"
                    bg={barTrackBg}
                    overflow="hidden"
                  >
                    <MotionBox
                      h="full"
                      borderRadius="full"
                      bg={category.color}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 1)}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.05, ease: "easeOut" }}
                    />
                  </Box>
                </Box>
              </MotionFlex>

              {/* Children */}
              <AnimatePresence>
                {hasChildren && isExpanded && (
                  <MotionBox
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    overflow="hidden"
                  >
                    <VStack
                      align="stretch"
                      spacing={0}
                      ml={6}
                      pl={3}
                      borderLeftWidth="2px"
                      borderLeftColor={category.color}
                      bg={childBg}
                      borderRadius="0 md md 0"
                      py={1}
                      my={1}
                    >
                      {category.children?.map((child) => {
                        const childPct = category.value > 0
                          ? (child.value / category.value) * 100
                          : 0;
                        return (
                          <Flex
                            key={child.name}
                            align="center"
                            gap={3}
                            py={1.5}
                            px={3}
                          >
                            <Box
                              w="6px"
                              h="6px"
                              borderRadius="full"
                              bg={child.color}
                              flexShrink={0}
                            />
                            <Text
                              flex={1}
                              fontSize="xs"
                              color={secondaryText}
                              noOfLines={1}
                            >
                              {child.name}
                            </Text>
                            <Text fontSize="xs" color={secondaryText}>
                              {childPct.toFixed(0)}%
                            </Text>
                            <Text
                              fontSize="xs"
                              fontWeight="medium"
                              color={primaryText}
                            >
                              {formatNumberAsCurrency(child.value, currencySymbol)}
                            </Text>
                          </Flex>
                        );
                      })}
                    </VStack>
                  </MotionBox>
                )}
              </AnimatePresence>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};

// --- Main Component ---

const CurrentMonthOverview: React.FC = () => {
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const tooltipBorderColor = useColorModeValue("gray.200", "gray.600");
  const treemapStrokeColor = useColorModeValue("#fff", "#2D3748");
  const treemapTextColor = useColorModeValue("#fff", "#fff");
  const sectionBorderColor = useColorModeValue("gray.200", "gray.600");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const expenseColor = useColorModeValue("red.500", "red.400");
  const incomeTopAccent = useColorModeValue("green.400", "green.400");
  const expenseTopAccent = useColorModeValue("red.400", "red.400");
  const savingsPositiveColor = useColorModeValue("brand.600", "brand.300");
  const savingsNegativeColor = useColorModeValue("orange.500", "orange.300");
  const savingsTopAccent = useColorModeValue("brand.400", "brand.400");
  const savingsNegativeTopAccent = useColorModeValue("orange.400", "orange.400");

  const baseColors = useColorModeValue(BASE_COLORS_LIGHT, BASE_COLORS_DARK);
  const { ledgerId, currencySymbol } = useLedgerStore();

  const { data, isLoading, isError } = useQuery<CurrentMonthOverviewData>({
    queryKey: ["current-month-overview", ledgerId],
    queryFn: async () => {
      if (!ledgerId) return null;
      const response = await api.get(
        `/ledger/${ledgerId}/insights/current-month-overview`,
      );
      return response.data;
    },
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  const coloredIncomeData = useMemo(
    () => assignColorsToCategories(
      [...(data?.income_categories_breakdown ?? [])].sort((a, b) => b.value - a.value),
      baseColors,
    ),
    [data?.income_categories_breakdown, baseColors],
  );
  const coloredExpenseData = useMemo(
    () => assignColorsToCategories(
      [...(data?.expense_categories_breakdown ?? [])].sort((a, b) => b.value - a.value),
      baseColors,
    ),
    [data?.expense_categories_breakdown, baseColors],
  );

  const netSavings = (data?.total_income ?? 0) - (data?.total_expense ?? 0);
  const savingsRate = data?.total_income && data.total_income > 0
    ? (netSavings / data.total_income) * 100
    : 0;
  const isPositiveSavings = netSavings >= 0;

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" bg={cardBg} p={6} borderRadius="xl">
        <Text color={secondaryTextColor}>Loading financial insights...</Text>
      </VStack>
    );
  }

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const totalValue = d.root?.value || d.value;
      const parentName = d.root?.name;
      const pct = totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : "0";
      return (
        <Box
          bg={bgColor}
          px={3}
          py={2.5}
          borderRadius="lg"
          boxShadow="lg"
          border="1px solid"
          borderColor={tooltipBorderColor}
          minW="140px"
        >
          <Text fontWeight="bold" fontSize="sm" color={primaryTextColor} mb={0.5}>
            {d.name}
          </Text>
          {parentName && (
            <Text fontSize="xs" color={secondaryTextColor} mb={1}>
              {parentName}
            </Text>
          )}
          <Flex justify="space-between" align="baseline" gap={4}>
            <Text fontWeight="bold" color={primaryTextColor}>
              {formatNumberAsCurrency(d.value, currencySymbol as string)}
            </Text>
            <Text fontSize="xs" fontWeight="medium" color={secondaryTextColor}>
              {pct}%
            </Text>
          </Flex>
        </Box>
      );
    }
    return null;
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <MotionBox
      borderRadius="lg"
      p={{ base: 0, md: 0 }}
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <MotionBox variants={fadeUp}>
        <VStack align="flex-start" spacing={1}>
          <Flex alignItems="center" gap={3}>
            <Icon as={Calendar} w={5} h={5} color={primaryTextColor} />
            <Heading as="h2" size="md" color={primaryTextColor} letterSpacing="-0.02em">
              Current Month Overview
            </Heading>
          </Flex>
          <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
            Your financial snapshot for the current month
          </Text>
        </VStack>
      </MotionBox>

      {/* Summary Cards: Income / Expense / Net Savings */}
      <MotionBox variants={fadeUp}>
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }}
          gap={{ base: 3, md: 4 }}
          mt={6}
          mb={{ base: 4, md: 6 }}
        >
          {/* Income Card */}
          <GridItem>
            <Box
              bg={cardBg}
              p={{ base: 3, md: 4 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={sectionBorderColor}
              overflow="hidden"
              position="relative"
              transition="border-color 0.2s ease"
              _hover={{ borderColor: incomeTopAccent }}
              height="full"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="2px"
                bg={incomeTopAccent}
                opacity={0.7}
              />
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
              >
                {formatNumberAsCurrency(data.total_income, currencySymbol as string)}
              </Text>
            </Box>
          </GridItem>

          {/* Expense Card */}
          <GridItem>
            <Box
              bg={cardBg}
              p={{ base: 3, md: 4 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={sectionBorderColor}
              overflow="hidden"
              position="relative"
              transition="border-color 0.2s ease"
              _hover={{ borderColor: expenseTopAccent }}
              height="full"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="2px"
                bg={expenseTopAccent}
                opacity={0.7}
              />
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
                color={expenseColor}
                lineHeight="short"
              >
                {formatNumberAsCurrency(data.total_expense, currencySymbol as string)}
              </Text>
            </Box>
          </GridItem>

          {/* Net Savings Card */}
          <GridItem>
            <Box
              bg={cardBg}
              p={{ base: 3, md: 4 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={sectionBorderColor}
              overflow="hidden"
              position="relative"
              transition="border-color 0.2s ease"
              _hover={{ borderColor: isPositiveSavings ? savingsTopAccent : savingsNegativeTopAccent }}
              height="full"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="2px"
                bg={isPositiveSavings ? savingsTopAccent : savingsNegativeTopAccent}
                opacity={0.7}
              />
              <Flex align="center" gap={1.5} mb={1}>
                <Icon as={Wallet} boxSize={3} color={columnHeaderColor} />
                <Text
                  fontSize="2xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color={columnHeaderColor}
                >
                  Net Savings
                </Text>
              </Flex>
              <Text
                fontSize={{ base: "md", md: "xl" }}
                fontWeight="bold"
                color={isPositiveSavings ? savingsPositiveColor : savingsNegativeColor}
                lineHeight="short"
              >
                {isPositiveSavings ? "+" : ""}
                {formatNumberAsCurrency(netSavings, currencySymbol as string)}
              </Text>
              {data.total_income > 0 && (
                <Text fontSize="xs" color={secondaryTextColor} mt={0.5}>
                  {savingsRate.toFixed(1)}% savings rate
                </Text>
              )}
            </Box>
          </GridItem>
        </Grid>
      </MotionBox>

      {/* Treemaps + Category breakdowns */}
      {(coloredIncomeData.length > 0 || coloredExpenseData.length > 0) && (
        <Grid
          templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
          gap={6}
          width="full"
        >
          {/* Income Treemap */}
          {coloredIncomeData.length > 0 && (
            <GridItem>
              <MotionBox variants={fadeUp} width="full">
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
                <Box height="280px" width="full">
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
                          textColor={treemapTextColor}
                          currencySymbol={currencySymbol as string}
                        />
                      }
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                  </ResponsiveContainer>
                </Box>
              </MotionBox>
            </GridItem>
          )}

          {/* Expense Treemap */}
          {coloredExpenseData.length > 0 && (
            <GridItem>
              <MotionBox variants={fadeUp} width="full">
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
                <Box height="280px" width="full">
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
                          textColor={treemapTextColor}
                          currencySymbol={currencySymbol as string}
                        />
                      }
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                  </ResponsiveContainer>
                </Box>
              </MotionBox>
            </GridItem>
          )}

          {/* Income Category Bars */}
          {coloredIncomeData.length > 0 && (
            <GridItem>
              <MotionBox variants={fadeUp}>
                <CategoryBarBreakdown
                  categories={coloredIncomeData}
                  total={data.total_income}
                  type="income"
                  currencySymbol={currencySymbol as string}
                />
              </MotionBox>
            </GridItem>
          )}

          {/* Expense Category Bars */}
          {coloredExpenseData.length > 0 && (
            <GridItem>
              <MotionBox variants={fadeUp}>
                <CategoryBarBreakdown
                  categories={coloredExpenseData}
                  total={data.total_expense}
                  type="expense"
                  currencySymbol={currencySymbol as string}
                />
              </MotionBox>
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
    </MotionBox>
  );
};

export default React.memo(CurrentMonthOverview);
