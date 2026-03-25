import React from "react";
import { Box } from "@chakra-ui/react";
import AccountSummaryStats from "./AccountSummaryStats";
import AccountInsights from "./AccountInsights";
import AccountMainTransactions from "./AccountMainTransactions";

interface Account {
  ledger_id: string;
  account_id: string;
  name: string;
  type: "asset" | "liability";
  subtype: string;
  owner?: string;
  net_balance: number;
  opening_balance: number;
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
  // eslint-disable-next-line no-unused-vars
  onEditTransfer?: (transaction: any) => void;
}

const AccountMain: React.FC<AccountMainProps> = ({
  account,
  onCopyTransaction,
  onAddTransaction,
  onTransactionDeleted,
  onTransactionUpdated,
  onEditTransfer,
}) => {
  return (
    <Box>
      {/* Account Summary Stats */}
      <AccountSummaryStats accountId={account.account_id} />

      {/* Account Insights */}
      <AccountInsights accountId={account.account_id} />

      {/* Transactions Section */}
      <AccountMainTransactions
        account={account}
        onAddTransaction={onAddTransaction}
        onTransactionDeleted={onTransactionDeleted}
        onTransactionUpdated={onTransactionUpdated}
        onCopyTransaction={onCopyTransaction}
        onEditTransfer={onEditTransfer}
      />
    </Box>
  );
};

export default AccountMain;
