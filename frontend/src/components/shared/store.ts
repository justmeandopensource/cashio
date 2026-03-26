import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LedgerData {
  ledgerId: string | undefined;
  ledgerName: string | undefined;
  currencySymbol: string | undefined;
  description: string | undefined;
  notes: string | undefined;
  navServiceType: string | undefined;
  createdAt: string | undefined;
  updatedAt: string | undefined;
}

interface LedgerState extends LedgerData {
  setLedger: (data: Partial<LedgerData>) => void;
  clearLedger: () => void;
}

const useLedgerStore = create<LedgerState>()(
  persist(
    (set) => ({
      ledgerId: undefined,
      ledgerName: undefined,
      currencySymbol: undefined,
      description: undefined,
      notes: undefined,
      navServiceType: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      setLedger: (data) => set(data),
      clearLedger: () =>
        set({
          ledgerId: undefined,
          ledgerName: undefined,
          currencySymbol: undefined,
          description: undefined,
          notes: undefined,
          navServiceType: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        }),
    }),
    {
      name: "ledger-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        ledgerId: state.ledgerId,
        ledgerName: state.ledgerName,
        currencySymbol: state.currencySymbol,
        description: state.description,
        notes: state.notes,
        navServiceType: state.navServiceType,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      }),
    },
  ),
);

export default useLedgerStore;
