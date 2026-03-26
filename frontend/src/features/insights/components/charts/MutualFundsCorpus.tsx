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
import { ResponsiveLine } from "@nivo/line";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Activity,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import {
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
} from "../../../mutual-funds/utils";
import { getMutualFunds, getCorpusGrowth } from "@/features/mutual-funds/api";
import { MutualFund, YearlyInvestment } from "@/features/mutual-funds/types";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

const LINE_COLOR = "#38B2AC";

interface MutualFundsCorpusProps {
  ledgerId?: string;
}

interface ChartPoint {
  date: string;
  corpus: number;
}

const MutualFundsCorpus: React.FC<MutualFundsCorpusProps> = ({
  ledgerId,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [selectedGranularity, setSelectedGranularity] = useState<string>("monthly");

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
  const pnlNegativeColor = useColorModeValue("red.500", "red.300");

  // Nivo theme colors
  const textColor = useColorModeValue("#4A5568", "#A0AEC0");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tooltipBg = useColorModeValue("#FFFFFF", "#1A202C");
  const tooltipBorder = useColorModeValue("#E2E8F0", "#4A5568");

  const portfolioAccentColor = useColorModeValue("green.400", "green.300");
  const growthAccentColor = useColorModeValue("blue.400", "blue.300");
  const peakAccentColor = useColorModeValue("purple.400", "purple.300");
  const periodAccentColor = useColorModeValue("orange.400", "orange.300");
  const sym = currencySymbol || "₹";

  const maxTicks = useBreakpointValue({ base: 5, md: 10 }) || 5;

  // Fetch mutual funds data
  const { data: mutualFunds = [], isLoading: isLoadingFunds } = useQuery<MutualFund[]>({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch corpus growth data
  const { data: corpusGrowth = [], isLoading: isLoadingCorpus, isError } = useQuery<YearlyInvestment[]>({
    queryKey: ["corpus-growth", ledgerId, selectedOwner, selectedGranularity],
    queryFn: () => getCorpusGrowth(Number(ledgerId), selectedOwner, selectedGranularity),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isLoadingFunds || isLoadingCorpus;

  // Get unique owners for dropdown
  const availableOwners = useMemo(() => {
    return Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean))).sort();
  }, [mutualFunds]);

  // Process data for chart
  const chartPoints: ChartPoint[] = useMemo(() => {
    return corpusGrowth.map((item) => ({
      date: selectedGranularity === "monthly" && item.month
        ? `${item.year}-${item.month.toString().padStart(2, "0")}`
        : item.year.toString(),
      corpus: Number(item.total_invested),
    }));
  }, [corpusGrowth, selectedGranularity]);

  // Nivo line data format
  const lineData = useMemo(() => {
    if (!chartPoints.length) return [];
    return [{
      id: "Corpus",
      data: chartPoints.map(p => ({ x: p.date, y: p.corpus })),
    }];
  }, [chartPoints]);

  // Tick values for x-axis
  const tickValues = useMemo(() => {
    const xValues = chartPoints.map(p => p.date);
    if (xValues.length <= maxTicks) return undefined;
    const step = Math.ceil(xValues.length / maxTicks);
    const ticks = xValues.filter((_, i) => i % step === 0);
    if (ticks[ticks.length - 1] !== xValues[xValues.length - 1]) {
      ticks.push(xValues[xValues.length - 1]);
    }
    return ticks;
  }, [chartPoints, maxTicks]);

  // Format date for display
  const formatDate = (value: string) => {
    if (selectedGranularity === "monthly" && value.includes("-")) {
      const [year, month] = value.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`;
    }
    return value;
  };

  // Aggregates
  const currentCorpus = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].corpus : 0;
  const startCorpus = chartPoints.length > 0 ? chartPoints[0].corpus : 0;
  const corpusGrowthAmt = currentCorpus - startCorpus;
  const corpusGrowthPct = startCorpus > 0 ? (corpusGrowthAmt / startCorpus) * 100 : 0;
  const isGrowthPositive = corpusGrowthAmt >= 0;
  const peakCorpus = chartPoints.length > 0
    ? chartPoints.reduce((max, p) => p.corpus > max.corpus ? p : max, chartPoints[0])
    : null;
  const totalDataPoints = chartPoints.length;

  if (isLoading) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor}>
        <Text color={secondaryTextColor}>Loading corpus growth...</Text>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor={sectionBorderColor} textAlign="center">
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">Unable to load corpus growth data</Text>
      </Box>
    );
  }

  const summaryCards = [
    {
      icon: TrendingUp,
      label: "Current Corpus",
      accentColor: portfolioAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={pnlPositiveColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(currentCorpus, sym).main}
          </Text>
          <Text fontSize="xs" color={pnlPositiveColor} opacity={0.6}>
            {splitCurrencyForDisplay(currentCorpus, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: isGrowthPositive ? ArrowUpRight : ArrowDownRight,
      label: "Net Growth",
      accentColor: isGrowthPositive ? growthAccentColor : pnlNegativeColor,
      renderValue: () => {
        const color = isGrowthPositive ? pnlPositiveColor : pnlNegativeColor;
        const pctDisplay = splitPercentageForDisplay(corpusGrowthPct);
        return (
          <VStack spacing={0} align="flex-start">
            <HStack spacing={0} align="baseline">
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={color} lineHeight="short" letterSpacing="-0.01em">
                {isGrowthPositive ? "+" : "-"}{splitCurrencyForDisplay(Math.abs(corpusGrowthAmt), sym).main}
              </Text>
              <Text fontSize="xs" color={color} opacity={0.6}>
                {splitCurrencyForDisplay(Math.abs(corpusGrowthAmt), sym).decimals}
              </Text>
            </HStack>
            <Text fontSize="2xs" color={color} fontWeight="600" opacity={0.8}>
              {isGrowthPositive ? "+" : "-"}{pctDisplay.main}{pctDisplay.decimals} from start
            </Text>
          </VStack>
        );
      },
    },
    {
      icon: Activity,
      label: "Peak Corpus",
      accentColor: peakAccentColor,
      renderValue: () => (
        <VStack spacing={0} align="flex-start">
          <HStack spacing={0} align="baseline">
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
              {peakCorpus ? splitCurrencyForDisplay(peakCorpus.corpus, sym).main : "—"}
            </Text>
            {peakCorpus && (
              <Text fontSize="xs" color={primaryTextColor} opacity={0.6}>
                {splitCurrencyForDisplay(peakCorpus.corpus, sym).decimals}
              </Text>
            )}
          </HStack>
          {peakCorpus && (
            <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="600">
              {formatDate(peakCorpus.date)}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      icon: Calendar,
      label: "Data Points",
      accentColor: periodAccentColor,
      renderValue: () => (
        <HStack spacing={1.5} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
            {totalDataPoints}
          </Text>
          <Text fontSize="2xs" color={tertiaryTextColor} fontWeight="500">
            {selectedGranularity === "monthly" ? "months" : "years"}
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
            <Icon as={Activity} boxSize={4} color={iconColor} />
            <Heading as="h2" size="md" color={primaryTextColor} letterSpacing="-0.02em">
              Mutual Funds - Corpus
            </Heading>
          </Flex>

          <Flex gap={{ base: 2, md: 3 }} direction={{ base: "column", md: "row" }} width={{ base: "full", md: "auto" }}>
            <Select
              value={selectedGranularity}
              onChange={(e) => setSelectedGranularity(e.target.value)}
              maxW={{ base: "full", md: "140px" }}
              icon={<ChevronDown />}
              variant="filled"
              bg={selectBg}
              size="sm"
              borderRadius="lg"
              fontWeight="medium"
              fontSize="sm"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>

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
        </Flex>

        {/* Summary Cards */}
        {chartPoints.length > 0 && (
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
          {lineData.length > 0 ? (
            <ResponsiveLine
              data={lineData}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
              curve="monotoneX"
              colors={[LINE_COLOR]}
              lineWidth={2}
              enablePoints={chartPoints.length <= 30}
              pointSize={6}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={LINE_COLOR}
              enableArea={true}
              areaOpacity={0.15}
              useMesh={true}
              enableCrosshair={true}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: chartPoints.length > 8 ? -45 : 0,
                format: formatDate,
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
              tooltip={({ point }) => (
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
                  <Text fontWeight="bold" color={textColor} mb={0.5}>
                    {formatDate(point.data.xFormatted as string)}
                  </Text>
                  <Flex justify="space-between" gap={4}>
                    <Text color={textColor} opacity={0.7}>Corpus</Text>
                    <Text fontWeight="600" color={LINE_COLOR}>
                      {splitCurrencyForDisplay(Number(point.data.y), sym).main}
                      {splitCurrencyForDisplay(Number(point.data.y), sym).decimals}
                    </Text>
                  </Flex>
                </Box>
              )}
              theme={{
                axis: {
                  ticks: { text: { fill: textColor, fontSize: 11 } },
                },
                grid: { line: { stroke: gridColor, strokeWidth: 1 } },
                crosshair: { line: { stroke: textColor, strokeWidth: 1, strokeOpacity: 0.35 } },
              }}
            />
          ) : (
            <Center height="full" borderRadius="lg" flexDirection="column" textAlign="center" p={6}>
              <Icon as={Activity} boxSize={6} color={tertiaryTextColor} mb={4} />
              <Heading size="md" mb={2} color={secondaryTextColor}>No Corpus Data Available</Heading>
              <Text color={secondaryTextColor} fontSize="sm">Add mutual fund investments to see your corpus growth.</Text>
            </Center>
          )}
        </Box>
      </Box>
    </MotionBox>
  );
};

export default React.memo(MutualFundsCorpus);
