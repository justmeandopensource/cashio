import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@components/Layout";
import useLedgerStore from "@/components/shared/store";
import api from "@/lib/api";
import { getNetWorth } from "./api";
import NetWorthMain from "./components/NetWorthMain";

interface Ledger {
  ledger_id: string;
  name: string;
  currency_symbol: string;
  description?: string;
  notes?: string;
  nav_service_type?: string;
  api_key?: string;
  created_at?: string;
  updated_at?: string;
}

const NetWorth: React.FC = () => {
  const navigate = useNavigate();
  const { ledgerId, currencySymbol, ledgerName, setLedger } = useLedgerStore();
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | undefined>(ledgerId);

  // Keep local selection in sync when Zustand changes (e.g. user switches ledger elsewhere)
  useEffect(() => {
    setSelectedLedgerId(ledgerId);
  }, [ledgerId]);

  // Fetch all ledgers for the dropdown
  const { data: ledgers, isLoading: isLoadingLedgers } = useQuery<Ledger[]>({
    queryKey: ["ledgers"],
    queryFn: async () => {
      const response = await api.get("/ledger/list");
      return response.data;
    },
  });

  // Fetch net worth only when a ledger is selected
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["net-worth", selectedLedgerId],
    queryFn: () => getNetWorth(Number(selectedLedgerId)),
    enabled: !!selectedLedgerId,
    staleTime: 1000 * 60 * 5,
  });

  const handleLedgerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    const selected = ledgers?.find((l) => l.ledger_id == newId);
    if (selected) {
      setLedger(
        selected.ledger_id,
        selected.name,
        selected.currency_symbol,
        selected.description || "",
        selected.notes || "",
        selected.nav_service_type || "",
        selected.api_key,
        selected.created_at || "",
        selected.updated_at || "",
      );
    }
    setSelectedLedgerId(newId || undefined);
  };

  const handleLogout = (): void => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  // Derive the display name from the ledger that's currently selected
  const selectedLedgerName = ledgers?.find((l) => l.ledger_id === selectedLedgerId)?.name ?? ledgerName;
  const selectedCurrencySymbol = ledgers?.find((l) => l.ledger_id === selectedLedgerId)?.currency_symbol ?? currencySymbol ?? "";

  return (
    <Layout handleLogout={handleLogout}>
      <NetWorthMain
        data={data}
        isLoading={isLoading}
        isLoadingLedgers={isLoadingLedgers}
        ledgers={ledgers ?? []}
        selectedLedgerId={selectedLedgerId}
        onLedgerChange={handleLedgerChange}
        onRefetch={refetch}
        currencySymbol={selectedCurrencySymbol}
        ledgerName={selectedLedgerName}
      />
    </Layout>
  );
};

export default NetWorth;
