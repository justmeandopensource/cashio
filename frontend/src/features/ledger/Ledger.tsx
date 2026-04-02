import { useNavigate } from "react-router-dom";
import {
  Button,
  useDisclosure,
  Box,
  HStack,
  Text,
} from "@chakra-ui/react";
import { lazy, Suspense } from "react";
import Layout from "@components/Layout";
import LedgerMain from "@features/ledger/components/LedgerMain";
import useLedgerStore from "@/components/shared/store";
import UpdateLedgerModal from "@components/modals/UpdateLedgerModal";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { BookText, ChevronLeft, Plus, Repeat } from "lucide-react";
import LedgerDetailsModal from "@components/modals/LedgerDetailsModal";
import { useState, useEffect } from "react";
import CreateTransactionModal from "@components/modals/CreateTransactionModal";
const TransferFundsModal = lazy(() => import("@components/modals/TransferFundsModal"));
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { notify } from "@/components/shared/notify";
import { useLedger } from "./hooks";
import { useLogout } from "@/lib/useLogout";
import useCommandPaletteStore from "@/components/shared/commandPaletteStore";

const Ledger = () => {
  const navigate = useNavigate();
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const ledgerName = useLedgerStore((s) => s.ledgerName);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const description = useLedgerStore((s) => s.description);
  const notes = useLedgerStore((s) => s.notes);
  const navServiceType = useLedgerStore((s) => s.navServiceType);
  const createdAt = useLedgerStore((s) => s.createdAt);
  const updatedAt = useLedgerStore((s) => s.updatedAt);
  const setLedger = useLedgerStore((s) => s.setLedger);
  const queryClient = useQueryClient();

  // Fetch ledger details to ensure store has correct navServiceType
  const { data: ledgerData } = useLedger(ledgerId);

  useEffect(() => {
    if (ledgerData) {
      setLedger({
        ledgerId: ledgerData.ledger_id || ledgerId || "",
        ledgerName: ledgerData.name,
        currencySymbol: ledgerData.currency_symbol,
        description: ledgerData.description ?? "",
        notes: ledgerData.notes ?? "",
        navServiceType: ledgerData.nav_service_type ?? "",
        createdAt: ledgerData.created_at ?? "",
        updatedAt: ledgerData.updated_at ?? "",
      });
    }
  }, [ledgerData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle quick actions triggered from the command palette
  const pendingAction = useCommandPaletteStore((s) => s.pendingAction);
  const clearPendingAction = useCommandPaletteStore((s) => s.setPendingAction);

  useEffect(() => {
    if (pendingAction === "add-transaction") {
      clearPendingAction(null);
      setIsCreateModalOpen(true);
    } else if (pendingAction === "transfer-funds") {
      clearPendingAction(null);
      setIsTransferModalOpen(true);
    }
  }, [pendingAction, clearPendingAction]);

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
  const [editTransferData, setEditTransferData] = useState<any | undefined>(
    undefined,
  );
  const handleEditTransfer = async (transaction: any) => {
    if (!transaction.transfer_id) return;
    try {
      const response = await api.get(`/ledger/transfer/${transaction.transfer_id}`);
      setEditTransferData({
        ...response.data,
        transfer_id: transaction.transfer_id,
      });
      setIsTransferModalOpen(true);
    } catch {
      notify({
        description: "Failed to load transfer details.",
        status: "error",
      });
    }
  };

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
    created_at: string;
    updated_at: string;
  }) => {
    if (ledgerId) {
      setLedger({
        ledgerId,
        ledgerName: data.name,
        currencySymbol: data.currency_symbol,
        description: data.description,
        notes: data.notes,
        navServiceType: data.nav_service_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }
  };

  const handleLogout = useLogout();

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
        breadcrumbs={[
          { label: ledgerName || "Ledger" },
        ]}
        actions={
          <HStack spacing={2} w={{ base: "100%", md: "auto" }}>
            <Button
              leftIcon={<Plus size={14} />}
              colorScheme="brand"
              size="sm"
              borderRadius="md"
              fontWeight="medium"
              onClick={() => handleAddTransaction(undefined)}
              flex={{ base: 1, md: "none" }}
            >
              Add Transaction
            </Button>
            <Button
              leftIcon={<Repeat size={14} />}
              colorScheme="brand"
              variant="outline"
              size="sm"
              borderRadius="md"
              fontWeight="medium"
              onClick={() => setIsTransferModalOpen(true)}
              flex={{ base: 1, md: "none" }}
            >
              Transfer Funds
            </Button>
          </HStack>
        }
      />
      <Box flex={1} overflowY="auto">
        <PageContainer>
          <LedgerMain
            onAddTransaction={handleAddTransaction}
            onTransferFunds={handleTransferFunds}
            onEditTransfer={handleEditTransfer}
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
            setEditTransferData(undefined);
          }}
          accountId={selectedAccountId}
          onTransferCompleted={() => {
          refreshAccountsData();
          refreshTransactionsData();
        }}
        initialData={transactionToCopy}
        editTransferData={editTransferData}
        />
      </Suspense>
    </Layout>
  );
};

export default Ledger;