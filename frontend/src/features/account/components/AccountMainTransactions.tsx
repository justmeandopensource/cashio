import React from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";
import Transactions from "@/features/transactions/Transactions";

interface Account {
  ledger_id: string;
  account_id: string;
}

interface AccountMainTransactionsProps {
  account: Account;
  onAddTransaction: () => void;
  onTransactionDeleted: () => void;
  onTransactionUpdated: () => void;
   // eslint-disable-next-line no-unused-vars
   onCopyTransaction: (transaction: any) => Promise<void>;
}

const AccountMainTransactions: React.FC<AccountMainTransactionsProps> = ({
  account,
  onAddTransaction,
  onTransactionDeleted,
  onTransactionUpdated,
  onCopyTransaction,
}) => {
  const cardBg = useColorModeValue("white", "gray.700");

  return (
    <Box
      bg={{ base: "transparent", md: cardBg }}
      borderRadius={{ base: "none", md: "lg" }}
      boxShadow={{ base: "none", md: "sm" }}
    >
    <Transactions
      accountId={account.account_id}
      onAddTransaction={onAddTransaction}
      onTransactionDeleted={onTransactionDeleted}
      onTransactionUpdated={onTransactionUpdated}
      onCopyTransaction={onCopyTransaction}
    />
    </Box>
  );
};

export default AccountMainTransactions;
