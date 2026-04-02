import { FC } from "react";
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
  Coins,
  Plus,
  Package,
  Wallet,
  TrendingUp,
  Activity,
  BookOpen,
} from "lucide-react";
import { PhysicalAsset, AssetType } from "../types";
import {
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
  getPnLColor,
  calculateTotalPortfolioValue,
  calculateTotalUnrealizedPnL,
  calculateTotalUnrealizedPnLPercentage,
} from "../utils";
import useLedgerStore from "../../../components/shared/store";
import FinancialTooltip from "@/components/shared/FinancialTooltip";
import PhysicalAssetsTable from "./PhysicalAssetsTable";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

const floatKeyframes = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

 
interface PhysicalAssetsOverviewProps {
  assetTypes: AssetType[];
  physicalAssets: PhysicalAsset[];
  onCreateAssetType: () => void;
  onCreateAsset: () => void;
  onBuySell: (assetId: number) => void;
  onUpdatePrice: (asset: PhysicalAsset) => void;
  onViewTransactions: (asset: PhysicalAsset) => void;
    filters: {
      selectedAssetType: string;
      showZeroBalance: boolean;
      searchTerm?: string;
    };
    onFiltersChange: (filters: {
      selectedAssetType: string;
      showZeroBalance: boolean;
      searchTerm?: string;
    }) => void;
}
 

const PhysicalAssetsOverview: FC<PhysicalAssetsOverviewProps> = ({
  assetTypes,
  physicalAssets,
  onCreateAssetType,
  onCreateAsset,
  onBuySell,
  onUpdatePrice,
  onViewTransactions,
  filters,
  onFiltersChange,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);

  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const tealColor = useColorModeValue("brand.600", "brand.400");
  const blueColor = useColorModeValue("blue.600", "blue.400");
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const cardBorderColor = useColorModeValue("gray.100", "gray.700");
  const labelIconColor = useColorModeValue("gray.400", "gray.500");
  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.12)");
  const emptyTitleColor = useColorModeValue("gray.800", "gray.100");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");
  const pnlPositiveBadgeBg = useColorModeValue("green.50", "green.900");
  const pnlNegativeBadgeBg = useColorModeValue("red.50", "red.900");
  const btnGlow = useColorModeValue(
    "0 0 20px rgba(53,169,163,0.25)",
    "0 0 20px rgba(78,194,188,0.2)"
  );

  const toNumber = (value: number | string): number =>
    typeof value === "string" ? parseFloat(value) : value;

  const filteredAssets = physicalAssets.filter((asset) => {
    if (filters.selectedAssetType !== "all") {
      const assetType = assetTypes.find((type) => type.asset_type_id === asset.asset_type_id);
      if (assetType?.name !== filters.selectedAssetType) return false;
    }
    if (!filters.showZeroBalance && toNumber(asset.total_quantity) <= 0) return false;
    if (filters.searchTerm && filters.searchTerm.trim() !== "") {
      const searchLower = filters.searchTerm.toLowerCase();
      const assetType = assetTypes.find((type) => type.asset_type_id === asset.asset_type_id);
      if (!asset.name.toLowerCase().includes(searchLower) &&
          !assetType?.name.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  const totalInvested = filteredAssets.reduce(
    (sum, asset) => sum + toNumber(asset.total_quantity) * toNumber(asset.average_cost_per_unit),
    0
  );
  const totalCurrentValue = calculateTotalPortfolioValue(filteredAssets);
  const totalUnrealizedPnL = calculateTotalUnrealizedPnL(filteredAssets);
  const totalPnLPercentage = calculateTotalUnrealizedPnLPercentage(filteredAssets);
  const pnlBadgeBg = totalUnrealizedPnL >= 0 ? pnlPositiveBadgeBg : pnlNegativeBadgeBg;

  const pnlAccentColor = useColorModeValue(
    totalUnrealizedPnL >= 0 ? "green.400" : "red.400",
    totalUnrealizedPnL >= 0 ? "green.300" : "red.300"
  );
  const investedAccentColor = useColorModeValue("blue.400", "blue.300");
  const valueAccentColor = useColorModeValue("teal.400", "teal.300");
  const countAccentColor = useColorModeValue("purple.400", "purple.300");

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
      color: tealColor,
    },
    {
      icon: Activity,
      label: "Total Unrealized P&L",
      tooltipTerm: "unrealized_pnl" as const,
      accentColor: pnlAccentColor,
      valueMain: (totalUnrealizedPnL >= 0 ? "+" : "−") + splitCurrencyForDisplay(Math.abs(totalUnrealizedPnL), currencySymbol || "₹").main,
      valueDecimals: splitCurrencyForDisplay(Math.abs(totalUnrealizedPnL), currencySymbol || "₹").decimals,
      color: getPnLColor(totalUnrealizedPnL),
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
          <Text fontSize="2xs" fontWeight="bold" color={getPnLColor(totalPnLPercentage)}>
            {splitPercentageForDisplay(totalPnLPercentage).main}
          </Text>
          <Text fontSize="2xs" color={getPnLColor(totalPnLPercentage)} opacity={0.8}>
            {splitPercentageForDisplay(totalPnLPercentage).decimals}
          </Text>
        </Flex>
      ),
    },
    {
      icon: Package,
      label: "Total Assets",
      tooltipTerm: null as any,
      accentColor: countAccentColor,
      valueMain: String(filteredAssets.filter(asset => toNumber(asset.total_quantity) > 0).length),
      valueDecimals: "",
      color: blueColor,
      extra: (
        <Text fontSize="xs" color={tertiaryTextColor}>
          Across {assetTypes.length} Asset Type{assetTypes.length !== 1 ? "s" : ""}
        </Text>
      ),
    },
  ];

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {assetTypes.length > 0 && (
          <>
            <MotionBox
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "start", md: "center" }}
                mb={4}
                gap={{ base: 4, md: 0 }}
              >
                <Flex align="center" mb={{ base: 2, md: 0 }}>
                  <Icon as={Coins} mr={2} color={iconColor} />
                  <Text
                    fontSize={{ base: "lg", md: "xl" }}
                    fontWeight="800"
                    color={tertiaryTextColor}
                    letterSpacing="-0.02em"
                  >
                    Physical Assets Portfolio
                  </Text>
                </Flex>
                <Flex gap={2} width={{ base: "full", md: "auto" }} direction={{ base: "column", md: "row" }}>
                  <Button
                    leftIcon={<Package size={16} />}
                    colorScheme="brand"
                    variant="outline"
                    size={{ base: "md", md: "sm" }}
                    onClick={onCreateAssetType}
                    borderRadius="lg"
                    fontWeight="bold"
                  >
                    Create Asset Type
                  </Button>
                  <Button
                    leftIcon={<Plus size={16} />}
                    colorScheme="brand"
                    variant="solid"
                    size={{ base: "md", md: "sm" }}
                    onClick={onCreateAsset}
                    borderRadius="lg"
                    fontWeight="bold"
                    _hover={{ boxShadow: btnGlow }}
                    transition="all 0.2s ease"
                  >
                    Add Physical Asset
                  </Button>
                </Flex>
              </Flex>
            </MotionBox>

            <MotionSimpleGrid
              columns={{ base: 2, sm: 2, lg: 4 }}
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

        {assetTypes.length === 0 ? (
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
              <Icon as={Coins} boxSize={9} color="brand.500" strokeWidth={1.5} />
            </Box>
            <Text fontSize="xl" fontWeight="800" color={emptyTitleColor} mb={2} letterSpacing="-0.02em">
              No Asset Types Created Yet
            </Text>
            <Text fontSize="sm" color={emptySubColor} maxW="360px" mb={8} lineHeight="1.6">
              Create your first Asset Type to start tracking physical assets
            </Text>
            <MotionBox whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                colorScheme="brand"
                onClick={onCreateAssetType}
                size="lg"
                borderRadius="xl"
                fontWeight="bold"
                px={8}
                _hover={{ boxShadow: btnGlow }}
                transition="all 0.2s ease"
              >
                Create Your First Asset Type
              </Button>
            </MotionBox>
          </MotionBox>
        ) : physicalAssets.length === 0 ? (
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
              No Physical Assets Yet
            </Text>
            <Text fontSize="sm" color={emptySubColor} maxW="360px" mb={8} lineHeight="1.6">
              Create your first physical asset to start tracking your portfolio
            </Text>
            <MotionBox whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                colorScheme="brand"
                onClick={onCreateAsset}
                size="lg"
                borderRadius="xl"
                fontWeight="bold"
                px={8}
                _hover={{ boxShadow: btnGlow }}
                transition="all 0.2s ease"
              >
                Create Your First Asset
              </Button>
            </MotionBox>
          </MotionBox>
        ) : (
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
          >
            <PhysicalAssetsTable
              assetTypes={assetTypes}
              physicalAssets={physicalAssets}
              onBuySell={onBuySell}
              onUpdatePrice={onUpdatePrice}
              onViewTransactions={onViewTransactions}
              filters={filters}
              onFiltersChange={onFiltersChange}
            />
          </MotionBox>
        )}
      </VStack>
    </Box>
  );
};

export default PhysicalAssetsOverview;
