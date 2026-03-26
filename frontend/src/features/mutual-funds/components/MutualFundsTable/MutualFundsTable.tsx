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
  HStack,
  Collapse,
  IconButton,
  Select,
  Flex,
  useColorModeValue,
  Switch,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  useBreakpointValue,
  VStack,
  Tooltip,
} from "@chakra-ui/react";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from "lucide-react";
import { MutualFund, Amc } from "../../types";
import {
  calculateFundPnL,
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
  formatUnits,
  formatNav,
  calculateCAGR,
} from "../../utils";
import useLedgerStore from "../../../../components/shared/store";
import AmcDetailsModal from "../modals/AmcDetailsModal";
import UpdateAmcModal from "../modals/UpdateAmcModal";
import MutualFundDetailsModal from "../modals/MutualFundDetailsModal";
import UpdateMutualFundModal from "../modals/UpdateMutualFundModal";
import { ExpandedFundRow, MobileFundCard } from "./MutualFundsTableRow";
import {
  toNumber,
  getPlanInitials,
  getOwnerInitials,
  MutualFundsTableProps,
  FundWithAmc,
  SortField,
  SortDirection,
} from "./types";

const MutualFundsTable: React.FC<MutualFundsTableProps> = ({
  amcs,
  mutualFunds,
  onTradeUnits,
  onTransferUnits,
  onUpdateNav,
  onCloseFund,
  onViewTransactions,
  onViewAnalytics,
  filters,
  onFiltersChange,
}) => {
  const { currencySymbol } = useLedgerStore();
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const tableHoverBg = useColorModeValue("secondaryBg", "secondaryBg");
  const isMobile = useBreakpointValue({ base: true, md: false });
  const tertiaryTextColor = useColorModeValue(
    "tertiaryTextColor",
    "tertiaryTextColor",
  );
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

    if (filters.selectedOwner !== "all") {
      filteredFunds = filteredFunds.filter(
        (fund) => fund.owner === filters.selectedOwner,
      );
    }

    if (filters.selectedAssetClass !== "all") {
      filteredFunds = filteredFunds.filter(
        (fund) => fund.asset_class === filters.selectedAssetClass,
      );
    }

    const amcIds = new Set(filteredFunds.map((fund) => fund.amc_id));
    return amcs
      .filter((amc) => amcIds.has(amc.amc_id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [amcs, mutualFunds, filters.selectedOwner, filters.selectedAssetClass]);

  // Reset AMC filter if selected AMC is not available for the selected owner and asset class
  useEffect(() => {
    if (
      (filters.selectedOwner !== "all" ||
        filters.selectedAssetClass !== "all") &&
      filters.selectedAmc !== "all"
    ) {
      const selectedAmcId = amcs.find(
        (amc) => amc.name === filters.selectedAmc,
      )?.amc_id;
      let filteredFunds = mutualFunds;

      if (filters.selectedOwner !== "all") {
        filteredFunds = filteredFunds.filter(
          (fund) => fund.owner === filters.selectedOwner,
        );
      }

      if (filters.selectedAssetClass !== "all") {
        filteredFunds = filteredFunds.filter(
          (fund) => fund.asset_class === filters.selectedAssetClass,
        );
      }

      const availableAmcIds = new Set(
        filteredFunds.map((fund) => fund.amc_id),
      );
      if (selectedAmcId && !availableAmcIds.has(selectedAmcId)) {
        onFiltersChange({ ...filters, selectedAmc: "all" });
      }
    }
  }, [
    filters.selectedOwner,
    filters.selectedAssetClass,
    filters.selectedAmc,
    mutualFunds,
    amcs,
    filters,
    onFiltersChange,
  ]);

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Prepare data with AMC names
  const fundsWithAmc: FundWithAmc[] = useMemo(() => {
    return mutualFunds.map((fund) => {
      const amc = amcs.find((a) => a.amc_id === fund.amc_id);
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
        xirr_percentage: fund.xirr_percentage ?? null,
        cagr_percentage: calculateCAGR(
          currentValueNum,
          investedNum,
          fund.holding_period_days,
        ),
      };
    });
  }, [mutualFunds, amcs]);

  // Filter funds
  const filteredFunds = useMemo(() => {
    let funds = fundsWithAmc;

    if (filters.searchTerm && filters.searchTerm.trim() !== "") {
      const searchLower = filters.searchTerm.toLowerCase();
      funds = funds.filter(
        (fund) =>
          fund.name.toLowerCase().includes(searchLower) ||
          fund.amc_name.toLowerCase().includes(searchLower),
      );
    }

    if (filters.selectedAmc !== "all") {
      funds = funds.filter((fund) => fund.amc_name === filters.selectedAmc);
    }

    if (filters.selectedOwner !== "all") {
      funds = funds.filter((fund) => fund.owner === filters.selectedOwner);
    }

    if (filters.selectedAssetClass !== "all") {
      funds = funds.filter(
        (fund) => fund.asset_class === filters.selectedAssetClass,
      );
    }

    if (!filters.showZeroBalance) {
      funds = funds.filter((fund) => toNumber(fund.total_units) > 0);
    }

    return funds;
  }, [
    fundsWithAmc,
    filters.selectedAmc,
    filters.selectedOwner,
    filters.selectedAssetClass,
    filters.showZeroBalance,
    filters.searchTerm,
  ]);

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
        case "cagr_percentage":
          aValue = a.cagr_percentage ?? -Infinity;
          bValue = b.cagr_percentage ?? -Infinity;
          break;
        case "xirr_percentage":
          aValue = a.xirr_percentage ?? -Infinity;
          bValue = b.xirr_percentage ?? -Infinity;
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
  };

  const handleUpdateAmcClose = () => {
    setIsUpdateAmcModalOpen(false);
    setSelectedAmc(null);
  };

  const handleFundDetailsClose = () => {
    setIsFundDetailsModalOpen(false);
  };

  const handleUpdateFundClose = () => {
    setIsUpdateFundModalOpen(false);
    setSelectedFund(null);
  };

  const handleUpdateCompleted = () => {
    setIsAmcDetailsModalOpen(false);
    setIsUpdateAmcModalOpen(false);
    setIsFundDetailsModalOpen(false);
    setIsUpdateFundModalOpen(false);
    setSelectedAmc(null);
    setSelectedFund(null);
  };

  // Clean up selected items when all modals are closed
  useEffect(() => {
    const hasAnyModalOpen =
      isAmcDetailsModalOpen ||
      isUpdateAmcModalOpen ||
      isFundDetailsModalOpen ||
      isUpdateFundModalOpen;
    if (!hasAnyModalOpen) {
      setSelectedAmc(null);
      setSelectedFund(null);
    }
  }, [
    isAmcDetailsModalOpen,
    isUpdateAmcModalOpen,
    isFundDetailsModalOpen,
    isUpdateFundModalOpen,
  ]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} />;
    return sortDirection === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  const renderExpandedRow = (fund: FundWithAmc) => {
    return (
      <Tr key={`expanded-${fund.mutual_fund_id}`}>
        <Td colSpan={11} p={0}>
          <Collapse
            in={expandedRows.has(fund.mutual_fund_id)}
            animateOpacity
          >
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
              onViewAnalytics={onViewAnalytics}
              positiveColor={positiveColor}
              negativeColor={negativeColor}
            />
          </Collapse>
        </Td>
      </Tr>
    );
  };

  return (
    <Box>
      {/* Filter Controls */}
      <Flex
        mb={4}
        gap={4}
        direction={{ base: "column", md: "row" }}
        align={{ md: "center" }}
      >
        <Select
          value={filters.selectedOwner}
          onChange={(e) =>
            onFiltersChange({ ...filters, selectedOwner: e.target.value })
          }
          size="sm"
          maxW={{ md: "200px" }}
        >
          <option value="all">All Owners</option>
          {Array.from(
            new Set(
              mutualFunds.map((fund) => fund.owner).filter(Boolean),
            ),
          )
            .sort()
            .map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
        </Select>
        <Select
          value={filters.selectedAmc}
          onChange={(e) =>
            onFiltersChange({ ...filters, selectedAmc: e.target.value })
          }
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
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              selectedAssetClass: e.target.value,
            })
          }
          size="sm"
          maxW={{ md: "200px" }}
        >
          <option value="all">All Classes</option>
          <option value="Equity">Equity</option>
          <option value="Debt">Debt</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Others">Others</option>
        </Select>
        <InputGroup
          size="sm"
          maxW={{ base: "full", md: "300px" }}
          flexGrow={1}
        >
          <InputLeftElement>
            <Search size={16} />
          </InputLeftElement>
          <Input
            placeholder="Search funds..."
            value={filters.searchTerm || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchTerm: e.target.value })
            }
          />
        </InputGroup>
        <FormControl
          display="flex"
          alignItems="center"
          w="auto"
          ml={{ md: "auto" }}
        >
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
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                showZeroBalance: e.target.checked,
              })
            }
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
              amcs={amcs}
              currencySymbol={currencySymbol}
              mutedColor={mutedColor}
              tertiaryTextColor={tertiaryTextColor}
              amcFundNameColor={amcFundNameColor}
              positiveColor={positiveColor}
              negativeColor={negativeColor}
              onTradeUnits={onTradeUnits}
              onTransferUnits={onTransferUnits}
              onUpdateNav={onUpdateNav}
              onCloseFund={onCloseFund}
              onViewTransactions={onViewTransactions}
              onViewAnalytics={onViewAnalytics}
            />
          ))}
        </VStack>
      ) : (
        <Box overflowX="auto">
          <Table
            variant="simple"
            size="sm"
            minW="800px"
            borderColor={tableBorderColor}
          >
            <Thead>
              <Tr>
                <Th width="2%"></Th>
                <Th
                  width="12%"
                  cursor="pointer"
                  onClick={() => handleSort("amc")}
                >
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
                  <Tooltip
                    label="Absolute return: (Current Value - Invested) / Invested"
                    fontSize="xs"
                  >
                    <Flex align="center" gap={1} justify="flex-end">
                      Return % {getSortIcon("unrealized_pnl_percentage")}
                    </Flex>
                  </Tooltip>
                </Th>
                <Th
                  width="6%"
                  isNumeric
                  cursor="pointer"
                  onClick={() => handleSort("cagr_percentage")}
                  whiteSpace="nowrap"
                >
                  <Tooltip
                    label="Compound Annual Growth Rate. Shown for holdings over 1 year."
                    fontSize="xs"
                  >
                    <Flex align="center" gap={1} justify="flex-end">
                      CAGR % {getSortIcon("cagr_percentage")}
                    </Flex>
                  </Tooltip>
                </Th>
                <Th
                  width="6%"
                  isNumeric
                  cursor="pointer"
                  onClick={() => handleSort("xirr_percentage")}
                  whiteSpace="nowrap"
                >
                  <Tooltip
                    label="Annualized return accounting for cash flow timing. Shown for holdings over 1 year."
                    fontSize="xs"
                  >
                    <Flex align="center" gap={1} justify="flex-end">
                      XIRR % {getSortIcon("xirr_percentage")}
                    </Flex>
                  </Tooltip>
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
                        onClick={() =>
                          toggleRowExpansion(fund.mutual_fund_id)
                        }
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
                          const amc = amcs.find(
                            (a) => a.amc_id === fund.amc_id,
                          );
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
                    <Td
                      isNumeric
                      display={{ base: "none", lg: "table-cell" }}
                    >
                      <Text fontSize="sm" color={tertiaryTextColor}>
                        {currencySymbol || "₹"}
                        {formatNav(fund.latest_nav)}
                      </Text>
                    </Td>
                    <Td
                      isNumeric
                      display={{ base: "none", md: "table-cell" }}
                    >
                      <Text fontSize="sm" color={tertiaryTextColor}>
                        {formatUnits(fund.total_units)}
                      </Text>
                    </Td>
                    <Td
                      isNumeric
                      display={{ base: "none", md: "table-cell" }}
                    >
                      <HStack
                        spacing={0}
                        align="baseline"
                        justify="flex-end"
                      >
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
                      <HStack
                        spacing={0}
                        align="baseline"
                        justify="flex-end"
                      >
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
                      <HStack
                        spacing={0}
                        align="baseline"
                        justify="flex-end"
                      >
                        <Text
                          fontSize="sm"
                          color={
                            fund.unrealized_pnl >= 0
                              ? positiveColor
                              : negativeColor
                          }
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
                          color={
                            fund.unrealized_pnl >= 0
                              ? positiveColor
                              : negativeColor
                          }
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
                      <HStack
                        spacing={0}
                        align="baseline"
                        justify="flex-end"
                      >
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
                      {fund.cagr_percentage != null ? (
                        <HStack
                          spacing={0}
                          align="baseline"
                          justify="flex-end"
                        >
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={
                              fund.cagr_percentage >= 0
                                ? positiveColor
                                : negativeColor
                            }
                          >
                            {
                              splitPercentageForDisplay(fund.cagr_percentage)
                                .main
                            }
                          </Text>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color={
                              fund.cagr_percentage >= 0
                                ? positiveColor
                                : negativeColor
                            }
                            opacity={0.7}
                          >
                            {
                              splitPercentageForDisplay(fund.cagr_percentage)
                                .decimals
                            }
                          </Text>
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color={mutedColor}>
                          ---
                        </Text>
                      )}
                    </Td>
                    <Td isNumeric>
                      {fund.xirr_percentage != null ? (
                        <HStack
                          spacing={0}
                          align="baseline"
                          justify="flex-end"
                        >
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={
                              fund.xirr_percentage >= 0
                                ? positiveColor
                                : negativeColor
                            }
                          >
                            {
                              splitPercentageForDisplay(fund.xirr_percentage)
                                .main
                            }
                          </Text>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color={
                              fund.xirr_percentage >= 0
                                ? positiveColor
                                : negativeColor
                            }
                            opacity={0.7}
                          >
                            {
                              splitPercentageForDisplay(fund.xirr_percentage)
                                .decimals
                            }
                          </Text>
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color={mutedColor}>
                          ---
                        </Text>
                      )}
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
