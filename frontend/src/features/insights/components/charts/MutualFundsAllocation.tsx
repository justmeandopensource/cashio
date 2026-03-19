import React, { useState, useMemo } from "react";
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
import { PieChart as PieChartIcon, TrendingUp, ChevronDown } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";
import { getAmcSummaries, getMutualFunds } from "@/features/mutual-funds/api";
import { AmcSummary, MutualFund } from "@/features/mutual-funds/types";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionSimpleGrid = motion(SimpleGrid);

const COLORS = [
  "#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899",
  "#06B6D4", "#F97316", "#14B8A6", "#A855F7", "#EF4444",
];

interface MutualFundsAllocationProps {
  ledgerId?: string;
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

const MutualFundsAllocation: React.FC<MutualFundsAllocationProps> = ({
  ledgerId,
}) => {
  const { currencySymbol } = useLedgerStore();
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Color modes
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const tertiaryTextColor = useColorModeValue("gray.500", "gray.400");
  const legendHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const selectBg = useColorModeValue("gray.50", "gray.700");

  const portfolioAccentColor = useColorModeValue("green.400", "green.300");
  const countAccentColor = useColorModeValue("blue.400", "blue.300");
  const sym = currencySymbol || "₹";

  // Fetch mutual funds data
  const { data: mutualFunds = [], isLoading: isLoadingFunds } = useQuery<MutualFund[]>({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch AMC summaries
  const { data: amcSummaries, isLoading: isLoadingSummaries, isError } = useQuery<AmcSummary[]>({
    queryKey: ["amc-summaries", ledgerId],
    queryFn: () => getAmcSummaries(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isLoadingFunds || isLoadingSummaries;

  // Filter funds by owner
  const filteredFunds = useMemo(() => {
    if (selectedOwner === "all") return mutualFunds;
    return mutualFunds.filter((fund) => fund.owner === selectedOwner);
  }, [mutualFunds, selectedOwner]);

  // Get unique owners for dropdown
  const availableOwners = useMemo(() => {
    return Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean))).sort();
  }, [mutualFunds]);

  // Calculate AMC summaries from filtered funds
  const filteredAmcSummaries = useMemo(() => {
    if (!filteredFunds.length || !amcSummaries) return [];

    const toNumber = (value: number | string): number =>
      typeof value === "string" ? parseFloat(value) : value;

    return amcSummaries.map(amc => {
      const amcFunds = filteredFunds.filter(fund => fund.amc_id === amc.amc_id);
      const currentValue = amcFunds.reduce((sum, fund) => sum + toNumber(fund.current_value), 0);
      return { name: amc.name, current_value: currentValue };
    });
  }, [filteredFunds, amcSummaries]);

  // Process data for chart
  const chartData: ChartData[] = useMemo(() => {
    if (!filteredAmcSummaries || filteredAmcSummaries.length === 0) return [];

    const dataWithValues = filteredAmcSummaries
      .filter(amc => Number(amc.current_value) > 0)
      .map((amc) => ({ name: amc.name, value: Number(amc.current_value) }))
      .sort((a, b) => b.value - a.value);

    const totalValue = dataWithValues.reduce((sum, item) => sum + item.value, 0);

    return dataWithValues.map(item => ({
      ...item,
      percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    }));
  }, [filteredAmcSummaries]);

  const totalPortfolioValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const hoveredItem = hoveredIdx !== null ? chartData[hoveredIdx] ?? null : null;

  if (isLoading) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor}>
        <Text color={secondaryTextColor}>Loading mutual funds allocation...</Text>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor} textAlign="center">
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">Unable to load mutual funds data</Text>
      </Box>
    );
  }

  const summaryCards = [
    {
      icon: TrendingUp,
      label: "Total Portfolio Value",
      accentColor: portfolioAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={positiveColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(totalPortfolioValue, sym).main}
          </Text>
          <Text fontSize="xs" color={positiveColor} opacity={0.6}>
            {splitCurrencyForDisplay(totalPortfolioValue, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: PieChartIcon,
      label: "AMCs Invested In",
      accentColor: countAccentColor,
      renderValue: () => (
        <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
          {chartData.length}
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
            <Icon as={PieChartIcon} boxSize={4} color={iconColor} />
            <Heading as="h2" size="md" color={primaryTextColor} letterSpacing="-0.02em">
              Mutual Funds - Value by AMC
            </Heading>
          </Flex>

          {availableOwners.length > 0 && (
            <Select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              maxW={{ base: "full", md: "220px" }}
              icon={<ChevronDown />}
              variant="filled"
              bg={selectBg}
              size="sm"
              borderRadius="lg"
              fontWeight="medium"
              fontSize="sm"
            >
              <option value="all">All Owners</option>
              {availableOwners.map((owner) => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </Select>
          )}
        </Flex>

        {/* Summary Cards */}
        {chartData.length > 0 && (
          <MotionSimpleGrid
            columns={{ base: 1, sm: 2 }}
            spacing={{ base: 3, md: 4 }}
            mb={{ base: 4, md: 5 }}
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {summaryCards.map(({ icon, label, accentColor, renderValue }) => (
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
                  _hover={{ borderColor: accentColor }}
                  h="full"
                >
                  <Box position="absolute" top={0} left={0} right={0} h="2px" bg={accentColor} opacity={0.7} />
                  <Flex align="center" gap={1.5} mb={2}>
                    <Flex w={5} h={5} borderRadius="md" bg={accentColor} opacity={0.12} position="absolute" />
                    <Flex w={5} h={5} borderRadius="md" align="center" justify="center">
                      <Icon as={icon} boxSize={3} color={accentColor} />
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

        {/* Chart + Legend */}
        <Box width="full">
          {chartData.length > 0 ? (
            <Flex direction={{ base: "column", md: "row" }} align="center" gap={5}>
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
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="82%"
                      dataKey="value"
                      labelLine={false}
                      label={false}
                      onMouseEnter={(_, idx) => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      strokeWidth={0}
                      cornerRadius={3}
                      paddingAngle={2}
                    >
                      {chartData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={COLORS[idx % COLORS.length]}
                          opacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.25}
                          style={{
                            filter: hoveredIdx === idx ? "brightness(1.1)" : "none",
                            transition: "opacity 0.2s ease, filter 0.2s ease",
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Animated center label */}
                <Center position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none">
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
                          <Text fontSize="xs" fontWeight="600" color={COLORS[hoveredIdx! % COLORS.length]} lineHeight="short" mb={0.5}>
                            {hoveredItem.name}
                          </Text>
                          <Text fontSize="md" fontWeight="800" color={primaryTextColor} lineHeight="1.1">
                            {splitCurrencyForDisplay(hoveredItem.value, sym).main}
                            <Text as="span" fontSize="xs" opacity={0.5}>
                              {splitCurrencyForDisplay(hoveredItem.value, sym).decimals}
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
                align="stretch" spacing={1}
                w={{ base: "full", md: "auto" }}
                minW={{ md: "180px" }}
                flex={{ md: 1 }}
                maxH={{ md: "340px" }}
                overflowY="auto"
              >
                <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} mb={1} px={2.5}>
                  AMC Overview
                </Text>
                {chartData.map((item, idx) => {
                  const isActive = hoveredIdx === null || hoveredIdx === idx;
                  return (
                    <Flex
                      key={item.name}
                      align="center" gap={2.5} px={2.5} py={2}
                      borderRadius="lg"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      cursor="default"
                      opacity={isActive ? 1 : 0.35}
                      bg={hoveredIdx === idx ? legendHoverBg : "transparent"}
                      transition="all 0.15s ease"
                    >
                      <Box w={2.5} h={2.5} borderRadius="sm" bg={COLORS[idx % COLORS.length]} flexShrink={0} />
                      <Box flex={1} minW={0}>
                        <Text fontSize="xs" color={primaryTextColor} fontWeight="600" isTruncated>{item.name}</Text>
                        <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">{item.percentage.toFixed(1)}%</Text>
                      </Box>
                    </Flex>
                  );
                })}
              </VStack>
            </Flex>
          ) : (
            <Center height="300px" borderRadius="lg" flexDirection="column" textAlign="center" p={6}>
              <Icon as={PieChartIcon} boxSize={6} color={tertiaryTextColor} mb={4} />
              <Heading size="md" mb={2} color={secondaryTextColor}>No Mutual Funds Data Available</Heading>
              <Text color={secondaryTextColor} fontSize="sm">Add mutual fund investments to see your portfolio allocation.</Text>
            </Center>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(MutualFundsAllocation);
