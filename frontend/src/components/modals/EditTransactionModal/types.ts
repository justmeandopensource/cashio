import type { Transaction } from "@/types";

export interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onTransactionUpdated: () => void;
}
