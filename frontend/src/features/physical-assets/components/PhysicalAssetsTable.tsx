import React, { useState, useMemo, useEffect, useRef } from "react";
import { useColorModeValue } from "../../../components/ui/color-mode";
import {
  Table,
  Box,
  Text,
  Button,
  HStack,
  Collapsible,
  IconButton,
  NativeSelect,
  Flex,
  Stat,
  Icon,
  Input,
  useBreakpointValue,
  VStack,
  SimpleGrid,
  Field,
} from "@chakra-ui/react";
import { Switch } from "@/components/ui/switch";
import { InputGroup } from "@/components/ui/input-group";
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
import { useSearchParams } from "react-router-dom";
import { useAssetTransactions } from "../api";
import useLedgerStore from "../../../components/shared/store";

// Expanded Asset Row Component

interface ExpandedAssetRowProps {
  asset: PhysicalAsset & { asset_type_name: string; invested: number; unrealized_pnl: number; unrealized_pnl_percentage: number };
  currencySymbol: string | undefined;
  mutedColor: string;
  isExpanded: boolean;
  onBuySell: (assetId: number) => void;
  onUpdatePrice: (asset: PhysicalAsset) => void;
  onViewTransactions: (asset: PhysicalAsset) => void;
}


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
        <HStack gap={{ base: 3, md: 5 }} wrap="wrap">
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Lowest Cost
            </Stat.Label>
            <HStack gap={0} align="baseline">
              <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? "..."
                  : lowestPurchasePrice !== null
                  ? splitCurrencyForDisplay(
                      lowestPurchasePrice,
                      currencySymbol || "₹",
                    ).main
                  : "--"}
              </Stat.ValueText>
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
          </Stat.Root>
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Avg. Cost
            </Stat.Label>
            <HStack gap={0} align="baseline">
              <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(asset.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).main
                }
              </Stat.ValueText>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(asset.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).decimals
                }
              </Text>
            </HStack>
          </Stat.Root>
          <Stat.Root size="sm">
            <Stat.Label fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Highest Cost
            </Stat.Label>
            <HStack gap={0} align="baseline">
              <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? "..."
                  : highestPurchasePrice !== null
                  ? splitCurrencyForDisplay(
                      highestPurchasePrice,
                      currencySymbol || "₹",
                    ).main
                  : "--"}
              </Stat.ValueText>
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
          </Stat.Root>
        </HStack>

        <HStack gap={2}>
           <Button
             size="xs"
             variant="outline"
             onClick={() => onBuySell(asset.physical_asset_id)}><Icon boxSize={3} asChild><ShoppingCart /></Icon>Buy/Sell
                        </Button>
           <Button size="xs" variant="outline" onClick={() => onViewTransactions(asset)}><Icon boxSize={3} asChild><List /></Icon>Transactions
                        </Button>
           <Button size="xs" variant="outline" onClick={() => onUpdatePrice(asset)}><Icon boxSize={3} asChild><RefreshCw /></Icon>Update Price
                        </Button>
        </HStack>
      </Flex>
    </Box>
  );
};


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
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
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
  const [searchParams] = useSearchParams();
  const highlightHandled = useRef(false);

  // Auto-expand and scroll to an asset when navigated from global search
  useEffect(() => {
    if (highlightHandled.current) return;
    const highlightId = searchParams.get("assetId");
    if (!highlightId) return;
    const assetId = Number(highlightId);
    if (!assetId) return;
    highlightHandled.current = true;
    setExpandedRows(new Set([assetId]));
    setTimeout(() => {
      const el = document.querySelector(`[data-asset-id="${assetId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }, [searchParams]);

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
      <Table.Row key={`expanded-${asset.physical_asset_id}`}>
        <Table.Cell colSpan={9} p={0}>
          <Collapsible.Root open={expandedRows.has(asset.physical_asset_id)}>
            <Collapsible.Content>
              <ExpandedAssetRow
                asset={asset}
                currencySymbol={currencySymbol}
                mutedColor={mutedColor}
                isExpanded={expandedRows.has(asset.physical_asset_id)}
                onBuySell={onBuySell}
                onUpdatePrice={onUpdatePrice}
                onViewTransactions={onViewTransactions}
              />
            </Collapsible.Content>
          </Collapsible.Root>
        </Table.Cell>
      </Table.Row>
    );
  };

  const MobileAssetCard: React.FC<{ asset: typeof sortedAssets[0] }> = ({ asset }) => {
    const defaultExpanded = asset.physical_asset_id === Number(searchParams.get("assetId"));
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const boxBg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={useColorModeValue("white", "cardDarkBg")} boxShadow="md" data-asset-id={asset.physical_asset_id}>
        <Box p={4} onClick={() => setIsExpanded(!isExpanded)} cursor="pointer">
          <Flex justify="space-between" align="start">
            <Box maxW="80%">
              <HStack gap={1} align="baseline" wrap="wrap">
                <Text fontWeight="medium" lineClamp={2} color={tertiaryTextColor}>{asset.name}</Text>
              </HStack>
              <Text fontSize="sm" color={tertiaryTextColor}>{asset.asset_type_name}</Text>
            </Box>
            <IconButton variant="ghost" size="sm" aria-label="Expand row">{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</IconButton>
          </Flex>
          <SimpleGrid columns={2} gap={4} mt={4}>
            <Stat.Root>
              <Stat.Label fontSize="xs" color={mutedColor}>Value</Stat.Label>
              <Stat.ValueText>
                <HStack gap={0} align="baseline">
                  <Text fontSize="lg" fontWeight="bold" color={tertiaryTextColor}>
                    {splitCurrencyForDisplay(asset.current_value, currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" opacity={0.7}>
                    {splitCurrencyForDisplay(asset.current_value, currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
              </Stat.ValueText>
            </Stat.Root>
            <Stat.Root>
              <Stat.Label fontSize="xs" color={mutedColor}>P&L</Stat.Label>
              <Stat.ValueText>
                <HStack gap={0} align="baseline">
                  <Text fontSize="lg" fontWeight="bold" color={getPnLColor(asset.unrealized_pnl)}>
                    {splitCurrencyForDisplay(Math.abs(asset.unrealized_pnl), currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={getPnLColor(asset.unrealized_pnl)} opacity={0.7}>
                    {splitCurrencyForDisplay(Math.abs(asset.unrealized_pnl), currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
              </Stat.ValueText>
               <HStack gap={0} align="baseline">
                 <Text fontSize="xs" color={getPnLColor(asset.unrealized_pnl_percentage)}>
                   {splitPercentageForDisplay(asset.unrealized_pnl_percentage).main}
                 </Text>
                 <Text fontSize="xs" color={getPnLColor(asset.unrealized_pnl_percentage)} opacity={0.7}>
                   {splitPercentageForDisplay(asset.unrealized_pnl_percentage).decimals}
                 </Text>
               </HStack>
            </Stat.Root>
          </SimpleGrid>
        </Box>
        <Collapsible.Root open={isExpanded}>
          <Collapsible.Content>
            <Box
              py={3}
              px={4}
              bg={boxBg}
              borderTop="1px solid"
              borderColor={borderColor}
            >
              <SimpleGrid columns={2} columnGap={4} rowGap={2} mb={4}>
                <Stat.Root size="sm">
                  <Stat.Label fontSize="2xs" color={mutedColor}>Current Price</Stat.Label>
                  <HStack gap={0} align="baseline"><Stat.ValueText fontSize="sm" color={tertiaryTextColor}>{splitCurrencyForDisplay(toNumber(asset.latest_price_per_unit), currencySymbol || "₹").main}</Stat.ValueText><Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>{splitCurrencyForDisplay(toNumber(asset.latest_price_per_unit), currencySymbol || "₹").decimals}</Text></HStack>
                </Stat.Root>
                <Stat.Root size="sm">
                  <Stat.Label fontSize="2xs" color={mutedColor}>Quantity</Stat.Label>
                  <Stat.ValueText fontSize="sm" color={tertiaryTextColor}>{splitQuantityForDisplay(asset.total_quantity).main}{splitQuantityForDisplay(asset.total_quantity).decimals} {asset.asset_type?.unit_symbol}</Stat.ValueText>
                </Stat.Root>
                <Stat.Root size="sm">
                  <Stat.Label fontSize="2xs" color={mutedColor}>Invested</Stat.Label>
                  <HStack gap={0} align="baseline"><Stat.ValueText fontSize="sm" color={tertiaryTextColor}>{splitCurrencyForDisplay(asset.invested, currencySymbol || "₹").main}</Stat.ValueText><Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>{splitCurrencyForDisplay(asset.invested, currencySymbol || "₹").decimals}</Text></HStack>
                </Stat.Root>
                <Stat.Root size="sm">
                  <Stat.Label fontSize="2xs" color={mutedColor}>Avg. Cost</Stat.Label>
                  <HStack gap={0} align="baseline"><Stat.ValueText fontSize="sm" color={tertiaryTextColor}>{splitCurrencyForDisplay(toNumber(asset.average_cost_per_unit), currencySymbol || "₹").main}</Stat.ValueText><Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>{splitCurrencyForDisplay(toNumber(asset.average_cost_per_unit), currencySymbol || "₹").decimals}</Text></HStack>
                </Stat.Root>
              </SimpleGrid>
              <Flex gap={3} mt={4} justify="space-around">
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => onBuySell(asset.physical_asset_id)}
                  aria-label="Buy/Sell"
                  title="Buy/Sell"><Icon asChild><ShoppingCart /></Icon></IconButton>
                 <IconButton
                   size="sm"
                   variant="ghost"
                   onClick={() => onViewTransactions(asset)}
                   aria-label="Transactions"
                   title="Transactions"><Icon asChild><List /></Icon></IconButton>
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => onUpdatePrice(asset)}
                  aria-label="Update Price"
                  title="Update Price"><Icon asChild><RefreshCw /></Icon></IconButton>
              </Flex>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    );
  };

  return (
    <Box>
      {/* Filter Controls */}
      <Flex mb={4} gap={4} direction={{ base: "column", md: "row" }} align={{ md: "center" }}>
        <NativeSelect.Root size="sm" maxW={{ md: "200px" }}>
          <NativeSelect.Field
            value={filters.selectedAssetType}
            onChange={(e) => onFiltersChange({ ...filters, selectedAssetType: e.target.value })}>
            <option value="all">All Asset Types</option>
            {availableAssetTypes.map((assetType) => (
              <option key={assetType.asset_type_id} value={assetType.name}>
                {assetType.name}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <InputGroup maxW={{ base: "full", md: "300px" }} flexGrow={1} startElement={<Search size={16} />}>
          <Input
            size="sm"
            placeholder="Search assets..."
            value={filters.searchTerm || ""}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
          />
        </InputGroup>
        {hasZeroQuantityAssets && (
          <Field.Root display="flex" alignItems="center" w="auto" ml={{ md: "auto" }}>
            <Field.Label
              htmlFor="show-zero-balance"
              mb="0"
              fontSize="sm"
              whiteSpace="nowrap"
            >
              Zero Qty
            </Field.Label>
            <Switch
              ids={{ hiddenInput: "show-zero-balance" }}
              checked={filters.showZeroBalance}
              onCheckedChange={(e) => onFiltersChange({ ...filters, showZeroBalance: e.checked })}
              size="sm"
              colorPalette="teal"
            />
          </Field.Root>
        )}
      </Flex>

      {isMobile ? (
        <VStack gap={4} align="stretch" mt={4}>
          {sortedAssets.map((asset) => (
            <MobileAssetCard key={asset.physical_asset_id} asset={asset} />
          ))}
        </VStack>
      ) : (
        <Box overflowX="auto" bg={tableBg} p={{ base: 3, md: 4, lg: 6 }} borderRadius="lg">
          <Table.Root variant="line" size="sm" minW="800px" borderColor={tableBorderColor}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader width="2%"></Table.ColumnHeader>
                 <Table.ColumnHeader width="10%" cursor="pointer" onClick={() => handleSort("asset_type")}>
                   <Flex align="center" gap={1}>
                     Asset Type {getSortIcon("asset_type")}
                   </Flex>
                 </Table.ColumnHeader>
                  <Table.ColumnHeader
                     width="20%"
                     cursor="pointer"
                     onClick={() => handleSort("asset")}
                   >
                     <Flex align="center" gap={1}>
                       Asset {getSortIcon("asset")}
                     </Flex>
                   </Table.ColumnHeader>

                  <Table.ColumnHeader
                    width="15%"
                    display={{ base: "none", lg: "table-cell" }}
                    textAlign='end'
                  >
                    Current Price
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    width="10%"
                    display={{ base: "none", lg: "table-cell" }}
                    textAlign='end'
                  >
                    Quantity
                  </Table.ColumnHeader>
                <Table.ColumnHeader
                  width="10%"
                  cursor="pointer"
                  onClick={() => handleSort("invested")}
                  display={{ base: "none", md: "table-cell" }}
                  textAlign='end'
                >
                  <Flex align="center" gap={1} justify="flex-end">
                    Invested {getSortIcon("invested")}
                  </Flex>
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  width="10%"
                  cursor="pointer"
                  onClick={() => handleSort("value")}
                  textAlign='end'
                >
                  <Flex align="center" gap={1} justify="flex-end">
                    Value {getSortIcon("value")}
                  </Flex>
                </Table.ColumnHeader>
                 <Table.ColumnHeader
                   width="10%"
                   cursor="pointer"
                   onClick={() => handleSort("unrealized_pnl")}
                   textAlign='end'
                 >
                   <Flex align="center" gap={1} justify="flex-end">
                     P&L {getSortIcon("unrealized_pnl")}
                   </Flex>
                 </Table.ColumnHeader>
                   <Table.ColumnHeader
                     width="5%"
                     cursor="pointer"
                     onClick={() => handleSort("unrealized_pnl_percentage")}
                     whiteSpace="nowrap"
                     textAlign='end'
                   >
                     <Flex align="center" gap={1} justify="flex-end">
                       P&L % {getSortIcon("unrealized_pnl_percentage")}
                     </Flex>
                   </Table.ColumnHeader>
               </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedAssets.map((asset) => (
                <React.Fragment key={asset.physical_asset_id}>
                   <Table.Row
                     _hover={{ bg: tableHoverBg, cursor: "pointer" }}
                     onClick={() => toggleRowExpansion(asset.physical_asset_id)}
                     data-asset-id={asset.physical_asset_id}
                   >
                    <Table.Cell>
                      <IconButton variant="ghost" size="xs" aria-label="Expand row">{expandedRows.has(asset.physical_asset_id) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}</IconButton>
                    </Table.Cell>
                    <Table.Cell fontWeight="medium" color={tertiaryTextColor}>{asset.asset_type_name}</Table.Cell>
                     <Table.Cell>
                       <HStack gap={1} align="baseline">
                         <Text fontWeight="medium" lineClamp={1} color={tertiaryTextColor}>
                           {asset.name}
                         </Text>
                       </HStack>
                      </Table.Cell>
                      <Table.Cell display={{ base: "none", lg: "table-cell" }} textAlign='end'>
                        <HStack gap={0} align="baseline" justify="flex-end">
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
                      </Table.Cell>
                      <Table.Cell display={{ base: "none", lg: "table-cell" }} textAlign='end'>
                        <Text fontSize="sm" color={tertiaryTextColor}>{splitQuantityForDisplay(asset.total_quantity).main}{splitQuantityForDisplay(asset.total_quantity).decimals} {asset.asset_type?.unit_symbol}</Text>
                      </Table.Cell>
                    <Table.Cell display={{ base: "none", md: "table-cell" }} textAlign='end'>
                      <HStack gap={0} align="baseline" justify="flex-end">
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
                    </Table.Cell>
                    <Table.Cell textAlign='end'>
                      <HStack gap={0} align="baseline" justify="flex-end">
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
                    </Table.Cell>
                    <Table.Cell textAlign='end'>
                      <HStack gap={0} align="baseline" justify="flex-end">
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
                    </Table.Cell>
                    <Table.Cell textAlign='end'>
                      <HStack gap={0} align="baseline" justify="flex-end">
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
                     </Table.Cell>
                   </Table.Row>
                  {renderExpandedRow(asset)}
                </React.Fragment>
              ))}
            </Table.Body>
          </Table.Root>
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