import api from "@/lib/api";
import type { TransactionsResponse, Filters, TransferDetails } from "@/types";

export interface GetTransactionsParams {
  page?: number;
  per_page?: number;
  account_id?: string;
  filters?: Filters;
}

export const getTransactions = async (
  ledgerId: string | number,
  params: GetTransactionsParams = {},
  signal?: AbortSignal
): Promise<TransactionsResponse> => {
  const { page = 1, per_page = 50, account_id, filters = {} } = params;
  const searchParams = new URLSearchParams();

  searchParams.append("page", page.toString());
  searchParams.append("per_page", per_page.toString());

  if (account_id) {
    searchParams.append("account_id", account_id);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (key === "tags" && Array.isArray(value)) {
      value.forEach((tag) => {
        searchParams.append("tags", tag);
      });
    } else if (value !== null && value !== undefined && value !== "") {
      searchParams.append(key, value as string);
    }
  });

  const response = await api.get(`/ledger/${ledgerId}/transactions`, {
    params: searchParams,
    signal,
  });
  return response.data;
};

export const deleteTransaction = async (
  ledgerId: string | number,
  transactionId: string
): Promise<void> => {
  await api.delete(`/ledger/${ledgerId}/transaction/${transactionId}`);
};

export const getTransferDetails = async (
  transferId: string
): Promise<TransferDetails> => {
  const response = await api.get(`/ledger/transfer/${transferId}`);
  return response.data;
};
