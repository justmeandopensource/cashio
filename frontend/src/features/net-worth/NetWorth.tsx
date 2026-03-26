import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@components/Layout";
import useLedgerStore from "@/components/shared/store";
import { getNetWorth } from "./api";
import NetWorthMain from "./components/NetWorthMain";
import { useLedgers } from "@features/ledger/hooks";
import { useLogout } from "@/lib/useLogout";

const NetWorth: React.FC = () => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const setLedger = useLedgerStore((s) => s.setLedger);
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
      setLedger({
        ledgerId: selected.ledger_id,
        ledgerName: selected.name,
        currencySymbol: selected.currency_symbol,
        description: selected.description || "",
        notes: selected.notes || "",
        navServiceType: selected.nav_service_type || "",
        createdAt: selected.created_at || "",
        updatedAt: selected.updated_at || "",
      });
    }
    setSelectedLedgerId(newId || undefined);
  };

  const handleLogout = useLogout();

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
