import { MutualFund, MfTransaction, AmcSummary, MutualFundSummary } from "./types";
import { formatNumberAsCurrency } from "@components/shared/utils";

// Format NAV to 2 decimal places
export const formatNav = (nav: number | string): string => {
  const numValue = typeof nav === 'string' ? parseFloat(nav) : nav;
  if (isNaN(numValue)) return "0.00";
  return numValue.toFixed(2);
};

// Format units to 3 decimal places
export const formatUnits = (units: number | string): string => {
  const numValue = typeof units === 'string' ? parseFloat(units) : units;
  if (isNaN(numValue)) return "0.000";
  return numValue.toFixed(3);
};

// Format amounts to 2 decimal places
export const formatAmount = (amount: number | string): string => {
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numValue)) return "0.00";
  return numValue.toFixed(2);
};

// Calculate P&L for a fund
export const calculateFundPnL = (fund: MutualFund): { pnl: number; pnlPercentage: number; unrealizedPnl: number; realizedPnl: number } => {
  const toNumber = (value: number | string): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const totalUnits = toNumber(fund.total_units);
  const avgCostPerUnit = toNumber(fund.average_cost_per_unit);
  const totalInvestedCash = toNumber(fund.total_invested_cash);
  const currentValue = toNumber(fund.current_value);
  const realizedGain = toNumber(fund.total_realized_gain || 0);

  const totalInvested = totalInvestedCash || (totalUnits * avgCostPerUnit);
  const unrealizedPnl = currentValue - totalInvested;
  const pnl = unrealizedPnl + realizedGain;
  const pnlPercentage = totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : 0;

  return { pnl, pnlPercentage, unrealizedPnl, realizedPnl: realizedGain };
};

// Calculate summary for AMC
export const calculateAmcSummary = (amcFunds: MutualFund[]): AmcSummary => {
  const toNumber = (value: number | string): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const totalFunds = amcFunds.length;
  const totalUnits = amcFunds.reduce((sum, fund) => sum + toNumber(fund.total_units), 0);
  const totalInvested = amcFunds.reduce((sum, fund) => {
    const investedCash = toNumber(fund.total_invested_cash);
    const calculated = toNumber(fund.total_units) * toNumber(fund.average_cost_per_unit);
    return sum + (investedCash || calculated);
  }, 0);
  const currentValue = amcFunds.reduce((sum, fund) => sum + toNumber(fund.current_value), 0);
  const totalRealizedGain = amcFunds.reduce((sum, fund) => sum + toNumber(fund.total_realized_gain || 0), 0);
  const costBasis = totalInvested;
  const unrealizedPnl = currentValue - costBasis;
  const unrealizedPnlPercentage = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

  return {
    amc_id: amcFunds[0]?.amc_id || 0,
    name: amcFunds[0]?.amc?.name || '',
    total_funds: totalFunds,
    total_units: totalUnits,
    average_cost_per_unit: totalUnits > 0 ? costBasis / totalUnits : 0,
    latest_nav: 0, // Would need weighted average calculation
    current_value: currentValue,
    total_invested: totalInvested,
    total_realized_gain: totalRealizedGain,
    unrealized_pnl: unrealizedPnl,
    unrealized_pnl_percentage: unrealizedPnlPercentage,
  };
};

// Calculate summary for individual fund
export const calculateFundSummary = (fund: MutualFund): MutualFundSummary => {
  const toNumber = (value: number | string): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const totalUnits = toNumber(fund.total_units);
  const avgCostPerUnit = toNumber(fund.average_cost_per_unit);
  const totalInvestedCash = toNumber(fund.total_invested_cash);
  const currentValue = toNumber(fund.current_value);
  const realizedGain = toNumber(fund.total_realized_gain || 0);

  const costBasis = totalInvestedCash || (totalUnits * avgCostPerUnit);
  const totalInvested = totalInvestedCash || (totalUnits * avgCostPerUnit);
  const unrealizedPnl = currentValue - costBasis;
  const unrealizedPnlPercentage = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

  return {
    mutual_fund_id: fund.mutual_fund_id,
    name: fund.name,
    amc_name: fund.amc?.name || '',
    total_units: totalUnits,
    average_cost_per_unit: avgCostPerUnit,
    latest_nav: toNumber(fund.latest_nav),
    current_value: currentValue,
    total_invested: totalInvested,
    total_realized_gain: realizedGain,
    unrealized_pnl: unrealizedPnl,
    unrealized_pnl_percentage: unrealizedPnlPercentage,
  };
};

// Validate buy/sell form data
export const validateBuySellForm = (data: {
  units: number;
  nav_per_unit: number;
  account_id: number;
}): string[] => {
  const errors: string[] = [];

  if (data.units <= 0) {
    errors.push("Units must be greater than 0");
  }

  if (data.nav_per_unit <= 0) {
    errors.push("NAV per unit must be greater than 0");
  }

  if (!data.account_id) {
    errors.push("Account is required");
  }

  return errors;
};



// Get transaction type display text
export const getTransactionTypeText = (type: MfTransaction['transaction_type']): string => {
  switch (type) {
    case 'buy':
      return 'Buy';
    case 'sell':
      return 'Sell';
    case 'switch_out':
      return 'Switch Out';
    case 'switch_in':
      return 'Switch In';
    default:
      return type;
  }
};

// Format P&L with color indication
export const formatPnL = (pnl: number): { text: string; isPositive: boolean } => {
  const formatted = formatAmount(Math.abs(pnl));
  const isPositive = pnl >= 0;
  return {
    text: `${formatted}`,
    isPositive,
  };
};

// Format percentage with color indication
export const formatPercentage = (percentage: number): { text: string; isPositive: boolean } => {
  const formatted = Math.abs(percentage).toFixed(2);
  const isPositive = percentage >= 0;
  return {
    text: `${formatted}%`,
    isPositive,
  };
};

/**
 * Split currency value into main amount and decimal places for styling
 */
export const splitCurrencyForDisplay = (value: number, currencySymbol: string): { main: string; decimals: string } => {
  if (isNaN(value)) value = 0;
  const formatted = formatNumberAsCurrency(value, currencySymbol);
  const parts = formatted.split('.');

  if (parts.length === 2) {
    return {
      main: `${parts[0]}.`,
      decimals: parts[1]
    };
  }

  // If no decimal places, return the whole amount as main
  return {
    main: formatted,
    decimals: ''
  };
};

/**
 * Split percentage value into main amount and decimal places for styling
 */
export const splitPercentageForDisplay = (value: number): { main: string; decimals: string } => {
  if (isNaN(value)) value = 0;
  const formatted = Math.abs(value).toFixed(2);
  const parts = formatted.split('.');

  if (parts.length === 2) {
    return {
      main: parts[0],
      decimals: `.${parts[1]}%`
    };
  }

  // If no decimal places, return the whole amount as main
  return {
    main: formatted,
    decimals: ''
  };
};

/**
 * Calculate highest purchase cost from buy and switch_in transactions
 */
export const calculateHighestPurchaseCost = (transactions: { transaction_type: string; nav_per_unit: number }[]): number | null => {
  const purchaseTransactions = transactions.filter(t => t.transaction_type === "buy" || t.transaction_type === "switch_in");
  if (purchaseTransactions.length === 0) return null;

  return Math.max(...purchaseTransactions.map(t => t.nav_per_unit));
};

/**
 * Calculate lowest purchase cost from buy and switch_in transactions
 */
export const calculateLowestPurchaseCost = (transactions: { transaction_type: string; nav_per_unit: number }[]): number | null => {
  const purchaseTransactions = transactions.filter(t => t.transaction_type === "buy" || t.transaction_type === "switch_in");
  if (purchaseTransactions.length === 0) return null;

  return Math.min(...purchaseTransactions.map(t => t.nav_per_unit));
};