import api from "@/lib/api";
import type { Ledger, Account } from "@/types";

export interface CreateLedgerData {
  name: string;
  currency_symbol: string;
  description: string;
  notes: string;
  nav_service_type: string;
}

export const getLedgers = async (signal?: AbortSignal): Promise<Ledger[]> => {
  const response = await api.get("/ledger/list", { signal });
  return response.data;
};

export const getLedger = async (ledgerId: string | number, signal?: AbortSignal): Promise<Ledger> => {
  const response = await api.get(`/ledger/${ledgerId}`, { signal });
  return response.data;
};

export const createLedger = async (data: CreateLedgerData): Promise<Ledger> => {
  const response = await api.post("/ledger/create", data);
  return response.data;
};

export const getAccounts = async (ledgerId: string | number, signal?: AbortSignal): Promise<Account[]> => {
  const response = await api.get(`/ledger/${ledgerId}/accounts`, { signal });
  return response.data;
};

export const getTransactionsCount = async (ledgerId: string | number): Promise<number> => {
  const response = await api.get(`/ledger/${ledgerId}/transactions-count`);
  return response.data;
};

export const getLedgerDetails = async (ledgerId: string | number, signal?: AbortSignal): Promise<Ledger> => {
  const response = await api.get(`/ledger/${ledgerId}`, { signal });
  return response.data;
};

export const updateLedger = async (
  ledgerId: string | number,
  data: Partial<CreateLedgerData>,
): Promise<Ledger> => {
  const response = await api.put(`/ledger/${ledgerId}`, data);
  return response.data;
};

export interface CreateAccountPayload {
  name: string;
  subtype: string;
  type: string;
  owner?: string;
  opening_balance?: number;
  description?: string;
  notes?: string;
}

export const createAccount = async (
  ledgerId: string | number,
  data: CreateAccountPayload,
) => {
  const response = await api.post(`/ledger/${ledgerId}/account/create`, data);
  return response.data;
};

export const updateAccount = async (
  ledgerId: string | number,
  accountId: string | number,
  data: Partial<CreateAccountPayload>,
) => {
  const response = await api.put(
    `/ledger/${ledgerId}/account/${accountId}`,
    data,
  );
  return response.data;
};
