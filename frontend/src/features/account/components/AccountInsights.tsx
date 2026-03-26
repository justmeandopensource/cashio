import React from "react";
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
      { month: "short", year: "numeric" }
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
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.trend_data}
                    margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="period"
                      tickFormatter={formatPeriod}
                      tick={{ fontSize: "0.65rem", fill: axisTickColor }}
                    />
                    <YAxis
                      tickFormatter={(value) => {
                        if (value === 0) return "";
                        const sym = currencySymbol || "$";
                        const abs = Math.abs(value);
                        if (abs >= 100000)
                          return `${sym}${(value / 100000).toFixed(1)}L`;
                        if (abs >= 1000)
                          return `${sym}${(value / 1000).toFixed(1)}K`;
                        return `${sym}${value}`;
                      }}
                      tick={{ fontSize: "0.65rem", fill: axisTickColor }}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        formatNumberAsCurrency(value, currencySymbol as string)
                      }
                      labelFormatter={formatPeriod}
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderRadius: "10px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#38B2AC"
                      fill="#38B2AC"
                      fillOpacity={0.3}
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#E53E3E"
                      fill="#E53E3E"
                      fillOpacity={0.3}
                      name="Expense"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
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
