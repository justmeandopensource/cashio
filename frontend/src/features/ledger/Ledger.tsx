import { useNavigate } from "react-router-dom";
import {
  Button,
  useDisclosure,
  Box,
  HStack,
  Flex,
  Text,
} from "@chakra-ui/react";
import { lazy, Suspense } from "react";
import Layout from "@components/Layout";
import LedgerMain from "@features/ledger/components/LedgerMain";
import useLedgerStore from "@/components/shared/store";
import UpdateLedgerModal from "@components/modals/UpdateLedgerModal";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { BookText, ChevronLeft } from "lucide-react";
import LedgerDetailsModal from "@components/modals/LedgerDetailsModal";
import { useState } from "react";
import CreateTransactionModal from "@components/modals/CreateTransactionModal";
const TransferFundsModal = lazy(() => import("@components/modals/TransferFundsModal"));
import { useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const Ledger = () => {
  const navigate = useNavigate();
  const {
    ledgerId,
    ledgerName,
    currencySymbol,
    description,
    notes,
    navServiceType,
    apiKey,
    createdAt,
    updatedAt,
    setLedger,
  } = useLedgerStore();
  const queryClient = useQueryClient();

  // Fetch ledger details to ensure store has correct navServiceType and apiKey
  useQuery({
    queryKey: ["ledger", ledgerId],
    queryFn: async () => {
      if (!ledgerId) return null;
      const response = await api.get(`/ledger/${ledgerId}`);
      const data = response.data;
      // Update store with fetched data
      setLedger(
        data.ledger_id || ledgerId,
        data.name,
        data.currency_symbol,
        data.description,
        data.notes,
        data.nav_service_type,
        data.api_key,
        data.created_at,
        data.updated_at,
      );
      return data;
    },
    enabled: !!ledgerId,
  });

  const {
    isOpen: isUpdateLedgerModalOpen,
    onOpen: onUpdateLedgerModalOpen,
    onClose: onUpdateLedgerModalClose,
  } = useDisclosure();
  const {
    isOpen: isLedgerDetailsModalOpen,
    onOpen: onLedgerDetailsModalOpen,
    onClose: onLedgerDetailsModalClose,
  } = useDisclosure();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | undefined
  >(undefined);
  const [transactionToCopy, setTransactionToCopy] = useState<any | undefined>(
    undefined,
  );

  const handleAddTransaction = (accountId: string | undefined = undefined, transaction?: any) => {
    setSelectedAccountId(accountId);
    setTransactionToCopy(transaction);
    setIsCreateModalOpen(true);
  };

  const handleTransferFunds = (accountId: string | undefined = undefined, transaction?: any) => {
    setSelectedAccountId(accountId);
    setTransactionToCopy(transaction);
    setIsTransferModalOpen(true);
  };

  const refreshAccountsData = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["accounts", ledgerId] });
  };

  const refreshTransactionsData = async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: ["transactions"],
    });
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

  const handleUpdateCompleted = (data: {
    name: string;
    currency_symbol: string;
    description: string;
    notes: string;
    nav_service_type: string;
    api_key: string;
    created_at: string;
    updated_at: string;
  }) => {
    if (ledgerId) {
      setLedger(
        ledgerId,
        data.name,
        data.currency_symbol,
        data.description,
        data.notes,
        data.nav_service_type,
        data.api_key,
        data.created_at,
        data.updated_at,
      );
    }
  };

  const handleLogout = (): void => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <Layout handleLogout={handleLogout}>
      <PageHeader
        title={
          <HStack
            spacing={2}
            onClick={onLedgerDetailsModalOpen}
            cursor="pointer"
            role="group"
          >
            <Text>{ledgerName || "Ledger"}</Text>
          </HStack>
        }
        subtitle={description || "Ledger"}
        icon={BookText}
        backIcon={ChevronLeft}
        backOnClick={() => navigate("/")}
        actions={
          <Flex
            direction={{ base: "column", md: "row" }}
            alignItems={{ base: "center", md: "center" }}
            gap={2}
            width="100%"
          >
            <HStack spacing={2} justifyContent={{ base: "center", md: "flex-start" }} width={{ base: "100%", md: "auto" }}>
              <Button
                color="white"
                variant="ghost"
                bg="whiteAlpha.100"
                onClick={() => handleAddTransaction(undefined)}
                _hover={{ bg: "whiteAlpha.300" }}
              >
                Add Transaction
              </Button>
              <Button
                color="white"
                variant="ghost"
                bg="whiteAlpha.100"
                onClick={() => setIsTransferModalOpen(true)}
                _hover={{ bg: "whiteAlpha.300" }}
              >
                Transfer Funds
              </Button>
            </HStack>
          </Flex>
        }
      />
      <Box flex={1} overflowY="auto">
        <PageContainer>
          <LedgerMain
            onAddTransaction={handleAddTransaction}
            onTransferFunds={handleTransferFunds}
          />
        </PageContainer>
      </Box>

      {ledgerName && currencySymbol && (
        <UpdateLedgerModal
          isOpen={isUpdateLedgerModalOpen}
          onClose={onUpdateLedgerModalClose}
          currentLedgerName={ledgerName as string}
          currentCurrencySymbol={currencySymbol as string}
          currentDescription={description || ""}
          currentNotes={notes || ""}
          currentNavServiceType={navServiceType || "india"}
          currentApiKey={apiKey || ""}
          onUpdateCompleted={handleUpdateCompleted}
        />
      )}

      <LedgerDetailsModal
        isOpen={isLedgerDetailsModalOpen}
        onClose={onLedgerDetailsModalClose}
        ledgerName={ledgerName || ""}
        currencySymbol={currencySymbol || ""}
        description={description || ""}
        notes={notes || ""}
        createdAt={createdAt}
        updatedAt={updatedAt}
        onEditLedger={onUpdateLedgerModalOpen}
      />

      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setTransactionToCopy(undefined);
        }}
        accountId={selectedAccountId}
        onTransactionAdded={() => {
          refreshAccountsData();
          refreshTransactionsData();
        }}
        initialData={transactionToCopy}
      />

      <Suspense fallback={<div>Loading...</div>}>
        <TransferFundsModal
          isOpen={isTransferModalOpen}
          onClose={() => {
            setIsTransferModalOpen(false);
            setTransactionToCopy(undefined);
            setSelectedAccountId(undefined);
          }}
          accountId={selectedAccountId}
          onTransferCompleted={() => {
          refreshAccountsData();
          refreshTransactionsData();
        }}
        initialData={transactionToCopy}
        />
      </Suspense>
    </Layout>
  );
};

export default Ledger;