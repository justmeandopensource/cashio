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
import { PieChart as PieChartIcon, TrendingUp, ChevronDown, Layers } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";
import { getMutualFunds } from "@/features/mutual-funds/api";
import { MutualFund } from "@/features/mutual-funds/types";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionSimpleGrid = motion(SimpleGrid);

// Each asset class has variations for sub-classes
const ASSET_CLASS_COLORS: Record<string, string[]> = {
  Equity: ["#10B981", "#34D399", "#6EE7B7"],
  Debt: ["#3B82F6", "#60A5FA", "#93C5FD"],
  Hybrid: ["#8B5CF6", "#A78BFA", "#C4B5FD"],
  Others: ["#F59E0B", "#FBBF24", "#FCD34D"],
  Gold: ["#EAB308", "#FACC15", "#FDE047"],
  "Multi Asset": ["#6B7280", "#9CA3AF", "#D1D5DB"],
};

const DEFAULT_COLORS = ["#EC4899", "#F472B6", "#F9A8D4", "#06B6D4", "#22D3EE", "#67E8F9"];

interface MutualFundsAssetClassAllocationProps {
  ledgerId?: string;
}

interface AssetClassData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  subClasses: SubClassData[];
}

interface SubClassData {
  name: string;
  value: number;
  percentage: number;
  displayName: string;
  assetClass: string;
  color: string;
}

const MutualFundsAssetClassAllocation: React.FC<MutualFundsAssetClassAllocationProps> = ({
  ledgerId,
}) => {
  const { currencySymbol } = useLedgerStore();
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [hoveredClassIdx, setHoveredClassIdx] = useState<number | null>(null);
  const [hoveredSubIdx, setHoveredSubIdx] = useState<number | null>(null);

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
  const classesAccentColor = useColorModeValue("blue.400", "blue.300");
  const subClassesAccentColor = useColorModeValue("purple.400", "purple.300");
  const sym = currencySymbol || "₹";

  // Get color for asset class
  const getColorForAssetClass = (assetClass: string): string => {
    return (ASSET_CLASS_COLORS[assetClass] ?? DEFAULT_COLORS)[0];
  };

  const getColorsForSubClasses = (assetClass: string): string[] => {
    const colors = ASSET_CLASS_COLORS[assetClass] ?? DEFAULT_COLORS;
    return colors.length > 1 ? colors.slice(1) : DEFAULT_COLORS.slice(1);
  };

  // Fetch mutual funds data
  const { data: mutualFunds = [], isLoading, isError } = useQuery<MutualFund[]>({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Filter funds by owner
  const filteredFunds = useMemo(() => {
    if (selectedOwner === "all") return mutualFunds;
    return mutualFunds.filter((fund) => fund.owner === selectedOwner);
  }, [mutualFunds, selectedOwner]);

  // Get unique owners
  const availableOwners = useMemo(() => {
    return Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean))).sort();
  }, [mutualFunds]);

  // Process data for concentric donut chart
  const { assetClassData, subClassData } = useMemo(() => {
    if (!filteredFunds.length) return { assetClassData: [], subClassData: [] };

    const assetClassGroups = new Map<string, { value: number; subClasses: Map<string, { value: number; funds: MutualFund[] }> }>();

    filteredFunds.forEach((fund) => {
      const assetClass = fund.asset_class || "Others";
      const assetSubClass = fund.asset_sub_class || "General";
      const currentValue = Number(fund.current_value) || 0;

      if (currentValue > 0) {
        if (!assetClassGroups.has(assetClass)) {
          assetClassGroups.set(assetClass, { value: 0, subClasses: new Map() });
        }
        const classGroup = assetClassGroups.get(assetClass)!;
        classGroup.value += currentValue;

        if (!classGroup.subClasses.has(assetSubClass)) {
          classGroup.subClasses.set(assetSubClass, { value: 0, funds: [] });
        }
        const subClassGroup = classGroup.subClasses.get(assetSubClass)!;
        subClassGroup.value += currentValue;
        subClassGroup.funds.push(fund);
      }
    });

    const assetClasses: AssetClassData[] = Array.from(assetClassGroups.entries())
      .map(([assetClass, classGroup]) => {
        const subClasses: SubClassData[] = Array.from(classGroup.subClasses.entries())
          .map(([subClass, subGroup]) => ({
            name: subClass,
            value: subGroup.value,
            percentage: 0,
            displayName: subClass,
            assetClass,
            color: getColorsForSubClasses(assetClass)[Array.from(classGroup.subClasses.keys()).indexOf(subClass) % getColorsForSubClasses(assetClass).length],
          }))
          .sort((a, b) => b.value - a.value);

        const classTotal = subClasses.reduce((sum, sub) => sum + sub.value, 0);
        subClasses.forEach(sub => {
          sub.percentage = classTotal > 0 ? (sub.value / classTotal) * 100 : 0;
        });

        return {
          name: assetClass,
          value: classGroup.value,
          percentage: 0,
          color: getColorForAssetClass(assetClass),
          subClasses,
        };
      })
      .sort((a, b) => b.value - a.value);

    const totalValue = assetClasses.reduce((sum, item) => sum + item.value, 0);
    assetClasses.forEach(item => {
      item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    });

    const allSubClasses: SubClassData[] = assetClasses.flatMap(ac => ac.subClasses);

    return { assetClassData: assetClasses, subClassData: allSubClasses };
  }, [filteredFunds]);

  const totalPortfolioValue = assetClassData.reduce((sum, item) => sum + item.value, 0);

  // Determine what's hovered for the center label
  const hoveredClassItem = hoveredClassIdx !== null ? assetClassData[hoveredClassIdx] ?? null : null;
  const hoveredSubItem = hoveredSubIdx !== null ? subClassData[hoveredSubIdx] ?? null : null;
  const activeItem = hoveredSubItem || hoveredClassItem;
  const activeColor = hoveredSubItem
    ? hoveredSubItem.color
    : hoveredClassItem
      ? hoveredClassItem.color
      : null;

  // Determine opacity for class cells
  const getClassCellOpacity = (idx: number) => {
    if (hoveredClassIdx === null && hoveredSubIdx === null) return 1;
    if (hoveredClassIdx === idx) return 1;
    if (hoveredSubIdx !== null && subClassData[hoveredSubIdx]?.assetClass === assetClassData[idx]?.name) return 1;
    return 0.25;
  };

  // Determine opacity for sub-class cells
  const getSubCellOpacity = (idx: number) => {
    if (hoveredClassIdx === null && hoveredSubIdx === null) return 1;
    if (hoveredSubIdx === idx) return 1;
    if (hoveredClassIdx !== null && subClassData[idx]?.assetClass === assetClassData[hoveredClassIdx]?.name) return 1;
    return 0.25;
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
      label: "Asset Classes",
      accentColor: classesAccentColor,
      renderValue: () => (
        <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
          {assetClassData.length}
        </Text>
      ),
    },
    {
      icon: Layers,
      label: "Total Sub-Classes",
      accentColor: subClassesAccentColor,
      renderValue: () => (
        <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
          {subClassData.length}
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
        {assetClassData.length > 0 && (
          <MotionSimpleGrid
            columns={{ base: 1, sm: 3 }}
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
          {assetClassData.length > 0 ? (
            <Flex direction={{ base: "column", md: "row" }} align="center" gap={5}>
              {/* Concentric donut chart */}
              <Box
                position="relative"
                w={{ base: "280px", md: "full" }}
                h={{ base: "280px", md: "380px" }}
                minH="250px"
                flex={{ md: 2 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* Outer ring: sub-classes */}
                    <Pie
                      data={subClassData}
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="82%"
                      dataKey="value"
                      labelLine={false}
                      label={false}
                      onMouseEnter={(_, idx) => { setHoveredSubIdx(idx); setHoveredClassIdx(null); }}
                      onMouseLeave={() => setHoveredSubIdx(null)}
                      strokeWidth={0}
                      cornerRadius={2}
                      paddingAngle={1}
                    >
                      {subClassData.map((entry, idx) => (
                        <Cell
                          key={`subclass-${idx}`}
                          fill={entry.color}
                          opacity={getSubCellOpacity(idx)}
                          style={{
                            filter: hoveredSubIdx === idx ? "brightness(1.1)" : "none",
                            transition: "opacity 0.2s ease, filter 0.2s ease",
                          }}
                        />
                      ))}
                    </Pie>
                    {/* Inner ring: asset classes */}
                    <Pie
                      data={assetClassData}
                      cx="50%"
                      cy="50%"
                      innerRadius="35%"
                      outerRadius="60%"
                      dataKey="value"
                      label={false}
                      onMouseEnter={(_, idx) => { setHoveredClassIdx(idx); setHoveredSubIdx(null); }}
                      onMouseLeave={() => setHoveredClassIdx(null)}
                      strokeWidth={0}
                      cornerRadius={3}
                      paddingAngle={2}
                    >
                      {assetClassData.map((_, idx) => (
                        <Cell
                          key={`class-${idx}`}
                          fill={assetClassData[idx].color}
                          opacity={getClassCellOpacity(idx)}
                          style={{
                            filter: hoveredClassIdx === idx ? "brightness(1.1)" : "none",
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
                      key={activeItem ? activeItem.name : "default"}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      direction="column"
                      align="center"
                      textAlign="center"
                      px={3}
                    >
                      {activeItem ? (
                        <>
                          <Text fontSize="xs" fontWeight="600" color={activeColor!} lineHeight="short" mb={0.5}>
                            {"displayName" in activeItem ? activeItem.displayName : activeItem.name}
                          </Text>
                          {"assetClass" in activeItem && (
                            <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500" mb={0.5}>
                              {activeItem.assetClass}
                            </Text>
                          )}
                          <Text fontSize="md" fontWeight="800" color={primaryTextColor} lineHeight="1.1">
                            {splitCurrencyForDisplay(activeItem.value, sym).main}
                            <Text as="span" fontSize="xs" opacity={0.5}>
                              {splitCurrencyForDisplay(activeItem.value, sym).decimals}
                            </Text>
                          </Text>
                          <Text fontSize="xs" fontWeight="600" color={tertiaryTextColor} mt={0.5}>
                            {((activeItem.value / totalPortfolioValue) * 100).toFixed(1)}%
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

              {/* Hierarchical Legend */}
              <VStack
                align="stretch" spacing={1}
                w={{ base: "full", md: "auto" }}
                minW={{ md: "200px" }}
                flex={{ md: 1 }}
                maxH={{ md: "380px" }}
                overflowY="auto"
              >
                <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={columnHeaderColor} mb={1} px={2.5}>
                  Asset Class Overview
                </Text>
                {assetClassData.map((assetClass, classIdx) => {
                  const isClassActive = hoveredClassIdx === null && hoveredSubIdx === null
                    ? true
                    : hoveredClassIdx === classIdx
                      || (hoveredSubIdx !== null && subClassData[hoveredSubIdx]?.assetClass === assetClass.name);

                  return (
                    <Box key={assetClass.name}>
                      <Flex
                        align="center" gap={2.5} px={2.5} py={2}
                        borderRadius="lg"
                        onMouseEnter={() => { setHoveredClassIdx(classIdx); setHoveredSubIdx(null); }}
                        onMouseLeave={() => setHoveredClassIdx(null)}
                        cursor="default"
                        opacity={isClassActive ? 1 : 0.35}
                        bg={hoveredClassIdx === classIdx ? legendHoverBg : "transparent"}
                        transition="all 0.15s ease"
                      >
                        <Box w={3} h={3} borderRadius="sm" bg={assetClass.color} flexShrink={0} />
                        <Box flex={1} minW={0}>
                          <Text fontSize="xs" color={primaryTextColor} fontWeight="600" isTruncated>{assetClass.name}</Text>
                          <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
                            {assetClass.percentage.toFixed(1)}%
                          </Text>
                        </Box>
                      </Flex>
                      {/* Sub-class items */}
                      <VStack spacing={0} align="stretch" pl={5}>
                        {assetClass.subClasses.map((sub) => {
                          const subGlobalIdx = subClassData.indexOf(sub);
                          const isSubActive = hoveredClassIdx === null && hoveredSubIdx === null
                            ? true
                            : hoveredSubIdx === subGlobalIdx
                              || hoveredClassIdx === classIdx;

                          return (
                            <Flex
                              key={sub.name}
                              align="center" gap={2} px={2.5} py={1.5}
                              borderRadius="md"
                              onMouseEnter={() => { setHoveredSubIdx(subGlobalIdx); setHoveredClassIdx(null); }}
                              onMouseLeave={() => setHoveredSubIdx(null)}
                              cursor="default"
                              opacity={isSubActive ? 1 : 0.35}
                              bg={hoveredSubIdx === subGlobalIdx ? legendHoverBg : "transparent"}
                              transition="all 0.15s ease"
                            >
                              <Box w={2} h={2} borderRadius="sm" bg={sub.color} flexShrink={0} />
                              <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500" isTruncated>
                                {sub.displayName}: {sub.percentage.toFixed(1)}%
                              </Text>
                            </Flex>
                          );
                        })}
                      </VStack>
                    </Box>
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
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(MutualFundsAssetClassAllocation);
