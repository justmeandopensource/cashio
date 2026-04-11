import React, { useMemo } from "react";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  HStack,
  Heading,
  Icon,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ResponsiveLine } from "@nivo/line";
import { LineChart, BarChart2 } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { useAccountInsights } from "../hooks";

const MotionBox = motion(Box);

interface AccountInsightsProps {
  accountId: string;
}

const BASE_COLORS_LIGHT = [
  "#0d9488", "#2563eb", "#ea580c", "#7c3aed", "#16a34a",
];
const BASE_COLORS_DARK = [
  "#2dd4bf", "#60a5fa", "#fb923c", "#a78bfa", "#4ade80",
];

const formatPeriod = (period: string) => {
  if (period.includes("-")) {
    const [year, month] = period.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      "en-US",
      { month: "short", year: "2-digit" }
    );
  }
  return period;
};

const AccountInsights: React.FC<AccountInsightsProps> = ({ accountId }) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);

  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");
  const gridStroke = useColorModeValue("#e2e8f0", "#2d3748");
  const axisTickColor = useColorModeValue("#718096", "#cbd5e0");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const barTrackBg = useColorModeValue("gray.100", "gray.600");
  const primaryText = useColorModeValue("gray.700", "gray.200");
  const headingColor = useColorModeValue("red.600", "red.300");
  const baseColors = useColorModeValue(BASE_COLORS_LIGHT, BASE_COLORS_DARK);

  const { data } = useAccountInsights(ledgerId || "", accountId);

  const lineData = useMemo(() => {
    if (!data?.trend_data?.length) return [];
    return [
      { id: "Income", data: data.trend_data.map(d => ({ x: d.period, y: d.income })) },
      { id: "Expense", data: data.trend_data.map(d => ({ x: d.period, y: d.expense })) },
    ];
  }, [data]);

  if (!data || (data.trend_data.length === 0 && data.top_categories.length === 0)) {
    return null;
  }

  const hasTrend = data.trend_data.length > 0;
  const hasCategories = data.top_categories.length > 0;
  const totalCatAmount = data.top_categories.reduce((s, c) => s + c.amount, 0);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      mb={{ base: 4, md: 5 }}
    >
      <Grid
        templateColumns={{
          base: "1fr",
          lg: hasTrend && hasCategories ? "1fr 1fr" : "1fr",
        }}
        gap={{ base: 4, md: 5 }}
      >
        {/* Monthly Trend Chart */}
        {hasTrend && (
          <GridItem>
            <Box
              bg={cardBg}
              p={{ base: 4, md: 5 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={sectionBorderColor}
              h="full"
            >
              <Flex align="center" gap={2} mb={4}>
                <Icon as={LineChart} boxSize={4} color={iconColor} />
                <Heading
                  as="h3"
                  size="sm"
                  color={primaryTextColor}
                  letterSpacing="-0.02em"
                >
                  Monthly Trend
                </Heading>
              </Flex>

              <Box height={{ base: "220px", md: "260px" }} width="full">
                <ResponsiveLine
                  data={lineData}
                  margin={{ top: 10, right: 20, bottom: 10, left: 60 }}
                  xScale={{ type: "point" }}
                  yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
                  curve="monotoneX"
                  colors={["#38B2AC", "#E53E3E"]}
                  lineWidth={2}
                  enablePoints={data?.trend_data ? data.trend_data.length <= 12 : true}
                  pointSize={6}
                  pointColor={{ theme: "background" }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: "serieColor" }}
                  enableArea={true}
                  areaOpacity={0.15}
                  enableSlices="x"
                  enableGridX={false}
                  gridYValues={5}
                  axisBottom={null}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickValues: 5,
                    format: (v) => {
                      const abs = Math.abs(Number(v));
                      const sym = currencySymbol || "$";
                      if (abs === 0) return "";
                      if (abs >= 100000) return `${sym}${(Number(v) / 100000).toFixed(1)}L`;
                      if (abs >= 1000) return `${sym}${(Number(v) / 1000).toFixed(1)}K`;
                      return `${sym}${v}`;
                    },
                  }}
                  sliceTooltip={({ slice }) => (
                    <Box bg={tooltipBg} borderRadius="10px" px={3} py={2} boxShadow="lg" fontSize="xs" whiteSpace="nowrap">
                      <Text fontWeight="bold" color={axisTickColor} mb={1}>{formatPeriod(slice.points[0].data.xFormatted as string)}</Text>
                      {[...slice.points].sort((a, b) => Number(b.data.y) - Number(a.data.y)).map(point => (
                        <Flex key={point.id} align="center" gap={2} mb={0.5}>
                          <Box w={2} h={2} borderRadius="full" bg={point.seriesColor} flexShrink={0} />
                          <Text fontWeight="600" color={point.seriesColor}>{formatNumberAsCurrency(Number(point.data.y), currencySymbol as string)}</Text>
                        </Flex>
                      ))}
                    </Box>
                  )}
                  theme={{
                    axis: { ticks: { text: { fill: axisTickColor, fontSize: 11 } } },
                    grid: { line: { stroke: gridStroke, strokeWidth: 1 } },
                    crosshair: { line: { stroke: axisTickColor, strokeWidth: 1, strokeOpacity: 0.35 } },
                  }}
                />
              </Box>
              <Flex gap={4} justify="center" mt={2} wrap="wrap">
                <Flex align="center" gap={1.5}>
                  <Box w={3} h={0.5} borderRadius="full" bg="#38B2AC" />
                  <Text fontSize="xs" color={axisTickColor}>Income</Text>
                </Flex>
                <Flex align="center" gap={1.5}>
                  <Box w={3} h={0.5} borderRadius="full" bg="#E53E3E" />
                  <Text fontSize="xs" color={axisTickColor}>Expense</Text>
                </Flex>
              </Flex>
            </Box>
          </GridItem>
        )}

        {/* Top Expense Categories */}
        {hasCategories && (
          <GridItem>
            <Box
              bg={cardBg}
              p={{ base: 4, md: 5 }}
              borderRadius="xl"
              border="1px solid"
              borderColor={sectionBorderColor}
              h="full"
            >
              <Flex align="center" gap={2} mb={4}>
                <Icon as={BarChart2} boxSize={4} color={headingColor} />
                <Heading
                  as="h3"
                  size="sm"
                  color={headingColor}
                  letterSpacing="-0.01em"
                >
                  Top Expense Categories
                </Heading>
              </Flex>

              <VStack align="stretch" spacing={0}>
                {data.top_categories.map((category, idx) => {
                  const pct =
                    totalCatAmount > 0
                      ? (category.amount / totalCatAmount) * 100
                      : 0;
                  const color = baseColors[idx % baseColors.length];

                  return (
                    <Flex
                      key={category.name}
                      align="center"
                      gap={3}
                      py={2.5}
                      px={3}
                      borderRadius="md"
                    >
                      {/* Color dot */}
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        bg={color}
                        flexShrink={0}
                      />

                      {/* Name + bar */}
                      <Box flex={1} minW={0}>
                        <Flex justify="space-between" align="baseline" mb={1}>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color={primaryText}
                            noOfLines={1}
                          >
                            {category.name}
                          </Text>
                          <HStack spacing={2} flexShrink={0}>
                            <Text fontSize="xs" color={secondaryTextColor}>
                              {pct.toFixed(1)}%
                            </Text>
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color={primaryText}
                            >
                              {formatNumberAsCurrency(
                                category.amount,
                                currencySymbol || "$"
                              )}
                            </Text>
                          </HStack>
                        </Flex>
                        {/* Proportional bar */}
                        <Box
                          h="4px"
                          borderRadius="full"
                          bg={barTrackBg}
                          overflow="hidden"
                        >
                          <MotionBox
                            h="full"
                            borderRadius="full"
                            bg={color}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct, 1)}%` }}
                            transition={{
                              duration: 0.6,
                              delay: idx * 0.05,
                              ease: "easeOut",
                            }}
                          />
                        </Box>
                      </Box>
                    </Flex>
                  );
                })}
              </VStack>
            </Box>
          </GridItem>
        )}
      </Grid>
    </MotionBox>
  );
};

export default React.memo(AccountInsights);
