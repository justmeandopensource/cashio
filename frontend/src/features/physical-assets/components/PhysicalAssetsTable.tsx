import React, { useState, useMemo } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
  Button,
  HStack,
  Collapse,
  IconButton,
  Select,
  Flex,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  Switch,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  useBreakpointValue,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  RefreshCw,
  List,
  Search,
  ChevronUp,
} from "lucide-react";
import { PhysicalAsset, AssetType } from "../types";
import {
  calculateUnrealizedPnL,
  calculateUnrealizedPnLPercentage,
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
  splitQuantityForDisplay,
  getPnLColor,
  calculateHighestPurchasePrice,
  calculateLowestPurchasePrice,
} from "../utils";

// Helper function to convert string|number to number
const toNumber = (value: number | string): number => typeof value === 'string' ? parseFloat(value) : value;
import { useAssetTransactions } from "../api";
import useLedgerStore from "../../../components/shared/store";

// Expanded Asset Row Component
/* eslint-disable no-unused-vars */
interface ExpandedAssetRowProps {
  asset: PhysicalAsset & { asset_type_name: string; invested: number; unrealized_pnl: number; unrealized_pnl_percentage: number };
  currencySymbol: string | undefined;
  mutedColor: string;
  isExpanded: boolean;
  onBuySell: (assetId: number) => void;
  onUpdatePrice: (asset: PhysicalAsset) => void;
  onViewTransactions: (asset: PhysicalAsset) => void;
}
/* eslint-enable no-unused-vars */

const ExpandedAssetRow: React.FC<ExpandedAssetRowProps> = ({
  asset,
  currencySymbol,
  mutedColor,
  isExpanded,
  onBuySell,
  onUpdatePrice,
  onViewTransactions,
}) => {
  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useAssetTransactions(asset.ledger_id, asset.physical_asset_id, {
      enabled: isExpanded,
    });

  // Convert transactions for cost calculations
  const purchaseTransactions = transactions.map((t) => ({
    transaction_type: t.transaction_type,
    price_per_unit: toNumber(t.price_per_unit),
  }));

  const highestPurchasePrice = calculateHighestPurchasePrice(purchaseTransactions);
  const lowestPurchasePrice = calculateLowestPurchasePrice(purchaseTransactions);
  const boxBg = useColorModeValue("gray.50", "cardDarkBg");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");

  return (
    <Box
      py={{ base: 2, md: 3 }}
      px={{ base: 2, md: 3 }}
      pl={{ md: "4.5rem" }}
      bg={boxBg}
      borderTop="1px solid"
      borderColor={borderColor}
    >
      <Flex
        wrap="wrap"
        align="center"
        justify="space-between"
        columnGap={4}
        rowGap={3}
      >
        <HStack spacing={{ base: 3, md: 5 }} wrap="wrap">
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Lowest Cost
            </StatLabel>
            <HStack spacing={0} align="baseline">
              <StatNumber fontSize="sm" color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? "..."
                  : lowestPurchasePrice !== null
                  ? splitCurrencyForDisplay(
                      lowestPurchasePrice,
                      currencySymbol || "₹",
                    ).main
                  : "--"}
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? ""
                  : lowestPurchasePrice !== null
                  ? splitCurrencyForDisplay(
                      lowestPurchasePrice,
                      currencySymbol || "₹",
                    ).decimals
                  : ""}
              </Text>
            </HStack>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Avg. Cost
            </StatLabel>
            <HStack spacing={0} align="baseline">
              <StatNumber fontSize="sm" color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(asset.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).main
                }
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(asset.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).decimals
                }
              </Text>
            </HStack>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Highest Cost
            </StatLabel>
            <HStack spacing={0} align="baseline">
              <StatNumber fontSize="sm" color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? "..."
                  : highestPurchasePrice !== null
                  ? splitCurrencyForDisplay(
                      highestPurchasePrice,
                      currencySymbol || "₹",
                    ).main
                  : "--"}
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? ""
                  : highestPurchasePrice !== null
                  ? splitCurrencyForDisplay(
                      highestPurchasePrice,
                      currencySymbol || "₹",
                    ).decimals
                  : ""}
              </Text>
            </HStack>
          </Stat>
        </HStack>

        <HStack spacing={2}>
           <Button
             size="xs"
             variant="outline"
             leftIcon={<Icon as={ShoppingCart} boxSize={3} />}
             onClick={() => onBuySell(asset.physical_asset_id)}
           >
             Buy/Sell
           </Button>
           <Button
             size="xs"
             variant="outline"
             leftIcon={<Icon as={List} boxSize={3} />}
              onClick={() => onViewTransactions(asset)}
           >
             Transactions
           </Button>
           <Button
             size="xs"
             variant="outline"
             leftIcon={<Icon as={RefreshCw} boxSize={3} />}
             onClick={() => onUpdatePrice(asset)}
           >
             Update Price
           </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

/* eslint-disable no-unused-vars */
interface PhysicalAssetsTableProps {
  assetTypes: AssetType[];
  physicalAssets: PhysicalAsset[];
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

type SortField =
  | "asset_type"
  | "asset"
  | "invested"
  | "value"
  | "unrealized_pnl"
  | "unrealized_pnl_percentage";

type SortDirection = "asc" | "desc";

const PhysicalAssetsTable: React.FC<PhysicalAssetsTableProps> = ({
  assetTypes,
  physicalAssets,
  onBuySell,
  onUpdatePrice,
  onViewTransactions,
  filters,
  onFiltersChange,
}) => {
  const { currencySymbol } = useLedgerStore();
  const mutedColor = useColorModeValue("gray.600", "gray.400");
   const isMobile = useBreakpointValue({ base: true, md: false });
   const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
   const tableBg = useColorModeValue("primaryBg", "cardDarkBg");
   const tableBorderColor = useColorModeValue("gray.200", "gray.500");
   const tableHoverBg = useColorModeValue("secondaryBg", "secondaryBg");

   // State for sorting
   const [sortField, setSortField] =
     useState<SortField>("unrealized_pnl_percentage");
   const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Available Asset Types based on selected filters
    const availableAssetTypes = useMemo(() => {
      const assetTypeIds = new Set(physicalAssets.map((asset) => asset.asset_type_id));
      return assetTypes
        .filter((assetType) => assetTypeIds.has(assetType.asset_type_id))
        .sort((a, b) => a.name.localeCompare(b.name));
    }, [assetTypes, physicalAssets]);

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Prepare data with asset type names
  const assetsWithType = useMemo(() => {
    return physicalAssets.map((asset) => {
      const assetType = assetTypes.find((type) => type.asset_type_id === asset.asset_type_id);
      const investedNum =
        toNumber(asset.total_quantity) * toNumber(asset.average_cost_per_unit);
      const currentValueNum = toNumber(asset.current_value);
      const unrealizedPnl = calculateUnrealizedPnL(asset);
      const unrealizedPnlPercentage = calculateUnrealizedPnLPercentage(asset);

      return {
        ...asset,
        asset_type_name: assetType?.name || "Unknown Asset Type",
        invested: investedNum,
        current_value: currentValueNum,
        unrealized_pnl: unrealizedPnl,
        unrealized_pnl_percentage: unrealizedPnlPercentage,
      };
    });
  }, [physicalAssets, assetTypes]);

   // Filter assets based on selected asset type, zero balance toggle, and search term
    const filteredAssets = useMemo(() => {
      let assets = assetsWithType;

      // Search filter
      if (filters.searchTerm && filters.searchTerm.trim() !== "") {
        const searchLower = filters.searchTerm.toLowerCase();
        assets = assets.filter((asset) =>
          asset.name.toLowerCase().includes(searchLower) ||
          asset.asset_type_name.toLowerCase().includes(searchLower)
        );
      }

      // Asset type filter
      if (filters.selectedAssetType !== "all") {
        assets = assets.filter((asset) => asset.asset_type_name === filters.selectedAssetType);
      }

      // Zero balance filter
      if (!filters.showZeroBalance) {
        assets = assets.filter((asset) => toNumber(asset.total_quantity) > 0);
      }

      return assets;
     }, [assetsWithType, filters.selectedAssetType, filters.showZeroBalance, filters.searchTerm]);

  // Sort assets
  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "asset_type":
          aValue = a.asset_type_name.toLowerCase();
          bValue = b.asset_type_name.toLowerCase();
          break;
        case "asset":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "invested":
          aValue = a.invested;
          bValue = b.invested;
          break;
        case "value":
          aValue = a.current_value;
          bValue = b.current_value;
          break;
        case "unrealized_pnl":
          aValue = a.unrealized_pnl;
          bValue = b.unrealized_pnl;
          break;
        case "unrealized_pnl_percentage":
          aValue = a.unrealized_pnl_percentage;
          bValue = b.unrealized_pnl_percentage;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortDirection === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [filteredAssets, sortField, sortDirection]);

  // Check if there are any assets with zero quantity
  const hasZeroQuantityAssets = useMemo(() => {
    return physicalAssets.some((asset) => toNumber(asset.total_quantity) === 0);
  }, [physicalAssets]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRowExpansion = (assetId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId);
    } else {
      newExpanded.add(assetId);
    }
    setExpandedRows(newExpanded);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} />;
    return sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const renderExpandedRow = (
    asset: PhysicalAsset & {
      asset_type_name: string;
      invested: number;
      unrealized_pnl: number;
      unrealized_pnl_percentage: number;
    },
  ) => {
    return (
      <Tr key={`expanded-${asset.physical_asset_id}`}>
        <Td colSpan={9} p={0}>
          <Collapse in={expandedRows.has(asset.physical_asset_id)} animateOpacity>
            <ExpandedAssetRow
              asset={asset}
              currencySymbol={currencySymbol}
              mutedColor={mutedColor}
              isExpanded={expandedRows.has(asset.physical_asset_id)}
              onBuySell={onBuySell}
              onUpdatePrice={onUpdatePrice}
              onViewTransactions={onViewTransactions}
            />
          </Collapse>
        </Td>
      </Tr>
    );
  };

  const MobileAssetCard: React.FC<{ asset: typeof sortedAssets[0] }> = ({ asset }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const boxBg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={useColorModeValue("white", "cardDarkBg")} boxShadow="md">
        <Box p={4} onClick={() => setIsExpanded(!isExpanded)} cursor="pointer">
          <Flex justify="space-between" align="start">
            <Box maxW="80%">
              <HStack spacing={1} align="baseline" wrap="wrap">
                <Text fontWeight="medium" noOfLines={2} color={tertiaryTextColor}>{asset.name}</Text>
              </HStack>
              <Text fontSize="sm" color={tertiaryTextColor}>{asset.asset_type_name}</Text>
            </Box>
            <IconButton
              icon={isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              variant="ghost"
              size="sm"
              aria-label="Expand row"
            />
          </Flex>
          <SimpleGrid columns={2} spacing={4} mt={4}>
            <Stat>
              <StatLabel fontSize="xs" color={mutedColor}>Value</StatLabel>
              <StatNumber>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="lg" fontWeight="bold" color={tertiaryTextColor}>
                    {splitCurrencyForDisplay(asset.current_value, currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" opacity={0.7}>
                    {splitCurrencyForDisplay(asset.current_value, currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="xs" color={mutedColor}>P&L</StatLabel>
              <StatNumber>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="lg" fontWeight="bold" color={getPnLColor(asset.unrealized_pnl)}>
                    {splitCurrencyForDisplay(Math.abs(asset.unrealized_pnl), currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={getPnLColor(asset.unrealized_pnl)} opacity={0.7}>
                    {splitCurrencyForDisplay(Math.abs(asset.unrealized_pnl), currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
              </StatNumber>
               <HStack spacing={0} align="baseline">
                 <Text fontSize="xs" color={getPnLColor(asset.unrealized_pnl_percentage)}>
                   {splitPercentageForDisplay(asset.unrealized_pnl_percentage).main}
                 </Text>
                 <Text fontSize="xs" color={getPnLColor(asset.unrealized_pnl_percentage)} opacity={0.7}>
                   {splitPercentageForDisplay(asset.unrealized_pnl_percentage).decimals}
                 </Text>
               </HStack>
            </Stat>
          </SimpleGrid>
        </Box>
        <Collapse in={isExpanded} animateOpacity>
          <Box
            py={3}
            px={4}
            bg={boxBg}
            borderTop="1px solid"
            borderColor={borderColor}
          >
            <SimpleGrid columns={2} spacingX={4} spacingY={2} mb={4}>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Current Price</StatLabel>
                <HStack spacing={0} align="baseline"><StatNumber fontSize="sm" color={tertiaryTextColor}>{splitCurrencyForDisplay(toNumber(asset.latest_price_per_unit), currencySymbol || "₹").main}</StatNumber><Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>{splitCurrencyForDisplay(toNumber(asset.latest_price_per_unit), currencySymbol || "₹").decimals}</Text></HStack>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Quantity</StatLabel>
                <StatNumber fontSize="sm" color={tertiaryTextColor}>{splitQuantityForDisplay(asset.total_quantity).main}{splitQuantityForDisplay(asset.total_quantity).decimals} {asset.asset_type?.unit_symbol}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Invested</StatLabel>
                <HStack spacing={0} align="baseline"><StatNumber fontSize="sm" color={tertiaryTextColor}>{splitCurrencyForDisplay(asset.invested, currencySymbol || "₹").main}</StatNumber><Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>{splitCurrencyForDisplay(asset.invested, currencySymbol || "₹").decimals}</Text></HStack>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Avg. Cost</StatLabel>
                <HStack spacing={0} align="baseline"><StatNumber fontSize="sm" color={tertiaryTextColor}>{splitCurrencyForDisplay(toNumber(asset.average_cost_per_unit), currencySymbol || "₹").main}</StatNumber><Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>{splitCurrencyForDisplay(toNumber(asset.average_cost_per_unit), currencySymbol || "₹").decimals}</Text></HStack>
              </Stat>
            </SimpleGrid>
            <Flex gap={3} mt={4} justify="space-around">
              <IconButton size="sm" variant="ghost" icon={<Icon as={ShoppingCart} />} onClick={() => onBuySell(asset.physical_asset_id)} aria-label="Buy/Sell" title="Buy/Sell" />
               <IconButton size="sm" variant="ghost" icon={<Icon as={List} />} onClick={() => onViewTransactions(asset)} aria-label="Transactions" title="Transactions" />
              <IconButton size="sm" variant="ghost" icon={<Icon as={RefreshCw} />} onClick={() => onUpdatePrice(asset)} aria-label="Update Price" title="Update Price" />
            </Flex>
          </Box>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box>
      {/* Filter Controls */}
      <Flex mb={4} gap={4} direction={{ base: "column", md: "row" }} align={{ md: "center" }}>
        <Select
          value={filters.selectedAssetType}
          onChange={(e) => onFiltersChange({ ...filters, selectedAssetType: e.target.value })}
          size="sm"
          maxW={{ md: "200px" }}
        >
          <option value="all">All Asset Types</option>
          {availableAssetTypes.map((assetType) => (
            <option key={assetType.asset_type_id} value={assetType.name}>
              {assetType.name}
            </option>
          ))}
        </Select>
        <InputGroup size="sm" maxW={{ base: "full", md: "300px" }} flexGrow={1}>
          <InputLeftElement>
            <Search size={16} />
          </InputLeftElement>
          <Input
            placeholder="Search assets..."
            value={filters.searchTerm || ""}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
          />
        </InputGroup>
        {hasZeroQuantityAssets && (
          <FormControl display="flex" alignItems="center" w="auto" ml={{ md: "auto" }}>
            <FormLabel
              htmlFor="show-zero-balance"
              mb="0"
              fontSize="sm"
              whiteSpace="nowrap"
            >
              Zero Qty
            </FormLabel>
            <Switch
              id="show-zero-balance"
              isChecked={filters.showZeroBalance}
              onChange={(e) => onFiltersChange({ ...filters, showZeroBalance: e.target.checked })}
              size="sm"
              colorScheme="teal"
            />
          </FormControl>
        )}
      </Flex>

      {isMobile ? (
        <VStack spacing={4} align="stretch" mt={4}>
          {sortedAssets.map((asset) => (
            <MobileAssetCard key={asset.physical_asset_id} asset={asset} />
          ))}
        </VStack>
      ) : (
        <Box overflowX="auto" bg={tableBg} p={{ base: 3, md: 4, lg: 6 }} borderRadius="lg">
          <Table variant="simple" size="sm" minW="800px" borderColor={tableBorderColor}>
            <Thead>
              <Tr>
                <Th width="2%"></Th>
                 <Th width="10%" cursor="pointer" onClick={() => handleSort("asset_type")}>
                   <Flex align="center" gap={1}>
                     Asset Type {getSortIcon("asset_type")}
                   </Flex>
                 </Th>
                  <Th
                     width="20%"
                     cursor="pointer"
                     onClick={() => handleSort("asset")}
                   >
                     <Flex align="center" gap={1}>
                       Asset {getSortIcon("asset")}
                     </Flex>
                   </Th>

                  <Th
                    width="15%"
                    isNumeric
                    display={{ base: "none", lg: "table-cell" }}
                  >
                    Current Price
                  </Th>
                  <Th
                    width="10%"
                    isNumeric
                    display={{ base: "none", lg: "table-cell" }}
                  >
                    Quantity
                  </Th>
                <Th
                  width="10%"
                  isNumeric
                  cursor="pointer"
                  onClick={() => handleSort("invested")}
                  display={{ base: "none", md: "table-cell" }}
                >
                  <Flex align="center" gap={1} justify="flex-end">
                    Invested {getSortIcon("invested")}
                  </Flex>
                </Th>
                <Th
                  width="10%"
                  isNumeric
                  cursor="pointer"
                  onClick={() => handleSort("value")}
                >
                  <Flex align="center" gap={1} justify="flex-end">
                    Value {getSortIcon("value")}
                  </Flex>
                </Th>
                 <Th
                   width="10%"
                   isNumeric
                   cursor="pointer"
                   onClick={() => handleSort("unrealized_pnl")}
                 >
                   <Flex align="center" gap={1} justify="flex-end">
                     P&L {getSortIcon("unrealized_pnl")}
                   </Flex>
                 </Th>
                   <Th
                     width="5%"
                     isNumeric
                     cursor="pointer"
                     onClick={() => handleSort("unrealized_pnl_percentage")}
                     whiteSpace="nowrap"
                   >
                     <Flex align="center" gap={1} justify="flex-end">
                       P&L % {getSortIcon("unrealized_pnl_percentage")}
                     </Flex>
                   </Th>
               </Tr>
            </Thead>
            <Tbody>
              {sortedAssets.map((asset) => (
                <React.Fragment key={asset.physical_asset_id}>
                   <Tr
                     _hover={{ bg: tableHoverBg, cursor: "pointer" }}
                     onClick={() => toggleRowExpansion(asset.physical_asset_id)}
                   >
                    <Td>
                      <IconButton
                        icon={
                          expandedRows.has(asset.physical_asset_id) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )
                        }
                        variant="ghost"
                        size="xs"
                        aria-label="Expand row"
                      />
                    </Td>
                    <Td fontWeight="medium" color={tertiaryTextColor}>{asset.asset_type_name}</Td>
                     <Td>
                       <HStack spacing={1} align="baseline">
                         <Text fontWeight="medium" noOfLines={1} color={tertiaryTextColor}>
                           {asset.name}
                         </Text>
                       </HStack>
                      </Td>
                      <Td isNumeric display={{ base: "none", lg: "table-cell" }}>
                        <HStack spacing={0} align="baseline" justify="flex-end">
                          <Text fontSize="sm" color={tertiaryTextColor}>
                            {
                              splitCurrencyForDisplay(
                                toNumber(asset.latest_price_per_unit),
                                currencySymbol || "₹",
                              ).main
                            }
                          </Text>
                          <Text fontSize="xs" opacity={0.7}>
                            {
                              splitCurrencyForDisplay(
                                toNumber(asset.latest_price_per_unit),
                                currencySymbol || "₹",
                              ).decimals
                            }
                          </Text>
                        </HStack>
                      </Td>
                      <Td isNumeric display={{ base: "none", lg: "table-cell" }}>
                        <Text fontSize="sm" color={tertiaryTextColor}>{splitQuantityForDisplay(asset.total_quantity).main}{splitQuantityForDisplay(asset.total_quantity).decimals} {asset.asset_type?.unit_symbol}</Text>
                      </Td>
                    <Td isNumeric display={{ base: "none", md: "table-cell" }}>
                      <HStack spacing={0} align="baseline" justify="flex-end">
                        <Text fontSize="sm" color={tertiaryTextColor}>
                          {
                            splitCurrencyForDisplay(
                              asset.invested,
                              currencySymbol || "₹",
                            ).main
                          }
                        </Text>
                        <Text fontSize="xs" opacity={0.7}>
                          {
                            splitCurrencyForDisplay(
                              asset.invested,
                              currencySymbol || "₹",
                            ).decimals
                          }
                        </Text>
                      </HStack>
                    </Td>
                    <Td isNumeric>
                      <HStack spacing={0} align="baseline" justify="flex-end">
                        <Text fontSize="sm" color={tertiaryTextColor}>
                          {
                            splitCurrencyForDisplay(
                              asset.current_value,
                              currencySymbol || "₹",
                            ).main
                          }
                        </Text>
                        <Text fontSize="xs" opacity={0.7}>
                          {
                            splitCurrencyForDisplay(
                              asset.current_value,
                              currencySymbol || "₹",
                            ).decimals
                          }
                        </Text>
                      </HStack>
                    </Td>
                    <Td isNumeric>
                      <HStack spacing={0} align="baseline" justify="flex-end">
                        <Text
                          fontSize="sm"
                          color={getPnLColor(asset.unrealized_pnl)}
                        >
                          {
                            splitCurrencyForDisplay(
                              Math.abs(asset.unrealized_pnl),
                              currencySymbol || "₹",
                            ).main
                          }
                        </Text>
                        <Text
                          fontSize="xs"
                          color={getPnLColor(asset.unrealized_pnl)}
                          opacity={0.7}
                        >
                          {
                            splitCurrencyForDisplay(
                              Math.abs(asset.unrealized_pnl),
                              currencySymbol || "₹",
                            ).decimals
                          }
                        </Text>
                      </HStack>
                    </Td>
                    <Td isNumeric>
                      <HStack spacing={0} align="baseline" justify="flex-end">
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color={getPnLColor(asset.unrealized_pnl_percentage)}
                        >
                          {
                            splitPercentageForDisplay(
                              asset.unrealized_pnl_percentage,
                            ).main
                          }
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color={getPnLColor(asset.unrealized_pnl_percentage)}
                          opacity={0.7}
                        >
                          {
                            splitPercentageForDisplay(
                              asset.unrealized_pnl_percentage,
                            ).decimals
                          }
                        </Text>
                       </HStack>
                     </Td>
                   </Tr>
                  {renderExpandedRow(asset)}
                </React.Fragment>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {sortedAssets.length === 0 && (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">
            No physical assets found matching the current filter.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PhysicalAssetsTable;