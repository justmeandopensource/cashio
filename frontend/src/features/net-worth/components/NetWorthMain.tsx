import React from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  Heading,
  Icon,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { RefreshCw, TrendingUp, BookOpen } from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import PageContainer from "@components/shared/PageContainer";
import { NetWorthResponse } from "../types";
import NetWorthSummary from "./NetWorthSummary";
import AssetAllocationChart from "./AssetAllocationChart";
import PortfolioComposition from "./PortfolioComposition";

interface Ledger {
  ledger_id: string;
  name: string;
}

interface NetWorthMainProps {
  data: NetWorthResponse | undefined;
  isLoading: boolean;
  isLoadingLedgers: boolean;
  ledgers: Ledger[];
  selectedLedgerId: string | undefined;
  // eslint-disable-next-line no-unused-vars
  onLedgerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onRefetch: () => void;
  currencySymbol: string;
  ledgerName: string | undefined;
}

const NetWorthMain: React.FC<NetWorthMainProps> = ({
  data,
  isLoading,
  isLoadingLedgers,
  ledgers,
  selectedLedgerId,
  onLedgerChange,
  onRefetch,
  currencySymbol,
  ledgerName,
}) => {
  const selectBg = useColorModeValue("white", "gray.700");
  const selectBorderColor = useColorModeValue("gray.200", "gray.600");
  const selectHoverBorderColor = useColorModeValue("brand.400", "brand.400");
  const selectColor = useColorModeValue("gray.700", "gray.200");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const emptyTitleColor = useColorModeValue("gray.700", "gray.200");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");
  const emptyIconBg = useColorModeValue("brand.100", "rgba(116, 207, 202, 0.15)");
  const badgeBorderColor = useColorModeValue("brand.200", "brand.700");
  const badgeBg = useColorModeValue("brand.50", "whiteAlpha.150");
  const badgeColor = useColorModeValue("brand.700", "brand.200");

  // Build the title: plain string when no ledger, badge-style when ledger is selected
  const titleNode = selectedLedgerId && ledgerName ? (
    <Flex align="center" gap={2.5} wrap="wrap">
      Net Worth
      <Flex
        align="center"
        gap={1.5}
        px={2.5}
        py={0.5}
        borderRadius="full"
        border="1px solid"
        borderColor={badgeBorderColor}
        bg={badgeBg}
        display="inline-flex"
      >
        <Icon as={TrendingUp} boxSize={3} color={badgeColor} />
        <Text fontSize="xs" fontWeight="semibold" color={badgeColor}>
          {ledgerName}
        </Text>
      </Flex>
    </Flex>
  ) : "Net Worth";

  return (
    <>
      {/* ── Sticky page header with ledger selector ── */}
      <PageHeader
        title={titleNode}
        subtitle="Consolidated view of all your assets and liabilities"
        icon={TrendingUp}
        headerContent={
          <Flex align="flex-end" gap={3}>
            {/* Ledger dropdown */}
            <Box minW={{ base: "140px", md: "180px" }}>
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={labelColor}
                mb={1}
              >
                Ledger
              </Text>
              <FormControl>
                <Select
                  value={selectedLedgerId || ""}
                  onChange={onLedgerChange}
                  isDisabled={isLoadingLedgers}
                  size="sm"
                  borderRadius="md"
                  bg={selectBg}
                  borderColor={selectBorderColor}
                  color={selectColor}
                  focusBorderColor="brand.500"
                  _hover={{ borderColor: selectHoverBorderColor }}
                >
                  <option value="">Select Ledger</option>
                  {ledgers.map((l) => (
                    <option key={l.ledger_id} value={l.ledger_id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Refresh button — only useful when a ledger is active */}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Icon as={RefreshCw} boxSize={3.5} />}
              onClick={onRefetch}
              isLoading={isLoading}
              isDisabled={!selectedLedgerId}
              borderRadius="lg"
              fontWeight="semibold"
              flexShrink={0}
            >
              Refresh
            </Button>
          </Flex>
        }
      />

      {/* ── Scrollable content ── */}
      <Box flex={1} overflowY="auto">
        {!selectedLedgerId ? (
          /* Empty state — no ledger selected */
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
            >
              <Icon as={BookOpen} boxSize={8} color="brand.500" />
            </Box>
            <Heading fontSize="xl" fontWeight="bold" color={emptyTitleColor} mb={2}>
              No ledger selected
            </Heading>
            <Text fontSize="sm" color={emptySubColor} maxW="320px">
              Choose a ledger from the dropdown above to view your consolidated net worth dashboard.
            </Text>
          </Center>
        ) : (
          <PageContainer>
            <VStack align="stretch" spacing={{ base: 4, md: 5 }}>

              {/* Row 1 — stat cards */}
              {isLoading ? (
                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={{ base: 3, md: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} height="80px" borderRadius="md" />
                  ))}
                </SimpleGrid>
              ) : data ? (
                <NetWorthSummary
                  netWorth={data.net_worth}
                  totalAssets={data.total_assets}
                  totalLiabilities={data.total_liabilities}
                  currencySymbol={currencySymbol}
                />
              ) : null}

              {/* Row 2 — donut chart + portfolio composition */}
              {isLoading ? (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 5 }}>
                  <Skeleton height="320px" borderRadius="md" />
                  <Skeleton height="320px" borderRadius="md" />
                </SimpleGrid>
              ) : data ? (
                <SimpleGrid
                  columns={{ base: 1, lg: 2 }}
                  spacing={{ base: 4, md: 5 }}
                  alignItems="stretch"
                >
                  <AssetAllocationChart
                    allocation={data.asset_allocation}
                    currencySymbol={currencySymbol}
                  />
                  <PortfolioComposition
                    accountsTotal={data.accounts_assets_total}
                    mutualFundsTotal={data.mutual_funds_total}
                    physicalAssetsTotal={data.physical_assets_total}
                    totalAssets={data.total_assets}
                    mutualFundsUnrealizedGain={data.mutual_funds_unrealized_gain}
                    currencySymbol={currencySymbol}
                  />
                </SimpleGrid>
              ) : null}

            </VStack>
          </PageContainer>
        )}
      </Box>
    </>
  );
};

export default NetWorthMain;
