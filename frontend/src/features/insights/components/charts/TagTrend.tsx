import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  Button,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  Center,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { BarChart, RefreshCw, PieChart as PieChartIcon, AlertCircle, Tag } from "lucide-react";
import config from "@/config";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import FormTags from "@/components/shared/FormTags";

// Define interfaces for the component
interface TagItem {
  tag_id?: string;
  name: string;
}

interface TagBreakdownItem {
  tag: string;
  amount: number;
}

interface CategoryBreakdownItem {
  category: string;
  amount: number;
  type: string;
}

interface TagTrendData {
  tag_breakdown: TagBreakdownItem[];
  category_breakdown: CategoryBreakdownItem[];
  summary: {
    total_amount: number;
  };
}

interface TagTrendAnalysisProps {
  ledgerId?: string;
}

// Predefined colors for the pie charts that are visually distinct but cohesive
const PIE_COLORS = [
  "#38B2AC", // teal.500
  "#4FD1C5", // teal.300
  "#805AD5", // purple.500
  "#D53F8C", // pink.500
  "#F6AD55", // orange.300
  "#FC8181", // red.300
  "#68D391", // green.300
  "#4299E1", // blue.400
  "#F687B3", // pink.300
  "#9F7AEA", // purple.300
  "#ED8936", // orange.500
  "#4A5568", // gray.600
];

const TagTrendAnalysis: React.FC<TagTrendAnalysisProps> = () => {
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const { ledgerId, currencySymbol } = useLedgerStore();

  // Color modes
  const bgColor = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.400");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const customTooltipColor = useColorModeValue("white", "gray.700");
  const breakdownBgColor = useColorModeValue("white", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const buttonColorScheme = "teal";
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");

  // Format the tag names for the API query
  const getTagNamesParam = () => {
    return selectedTags
      .map((tag) => `tag_names=${encodeURIComponent(tag.name)}`)
      .join("&");
  };

  // Fetch data
  const { data, isLoading, isError, refetch } = useQuery<TagTrendData>({
    queryKey: [
      "tag-trend",
      ledgerId,
      selectedTags.map((tag) => tag.name).join(","),
    ],
    queryFn: async () => {
      if (!ledgerId || selectedTags.length === 0) return null;

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${config.apiBaseUrl}/ledger/${ledgerId}/insights/tag-trend?${getTagNamesParam()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tag trend data");
      }

      return response.json();
    },
    enabled: false, // We'll trigger this manually
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle analyze button click
  const handleAnalyze = () => {
    if (selectedTags.length > 0) {
      setIsAnalyzing(true);
      refetch().finally(() => setIsAnalyzing(false));
    }
  };

  // Handle reset button click
  const handleReset = () => {
    setSelectedTags([]);
  };

  // Custom tooltip for pie charts
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const name = payload[0].name;
      const value = payload[0].value;
      const percentage = (
        (value / (data?.summary.total_amount || 0)) *
        100
      ).toFixed(1);

      return (
        <Box p={2} bg={customTooltipColor} borderRadius="md" boxShadow="md">
          <Text fontWeight="bold">{name}</Text>
          <Text>
            {formatNumberAsCurrency(value, currencySymbol as string)} (
            {percentage}%)
          </Text>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box bg={bgColor} borderRadius="lg" p={{ base: 4, md: 6 }} boxShadow="lg">
      {/* Header */}
      <VStack align="flex-start" spacing={1} flex={1} mb={6}>
        <Flex alignItems="center" gap={3}>
          <Icon as={Tag} w={5} h={5} color={primaryTextColor} />
          <Heading as="h2" size="md" color={primaryTextColor}>
            Tag Trend Analysis
          </Heading>
        </Flex>
        <Text color={secondaryTextColor} fontSize="sm" pl="2rem">
          Analyze your spending by tags and categories
        </Text>
      </VStack>

      {/* Tag Selection - Side by side on larger screens */}
      <Box
        mb={6}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        p={4}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={4}
          align={{ base: "stretch", md: "flex-end" }}
        >
          <Box flex="1">
            <FormTags
              tags={selectedTags}
              setTags={setSelectedTags}
              borderColor={borderColor}
              buttonColorScheme={buttonColorScheme}
            />
          </Box>
          <HStack
            spacing={3}
            mt={{ base: 4, md: 0 }}
            justifyContent={{ base: "flex-start", md: "flex-end" }}
            width={{ base: "100%", md: "auto" }}
          >
            <Button
              colorScheme={buttonColorScheme}
              onClick={handleAnalyze}
              isLoading={isLoading || isAnalyzing}
              loadingText="Analyzing"
              isDisabled={selectedTags.length === 0}
              minW="120px"
              leftIcon={<BarChart size={18} />}
            >
              Analyze Trends
            </Button>
            <Button
              leftIcon={<RefreshCw size={18} />}
              variant="outline"
              onClick={handleReset}
              isDisabled={selectedTags.length === 0}
            >
              Reset
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Center p={10}>
          <VStack spacing={4}>
            <Spinner size="xl" color="teal.500" />
            <Text color={secondaryTextColor}>Loading tag analysis...</Text>
          </VStack>
        </Center>
      )}

      {/* Error State */}
      {isError && (
        <Center p={10} bg={cardBg} borderRadius="lg">
          <VStack spacing={4}>
            <Icon as={AlertCircle} color="red.500" boxSize={10} />
            <Text color="red.500" fontWeight="bold">
              Unable to load tag analysis
            </Text>
            <Text color={secondaryTextColor} textAlign="center">
              Please check your selected tags or try again later.
            </Text>
          </VStack>
        </Center>
      )}

      {/* No Data State */}
      {!isLoading && !isError && !data && (
        <Center p={10} bg={cardBg} borderRadius="lg">
          <VStack spacing={4}>
            <Icon as={PieChartIcon} boxSize={16} color={tertiaryTextColor} />
            <Text color={secondaryTextColor} fontWeight="medium" fontSize="lg">
              Select tags to analyze your spending trends
            </Text>
            <Text color={secondaryTextColor} fontSize="sm" textAlign="center">
              Choose one or more tags and click &quot;Analyze Trends&quot; to
              see your spending breakdown
            </Text>
          </VStack>
        </Center>
      )}

      {/* Results */}
      {data && (
        <VStack spacing={6}>
          {/* Total Amount Card */}
          <Box
            bg={cardBg}
            p={6}
            borderRadius="lg"
            width="full"
            boxShadow="md"
            textAlign="center"
          >
            <Stat>
              <StatLabel color={secondaryTextColor} fontSize="lg">
                Total Amount for Selected Tags
              </StatLabel>
              <StatNumber color={primaryTextColor} fontSize="3xl">
                {formatNumberAsCurrency(
                  data.summary.total_amount,
                  currencySymbol as string,
                )}
              </StatNumber>
            </Stat>
          </Box>

          {/* Charts */}
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
            gap={6}
            width="full"
          >
            {/* Tag Breakdown Chart */}
            <GridItem>
              <Box
                bg={cardBg}
                p={6}
                borderRadius="lg"
                width="full"
                boxShadow="md"
                height={{ base: "350px", md: "400px" }}
              >
                <Heading size="sm" mb={4} textAlign="center">
                  Tag Breakdown
                </Heading>
                {data.tag_breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={data.tag_breakdown}
                        dataKey="amount"
                        nameKey="tag"
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        labelLine={false}
                      >
                        {data.tag_breakdown.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={renderCustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Center height="100%">
                    <Text color={secondaryTextColor}>
                      No tag data available
                    </Text>
                  </Center>
                )}
              </Box>
            </GridItem>

            {/* Category Breakdown Chart */}
            <GridItem>
              <Box
                bg={cardBg}
                p={6}
                borderRadius="lg"
                width="full"
                boxShadow="md"
                height={{ base: "350px", md: "400px" }}
              >
                <Heading size="sm" mb={4} textAlign="center">
                  Category Breakdown
                </Heading>
                {data.category_breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={data.category_breakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        labelLine={false}
                      >
                        {data.category_breakdown.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[(index + 5) % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={renderCustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Center height="100%">
                    <Text color={secondaryTextColor}>
                      No category data available
                    </Text>
                  </Center>
                )}
              </Box>
            </GridItem>
          </Grid>

          {/* Detailed Breakdown in Separate Cards */}
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
            gap={6}
            width="full"
          >
            {/* Tag Breakdown Card */}
            <GridItem>
              <Box
                bg={cardBg}
                p={6}
                borderRadius="lg"
                width="full"
                boxShadow="md"
                height="full"
              >
                <Heading size="sm" mb={4}>
                  Detailed Tag Breakdown
                </Heading>
                <VStack spacing={2} align="stretch">
                  {data.tag_breakdown.map((item, index) => (
                    <HStack
                      key={index}
                      justifyContent="space-between"
                      p={2}
                      borderRadius="md"
                      bg={breakdownBgColor}
                    >
                      <HStack>
                        <Box
                          width="3"
                          height="3"
                          borderRadius="full"
                          bg={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                        <Text fontSize="sm" fontWeight="medium">
                          {item.tag}
                        </Text>
                      </HStack>
                      <Text fontSize="sm">
                        {formatNumberAsCurrency(
                          item.amount,
                          currencySymbol as string,
                        )}
                        <Text
                          as="span"
                          fontSize="xs"
                          color={secondaryTextColor}
                          ml={1}
                        >
                          (
                          {(
                            (item.amount / data.summary.total_amount) *
                            100
                          ).toFixed(1)}
                          %)
                        </Text>
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </GridItem>

            {/* Category Breakdown Card */}
            <GridItem>
              <Box
                bg={cardBg}
                p={6}
                borderRadius="lg"
                width="full"
                boxShadow="md"
                height="full"
              >
                <Heading size="sm" mb={4}>
                  Detailed Category Breakdown
                </Heading>
                <VStack spacing={2} align="stretch">
                  {data.category_breakdown.map((item, index) => (
                    <HStack
                      key={index}
                      justifyContent="space-between"
                      p={2}
                      borderRadius="md"
                      bg={breakdownBgColor}
                    >
                      <HStack>
                        <Box
                          width="3"
                          height="3"
                          borderRadius="full"
                          bg={PIE_COLORS[(index + 5) % PIE_COLORS.length]}
                        />
                        <Text fontSize="sm" fontWeight="medium">
                          {item.category}
                        </Text>
                      </HStack>
                      <Text fontSize="sm">
                        {formatNumberAsCurrency(
                          item.amount,
                          currencySymbol as string,
                        )}
                        <Text
                          as="span"
                          fontSize="xs"
                          color={secondaryTextColor}
                          ml={1}
                        >
                          (
                          {(
                            (item.amount / data.summary.total_amount) *
                            100
                          ).toFixed(1)}
                          %)
                        </Text>
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </GridItem>
          </Grid>
        </VStack>
      )}
    </Box>
  );
};

export default React.memo(TagTrendAnalysis);
