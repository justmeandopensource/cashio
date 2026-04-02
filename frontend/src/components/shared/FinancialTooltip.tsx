import { type FC, type ReactNode } from "react";
import { Tooltip, Text, useColorModeValue } from "@chakra-ui/react";
import { Info } from "lucide-react";

/**
 * Definitions for common financial terms used throughout the app.
 * Each key maps to a human-readable explanation.
 */
const FINANCIAL_TERMS: Record<string, string> = {
  "net_worth":
    "Total assets minus total liabilities — a snapshot of your overall financial position.",
  "total_assets":
    "The combined value of everything you own, including bank accounts, investments, and physical assets.",
  "total_liabilities":
    "The total amount you owe, including loans, credit card balances, and other debts.",
  "xirr":
    "Extended Internal Rate of Return — your annualized return accounting for the timing and size of each cash flow.",
  "nav":
    "Net Asset Value — the per-unit market price of a mutual fund.",
  "unrealized_pnl":
    "Profit or loss on holdings you haven't sold yet. It becomes realized when you sell.",
  "realized_gain":
    "Profit or loss from assets you have already sold.",
  "budget":
    "A spending target for a category over a specific time period (monthly or yearly).",
  "budgeted":
    "The maximum amount you planned to spend in this category for the period.",
  "actual_spend":
    "The total amount actually spent so far in this budget category.",
  "remaining":
    "How much of your budget is left — budgeted amount minus actual spending.",
  "total_income":
    "All money received into this account, including salary, refunds, and transfers in.",
  "total_expenses":
    "All money spent from this account, including purchases, bills, and transfers out.",
  "savings_rate":
    "The percentage of income saved — calculated as (income − expenses) / income.",
  "amc":
    "Asset Management Company — the firm that manages a mutual fund (e.g., HDFC, ICICI, SBI).",
  "current_value":
    "Today's market value of your holdings, based on the latest NAV or price.",
  "total_invested":
    "The total amount of money you originally put in, before any gains or losses.",
  "opening_balance":
    "The starting balance of an account when it was first added to the ledger.",
};

interface FinancialTooltipProps {
  /** Key into FINANCIAL_TERMS, or a custom string to display */
  term: string;
  /** Override the tooltip text instead of using the dictionary */
  label?: string;
  /** The content to wrap — defaults to an info icon */
  children?: ReactNode;
}

/**
 * Wraps its children (or an info icon) with a tooltip explaining a financial term.
 *
 * Usage:
 *   <FinancialTooltip term="net_worth" />               // info icon with tooltip
 *   <FinancialTooltip term="xirr">                      // wrap custom content
 *     <Text>XIRR</Text>
 *   </FinancialTooltip>
 */
const FinancialTooltip: FC<FinancialTooltipProps> = ({
  term,
  label,
  children,
}) => {
  const tooltipText = label || FINANCIAL_TERMS[term] || term;
  const tooltipBg = useColorModeValue("gray.800", "gray.200");
  const tooltipColor = useColorModeValue("white", "gray.800");

  return (
    <Tooltip
      label={tooltipText}
      placement="top"
      hasArrow
      bg={tooltipBg}
      color={tooltipColor}
      fontSize="xs"
      px={3}
      py={2}
      borderRadius="md"
      maxW="260px"
      textAlign="center"
      openDelay={200}
    >
      {children || (
        <Text
          as="span"
          display="inline-flex"
          alignItems="center"
          cursor="help"
          ml={1}
          verticalAlign="middle"
        >
          <Info size={12} color="currentColor" style={{ color: "inherit" }} />
        </Text>
      )}
    </Tooltip>
  );
};

export default FinancialTooltip;
