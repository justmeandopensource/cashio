import React from "react";
import { Box, Grid, GridItem } from "@chakra-ui/react";
import AccountSummaryStats from "./AccountSummaryStats";
import AccountBalanceChart from "./AccountBalanceChart";
import AccountFundsFlowChart from "./AccountFundsFlowChart";
import AccountInsights from "./AccountInsights";
import AccountMainTransactions from "./AccountMainTransactions";
import useLedgerStore from "@/components/shared/store";
import { useAccountFundsFlow } from "../hooks";
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
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const { data: fundsFlowData } = useAccountFundsFlow(
    ledgerId || "",
    account.account_id
  );
  const hasFundsFlow = fundsFlowData?.has_data ?? false;

  return (
    <Box>
      {/* Account Summary Stats */}
      <AccountSummaryStats accountId={account.account_id} />

      {/* Balance History + Funds Flow */}
      <Grid
        templateColumns={{
          base: "1fr",
          lg: hasFundsFlow ? "1fr 1fr" : "1fr",
        }}
        gap={{ base: 4, md: 5 }}
        mb={{ base: 4, md: 5 }}
      >
        <GridItem>
          <AccountBalanceChart accountId={account.account_id} />
        </GridItem>
        {hasFundsFlow && (
          <GridItem>
            <AccountFundsFlowChart accountId={account.account_id} />
          </GridItem>
        )}
      </Grid>

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
