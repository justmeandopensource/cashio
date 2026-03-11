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
  Stat,
  StatLabel,
  StatNumber,
  Select,
  FormControl,
} from "@chakra-ui/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { getMutualFunds } from "@/features/mutual-funds/api";
import { MutualFund } from "@/features/mutual-funds/types";

// Color palette for pie chart segments - softer, more pleasant colors
// Each asset class has variations of the same color family for sub-classes
const ASSET_CLASS_COLORS = {
  Equity: ["#81E6D9", "#4FD1C5", "#38B2AC"], // Lighter teals
  Debt: ["#90CDF4", "#63B3ED", "#4299E1"], // Lighter blues
  Hybrid: ["#B794F4", "#9F7AEA", "#805AD5"], // Lighter purples
  Others: ["#FBD38D", "#F6AD55", "#ED8936"], // Lighter oranges
  Gold: ["#FAF089", "#F6E05E", "#ECC94B"], // Lighter yellows
  "Multi Asset": ["#E2E8F0", "#CBD5E0", "#A0AEC0"], // Lighter grays
};

const DEFAULT_COLORS = [
  "#68D391", "#63B3ED", "#9F7AEA", "#F6AD55", "#FBD38D", "#A0AEC0",
  "#4A5568", "#718096", "#CBD5E0", "#EDF2F7", "#E2E8F0", "#CBD5E0",
];

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
  const [hoveredItem, setHoveredItem] = useState<AssetClassData | SubClassData | null>(null);
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");

  const legendHoverBg = useColorModeValue("gray.100", "gray.600");
  const subLegendHoverBg = useColorModeValue("gray.200", "gray.500");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

  // Get color for asset class
  const getColorForAssetClass = (assetClass: string): string => {
    const classColors = ASSET_CLASS_COLORS[assetClass as keyof typeof ASSET_CLASS_COLORS];
    if (classColors) {
      return classColors[0]; // Use the primary color for the asset class
    }
    return DEFAULT_COLORS[0];
  };

  // Get colors for sub-classes within an asset class (skip the first color used for asset class)
  const getColorsForSubClasses = (assetClass: string): string[] => {
    const classColors = ASSET_CLASS_COLORS[assetClass as keyof typeof ASSET_CLASS_COLORS];
    if (classColors && classColors.length > 1) {
      return classColors.slice(1); // Use variations for sub-classes
    }
    return DEFAULT_COLORS.slice(1); // Fallback variations
  };

  // Fetch mutual funds data
  const { data: mutualFunds = [], isLoading, isError } = useQuery<MutualFund[]>({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter funds by owner
  const filteredFunds = useMemo(() => {
    if (selectedOwner === "all") {
      return mutualFunds;
    }
    return mutualFunds.filter((fund) => fund.owner === selectedOwner);
  }, [mutualFunds, selectedOwner]);

  // Get unique owners for dropdown
  const availableOwners = useMemo(() => {
    const owners = Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean))).sort();
    return owners;
  }, [mutualFunds]);

  const darkenColor = (hex: string, percent: number): string => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.floor(r * (1 - percent));
    g = Math.floor(g * (1 - percent));
    b = Math.floor(b * (1 - percent));

    const toHex = (c: number) => ('00' + c.toString(16)).slice(-2);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Process data for concentric donut chart
  const { assetClassData, subClassData } = React.useMemo(() => {
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



  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" bg={cardBg} p={6} borderRadius="lg">
        <Text color={secondaryTextColor}>Loading asset class allocation...</Text>
      </VStack>
    );
  }

  if (isError) {
    return (
      <VStack spacing={4} align="center" bg={cardBg} p={6} borderRadius="lg">
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load mutual funds data
        </Text>
      </VStack>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="lg" p={{ base: 4, md: 6 }} boxShadow="lg">
      <VStack spacing={4} align="stretch" mb={6}>
        <Flex justifyContent="space-between" alignItems="center" direction={{ base: "column", md: "row" }} gap={4}>
          <VStack align="start" spacing={1} flex={1}>
            <Flex alignItems="center" gap={3}>
              <Icon as={PieChartIcon} w={5} h={5} color={primaryTextColor} />
              <Heading as="h2" size="md" color={primaryTextColor}>
                Mutual Funds - Asset Class Allocation
              </Heading>
            </Flex>
            <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
              Hierarchical view: Inner ring shows asset classes, outer ring shows sub-classes
            </Text>
          </VStack>
          {availableOwners.length > 0 && (
            <FormControl maxW={{ base: "full", md: "200px" }}>
              <Select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)} size="sm" bg={cardBg}>
                <option value="all">All Owners</option>
                {availableOwners.map((owner) => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </Select>
            </FormControl>
          )}
        </Flex>
      </VStack>

      <Box height={{ base: "400px", md: "500px" }} width="full" mb={8}>
        {assetClassData.length > 0 ? (
          <Flex height="100%" direction={{ base: "column", md: "row" }}>
            <Box position="relative" flex={2}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subClassData}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="90%"
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={false}
                    onMouseEnter={(data) => setHoveredItem(data)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {subClassData.map((entry, idx) => (
                      <Cell
                        key={`subclass-${idx}`}
                        fill={entry.color}
                        opacity={!hoveredItem || hoveredItem.name === entry.name || ('subClasses' in hoveredItem && hoveredItem.name === entry.assetClass) ? 1 : 0.3}
                        stroke={darkenColor(entry.color, 0.2)}
                        strokeWidth={hoveredItem?.name === entry.name ? 3 : 0.5}
                      />
                    ))}
                  </Pie>
                  <Pie
                    data={assetClassData}
                    cx="50%"
                    cy="50%"
                    innerRadius="35%"
                    outerRadius="60%"
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                    onMouseEnter={(data) => setHoveredItem(data)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {assetClassData.map((entry, idx) => (
                      <Cell
                        key={`class-${idx}`}
                        fill={entry.color}
                        opacity={!hoveredItem || hoveredItem.name === entry.name || ('assetClass' in hoveredItem && hoveredItem.assetClass === entry.name) ? 1 : 0.3}
                        stroke={darkenColor(entry.color, 0.2)}
                        strokeWidth={hoveredItem?.name === entry.name ? 3 : 0.5}
                      />
                    ))}
                  </Pie>

                </PieChart>
              </ResponsiveContainer>
              <Center position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none">
                <VStack spacing={0}>
                  {hoveredItem && (
                    <>
                                            <Text fontWeight="bold" fontSize="lg" color={primaryTextColor} textAlign="center">{'displayName' in hoveredItem ? hoveredItem.displayName : hoveredItem.name}</Text>
                      {'assetClass' in hoveredItem && (
                        <Text fontSize="xs" color={secondaryTextColor}>
                          ({hoveredItem.assetClass})
                        </Text>
                      )}
                      <Text fontSize="md" color={primaryTextColor} mt={2}>{formatNumberAsCurrency(hoveredItem.value, currencySymbol as string)}</Text>
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {((hoveredItem.value / totalPortfolioValue) * 100).toFixed(1)}% of Portfolio
                      </Text>
                    </>
                  )}
                </VStack>
              </Center>
            </Box>
            <Box flex={1} pl={{ base: 0, md: 4 }} pt={{ base: 4, md: 0 }} overflowY="auto" maxH="500px">
              <Text fontSize="sm" fontWeight="bold" color={primaryTextColor} mb={3}>Asset Class Overview</Text>
              <VStack spacing={3} align="stretch">
                {assetClassData.map((assetClass) => (
                  <Box
                    key={assetClass.name}
                    p={3}
                    bg={hoveredItem && (hoveredItem.name === assetClass.name || ('assetClass' in hoveredItem && hoveredItem.assetClass === assetClass.name)) ? legendHoverBg : cardBg}
                    borderRadius="md"
                    onMouseEnter={() => setHoveredItem(assetClass)}
                    onMouseLeave={() => setHoveredItem(null)}
                    transition="background-color 0.2s ease-in-out"
                  >
                    <Flex align="center" mb={2}>
                      <Box w={4} h={4} bg={assetClass.color} borderRadius="full" mr={3} flexShrink={0} />
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="medium" color={primaryTextColor}>{assetClass.name}</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          {formatNumberAsCurrency(assetClass.value, currencySymbol as string)} • {assetClass.percentage.toFixed(1)}%
                        </Text>
                      </Box>
                    </Flex>
                    <VStack spacing={1} align="stretch" pl={7}>
                      {assetClass.subClasses.map((subClass) => (
                        <Flex
                          key={subClass.name}
                          align="center"
                          onMouseEnter={(e) => { e.stopPropagation(); setHoveredItem(subClass); }}
                          bg={hoveredItem && hoveredItem.name === subClass.name ? subLegendHoverBg : 'transparent'}
                          borderRadius="sm"
                          p={1}
                          m={-1}
                          transition="background-color 0.2s ease-in-out"
                        >
                          <Box w={2} h={2} bg={subClass.color} borderRadius="full" mr={2} flexShrink={0} />
                          <Text fontSize="xs" color={secondaryTextColor}>
                            {subClass.displayName}: {subClass.percentage.toFixed(1)}%
                          </Text>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          </Flex>
        ) : (
          <Center height="full" bg={bgColor} borderRadius="lg" flexDirection="column" textAlign="center" p={6}>
            <Icon as={PieChartIcon} boxSize={6} color={tertiaryTextColor} mb={4} />
            <Heading size="md" mb={2} color={secondaryTextColor}>No Mutual Funds Data Available</Heading>
            <Text color={secondaryTextColor} fontSize="sm">Add mutual fund investments to see your asset class allocation.</Text>
          </Center>
        )}
      </Box>

      {assetClassData.length > 0 && (
        <VStack spacing={4} mt={6} width="full">
          <HStack spacing={4} width="full" flexDirection={{ base: "column", md: "row" }}>
            <Box bg={cardBg} p={6} borderRadius="lg" width="full" boxShadow="md">
              <Stat>
                <StatLabel color={secondaryTextColor}>Total Portfolio Value</StatLabel>
                <StatNumber color={primaryTextColor}>{formatNumberAsCurrency(totalPortfolioValue, currencySymbol as string)}</StatNumber>
              </Stat>
            </Box>
            <Box bg={cardBg} p={6} borderRadius="lg" width="full" boxShadow="md">
              <Stat>
                <StatLabel color={secondaryTextColor}>Asset Classes</StatLabel>
                <StatNumber color={primaryTextColor}>{assetClassData.length}</StatNumber>
              </Stat>
            </Box>
            <Box bg={cardBg} p={6} borderRadius="lg" width="full" boxShadow="md">
              <Stat>
                <StatLabel color={secondaryTextColor}>Total Sub-Classes</StatLabel>
                <StatNumber color={primaryTextColor}>{subClassData.length}</StatNumber>
              </Stat>
            </Box>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default React.memo(MutualFundsAssetClassAllocation);
