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
import { ResponsivePie } from "@nivo/pie";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart as PieChartIcon,
  TrendingUp,
  ChevronDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import {
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
  calculateAmcSummary,
} from "../../../mutual-funds/utils";
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
  id: string;
  label: string;
  value: number;
  percentage: number;
  totalInvested: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  totalFunds: number;
  totalRealizedGain: number;
  color: string;
}

const toNumber = (value: number | string): number => {
  if (value === undefined || value === null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

const MutualFundsAllocation: React.FC<MutualFundsAllocationProps> = ({
  ledgerId,
}) => {
  const { currencySymbol } = useLedgerStore();
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedAmcName, setSelectedAmcName] = useState<string | null>(null);

  // Color modes
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const tertiaryTextColor = useColorModeValue("gray.500", "gray.400");
  const legendHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const selectBg = useColorModeValue("gray.50", "gray.700");

  // Dynamic accent colors
  const portfolioAccentColor = useColorModeValue("green.400", "green.300");
  const investedAccentColor = useColorModeValue("blue.400", "blue.300");
  const pnlPositiveColor = useColorModeValue("green.500", "green.300");
  const pnlNegativeColor = useColorModeValue("red.500", "red.300");
  const fundsAccentColor = useColorModeValue("purple.400", "purple.300");

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

  // Calculate full AMC summaries from filtered funds
  const filteredAmcData = useMemo(() => {
    if (!filteredFunds.length || !amcSummaries) return [];

    const amcGroups = new Map<number, MutualFund[]>();
    filteredFunds.forEach(fund => {
      const existing = amcGroups.get(fund.amc_id) || [];
      existing.push(fund);
      amcGroups.set(fund.amc_id, existing);
    });

    return Array.from(amcGroups.entries())
      .map(([, funds]) => calculateAmcSummary(funds))
      .filter(amc => toNumber(amc.current_value) > 0);
  }, [filteredFunds, amcSummaries]);

  // Process data for nivo pie chart
  const chartData: ChartData[] = useMemo(() => {
    if (!filteredAmcData.length) return [];

    const sorted = [...filteredAmcData].sort(
      (a, b) => toNumber(b.current_value) - toNumber(a.current_value)
    );
    const totalValue = sorted.reduce((sum, amc) => sum + toNumber(amc.current_value), 0);

    return sorted.map((amc, idx) => ({
      id: amc.name,
      label: amc.name,
      value: toNumber(amc.current_value),
      percentage: totalValue > 0 ? (toNumber(amc.current_value) / totalValue) * 100 : 0,
      totalInvested: toNumber(amc.total_invested),
      unrealizedPnl: toNumber(amc.unrealized_pnl),
      unrealizedPnlPct: toNumber(amc.unrealized_pnl_percentage),
      totalFunds: amc.total_funds,
      totalRealizedGain: toNumber(amc.total_realized_gain),
      color: COLORS[idx % COLORS.length],
    }));
  }, [filteredAmcData]);

  // Aggregate totals
  const totalPortfolioValue = chartData.reduce((sum, d) => sum + d.value, 0);
  const totalInvested = chartData.reduce((sum, d) => sum + d.totalInvested, 0);
  const totalUnrealizedPnl = totalPortfolioValue - totalInvested;
  const totalUnrealizedPnlPct = totalInvested > 0 ? (totalUnrealizedPnl / totalInvested) * 100 : 0;
  const totalFundCount = filteredFunds.length;

  const hoveredItem = hoveredId ? chartData.find(d => d.id === hoveredId) ?? null : null;
  const hoveredIdx = hoveredId ? chartData.findIndex(d => d.id === hoveredId) : null;
  const isPnlPositive = totalUnrealizedPnl >= 0;

  // Funds for the selected AMC drill-down, grouped by owner
  const selectedAmcFundsByOwner = useMemo(() => {
    if (!selectedAmcName) return [];
    const funds = filteredFunds
      .filter(fund => (fund.amc?.name || "") === selectedAmcName && toNumber(fund.total_units) > 0)
      .map(fund => {
        const currentValue = toNumber(fund.current_value);
        const invested = toNumber(fund.total_invested_cash);
        const pnl = currentValue - invested;
        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
        return { fund, currentValue, invested, pnl, pnlPct };
      })
      .sort((a, b) => b.currentValue - a.currentValue);

    const groups = new Map<string, typeof funds>();
    funds.forEach(item => {
      const owner = item.fund.owner || "Unassigned";
      const existing = groups.get(owner) || [];
      existing.push(item);
      groups.set(owner, existing);
    });

    return Array.from(groups.entries())
      .map(([owner, items]) => ({ owner, items }))
      .sort((a, b) => {
        const aTotal = a.items.reduce((s, i) => s + i.currentValue, 0);
        const bTotal = b.items.reduce((s, i) => s + i.currentValue, 0);
        return bTotal - aTotal;
      });
  }, [selectedAmcName, filteredFunds]);

  const selectedAmcFundCount = selectedAmcFundsByOwner.reduce((s, g) => s + g.items.length, 0);

  const selectedAmcColor = selectedAmcName
    ? chartData.find(d => d.id === selectedAmcName)?.color ?? COLORS[0]
    : COLORS[0];

  const handleAmcClick = (amcName: string) => {
    setSelectedAmcName(prev => (prev === amcName ? null : amcName));
  };

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
      label: "Current Value",
      accentColor: portfolioAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={pnlPositiveColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(totalPortfolioValue, sym).main}
          </Text>
          <Text fontSize="xs" color={pnlPositiveColor} opacity={0.6}>
            {splitCurrencyForDisplay(totalPortfolioValue, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: Wallet,
      label: "Total Invested",
      accentColor: investedAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(totalInvested, sym).main}
          </Text>
          <Text fontSize="xs" color={primaryTextColor} opacity={0.6}>
            {splitCurrencyForDisplay(totalInvested, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: isPnlPositive ? ArrowUpRight : ArrowDownRight,
      label: "Unrealized P&L",
      accentColor: isPnlPositive ? portfolioAccentColor : pnlNegativeColor,
      renderValue: () => {
        const pnlColor = isPnlPositive ? pnlPositiveColor : pnlNegativeColor;
        const pctDisplay = splitPercentageForDisplay(totalUnrealizedPnlPct);
        return (
          <VStack spacing={0} align="flex-start">
            <HStack spacing={0} align="baseline">
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={pnlColor} lineHeight="short" letterSpacing="-0.01em">
                {isPnlPositive ? "+" : "-"}{splitCurrencyForDisplay(Math.abs(totalUnrealizedPnl), sym).main}
              </Text>
              <Text fontSize="xs" color={pnlColor} opacity={0.6}>
                {splitCurrencyForDisplay(Math.abs(totalUnrealizedPnl), sym).decimals}
              </Text>
            </HStack>
            <Text fontSize="2xs" color={pnlColor} fontWeight="600" opacity={0.8}>
              {isPnlPositive ? "+" : "-"}{pctDisplay.main}{pctDisplay.decimals}
            </Text>
          </VStack>
        );
      },
    },
    {
      icon: PieChartIcon,
      label: "Total Funds",
      accentColor: fundsAccentColor,
      renderValue: () => (
        <HStack spacing={1.5} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
            {totalFundCount}
          </Text>
          <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
            across {chartData.length} AMC{chartData.length !== 1 ? "s" : ""}
          </Text>
        </HStack>
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
            columns={{ base: 2, sm: 4 }}
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
                  onMouseEnter={(datum) => setHoveredId(datum.id as string)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={(datum) => handleAmcClick(datum.id as string)}
                  tooltip={() => <></>}
                />

                {/* Animated center label */}
                <Center position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none">
                  <AnimatePresence mode="wait">
                    <MotionFlex
                      key={hoveredId ?? "default"}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      direction="column"
                      align="center"
                      textAlign="center"
                      px={3}
                    >
                      {hoveredItem && hoveredIdx !== null ? (
                        <>
                          <Text fontSize="xs" fontWeight="600" color={COLORS[hoveredIdx % COLORS.length]} lineHeight="short" mb={0.5}>
                            {hoveredItem.label}
                          </Text>
                          <Text fontSize="md" fontWeight="800" color={primaryTextColor} lineHeight="1.1">
                            {splitCurrencyForDisplay(hoveredItem.value, sym).main}
                            <Text as="span" fontSize="xs" opacity={0.5}>
                              {splitCurrencyForDisplay(hoveredItem.value, sym).decimals}
                            </Text>
                          </Text>
                          <Text fontSize="2xs" fontWeight="600" color={hoveredItem.unrealizedPnl >= 0 ? pnlPositiveColor : pnlNegativeColor} mt={0.5}>
                            {hoveredItem.unrealizedPnl >= 0 ? "+" : ""}{hoveredItem.unrealizedPnlPct.toFixed(1)}%
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
                minW={{ md: "220px" }}
                flex={{ md: 1 }}
                maxH={{ md: "360px" }}
                overflowY="auto"
              >
                <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} mb={1} px={2.5}>
                  AMC Overview
                </Text>
                {chartData.map((item) => {
                  const isActive = hoveredId === null || hoveredId === item.id;
                  const itemPnlPositive = item.unrealizedPnl >= 0;
                  return (
                    <Flex
                      key={item.id}
                      direction="column"
                      gap={0.5}
                      px={2.5}
                      py={2}
                      borderRadius="lg"
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleAmcClick(item.id)}
                      cursor="pointer"
                      opacity={isActive ? 1 : 0.35}
                      bg={hoveredId === item.id || selectedAmcName === item.id ? legendHoverBg : "transparent"}
                      borderLeft={selectedAmcName === item.id ? "2px solid" : "2px solid transparent"}
                      borderLeftColor={selectedAmcName === item.id ? item.color : "transparent"}
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
                      {/* Row 2: allocation + funds + P&L % */}
                      <Flex align="center" justify="space-between" pl={4.5}>
                        <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                          {item.percentage.toFixed(1)}% · {item.totalFunds} fund{item.totalFunds !== 1 ? "s" : ""}
                        </Text>
                        <Text fontSize="2xs" fontWeight="600" color={itemPnlPositive ? pnlPositiveColor : pnlNegativeColor}>
                          {itemPnlPositive ? "+" : ""}{item.unrealizedPnlPct.toFixed(1)}%
                        </Text>
                      </Flex>
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

          {/* Fund drill-down panel */}
          <AnimatePresence>
            {selectedAmcName && selectedAmcFundsByOwner.length > 0 && (
              <MotionBox
                key={selectedAmcName}
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
                  <Box position="absolute" top={0} left={0} right={0} h="2px" bg={selectedAmcColor} opacity={0.7} borderTopRadius="xl" />

                  {/* Panel header */}
                  <Flex justify="space-between" align="center" mb={3}>
                    <Flex align="center" gap={2}>
                      <Box w={2.5} h={2.5} borderRadius="sm" bg={selectedAmcColor} flexShrink={0} />
                      <Text fontSize="sm" fontWeight="700" color={primaryTextColor}>
                        {selectedAmcName}
                      </Text>
                      <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                        {selectedAmcFundCount} fund{selectedAmcFundCount !== 1 ? "s" : ""}
                      </Text>
                    </Flex>
                    <Flex
                      as="button"
                      align="center"
                      justify="center"
                      w={6} h={6}
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => setSelectedAmcName(null)}
                      _hover={{ bg: legendHoverBg }}
                      transition="background 0.15s ease"
                    >
                      <Icon as={X} boxSize={3.5} color={tertiaryTextColor} />
                    </Flex>
                  </Flex>

                  {/* Fund rows grouped by owner */}
                  <VStack align="stretch" spacing={3}>
                    {selectedAmcFundsByOwner.map(({ owner, items }) => {
                      const groupValue = items.reduce((s, i) => s + i.currentValue, 0);
                      const groupInvested = items.reduce((s, i) => s + i.invested, 0);
                      const groupPnl = groupValue - groupInvested;
                      const groupPnlPositive = groupPnl >= 0;
                      return (
                        <Box
                          key={owner}
                          border="1px solid"
                          borderColor={sectionBorderColor}
                          borderRadius="lg"
                          overflow="hidden"
                        >
                          {/* Owner header bar */}
                          <Flex
                            align="center"
                            justify="space-between"
                            px={3}
                            py={2}
                            bg={legendHoverBg}
                          >
                            <Flex align="center" gap={2}>
                              <Text fontSize="xs" fontWeight="700" color={primaryTextColor}>
                                {owner}
                              </Text>
                              <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                                {items.length} fund{items.length !== 1 ? "s" : ""}
                              </Text>
                            </Flex>
                            <Flex align="center" gap={3}>
                              <HStack spacing={0}>
                                <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                  {splitCurrencyForDisplay(groupValue, sym).main}
                                </Text>
                                <Text fontSize="2xs" color={primaryTextColor} opacity={0.5}>
                                  {splitCurrencyForDisplay(groupValue, sym).decimals}
                                </Text>
                              </HStack>
                              <Text fontSize="2xs" fontWeight="600" color={groupPnlPositive ? pnlPositiveColor : pnlNegativeColor}>
                                {groupPnlPositive ? "+" : ""}{(groupInvested > 0 ? (groupPnl / groupInvested) * 100 : 0).toFixed(1)}%
                              </Text>
                            </Flex>
                          </Flex>

                          {/* Desktop column headers */}
                          <Flex
                            display={{ base: "none", md: "flex" }}
                            px={3}
                            pt={2}
                            pb={1.5}
                          >
                            <Text flex={1} fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor}>
                              Fund
                            </Text>
                            <Text w="100px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                              Value
                            </Text>
                            <Text w="100px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                              Invested
                            </Text>
                            <Text w="90px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                              P&L
                            </Text>
                            <Text w="60px" fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} textAlign="right">
                              XIRR
                            </Text>
                          </Flex>

                          {/* Funds in this owner group */}
                          {items.map(({ fund, currentValue, invested, pnl, pnlPct }) => {
                            const fundPnlPositive = pnl >= 0;
                            const fundPnlColor = fundPnlPositive ? pnlPositiveColor : pnlNegativeColor;
                            const xirr = fund.xirr_percentage;
                            const hasXirr = xirr !== null && xirr !== undefined;

                            return (
                              <Box key={fund.mutual_fund_id}>
                                {/* Desktop row */}
                                <Flex
                                  display={{ base: "none", md: "flex" }}
                                  align="center"
                                  px={3}
                                  py={2}
                                  _hover={{ bg: legendHoverBg }}
                                  transition="background 0.15s ease"
                                >
                                  <Box flex={1} minW={0}>
                                    <Text fontSize="xs" fontWeight="600" color={primaryTextColor} isTruncated>
                                      {fund.name}
                                    </Text>
                                  </Box>
                                  <HStack w="100px" spacing={0} justify="flex-end">
                                    <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                      {splitCurrencyForDisplay(currentValue, sym).main}
                                    </Text>
                                    <Text fontSize="2xs" color={primaryTextColor} opacity={0.5}>
                                      {splitCurrencyForDisplay(currentValue, sym).decimals}
                                    </Text>
                                  </HStack>
                                  <HStack w="100px" spacing={0} justify="flex-end">
                                    <Text fontSize="xs" color={tertiaryTextColor}>
                                      {splitCurrencyForDisplay(invested, sym).main}
                                    </Text>
                                    <Text fontSize="2xs" color={tertiaryTextColor} opacity={0.5}>
                                      {splitCurrencyForDisplay(invested, sym).decimals}
                                    </Text>
                                  </HStack>
                                  <Box w="90px" textAlign="right">
                                    <Text fontSize="xs" fontWeight="600" color={fundPnlColor}>
                                      {fundPnlPositive ? "+" : ""}{pnlPct.toFixed(1)}%
                                    </Text>
                                  </Box>
                                  <Box w="60px" textAlign="right">
                                    <Text fontSize="xs" fontWeight="600" color={hasXirr ? (xirr >= 0 ? pnlPositiveColor : pnlNegativeColor) : tertiaryTextColor}>
                                      {hasXirr ? `${xirr >= 0 ? "+" : ""}${xirr.toFixed(1)}%` : "—"}
                                    </Text>
                                  </Box>
                                </Flex>

                                {/* Mobile card */}
                                <Box
                                  display={{ base: "block", md: "none" }}
                                  px={3}
                                  py={2.5}
                                  borderTop="1px solid"
                                  borderColor={sectionBorderColor}
                                >
                                  <Text fontSize="xs" fontWeight="600" color={primaryTextColor} mb={1}>
                                    {fund.name}
                                  </Text>
                                  <SimpleGrid columns={2} spacing={1}>
                                    <Box>
                                      <Text fontSize="2xs" color={tertiaryTextColor}>Value</Text>
                                      <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                        {splitCurrencyForDisplay(currentValue, sym).main}
                                        <Text as="span" fontSize="2xs" opacity={0.5}>{splitCurrencyForDisplay(currentValue, sym).decimals}</Text>
                                      </Text>
                                    </Box>
                                    <Box>
                                      <Text fontSize="2xs" color={tertiaryTextColor}>Invested</Text>
                                      <Text fontSize="xs" color={tertiaryTextColor}>
                                        {splitCurrencyForDisplay(invested, sym).main}
                                        <Text as="span" fontSize="2xs" opacity={0.5}>{splitCurrencyForDisplay(invested, sym).decimals}</Text>
                                      </Text>
                                    </Box>
                                    <Box>
                                      <Text fontSize="2xs" color={tertiaryTextColor}>P&L</Text>
                                      <Text fontSize="xs" fontWeight="600" color={fundPnlColor}>
                                        {fundPnlPositive ? "+" : ""}{pnlPct.toFixed(1)}%
                                      </Text>
                                    </Box>
                                    <Box>
                                      <Text fontSize="2xs" color={tertiaryTextColor}>XIRR</Text>
                                      <Text fontSize="xs" fontWeight="600" color={hasXirr ? (xirr >= 0 ? pnlPositiveColor : pnlNegativeColor) : tertiaryTextColor}>
                                        {hasXirr ? `${xirr >= 0 ? "+" : ""}${xirr.toFixed(1)}%` : "—"}
                                      </Text>
                                    </Box>
                                  </SimpleGrid>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              </MotionBox>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(MutualFundsAllocation);
