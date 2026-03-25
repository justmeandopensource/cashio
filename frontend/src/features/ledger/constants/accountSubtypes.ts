import {
  Building2,
  PiggyBank,
  Shield,
  Lock,
  RefreshCw,
  Landmark,
  BookOpen,
  ShieldCheck,
  Gift,
  Home,
  Car,
  Wallet,
  CreditCard,
  HandCoins,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";

export interface AccountSubtypeMetadata {
  label: string;
  icon: LucideIcon;
  order: number;
  types: ("asset" | "liability")[];
}

export const ACCOUNT_SUBTYPES: Record<string, AccountSubtypeMetadata> = {
  current_account: { label: "Current Accounts", icon: Building2, order: 1, types: ["asset"] },
  savings_account: { label: "Savings Accounts", icon: PiggyBank, order: 2, types: ["asset"] },
  isa: { label: "ISA Accounts", icon: Shield, order: 3, types: ["asset"] },
  fixed_deposit: { label: "Fixed Deposits", icon: Lock, order: 4, types: ["asset"] },
  recurring_deposit: { label: "Recurring Deposits", icon: RefreshCw, order: 5, types: ["asset"] },
  pension: { label: "Pension Accounts", icon: Landmark, order: 6, types: ["asset"] },
  savings_scheme: { label: "Savings Schemes", icon: BookOpen, order: 7, types: ["asset"] },
  insurance: { label: "Insurance", icon: ShieldCheck, order: 9, types: ["asset"] },
  gift_card: { label: "Gift Cards", icon: Gift, order: 11, types: ["asset"] },
  fixed_asset: { label: "Fixed Assets", icon: Home, order: 12, types: ["asset"] },
  depreciating_asset: { label: "Depreciating Assets", icon: Car, order: 13, types: ["asset"] },
  cash: { label: "Cash", icon: Wallet, order: 14, types: ["asset"] },
  credit_card: { label: "Credit Cards", icon: CreditCard, order: 15, types: ["liability"] },
  loan: { label: "Loans & Mortgages", icon: HandCoins, order: 16, types: ["liability"] },
  other: { label: "Other Accounts", icon: MoreHorizontal, order: 99, types: ["asset", "liability"] },
};

export const getSubtypeLabel = (subtype: string): string => {
  return ACCOUNT_SUBTYPES[subtype]?.label || subtype;
};

export const getSubtypeIcon = (subtype: string): LucideIcon => {
  return ACCOUNT_SUBTYPES[subtype]?.icon || MoreHorizontal;
};

export const getSubtypesForType = (type: "asset" | "liability"): [string, AccountSubtypeMetadata][] => {
  return Object.entries(ACCOUNT_SUBTYPES)
    .filter(([, meta]) => meta.types.includes(type))
    .sort((a, b) => a[1].order - b[1].order);
};
