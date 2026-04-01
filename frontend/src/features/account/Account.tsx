import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLogout } from "@/lib/useLogout";
import Layout from "@components/Layout";
import AccountMain from "@features/account/components/AccountMain";
import PageContainer from "@components/shared/PageContainer";
import PageHeader from "@components/shared/PageHeader";
import { Button, Box, Text, HStack, Badge, useColorModeValue } from "@chakra-ui/react";
import { lazy, Suspense } from "react";
import { Building, ShieldAlert, ChevronLeft, Plus, Repeat } from "lucide-react";
import { formatNumberAsCurrency } from "@components/shared/utils";
import { getSubtypeLabel } from "@/features/ledger/constants/accountSubtypes";
import api from "@/lib/api";
import useLedgerStore from "@/components/shared/store";
import type { BreadcrumbEntry } from "@/components/shared/Breadcrumbs";
import UpdateAccountModal from "@components/modals/UpdateAccountModal";
import CreateTransactionModal from "@components/modals/CreateTransactionModal";
const TransferFundsModal = lazy(() => import("@components/modals/TransferFundsModal"));
import AccountDetailsModal from "@components/modals/AccountDetailsModal";
import { useDisclosure } from "@chakra-ui/react";
import { useAccount } from "./hooks";

const Account: React.FC = () => {
  const navigate = useNavigate();
  const { accountId } = useParams<{ accountId: string }>();
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const ledgerName = useLedgerStore((s) => s.ledgerName);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] =
    useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  const greenColor = useColorModeValue("green.500", "green.300");
  const greenBgColor = useColorModeValue("green.50", "green.800");
  const greenBorderColor = useColorModeValue("green.200", "green.600");
  const redColor = useColorModeValue("red.500", "red.300");
  const redBgColor = useColorModeValue("red.50", "red.800");
  const redBorderColor = useColorModeValue("red.200", "red.600");
  const grayColor = useColorModeValue("secondaryTextColor", "secondaryTextColor");
  const grayBgColor = useColorModeValue("secondaryBg", "secondaryBg");
  const grayBorderColor = useColorModeValue("tertiaryBg", "tertiaryBg");

  // Function to get balance color based on balance value and account type
  const getBalanceStyling = (balance: number, accountType?: string) => {
    // For asset accounts: Positive = Good (green), Negative = Bad (red)
    // For liability accounts: Positive = Bad (red), Negative = Good (green)
    const isPositiveGood = accountType !== "liability";

    if (balance > 0) {
      return isPositiveGood
        ? { color: greenColor, bgColor: greenBgColor, borderColor: greenBorderColor }
        : { color: redColor, bgColor: redBgColor, borderColor: redBorderColor };
    } else if (balance < 0) {
      return isPositiveGood
        ? { color: redColor, bgColor: redBgColor, borderColor: redBorderColor }
        : { color: greenColor, bgColor: greenBgColor, borderColor: greenBorderColor };
    } else {
      return { color: grayColor, bgColor: grayBgColor, borderColor: grayBorderColor };
    }
  };

  // Modal state for account details
  const {
    isOpen: isDetailsModalOpen,
    onOpen: onDetailsModalOpen,
    onClose: onDetailsModalClose,
  } = useDisclosure();
  const [transactionToCopy, setTransactionToCopy] = useState<any | undefined>(
    undefined
  );
  const [editTransferData, setEditTransferData] = useState<any | undefined>(
    undefined
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
      // Silently fail - toast will be shown by the API interceptor if needed
    }
  };

  const handleCopyTransaction = async (transaction: any) => {
    setTransactionToCopy(transaction);
    if (transaction.is_transfer) {
      setIsTransferModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleLogout = useLogout();

  // Fetch account
  const { data: account, isError } = useAccount(ledgerId || "", accountId || "");

  const refreshAccountData = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["account", accountId] });
  };

  const refreshTransactionsData = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["accounts", ledgerId] }),
      queryClient.invalidateQueries({ queryKey: ["current-month-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["insights"] }),
      queryClient.invalidateQueries({ queryKey: ["categoryTrend"] }),
      queryClient.invalidateQueries({ queryKey: ["tag-trend"] }),
      queryClient.invalidateQueries({ queryKey: ["budgets"] }),
      queryClient.invalidateQueries({ queryKey: ["account-summary", accountId] }),
      queryClient.invalidateQueries({ queryKey: ["account-insights", accountId] }),
    ]);
  };

  const handleTransactionDeleted = async (): Promise<void> => {
    await Promise.all([refreshAccountData(), refreshTransactionsData()]);
  };

  const handleTransactionUpdated = async (): Promise<void> => {
    await Promise.all([refreshAccountData(), refreshTransactionsData()]);
  };

  if (isError) {
    return (
      <Layout handleLogout={handleLogout}>
        <PageContainer>
          <Box textAlign="center" py={10} px={6}>
            <Text fontSize="xl" fontWeight="bold" mb={2}>
              Failed to load account data.
            </Text>
          </Box>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout handleLogout={handleLogout}>
      <PageHeader
        title={
          account ? (
            <HStack
              spacing={3}
              align="center"
              onClick={onDetailsModalOpen}
              cursor="pointer"
              flexWrap="nowrap"
            >
              <Text fontSize={{ base: "md", md: "inherit" }}>
                {account.name}
              </Text>
              <Badge
                variant="subtle"
                bg={
                  getBalanceStyling(account.net_balance, account.type).bgColor
                }
                color={
                  getBalanceStyling(account.net_balance, account.type).color
                }
                border="1px solid"
                borderColor={
                  getBalanceStyling(account.net_balance, account.type)
                    .borderColor
                }
                borderRadius="md"
                px={2}
                py={1}
                fontSize="sm"
                fontWeight="semibold"
              >
                {formatNumberAsCurrency(account.net_balance, currencySymbol || "$")}
              </Badge>
            </HStack>
          ) : (
            "Account"
          )
        }
        subtitle={
          account
            ? [
                getSubtypeLabel(account.subtype),
                account.owner,
              ].filter(Boolean).join(" \u00B7 ")
            : ""
        }
        icon={account?.type === "asset" ? Building : ShieldAlert}
        backIcon={ChevronLeft}
        backOnClick={() => navigate("/ledger")}
        breadcrumbs={[
          { label: ledgerName || "Ledger", path: "/ledger" },
          { label: account?.name || "Account" },
        ] as BreadcrumbEntry[]}
        actions={
          <HStack spacing={2} w={{ base: "100%", md: "auto" }}>
            <Button
              leftIcon={<Plus size={14} />}
              colorScheme="brand"
              size="sm"
              borderRadius="md"
              fontWeight="medium"
              onClick={() => setIsCreateModalOpen(true)}
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
           {account && (
             <AccountMain
               account={account}
               onCopyTransaction={handleCopyTransaction}
               onAddTransaction={() => setIsCreateModalOpen(true)}
               onTransactionDeleted={handleTransactionDeleted}
               onTransactionUpdated={handleTransactionUpdated}
               onEditTransfer={handleEditTransfer}
             />
           )}
        </PageContainer>
      </Box>

      {account && (
        <>
          <CreateTransactionModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setTransactionToCopy(undefined);
            }}
            accountId={accountId as string}
            onTransactionAdded={() => {
              refreshAccountData();
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
                setEditTransferData(undefined);
              }}
            accountId={accountId as string}
            onTransferCompleted={() => {
              refreshAccountData();
              refreshTransactionsData();
            }}
            initialData={transactionToCopy}
            editTransferData={editTransferData}
            />
          </Suspense>

           <UpdateAccountModal
             isOpen={isUpdateModalOpen}
             onClose={() => setIsUpdateModalOpen(false)}
             account={account}
             onUpdateCompleted={async () => {
               await refreshAccountData();
               await queryClient.invalidateQueries({ queryKey: ["accounts", ledgerId] });
             }}
             currentDescription={account.description}
             currentNotes={account.notes}
           />

          <AccountDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={onDetailsModalClose}
            accountName={account.name}
            accountType={account.type}
            accountSubtype={account.subtype}
            accountOwner={account.owner}
            openingBalance={account.opening_balance}
            netBalance={account.net_balance}
            currencySymbol={currencySymbol || "$"}
            description={account.description}
            notes={account.notes}
            createdAt={account.created_at}
             updatedAt={account.updated_at}
            onEditAccount={() => setIsUpdateModalOpen(true)}
          />
        </>
      )}
    </Layout>
  );
};

export default Account;
