import React from "react";
import Transactions from "@/features/transactions/Transactions";

interface LedgerMainTransactionsProps {
  // eslint-disable-next-line no-unused-vars
  onAddTransaction: (accountId?: string, transaction?: any) => void;
  onTransactionDeleted: () => void;
  onTransactionUpdated: () => void;
  // eslint-disable-next-line no-unused-vars
  onCopyTransaction: (transaction: any) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  onEditTransfer?: (transaction: any) => void;
  shouldFetch?: boolean;
}

const LedgerMainTransactions: React.FC<LedgerMainTransactionsProps> = ({
  onAddTransaction,
  onTransactionDeleted,
  onTransactionUpdated,
  onCopyTransaction,
  onEditTransfer,
  shouldFetch = false,
}) => {
  return (
    <Transactions
      accountId={undefined}
      onAddTransaction={() => onAddTransaction(undefined, undefined)}
      onTransactionDeleted={onTransactionDeleted}
      onTransactionUpdated={onTransactionUpdated}
      onCopyTransaction={onCopyTransaction}
      onEditTransfer={onEditTransfer}
      shouldFetch={shouldFetch}
    />
  );
};

export default LedgerMainTransactions;
