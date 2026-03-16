import api from "@/lib/api";
import { NetWorthResponse } from "./types";

export const getNetWorth = async (ledgerId: number): Promise<NetWorthResponse> => {
  const response = await api.get(`/ledger/${ledgerId}/net-worth`);
  return response.data;
};
