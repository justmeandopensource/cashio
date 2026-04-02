import { lazy, Suspense } from "react";
import { Text, Box, Center, Heading, Icon, Skeleton, VStack, useColorModeValue } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { BarChart2 } from "lucide-react";

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const IncomeExpenseTrend = lazy(() => import("./charts/IncomeExpenseTrend"));
const CurrentMonthOverview = lazy(() => import("./charts/CurrentMonthOverview"));
const CategoryTrend = lazy(() => import("./charts/CategoryTrend"));
const TagTrend = lazy(() => import("./charts/TagTrend"));
const ExpenseByStore = lazy(() => import("./charts/ExpenseByStore"));
const ExpenseByLocation = lazy(() => import("./charts/ExpenseByLocation"));
const MutualFundsAllocation = lazy(() => import("./charts/MutualFundsAllocation"));
const MutualFundsAssetClassAllocation = lazy(() => import("./charts/MutualFundsAssetClassAllocation"));
const MutualFundsYearlyInvestments = lazy(() => import("./charts/MutualFundsYearlyInvestments"));
const MutualFundsCorpus = lazy(() => import("./charts/MutualFundsCorpus"));
const ExpenseCalendarHeatmap = lazy(() => import("./charts/ExpenseCalendarHeatmap"));

interface InsightsMainChartsProps {
  ledgerId?: string;
  visualization: string;
}

const InsightsMainCharts = ({
  ledgerId,
  visualization,
}: InsightsMainChartsProps) => {
  const emptyTitleColor = useColorModeValue("gray.700", "gray.200");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");
  const emptyIconBg = useColorModeValue("brand.100", "rgba(116, 207, 202, 0.15)");

  if (!ledgerId) {
    return (
      <Center flexDirection="column" py={20} px={6} textAlign="center">
        <Box
          w="72px"
          h="72px"
          borderRadius="2xl"
          bg={emptyIconBg}
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb={5}
          css={{ animation: `${floatAnimation} 3s ease-in-out infinite` }}
        >
          <Icon as={BarChart2} boxSize={8} color="brand.500" />
        </Box>
        <Heading fontSize="xl" fontWeight="bold" color={emptyTitleColor} mb={2}>
          No ledger selected
        </Heading>
        <Text fontSize="sm" color={emptySubColor} maxW="320px" lineHeight="tall">
          Choose a ledger from the dropdown above to explore 11 different visualizations of your financial data, including spending trends, category breakdowns, and calendar heatmaps.
        </Text>
      </Center>
    );
  }

  const renderVisualization = () => {
    switch (visualization) {
      case "income-expense-trend":
        return <IncomeExpenseTrend ledgerId={ledgerId} />;
      case "current-month-overview":
        return <CurrentMonthOverview />;
      case "category-trend":
        return <CategoryTrend />;
      case "tag-trend":
        return <TagTrend />;
      case "expense-by-store":
        return <ExpenseByStore ledgerId={ledgerId} />;
      case "expense-by-location":
        return <ExpenseByLocation ledgerId={ledgerId} />;
      case "mutual-funds-allocation":
        return <MutualFundsAllocation ledgerId={ledgerId} />;
      case "mutual-funds-asset-class-allocation":
        return <MutualFundsAssetClassAllocation ledgerId={ledgerId} />;
      case "mutual-funds-yearly-investments":
        return <MutualFundsYearlyInvestments ledgerId={ledgerId} />;
      case "mutual-funds-corpus":
        return <MutualFundsCorpus ledgerId={ledgerId} />;
      case "expense-calendar-heatmap":
        return <ExpenseCalendarHeatmap ledgerId={ledgerId} />;
      default:
        return (
          <Center flexDirection="column" py={16} px={6} textAlign="center">
            <Box
              w="64px"
              h="64px"
              borderRadius="2xl"
              bg={emptyIconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={4}
            >
              <Icon as={BarChart2} boxSize={7} color="brand.500" />
            </Box>
            <Heading fontSize="lg" fontWeight="bold" color={emptyTitleColor} mb={2}>
              Visualization not found
            </Heading>
            <Text fontSize="sm" color={emptySubColor} maxW="300px">
              The selected chart type could not be loaded. Try choosing a different visualization from the dropdown above.
            </Text>
          </Center>
        );
    }
  };

  return (
    <Suspense fallback={
      <VStack spacing={4} align="stretch" py={4}>
        <Skeleton height="40px" borderRadius="lg" w="200px" />
        <Skeleton height="340px" borderRadius="xl" />
      </VStack>
    }>
      <Box>{renderVisualization()}</Box>
    </Suspense>
  );
};

export default InsightsMainCharts;
