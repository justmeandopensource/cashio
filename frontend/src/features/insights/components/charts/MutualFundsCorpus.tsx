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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Activity } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { getMutualFunds, getCorpusGrowth } from "@/features/mutual-funds/api";
import { MutualFund, YearlyInvestment } from "@/features/mutual-funds/types";

interface MutualFundsCorpusProps {
  ledgerId?: string;
}

interface ChartData {
  date: string;
  corpus: number;
}

const MutualFundsCorpus: React.FC<MutualFundsCorpusProps> = ({
  ledgerId,
}) => {
  const { currencySymbol } = useLedgerStore();
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [selectedGranularity, setSelectedGranularity] = useState<string>("monthly");

  // Color modes
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

  // Fetch mutual funds data
  const { data: mutualFunds = [], isLoading: isLoadingFunds } = useQuery<MutualFund[]>({
    queryKey: ["mutual-funds", ledgerId],
    queryFn: () => getMutualFunds(Number(ledgerId)),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch corpus growth data
  const { data: corpusGrowth = [], isLoading: isLoadingCorpus, isError } = useQuery<YearlyInvestment[]>({
    queryKey: ["corpus-growth", ledgerId, selectedOwner, selectedGranularity],
    queryFn: () => getCorpusGrowth(Number(ledgerId), selectedOwner, selectedGranularity),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isLoading = isLoadingFunds || isLoadingCorpus;



  // Get unique owners for dropdown
  const availableOwners = useMemo(() => {
    const owners = Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean))).sort();
    return owners;
  }, [mutualFunds]);

  // Process data for chart
  const chartData: ChartData[] = React.useMemo(() => {
    return corpusGrowth.map((item) => ({
      date: selectedGranularity === "monthly" && item.month
        ? `${item.year}-${item.month.toString().padStart(2, '0')}`
        : item.year.toString(),
      corpus: Number(item.total_invested),
    }));
  }, [corpusGrowth, selectedGranularity]);

  const currentCorpus = chartData.length > 0 ? chartData[chartData.length - 1].corpus : 0;
  const totalDataPoints = chartData.length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          bg={tooltipBg}
          p={3}
          borderRadius="md"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="bold" color={primaryTextColor}>
            {selectedGranularity === "monthly" && label.includes('-') ? `Month: ${label}` : `Year: ${label}`}
          </Text>
          <Text color={secondaryTextColor}>
            Total Corpus: {formatNumberAsCurrency(data.corpus, currencySymbol as string)}
          </Text>
        </Box>
      );
    }
    return null;
  };

  // Render loading state
  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" bg={cardBg} p={6} borderRadius="lg">
        <Text color={secondaryTextColor}>Loading corpus growth...</Text>
      </VStack>
    );
  }

  // Render error state
  if (isError) {
    return (
      <VStack spacing={4} align="center" bg={cardBg} p={6} borderRadius="lg">
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load corpus growth data
        </Text>
      </VStack>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="lg" p={{ base: 4, md: 6 }} boxShadow="lg">
      {/* Header */}
      <VStack spacing={4} align="stretch" mb={6}>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          direction={{ base: "column", md: "row" }}
          gap={4}
        >
          <VStack align="start" spacing={1} flex={1}>
            <Flex alignItems="center" gap={3}>
              <Icon as={Activity} w={5} h={5} color={primaryTextColor} />
              <Heading as="h2" size="md" color={primaryTextColor}>
                Mutual Funds - Corpus
              </Heading>
            </Flex>
            <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
              Cumulative growth of your total invested corpus over time
            </Text>
          </VStack>

          <Flex gap={4} direction={{ base: "column", md: "row" }} flexWrap="wrap">
            <FormControl w={{ base: "full", md: "100px" }} flexShrink={0}>
              <Select
                value={selectedGranularity}
                onChange={(e) => setSelectedGranularity(e.target.value)}
                size="sm"
                bg={cardBg}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </FormControl>

            {availableOwners.length > 0 && (
              <FormControl w={{ base: "full", md: "200px" }} flexShrink={0}>
                <Select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  size="sm"
                  bg={cardBg}
                >
                  <option value="all">All Owners</option>
                  {availableOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}
          </Flex>
        </Flex>
      </VStack>

      {/* Chart Section */}
      <Box height={{ base: "300px", md: "400px" }} width="full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="corpusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38B2AC" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#38B2AC" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval={selectedGranularity === "monthly" ? Math.max(1, Math.floor(chartData.length / 10)) : "preserveStartEnd"}
                tickFormatter={(value) => {
                  if (selectedGranularity === "monthly" && value.includes('-')) {
                    const [year, month] = value.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                  }
                  return value;
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatNumberAsCurrency(value, currencySymbol as string)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="corpus"
                stroke="#38B2AC"
                fillOpacity={1}
                fill="url(#corpusGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Center
            height="full"
            bg={bgColor}
            borderRadius="lg"
            flexDirection="column"
            textAlign="center"
            p={6}
          >
            <Icon as={Activity} boxSize={6} color={tertiaryTextColor} mb={4} />
            <Heading size="md" mb={2} color={secondaryTextColor}>
              No Corpus Data Available
            </Heading>
            <Text color={secondaryTextColor} fontSize="sm">
              Add mutual fund investments to see your corpus growth.
            </Text>
          </Center>
        )}
      </Box>

      {/* Summary Stats */}
      {chartData.length > 0 && (
        <VStack spacing={4} mt={6} width="full">
          <HStack
            spacing={4}
            width="full"
            flexDirection={{ base: "column", md: "row" }}
          >
            <Box
              bg={cardBg}
              p={6}
              borderRadius="lg"
              width="full"
              boxShadow="md"
            >
              <Stat>
                <StatLabel color={secondaryTextColor}>Current Corpus</StatLabel>
                <StatNumber color={primaryTextColor}>
                  {formatNumberAsCurrency(currentCorpus, currencySymbol as string)}
                </StatNumber>
              </Stat>
            </Box>

            <Box
              bg={cardBg}
              p={6}
              borderRadius="lg"
              width="full"
              boxShadow="md"
            >
              <Stat>
                <StatLabel color={secondaryTextColor}>
                  {selectedGranularity === "monthly" ? "Months" : "Years"}
                </StatLabel>
                <StatNumber color={primaryTextColor}>
                  {totalDataPoints}
                </StatNumber>
              </Stat>
            </Box>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default React.memo(MutualFundsCorpus);