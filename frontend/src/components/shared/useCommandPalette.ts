import { useMemo } from "react";
import type React from "react";
import {
  Home,
  Bookmark,
  TrendingUp,
  BarChart3,
  Target,
  User,
  Lock,
  Database,
  BookText,
  CreditCard,
  ArrowLeftRight,
  Gem,
  Plus,
  Repeat,
  PieChart,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useLedgerStore from "@/components/shared/store";
import { useLedgers } from "@/features/ledger/hooks";
import useCommandPaletteStore from "@/components/shared/commandPaletteStore";
import { useLogout } from "@/lib/useLogout";
import type { Ledger } from "@/types/ledger";

export type CommandCategory =
  | "quick-action"
  | "navigation"
  | "ledger"
  | "insights";

export interface PaletteCommand {
  id: string;
  title: string;
  subtitle?: string;
  category: CommandCategory;
  icon: React.ElementType;
  keywords: string[];
  execute: () => void;
}

const CATEGORY_ORDER: CommandCategory[] = [
  "quick-action",
  "navigation",
  "ledger",
  "insights",
];

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  "quick-action": "Quick Actions",
  navigation: "Pages",
  ledger: "Ledgers",
  insights: "Insights",
};

export { CATEGORY_ORDER, CATEGORY_LABELS };

export function filterCommands(
  commands: PaletteCommand[],
  query: string
): PaletteCommand[] {
  if (!query) return commands;
  const lower = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(lower) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(lower))
  );
}

export function useCommandPalette(onClose: () => void) {
  const navigate = useNavigate();
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const ledgerName = useLedgerStore((s) => s.ledgerName);
  const setLedger = useLedgerStore((s) => s.setLedger);
  const { data: ledgers } = useLedgers();
  const setPendingAction = useCommandPaletteStore((s) => s.setPendingAction);
  const logout = useLogout();

  const commands = useMemo(() => {
    const cmds: PaletteCommand[] = [];

    const nav = (path: string) => {
      onClose();
      navigate(path);
    };

    // --- Quick Actions (ledger required) ---
    if (ledgerId) {
      cmds.push({
        id: "action:add-transaction",
        title: "Add Transaction",
        subtitle: ledgerName || undefined,
        category: "quick-action",
        icon: Plus,
        keywords: ["create", "new", "expense", "income"],
        execute: () => {
          setPendingAction("add-transaction");
          nav("/ledger");
        },
      });
      cmds.push({
        id: "action:transfer-funds",
        title: "Transfer Funds",
        subtitle: ledgerName || undefined,
        category: "quick-action",
        icon: Repeat,
        keywords: ["move", "send", "transfer"],
        execute: () => {
          setPendingAction("transfer-funds");
          nav("/ledger");
        },
      });
    }

    // --- Pages (always visible) ---
    cmds.push({
      id: "nav:home",
      title: "Go to Dashboard",
      subtitle: "Home page",
      category: "navigation",
      icon: Home,
      keywords: ["home", "dashboard", "ledgers"],
      execute: () => nav("/"),
    });
    cmds.push({
      id: "nav:categories",
      title: "Go to Categories",
      subtitle: "Manage income & expense categories",
      category: "navigation",
      icon: Bookmark,
      keywords: ["category", "income", "expense"],
      execute: () => nav("/categories"),
    });
    cmds.push({
      id: "nav:net-worth",
      title: "Go to Net Worth",
      subtitle: "Assets, liabilities & net worth",
      category: "navigation",
      icon: TrendingUp,
      keywords: ["net worth", "assets", "liabilities", "wealth"],
      execute: () => nav("/net-worth"),
    });
    cmds.push({
      id: "nav:insights",
      title: "Go to Insights",
      subtitle: "Charts & analytics",
      category: "navigation",
      icon: BarChart3,
      keywords: ["insights", "charts", "analytics", "reports", "visualization"],
      execute: () => nav("/insights"),
    });
    cmds.push({
      id: "nav:budget",
      title: "Go to Budget",
      subtitle: "Budget tracking",
      category: "navigation",
      icon: Target,
      keywords: ["budget", "spending", "limit"],
      execute: () => nav("/budget"),
    });
    cmds.push({
      id: "nav:profile",
      title: "Go to Profile",
      subtitle: "Account settings",
      category: "navigation",
      icon: User,
      keywords: ["profile", "account", "settings", "user"],
      execute: () => nav("/profile"),
    });
    cmds.push({
      id: "nav:change-password",
      title: "Change Password",
      subtitle: "Security settings",
      category: "navigation",
      icon: Lock,
      keywords: ["password", "security", "credentials"],
      execute: () => nav("/profile?tab=security"),
    });
    cmds.push({
      id: "nav:backup",
      title: "System Backup",
      subtitle: "Create & restore backups",
      category: "navigation",
      icon: Database,
      keywords: ["backup", "restore", "export", "import", "data"],
      execute: () => nav("/profile?tab=backups"),
    });
    cmds.push({
      id: "action:logout",
      title: "Log Out",
      subtitle: "Sign out of your account",
      category: "quick-action",
      icon: LogOut,
      keywords: ["logout", "log out", "sign out", "signout", "exit", "quit"],
      execute: () => {
        onClose();
        logout();
      },
    });

    // --- Ledger-specific pages (only when ledger selected) ---
    if (ledgerId) {
      cmds.push({
        id: "nav:accounts",
        title: "Go to Accounts",
        subtitle: ledgerName || undefined,
        category: "navigation",
        icon: CreditCard,
        keywords: ["accounts", "bank", "savings", "credit card"],
        execute: () => nav("/ledger"),
      });
      cmds.push({
        id: "nav:transactions",
        title: "Go to Transactions",
        subtitle: ledgerName || undefined,
        category: "navigation",
        icon: ArrowLeftRight,
        keywords: ["transactions", "payments", "history"],
        execute: () => nav("/ledger?tab=transactions"),
      });
      cmds.push({
        id: "nav:physical-assets",
        title: "Go to Physical Assets",
        subtitle: ledgerName || undefined,
        category: "navigation",
        icon: Gem,
        keywords: ["physical assets", "gold", "silver", "property"],
        execute: () => nav("/ledger?tab=physical-assets"),
      });
      cmds.push({
        id: "nav:mutual-funds",
        title: "Go to Mutual Funds",
        subtitle: ledgerName || undefined,
        category: "navigation",
        icon: TrendingUp,
        keywords: ["mutual funds", "mf", "investments", "portfolio", "sip"],
        execute: () => nav("/ledger?tab=mutual-funds"),
      });
    }

    // --- Ledger switching (one per ledger) ---
    if (ledgers) {
      ledgers.forEach((ledger: Ledger) => {
        cmds.push({
          id: `ledger:${ledger.ledger_id}`,
          title: `Switch to ${ledger.name}`,
          subtitle: ledger.currency_symbol,
          category: "ledger",
          icon: BookText,
          keywords: [ledger.name, ledger.currency_symbol, "ledger", "switch"],
          execute: () => {
            setLedger({
              ledgerId: ledger.ledger_id,
              ledgerName: ledger.name,
              currencySymbol: ledger.currency_symbol,
              description: ledger.description || "",
              notes: ledger.notes || "",
              navServiceType: ledger.nav_service_type || "",
              createdAt: ledger.created_at || "",
              updatedAt: ledger.updated_at || "",
            });
            onClose();
            navigate("/ledger");
          },
        });
      });
    }

    // --- Insights charts ---
    const insightCharts: { value: string; label: string; keywords: string[] }[] = [
      { value: "income-expense-trend", label: "Income vs Expense Trend", keywords: ["income", "expense", "trend"] },
      { value: "current-month-overview", label: "Current Month Overview", keywords: ["current", "month", "overview", "summary"] },
      { value: "category-trend", label: "Category Trend", keywords: ["category", "trend"] },
      { value: "tag-trend", label: "Tag Trend", keywords: ["tag", "trend", "label"] },
      { value: "expense-by-store", label: "Expense by Store", keywords: ["store", "merchant", "shop"] },
      { value: "expense-by-location", label: "Expense by Location", keywords: ["location", "place", "city"] },
      { value: "expense-calendar-heatmap", label: "Expense Calendar Heatmap", keywords: ["calendar", "heatmap", "daily"] },
      { value: "mutual-funds-allocation", label: "MF - Value by AMC", keywords: ["mf", "mutual fund", "amc", "allocation"] },
      { value: "mutual-funds-asset-class-allocation", label: "MF - Asset Class Allocation", keywords: ["mf", "mutual fund", "asset class", "equity", "debt"] },
      { value: "mutual-funds-yearly-investments", label: "MF - Yearly Investments", keywords: ["mf", "mutual fund", "yearly", "annual", "investment"] },
      { value: "mutual-funds-corpus", label: "MF - Corpus", keywords: ["mf", "mutual fund", "corpus", "value"] },
    ];

    insightCharts.forEach((chart) => {
      cmds.push({
        id: `insight:${chart.value}`,
        title: chart.label,
        subtitle: "Insights",
        category: "insights",
        icon: PieChart,
        keywords: [...chart.keywords, "insight", "chart"],
        execute: () => nav(`/insights?visualization=${chart.value}`),
      });
    });

    return cmds;
  }, [ledgerId, ledgerName, ledgers, logout, navigate, onClose, setLedger, setPendingAction]);

  return commands;
}
