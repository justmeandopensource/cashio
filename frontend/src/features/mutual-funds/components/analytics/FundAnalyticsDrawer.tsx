import { FC } from "react";
import {
  Box,
  Text,
  Flex,
  VStack,
  HStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Spinner,
  Icon,
  Badge,
  useColorModeValue,
  useBreakpointValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import { MutualFund } from "../../types";
import { useFundTransactions } from "../../api";
import useLedgerStore from "../../../../components/shared/store";
import { useFundAnalyticsData } from "./useFundAnalyticsData";
import FundAnalyticsSummaryCards from "./FundAnalyticsSummaryCards";
import NavTimelineChart from "./NavTimelineChart";
import InvestmentValueChart from "./InvestmentValueChart";
import TransactionHistoryChart from "./TransactionHistoryChart";
import CostBasisIndicator from "./CostBasisIndicator";

const MotionBox = motion.create(Box);

interface FundAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fund: MutualFund | null;
}

interface AnalyticsContentProps {
  fund: MutualFund;
}

const AnalyticsContent: FC<AnalyticsContentProps> = ({ fund }) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const symbol = currencySymbol || "\u20B9";

  const { data: transactions = [], isLoading } = useFundTransactions(
    Number(ledgerId),
    fund.mutual_fund_id,
  );

  const {
    navTimelineData,
    investmentValueData,
    transactionBarData,
    costBasisRange,
    summaryMetrics,
    hasTransactions,
  } = useFundAnalyticsData(fund, transactions);

  const sectionBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorder = useColorModeValue("gray.100", "gray.700");
  const headingColor = useColorModeValue("gray.700", "gray.200");

  if (isLoading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Summary Cards */}
      <MotionBox
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FundAnalyticsSummaryCards metrics={summaryMetrics} currencySymbol={symbol} />
      </MotionBox>

      {hasTransactions ? (
        <>
          {/* Cost Basis Range */}
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            bg={sectionBg}
            border="1px solid"
            borderColor={sectionBorder}
            borderRadius="xl"
            p={{ base: 3, md: 5 }}
          >
            <Text fontSize="sm" fontWeight="bold" color={headingColor} mb={3} letterSpacing="-0.01em">
              Cost Basis Range
            </Text>
            <CostBasisIndicator range={costBasisRange} currencySymbol={symbol} />
          </MotionBox>

          {/* NAV Timeline */}
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            bg={sectionBg}
            border="1px solid"
            borderColor={sectionBorder}
            borderRadius="xl"
            p={{ base: 3, md: 5 }}
          >
            <Text fontSize="sm" fontWeight="bold" color={headingColor} mb={3} letterSpacing="-0.01em">
              NAV Timeline
            </Text>
            <NavTimelineChart data={navTimelineData} currencySymbol={symbol} />
          </MotionBox>

          {/* Cumulative Investment vs Value */}
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            bg={sectionBg}
            border="1px solid"
            borderColor={sectionBorder}
            borderRadius="xl"
            p={{ base: 3, md: 5 }}
          >
            <Text fontSize="sm" fontWeight="bold" color={headingColor} mb={3} letterSpacing="-0.01em">
              Investment vs Current Value
            </Text>
            <InvestmentValueChart data={investmentValueData} currencySymbol={symbol} />
          </MotionBox>

          {/* Transaction History */}
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            bg={sectionBg}
            border="1px solid"
            borderColor={sectionBorder}
            borderRadius="xl"
            p={{ base: 3, md: 5 }}
          >
            <Text fontSize="sm" fontWeight="bold" color={headingColor} mb={3} letterSpacing="-0.01em">
              Transaction History
            </Text>
            <TransactionHistoryChart data={transactionBarData} currencySymbol={symbol} />
          </MotionBox>
        </>
      ) : (
        <Flex direction="column" align="center" py={12}>
          <Icon as={BarChart3} boxSize={10} color="gray.400" mb={3} />
          <Text fontWeight="bold" color="gray.500">
            No Transactions Yet
          </Text>
          <Text fontSize="sm" color="gray.400">
            Add buy/sell transactions to see analytics
          </Text>
        </Flex>
      )}
    </VStack>
  );
};

const FundAnalyticsDrawer: FC<FundAnalyticsDrawerProps> = ({
  isOpen,
  onClose,
  fund,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const drawerSize = isMobile ? "full" : "full";
  const headerBg = useColorModeValue("white", "gray.800");
  const headerBorder = useColorModeValue("gray.100", "gray.700");
  const bodyBg = useColorModeValue("gray.50", "gray.900");
  const planBadgeBg = useColorModeValue("brand.50", "brand.900");
  const planBadgeColor = useColorModeValue("brand.600", "brand.200");

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size={drawerSize}
    >
      <DrawerOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
      <DrawerContent bg={bodyBg} maxW={{ base: "100%", md: "75%" }}>
        <DrawerCloseButton />
        <DrawerHeader
          bg={headerBg}
          borderBottom="1px solid"
          borderColor={headerBorder}
          pb={3}
        >
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Icon as={TrendingUp} color="brand.500" />
              <Text fontWeight="800" fontSize="lg" letterSpacing="-0.02em" noOfLines={2}>
                {fund?.name || "Fund Analytics"}
              </Text>
            </HStack>
            {fund?.plan && (
              <Badge
                bg={planBadgeBg}
                color={planBadgeColor}
                borderRadius="full"
                px={2}
                fontSize="2xs"
              >
                {fund.plan}
              </Badge>
            )}
            {fund?.amc?.name && (
              <Text fontSize="xs" color="gray.500">
                {fund.amc.name}
              </Text>
            )}
          </VStack>
        </DrawerHeader>
        <DrawerBody py={6} px={{ base: 3, md: 6 }}>
          {fund && <AnalyticsContent fund={fund} />}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default FundAnalyticsDrawer;
