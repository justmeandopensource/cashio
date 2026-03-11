import React, { useState, useMemo, useEffect } from "react";
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
  ArrowRightLeft,
  RefreshCw,
  XCircle,
  List,
  Search,
  ChevronUp,
} from "lucide-react";
import { MutualFund, Amc } from "../types";
import {
  calculateFundPnL,
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
  formatUnits,
  formatNav,
  calculateHighestPurchaseCost,
  calculateLowestPurchaseCost,
} from "../utils";

// Helper function to convert string|number to number
const toNumber = (value: number | string): number => typeof value === 'string' ? parseFloat(value) : value;
import { useFundTransactions } from "../api";
import useLedgerStore from "../../../components/shared/store";
import AmcDetailsModal from "./modals/AmcDetailsModal";
import UpdateAmcModal from "./modals/UpdateAmcModal";
import MutualFundDetailsModal from "./modals/MutualFundDetailsModal";
import UpdateMutualFundModal from "./modals/UpdateMutualFundModal";

// Expanded Fund Row Component
/* eslint-disable no-unused-vars */
interface ExpandedFundRowProps {
  fund: MutualFund & { amc_name: string; invested: number; unrealized_pnl_percentage: number; xirr_percentage: number };
  currencySymbol: string | undefined;
  mutedColor: string;
  isExpanded: boolean;
  onTradeUnits: (fundId: number) => void;
  onTransferUnits: (fundId: number) => void;
  onUpdateNav: (fund: MutualFund) => void;
  onCloseFund: (fundId: number) => void;
  onViewTransactions: (fundId: number) => void;
}
/* eslint-enable no-unused-vars */

const ExpandedFundRow: React.FC<ExpandedFundRowProps & { positiveColor: string; negativeColor: string }> = ({
  fund,
  currencySymbol,
  mutedColor,
  isExpanded,
  onTradeUnits,
  onTransferUnits,
  onUpdateNav,
  onCloseFund,
  onViewTransactions,
  positiveColor,
  negativeColor,
}) => {
  const { realizedPnl } = calculateFundPnL(fund);
  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useFundTransactions(fund.ledger_id, fund.mutual_fund_id, {
      enabled: isExpanded,
    });

  // Convert transactions for cost calculations
  const purchaseTransactions = transactions.map((t) => ({
    transaction_type: t.transaction_type,
    nav_per_unit: toNumber(t.nav_per_unit),
  }));

   const highestPurchaseCost = calculateHighestPurchaseCost(purchaseTransactions);
   const lowestPurchaseCost = calculateLowestPurchaseCost(purchaseTransactions);

   // Compute transaction dates
  const transactionDates = transactions.map(t => new Date(t.transaction_date)).filter(d => !isNaN(d.getTime()));
  const firstTransactionDate = transactionDates.length > 0 ? new Date(Math.min(...transactionDates.map(d => d.getTime()))) : null;
  const lastTransactionDate = transactionDates.length > 0 ? new Date(Math.max(...transactionDates.map(d => d.getTime()))) : null;
  const navUpdatedDate = fund.last_nav_update ? new Date(fund.last_nav_update) : null;

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
                  : lowestPurchaseCost !== null
                  ? splitCurrencyForDisplay(
                      lowestPurchaseCost,
                      currencySymbol || "₹",
                    ).main
                  : "--"}
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? ""
                  : lowestPurchaseCost !== null
                  ? splitCurrencyForDisplay(
                      lowestPurchaseCost,
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
                    toNumber(fund.average_cost_per_unit),
                    currencySymbol || "₹",
                  ).main
                }
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {
                  splitCurrencyForDisplay(
                    toNumber(fund.average_cost_per_unit),
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
                  : highestPurchaseCost !== null
                  ? splitCurrencyForDisplay(
                      highestPurchaseCost,
                      currencySymbol || "₹",
                    ).main
                  : "--"}
              </StatNumber>
              <Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>
                {isLoadingTransactions
                  ? ""
                  : highestPurchaseCost !== null
                  ? splitCurrencyForDisplay(
                      highestPurchaseCost,
                      currencySymbol || "₹",
                    ).decimals
                  : ""}
              </Text>
            </HStack>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Realized P&L
            </StatLabel>
            <HStack spacing={0} align="baseline">
               <StatNumber
                 fontSize="sm"
                 color={realizedPnl >= 0 ? positiveColor : negativeColor}
               >
                {
                  splitCurrencyForDisplay(
                    Math.abs(realizedPnl),
                    currencySymbol || "₹",
                  ).main
                }
              </StatNumber>
               <Text
                 fontSize="xs"
                 color={realizedPnl >= 0 ? positiveColor : negativeColor}
                 opacity={0.7}
               >
                {
                  splitCurrencyForDisplay(
                    Math.abs(realizedPnl),
                    currencySymbol || "₹",
                  ).decimals
                }
              </Text>
            </HStack>
          </Stat>
        </HStack>

        <HStack spacing={{ base: 3, md: 5 }} wrap="wrap">
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              NAV Last Updated
            </StatLabel>
            <StatNumber fontSize="xs" color={tertiaryTextColor}>
              {navUpdatedDate ? `${navUpdatedDate.getFullYear()}-${String(navUpdatedDate.getMonth() + 1).padStart(2, '0')}-${String(navUpdatedDate.getDate()).padStart(2, '0')}` : "--"}
            </StatNumber>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              First Transaction
            </StatLabel>
            <StatNumber fontSize="xs" color={tertiaryTextColor}>
              {isLoadingTransactions ? "..." : firstTransactionDate ? `${firstTransactionDate.getFullYear()}-${String(firstTransactionDate.getMonth() + 1).padStart(2, '0')}-${String(firstTransactionDate.getDate()).padStart(2, '0')}` : "--"}
            </StatNumber>
          </Stat>
          <Stat size="sm">
            <StatLabel fontSize="2xs" color={mutedColor} whiteSpace="nowrap">
              Last Transaction
            </StatLabel>
            <StatNumber fontSize="xs" color={tertiaryTextColor}>
              {isLoadingTransactions ? "..." : lastTransactionDate ? `${lastTransactionDate.getFullYear()}-${String(lastTransactionDate.getMonth() + 1).padStart(2, '0')}-${String(lastTransactionDate.getDate()).padStart(2, '0')}` : "--"}
            </StatNumber>
          </Stat>
        </HStack>

        <HStack spacing={2}>
           <Button
             size="xs"
             variant="outline"
             leftIcon={<Icon as={ShoppingCart} boxSize={3} />}
             onClick={() => onTradeUnits(fund.mutual_fund_id)}
           >
             Buy/Sell
           </Button>
           <Button
             size="xs"
             variant="outline"
             leftIcon={<Icon as={ArrowRightLeft} boxSize={3} />}
             onClick={() => onTransferUnits(fund.mutual_fund_id)}
             isDisabled={toNumber(fund.total_units) <= 0}
           >
             Transfer
           </Button>
           <Button
             size="xs"
             variant="outline"
             leftIcon={<Icon as={List} boxSize={3} />}
             onClick={() => onViewTransactions(fund.mutual_fund_id)}
           >
             Transactions
           </Button>
           <Button
             size="xs"
             variant="outline"
             leftIcon={<Icon as={RefreshCw} boxSize={3} />}
             onClick={() => onUpdateNav(fund)}
           >
             Update NAV
           </Button>
           <Button
             size="xs"
             variant="outline"
             colorScheme="red"
             leftIcon={<Icon as={XCircle} boxSize={3} />}
             onClick={() => onCloseFund(fund.mutual_fund_id)}
             isDisabled={toNumber(fund.total_units) > 0}
           >
             Close
           </Button>
         </HStack>
      </Flex>
    </Box>
  );
};

/* eslint-disable no-unused-vars */
interface MutualFundsTableProps {
  amcs: Amc[];
  mutualFunds: MutualFund[];
  onTradeUnits: (fundId: number) => void;
  onTransferUnits: (fundId: number) => void;
  onUpdateNav: (fund: MutualFund) => void;
  onCloseFund: (fundId: number) => void;
  onViewTransactions: (fundId: number) => void;
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
/* eslint-enable no-unused-vars */

type SortField =
  | "amc"
  | "fund"
  | "invested"
  | "value"
  | "unrealized_pnl"
  | "unrealized_pnl_percentage"
  | "xirr_percentage";

type SortDirection = "asc" | "desc";

const MutualFundsTable: React.FC<MutualFundsTableProps> = ({
  amcs,
  mutualFunds,
  onTradeUnits,
  onTransferUnits,
  onUpdateNav,
  onCloseFund,
  onViewTransactions,
  filters,
  onFiltersChange,
}) => {
  const { currencySymbol } = useLedgerStore();
  const mutedColor = useColorModeValue("gray.600", "gray.400");
    const tableHoverBg = useColorModeValue("secondaryBg", "secondaryBg");
    const isMobile = useBreakpointValue({ base: true, md: false });
    const tertiaryTextColor = useColorModeValue("tertiaryTextColor", "tertiaryTextColor");
    const tableBorderColor = useColorModeValue("gray.200", "gray.500");
    const amcFundNameColor = useColorModeValue("teal.500", "teal.300");
    const positiveColor = useColorModeValue("green.500", "green.300");
    const negativeColor = useColorModeValue("red.500", "red.300");

   // State for sorting
    const [sortField, setSortField] =
      useState<SortField>("unrealized_pnl_percentage");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Modal states
    const [selectedAmc, setSelectedAmc] = useState<Amc | null>(null);
    const [selectedFund, setSelectedFund] = useState<MutualFund | null>(null);
    const [isAmcDetailsModalOpen, setIsAmcDetailsModalOpen] = useState(false);
    const [isUpdateAmcModalOpen, setIsUpdateAmcModalOpen] = useState(false);
    const [isFundDetailsModalOpen, setIsFundDetailsModalOpen] = useState(false);
    const [isUpdateFundModalOpen, setIsUpdateFundModalOpen] = useState(false);

    // Available AMCs based on selected owner and asset class
    const availableAmcs = useMemo(() => {
      let filteredFunds = mutualFunds;

      // Apply owner filter
      if (filters.selectedOwner !== "all") {
        filteredFunds = filteredFunds.filter((fund) => fund.owner === filters.selectedOwner);
      }

      // Apply asset class filter
      if (filters.selectedAssetClass !== "all") {
        filteredFunds = filteredFunds.filter((fund) => fund.asset_class === filters.selectedAssetClass);
      }

      const amcIds = new Set(filteredFunds.map((fund) => fund.amc_id));
      return amcs
        .filter((amc) => amcIds.has(amc.amc_id))
        .sort((a, b) => a.name.localeCompare(b.name));
    }, [amcs, mutualFunds, filters.selectedOwner, filters.selectedAssetClass]);

    // Reset AMC filter if selected AMC is not available for the selected owner and asset class
    useEffect(() => {
      if ((filters.selectedOwner !== "all" || filters.selectedAssetClass !== "all") && filters.selectedAmc !== "all") {
        const selectedAmcId = amcs.find((amc) => amc.name === filters.selectedAmc)?.amc_id;
        let filteredFunds = mutualFunds;

        // Apply owner filter
        if (filters.selectedOwner !== "all") {
          filteredFunds = filteredFunds.filter((fund) => fund.owner === filters.selectedOwner);
        }

        // Apply asset class filter
        if (filters.selectedAssetClass !== "all") {
          filteredFunds = filteredFunds.filter((fund) => fund.asset_class === filters.selectedAssetClass);
        }

        const availableAmcIds = new Set(filteredFunds.map((fund) => fund.amc_id));
        if (selectedAmcId && !availableAmcIds.has(selectedAmcId)) {
          onFiltersChange({ ...filters, selectedAmc: "all" });
        }
      }
    }, [filters.selectedOwner, filters.selectedAssetClass, filters.selectedAmc, mutualFunds, amcs, filters, onFiltersChange]);

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Helper to get plan initials
  const getPlanInitials = (plan: string | null | undefined): string => {
    if (plan === "Direct Growth") return "DG";
    if (plan === "Regular Growth") return "RG";
    return "";
  };

  // Helper to get owner initials
  const getOwnerInitials = (owner: string | null | undefined): string => {
    if (!owner) return "";
    return owner.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
  };

  // Prepare data with AMC names
  const fundsWithAmc = useMemo(() => {
    return mutualFunds.map((fund) => {
      const amc = amcs.find((amc) => amc.amc_id === fund.amc_id);
      const investedNum =
        toNumber(fund.total_invested_cash) ||
        toNumber(fund.total_units) * toNumber(fund.average_cost_per_unit);
      const currentValueNum = toNumber(fund.current_value);
      const { unrealizedPnl } = calculateFundPnL(fund);
      const unrealizedPnlPercentage =
        investedNum > 0 ? (unrealizedPnl / investedNum) * 100 : 0;

      return {
        ...fund,
        amc_name: amc?.name || "Unknown AMC",
        invested: investedNum,
        current_value: currentValueNum,
        unrealized_pnl: unrealizedPnl,
        unrealized_pnl_percentage: unrealizedPnlPercentage,
        xirr_percentage: fund.xirr_percentage || 0,
      };
    });
  }, [mutualFunds, amcs]);

   // Filter funds based on selected AMC, owner, zero balance toggle, and search term
    const filteredFunds = useMemo(() => {
      let funds = fundsWithAmc;

      // Search filter
      if (filters.searchTerm && filters.searchTerm.trim() !== "") {
        const searchLower = filters.searchTerm.toLowerCase();
        funds = funds.filter((fund) =>
          fund.name.toLowerCase().includes(searchLower) ||
          fund.amc_name.toLowerCase().includes(searchLower)
        );
      }

      // AMC filter
      if (filters.selectedAmc !== "all") {
        funds = funds.filter((fund) => fund.amc_name === filters.selectedAmc);
      }

      // Owner filter
      if (filters.selectedOwner !== "all") {
        funds = funds.filter((fund) => fund.owner === filters.selectedOwner);
      }

      // Asset class filter
      if (filters.selectedAssetClass !== "all") {
        funds = funds.filter((fund) => fund.asset_class === filters.selectedAssetClass);
      }

      // Zero balance filter
      if (!filters.showZeroBalance) {
        funds = funds.filter((fund) => toNumber(fund.total_units) > 0);
      }

      return funds;
     }, [fundsWithAmc, filters.selectedAmc, filters.selectedOwner, filters.selectedAssetClass, filters.showZeroBalance, filters.searchTerm]);

  // Sort funds
  const sortedFunds = useMemo(() => {
    return [...filteredFunds].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "amc":
          aValue = a.amc_name.toLowerCase();
          bValue = b.amc_name.toLowerCase();
          break;
        case "fund":
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
        case "xirr_percentage":
          aValue = a.xirr_percentage || 0;
          bValue = b.xirr_percentage || 0;
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
  }, [filteredFunds, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRowExpansion = (fundId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(fundId)) {
      newExpanded.delete(fundId);
    } else {
      newExpanded.add(fundId);
    }
    setExpandedRows(newExpanded);
  };

  // Modal handlers
  const handleAmcClick = (amc: Amc) => {
    setSelectedAmc(amc);
    setIsAmcDetailsModalOpen(true);
  };

  const handleFundClick = (fund: MutualFund) => {
    setSelectedFund(fund);
    setIsFundDetailsModalOpen(true);
  };

  const handleEditAmc = () => {
    setIsAmcDetailsModalOpen(false);
    setIsUpdateAmcModalOpen(true);
  };

  const handleEditFund = () => {
    setIsFundDetailsModalOpen(false);
    setIsUpdateFundModalOpen(true);
  };

  const handleAmcDetailsClose = () => {
    setIsAmcDetailsModalOpen(false);
    // Don't reset selectedAmc - let the edit modal handle it
  };

  const handleUpdateAmcClose = () => {
    setIsUpdateAmcModalOpen(false);
    setSelectedAmc(null);
  };

  const handleFundDetailsClose = () => {
    setIsFundDetailsModalOpen(false);
    // Don't reset selectedFund - let the edit modal handle it
  };

  const handleUpdateFundClose = () => {
    setIsUpdateFundModalOpen(false);
    setSelectedFund(null);
  };

  const handleUpdateCompleted = () => {
    // Close all modals and reset state
    setIsAmcDetailsModalOpen(false);
    setIsUpdateAmcModalOpen(false);
    setIsFundDetailsModalOpen(false);
    setIsUpdateFundModalOpen(false);
    setSelectedAmc(null);
    setSelectedFund(null);
  };

  // Clean up selected items when all modals are closed
  useEffect(() => {
    const hasAnyModalOpen = isAmcDetailsModalOpen || isUpdateAmcModalOpen || isFundDetailsModalOpen || isUpdateFundModalOpen;
    if (!hasAnyModalOpen) {
      setSelectedAmc(null);
      setSelectedFund(null);
    }
  }, [isAmcDetailsModalOpen, isUpdateAmcModalOpen, isFundDetailsModalOpen, isUpdateFundModalOpen]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} />;
    return sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const renderExpandedRow = (
    fund: MutualFund & {
      amc_name: string;
      invested: number;
      unrealized_pnl: number;
      unrealized_pnl_percentage: number;
      xirr_percentage: number;
    },
  ) => {
    return (
      <Tr key={`expanded-${fund.mutual_fund_id}`}>
        <Td colSpan={10} p={0}>
          <Collapse in={expandedRows.has(fund.mutual_fund_id)} animateOpacity>
            <ExpandedFundRow
              fund={fund}
              currencySymbol={currencySymbol}
              mutedColor={mutedColor}
              isExpanded={expandedRows.has(fund.mutual_fund_id)}
              onTradeUnits={onTradeUnits}
              onTransferUnits={onTransferUnits}
              onUpdateNav={onUpdateNav}
              onCloseFund={onCloseFund}
              onViewTransactions={onViewTransactions}
              positiveColor={positiveColor}
              negativeColor={negativeColor}
            />
          </Collapse>
        </Td>
      </Tr>
    );
  };

  /* eslint-disable no-unused-vars */
  const MobileFundCard: React.FC<{
    fund: typeof sortedFunds[0];
    onAmcClick: (amc: Amc) => void;
    onFundClick: (fund: MutualFund) => void;
  }> = ({ fund, onAmcClick, onFundClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const boxBg = useColorModeValue("gray.50", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    const { realizedPnl } = calculateFundPnL(fund);

    const { data: transactions = [], isLoading: isLoadingTransactions } =
      useFundTransactions(fund.ledger_id, fund.mutual_fund_id, {
        enabled: isExpanded,
      });

    // Compute transaction dates
    const transactionDates = transactions.map(t => new Date(t.transaction_date)).filter(d => !isNaN(d.getTime()));
    const firstTransactionDate = transactionDates.length > 0 ? new Date(Math.min(...transactionDates.map(d => d.getTime()))) : null;
    const lastTransactionDate = transactionDates.length > 0 ? new Date(Math.max(...transactionDates.map(d => d.getTime()))) : null;
    const navUpdatedDate = fund.last_nav_update ? new Date(fund.last_nav_update) : null;

    return (
        <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={useColorModeValue("white", "cardDarkBg")} boxShadow="md">
          <Box p={4}>
            <Flex justify="space-between" align="start">
              <Box maxW="80%">
                <HStack spacing={1} align="baseline" wrap="wrap">
                   <Text
                     fontWeight="medium"
                     noOfLines={2}
                     color={amcFundNameColor}
                     cursor="pointer"
                     _hover={{ textDecoration: "underline" }}
                     onClick={() => onFundClick(fund)}
                   >
                     {fund.name}
                   </Text>
                  {getPlanInitials(fund.plan) && ( <Text as="span" fontSize="xs" color="gray.500">({getPlanInitials(fund.plan)})</Text> )}
                  {getOwnerInitials(fund.owner) && ( <Text as="span" fontSize="xs" color="gray.500">[{getOwnerInitials(fund.owner)}]</Text> )}
                </HStack>
                 <Text
                   fontSize="sm"
                   color={amcFundNameColor}
                   cursor="pointer"
                   _hover={{ textDecoration: "underline" }}
                   onClick={() => {
                     const amc = amcs.find(a => a.amc_id === fund.amc_id);
                     if (amc) onAmcClick(amc);
                   }}
                 >
                   {fund.amc_name}
                 </Text>
              </Box>
              <IconButton
                icon={isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                variant="ghost"
                size="sm"
                aria-label="Expand row"
                onClick={() => setIsExpanded(!isExpanded)}
                cursor="pointer"
              />
            </Flex>
          <SimpleGrid columns={2} spacing={4} mt={4}>
            <Stat>
              <StatLabel fontSize="xs" color={mutedColor}>Value</StatLabel>
              <StatNumber>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="lg" fontWeight="bold" color={tertiaryTextColor}>
                    {splitCurrencyForDisplay(fund.current_value, currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" opacity={0.7}>
                    {splitCurrencyForDisplay(fund.current_value, currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="xs" color={mutedColor}>P&L</StatLabel>
              <StatNumber>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="lg" fontWeight="bold" color={fund.unrealized_pnl >= 0 ? positiveColor : negativeColor}>
                    {splitCurrencyForDisplay(Math.abs(fund.unrealized_pnl), currencySymbol || "₹").main}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={fund.unrealized_pnl >= 0 ? positiveColor : negativeColor} opacity={0.7}>
                    {splitCurrencyForDisplay(Math.abs(fund.unrealized_pnl), currencySymbol || "₹").decimals}
                  </Text>
                </HStack>
              </StatNumber>
               <HStack spacing={0} align="baseline">
                 <Text fontSize="xs" color={fund.unrealized_pnl_percentage >= 0 ? positiveColor : negativeColor}>
                   {splitPercentageForDisplay(fund.unrealized_pnl_percentage).main}
                 </Text>
                 <Text fontSize="xs" color={fund.unrealized_pnl_percentage >= 0 ? positiveColor : negativeColor} opacity={0.7}>
                   {splitPercentageForDisplay(fund.unrealized_pnl_percentage).decimals}
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
            <SimpleGrid columns={3} spacingX={4} spacingY={2} mb={4}>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Invested</StatLabel>
                <HStack spacing={0} align="baseline"><StatNumber fontSize="sm" color={tertiaryTextColor}>{splitCurrencyForDisplay(fund.invested, currencySymbol || "₹").main}</StatNumber><Text fontSize="xs" opacity={0.7} color={tertiaryTextColor}>{splitCurrencyForDisplay(fund.invested, currencySymbol || "₹").decimals}</Text></HStack>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Units</StatLabel>
                <StatNumber fontSize="sm" color={tertiaryTextColor}>{formatUnits(fund.total_units)}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>NAV</StatLabel>
                <StatNumber fontSize="sm" color={tertiaryTextColor}>{currencySymbol || "₹"}{formatNav(fund.latest_nav)}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Avg. Cost</StatLabel>
                <HStack spacing={0} align="baseline"><StatNumber fontSize="sm">{splitCurrencyForDisplay(toNumber(fund.average_cost_per_unit), currencySymbol || "₹").main}</StatNumber><Text fontSize="xs" opacity={0.7}>{splitCurrencyForDisplay(toNumber(fund.average_cost_per_unit), currencySymbol || "₹").decimals}</Text></HStack>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Realized P&L</StatLabel>
                <HStack spacing={0} align="baseline"><StatNumber fontSize="sm" color={realizedPnl >= 0 ? positiveColor : negativeColor}>{splitCurrencyForDisplay(Math.abs(realizedPnl), currencySymbol || "₹").main}</StatNumber><Text fontSize="xs" color={realizedPnl >= 0 ? positiveColor : negativeColor} opacity={0.7}>{splitCurrencyForDisplay(Math.abs(realizedPnl), currencySymbol || "₹").decimals}</Text></HStack>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>XIRR %</StatLabel>
                <HStack spacing={0} align="baseline"><StatNumber fontSize="sm" color={(fund.xirr_percentage || 0) >= 0 ? positiveColor : negativeColor}>{splitPercentageForDisplay(fund.xirr_percentage || 0).main}</StatNumber><Text fontSize="xs" color={(fund.xirr_percentage || 0) >= 0 ? positiveColor : negativeColor} opacity={0.7}>{splitPercentageForDisplay(fund.xirr_percentage || 0).decimals}</Text></HStack>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>NAV Updated</StatLabel>
                <StatNumber fontSize="xs">{navUpdatedDate ? `${navUpdatedDate.getFullYear()}-${String(navUpdatedDate.getMonth() + 1).padStart(2, '0')}-${String(navUpdatedDate.getDate()).padStart(2, '0')}` : "--"}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>First Trans</StatLabel>
                 <StatNumber fontSize="xs">{isLoadingTransactions ? "..." : firstTransactionDate ? `${firstTransactionDate.getFullYear()}-${String(firstTransactionDate.getMonth() + 1).padStart(2, '0')}-${String(firstTransactionDate.getDate()).padStart(2, '0')}` : "--"}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="2xs" color={mutedColor}>Last Trans</StatLabel>
                 <StatNumber fontSize="xs">{isLoadingTransactions ? "..." : lastTransactionDate ? `${lastTransactionDate.getFullYear()}-${String(lastTransactionDate.getMonth() + 1).padStart(2, '0')}-${String(lastTransactionDate.getDate()).padStart(2, '0')}` : "--"}</StatNumber>
              </Stat>
            </SimpleGrid>
            <Flex gap={3} mt={4} justify="space-around">
              <IconButton size="sm" variant="ghost" icon={<Icon as={ShoppingCart} />} onClick={() => onTradeUnits(fund.mutual_fund_id)} aria-label="Buy/Sell" title="Buy/Sell" />
              <IconButton size="sm" variant="ghost" icon={<Icon as={ArrowRightLeft} />} onClick={() => onTransferUnits(fund.mutual_fund_id)} isDisabled={toNumber(fund.total_units) <= 0} aria-label="Transfer" title="Transfer" />
              <IconButton size="sm" variant="ghost" icon={<Icon as={List} />} onClick={() => onViewTransactions(fund.mutual_fund_id)} aria-label="Transactions" title="Transactions" />
              <IconButton size="sm" variant="ghost" icon={<Icon as={RefreshCw} />} onClick={() => onUpdateNav(fund)} aria-label="Update NAV" title="Update NAV" />
              <IconButton size="sm" variant="ghost" colorScheme="red" icon={<Icon as={XCircle} />} onClick={() => onCloseFund(fund.mutual_fund_id)} isDisabled={toNumber(fund.total_units) > 0} aria-label="Close" title="Close" />
            </Flex>
          </Box>
        </Collapse>
      </Box>
    );
  };
  /* eslint-enable no-unused-vars */

  return (
    <Box>
      {/* Filter Controls */}
      <Flex mb={4} gap={4} direction={{ base: "column", md: "row" }} align={{ md: "center" }}>
        <Select
          value={filters.selectedOwner}
          onChange={(e) => onFiltersChange({ ...filters, selectedOwner: e.target.value })}
          size="sm"
          maxW={{ md: "200px" }}
        >
          <option value="all">All Owners</option>
          {Array.from(new Set(mutualFunds.map(fund => fund.owner).filter(Boolean)))
            .sort()
            .map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
        </Select>
        <Select
          value={filters.selectedAmc}
          onChange={(e) => onFiltersChange({ ...filters, selectedAmc: e.target.value })}
          size="sm"
          maxW={{ md: "200px" }}
        >
          <option value="all">All AMCs</option>
          {availableAmcs.map((amc) => (
            <option key={amc.amc_id} value={amc.name}>
              {amc.name}
            </option>
          ))}
        </Select>
        <Select
          value={filters.selectedAssetClass}
          onChange={(e) => onFiltersChange({ ...filters, selectedAssetClass: e.target.value })}
          size="sm"
          maxW={{ md: "200px" }}
        >
          <option value="all">All Classes</option>
          <option value="Equity">Equity</option>
          <option value="Debt">Debt</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Others">Others</option>
        </Select>
        <InputGroup size="sm" maxW={{ base: "full", md: "300px" }} flexGrow={1}>
          <InputLeftElement>
            <Search size={16} />
          </InputLeftElement>
          <Input
            placeholder="Search funds..."
            value={filters.searchTerm || ""}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
          />
        </InputGroup>
        <FormControl display="flex" alignItems="center" w="auto" ml={{ md: "auto" }}>
          <FormLabel
            htmlFor="show-zero-balance"
            mb="0"
            fontSize="sm"
            whiteSpace="nowrap"
          >
            Zero Bal
          </FormLabel>
          <Switch
            id="show-zero-balance"
            isChecked={filters.showZeroBalance}
            onChange={(e) => onFiltersChange({ ...filters, showZeroBalance: e.target.checked })}
            size="sm"
            colorScheme="teal"
          />
        </FormControl>
      </Flex>

      {isMobile ? (
        <VStack spacing={4} align="stretch" mt={4}>
          {sortedFunds.map((fund) => (
            <MobileFundCard
              key={fund.mutual_fund_id}
              fund={fund}
              onAmcClick={handleAmcClick}
              onFundClick={handleFundClick}
            />
          ))}
        </VStack>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm" minW="800px" borderColor={tableBorderColor}>
            <Thead>
              <Tr>
                <Th width="2%"></Th>
                <Th width="12%" cursor="pointer" onClick={() => handleSort("amc")}>
                  <Flex align="center" gap={1}>
                    AMC {getSortIcon("amc")}
                  </Flex>
                </Th>
                 <Th
                    width="24%"
                    cursor="pointer"
                    onClick={() => handleSort("fund")}
                  >
                    <Flex align="center" gap={1}>
                      Fund {getSortIcon("fund")}
                    </Flex>
                  </Th>

                 <Th
                   width="8%"
                   isNumeric
                   display={{ base: "none", lg: "table-cell" }}
                 >
                   NAV
                 </Th>
                <Th
                  width="8%"
                  isNumeric
                  display={{ base: "none", md: "table-cell" }}
                >
                  Units
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
                    width="7%"
                    isNumeric
                    cursor="pointer"
                    onClick={() => handleSort("unrealized_pnl_percentage")}
                    whiteSpace="nowrap"
                  >
                    <Flex align="center" gap={1} justify="flex-end">
                      P&L % {getSortIcon("unrealized_pnl_percentage")}
                    </Flex>
                  </Th>
                  <Th
                    width="6%"
                    isNumeric
                    cursor="pointer"
                    onClick={() => handleSort("xirr_percentage")}
                    whiteSpace="nowrap"
                  >
                    <Flex align="center" gap={1} justify="flex-end">
                      XIRR % {getSortIcon("xirr_percentage")}
                    </Flex>
                  </Th>
               </Tr>
            </Thead>
            <Tbody>
              {sortedFunds.map((fund) => (
                <React.Fragment key={fund.mutual_fund_id}>
                   <Tr _hover={{ bg: tableHoverBg }}>
                     <Td>
                       <IconButton
                         icon={
                           expandedRows.has(fund.mutual_fund_id) ? (
                             <ChevronDown size={16} />
                           ) : (
                             <ChevronRight size={16} />
                           )
                         }
                         variant="ghost"
                         size="xs"
                         aria-label="Expand row"
                         onClick={() => toggleRowExpansion(fund.mutual_fund_id)}
                         cursor="pointer"
                       />
                     </Td>
                      <Td fontWeight="medium">
                        <Text
                          as="span"
                          color={amcFundNameColor}
                          cursor="pointer"
                          _hover={{ textDecoration: "underline" }}
                          onClick={() => {
                            const amc = amcs.find(a => a.amc_id === fund.amc_id);
                            if (amc) handleAmcClick(amc);
                          }}
                        >
                          {fund.amc_name}
                        </Text>
                      </Td>
                       <Td>
                         <HStack spacing={1} align="baseline">
                           <Text
                             fontWeight="medium"
                             noOfLines={1}
                             color={amcFundNameColor}
                             cursor="pointer"
                             _hover={{ textDecoration: "underline" }}
                             onClick={() => handleFundClick(fund)}
                           >
                             {fund.name}
                           </Text>
                          {getPlanInitials(fund.plan) && (
                            <Text
                              as="span"
                              fontSize="xs"
                              color="gray.500"
                              fontWeight="normal"
                            >
                              ({getPlanInitials(fund.plan)})
                            </Text>
                          )}
                          {getOwnerInitials(fund.owner) && (
                            <Text
                              as="span"
                              fontSize="xs"
                              color="gray.500"
                              fontWeight="normal"
                            >
                              [{getOwnerInitials(fund.owner)}]
                            </Text>
                          )}
                        </HStack>
                       </Td>
                     <Td isNumeric display={{ base: "none", lg: "table-cell" }}>
                       <Text fontSize="sm" color={tertiaryTextColor}>
                         {currencySymbol || "₹"}
                         {formatNav(fund.latest_nav)}
                       </Text>
                     </Td>
                    <Td isNumeric display={{ base: "none", md: "table-cell" }}>
                      <Text fontSize="sm" color={tertiaryTextColor}>{formatUnits(fund.total_units)}</Text>
                    </Td>
                    <Td isNumeric display={{ base: "none", md: "table-cell" }}>
                      <HStack spacing={0} align="baseline" justify="flex-end">
                        <Text fontSize="sm" color={tertiaryTextColor}>
                          {
                            splitCurrencyForDisplay(
                              fund.invested,
                              currencySymbol || "₹",
                            ).main
                          }
                        </Text>
                        <Text fontSize="xs" opacity={0.7}>
                          {
                            splitCurrencyForDisplay(
                              fund.invested,
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
                              fund.current_value,
                              currencySymbol || "₹",
                            ).main
                          }
                        </Text>
                        <Text fontSize="xs" opacity={0.7}>
                          {
                            splitCurrencyForDisplay(
                              fund.current_value,
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
                          color={fund.unrealized_pnl >= 0 ? positiveColor : negativeColor}
                        >
                          {
                            splitCurrencyForDisplay(
                              Math.abs(fund.unrealized_pnl),
                              currencySymbol || "₹",
                            ).main
                          }
                        </Text>
                        <Text
                          fontSize="xs"
                          color={fund.unrealized_pnl >= 0 ? positiveColor : negativeColor}
                          opacity={0.7}
                        >
                          {
                            splitCurrencyForDisplay(
                              Math.abs(fund.unrealized_pnl),
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
                          color={
                            fund.unrealized_pnl_percentage >= 0
                              ? positiveColor
                              : negativeColor
                          }
                        >
                          {
                            splitPercentageForDisplay(
                              fund.unrealized_pnl_percentage,
                            ).main
                          }
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color={
                            fund.unrealized_pnl_percentage >= 0
                              ? positiveColor
                              : negativeColor
                          }
                          opacity={0.7}
                        >
                          {
                            splitPercentageForDisplay(
                              fund.unrealized_pnl_percentage,
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
                           color={
                             (fund.xirr_percentage || 0) >= 0
                               ? positiveColor
                               : negativeColor
                           }
                         >
                           {
                             splitPercentageForDisplay(
                               fund.xirr_percentage || 0,
                             ).main
                           }
                         </Text>
                         <Text
                           fontSize="xs"
                           fontWeight="semibold"
                           color={
                             (fund.xirr_percentage || 0) >= 0
                               ? positiveColor
                               : negativeColor
                           }
                           opacity={0.7}
                         >
                           {
                             splitPercentageForDisplay(
                               fund.xirr_percentage || 0,
                             ).decimals
                           }
                         </Text>
                       </HStack>
                     </Td>
                   </Tr>
                  {renderExpandedRow(fund)}
                </React.Fragment>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {sortedFunds.length === 0 && (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">
            No mutual funds found matching the current filter.
          </Text>
        </Box>
      )}

      {/* Modals */}
      {selectedAmc && (
        <AmcDetailsModal
          isOpen={isAmcDetailsModalOpen}
          onClose={handleAmcDetailsClose}
          amc={selectedAmc}
          onEditAmc={handleEditAmc}
        />
      )}

      {selectedAmc && (
        <UpdateAmcModal
          isOpen={isUpdateAmcModalOpen}
          onClose={handleUpdateAmcClose}
          amc={selectedAmc}
          onUpdateCompleted={handleUpdateCompleted}
        />
      )}

      {selectedFund && (
        <MutualFundDetailsModal
          isOpen={isFundDetailsModalOpen}
          onClose={handleFundDetailsClose}
          fund={selectedFund}
          onEditFund={handleEditFund}
        />
      )}

      {selectedFund && (
        <UpdateMutualFundModal
          isOpen={isUpdateFundModalOpen}
          onClose={handleUpdateFundClose}
          fund={selectedFund}
          amcs={amcs}
          onUpdateCompleted={handleUpdateCompleted}
        />
      )}
    </Box>
  );
};

export default MutualFundsTable;
