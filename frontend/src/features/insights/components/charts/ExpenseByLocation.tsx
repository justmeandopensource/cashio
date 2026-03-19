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
  Select,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { MapPin, TrendingUp, PieChart as PieChartIcon, ChevronDown } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";
import config from "@/config";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionSimpleGrid = motion(SimpleGrid);

// Color palette for pie chart segments
const LOCATION_COLORS = [
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

interface LocationExpenseData {
  location: string;
  amount: number;
  percentage: number;
}

interface ExpenseByLocationResponse {
  location_data: LocationExpenseData[];
  total_expense: number;
  period_type: "all_time" | "last_12_months" | "this_month";
}

interface ExpenseByLocationProps {
  ledgerId?: string;
}

const periodOptions = [
  { value: "all_time", label: "All Time" },
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "this_month", label: "This Month" },
];

const ExpenseByLocation: React.FC<ExpenseByLocationProps> = ({ ledgerId }) => {
  const [periodType, setPeriodType] = useState<string>("all_time");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { currencySymbol } = useLedgerStore();

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

  // Fetch expense by location data
  const { data, isLoading, isError } = useQuery<ExpenseByLocationResponse>({
    queryKey: ["expenseByLocation", ledgerId, periodType],
    queryFn: async () => {
      if (!ledgerId) return null;

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/ledger/${ledgerId}/insights/expense-by-location?period_type=${periodType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch expense by location data");
      }

      return response.json();
    },
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  const totalExpense = data?.total_expense || 0;
  const hoveredItem = hoveredIdx !== null ? data?.location_data?.[hoveredIdx] ?? null : null;

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
      >
        <Text color={secondaryTextColor}>Loading expense by location data...</Text>
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
          Unable to load expense by location data
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
      icon: MapPin,
      label: "Locations Tracked",
      accentColor: countAccentColor,
      renderValue: () => (
        <Text
          fontSize={{ base: "lg", md: "xl" }}
          fontWeight="bold"
          color={primaryTextColor}
          lineHeight="short"
          letterSpacing="-0.01em"
        >
          {data?.location_data?.length ?? 0}
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
            <Icon as={MapPin} boxSize={4} color={iconColor} />
            <Heading
              as="h2"
              size="md"
              color={primaryTextColor}
              letterSpacing="-0.02em"
            >
              Expense by Location
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
        {data?.location_data && data.location_data.length > 0 && (
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
          {data?.location_data && data.location_data.length > 0 ? (
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              gap={5}
            >
              {/* Donut chart */}
              <Box
                position="relative"
                w={{ base: "260px", md: "full" }}
                h={{ base: "260px", md: "340px" }}
                minH="220px"
                flex={{ md: 2 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.location_data}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="82%"
                      dataKey="amount"
                      labelLine={false}
                      label={false}
                      onMouseEnter={(_, idx) => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      strokeWidth={0}
                      cornerRadius={3}
                      paddingAngle={2}
                    >
                      {data.location_data.map((_, idx) => (
                        <Cell
                          key={`location-${idx}`}
                          fill={LOCATION_COLORS[idx % LOCATION_COLORS.length]}
                          opacity={
                            hoveredIdx === null || hoveredIdx === idx ? 1 : 0.25
                          }
                          style={{
                            filter:
                              hoveredIdx === idx ? "brightness(1.1)" : "none",
                            transition:
                              "opacity 0.2s ease, filter 0.2s ease",
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

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
                          <Text
                            fontSize="xs"
                            fontWeight="600"
                            color={
                              LOCATION_COLORS[hoveredIdx! % LOCATION_COLORS.length]
                            }
                            lineHeight="short"
                            mb={0.5}
                          >
                            {hoveredItem.location}
                          </Text>
                          <Text
                            fontSize="md"
                            fontWeight="800"
                            color={primaryTextColor}
                            lineHeight="1.1"
                          >
                            {splitCurrencyForDisplay(hoveredItem.amount, sym).main}
                            <Text as="span" fontSize="xs" opacity={0.5}>
                              {splitCurrencyForDisplay(hoveredItem.amount, sym).decimals}
                            </Text>
                          </Text>
                          <Text
                            fontSize="xs"
                            fontWeight="600"
                            color={tertiaryTextColor}
                            mt={0.5}
                          >
                            {hoveredItem.percentage.toFixed(1)}%
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text
                            fontSize="2xs"
                            color={tertiaryTextColor}
                            fontWeight="500"
                          >
                            Hover to
                          </Text>
                          <Text
                            fontSize="2xs"
                            color={tertiaryTextColor}
                            fontWeight="500"
                          >
                            explore
                          </Text>
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
                minW={{ md: "180px" }}
                flex={{ md: 1 }}
                maxH={{ md: "340px" }}
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
                  Location Breakdown
                </Text>
                {data.location_data.map((location, idx) => {
                  const isActive = hoveredIdx === null || hoveredIdx === idx;
                  return (
                    <Flex
                      key={location.location}
                      align="center"
                      gap={2.5}
                      px={2.5}
                      py={2}
                      borderRadius="lg"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      cursor="default"
                      opacity={isActive ? 1 : 0.35}
                      bg={hoveredIdx === idx ? legendHoverBg : "transparent"}
                      transition="all 0.15s ease"
                    >
                      <Box
                        w={2.5}
                        h={2.5}
                        borderRadius="sm"
                        bg={LOCATION_COLORS[idx % LOCATION_COLORS.length]}
                        flexShrink={0}
                      />
                      <Box flex={1} minW={0}>
                        <Text
                          fontSize="xs"
                          color={primaryTextColor}
                          fontWeight="600"
                          isTruncated
                        >
                          {location.location}
                        </Text>
                        <Text
                          fontSize="2xs"
                          color={tertiaryTextColor}
                          fontWeight="500"
                        >
                          {location.percentage.toFixed(1)}%
                        </Text>
                      </Box>
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
                No Location Data Available
              </Heading>
              <Text color={secondaryTextColor} fontSize="sm">
                No expense transactions with location information found for the
                selected period.
              </Text>
            </Center>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(ExpenseByLocation);
