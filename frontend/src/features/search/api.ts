import api from "@/lib/api";

export interface SearchResultItem {
  type: "account" | "transaction" | "mutual_fund" | "physical_asset";
  id: number;
  title: string;
  subtitle: string | null;
  ledger_id: number | null;
  ledger_name: string | null;
  currency_symbol: string | null;
  matched_field: string | null;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total_count: number;
  query: string;
}

export const globalSearch = async (
  query: string,
  signal?: AbortSignal
): Promise<SearchResponse> => {
  const response = await api.get("/search", {
    params: { q: query },
    signal,
  });
  return response.data;
};
