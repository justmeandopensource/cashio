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
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { useQuery } from "@tanstack/react-query";
import { useCategories } from "@features/categories/hooks";
import api from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  BarChart2,
  Layers,
  Activity,
  ArrowUpRight,
  X,
} from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

// Color palette for subcategories
const SUBCATEGORY_COLORS = [
  "#3182CE", "#38B2AC", "#4299E1", "#0BC5EA", "#319795",
  "#2B6CB0", "#00B5D8", "#2C7A7B", "#63B3ED", "#76E4F7",
  "#4FD1C5", "#805AD5", "#D53F8C", "#DD6B20", "#38A169",
];

// Interfaces
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
    period: string | null;
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

const periodOptions = [
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "monthly_since_beginning", label: "Monthly Overview" },
  { value: "yearly_since_beginning", label: "Yearly Snapshot" },
];

const formatPeriod = (period: string) => {
  if (period.includes("-")) {
    const [year, month] = period.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      "en-US",
      { month: "short", year: "2-digit" },
    );
  }
  return period;
};

const CategoryTrend: React.FC<CategoryTrendProps> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [periodType, setPeriodType] = useState<string>("last_12_months");
  const [hiddenSubcategories, setHiddenSubcategories] = useState<Set<string>>(new Set());
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);

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
  const legendHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  // Nivo theme colors
  const textColor = useColorModeValue("#4A5568", "#A0AEC0");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tooltipBg = useColorModeValue("#FFFFFF", "#1A202C");
  const tooltipBorder = useColorModeValue("#E2E8F0", "#4A5568");

  // Summary card accent colors
  const incomeAccentColor = useColorModeValue("teal.400", "teal.300");
  const expenseAccentColor = useColorModeValue("red.400", "red.300");
  const avgAccentColor = useColorModeValue("blue.400", "blue.300");
  const peakAccentColor = useColorModeValue("purple.400", "purple.300");
  const subcatAccentColor = useColorModeValue("orange.400", "orange.300");

  const sym = currencySymbol || "₹";
  const maxTicks = useBreakpointValue({ base: 5, md: 10 }) || 5;

  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  // Fetch trend data
  const { data: trendData, isLoading: isTrendDataLoading, isError } = useQuery<CategoryTrendData>({
    queryKey: ["categoryTrend", ledgerId, selectedCategory, periodType],
    queryFn: async () => {
      if (!ledgerId || !selectedCategory) return null;
      const response = await api.get(
        `/ledger/${ledgerId}/insights/category-trend?category_id=${selectedCategory}&period_type=${periodType}`,
      );
      return response.data;
    },
    enabled: !!ledgerId && !!selectedCategory,
    staleTime: 1000 * 60 * 5,
  });

  // Unique subcategories
  const uniqueSubcategories = useMemo(() => {
    if (!trendData?.trend_data) return [];
    const all = new Set<string>();
    trendData.trend_data.forEach((item) => {
      item.categories.forEach((cat) => all.add(cat.category_name));
    });
    return Array.from(all);
  }, [trendData]);

  // Color map for subcategories
  const subcategoryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    uniqueSubcategories.forEach((name, idx) => {
      map[name] = SUBCATEGORY_COLORS[idx % SUBCATEGORY_COLORS.length];
    });
    return map;
  }, [uniqueSubcategories]);

  // Visible subcategories
  const visibleSubcategories = useMemo(
    () => uniqueSubcategories.filter((s) => !hiddenSubcategories.has(s)),
    [uniqueSubcategories, hiddenSubcategories],
  );

  // Decide chart type: bar for ≤13 periods, line for more
  const shouldUseBarChart = (trendData?.trend_data?.length || 0) <= 13;

  // Tick values for x-axis
  const tickValues = useMemo(() => {
    if (!trendData?.trend_data?.length) return undefined;
    const xValues = trendData.trend_data.map((d) => d.period);
    if (xValues.length <= maxTicks) return undefined;
    const step = Math.ceil(xValues.length / maxTicks);
    const ticks = xValues.filter((_, i) => i % step === 0);
    if (ticks[ticks.length - 1] !== xValues[xValues.length - 1]) {
      ticks.push(xValues[xValues.length - 1]);
    }
    return ticks;
  }, [trendData, maxTicks]);

  // Transform data for nivo bar chart
  const barData = useMemo(() => {
    if (!trendData?.trend_data) return [];
    return trendData.trend_data.map((item) => {
      const result: Record<string, string | number> = { period: item.period };
      item.categories.forEach((cat) => {
        if (!hiddenSubcategories.has(cat.category_name)) {
          result[cat.category_name] = cat.amount;
        }
      });
      return result;
    });
  }, [trendData, hiddenSubcategories]);

  // Transform data for nivo line chart
  const lineData = useMemo(() => {
    if (!trendData?.trend_data) return [];
    return visibleSubcategories.map((subcat) => ({
      id: subcat,
      data: trendData.trend_data.map((item) => {
        const cat = item.categories.find((c) => c.category_name === subcat);
        return { x: item.period, y: cat?.amount ?? 0 };
      }),
    }));
  }, [trendData, visibleSubcategories]);

  // Subcategory totals for breakdown panel
  const subcategoryTotals = useMemo(() => {
    if (!trendData?.trend_data) return [];
    const totals: Record<string, { total: number; periods: number; peak: number; peakPeriod: string }> = {};
    trendData.trend_data.forEach((item) => {
      item.categories.forEach((cat) => {
        if (!totals[cat.category_name]) {
          totals[cat.category_name] = { total: 0, periods: 0, peak: 0, peakPeriod: "" };
        }
        totals[cat.category_name].total += cat.amount;
        if (cat.amount > 0) totals[cat.category_name].periods += 1;
        if (cat.amount > totals[cat.category_name].peak) {
          totals[cat.category_name].peak = cat.amount;
          totals[cat.category_name].peakPeriod = item.period;
        }
      });
    });
    const grandTotal = Object.values(totals).reduce((s, t) => s + t.total, 0);
    return Object.entries(totals)
      .map(([name, stats]) => ({
        name,
        ...stats,
        percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0,
        average: stats.periods > 0 ? stats.total / stats.periods : 0,
        color: subcategoryColorMap[name] || SUBCATEGORY_COLORS[0],
      }))
      .sort((a, b) => b.total - a.total);
  }, [trendData, subcategoryColorMap]);

  // Selected subcategory detail data for drill-down
  const selectedSubcatDetail = useMemo(() => {
    if (!selectedSubcategory || !trendData?.trend_data) return null;
    const detail = subcategoryTotals.find((s) => s.name === selectedSubcategory);
    if (!detail) return null;
    const periodData = trendData.trend_data
      .map((item) => {
        const cat = item.categories.find((c) => c.category_name === selectedSubcategory);
        return { period: item.period, amount: cat?.amount ?? 0 };
      })
      .filter((d) => d.amount > 0);
    return { ...detail, periodData };
  }, [selectedSubcategory, trendData, subcategoryTotals]);

  const toggleSubcategory = (name: string) => {
    setHiddenSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSubcategoryClick = (name: string) => {
    setSelectedSubcategory((prev) => (prev === name ? null : name));
  };

  // Render organized category options
  const renderOrganizedCategories = () => {
    if (!categories || isCategoriesLoading) return null;
    const incomeCategories = categories.filter((cat) => cat.type === "income");
    const expenseCategories = categories.filter((cat) => cat.type === "expense");
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

  // Nivo theme
  const nivoTheme = {
    axis: { ticks: { text: { fill: textColor, fontSize: 11 } } },
    grid: { line: { stroke: gridColor, strokeWidth: 1 } },
    crosshair: { line: { stroke: textColor, strokeWidth: 1, strokeOpacity: 0.35 } },
  };

  // Axis formatters
  const axisLeftFormat = (v: number | string) => {
    const abs = Math.abs(Number(v));
    if (abs >= 100000) return `${sym}${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sym}${(abs / 1000).toFixed(1)}K`;
    if (abs === 0) return "";
    return `${sym}${v}`;
  };

  const isLoading = isCategoriesLoading || (isTrendDataLoading && !!selectedCategory);
  const hasData = barData.length > 0 && visibleSubcategories.length > 0;
  const isExpense = trendData?.category_type === "expense";
  const accentColor = isExpense ? expenseAccentColor : incomeAccentColor;
  const valueColor = isExpense ? expenseValueColor : positiveColor;

  if (isLoading) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor}>
        <Text color={secondaryTextColor}>Loading category data...</Text>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor} textAlign="center">
        <Icon as={TrendingDown} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">Unable to load category trend data</Text>
      </Box>
    );
  }

  const summaryCards = trendData?.summary && hasData ? [
    {
      icon: isExpense ? TrendingDown : TrendingUp,
      label: `Total ${trendData.category_name}`,
      accentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={valueColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(trendData.summary.total, sym).main}
          </Text>
          <Text fontSize="xs" color={valueColor} opacity={0.6}>
            {splitCurrencyForDisplay(trendData.summary.total, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: Activity,
      label: "Avg / Period",
      accentColor: avgAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(trendData.summary.average, sym).main}
          </Text>
          <Text fontSize="xs" color={primaryTextColor} opacity={0.6}>
            {splitCurrencyForDisplay(trendData.summary.average, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: ArrowUpRight,
      label: "Peak Period",
      accentColor: peakAccentColor,
      renderValue: () => (
        <VStack spacing={0} align="flex-start">
          <HStack spacing={0} align="baseline">
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
              {splitCurrencyForDisplay(trendData.summary.highest.amount, sym).main}
            </Text>
            <Text fontSize="xs" color={primaryTextColor} opacity={0.6}>
              {splitCurrencyForDisplay(trendData.summary.highest.amount, sym).decimals}
            </Text>
          </HStack>
          {trendData.summary.highest.period && (
            <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="600">
              in {formatPeriod(trendData.summary.highest.period)}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      icon: Layers,
      label: "Subcategories",
      accentColor: subcatAccentColor,
      renderValue: () => (
        <HStack spacing={1.5} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
            {uniqueSubcategories.length}
          </Text>
          {trendData.is_group && (
            <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
              in group
            </Text>
          )}
        </HStack>
      ),
    },
  ] : [];

  // Bar tooltip
  const barTooltip = ({ id, value, indexValue, color }: { id: string | number; value: number; indexValue: string | number; color: string }) => (
    <Box bg={tooltipBg} border="1px solid" borderColor={tooltipBorder} borderRadius="md" px={3} py={2} boxShadow="lg" fontSize="xs" minW="160px" whiteSpace="nowrap">
      <Text fontWeight="bold" color={textColor} mb={0.5}>{formatPeriod(String(indexValue))}</Text>
      <Flex align="center" gap={2}>
        <Box w={2} h={2} borderRadius="full" bg={color} flexShrink={0} />
        <Flex justify="space-between" flex={1} gap={3}>
          <Text color={textColor} opacity={0.7}>{String(id)}</Text>
          <Text fontWeight="600" color={color}>
            {splitCurrencyForDisplay(value, sym).main}
            {splitCurrencyForDisplay(value, sym).decimals}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );

  // Line tooltip
  const lineTooltip = ({ point }: any) => (
    <Box bg={tooltipBg} border="1px solid" borderColor={tooltipBorder} borderRadius="md" px={3} py={2} boxShadow="lg" fontSize="xs" minW="160px" whiteSpace="nowrap">
      <Text fontWeight="bold" color={textColor} mb={0.5}>{formatPeriod(String(point.data.xFormatted))}</Text>
      <Flex align="center" gap={2}>
        <Box w={2} h={2} borderRadius="full" bg={point.serieColor} flexShrink={0} />
        <Flex justify="space-between" flex={1} gap={3}>
          <Text color={textColor} opacity={0.7}>{String(point.serieId)}</Text>
          <Text fontWeight="600" color={point.serieColor}>
            {splitCurrencyForDisplay(Number(point.data.y), sym).main}
            {splitCurrencyForDisplay(Number(point.data.y), sym).decimals}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );

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
            <Icon as={TrendingUp} boxSize={4} color={iconColor} />
            <Heading as="h2" size="md" color={primaryTextColor} letterSpacing="-0.02em">
              Category Trend Analysis
            </Heading>
          </Flex>

          <Flex direction={{ base: "column", md: "row" }} gap={{ base: 2, md: 3 }} width={{ base: "full", md: "auto" }}>
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setHiddenSubcategories(new Set());
                setSelectedSubcategory(null);
              }}
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
              onChange={(e) => {
                setPeriodType(e.target.value);
                setSelectedSubcategory(null);
              }}
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

        {/* Summary Cards */}
        {summaryCards.length > 0 && (
          <MotionSimpleGrid
            columns={{ base: 2, sm: 4 }}
            spacing={{ base: 3, md: 4 }}
            mb={{ base: 4, md: 5 }}
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {summaryCards.map(({ icon, label, accentColor: ac, renderValue }) => (
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
                  _hover={{ borderColor: ac }}
                  h="full"
                >
                  <Box position="absolute" top={0} left={0} right={0} h="2px" bg={ac} opacity={0.7} />
                  <Flex align="center" gap={1.5} mb={2}>
                    <Flex w={5} h={5} borderRadius="md" bg={ac} opacity={0.12} position="absolute" />
                    <Flex w={5} h={5} borderRadius="md" align="center" justify="center">
                      <Icon as={icon} boxSize={3} color={ac} />
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

        {/* Chart + Subcategory Legend */}
        <Box width="full">
          {hasData ? (
            <>
              <Box height={{ base: "300px", md: "380px" }}>
                {shouldUseBarChart ? (
                  <ResponsiveBar
                    data={barData}
                    keys={visibleSubcategories}
                    indexBy="period"
                    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                    padding={0.35}
                    valueScale={{ type: "linear" }}
                    indexScale={{ type: "band", round: true }}
                    colors={(bar) => subcategoryColorMap[bar.id as string] || SUBCATEGORY_COLORS[0]}
                    borderRadius={2}
                    enableLabel={false}
                    motionConfig="gentle"
                    groupMode="stacked"
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: barData.length > 8 ? -45 : 0,
                      format: formatPeriod,
                      tickValues,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      format: axisLeftFormat,
                    }}
                    tooltip={barTooltip}
                    theme={nivoTheme}
                  />
                ) : (
                  <ResponsiveLine
                    data={lineData}
                    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                    xScale={{ type: "point" }}
                    yScale={{ type: "linear", min: 0, max: "auto", stacked: true }}
                    curve="monotoneX"
                    colors={(serie) => subcategoryColorMap[serie.id as string] || SUBCATEGORY_COLORS[0]}
                    lineWidth={2}
                    enablePoints={lineData[0]?.data.length <= 20}
                    pointSize={5}
                    pointColor={{ theme: "background" }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "serieColor" }}
                    enableArea={true}
                    areaOpacity={0.15}
                    useMesh={true}
                    enableCrosshair={true}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: (trendData?.trend_data?.length ?? 0) > 8 ? -45 : 0,
                      format: formatPeriod,
                      tickValues,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      format: axisLeftFormat,
                    }}
                    tooltip={lineTooltip}
                    theme={nivoTheme}
                  />
                )}
              </Box>

              {/* Interactive subcategory legend */}
              {uniqueSubcategories.length > 1 && (
                <Flex gap={2} justify="center" mt={3} wrap="wrap" px={2}>
                  {uniqueSubcategories.map((subcat) => {
                    const isHidden = hiddenSubcategories.has(subcat);
                    return (
                      <Flex
                        key={subcat}
                        align="center"
                        gap={1.5}
                        px={2}
                        py={1}
                        borderRadius="md"
                        cursor="pointer"
                        opacity={isHidden ? 0.35 : 1}
                        bg={selectedSubcategory === subcat ? legendHoverBg : "transparent"}
                        _hover={{ bg: legendHoverBg }}
                        transition="all 0.15s ease"
                        onClick={() => handleSubcategoryClick(subcat)}
                        onDoubleClick={(e) => { e.preventDefault(); toggleSubcategory(subcat); }}
                      >
                        <Box w={2.5} h={2.5} borderRadius="sm" bg={subcategoryColorMap[subcat]} flexShrink={0} opacity={isHidden ? 0.4 : 1} />
                        <Text fontSize="2xs" color={isHidden ? tertiaryTextColor : primaryTextColor} fontWeight="500" textDecoration={isHidden ? "line-through" : "none"}>
                          {subcat}
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
              )}

              {/* Subcategory breakdown table */}
              {subcategoryTotals.length > 1 && (
                <Box mt={4}>
                  <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} mb={2} px={1}>
                    Subcategory Breakdown
                  </Text>

                  {/* Desktop column headers */}
                  <Flex display={{ base: "none", md: "flex" }} px={3} pb={2}>
                    <Text flex={1} fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor}>
                      Subcategory
                    </Text>
                    <Text w="110px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                      Total
                    </Text>
                    <Text w="70px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                      Share
                    </Text>
                    <Text w="100px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                      Avg / Period
                    </Text>
                    <Text w="100px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                      Peak
                    </Text>
                  </Flex>

                  <VStack align="stretch" spacing={0}>
                    {subcategoryTotals.map((sub) => (
                      <Box key={sub.name}>
                        {/* Desktop row */}
                        <Flex
                          display={{ base: "none", md: "flex" }}
                          align="center"
                          px={3}
                          py={2}
                          cursor="pointer"
                          onClick={() => handleSubcategoryClick(sub.name)}
                          bg={selectedSubcategory === sub.name ? legendHoverBg : "transparent"}
                          borderLeft={selectedSubcategory === sub.name ? "2px solid" : "2px solid transparent"}
                          borderLeftColor={selectedSubcategory === sub.name ? sub.color : "transparent"}
                          _hover={{ bg: legendHoverBg }}
                          transition="all 0.15s ease"
                        >
                          <Flex flex={1} align="center" gap={2} minW={0}>
                            <Box w={2} h={2} borderRadius="sm" bg={sub.color} flexShrink={0} />
                            <Text fontSize="xs" fontWeight="600" color={primaryTextColor} isTruncated>{sub.name}</Text>
                          </Flex>
                          <HStack w="110px" spacing={0} justify="flex-end">
                            <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                              {splitCurrencyForDisplay(sub.total, sym).main}
                            </Text>
                            <Text fontSize="2xs" color={primaryTextColor} opacity={0.5}>
                              {splitCurrencyForDisplay(sub.total, sym).decimals}
                            </Text>
                          </HStack>
                          <Box w="70px" textAlign="right">
                            <Text fontSize="xs" fontWeight="600" color={tertiaryTextColor}>
                              {sub.percentage.toFixed(1)}%
                            </Text>
                          </Box>
                          <HStack w="100px" spacing={0} justify="flex-end">
                            <Text fontSize="xs" color={tertiaryTextColor}>
                              {splitCurrencyForDisplay(sub.average, sym).main}
                            </Text>
                            <Text fontSize="2xs" color={tertiaryTextColor} opacity={0.5}>
                              {splitCurrencyForDisplay(sub.average, sym).decimals}
                            </Text>
                          </HStack>
                          <HStack w="100px" spacing={0} justify="flex-end">
                            <Text fontSize="xs" color={tertiaryTextColor}>
                              {splitCurrencyForDisplay(sub.peak, sym).main}
                            </Text>
                            <Text fontSize="2xs" color={tertiaryTextColor} opacity={0.5}>
                              {splitCurrencyForDisplay(sub.peak, sym).decimals}
                            </Text>
                          </HStack>
                        </Flex>

                        {/* Mobile card */}
                        <Box
                          display={{ base: "block", md: "none" }}
                          px={3}
                          py={2.5}
                          borderTop="1px solid"
                          borderColor={sectionBorderColor}
                          cursor="pointer"
                          onClick={() => handleSubcategoryClick(sub.name)}
                          bg={selectedSubcategory === sub.name ? legendHoverBg : "transparent"}
                        >
                          <Flex align="center" gap={2} mb={1}>
                            <Box w={2} h={2} borderRadius="sm" bg={sub.color} flexShrink={0} />
                            <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>{sub.name}</Text>
                            <Text fontSize="2xs" color={tertiaryTextColor} ml="auto">{sub.percentage.toFixed(1)}%</Text>
                          </Flex>
                          <SimpleGrid columns={2} spacing={1} pl={4}>
                            <Box>
                              <Text fontSize="2xs" color={tertiaryTextColor}>Total</Text>
                              <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                {splitCurrencyForDisplay(sub.total, sym).main}
                                <Text as="span" fontSize="2xs" opacity={0.5}>{splitCurrencyForDisplay(sub.total, sym).decimals}</Text>
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="2xs" color={tertiaryTextColor}>Avg</Text>
                              <Text fontSize="xs" color={tertiaryTextColor}>
                                {splitCurrencyForDisplay(sub.average, sym).main}
                                <Text as="span" fontSize="2xs" opacity={0.5}>{splitCurrencyForDisplay(sub.average, sym).decimals}</Text>
                              </Text>
                            </Box>
                          </SimpleGrid>
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Subcategory drill-down panel */}
              <AnimatePresence>
                {selectedSubcatDetail && (
                  <MotionBox
                    key={selectedSubcategory}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    overflow="hidden"
                  >
                    <Box
                      mt={4}
                      p={{ base: 3, md: 4 }}
                      bg={cardBg}
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={sectionBorderColor}
                      position="relative"
                    >
                      <Box position="absolute" top={0} left={0} right={0} h="2px" bg={selectedSubcatDetail.color} opacity={0.7} borderTopRadius="xl" />

                      {/* Panel header */}
                      <Flex justify="space-between" align="center" mb={3}>
                        <Flex align="center" gap={2}>
                          <Box w={2.5} h={2.5} borderRadius="sm" bg={selectedSubcatDetail.color} flexShrink={0} />
                          <Text fontSize="sm" fontWeight="700" color={primaryTextColor}>
                            {selectedSubcatDetail.name}
                          </Text>
                          <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                            Period Details
                          </Text>
                        </Flex>
                        <Flex
                          as="button"
                          align="center"
                          justify="center"
                          w={6} h={6}
                          borderRadius="md"
                          cursor="pointer"
                          onClick={() => setSelectedSubcategory(null)}
                          _hover={{ bg: legendHoverBg }}
                          transition="background 0.15s ease"
                        >
                          <Icon as={X} boxSize={3.5} color={tertiaryTextColor} />
                        </Flex>
                      </Flex>

                      {/* Summary row */}
                      <Flex gap={{ base: 3, md: 6 }} mb={3} wrap="wrap">
                        <VStack spacing={0} align="flex-start">
                          <Text fontSize="2xs" color={columnHeaderColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Total</Text>
                          <HStack spacing={0}>
                            <Text fontSize="sm" fontWeight="700" color={valueColor}>
                              {splitCurrencyForDisplay(selectedSubcatDetail.total, sym).main}
                            </Text>
                            <Text fontSize="2xs" color={valueColor} opacity={0.6}>
                              {splitCurrencyForDisplay(selectedSubcatDetail.total, sym).decimals}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={0} align="flex-start">
                          <Text fontSize="2xs" color={columnHeaderColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Average</Text>
                          <Text fontSize="sm" fontWeight="600" color={primaryTextColor}>
                            {formatNumberAsCurrency(selectedSubcatDetail.average, sym)}
                          </Text>
                        </VStack>
                        <VStack spacing={0} align="flex-start">
                          <Text fontSize="2xs" color={columnHeaderColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Peak</Text>
                          <Text fontSize="sm" fontWeight="600" color={primaryTextColor}>
                            {formatNumberAsCurrency(selectedSubcatDetail.peak, sym)}
                            {selectedSubcatDetail.peakPeriod && (
                              <Text as="span" fontSize="2xs" color={tertiaryTextColor} ml={1}>
                                in {formatPeriod(selectedSubcatDetail.peakPeriod)}
                              </Text>
                            )}
                          </Text>
                        </VStack>
                        <VStack spacing={0} align="flex-start">
                          <Text fontSize="2xs" color={columnHeaderColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Share</Text>
                          <Text fontSize="sm" fontWeight="600" color={primaryTextColor}>
                            {selectedSubcatDetail.percentage.toFixed(1)}%
                          </Text>
                        </VStack>
                      </Flex>

                      {/* Period-by-period data */}
                      <Flex display={{ base: "none", md: "flex" }} px={3} pb={1.5}>
                        <Text flex={1} fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor}>
                          Period
                        </Text>
                        <Text w="120px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                          Amount
                        </Text>
                      </Flex>

                      <VStack align="stretch" spacing={0} maxH="240px" overflowY="auto">
                        {selectedSubcatDetail.periodData.map((pd, idx) => (
                          <Box key={pd.period}>
                            {/* Desktop row */}
                            <Flex
                              display={{ base: "none", md: "flex" }}
                              align="center"
                              px={3}
                              py={1.5}
                              _hover={{ bg: legendHoverBg }}
                              transition="background 0.15s ease"
                            >
                              <Text flex={1} fontSize="xs" color={primaryTextColor}>
                                {formatPeriod(pd.period)}
                              </Text>
                              <HStack w="120px" spacing={0} justify="flex-end">
                                <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                  {splitCurrencyForDisplay(pd.amount, sym).main}
                                </Text>
                                <Text fontSize="2xs" color={primaryTextColor} opacity={0.5}>
                                  {splitCurrencyForDisplay(pd.amount, sym).decimals}
                                </Text>
                              </HStack>
                            </Flex>

                            {/* Mobile row */}
                            <Flex
                              display={{ base: "flex", md: "none" }}
                              justify="space-between"
                              align="center"
                              px={3}
                              py={2}
                              borderTop={idx > 0 ? "1px solid" : "none"}
                              borderColor={sectionBorderColor}
                            >
                              <Text fontSize="xs" color={primaryTextColor}>
                                {formatPeriod(pd.period)}
                              </Text>
                              <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                {splitCurrencyForDisplay(pd.amount, sym).main}
                                <Text as="span" fontSize="2xs" opacity={0.5}>{splitCurrencyForDisplay(pd.amount, sym).decimals}</Text>
                              </Text>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  </MotionBox>
                )}
              </AnimatePresence>
            </>
          ) : (
            <Center height={{ base: "300px", md: "380px" }} borderRadius="lg" flexDirection="column" textAlign="center" p={6}>
              <Icon as={BarChart2} boxSize={6} color={tertiaryTextColor} mb={4} />
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
