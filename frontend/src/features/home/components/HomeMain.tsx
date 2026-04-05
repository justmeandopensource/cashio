import HomeLedgerCards from "@features/home/components/HomeLedgerCards";
import HomeNetWorthBanner from "./HomeNetWorthBanner";
import HomeMonthSnapshot from "./HomeMonthSnapshot";
import HomeRecentTransactions from "./HomeRecentTransactions";
import HomeBudgetAlerts from "./HomeBudgetAlerts";
import { lazy, Suspense, useEffect } from "react";
const CreateLedgerModal = lazy(() => import("@components/modals/CreateLedgerModal"));
import PageContainer from "@components/shared/PageContainer";
import HomeMainHeader from "./HomeMainHeader";
import { Box, Divider, Grid, GridItem, HStack, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { LayoutDashboard } from "lucide-react";
import { HomeFundFlow } from "./fund-flow";
import useLedgerStore from "@/components/shared/store";

import type { Ledger } from "@/types";

interface HomeMainProps {
  ledgers?: Ledger[];
  defaultLedgerId: number | null;
  onOpen: () => void;
  isOpen: boolean;
  onClose: () => void;

  handleCreateLedger: (name: string, currency: string, description: string, notes: string, navServiceType: string) => void;
}

const HomeMain = ({
  ledgers = [],
  defaultLedgerId,
  onOpen,
  isOpen,
  onClose,
  handleCreateLedger,
}: HomeMainProps) => {
  // Use active ledger from store; fall back to default on first load
  const storeLedgerId = useLedgerStore((s) => s.ledgerId);
  const setLedger = useLedgerStore((s) => s.setLedger);

  // Auto-set store to default ledger if nothing is selected yet
  useEffect(() => {
    if (!storeLedgerId && defaultLedgerId && ledgers.length > 0) {
      const ledger = ledgers.find(
        (l) => String(l.ledger_id) === String(defaultLedgerId)
      );
      if (ledger) {
        setLedger({
          ledgerId: String(ledger.ledger_id),
          ledgerName: ledger.name,
          currencySymbol: ledger.currency_symbol,
          description: ledger.description ?? "",
          notes: ledger.notes ?? "",
          navServiceType: ledger.nav_service_type ?? "",
          createdAt: ledger.created_at ?? "",
          updatedAt: ledger.updated_at ?? "",
        });
      }
    }
  }, [storeLedgerId, defaultLedgerId, ledgers, setLedger]);

  // Dashboard uses the active ledger (from store), falling back to default
  const dashboardLedgerId = storeLedgerId
    ? Number(storeLedgerId)
    : defaultLedgerId;
  const dashboardLedger = dashboardLedgerId
    ? ledgers.find((l) => String(l.ledger_id) === String(dashboardLedgerId))
    : null;

  const dividerColor = useColorModeValue("gray.200", "gray.600");
  const sectionLabelColor = useColorModeValue("gray.400", "gray.500");
  const ledgerNameColor = useColorModeValue("gray.600", "gray.300");

  const showDashboard = dashboardLedgerId && ledgers.length > 0;

  return (
    <>
      <HomeMainHeader onCreateLedger={onOpen} />
      <Box flex={1} overflowY="auto">
        <PageContainer>
          {/* Primary section: Ledger cards */}
          <HomeLedgerCards ledgers={ledgers} defaultLedgerId={defaultLedgerId} onOpen={onOpen} />

          {/* Dashboard section for default ledger */}
          {showDashboard && (
            <Box mt={10}>
              {/* Section separator with label */}
              <HStack spacing={3} mb={6}>
                <HStack spacing={2} flexShrink={0}>
                  <Icon as={LayoutDashboard} boxSize={3.5} color={sectionLabelColor} />
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color={sectionLabelColor}
                  >
                    Dashboard
                  </Text>
                  {dashboardLedger && (
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color={ledgerNameColor}
                    >
                      &middot; {dashboardLedger.name}
                    </Text>
                  )}
                </HStack>
                <Divider borderColor={dividerColor} />
              </HStack>

              <HomeNetWorthBanner
                defaultLedgerId={dashboardLedgerId}
                ledgers={ledgers}
              />
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} alignItems="start">
                <GridItem display="flex" flexDirection="column" gap={5}>
                  <HomeMonthSnapshot
                    defaultLedgerId={dashboardLedgerId}
                    ledgers={ledgers}
                  />
                  <HomeBudgetAlerts
                    defaultLedgerId={dashboardLedgerId}
                    ledgers={ledgers}
                  />
                </GridItem>
                <GridItem>
                  <HomeRecentTransactions
                    defaultLedgerId={dashboardLedgerId}
                    ledgers={ledgers}
                  />
                </GridItem>
              </Grid>

              {/* Fund Flow Map — cross-ledger transfer visualization */}
              <Box mt={6}>
                <HomeFundFlow />
              </Box>
            </Box>
          )}
        </PageContainer>
      </Box>
      <Suspense fallback={<div>Loading...</div>}>
        <CreateLedgerModal
          isOpen={isOpen}
          onClose={onClose}
          handleCreateLedger={handleCreateLedger}
        />
      </Suspense>
    </>
  );
};

export default HomeMain;
