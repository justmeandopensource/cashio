import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@components/Layout";
import useLedgerStore from "@/components/shared/store";
import { getNetWorth } from "./api";
import NetWorthMain from "./components/NetWorthMain";
import { useLedgers } from "@features/ledger/hooks";

const NetWorth: React.FC = () => {
  const navigate = useNavigate();
  const { ledgerId, currencySymbol, setLedger } = useLedgerStore();
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | undefined>(ledgerId);

  // Keep local selection in sync when Zustand changes (e.g. user switches ledger elsewhere)
  useEffect(() => {
    setSelectedLedgerId(ledgerId);
  }, [ledgerId]);

  // Fetch all ledgers for the dropdown
  const { data: ledgers, isLoading: isLoadingLedgers } = useLedgers();

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
      />
    </Layout>
  );
};

export default NetWorth;
