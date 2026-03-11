import React from "react";
import { Box } from "@chakra-ui/react";
import AccountMainTransactions from "./AccountMainTransactions";

interface Account {
  ledger_id: string;
  account_id: string;
  name: string;
  type: "asset" | "liability";
  net_balance: number;
  opening_balance: number;
  parent_account_id: string;
  balance: number;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface AccountMainProps {
  account: Account;
   // eslint-disable-next-line no-unused-vars
   onCopyTransaction: (transaction: any) => Promise<void>;
  onAddTransaction: () => void;
  onTransactionDeleted: () => void;
  onTransactionUpdated: () => void;
}

const AccountMain: React.FC<AccountMainProps> = ({
  account,
  onCopyTransaction,
  onAddTransaction,
  onTransactionDeleted,
  onTransactionUpdated
}) => {
  return (
    <Box>
      {/* Transactions Section */}
      <AccountMainTransactions
        account={account}
        onAddTransaction={onAddTransaction}
        onTransactionDeleted={onTransactionDeleted}
        onTransactionUpdated={onTransactionUpdated}
        onCopyTransaction={onCopyTransaction}
      />
    </Box>
  );
};

export default AccountMain;
