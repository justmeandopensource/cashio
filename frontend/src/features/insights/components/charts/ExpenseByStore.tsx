import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Select,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsivePie } from "@nivo/pie";
import { useQuery } from "@tanstack/react-query";
import { Store, TrendingUp, PieChart as PieChartIcon, ChevronDown, X } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";
import api from "@/lib/api";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);
const MotionSimpleGrid = motion.create(SimpleGrid);

// Color palette for pie chart segments
const STORE_COLORS = [
  "#3B82F6",
  "#F59E0B",
  "#10B981",
  "#3182CE",
  "#38B2AC",
  "#0BC5EA",
  "#319795",
  "#2B6CB0",
  "#00B5D8",
  "#2C7A7B",
];

const CATEGORY_COLORS = [
  "#8B5CF6", "#EC4899", "#F97316", "#14B8A6", "#A855F7",
  "#EF4444", "#06B6D4", "#84CC16", "#F59E0B", "#6366F1",
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

interface CategoryExpenseData {
  category_id: number;
  category: string;
  amount: number;
  percentage: number;
}

interface StoreCategoryBreakdownResponse {
  store: string;
  category_data: CategoryExpenseData[];
  total_expense: number;
  period_type: string;
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const navigate = useNavigate();

  const handleCategoryClick = useCallback((categoryId: number, storeName: string) => {
    const params = new URLSearchParams();
    params.set("tab", "transactions");
    params.set("transaction_type", "expense");
    params.set("store", storeName);
    params.set("category_id", String(categoryId));
    if (periodType === "this_month") {
      const now = new Date();
      params.set("from_date", new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
      params.set("to_date", new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString());
    } else if (periodType === "last_12_months") {
      const now = new Date();
      const from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
      params.set("from_date", from.toISOString());
      params.set("to_date", now.toISOString());
    }
    navigate(`/ledger?${params.toString()}`);
  }, [navigate, periodType]);

  // Color modes
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const tertiaryTextColor = useColorModeValue("gray.500", "gray.400");
  const legendHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const expenseValueColor = useColorModeValue("red.500", "red.400");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const selectBg = useColorModeValue("gray.50", "gray.700");

  const expenseAccentColor = useColorModeValue("red.400", "red.300");
  const countAccentColor = useColorModeValue("blue.400", "blue.300");
  const sym = currencySymbol || "₹";

  // Fetch expense by store data
  const { data, isLoading, isError } = useQuery<ExpenseByStoreResponse>({
    queryKey: ["expenseByStore", ledgerId, periodType],
    queryFn: async () => {
      if (!ledgerId) return null;

      const response = await api.get(
        `/ledger/${ledgerId}/insights/expense-by-store?period_type=${periodType}`,
      );
      return response.data;
    },
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch category breakdown for selected store
  const { data: categoryData, isLoading: isCategoryLoading } = useQuery<StoreCategoryBreakdownResponse>({
    queryKey: ["storeCategoryBreakdown", ledgerId, selectedStoreName, periodType],
    queryFn: async () => {
      if (!ledgerId || !selectedStoreName) return null;

      const response = await api.get(
        `/ledger/${ledgerId}/insights/expense-by-store/categories?store_name=${encodeURIComponent(selectedStoreName)}&period_type=${periodType}`,
      );
      return response.data;
    },
    enabled: !!ledgerId && !!selectedStoreName,
    staleTime: 1000 * 60 * 5,
  });

  const totalExpense = data?.total_expense || 0;

  // Transform data for nivo pie chart
  const chartData = (data?.store_data ?? []).map((store, idx) => ({
    id: store.store,
    label: store.store,
    value: store.amount,
    percentage: store.percentage,
    color: STORE_COLORS[idx % STORE_COLORS.length],
  }));

  const hoveredItem = hoveredIdx !== null ? data?.store_data?.[hoveredIdx] ?? null : null;

  const selectedStoreColor = selectedStoreName
    ? chartData.find(d => d.id === selectedStoreName)?.color ?? STORE_COLORS[0]
    : STORE_COLORS[0];

  const handleStoreClick = (storeName: string) => {
    setSelectedStoreName(prev => (prev === storeName ? null : storeName));
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
      >
        <Text color={secondaryTextColor}>Loading expense by store data...</Text>
      </Box>
    );
  }

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
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load expense by store data
        </Text>
      </Box>
    );
  }

  const summaryCards = [
    {
      icon: TrendingUp,
      label: "Total Expense",
      accentColor: expenseAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="bold"
            color={expenseValueColor}
            lineHeight="short"
            letterSpacing="-0.01em"
          >
            {splitCurrencyForDisplay(totalExpense, sym).main}
          </Text>
          <Text fontSize="xs" color={expenseValueColor} opacity={0.6}>
            {splitCurrencyForDisplay(totalExpense, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: Store,
      label: "Stores Tracked",
      accentColor: countAccentColor,
      renderValue: () => (
        <Text
          fontSize={{ base: "lg", md: "xl" }}
          fontWeight="bold"
          color={primaryTextColor}
          lineHeight="short"
          letterSpacing="-0.01em"
        >
          {data?.store_data?.length ?? 0}
        </Text>
      ),
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
            <Icon as={Store} boxSize={4} color={iconColor} />
            <Heading
              as="h2"
              size="md"
              color={primaryTextColor}
              letterSpacing="-0.02em"
            >
              Expense by Store
            </Heading>
          </Flex>

          <Select
            value={periodType}
            onChange={(e) => {
              setPeriodType(e.target.value);
              setSelectedStoreName(null);
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

        {/* Summary Cards */}
        {data?.store_data && data.store_data.length > 0 && (
          <MotionSimpleGrid
            columns={{ base: 1, sm: 2 }}
            spacing={{ base: 3, md: 4 }}
            mb={{ base: 4, md: 5 }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {summaryCards.map(({ icon, label, accentColor, renderValue }) => (
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
                  {renderValue()}
                </Box>
              </MotionBox>
            ))}
          </MotionSimpleGrid>
        )}

        {/* Chart + Legend */}
        <Box width="full">
          {data?.store_data && data.store_data.length > 0 ? (
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              gap={5}
            >
              {/* Donut chart */}
              <Box
                position="relative"
                w={{ base: "280px", md: "full" }}
                h={{ base: "280px", md: "360px" }}
                minH="220px"
                flex={{ md: 2 }}
              >
                <ResponsivePie
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  innerRadius={0.55}
                  padAngle={2}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ datum: "data.color" }}
                  borderWidth={0}
                  enableArcLinkLabels={false}
                  enableArcLabels={false}
                  motionConfig="gentle"
                  transitionMode="pushIn"
                  onMouseEnter={(datum) => {
                    const idx = chartData.findIndex(d => d.id === datum.id);
                    setHoveredIdx(idx >= 0 ? idx : null);
                  }}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={(datum) => handleStoreClick(datum.id as string)}
                  tooltip={() => <></>}
                />

                {/* Animated center label */}
                <Center
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  pointerEvents="none"
                >
                  <AnimatePresence mode="wait">
                    <MotionFlex
                      key={hoveredIdx ?? "default"}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      direction="column"
                      align="center"
                      textAlign="center"
                      px={3}
                    >
                      {hoveredItem ? (
                        <>
                          <Text fontSize="xs" fontWeight="600" color={STORE_COLORS[hoveredIdx! % STORE_COLORS.length]} lineHeight="short" mb={0.5}>
                            {hoveredItem.store}
                          </Text>
                          <Text fontSize="md" fontWeight="800" color={primaryTextColor} lineHeight="1.1">
                            {splitCurrencyForDisplay(hoveredItem.amount, sym).main}
                            <Text as="span" fontSize="xs" opacity={0.5}>
                              {splitCurrencyForDisplay(hoveredItem.amount, sym).decimals}
                            </Text>
                          </Text>
                          <Text fontSize="xs" fontWeight="600" color={tertiaryTextColor} mt={0.5}>
                            {hoveredItem.percentage.toFixed(1)}%
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">Hover to</Text>
                          <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">explore</Text>
                        </>
                      )}
                    </MotionFlex>
                  </AnimatePresence>
                </Center>
              </Box>

              {/* Legend */}
              <VStack
                align="stretch"
                spacing={1}
                w={{ base: "full", md: "auto" }}
                minW={{ md: "220px" }}
                flex={{ md: 1 }}
                maxH={{ md: "360px" }}
                overflowY="auto"
              >
                <Text
                  fontSize="2xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color={columnHeaderColor}
                  mb={1}
                  px={2.5}
                >
                  Store Breakdown
                </Text>
                {chartData.map((item, idx) => {
                  const isActive = hoveredIdx === null || hoveredIdx === idx;
                  return (
                    <Flex
                      key={item.id}
                      direction="column"
                      gap={0.5}
                      px={2.5}
                      py={2}
                      borderRadius="lg"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => handleStoreClick(item.id)}
                      cursor="pointer"
                      opacity={isActive ? 1 : 0.35}
                      bg={hoveredIdx === idx || selectedStoreName === item.id ? legendHoverBg : "transparent"}
                      borderLeft={selectedStoreName === item.id ? "2px solid" : "2px solid transparent"}
                      borderLeftColor={selectedStoreName === item.id ? item.color : "transparent"}
                      transition="all 0.15s ease"
                    >
                      {/* Row 1: color + name + value */}
                      <Flex align="center" justify="space-between" gap={2}>
                        <Flex align="center" gap={2} minW={0} flex={1}>
                          <Box w={2.5} h={2.5} borderRadius="sm" bg={item.color} flexShrink={0} />
                          <Text fontSize="xs" color={primaryTextColor} fontWeight="600" isTruncated>{item.label}</Text>
                        </Flex>
                        <HStack spacing={0} flexShrink={0}>
                          <Text fontSize="xs" color={primaryTextColor} fontWeight="700">
                            {splitCurrencyForDisplay(item.value, sym).main}
                          </Text>
                          <Text fontSize="2xs" color={primaryTextColor} opacity={0.5}>
                            {splitCurrencyForDisplay(item.value, sym).decimals}
                          </Text>
                        </HStack>
                      </Flex>
                      {/* Row 2: percentage */}
                      <Flex align="center" justify="space-between" pl={4.5}>
                        <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                          {item.percentage.toFixed(1)}%
                        </Text>
                      </Flex>
                    </Flex>
                  );
                })}
              </VStack>
            </Flex>
          ) : (
            <Center
              height="300px"
              borderRadius="lg"
              flexDirection="column"
              textAlign="center"
              p={6}
            >
              <Icon
                as={PieChartIcon}
                boxSize={6}
                color={tertiaryTextColor}
                mb={4}
              />
              <Heading size="md" mb={2} color={secondaryTextColor}>
                No Store Data Available
              </Heading>
              <Text color={secondaryTextColor} fontSize="sm">
                No expense transactions with store information found for the
                selected period.
              </Text>
            </Center>
          )}

          {/* Category drill-down panel */}
          <AnimatePresence>
            {selectedStoreName && (
              <MotionBox
                key={selectedStoreName}
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
                  <Box position="absolute" top={0} left={0} right={0} h="2px" bg={selectedStoreColor} opacity={0.7} borderTopRadius="xl" />

                  {/* Panel header */}
                  <Flex justify="space-between" align="center" mb={3}>
                    <Flex align="center" gap={2}>
                      <Box w={2.5} h={2.5} borderRadius="sm" bg={selectedStoreColor} flexShrink={0} />
                      <Text fontSize="sm" fontWeight="700" color={primaryTextColor}>
                        {selectedStoreName}
                      </Text>
                      <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                        Category Breakdown
                      </Text>
                    </Flex>
                    <Flex
                      as="button"
                      align="center"
                      justify="center"
                      w={6} h={6}
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => setSelectedStoreName(null)}
                      _hover={{ bg: legendHoverBg }}
                      transition="background 0.15s ease"
                    >
                      <Icon as={X} boxSize={3.5} color={tertiaryTextColor} />
                    </Flex>
                  </Flex>

                  {isCategoryLoading ? (
                    <Text fontSize="xs" color={secondaryTextColor} py={4} textAlign="center">
                      Loading category breakdown...
                    </Text>
                  ) : categoryData?.category_data && categoryData.category_data.length > 0 ? (
                    <VStack align="stretch" spacing={0}>
                      {/* Column headers */}
                      <Flex
                        display={{ base: "none", md: "flex" }}
                        px={3}
                        pb={2}
                      >
                        <Text flex={1} fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor}>
                          Category
                        </Text>
                        <Text w="120px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                          Amount
                        </Text>
                        <Text w="70px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                          Share
                        </Text>
                      </Flex>

                      {categoryData.category_data.map((cat, idx) => (
                        <Box key={cat.category}>
                          {/* Desktop row */}
                          <Flex
                            display={{ base: "none", md: "flex" }}
                            align="center"
                            px={3}
                            py={2}
                            cursor="pointer"
                            borderRadius="md"
                            _hover={{ bg: legendHoverBg }}
                            transition="background 0.15s ease"
                            onClick={() => handleCategoryClick(cat.category_id, selectedStoreName!)}
                          >
                            <Flex flex={1} align="center" gap={2} minW={0}>
                              <Box w={2} h={2} borderRadius="sm" bg={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} flexShrink={0} />
                              <Text fontSize="xs" fontWeight="600" color={primaryTextColor} isTruncated>
                                {cat.category}
                              </Text>
                            </Flex>
                            <HStack w="120px" spacing={0} justify="flex-end">
                              <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                {splitCurrencyForDisplay(cat.amount, sym).main}
                              </Text>
                              <Text fontSize="2xs" color={primaryTextColor} opacity={0.5}>
                                {splitCurrencyForDisplay(cat.amount, sym).decimals}
                              </Text>
                            </HStack>
                            <Box w="70px" textAlign="right">
                              <Text fontSize="xs" fontWeight="600" color={tertiaryTextColor}>
                                {cat.percentage.toFixed(1)}%
                              </Text>
                            </Box>
                          </Flex>

                          {/* Mobile card */}
                          <Box
                            display={{ base: "block", md: "none" }}
                            px={3}
                            py={2.5}
                            borderTop={idx > 0 ? "1px solid" : "none"}
                            borderColor={sectionBorderColor}
                            cursor="pointer"
                            onClick={() => handleCategoryClick(cat.category_id, selectedStoreName!)}
                          >
                            <Flex align="center" gap={2} mb={1}>
                              <Box w={2} h={2} borderRadius="sm" bg={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} flexShrink={0} />
                              <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                {cat.category}
                              </Text>
                            </Flex>
                            <Flex justify="space-between" pl={4}>
                              <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                {splitCurrencyForDisplay(cat.amount, sym).main}
                                <Text as="span" fontSize="2xs" opacity={0.5}>{splitCurrencyForDisplay(cat.amount, sym).decimals}</Text>
                              </Text>
                              <Text fontSize="xs" fontWeight="600" color={tertiaryTextColor}>
                                {cat.percentage.toFixed(1)}%
                              </Text>
                            </Flex>
                          </Box>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="xs" color={secondaryTextColor} py={4} textAlign="center">
                      No category data available for this store.
                    </Text>
                  )}
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(ExpenseByStore);
