import { create } from "zustand";

type PendingAction = "add-transaction" | "transfer-funds" | null;

interface CommandPaletteState {
  pendingAction: PendingAction;
  setPendingAction: (action: PendingAction) => void;
}

const useCommandPaletteStore = create<CommandPaletteState>()((set) => ({
  pendingAction: null,
  setPendingAction: (action) => set({ pendingAction: action }),
}));

export default useCommandPaletteStore;
