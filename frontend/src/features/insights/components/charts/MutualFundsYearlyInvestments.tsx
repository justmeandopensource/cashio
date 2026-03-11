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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { getMutualFunds, getYearlyInvestments } from "@/features/mutual-funds/api";
import { MutualFund, YearlyInvestment } from "@/features/mutual-funds/types";

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

  // Fetch yearly investments
  const { data: yearlyInvestments = [], isLoading: isLoadingInvestments, isError } = useQuery<YearlyInvestment[]>({
    queryKey: ["yearly-investments", ledgerId, selectedOwner],
    queryFn: () => getYearlyInvestments(Number(ledgerId), selectedOwner),
    enabled: !!ledgerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isLoading = isLoadingFunds || isLoadingInvestments;



  // Get unique owners for dropdown
  const availableOwners = useMemo(() => {
    const owners = Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean))).sort();
    return owners;
  }, [mutualFunds]);

  // Process data for chart
  const chartData: ChartData[] = React.useMemo(() => {
    return yearlyInvestments.map((item) => ({
      year: item.year.toString(),
      invested: Number(item.total_invested),
    }));
  }, [yearlyInvestments]);

  const totalInvested = chartData.reduce((sum, item) => sum + item.invested, 0);

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
            Year: {label}
          </Text>
          <Text color={secondaryTextColor}>
            Invested: {formatNumberAsCurrency(data.invested, currencySymbol as string)}
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
        <Text color={secondaryTextColor}>Loading yearly investments...</Text>
      </VStack>
    );
  }

  // Render error state
  if (isError) {
    return (
      <VStack spacing={4} align="center" bg={cardBg} p={6} borderRadius="lg">
        <Icon as={TrendingUp} color="red.500" boxSize={6} mb={4} />
        <Text color="red.500" fontWeight="bold" fontSize="lg">
          Unable to load yearly investments data
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
              <Icon as={BarChart3} w={5} h={5} color={primaryTextColor} />
              <Heading as="h2" size="md" color={primaryTextColor}>
                Mutual Funds - Yearly Investments
              </Heading>
            </Flex>
            <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
              Investment amounts by year across all mutual funds
            </Text>
          </VStack>

          {availableOwners.length > 0 && (
            <FormControl maxW={{ base: "full", md: "200px" }}>
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
      </VStack>

      {/* Chart Section */}
      <Box height={{ base: "300px", md: "400px" }} width="full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatNumberAsCurrency(value, currencySymbol as string)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="invested"
                fill="#38B2AC"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
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
            <Icon as={BarChart3} boxSize={6} color={tertiaryTextColor} mb={4} />
            <Heading size="md" mb={2} color={secondaryTextColor}>
              No Investment Data Available
            </Heading>
            <Text color={secondaryTextColor} fontSize="sm">
              Add mutual fund investments to see your yearly investment chart.
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
                <StatLabel color={secondaryTextColor}>Total Invested</StatLabel>
                <StatNumber color={primaryTextColor}>
                  {formatNumberAsCurrency(totalInvested, currencySymbol as string)}
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
                <StatLabel color={secondaryTextColor}>Years with Investments</StatLabel>
                <StatNumber color={primaryTextColor}>
                  {chartData.filter(item => item.invested > 0).length}
                </StatNumber>
              </Stat>
            </Box>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default React.memo(MutualFundsYearlyInvestments);