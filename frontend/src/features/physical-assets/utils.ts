// Physical Assets Utility Functions

import { format } from "date-fns";
import { PhysicalAsset } from "./types";
import { formatNumberAsCurrency } from "@components/shared/utils";

/**
 * Calculate unrealized profit/loss for a physical asset
 */
export const calculateUnrealizedPnL = (asset: PhysicalAsset): number => {
  const costBasis = asset.total_quantity * asset.average_cost_per_unit;
  const currentValue = asset.total_quantity * asset.latest_price_per_unit;
  return currentValue - costBasis;
};

/**
 * Calculate unrealized profit/loss percentage for a physical asset
 */
export const calculateUnrealizedPnLPercentage = (asset: PhysicalAsset): number => {
  const costBasis = asset.total_quantity * asset.average_cost_per_unit;
  const currentValue = asset.total_quantity * asset.latest_price_per_unit;

  if (costBasis === 0) return 0;

  return ((currentValue - costBasis) / costBasis) * 100;
};

/**
 * Format currency value with currency symbol (locale-aware)
 */
export const formatCurrencyWithSymbol = (value: number, currencySymbol: string): string => {
  return formatNumberAsCurrency(value, currencySymbol);
};

/**
 * Split currency value into main amount and decimal places for styling
 */
export const splitCurrencyForDisplay = (value: number, currencySymbol: string): { main: string; decimals: string } => {
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
 * Split quantity value into main amount and decimal places for styling
 */
export const splitQuantityForDisplay = (value: number, decimals: number = 4): { main: string; decimals: string } => {
  const formatted = value.toFixed(decimals);
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
  const formatted = Math.abs(value).toFixed(2);
  const parts = formatted.split('.');

  if (parts.length === 2) {
    return {
      main: `${parts[0]}.`,
      decimals: parts[1]
    };
  }

  return {
    main: formatted,
    decimals: ''
  };
};

/**
 * Format quantity with proper decimal places
 */
export const formatQuantity = (value: number, decimals: number = 4): string => {
  return value.toFixed(decimals);
};

/**
 * Get color for P&L display (green for profit or zero, red for loss)
 */
export const getPnLColor = (pnl: number): string => {
  if (pnl >= 0) return "green.500";
  return "red.500";
};

/**
 * Get sign for P&L display
 */
export const getPnLSign = (pnl: number): string => {
  if (pnl > 0) return "+";
  if (pnl < 0) return "";
  return "";
};

/**
 * Calculate total portfolio value
 */
export const calculateTotalPortfolioValue = (assets: PhysicalAsset[]): number => {
  return assets.reduce((total, asset) => total + asset.current_value, 0);
};

/**
 * Calculate total unrealized P&L
 */
export const calculateTotalUnrealizedPnL = (assets: PhysicalAsset[]): number => {
  return assets.reduce((total, asset) => total + calculateUnrealizedPnL(asset), 0);
};

/**
 * Calculate total unrealized P&L percentage
 */
export const calculateTotalUnrealizedPnLPercentage = (assets: PhysicalAsset[]): number => {
  const totalCostBasis = assets.reduce(
    (total, asset) => total + (asset.total_quantity * asset.average_cost_per_unit),
    0
  );
  const totalCurrentValue = calculateTotalPortfolioValue(assets);

  if (totalCostBasis === 0) return 0;

  return ((totalCurrentValue - totalCostBasis) / totalCostBasis) * 100;
};

/**
 * Validate asset transaction data
 */
export const validateAssetTransaction = (
  transactionType: "buy" | "sell",
  quantity: number,
  pricePerUnit: number,
  availableQuantity?: number
): { isValid: boolean; error?: string } => {
  if (quantity <= 0) {
    return { isValid: false, error: "Quantity must be greater than 0" };
  }

  if (pricePerUnit <= 0) {
    return { isValid: false, error: "Price per unit must be greater than 0" };
  }

  if (transactionType === "sell" && availableQuantity !== undefined && quantity > availableQuantity) {
    return {
      isValid: false,
      error: `Insufficient quantity. Available: ${availableQuantity}, Requested: ${quantity}`
    };
  }

  return { isValid: true };
};

/**
 * Get asset type display name
 */
export const getAssetTypeDisplayName = (assetType: { name: string; unit_symbol: string }): string => {
  return `${assetType.name} (${assetType.unit_symbol})`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  return format(date, "yyyy/MM/dd");
};

/**
 * Format date and time for display
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleString();
};

/**
 * Check if asset has any transactions
 */
export const hasTransactions = (asset: PhysicalAsset): boolean => {
  return asset.total_quantity > 0;
};

/**
 * Get asset status (has holdings or not)
 */
export const getAssetStatus = (asset: PhysicalAsset): "holding" | "empty" => {
  return asset.total_quantity > 0 ? "holding" : "empty";
};

/**
 * Calculate highest purchase price from buy transactions only
 */
export const calculateHighestPurchasePrice = (transactions: { transaction_type: string; price_per_unit: number }[]): number | null => {
  const buyTransactions = transactions.filter(t => t.transaction_type === "buy");
  if (buyTransactions.length === 0) return null;

  return Math.max(...buyTransactions.map(t => t.price_per_unit));
};

/**
 * Calculate lowest purchase price from buy transactions only
 */
export const calculateLowestPurchasePrice = (transactions: { transaction_type: string; price_per_unit: number }[]): number | null => {
  const buyTransactions = transactions.filter(t => t.transaction_type === "buy");
  if (buyTransactions.length === 0) return null;

  return Math.min(...buyTransactions.map(t => t.price_per_unit));
};