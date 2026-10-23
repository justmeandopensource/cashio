import { FC, useState, useMemo, useEffect, useRef } from "react";
import { useColorModeValue } from "../../../../components/ui/color-mode";
import { flushSync } from "react-dom";
import {
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Table,
  Checkbox,
  Icon,
  Spinner,
  Alert,
  Wrap,
  WrapItem,
  Separator,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import {
  RefreshCw,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NavFetchResult, MutualFund, BulkNavUpdateRequest } from "../../types";
import { bulkUpdateNav, bulkFetchNav } from "../../api";
import useLedgerStore from "../../../../components/shared/store";

interface BulkNavUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  mutualFunds: MutualFund[];
  onSuccess: () => void;
}



const BulkNavUpdateModal: FC<BulkNavUpdateModalProps> = ({
  isOpen,
  onClose,
  mutualFunds,
  onSuccess,
}) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const queryClient = useQueryClient();
  const [selectedFunds, setSelectedFunds] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Map<string, NavFetchResult>>(
    new Map()
  );
  const [isFetching, setIsFetching] = useState(false);
  const stopFetchRef = useRef(false);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [currentFetchingCode, setCurrentFetchingCode] = useState<string | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.700");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const mutedTextColor = useColorModeValue("gray.400", "gray.500");
  const successColor = useColorModeValue("green.500", "green.300");
  const dangerColor = useColorModeValue("red.500", "red.300");
  const warningColor = useColorModeValue("orange.500", "orange.300");
  const infoColor = useColorModeValue("blue.500", "blue.300");
  const tealColor = useColorModeValue("teal.500", "teal.300");
  const modalHeaderBorderColor = borderColor;
  const modalTitleColor = useColorModeValue("gray.900", "gray.50");
  const modalIconColor = useColorModeValue("gray.400", "gray.500");
  const mobileCardBg = useColorModeValue("white", "gray.750");
  const mobileCardBorder = useColorModeValue("gray.200", "gray.600");
  const successBgLight = useColorModeValue("green.50", "green.900");
  const successBorderLight = useColorModeValue("green.200", "green.700");
  const errorBgLight = useColorModeValue("red.50", "red.900");
  const errorBorderLight = useColorModeValue("red.200", "red.700");
  const selectedCardBg = useColorModeValue("teal.50", "teal.900");
  const selectedCardBorder = useColorModeValue("teal.300", "teal.600");
  const tealBadgeBg = useColorModeValue("teal.50", "teal.900");
  const tealBadgeBorder = useColorModeValue("teal.200", "teal.700");
  const redBadgeBg = useColorModeValue("red.50", "red.900");
  const redBadgeBorder = useColorModeValue("red.200", "red.700");
  const blueBadgeBg = useColorModeValue("blue.50", "blue.900");
  const blueBadgeBorder = useColorModeValue("blue.200", "blue.700");

  useEffect(() => {
    if (isOpen) {
      setResults(new Map());
      setSelectedFunds(new Set());
      setIsFetching(false);
      setFetchedCount(0);
      setCurrentFetchingCode(null);
      stopFetchRef.current = false;
      rowRefs.current.clear();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isFetching || !currentFetchingCode) return;
    const currentFund = mutualFunds.find((f) => f.code === currentFetchingCode);
    if (!currentFund) return;
    const row = rowRefs.current.get(currentFund.mutual_fund_id);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentFetchingCode, isFetching, mutualFunds]);

  const handleBeginFetch = async () => {
    setIsFetching(true);
    stopFetchRef.current = false;
    setFetchedCount(0);
    setResults(new Map());
    setCurrentFetchingCode(null);

    const sortedFunds = [...mutualFunds].sort((a, b) => a.name.localeCompare(b.name));

    // Dedupe scheme codes — multiple funds (e.g. one per owner) can share a
    // code, and re-fetching the same NAV is just wasted upstream traffic.
    // The results Map is keyed by code, so any fund matching that code
    // picks up the result during render.
    const uniqueCodes: string[] = [];
    const seen = new Set<string>();
    for (const fund of sortedFunds) {
      const code = fund.code;
      if (!code || seen.has(code)) continue;
      seen.add(code);
      uniqueCodes.push(code);
    }

    for (let i = 0; i < uniqueCodes.length; i++) {
      const code = uniqueCodes[i];
      if (stopFetchRef.current) {
        break;
      }

      setCurrentFetchingCode(code);

      try {
        const data = await bulkFetchNav(Number(ledgerId), {
          scheme_codes: [code],
        });
        const result = data.results[0];
        setResults((prev) => new Map(prev).set(code, result));
      } catch {
        const errorResult: NavFetchResult = {
          scheme_code: code,
          success: false,
          error_message: "Fetch failed",
        };
        setResults((prev) => new Map(prev).set(code, errorResult));
      }
      flushSync(() => {
        // Count progress per unique scheme code rather than per fund —
        // the visible counter reflects upstream work, not row count.
        setFetchedCount((prev) => prev + 1);
      });
    }
    setCurrentFetchingCode(null);
    setIsFetching(false);
  };

  const handleStopFetch = () => {
    stopFetchRef.current = true;
    setIsFetching(false);
  };

  const uniqueCodeCount = useMemo(() => {
    const codes = new Set<string>();
    for (const f of mutualFunds) if (f.code) codes.add(f.code);
    return codes.size;
  }, [mutualFunds]);

  const { successfulComparisons, failedComparisons, allFunds } = useMemo(() => {
    const allFundsData = [...mutualFunds].sort((a, b) => a.name.localeCompare(b.name)).map((fund) => {
      const fetchedResult = results.get(fund.code!) || null;
      const currentNav = Number(fund.latest_nav);
      const fetchedNav = fetchedResult?.nav_value || null;
      let change = null;
      let changePercent = null;
      let isUpToDate = false;

      if (fetchedResult?.success && fetchedNav !== null && currentNav > 0) {
        change = fetchedNav - currentNav;
        changePercent = (change / currentNav) * 100;
        const roundedCurrentNav = Math.round(currentNav * 100);
        const roundedFetchedNav = Math.round(fetchedNav * 100);
        isUpToDate = roundedCurrentNav === roundedFetchedNav;
      }

      return {
        fund,
        fetchedResult,
        currentNav,
        fetchedNav,
        change,
        changePercent,
        isSelected: selectedFunds.has(fund.mutual_fund_id),
        isFetching: isFetching && fund.code === currentFetchingCode,
        isUpToDate,
      };
    });

    const successful = allFundsData.filter((comp) => comp.fetchedResult?.success && !comp.isUpToDate);
    const failed = allFundsData.filter((comp) => comp.fetchedResult && !comp.fetchedResult.success);

    return { successfulComparisons: successful, failedComparisons: failed, allFunds: allFundsData };
  }, [mutualFunds, results, selectedFunds, isFetching, currentFetchingCode]);

  const bulkUpdateMutation = useMutation({
    mutationFn: (request: BulkNavUpdateRequest) =>
      bulkUpdateNav(Number(ledgerId), request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mutual-funds", ledgerId] });
      queryClient.invalidateQueries({ queryKey: ["mf-transactions", ledgerId] });
      onSuccess();
      onClose();
    },
  });

  const handleSelectFund = (fundId: number, isSelected: boolean) => {
    const newSelected = new Set(selectedFunds);
    if (isSelected) newSelected.add(fundId);
    else newSelected.delete(fundId);
    setSelectedFunds(newSelected);
  };

  const handleSelectAll = () => setSelectedFunds(new Set(successfulComparisons.map(comp => comp.fund.mutual_fund_id)));
  const handleDeselectAll = () => setSelectedFunds(new Set());

  const handleApplySelected = () => {
    const fundsToApply = selectedFunds.size > 0
      ? successfulComparisons.filter((c) => selectedFunds.has(c.fund.mutual_fund_id))
      : successfulComparisons;
    const updates = fundsToApply.map((c) => ({
      mutual_fund_id: c.fund.mutual_fund_id,
      latest_nav: c.fetchedNav!,
      nav_date: c.fetchedResult!.nav_date!,
    }));
    bulkUpdateMutation.mutate({ updates });
  };

  const symbol = currencySymbol || "₹";

  return (
    <Dialog.Root
      open={isOpen}
      size={{ base: "full", md: "xl" }}
      motionPreset="slide-in-bottom"
      closeOnInteractOutside={!isFetching}
      closeOnEscape={!isFetching}
      onOpenChange={e => {
        if (!e.open) {
          onClose();
        }
      }}
    >
      <Portal>

        <Dialog.Backdrop backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <Dialog.Positioner>
          <Dialog.Content
            bg={bgColor}
            borderRadius={{ base: 0, md: "xl" }}
            boxShadow="2xl"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
            mx={{ base: 0, md: 4 }}
            maxHeight={{ base: "100vh", md: "90vh" }}
            display="flex"
            flexDirection="column">
            {/* Gradient accent line */}
            <Box h="3px" bgGradient="to-r" gradientFrom="brand.400" gradientVia="brand.600" gradientTo="teal.300"  />
            {/* Header */}
            <Box px={{ base: 4, md: 8 }} py={5} borderBottom="1px solid" borderColor={modalHeaderBorderColor}>
              <HStack gap={3} align="flex-start" justify="space-between">
                <HStack gap={3} align="flex-start">
                  <Icon boxSize={5} mt="3px" color={modalIconColor} asChild><RefreshCw /></Icon>
                  <Box>
                    <Text fontSize="lg" fontWeight="800" letterSpacing="-0.02em" color={modalTitleColor}>
                      Bulk NAV Update
                    </Text>
                    <Text fontSize="sm" color={subTextColor}>
                      {fetchedCount} of {uniqueCodeCount} scheme{uniqueCodeCount === 1 ? "" : "s"} fetched
                    </Text>
                  </Box>
                </HStack>
              </HStack>
            </Box>

            <Dialog.Body px={{ base: 3, md: 8 }} py={{ base: 4, md: 6 }} flex="1" overflowY="auto" overflowX="hidden">
              <VStack gap={4} align="stretch">

                {/* ── Desktop: Table view ── */}
                <Box display={{ base: "none", md: "block" }} overflowX="auto" borderRadius="md" border="1px solid" borderColor={borderColor}>
                  <Table.Root variant="line" size="sm">
                    <Table.Header bg={cardBg}>
                      <Table.Row>
                        <Table.ColumnHeader width="5%"><Checkbox.Root
                          onCheckedChange={(e) => e.checked ? handleSelectAll() : handleDeselectAll()}
                          checked={selectedFunds.size === successfulComparisons.length && successfulComparisons.length > 0}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Root></Table.ColumnHeader>
                        <Table.ColumnHeader width="31%">Fund Name</Table.ColumnHeader>
                        <Table.ColumnHeader width="8%">Code</Table.ColumnHeader>
                        <Table.ColumnHeader width="13%" textAlign='end'>Current NAV</Table.ColumnHeader>
                        <Table.ColumnHeader width="13%" textAlign='end'>Fetched NAV</Table.ColumnHeader>
                        <Table.ColumnHeader width="9%" textAlign='end'>Change</Table.ColumnHeader>
                        <Table.ColumnHeader width="4%"></Table.ColumnHeader>
                        <Table.ColumnHeader width="13%">Last Updated</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {allFunds.map((c) => (
                        <Table.Row
                          key={c.fund.mutual_fund_id}
                          opacity={c.isUpToDate ? 0.45 : 1}
                          ref={(el) => {
                            if (el) rowRefs.current.set(c.fund.mutual_fund_id, el);
                            else rowRefs.current.delete(c.fund.mutual_fund_id);
                          }}
                        >
                          <Table.Cell>
                            {c.fetchedResult?.success && successfulComparisons.some(sc => sc.fund.mutual_fund_id === c.fund.mutual_fund_id) && (
                              <Checkbox.Root
                                onCheckedChange={(e) => handleSelectFund(c.fund.mutual_fund_id, !!e.checked)}
                                checked={c.isSelected}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Root>
                            )}
                          </Table.Cell>
                          <Table.Cell><Text fontWeight="medium">{c.fund.name}</Text></Table.Cell>
                          <Table.Cell><Text fontSize="sm" color={subTextColor}>{c.fund.code}</Text></Table.Cell>
                          <Table.Cell textAlign='end'><Text fontWeight="semibold" color={subTextColor}>{symbol}{c.currentNav.toFixed(4)}</Text></Table.Cell>
                          <Table.Cell textAlign='end'>
                            {c.isFetching ? (
                              <Spinner size="xs" color={tealColor} />
                            ) : c.fetchedNav !== null ? (
                              <Text fontWeight={c.isUpToDate ? "normal" : "semibold"} color={textColor}>{symbol}{c.fetchedNav.toFixed(4)}</Text>
                            ) : (
                              <Text color={mutedTextColor}>-</Text>
                            )}
                          </Table.Cell>
                          <Table.Cell textAlign='end'>
                            {c.fetchedResult?.success && successfulComparisons.some(sc => sc.fund.mutual_fund_id === c.fund.mutual_fund_id) && (
                              <Text fontSize="sm" fontWeight="semibold" color={c.change! >= 0 ? successColor : dangerColor}>{Math.abs(c.changePercent!).toFixed(2)}%</Text>
                            )}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            {c.fetchedResult?.success && Math.abs(c.changePercent || 0) > 10 && <Icon boxSize={4} color={warningColor} asChild><AlertTriangle /></Icon>}
                          </Table.Cell>
                          <Table.Cell>{c.fetchedResult?.nav_date ? new Date(c.fetchedResult.nav_date.split('-').reverse().join('-')).toLocaleDateString() : (c.fund.last_nav_update ? new Date(c.fund.last_nav_update).toLocaleDateString() : <Text as="span" color={mutedTextColor}>Never</Text>)}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>

                {/* ── Mobile: Card view ── */}
                <Box display={{ base: "block", md: "none" }}>
                  {/* Select all bar — only visible after fetch has results */}
                  {successfulComparisons.length > 0 && (
                    <HStack justify="space-between" mb={3} px={1}>
                      <Text fontSize="sm" color={subTextColor}>
                        {successfulComparisons.length} fund{successfulComparisons.length !== 1 ? "s" : ""} to update
                      </Text>
                      <HStack gap={3}>
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color={tealColor}
                          cursor="pointer"
                          onClick={handleSelectAll}
                        >
                          Select all
                        </Text>
                        {selectedFunds.size > 0 && (
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color={subTextColor}
                            cursor="pointer"
                            onClick={handleDeselectAll}
                          >
                            Clear
                          </Text>
                        )}
                      </HStack>
                    </HStack>
                  )}

                  <VStack gap={2} align="stretch">
                    {allFunds.map((c) => {
                      const isUpdatable = c.fetchedResult?.success && successfulComparisons.some(sc => sc.fund.mutual_fund_id === c.fund.mutual_fund_id);
                      const hasFetchError = c.fetchedResult && !c.fetchedResult.success;
                      const navDate = c.fetchedResult?.nav_date
                        ? new Date(c.fetchedResult.nav_date.split('-').reverse().join('-')).toLocaleDateString()
                        : c.fund.last_nav_update
                        ? new Date(c.fund.last_nav_update).toLocaleDateString()
                        : null;

                      let cardBgColor = mobileCardBg;
                      let cardBorderColor = mobileCardBorder;
                      if (c.isSelected) {
                        cardBgColor = selectedCardBg;
                        cardBorderColor = selectedCardBorder;
                      } else if (hasFetchError) {
                        cardBgColor = errorBgLight;
                        cardBorderColor = errorBorderLight;
                      } else if (c.isUpToDate) {
                        cardBgColor = successBgLight;
                        cardBorderColor = successBorderLight;
                      }

                      return (
                        <Box
                          key={c.fund.mutual_fund_id}
                          bg={cardBgColor}
                          border="1px solid"
                          borderColor={cardBorderColor}
                          borderRadius="xl"
                          p={4}
                          opacity={c.isUpToDate ? 0.6 : 1}
                          ref={(el: HTMLDivElement | null) => {
                            if (el) rowRefs.current.set(c.fund.mutual_fund_id, el as unknown as HTMLTableRowElement);
                            else rowRefs.current.delete(c.fund.mutual_fund_id);
                          }}
                          onClick={() => {
                            if (isUpdatable) handleSelectFund(c.fund.mutual_fund_id, !c.isSelected);
                          }}
                          cursor={isUpdatable ? "pointer" : "default"}
                        >
                          {/* Card header row */}
                          <HStack justify="space-between" align="flex-start" mb={3}>
                            <HStack gap={3} align="flex-start" flex={1} minW={0}>
                              {isUpdatable && (
                                <Checkbox.Root
                                  onCheckedChange={(e) => {
                                    handleSelectFund(c.fund.mutual_fund_id, !!e.checked);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  mt="2px"
                                  flexShrink={0}
                                  checked={c.isSelected}><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control></Checkbox.Root>
                              )}
                              <Box minW={0}>
                                <Text fontWeight="semibold" fontSize="sm" color={textColor} lineClamp={2} lineHeight="tight">
                                  {c.fund.name}
                                </Text>
                                <Text fontSize="xs" color={mutedTextColor} mt="2px">
                                  {c.fund.code}
                                </Text>
                              </Box>
                            </HStack>

                            {/* Status indicator */}
                            <Box flexShrink={0} ml={2}>
                              {c.isFetching && <Spinner size="sm" color={tealColor} />}
                              {c.isUpToDate && <Icon boxSize={5} color={successColor} asChild><CheckCircle2 /></Icon>}
                              {hasFetchError && <Icon boxSize={5} color={dangerColor} asChild><XCircle /></Icon>}
                              {c.fetchedResult?.success && Math.abs(c.changePercent || 0) > 10 && !c.isUpToDate && (
                                <Icon boxSize={5} color={warningColor} asChild><AlertTriangle /></Icon>
                              )}
                            </Box>
                          </HStack>

                          {/* NAV comparison row */}
                          {(c.fetchedNav !== null || c.isFetching) && (
                            <>
                              <Separator mb={3} borderColor={cardBorderColor} />
                              <HStack justify="space-between" align="center">
                                <Box>
                                  <Text fontSize="xs" color={mutedTextColor} mb="1px">Current NAV</Text>
                                  <Text fontSize="md" fontWeight="semibold" color={subTextColor}>
                                    {symbol}{c.currentNav.toFixed(4)}
                                  </Text>
                                </Box>

                                {c.isFetching ? (
                                  <Spinner size="xs" color={tealColor} />
                                ) : (
                                  <Box textAlign="center" px={2}>
                                    {c.changePercent !== null && !c.isUpToDate && (
                                      <Text
                                        fontSize="sm"
                                        fontWeight="bold"
                                        color={c.change! >= 0 ? successColor : dangerColor}
                                      >
                                        {c.change! >= 0 ? "▲" : "▼"} {Math.abs(c.changePercent).toFixed(2)}%
                                      </Text>
                                    )}
                                    {c.isUpToDate && (
                                      <Text fontSize="xs" color={successColor} fontWeight="medium">Up to date</Text>
                                    )}
                                  </Box>
                                )}

                                {!c.isFetching && c.fetchedNav !== null && (
                                  <Box textAlign="right">
                                    <Text fontSize="xs" color={mutedTextColor} mb="1px">Fetched NAV</Text>
                                    <Text
                                      fontSize="md"
                                      fontWeight={c.isUpToDate ? "normal" : "semibold"}
                                      color={textColor}
                                    >
                                      {symbol}{c.fetchedNav.toFixed(4)}
                                    </Text>
                                  </Box>
                                )}
                              </HStack>
                            </>
                          )}

                          {/* Error message */}
                          {hasFetchError && (
                            <>
                              <Separator my={2} borderColor={cardBorderColor} />
                              <Text fontSize="xs" color={dangerColor}>
                                {c.fetchedResult?.error_message || "Fetch failed"}
                              </Text>
                            </>
                          )}

                          {/* Last updated */}
                          {navDate && (
                            <HStack gap={1} mt={3}>
                              <Icon boxSize={3} color={mutedTextColor} asChild><Clock /></Icon>
                              <Text fontSize="xs" color={mutedTextColor}>{navDate}</Text>
                            </HStack>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Error list (desktop only — mobile shows inline) */}
                {failedComparisons.length > 0 && (
                  <Box display={{ base: "none", md: "block" }}>
                    <HStack gap={2} mb={4}>
                      <XCircle size={20} color={dangerColor} />
                      <Text fontSize="lg" fontWeight="semibold">Funds with Fetch Errors ({failedComparisons.length})</Text>
                    </HStack>
                    <VStack gap={3} align="stretch">
                      {failedComparisons.map((c) => (
                        <Alert.Root key={c.fund.mutual_fund_id} status="error" borderRadius="md">
                          <Alert.Indicator />
                          <Box>
                            <Alert.Title fontSize="sm">{c.fund.name} ({c.fund.code})</Alert.Title>
                            <Alert.Description fontSize="sm">{c.fetchedResult?.error_message || "Unknown error"}</Alert.Description>
                          </Box>
                        </Alert.Root>
                      ))}
                    </VStack>
                  </Box>
                )}

                {bulkUpdateMutation.isError && <Alert.Root status="error">...</Alert.Root>}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer
              px={{ base: 4, md: 8 }}
              py={4}
              bg={footerBg}
              borderTop="1px solid"
              borderColor={borderColor}
            >
              <VStack gap={3} align="stretch" flex={1}>
                {/* Summary badges */}
                {results.size > 0 && (
                  <Wrap gap={2} justify="center">
                    <WrapItem>
                      <HStack gap={1} px={3} py={1} bg={tealBadgeBg} borderRadius="full" border="1px solid" borderColor={tealBadgeBorder}>
                        <Text fontSize="sm" fontWeight="bold" color={tealColor}>{successfulComparisons.length}</Text>
                        <Text fontSize="xs" color={subTextColor}>updates</Text>
                      </HStack>
                    </WrapItem>
                    {failedComparisons.length > 0 && (
                      <WrapItem>
                        <HStack gap={1} px={3} py={1} bg={redBadgeBg} borderRadius="full" border="1px solid" borderColor={redBadgeBorder}>
                          <Text fontSize="sm" fontWeight="bold" color={dangerColor}>{failedComparisons.length}</Text>
                          <Text fontSize="xs" color={subTextColor}>failed</Text>
                        </HStack>
                      </WrapItem>
                    )}
                    {selectedFunds.size > 0 && (
                      <WrapItem>
                        <HStack gap={1} px={3} py={1} bg={blueBadgeBg} borderRadius="full" border="1px solid" borderColor={blueBadgeBorder}>
                          <Text fontSize="sm" fontWeight="bold" color={infoColor}>{selectedFunds.size}</Text>
                          <Text fontSize="xs" color={subTextColor}>selected</Text>
                        </HStack>
                      </WrapItem>
                    )}
                  </Wrap>
                )}

                {/* Action buttons */}
                <HStack flex={1} justify="space-between">
                  <Box>
                    {!isFetching && (
                      <Button
                        colorPalette="brand"
                        onClick={handleBeginFetch}
                        disabled={isFetching}
                        size={{ base: "md", md: "md" }}><Play size={16} />Begin Fetching
                                          </Button>
                    )}
                    {isFetching && (
                      <Button colorPalette="yellow" onClick={handleStopFetch}><Square size={16} />Stop Fetching
                                          </Button>
                    )}
                  </Box>
                  <HStack gap={2} flexShrink={0}>
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isFetching || bulkUpdateMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorPalette="brand"
                      onClick={handleApplySelected}
                      disabled={successfulComparisons.length === 0 || isFetching || bulkUpdateMutation.isPending}
                      loading={bulkUpdateMutation.isPending}
                      loadingText="Updating..."
                    >
                      {selectedFunds.size > 0 ? `Apply (${selectedFunds.size})` : "Apply"}
                    </Button>
                  </HStack>
                </HStack>
              </VStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default BulkNavUpdateModal;
