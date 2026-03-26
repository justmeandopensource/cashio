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
  Layers,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import {
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
} from "../../../mutual-funds/utils";
import { getMutualFunds } from "@/features/mutual-funds/api";
import { MutualFund } from "@/features/mutual-funds/types";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionSimpleGrid = motion(SimpleGrid);

const ASSET_CLASS_COLORS: Record<string, string> = {
  Equity: "#10B981",
  Debt: "#3B82F6",
  Hybrid: "#8B5CF6",
  Others: "#F59E0B",
  Gold: "#EAB308",
  "Multi Asset": "#6B7280",
};

const SUB_CLASS_COLORS: Record<string, string[]> = {
  Equity: ["#34D399", "#6EE7B7", "#A7F3D0", "#059669", "#047857"],
  Debt: ["#60A5FA", "#93C5FD", "#BFDBFE", "#2563EB", "#1D4ED8"],
  Hybrid: ["#A78BFA", "#C4B5FD", "#DDD6FE", "#7C3AED", "#6D28D9"],
  Others: ["#FBBF24", "#FCD34D", "#FDE68A", "#D97706", "#B45309"],
  Gold: ["#FACC15", "#FDE047", "#FEF08A", "#CA8A04", "#A16207"],
  "Multi Asset": ["#9CA3AF", "#D1D5DB", "#E5E7EB", "#4B5563", "#374151"],
};

const DEFAULT_COLOR = "#EC4899";
const DEFAULT_SUB_COLORS = ["#F472B6", "#F9A8D4", "#FBCFE8", "#DB2777", "#BE185D"];

interface MutualFundsAssetClassAllocationProps {
  ledgerId?: string;
}

interface SubClassInfo {
  name: string;
  value: number;
  invested: number;
  pnl: number;
  pnlPct: number;
  percentage: number;
  color: string;
  fundCount: number;
  funds: FundInfo[];
}

interface FundInfo {
  fund: MutualFund;
  currentValue: number;
  invested: number;
  pnl: number;
  pnlPct: number;
}

interface AssetClassChartData {
  id: string;
  label: string;
  value: number;
  percentage: number;
  invested: number;
  pnl: number;
  pnlPct: number;
  fundCount: number;
  subClassCount: number;
  color: string;
  subClasses: SubClassInfo[];
}

const toNumber = (value: number | string): number => {
  if (value === undefined || value === null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

const MutualFundsAssetClassAllocation: React.FC<MutualFundsAssetClassAllocationProps> = ({
  ledgerId,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);

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

  const portfolioAccentColor = useColorModeValue("green.400", "green.300");
  const investedAccentColor = useColorModeValue("blue.400", "blue.300");
  const pnlPositiveColor = useColorModeValue("green.500", "green.300");
  const pnlNegativeColor = useColorModeValue("red.500", "red.300");
  const classesAccentColor = useColorModeValue("purple.400", "purple.300");
  const sym = currencySymbol || "₹";

  // Fetch mutual funds data
  const { data: mutualFunds = [], isLoading, isError } = useQuery<MutualFund[]>({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Filter funds by owner, exclude 0-unit funds
  const filteredFunds = useMemo(() => {
    const funds = selectedOwner === "all"
      ? mutualFunds
      : mutualFunds.filter((fund) => fund.owner === selectedOwner);
    return funds.filter(fund => toNumber(fund.total_units) > 0);
  }, [mutualFunds, selectedOwner]);

  // Get unique owners
  const availableOwners = useMemo(() => {
    return Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean))).sort();
  }, [mutualFunds]);

  // Process data for nivo pie chart with full financial info
  const chartData: AssetClassChartData[] = useMemo(() => {
    if (!filteredFunds.length) return [];

    const classGroups = new Map<string, {
      value: number;
      invested: number;
      subClasses: Map<string, { value: number; invested: number; funds: MutualFund[] }>;
    }>();

    filteredFunds.forEach((fund) => {
      const assetClass = fund.asset_class || "Others";
      const subClass = fund.asset_sub_class || "General";
      const currentValue = toNumber(fund.current_value);
      const invested = toNumber(fund.total_invested_cash);

      if (currentValue > 0) {
        if (!classGroups.has(assetClass)) {
          classGroups.set(assetClass, { value: 0, invested: 0, subClasses: new Map() });
        }
        const group = classGroups.get(assetClass)!;
        group.value += currentValue;
        group.invested += invested;

        if (!group.subClasses.has(subClass)) {
          group.subClasses.set(subClass, { value: 0, invested: 0, funds: [] });
        }
        const subGroup = group.subClasses.get(subClass)!;
        subGroup.value += currentValue;
        subGroup.invested += invested;
        subGroup.funds.push(fund);
      }
    });

    const totalValue = Array.from(classGroups.values()).reduce((s, g) => s + g.value, 0);

    return Array.from(classGroups.entries())
      .map(([className, group]) => {
        const classColor = ASSET_CLASS_COLORS[className] ?? DEFAULT_COLOR;
        const subColors = SUB_CLASS_COLORS[className] ?? DEFAULT_SUB_COLORS;

        const subClasses: SubClassInfo[] = Array.from(group.subClasses.entries())
          .map(([subName, sub], subIdx) => {
            const subPnl = sub.value - sub.invested;
            const subPnlPct = sub.invested > 0 ? (subPnl / sub.invested) * 100 : 0;
            return {
              name: subName,
              value: sub.value,
              invested: sub.invested,
              pnl: subPnl,
              pnlPct: subPnlPct,
              percentage: group.value > 0 ? (sub.value / group.value) * 100 : 0,
              color: subColors[subIdx % subColors.length],
              fundCount: sub.funds.length,
              funds: sub.funds
                .map(fund => {
                  const cv = toNumber(fund.current_value);
                  const inv = toNumber(fund.total_invested_cash);
                  const pnl = cv - inv;
                  return { fund, currentValue: cv, invested: inv, pnl, pnlPct: inv > 0 ? (pnl / inv) * 100 : 0 };
                })
                .sort((a, b) => b.currentValue - a.currentValue),
            };
          })
          .sort((a, b) => b.value - a.value);

        const pnl = group.value - group.invested;
        const pnlPct = group.invested > 0 ? (pnl / group.invested) * 100 : 0;
        const fundCount = subClasses.reduce((s, sc) => s + sc.fundCount, 0);

        return {
          id: className,
          label: className,
          value: group.value,
          percentage: totalValue > 0 ? (group.value / totalValue) * 100 : 0,
          invested: group.invested,
          pnl,
          pnlPct,
          fundCount,
          subClassCount: subClasses.length,
          color: classColor,
          subClasses,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredFunds]);

  // Aggregates
  const totalPortfolioValue = chartData.reduce((s, d) => s + d.value, 0);
  const totalInvested = chartData.reduce((s, d) => s + d.invested, 0);
  const totalPnl = totalPortfolioValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalFundCount = chartData.reduce((s, d) => s + d.fundCount, 0);
  const isPnlPositive = totalPnl >= 0;

  const hoveredItem = hoveredId ? chartData.find(d => d.id === hoveredId) ?? null : null;
  const selectedClass = selectedClassName ? chartData.find(d => d.id === selectedClassName) ?? null : null;

  const handleClassClick = (className: string) => {
    setSelectedClassName(prev => (prev === className ? null : className));
  };

  if (isLoading) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor}>
        <Text color={secondaryTextColor}>Loading asset class allocation...</Text>
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
        const pctDisplay = splitPercentageForDisplay(totalPnlPct);
        return (
          <VStack spacing={0} align="flex-start">
            <HStack spacing={0} align="baseline">
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={pnlColor} lineHeight="short" letterSpacing="-0.01em">
                {isPnlPositive ? "+" : "-"}{splitCurrencyForDisplay(Math.abs(totalPnl), sym).main}
              </Text>
              <Text fontSize="xs" color={pnlColor} opacity={0.6}>
                {splitCurrencyForDisplay(Math.abs(totalPnl), sym).decimals}
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
      icon: Layers,
      label: "Breakdown",
      accentColor: classesAccentColor,
      renderValue: () => (
        <HStack spacing={1.5} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
            {totalFundCount}
          </Text>
          <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
            fund{totalFundCount !== 1 ? "s" : ""} across {chartData.length} class{chartData.length !== 1 ? "es" : ""}
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
              Asset Class Allocation
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
                  onClick={(datum) => handleClassClick(datum.id as string)}
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
                      {hoveredItem ? (
                        <>
                          <Text fontSize="xs" fontWeight="600" color={hoveredItem.color} lineHeight="short" mb={0.5}>
                            {hoveredItem.label}
                          </Text>
                          <Text fontSize="md" fontWeight="800" color={primaryTextColor} lineHeight="1.1">
                            {splitCurrencyForDisplay(hoveredItem.value, sym).main}
                            <Text as="span" fontSize="xs" opacity={0.5}>
                              {splitCurrencyForDisplay(hoveredItem.value, sym).decimals}
                            </Text>
                          </Text>
                          <Text fontSize="2xs" fontWeight="600" color={hoveredItem.pnl >= 0 ? pnlPositiveColor : pnlNegativeColor} mt={0.5}>
                            {hoveredItem.pnl >= 0 ? "+" : ""}{hoveredItem.pnlPct.toFixed(1)}%
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
                minW={{ md: "240px" }}
                flex={{ md: 1 }}
                maxH={{ md: "360px" }}
                overflowY="auto"
              >
                <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} mb={1} px={2.5}>
                  Asset Class Overview
                </Text>
                {chartData.map((item) => {
                  const isActive = hoveredId === null || hoveredId === item.id;
                  const itemPnlPositive = item.pnl >= 0;
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
                      onClick={() => handleClassClick(item.id)}
                      cursor="pointer"
                      opacity={isActive ? 1 : 0.35}
                      bg={hoveredId === item.id || selectedClassName === item.id ? legendHoverBg : "transparent"}
                      borderLeft={selectedClassName === item.id ? "2px solid" : "2px solid transparent"}
                      borderLeftColor={selectedClassName === item.id ? item.color : "transparent"}
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
                      {/* Row 2: allocation + sub-classes + P&L */}
                      <Flex align="center" justify="space-between" pl={4.5}>
                        <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                          {item.percentage.toFixed(1)}% · {item.fundCount} fund{item.fundCount !== 1 ? "s" : ""} · {item.subClassCount} sub
                        </Text>
                        <Text fontSize="2xs" fontWeight="600" color={itemPnlPositive ? pnlPositiveColor : pnlNegativeColor}>
                          {itemPnlPositive ? "+" : ""}{item.pnlPct.toFixed(1)}%
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
              <Text color={secondaryTextColor} fontSize="sm">Add mutual fund investments to see your asset class allocation.</Text>
            </Center>
          )}

          {/* Drill-down panel */}
          <AnimatePresence>
            {selectedClass && (
              <MotionBox
                key={selectedClassName}
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
                  <Box position="absolute" top={0} left={0} right={0} h="2px" bg={selectedClass.color} opacity={0.7} borderTopRadius="xl" />

                  {/* Panel header */}
                  <Flex justify="space-between" align="center" mb={3}>
                    <Flex align="center" gap={2}>
                      <Box w={2.5} h={2.5} borderRadius="sm" bg={selectedClass.color} flexShrink={0} />
                      <Text fontSize="sm" fontWeight="700" color={primaryTextColor}>
                        {selectedClass.label}
                      </Text>
                      <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                        {selectedClass.fundCount} fund{selectedClass.fundCount !== 1 ? "s" : ""} · {selectedClass.subClassCount} sub-class{selectedClass.subClassCount !== 1 ? "es" : ""}
                      </Text>
                    </Flex>
                    <Flex
                      as="button"
                      align="center"
                      justify="center"
                      w={6} h={6}
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => setSelectedClassName(null)}
                      _hover={{ bg: legendHoverBg }}
                      transition="background 0.15s ease"
                    >
                      <Icon as={X} boxSize={3.5} color={tertiaryTextColor} />
                    </Flex>
                  </Flex>

                  {/* Sub-class groups */}
                  <VStack align="stretch" spacing={3}>
                    {selectedClass.subClasses.map((subClass) => {
                      const subPnlPositive = subClass.pnl >= 0;
                      return (
                        <Box
                          key={subClass.name}
                          border="1px solid"
                          borderColor={sectionBorderColor}
                          borderRadius="lg"
                          overflow="hidden"
                        >
                          {/* Sub-class header */}
                          <Flex
                            align="center"
                            justify="space-between"
                            px={3}
                            py={2}
                            bg={legendHoverBg}
                          >
                            <Flex align="center" gap={2}>
                              <Box w={2} h={2} borderRadius="sm" bg={subClass.color} flexShrink={0} />
                              <Text fontSize="xs" fontWeight="700" color={primaryTextColor}>
                                {subClass.name}
                              </Text>
                              <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                                {subClass.fundCount} fund{subClass.fundCount !== 1 ? "s" : ""} · {subClass.percentage.toFixed(1)}%
                              </Text>
                            </Flex>
                            <Flex align="center" gap={3}>
                              <HStack spacing={0}>
                                <Text fontSize="xs" fontWeight="600" color={primaryTextColor}>
                                  {splitCurrencyForDisplay(subClass.value, sym).main}
                                </Text>
                                <Text fontSize="2xs" color={primaryTextColor} opacity={0.5}>
                                  {splitCurrencyForDisplay(subClass.value, sym).decimals}
                                </Text>
                              </HStack>
                              <Text fontSize="2xs" fontWeight="600" color={subPnlPositive ? pnlPositiveColor : pnlNegativeColor}>
                                {subPnlPositive ? "+" : ""}{subClass.pnlPct.toFixed(1)}%
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

                          {/* Fund rows */}
                          {subClass.funds.map(({ fund, currentValue, invested, pnl, pnlPct }) => {
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
                                    {fund.owner && (
                                      <Text fontSize="2xs" color={tertiaryTextColor}>{fund.owner}</Text>
                                    )}
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
                                  <Flex justify="space-between" align="center" mb={1}>
                                    <Text fontSize="xs" fontWeight="600" color={primaryTextColor} isTruncated flex={1}>
                                      {fund.name}
                                    </Text>
                                    {fund.owner && (
                                      <Text fontSize="2xs" color={tertiaryTextColor} ml={2}>{fund.owner}</Text>
                                    )}
                                  </Flex>
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

export default React.memo(MutualFundsAssetClassAllocation);
