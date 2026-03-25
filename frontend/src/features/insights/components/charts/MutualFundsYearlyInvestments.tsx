import React, { useState, useMemo } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  useColorModeValue,
  useBreakpointValue,
  Flex,
  Icon,
  Center,
  Select,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ResponsiveBar } from "@nivo/bar";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  ChevronDown,
  Calendar,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";
import { getMutualFunds, getYearlyInvestments } from "@/features/mutual-funds/api";
import { MutualFund, YearlyInvestment } from "@/features/mutual-funds/types";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

const BAR_COLOR = "#38B2AC";

interface MutualFundsYearlyInvestmentsProps {
  ledgerId?: string;
}

interface ChartDatum {
  year: string;
  invested: number;
  [key: string]: string | number;
}

const MutualFundsYearlyInvestments: React.FC<MutualFundsYearlyInvestmentsProps> = ({
  ledgerId,
}) => {
  const { currencySymbol } = useLedgerStore();
  const [selectedOwner, setSelectedOwner] = useState<string>("all");

  // Color modes
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const tertiaryTextColor = useColorModeValue("gray.500", "gray.400");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const selectBg = useColorModeValue("gray.50", "gray.700");
  const pnlPositiveColor = useColorModeValue("green.500", "green.300");

  // Nivo theme colors
  const textColor = useColorModeValue("#4A5568", "#A0AEC0");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tooltipBg = useColorModeValue("#FFFFFF", "#1A202C");
  const tooltipBorder = useColorModeValue("#E2E8F0", "#4A5568");

  const portfolioAccentColor = useColorModeValue("green.400", "green.300");
  const avgAccentColor = useColorModeValue("blue.400", "blue.300");
  const peakAccentColor = useColorModeValue("purple.400", "purple.300");
  const yearsAccentColor = useColorModeValue("orange.400", "orange.300");
  const sym = currencySymbol || "₹";

  const maxTicks = useBreakpointValue({ base: 6, md: 12 }) || 6;

  // Fetch mutual funds data
  const { data: mutualFunds = [], isLoading: isLoadingFunds } = useQuery<MutualFund[]>({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch yearly investments
  const { data: yearlyInvestments = [], isLoading: isLoadingInvestments, isError } = useQuery<YearlyInvestment[]>({
    queryKey: ["yearly-investments", ledgerId, selectedOwner],
    queryFn: () => getYearlyInvestments(Number(ledgerId), selectedOwner),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isLoadingFunds || isLoadingInvestments;

  // Get unique owners for dropdown
  const availableOwners = useMemo(() => {
    return Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean))).sort();
  }, [mutualFunds]);

  // Process data for chart
  const chartData: ChartDatum[] = useMemo(() => {
    return yearlyInvestments.map((item) => ({
      year: item.year.toString(),
      invested: Number(item.total_invested),
    }));
  }, [yearlyInvestments]);

  // Tick values for x-axis
  const tickValues = useMemo(() => {
    const years = chartData.map(d => d.year);
    if (years.length <= maxTicks) return undefined;
    const step = Math.ceil(years.length / maxTicks);
    const ticks = years.filter((_, i) => i % step === 0);
    if (ticks[ticks.length - 1] !== years[years.length - 1]) {
      ticks.push(years[years.length - 1]);
    }
    return ticks;
  }, [chartData, maxTicks]);

  // Aggregates
  const totalInvested = chartData.reduce((sum, item) => sum + item.invested, 0);
  const activeYears = chartData.filter(item => item.invested > 0);
  const activeYearCount = activeYears.length;
  const avgYearlyInvestment = activeYearCount > 0 ? totalInvested / activeYearCount : 0;
  const peakYear = activeYears.length > 0
    ? activeYears.reduce((max, item) => item.invested > max.invested ? item : max, activeYears[0])
    : null;

  if (isLoading) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor}>
        <Text color={secondaryTextColor}>Loading yearly investments...</Text>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor} textAlign="center">
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">Unable to load yearly investments data</Text>
      </Box>
    );
  }

  const summaryCards = [
    {
      icon: Wallet,
      label: "Total Invested",
      accentColor: portfolioAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={pnlPositiveColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(totalInvested, sym).main}
          </Text>
          <Text fontSize="xs" color={pnlPositiveColor} opacity={0.6}>
            {splitCurrencyForDisplay(totalInvested, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: BarChart3,
      label: "Avg / Year",
      accentColor: avgAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(avgYearlyInvestment, sym).main}
          </Text>
          <Text fontSize="xs" color={primaryTextColor} opacity={0.6}>
            {splitCurrencyForDisplay(avgYearlyInvestment, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: ArrowUpRight,
      label: "Peak Year",
      accentColor: peakAccentColor,
      renderValue: () => (
        <VStack spacing={0} align="flex-start">
          <HStack spacing={0} align="baseline">
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
              {peakYear ? splitCurrencyForDisplay(peakYear.invested, sym).main : "—"}
            </Text>
            {peakYear && (
              <Text fontSize="xs" color={primaryTextColor} opacity={0.6}>
                {splitCurrencyForDisplay(peakYear.invested, sym).decimals}
              </Text>
            )}
          </HStack>
          {peakYear && (
            <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="600">
              in {peakYear.year}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      icon: Calendar,
      label: "Active Years",
      accentColor: yearsAccentColor,
      renderValue: () => (
        <HStack spacing={1.5} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
            {activeYearCount}
          </Text>
          {chartData.length > activeYearCount && (
            <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
              of {chartData.length} year{chartData.length !== 1 ? "s" : ""}
            </Text>
          )}
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
            <Icon as={BarChart3} boxSize={4} color={iconColor} />
            <Heading as="h2" size="md" color={primaryTextColor} letterSpacing="-0.02em">
              Mutual Funds - Yearly Investments
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

        {/* Chart Section */}
        <Box height={{ base: "300px", md: "380px" }} width="full">
          {chartData.length > 0 ? (
            <ResponsiveBar
              data={chartData}
              keys={["invested"]}
              indexBy="year"
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              padding={0.35}
              valueScale={{ type: "linear" }}
              indexScale={{ type: "band", round: true }}
              colors={[BAR_COLOR]}
              borderRadius={4}
              enableLabel={false}
              motionConfig="gentle"
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: chartData.length > 8 ? -45 : 0,
                tickValues,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                format: (v) => {
                  const abs = Math.abs(Number(v));
                  if (abs >= 100000) return `${sym}${(abs / 100000).toFixed(1)}L`;
                  if (abs >= 1000) return `${sym}${(abs / 1000).toFixed(1)}K`;
                  if (abs === 0) return "";
                  return `${sym}${v}`;
                },
              }}
              tooltip={({ indexValue, value }) => (
                <Box
                  bg={tooltipBg}
                  border="1px solid"
                  borderColor={tooltipBorder}
                  borderRadius="md"
                  px={3}
                  py={2}
                  boxShadow="lg"
                  fontSize="xs"
                  minW="160px"
                  whiteSpace="nowrap"
                >
                  <Text fontWeight="bold" color={textColor} mb={0.5}>{indexValue}</Text>
                  <Flex justify="space-between" gap={4}>
                    <Text color={textColor} opacity={0.7}>Invested</Text>
                    <Text fontWeight="600" color={BAR_COLOR}>
                      {splitCurrencyForDisplay(Number(value), sym).main}
                      {splitCurrencyForDisplay(Number(value), sym).decimals}
                    </Text>
                  </Flex>
                </Box>
              )}
              theme={{
                axis: {
                  ticks: { text: { fill: textColor, fontSize: 11 } },
                },
                grid: { line: { stroke: gridColor, strokeWidth: 1 } },
              }}
            />
          ) : (
            <Center height="full" borderRadius="lg" flexDirection="column" textAlign="center" p={6}>
              <Icon as={BarChart3} boxSize={6} color={tertiaryTextColor} mb={4} />
              <Heading size="md" mb={2} color={secondaryTextColor}>No Investment Data Available</Heading>
              <Text color={secondaryTextColor} fontSize="sm">Add mutual fund investments to see your yearly investment chart.</Text>
            </Center>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(MutualFundsYearlyInvestments);
