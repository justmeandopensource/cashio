import React from "react";
import Transactions from "@/features/transactions/Transactions";
import type { Transaction } from "@/types";

interface LedgerMainTransactionsProps {
  onAddTransaction: (accountId?: string, transaction?: Transaction) => void;
  onTransactionDeleted: () => void;
  onTransactionUpdated: () => void;
  onCopyTransaction: (transaction: Transaction) => Promise<void>;
  onEditTransfer?: (transaction: Transaction) => void;
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
