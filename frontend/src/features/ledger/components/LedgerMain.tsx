import { FC, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Flex,
  Text,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue,
} from "@chakra-ui/react";
import LedgerMainAccounts from "./LedgerMainAccounts";
import LedgerMainTransactions from "./LedgerMainTransactions";
import PhysicalAssets from "@features/physical-assets/PhysicalAssets";
import MutualFunds from "@features/mutual-funds/MutualFunds";
import api from "@/lib/api";
import { AlignLeft, CreditCard, Coins, TrendingUp } from "lucide-react";
import useLedgerStore from "@/components/shared/store";

interface Account {
  account_id: string;
  name: string;
  type: "asset" | "liability";
  is_group: boolean;
}

interface LedgerMainProps {
  // eslint-disable-next-line no-unused-vars
  onAddTransaction: (accountId?: string, transaction?: any) => void;
  // eslint-disable-next-line no-unused-vars
  onTransferFunds: (accountId?: string, transaction?: any) => void;
}

const LedgerMain: FC<LedgerMainProps> = ({ onAddTransaction, onTransferFunds }) => {
  const { ledgerId } = useLedgerStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabIndex, setTabIndex] = useState(() => {
    const tab = searchParams.get("tab");
    if (tab === "transactions") return 1;
    if (tab === "physical-assets") return 2;
    if (tab === "mutual-funds") return 3;
    return 0;
  });
  const [mutualFundsFilters, setMutualFundsFilters] = useState({
    selectedAmc: "all",
    selectedOwner: "all",
    selectedAssetClass: "all",
    showZeroBalance: false,
  });

  const handleCopyTransaction = async (transaction: any) => {
    onAddTransaction(undefined, transaction);
  };

  const tabBg = useColorModeValue("primaryBg", "gray.700");
  const tabBorderColor = useColorModeValue("tertiaryBg", "gray.600");
  const selectedTabColor = useColorModeValue("brand.700", "brand.200");
  const selectedTabBg = useColorModeValue("brand.50", "brand.900");
  const selectedTabBorderColor = useColorModeValue("brand.400", "brand.500");
  const hoverTabBg = useColorModeValue("brand.100", "brand.800");
  const tabColor = useColorModeValue("gray.600", "gray.400");

  const { data: accounts, isError, isLoading } = useQuery<Account[]>({
    queryKey: ["accounts", ledgerId],
    queryFn: async () => {
      const response = await api.get(`/ledger/${ledgerId}/accounts`);
      return response.data;
    },
  });

  const refreshAccountsData = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["accounts", ledgerId] });
  };

  const refreshInsightsData = async (): Promise<void> => {
    // Invalidate insights queries to refresh charts after transaction changes
    await queryClient.invalidateQueries({
      queryKey: ["current-month-overview"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["insights"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["categoryTrend"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["tag-trend"],
    });
  };

  const accountsCount = accounts
    ? accounts.filter((account) => !account.is_group).length
    : 0;

  const handleTabChange = (index: number) => {
    setTabIndex(index);
    const newSearchParams = new URLSearchParams(searchParams);
    if (index === 1) {
      newSearchParams.set("tab", "transactions");
    } else if (index === 2) {
      newSearchParams.set("tab", "physical-assets");
    } else if (index === 3) {
      newSearchParams.set("tab", "mutual-funds");
    } else {
      newSearchParams.delete("tab");
    }
    setSearchParams(newSearchParams);
  };

  if (isError) {
    return null;
  }

  return (
    <Box>
      <Box borderRadius="lg" boxShadow="lg" bg={tabBg} overflow="hidden">
        <Tabs
          variant="soft-rounded"
          colorScheme="brand"
          size={{ base: "md", md: "md" }}
          index={tabIndex}
          onChange={handleTabChange}
        >
          <Box
            p={{ base: 2, md: 4 }}
            borderBottom="1px solid"
            borderColor={tabBorderColor}
          >
            <Box>
              <TabList
                minW={{ base: "auto", md: "auto" }}
                borderBottom="none"
                justifyContent={{ base: "space-around", md: "flex-start" }}
              >
                 <Tab
                   px={{ base: 4, md: 6 }}
                   py={4}
                   fontWeight="medium"
                   borderRadius="md"
                   whiteSpace="nowrap"
                   flex={{ base: 1, md: "none" }}
                   _selected={{
                     color: selectedTabColor,
                     bg: selectedTabBg,
                     fontWeight: "semibold",
                     border: "1px solid",
                     borderColor: selectedTabBorderColor,
                   }}
                   color={tabColor}
                   _hover={{
                     bg: hoverTabBg,
                   }}
                 >
                  <Flex align="center" justify="center">
                    <Icon as={CreditCard} mr={{ base: 0, md: 2 }} />
                    <Text display={{ base: "none", md: "block" }}>Accounts</Text>
                    {accountsCount > 0 && (
                      <Badge ml={{ base: 0, md: 2 }} colorScheme="brand" borderRadius="full" px={2} display={{ base: "none", md: "inline-flex" }}>
                        {accountsCount}
                      </Badge>
                    )}
                  </Flex>
                </Tab>
                <Tab
                  px={{ base: 4, md: 6 }}
                  py={4}
                  fontWeight="medium"
                  borderRadius="md"
                  whiteSpace="nowrap"
                  flex={{ base: 1, md: "none" }}
                  _selected={{
                    color: selectedTabColor,
                    bg: selectedTabBg,
                    fontWeight: "semibold",
                    border: "1px solid",
                    borderColor: selectedTabBorderColor,
                  }}
                  color={tabColor}
                  _hover={{
                    bg: hoverTabBg,
                  }}
                >
                  <Flex align="center" justify="center">
                    <Icon as={AlignLeft} mr={{ base: 0, md: 2 }} />
                    <Text display={{ base: "none", md: "block" }}>Transactions</Text>
                  </Flex>
                </Tab>
                <Tab
                  px={{ base: 4, md: 6 }}
                  py={4}
                  fontWeight="medium"
                  borderRadius="md"
                  whiteSpace="nowrap"
                  flex={{ base: 1, md: "none" }}
                  _selected={{
                    color: selectedTabColor,
                    bg: selectedTabBg,
                    fontWeight: "semibold",
                    border: "1px solid",
                    borderColor: selectedTabBorderColor,
                  }}
                  color={tabColor}
                  _hover={{
                    bg: hoverTabBg,
                  }}
                >
                  <Flex align="center" justify="center">
                    <Icon as={Coins} mr={{ base: 0, md: 2 }} />
                    <Text display={{ base: "none", md: "block" }}>Physical Assets</Text>
                  </Flex>
                </Tab>
                <Tab
                  px={{ base: 4, md: 6 }}
                  py={4}
                  fontWeight="medium"
                  borderRadius="md"
                  whiteSpace="nowrap"
                  flex={{ base: 1, md: "none" }}
                  _selected={{
                    color: selectedTabColor,
                    bg: selectedTabBg,
                    fontWeight: "semibold",
                    border: "1px solid",
                    borderColor: selectedTabBorderColor,
                  }}
                  color={tabColor}
                  _hover={{
                    bg: hoverTabBg,
                  }}
                >
                  <Flex align="center" justify="center">
                    <Icon as={TrendingUp} mr={{ base: 0, md: 2 }} />
                    <Text display={{ base: "none", md: "block" }}>Mutual Funds</Text>
                  </Flex>
                </Tab>
              </TabList>
            </Box>
          </Box>
          <TabPanels>
            <TabPanel p={{ base: 2, md: 4 }}>
              {tabIndex === 0 && (
                <LedgerMainAccounts
                  accounts={accounts || []}
                  isLoading={isLoading}
                  onAddTransaction={onAddTransaction}
                  onTransferFunds={onTransferFunds}
                />
              )}
            </TabPanel>
            <TabPanel p={{ base: 2, md: 4 }}>
              {tabIndex === 1 && (
                <LedgerMainTransactions
                  onAddTransaction={onAddTransaction}
                  onTransactionDeleted={async () => {
                    await refreshAccountsData();
                    await queryClient.invalidateQueries({
                      queryKey: [`transactions-count`, ledgerId],
                    });
                    await refreshInsightsData();
                  }}
                  onTransactionUpdated={async () => {
                    await refreshAccountsData();
                    await refreshInsightsData();
                  }}
                  onCopyTransaction={handleCopyTransaction}
                  shouldFetch={tabIndex === 1}
                />
              )}
            </TabPanel>
            <TabPanel p={{ base: 2, md: 4 }}>
              {tabIndex === 2 && <PhysicalAssets />}
            </TabPanel>
            <TabPanel p={{ base: 2, md: 4 }}>
              {tabIndex === 3 && <MutualFunds onAccountDataChange={refreshAccountsData} filters={mutualFundsFilters} onFiltersChange={setMutualFundsFilters} />}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default LedgerMain;
