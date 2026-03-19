import React, { useState, useMemo } from "react";
import {
  Box,
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
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, ChevronDown, Calendar } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { splitCurrencyForDisplay } from "../../../mutual-funds/utils";
import { getMutualFunds, getYearlyInvestments } from "@/features/mutual-funds/api";
import { MutualFund, YearlyInvestment } from "@/features/mutual-funds/types";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

interface MutualFundsYearlyInvestmentsProps {
  ledgerId?: string;
}

interface ChartData {
  year: string;
  invested: number;
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
  const gridStroke = useColorModeValue("#e2e8f0", "#2d3748");
  const axisTickColor = useColorModeValue("#718096", "#cbd5e0");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
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
  const chartData: ChartData[] = useMemo(() => {
    return yearlyInvestments.map((item) => ({
      year: item.year.toString(),
      invested: Number(item.total_invested),
    }));
  }, [yearlyInvestments]);

  const totalInvested = chartData.reduce((sum, item) => sum + item.invested, 0);

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
      icon: TrendingUp,
      label: "Total Invested",
      accentColor: portfolioAccentColor,
      renderValue: () => (
        <HStack spacing={0} align="baseline">
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={positiveColor} lineHeight="short" letterSpacing="-0.01em">
            {splitCurrencyForDisplay(totalInvested, sym).main}
          </Text>
          <Text fontSize="xs" color={positiveColor} opacity={0.6}>
            {splitCurrencyForDisplay(totalInvested, sym).decimals}
          </Text>
        </HStack>
      ),
    },
    {
      icon: Calendar,
      label: "Years with Investments",
      accentColor: countAccentColor,
      renderValue: () => (
        <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color={primaryTextColor} lineHeight="short" letterSpacing="-0.01em">
          {chartData.filter(item => item.invested > 0).length}
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

        {/* Chart Section */}
        <Box height={{ base: "280px", md: "380px" }} width="full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: "0.7rem", fill: axisTickColor }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: "0.7rem", fill: axisTickColor }}
                  tickFormatter={(value) =>
                    value === 0 ? "" : formatNumberAsCurrency(value, currencySymbol as string).replace("£", "")
                  }
                />
                <Tooltip
                  formatter={(value) => formatNumberAsCurrency(Number(value), currencySymbol as string)}
                  contentStyle={{ backgroundColor: tooltipBg, borderRadius: "10px" }}
                />
                <Bar dataKey="invested" fill="#38B2AC" radius={[4, 4, 0, 0]} name="Invested" />
              </BarChart>
            </ResponsiveContainer>
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
