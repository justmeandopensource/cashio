import { useMemo } from "react";
import { MutualFund, MfTransaction } from "../../types";
import {
  calculateFundPnL,
  calculateHighestPurchaseCost,
  calculateLowestPurchaseCost,
} from "../../utils";

const toNumber = (value: number | string): number => {
  if (value === undefined || value === null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

/** Normalize any date string to YYYY-MM-DD */
const toDateStr = (raw: string): string => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toISOString().split("T")[0];
};

export interface NavTimelinePoint {
  x: string;
  y: number;
  type: string;
  amount: number;
  units: number;
}

export interface InvestmentValueSeries {
  id: string;
  data: { x: string; y: number }[];
}

export interface TransactionBarDatum {
  date: string;
  buy: number;
  sell: number;
  switchIn: number;
  switchOut: number;
  [key: string]: string | number;
}

export interface CostBasisRange {
  lowest: number | null;
  average: number;
  highest: number | null;
  current: number;
}

export interface SummaryMetrics {
  totalInvested: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedGain: number;
  xirr: number | null;
  holdingPeriodDays: number | null;
}

export const useFundAnalyticsData = (
  fund: MutualFund,
  transactions: MfTransaction[],
) => {
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) =>
        new Date(a.transaction_date).getTime() -
        new Date(b.transaction_date).getTime(),
    );
  }, [transactions]);

  const navTimelineData = useMemo(() => {
    const points: NavTimelinePoint[] = sortedTransactions.map((t) => ({
      x: toDateStr(t.transaction_date),
      y: toNumber(t.nav_per_unit),
      type: t.transaction_type,
      amount: toNumber(t.total_amount),
      units: toNumber(t.units),
    }));

    // Add current NAV as final point
    const latestNav = toNumber(fund.latest_nav);
    if (latestNav > 0) {
      const today = new Date().toISOString().split("T")[0];
      const lastDate =
        points.length > 0 ? points[points.length - 1].x : today;
      if (lastDate !== today) {
        points.push({
          x: today,
          y: latestNav,
          type: "current",
          amount: 0,
          units: 0,
        });
      }
    }

    return points;
  }, [sortedTransactions, fund.latest_nav]);

  const investmentValueData = useMemo((): InvestmentValueSeries[] => {
    if (sortedTransactions.length === 0) return [];

    let cumulativeInvested = 0;
    let cumulativeUnits = 0;

    const investedPoints: { x: string; y: number }[] = [];
    const valuePoints: { x: string; y: number }[] = [];

    for (const t of sortedTransactions) {
      const amount = toNumber(t.total_amount);
      const units = toNumber(t.units);
      const nav = toNumber(t.nav_per_unit);

      if (t.transaction_type === "buy" || t.transaction_type === "switch_in") {
        cumulativeInvested += amount;
        cumulativeUnits += units;
      } else {
        // sell or switch_out: reduce by cost basis if available, else proportional
        const costBasis = toNumber(t.cost_basis_of_units_sold || 0);
        cumulativeInvested -= costBasis > 0 ? costBasis : amount;
        cumulativeUnits -= units;
      }

      // Clamp to zero
      if (cumulativeInvested < 0) cumulativeInvested = 0;
      if (cumulativeUnits < 0) cumulativeUnits = 0;

      investedPoints.push({
        x: toDateStr(t.transaction_date),
        y: Math.round(cumulativeInvested * 100) / 100,
      });
      valuePoints.push({
        x: toDateStr(t.transaction_date),
        y: Math.round(cumulativeUnits * nav * 100) / 100,
      });
    }

    // Add current value point
    const latestNav = toNumber(fund.latest_nav);
    if (latestNav > 0 && cumulativeUnits > 0) {
      const today = new Date().toISOString().split("T")[0];
      const lastDate =
        investedPoints.length > 0
          ? investedPoints[investedPoints.length - 1].x
          : today;
      if (lastDate !== today) {
        investedPoints.push({
          x: today,
          y: Math.round(cumulativeInvested * 100) / 100,
        });
        valuePoints.push({
          x: today,
          y: Math.round(cumulativeUnits * latestNav * 100) / 100,
        });
      }
    }

    return [
      { id: "Invested", data: investedPoints },
      { id: "Value", data: valuePoints },
    ];
  }, [sortedTransactions, fund.latest_nav]);

  const transactionBarData = useMemo((): TransactionBarDatum[] => {
    return sortedTransactions.map((t) => {
      const amount = toNumber(t.total_amount);
      return {
        date: toDateStr(t.transaction_date),
        buy: t.transaction_type === "buy" ? amount : 0,
        sell: t.transaction_type === "sell" ? -amount : 0,
        switchIn: t.transaction_type === "switch_in" ? amount : 0,
        switchOut: t.transaction_type === "switch_out" ? -amount : 0,
      };
    });
  }, [sortedTransactions]);

  const costBasisRange = useMemo((): CostBasisRange => {
    const purchaseTransactions = transactions.map((t) => ({
      transaction_type: t.transaction_type,
      nav_per_unit: toNumber(t.nav_per_unit),
    }));

    return {
      lowest: calculateLowestPurchaseCost(purchaseTransactions),
      average: toNumber(fund.average_cost_per_unit),
      highest: calculateHighestPurchaseCost(purchaseTransactions),
      current: toNumber(fund.latest_nav),
    };
  }, [transactions, fund.average_cost_per_unit, fund.latest_nav]);

  const summaryMetrics = useMemo((): SummaryMetrics => {
    const { unrealizedPnl, pnlPercentage } = calculateFundPnL(fund);
    return {
      totalInvested: toNumber(fund.total_invested_cash),
      currentValue: toNumber(fund.current_value),
      unrealizedPnl,
      unrealizedPnlPercent: pnlPercentage,
      realizedGain: toNumber(fund.total_realized_gain),
      xirr: fund.xirr_percentage ?? null,
      holdingPeriodDays: fund.holding_period_days ?? null,
    };
  }, [fund]);

  return {
    navTimelineData,
    investmentValueData,
    transactionBarData,
    costBasisRange,
    summaryMetrics,
    hasTransactions: transactions.length > 0,
  };
};
