import React from "react";
import { Card, CardBody, useColorModeValue } from "@chakra-ui/react";
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
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");

  return (
    <Card bg={cardBg}>
      <CardBody>
        <Transactions
          accountId={account.account_id}
          onAddTransaction={onAddTransaction}
          onTransactionDeleted={onTransactionDeleted}
          onTransactionUpdated={onTransactionUpdated}
          onCopyTransaction={onCopyTransaction}
        />
      </CardBody>
    </Card>
  );
};

export default AccountMainTransactions;
