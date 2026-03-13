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
import {
  Coins,
  Plus,
  Package,
  Wallet,
  TrendingUp,
  Activity,
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
import PhysicalAssetsTable from "./PhysicalAssetsTable";

/* eslint-disable no-unused-vars */
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
/* eslint-enable no-unused-vars */

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
  const { currencySymbol } = useLedgerStore();
  const emptyStateBg = useColorModeValue("secondaryBg", "cardDarkBg");
  const emptyStateTextColor = useColorModeValue("gray.600", "gray.400");
  const emptyStateHeadingColor = useColorModeValue("gray.700", "gray.200");
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
  const tealColor = useColorModeValue("teal.600", "teal.300");
  const blueColor = useColorModeValue("blue.600", "blue.300");
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const cardBorderColor = useColorModeValue("gray.200", "gray.700");
  const labelIconColor = useColorModeValue("gray.400", "gray.500");
  const pnlPositiveBadgeBg = useColorModeValue("green.50", "green.900");
  const pnlNegativeBadgeBg = useColorModeValue("red.50", "red.900");

  // Helper function to convert string|number to number
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

  return (
    <Box>
      <VStack spacing={6} align="stretch">
         {assetTypes.length > 0 && (
           <>
             <Flex
               direction={{ base: "column", md: "row" }}
               justify="space-between"
               align={{ base: "start", md: "center" }}
               mb={4}
               gap={{ base: 4, md: 0 }}
             >
               <Flex align="center" mb={{ base: 2, md: 0 }}>
                 <Icon as={Coins} mr={2} color="teal.500" />
                  <Text
                    fontSize={{ base: "lg", md: "xl" }}
                    fontWeight="semibold"
                    color={tertiaryTextColor}
                  >
                    Physical Assets Portfolio
                  </Text>
               </Flex>
               <Flex gap={2} width={{ base: "full", md: "auto" }} direction={{ base: "column", md: "row" }}>
                 <Button
                   leftIcon={<Package size={16} />}
                   colorScheme="teal"
                   variant="outline"
                   size={{ base: "md", md: "sm" }}
                   onClick={onCreateAssetType}
                 >
                   Asset Type
                 </Button>
                 <Button
                   leftIcon={<Plus size={16} />}
                   colorScheme="teal"
                   variant="solid"
                   size={{ base: "md", md: "sm" }}
                   onClick={onCreateAsset}
                 >
                   Physical Asset
                 </Button>
               </Flex>
             </Flex>

             <SimpleGrid
               columns={{ base: 2, sm: 2, lg: 4 }}
               spacing={{ base: 4, md: 6 }}
             >
               {/* Total Invested */}
               <Box p={4} borderRadius="md" boxShadow="sm" bg={cardBg} border="1px solid" borderColor={cardBorderColor} transition="box-shadow 0.2s" _hover={{ boxShadow: "md" }} borderTopWidth="3px" borderTopColor="blue.400">
                 <Flex align="center" gap={1.5} mb={1}>
                   <Icon as={Wallet} boxSize={3} color={labelIconColor} />
                   <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={labelIconColor}>
                     Total Invested
                   </Text>
                 </Flex>
                 <HStack spacing={0} align="baseline">
                   <Text fontSize={{ base: "md", md: "xl" }} fontWeight="semibold" color={tertiaryTextColor} lineHeight="short">
                     {splitCurrencyForDisplay(totalInvested, currencySymbol || "₹").main}
                   </Text>
                   <Text fontSize="xs" fontWeight="semibold" color={tertiaryTextColor} opacity={0.7}>
                     {splitCurrencyForDisplay(totalInvested, currencySymbol || "₹").decimals}
                   </Text>
                 </HStack>
               </Box>

               {/* Total Value */}
               <Box p={4} borderRadius="md" boxShadow="sm" bg={cardBg} border="1px solid" borderColor={cardBorderColor} transition="box-shadow 0.2s" _hover={{ boxShadow: "md" }} borderTopWidth="3px" borderTopColor="teal.400">
                 <Flex align="center" gap={1.5} mb={1}>
                   <Icon as={TrendingUp} boxSize={3} color={labelIconColor} />
                   <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={labelIconColor}>
                     Total Value
                   </Text>
                 </Flex>
                 <HStack spacing={0} align="baseline">
                   <Text fontSize={{ base: "md", md: "xl" }} fontWeight="semibold" color={tealColor} lineHeight="short">
                     {splitCurrencyForDisplay(totalCurrentValue, currencySymbol || "₹").main}
                   </Text>
                   <Text fontSize="xs" fontWeight="semibold" color={tealColor} opacity={0.7}>
                     {splitCurrencyForDisplay(totalCurrentValue, currencySymbol || "₹").decimals}
                   </Text>
                 </HStack>
               </Box>

               {/* Total Unrealized P&L */}
               <Box p={4} borderRadius="md" boxShadow="sm" bg={cardBg} border="1px solid" borderColor={cardBorderColor} transition="box-shadow 0.2s" _hover={{ boxShadow: "md" }} borderTopWidth="3px" borderTopColor={totalUnrealizedPnL >= 0 ? "green.400" : "red.400"}>
                 <Flex align="center" gap={1.5} mb={1}>
                   <Icon as={Activity} boxSize={3} color={labelIconColor} />
                   <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={labelIconColor}>
                     Total Unrealized P&L
                   </Text>
                 </Flex>
                 <VStack align="start" spacing={0}>
                   <HStack spacing={0} align="baseline">
                     <Text fontSize={{ base: "md", md: "xl" }} fontWeight="semibold" color={getPnLColor(totalUnrealizedPnL)} lineHeight="short">
                       {(totalUnrealizedPnL >= 0 ? "+" : "−") + splitCurrencyForDisplay(Math.abs(totalUnrealizedPnL), currencySymbol || "₹").main}
                     </Text>
                     <Text fontSize="xs" fontWeight="semibold" color={getPnLColor(totalUnrealizedPnL)} opacity={0.7}>
                       {splitCurrencyForDisplay(Math.abs(totalUnrealizedPnL), currencySymbol || "₹").decimals}
                     </Text>
                   </HStack>
                   <Flex mt={1} display="inline-flex" align="baseline" gap={0} px={2} py={0.5} borderRadius="full" bg={pnlBadgeBg}>
                     <Text fontSize="2xs" fontWeight="semibold" color={getPnLColor(totalPnLPercentage)}>
                       {splitPercentageForDisplay(totalPnLPercentage).main}
                     </Text>
                     <Text fontSize="2xs" color={getPnLColor(totalPnLPercentage)} opacity={0.8}>
                       {splitPercentageForDisplay(totalPnLPercentage).decimals}
                     </Text>
                   </Flex>
                 </VStack>
               </Box>

               {/* Total Assets */}
               <Box p={4} borderRadius="md" boxShadow="sm" bg={cardBg} border="1px solid" borderColor={cardBorderColor} transition="box-shadow 0.2s" _hover={{ boxShadow: "md" }} borderTopWidth="3px" borderTopColor="purple.400">
                 <Flex align="center" gap={1.5} mb={1}>
                   <Icon as={Package} boxSize={3} color={labelIconColor} />
                   <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={labelIconColor}>
                     Total Assets
                   </Text>
                 </Flex>
                 <VStack align="start" spacing={0}>
                   <Text fontSize={{ base: "md", md: "xl" }} fontWeight="bold" color={blueColor} lineHeight="short">
                     {filteredAssets.filter(asset => toNumber(asset.total_quantity) > 0).length}
                   </Text>
                   <Text fontSize="xs" color={tertiaryTextColor}>
                     Across {assetTypes.length} Asset Type{assetTypes.length !== 1 ? "s" : ""}
                   </Text>
                 </VStack>
               </Box>
             </SimpleGrid>
           </>
         )}

          {assetTypes.length === 0 ? (
            <Box
              p={12}
              textAlign="center"
              bg={emptyStateBg}
              borderRadius="lg"
              boxShadow="sm"
            >
              <VStack spacing={4}>
                <Icon as={Coins} boxSize={16} color="gray.400" />
                <VStack spacing={2}>
                   <Text fontSize="xl" fontWeight="semibold" color={emptyStateHeadingColor}>
                     No Asset Types Created Yet
                   </Text>
                  <Text fontSize="md" color={emptyStateTextColor} maxW="400px">
                    Create your first Asset Type to start tracking physical assets
                  </Text>
                </VStack>
                <Button colorScheme="teal" onClick={onCreateAssetType} size="lg">
                  Create Your First Asset Type
                </Button>
              </VStack>
            </Box>
          ) : physicalAssets.length === 0 ? (
            <Box
              p={12}
              textAlign="center"
              bg={emptyStateBg}
              borderRadius="lg"
              boxShadow="sm"
            >
              <VStack spacing={4}>
                <Icon as={Coins} boxSize={16} color="gray.400" />
                <VStack spacing={2}>
                   <Text fontSize="xl" fontWeight="semibold" color={emptyStateHeadingColor}>
                     No Physical Assets Yet
                   </Text>
                  <Text fontSize="md" color={emptyStateTextColor} maxW="400px">
                    Create your first physical asset to start tracking your portfolio
                  </Text>
                </VStack>
                <Button colorScheme="teal" onClick={onCreateAsset} size="lg">
                  Create Your First Asset
                </Button>
              </VStack>
            </Box>
         ) : (
             <PhysicalAssetsTable
               assetTypes={assetTypes}
               physicalAssets={physicalAssets}
               onBuySell={onBuySell}
               onUpdatePrice={onUpdatePrice}
               onViewTransactions={onViewTransactions}
               filters={filters}
               onFiltersChange={onFiltersChange}
             />
         )}
      </VStack>
    </Box>
  );
};

export default PhysicalAssetsOverview;