import { FC, useState, useMemo, useEffect } from "react";
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  PieChart,
  Building2,
  RefreshCw,
  Wallet,
  BadgeCheck,
  Activity,
  BookOpen,
} from "lucide-react";
import { Amc, MutualFund } from "../types";
import {
  calculateFundPnL,
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
} from "../utils";
import useLedgerStore from "../../../components/shared/store";
import FinancialTooltip from "@/components/shared/FinancialTooltip";
import { notify } from "@/components/shared/notify";
import MutualFundsTable from "./MutualFundsTable";
import BulkNavUpdateModal from "./modals/BulkNavUpdateModal";
import PortfolioChangeModal from "./modals/PortfolioChangeModal";

const MotionBox = motion.create(Box);
const MotionSimpleGrid = motion.create(SimpleGrid);

const floatKeyframes = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

 
interface MutualFundsOverviewProps {
  amcs: Amc[];
  mutualFunds: MutualFund[];
  onCreateAmc: () => void;
  onCreateFund: (amcId?: number) => void;
  onTradeUnits: (fundId: number) => void;
  onTransferUnits: (fundId: number) => void;
  onUpdateNav: (fund: MutualFund) => void;
  onCloseFund: (fundId: number) => void;
  onViewTransactions: (fundId: number) => void;
  onViewAnalytics: (fund: MutualFund) => void;
    filters: {
      selectedAmc: string;
      selectedOwner: string;
      selectedAssetClass: string;
      showZeroBalance: boolean;
      searchTerm?: string;
    };
    onFiltersChange: (filters: {
      selectedAmc: string;
      selectedOwner: string;
      selectedAssetClass: string;
      showZeroBalance: boolean;
      searchTerm?: string;
    }) => void;
}
 

const MutualFundsOverview: FC<MutualFundsOverviewProps> = ({
  amcs,
  mutualFunds,
  onCreateAmc,
  onCreateFund,
  onTradeUnits,
  onTransferUnits,
  onUpdateNav,
  onCloseFund,
  onViewTransactions,
  onViewAnalytics,
  filters,
  onFiltersChange,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const [isBulkNavModalOpen, setIsBulkNavModalOpen] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [oldStats, setOldStats] = useState<{totalValue: number, totalUnrealizedPnL: number} | null>(null);
  const [portfolioChanges, setPortfolioChanges] = useState<{totalValueChange: number, totalValueChangePercent: number} | null>(null);
  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.12)");
  const emptyTitleColor = useColorModeValue("gray.800", "gray.100");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const cardBorderColor = useColorModeValue("gray.100", "gray.700");
  const labelIconColor = useColorModeValue("gray.400", "gray.500");
  const overviewBg = useColorModeValue("primaryBg", "cardDarkBg");
  const btnGlow = useColorModeValue(
    "0 0 20px rgba(53,169,163,0.25)",
    "0 0 20px rgba(78,194,188,0.2)"
  );

  const toNumber = (value: number | string): number =>
    typeof value === "string" ? parseFloat(value) : value;

  const filteredMutualFunds = useMemo(() => {
    if (filters.selectedOwner === "all") {
      return mutualFunds;
    }
    return mutualFunds.filter((fund) => fund.owner === filters.selectedOwner);
  }, [mutualFunds, filters.selectedOwner]);

  const totalInvested = filteredMutualFunds.reduce(
    (sum, fund) => sum + toNumber(fund.total_invested_cash),
    0
  );
  const totalCurrentValue = filteredMutualFunds.reduce(
    (sum, fund) => sum + toNumber(fund.current_value),
    0
  );
  const totalRealizedGain = filteredMutualFunds.reduce(
    (sum, fund) => sum + toNumber(fund.total_realized_gain || 0),
    0
  );
  const totalUnrealizedPnL = filteredMutualFunds.reduce((sum, fund) => {
    const { unrealizedPnl } = calculateFundPnL(fund);
    return sum + unrealizedPnl;
  }, 0);

  const totalPnLPercentage =
    totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;

  const fundsWithCodes = useMemo(() => {
    return mutualFunds.filter(
      (fund) =>
        fund.code && fund.code.trim() !== "" && toNumber(fund.total_units) > 0
    );
  }, [mutualFunds]);

  // Calculate portfolio changes after NAV update
  useEffect(() => {
    if (showChangeModal && oldStats) {
      const newTotalValue = filteredMutualFunds.reduce(
        (sum, fund) => sum + toNumber(fund.current_value),
        0
      );

      const totalValueChange = newTotalValue - oldStats.totalValue;
      const totalValueChangePercent = oldStats.totalValue > 0 ? (totalValueChange / oldStats.totalValue) * 100 : 0;

      setPortfolioChanges({ totalValueChange, totalValueChangePercent });
    }
  }, [mutualFunds, showChangeModal, oldStats, filteredMutualFunds]);

  const handleOpenBulkNavModal = () => {
    if (fundsWithCodes.length === 0) {
      notify({
        title: "No Funds to Update",
        description:
          "No mutual funds with a positive balance and scheme code were found.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setOldStats({
      totalValue: totalCurrentValue,
      totalUnrealizedPnL: totalUnrealizedPnL,
    });
    setIsBulkNavModalOpen(true);
  };

  const handleBulkNavSuccess = () => {
    notify({
      title: "NAVs Updated",
      description: "Mutual fund NAVs have been successfully updated.",
      status: "success",
      duration: 3000,
    });
    setShowChangeModal(true);
  };

  const totalValueColor = useColorModeValue("brand.600", "brand.400");
  const realizedGainColor = useColorModeValue("green.500", "green.300");
  const unrealizedPnlColor = useColorModeValue("red.500", "red.300");
  const totalFundsColor = useColorModeValue("blue.600", "blue.400");
  const emptyStateTextColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
  const pnlPositiveBadgeBg = useColorModeValue("green.50", "green.900");
  const pnlNegativeBadgeBg = useColorModeValue("red.50", "red.900");
  const pnlBadgeBg = totalUnrealizedPnL >= 0 ? pnlPositiveBadgeBg : pnlNegativeBadgeBg;

  // Accent colors for summary cards
  const investedAccentColor = useColorModeValue("blue.400", "blue.300");
  const valueAccentColor = useColorModeValue("teal.400", "teal.300");
  const realizedAccentColor = useColorModeValue(
    totalRealizedGain >= 0 ? "green.400" : "red.400",
    totalRealizedGain >= 0 ? "green.300" : "red.300"
  );
  const unrealizedAccentColor = useColorModeValue(
    totalUnrealizedPnL >= 0 ? "green.400" : "red.400",
    totalUnrealizedPnL >= 0 ? "green.300" : "red.300"
  );
  const fundsAccentColor = useColorModeValue("purple.400", "purple.300");

  const summaryCards = [
    {
      icon: Wallet,
      label: "Total Invested",
      tooltipTerm: "total_invested" as const,
      accentColor: investedAccentColor,
      valueMain: splitCurrencyForDisplay(totalInvested, currencySymbol || "₹").main,
      valueDecimals: splitCurrencyForDisplay(totalInvested, currencySymbol || "₹").decimals,
      color: tertiaryTextColor,
    },
    {
      icon: TrendingUp,
      label: "Total Value",
      tooltipTerm: "current_value" as const,
      accentColor: valueAccentColor,
      valueMain: splitCurrencyForDisplay(totalCurrentValue, currencySymbol || "₹").main,
      valueDecimals: splitCurrencyForDisplay(totalCurrentValue, currencySymbol || "₹").decimals,
      color: totalValueColor,
    },
    {
      icon: BadgeCheck,
      label: "Total Realized Gain",
      tooltipTerm: "realized_gain" as const,
      accentColor: realizedAccentColor,
      valueMain: (totalRealizedGain >= 0 ? "+" : "−") + splitCurrencyForDisplay(Math.abs(totalRealizedGain), currencySymbol || "₹").main,
      valueDecimals: splitCurrencyForDisplay(Math.abs(totalRealizedGain), currencySymbol || "₹").decimals,
      color: totalRealizedGain >= 0 ? realizedGainColor : unrealizedPnlColor,
    },
    {
      icon: Activity,
      label: "Total Unrealized P&L",
      tooltipTerm: "unrealized_pnl" as const,
      accentColor: unrealizedAccentColor,
      valueMain: (totalUnrealizedPnL >= 0 ? "+" : "−") + splitCurrencyForDisplay(Math.abs(totalUnrealizedPnL), currencySymbol || "₹").main,
      valueDecimals: splitCurrencyForDisplay(Math.abs(totalUnrealizedPnL), currencySymbol || "₹").decimals,
      color: totalUnrealizedPnL >= 0 ? realizedGainColor : unrealizedPnlColor,
      extra: (
        <Flex
          mt={1}
          display="inline-flex"
          align="baseline"
          gap={0}
          px={2}
          py={0.5}
          borderRadius="full"
          bg={pnlBadgeBg}
        >
          <Text
            fontSize="2xs"
            fontWeight="bold"
            color={totalUnrealizedPnL >= 0 ? realizedGainColor : unrealizedPnlColor}
          >
            {splitPercentageForDisplay(totalPnLPercentage).main}
          </Text>
          <Text
            fontSize="2xs"
            color={totalUnrealizedPnL >= 0 ? realizedGainColor : unrealizedPnlColor}
            opacity={0.8}
          >
            {splitPercentageForDisplay(totalPnLPercentage).decimals}
          </Text>
        </Flex>
      ),
    },
    {
      icon: PieChart,
      label: "Total Funds",
      tooltipTerm: null as any,
      accentColor: fundsAccentColor,
      valueMain: String(filteredMutualFunds.filter(fund => toNumber(fund.total_units) > 0).length),
      valueDecimals: "",
      color: totalFundsColor,
      extra: (
        <Text fontSize="xs" color={emptyStateTextColor}>
          Across {amcs.length} AMC{amcs.length !== 1 ? "s" : ""}
        </Text>
      ),
    },
  ];

  return (
    <Box>
      <VStack spacing={6} align="stretch">
         {amcs.length > 0 && (
           <>
             <MotionBox
               initial={{ opacity: 0, y: -8 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.35, ease: "easeOut" }}
             >
               <Flex
                 direction={{ base: "column", md: "row" }}
                 justify="space-between"
                 align={{ base: "flex-start", md: "center" }}
                 mb={{ base: 0, md: 4 }}
                 gap={{ base: 3, md: 0 }}
               >
                 <Flex align="center">
                   <Icon as={TrendingUp} mr={2} color={iconColor} />
                   <Text
                     fontSize={{ base: "lg", md: "xl" }}
                     fontWeight="800"
                     color={tertiaryTextColor}
                     letterSpacing="-0.02em"
                   >
                     Mutual Funds Portfolio
                   </Text>
                 </Flex>
                 {/* Mobile: text links stacked */}
                 <VStack align="flex-start" spacing={2} display={{ base: "flex", md: "none" }}>
                   <Text fontSize="sm" color="brand.500" cursor="pointer" onClick={onCreateAmc} _hover={{ textDecoration: "underline" }}>
                     Create a new AMC
                   </Text>
                   <Text fontSize="sm" color="brand.500" cursor="pointer" onClick={() => onCreateFund()} _hover={{ textDecoration: "underline" }}>
                     Create a new Mutual Fund
                   </Text>
                   {fundsWithCodes.length > 0 && (
                     <Text fontSize="sm" color="brand.500" cursor="pointer" onClick={handleOpenBulkNavModal} _hover={{ textDecoration: "underline" }}>
                       Bulk update Mutual Funds NAV
                     </Text>
                   )}
                 </VStack>
                 {/* Desktop: buttons beside title */}
                 <HStack spacing={2} display={{ base: "none", md: "flex" }}>
                   <Button
                     leftIcon={<Building2 size={16} />}
                     colorScheme="brand"
                     variant="outline"
                     size="sm"
                     onClick={onCreateAmc}
                     borderRadius="lg"
                     fontWeight="bold"
                   >
                     Create AMC
                   </Button>
                   <Button
                     leftIcon={<PieChart size={16} />}
                     colorScheme="brand"
                     variant={amcs.length === 0 ? "outline" : "solid"}
                     size="sm"
                     onClick={() => onCreateFund()}
                     borderRadius="lg"
                     fontWeight="bold"
                     _hover={{ boxShadow: btnGlow }}
                     transition="all 0.2s ease"
                   >
                     Create Fund
                   </Button>
                   {fundsWithCodes.length > 0 && (
                     <Button
                       leftIcon={<RefreshCw size={16} />}
                       colorScheme="brand"
                       variant="outline"
                       size="sm"
                       onClick={handleOpenBulkNavModal}
                       borderRadius="lg"
                       fontWeight="bold"
                     >
                       Update NAVs
                     </Button>
                   )}
                 </HStack>
               </Flex>
             </MotionBox>

             <MotionSimpleGrid
               columns={{ base: 2, sm: 3, lg: 5 }}
               spacing={{ base: 3, md: 4 }}
               initial="hidden"
               animate="visible"
               variants={{
                 hidden: {},
                 visible: { transition: { staggerChildren: 0.06 } },
               }}
             >
               {summaryCards.map(({ icon, label, tooltipTerm, accentColor, valueMain, valueDecimals, color, extra }) => (
                 <MotionBox
                   key={label}
                   variants={{
                     hidden: { opacity: 0, y: 10 },
                     visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
                   }}
                   h="100%"
                 >
                   <Box
                     p={4}
                     borderRadius="xl"
                     bg={cardBg}
                     border="1px solid"
                     borderColor={cardBorderColor}
                     overflow="hidden"
                     position="relative"
                     transition="border-color 0.2s ease"
                     _hover={{ borderColor: accentColor }}
                     h="100%"
                   >
                     {/* Accent line at top */}
                     <Box
                       position="absolute"
                       top={0}
                       left={0}
                       right={0}
                       h="2px"
                       bg={accentColor}
                       opacity={0.7}
                     />

                     <Flex align="center" gap={1.5} mb={2}>
                       <Flex
                         w={5}
                         h={5}
                         borderRadius="md"
                         bg={accentColor}
                         opacity={0.12}
                         position="absolute"
                       />
                       <Flex
                         w={5}
                         h={5}
                         borderRadius="md"
                         align="center"
                         justify="center"
                       >
                         <Icon as={icon} boxSize={3} color={accentColor} />
                       </Flex>
                       <Text
                         fontSize="2xs"
                         fontWeight="semibold"
                         textTransform="uppercase"
                         letterSpacing="wider"
                         color={labelIconColor}
                       >
                         {label}
                         {tooltipTerm && <FinancialTooltip term={tooltipTerm} />}
                       </Text>
                     </Flex>
                     <VStack align="start" spacing={0}>
                       <HStack spacing={0} align="baseline">
                         <Text
                           fontSize={{ base: "lg", md: "xl" }}
                           fontWeight="bold"
                           color={color}
                           lineHeight="short"
                           letterSpacing="-0.01em"
                         >
                           {valueMain}
                         </Text>
                         {valueDecimals && (
                           <Text
                             fontSize="xs"
                             color={color}
                             opacity={0.6}
                           >
                             {valueDecimals}
                           </Text>
                         )}
                       </HStack>
                       {extra}
                     </VStack>
                   </Box>
                 </MotionBox>
               ))}
             </MotionSimpleGrid>
           </>
         )}

          {amcs.length === 0 ? (
            <MotionBox
              textAlign="center"
              py={16}
              px={6}
              display="flex"
              flexDirection="column"
              alignItems="center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Box
                w="80px"
                h="80px"
                borderRadius="2xl"
                bg={emptyIconBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={6}
                css={{ animation: `${floatKeyframes} 3s ease-in-out infinite` }}
              >
                <Icon as={TrendingUp} boxSize={9} color="brand.500" strokeWidth={1.5} />
              </Box>
              <Text fontSize="xl" fontWeight="800" color={emptyTitleColor} mb={2} letterSpacing="-0.02em">
                No AMCs Created Yet
              </Text>
              <Text fontSize="sm" color={emptySubColor} maxW="360px" mb={8} lineHeight="1.6">
                Create your first Asset Management Company to start tracking mutual fund investments
              </Text>
              <MotionBox whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  colorScheme="brand"
                  onClick={onCreateAmc}
                  size="lg"
                  borderRadius="xl"
                  fontWeight="bold"
                  px={8}
                  _hover={{ boxShadow: btnGlow }}
                  transition="all 0.2s ease"
                >
                  Create Your First AMC
                </Button>
              </MotionBox>
            </MotionBox>
          ) : mutualFunds.length === 0 ? (
            <MotionBox
              textAlign="center"
              py={16}
              px={6}
              display="flex"
              flexDirection="column"
              alignItems="center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Box
                w="80px"
                h="80px"
                borderRadius="2xl"
                bg={emptyIconBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={6}
                css={{ animation: `${floatKeyframes} 3s ease-in-out infinite` }}
              >
                <Icon as={BookOpen} boxSize={9} color="brand.500" strokeWidth={1.5} />
              </Box>
              <Text fontSize="xl" fontWeight="800" color={emptyTitleColor} mb={2} letterSpacing="-0.02em">
                No Mutual Funds Yet
              </Text>
              <Text fontSize="sm" color={emptySubColor} maxW="360px" mb={8} lineHeight="1.6">
                Create your first mutual fund to start tracking your portfolio
              </Text>
              <MotionBox whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  colorScheme="brand"
                  onClick={() => onCreateFund()}
                  size="lg"
                  borderRadius="xl"
                  fontWeight="bold"
                  px={8}
                  _hover={{ boxShadow: btnGlow }}
                  transition="all 0.2s ease"
                >
                  Create Your First Fund
                </Button>
              </MotionBox>
            </MotionBox>
         ) : (
             <MotionBox
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
               bg={{ base: "transparent", md: overviewBg }}
               p={{ base: 0, md: 4, lg: 6 }}
               borderRadius={{ base: "none", md: "xl" }}
             >
               <MutualFundsTable
                 amcs={amcs}
                 mutualFunds={mutualFunds}
                 onTradeUnits={onTradeUnits}
                 onTransferUnits={onTransferUnits}
                 onUpdateNav={onUpdateNav}
                 onCloseFund={onCloseFund}
                 onViewTransactions={onViewTransactions}
                 onViewAnalytics={onViewAnalytics}
                 filters={filters}
                 onFiltersChange={onFiltersChange}
               />
             </MotionBox>
         )}
      </VStack>
      <BulkNavUpdateModal
        isOpen={isBulkNavModalOpen}
        onClose={() => setIsBulkNavModalOpen(false)}
        mutualFunds={fundsWithCodes}
        onSuccess={handleBulkNavSuccess}
      />
      {portfolioChanges && (
        <PortfolioChangeModal
          isOpen={!!portfolioChanges}
          onClose={() => {
            setPortfolioChanges(null);
            setShowChangeModal(false);
            setOldStats(null);
          }}
          totalValueChange={portfolioChanges.totalValueChange}
          totalValueChangePercent={portfolioChanges.totalValueChangePercent}
          currencySymbol={currencySymbol || "₹"}
        />
      )}
    </Box>
  );
};

export default MutualFundsOverview;
