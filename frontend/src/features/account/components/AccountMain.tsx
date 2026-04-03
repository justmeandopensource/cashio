import React from "react";
import { Box } from "@chakra-ui/react";
import AccountSummaryStats from "./AccountSummaryStats";
import AccountBalanceChart from "./AccountBalanceChart";
import AccountInsights from "./AccountInsights";
import AccountMainTransactions from "./AccountMainTransactions";
import type { Account } from "@/types";

interface AccountMainProps {
  account: Account;
    
   onCopyTransaction: (transaction: any) => Promise<void>;
  onAddTransaction: () => void;
  onTransactionDeleted: () => void;
  onTransactionUpdated: () => void;
   
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

      {/* Balance History Chart */}
      <AccountBalanceChart accountId={account.account_id} />

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
