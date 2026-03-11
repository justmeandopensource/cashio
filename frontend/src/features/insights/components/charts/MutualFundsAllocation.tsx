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
import { getAmcSummaries, getMutualFunds } from "@/features/mutual-funds/api";
import { AmcSummary, MutualFund } from "@/features/mutual-funds/types";

// Softer, more modern color palette
const COLORS = [
  "#81E6D9", "#90CDF4", "#B794F4", "#FBD38D", "#FBB6CE",
  "#A3BFFA", "#D6BCFA", "#F6E05E", "#A0AEC0", "#FED7D7",
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
  const [hoveredItem, setHoveredItem] = useState<ChartData | null>(null);

  // Color modes and theme

  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const legendHoverBg = useColorModeValue("gray.100", "gray.600");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

  // Fetch mutual funds data
  const { data: mutualFunds = [], isLoading: isLoadingFunds } = useQuery<MutualFund[]>({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch AMC summaries
  const { data: amcSummaries, isLoading: isLoadingSummaries, isError } = useQuery<AmcSummary[]>({ 
    queryKey: ["amc-summaries", ledgerId],
    queryFn: () => getAmcSummaries(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isLoading = isLoadingFunds || isLoadingSummaries;

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

  // Calculate AMC summaries from filtered funds
  const filteredAmcSummaries = useMemo(() => {
    if (!filteredFunds.length || !amcSummaries) return [];

    const toNumber = (value: number | string): number =>
      typeof value === "string" ? parseFloat(value) : value;

    return amcSummaries.map(amc => {
      const amcFunds = filteredFunds.filter(fund => fund.amc_id === amc.amc_id);
      const currentValue = amcFunds.reduce((sum, fund) => sum + toNumber(fund.current_value), 0);

      return {
        name: amc.name,
        current_value: currentValue,
      };
    });
  }, [filteredFunds, amcSummaries]);

  // Process data for chart
  const chartData: ChartData[] = React.useMemo(() => {
    if (!filteredAmcSummaries || filteredAmcSummaries.length === 0) return [];

    const dataWithValues = filteredAmcSummaries
      .filter(amc => Number(amc.current_value) > 0)
      .map((amc) => ({
        name: amc.name,
        value: Number(amc.current_value),
      }))
      .sort((a, b) => b.value - a.value);

    const totalValue = dataWithValues.reduce((sum, item) => sum + item.value, 0);

    return dataWithValues.map(item => ({
      ...item,
      percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    }));
  }, [filteredAmcSummaries]);

  const totalPortfolioValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" bg={cardBg} p={6} borderRadius="lg">
        <Text color={secondaryTextColor}>Loading mutual funds allocation...</Text>
      </VStack>
    );
  }

  if (isError) {
    return (
      <VStack spacing={4} align="center" bg={cardBg} p={6} borderRadius="lg">
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">Unable to load mutual funds data</Text>
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
              <Heading as="h2" size="md" color={primaryTextColor}>Mutual Funds - Value by AMC</Heading>
            </Flex>
            <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
              Current value distribution across Asset Management Companies
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

      <Box height={{ base: "300px", md: "400px" }} width="full">
        {chartData.length > 0 ? (
          <Flex height="100%" direction={{ base: "column", md: "row" }}>
            <Box position="relative" flex={2}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="85%"
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={false}
                    onMouseEnter={(data) => setHoveredItem(data)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                        opacity={!hoveredItem || hoveredItem.name === entry.name ? 1 : 0.3}
                        stroke={darkenColor(COLORS[idx % COLORS.length], 0.2)}
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
                      <Text fontWeight="bold" fontSize="lg" color={primaryTextColor} textAlign="center">{hoveredItem.name}</Text>
                      <Text fontSize="md" color={primaryTextColor} mt={2}>{formatNumberAsCurrency(hoveredItem.value, currencySymbol as string)}</Text>
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {hoveredItem.percentage.toFixed(1)}% of Portfolio
                      </Text>
                    </>
                  )}
                </VStack>
              </Center>
            </Box>
            <Box flex={1} pl={{ base: 0, md: 4 }} pt={{ base: 4, md: 0 }} overflowY="auto" maxH="400px">
              <Text fontSize="sm" fontWeight="bold" color={primaryTextColor} mb={3}>AMC Overview</Text>
              <VStack spacing={2} align="stretch">
                {chartData.map((item, idx) => (
                  <Box
                    key={item.name}
                    p={2}
                    bg={hoveredItem && hoveredItem.name === item.name ? legendHoverBg : cardBg}
                    borderRadius="md"
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    transition="background-color 0.2s ease-in-out"
                    cursor="pointer"
                  >
                    <Flex align="center">
                      <Box w={3} h={3} bg={COLORS[idx % COLORS.length]} borderRadius="full" mr={2} flexShrink={0} />
                      <Box flex={1}>
                        <Text fontSize="xs" fontWeight="medium" color={primaryTextColor} isTruncated>{item.name}</Text>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          {item.percentage.toFixed(1)}%
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
          </Flex>
        ) : (
          <Center height="full" bg={bgColor} borderRadius="lg" flexDirection="column" textAlign="center" p={6}>
            <Icon as={PieChartIcon} boxSize={6} color={tertiaryTextColor} mb={4} />
            <Heading size="md" mb={2} color={secondaryTextColor}>No Mutual Funds Data Available</Heading>
            <Text color={secondaryTextColor} fontSize="sm">Add mutual fund investments to see your portfolio allocation.</Text>
          </Center>
        )}
      </Box>

      {chartData.length > 0 && (
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
                <StatLabel color={secondaryTextColor}>AMCs Invested In</StatLabel>
                <StatNumber color={primaryTextColor}>{chartData.length}</StatNumber>
              </Stat>
            </Box>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default React.memo(MutualFundsAllocation);
