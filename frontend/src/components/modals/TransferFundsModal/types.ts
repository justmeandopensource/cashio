import type { Transaction, TransferEditData } from "@/types";

export interface Category {
  category_id: string;
  name: string;
  type: string;
}

export interface Account {
  account_id: string;
  name: string;
  type: string;
  net_balance?: number;
  subtype?: string;
  owner?: string;
}

export interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  onTransferCompleted: () => void;
  initialData?: Transaction;
  editTransferData?: TransferEditData;
}
