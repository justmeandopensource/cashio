// Physical Assets TypeScript Types

export interface AssetType {
  asset_type_id: number;
  ledger_id: number;
  name: string;
  unit_name: string;
  unit_symbol: string;
  description?: string;
  created_at: string;
}

export interface PhysicalAsset {
  physical_asset_id: number;
  ledger_id: number;
  asset_type_id: number;
  name: string;
  total_quantity: number;
  average_cost_per_unit: number;
  latest_price_per_unit: number;
  last_price_update?: string;
  current_value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  asset_type?: AssetType;
}

export interface AssetTransaction {
  asset_transaction_id: number;
  ledger_id: number;
  physical_asset_id: number;
  transaction_type: "buy" | "sell";
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  account_id: number;
  transaction_date: string;
  notes?: string | null;
  created_at: string;
  physical_asset?: PhysicalAsset;
  account_name?: string;
}

// Form types for creating/updating
export interface AssetTypeCreate {
  name: string;
  unit_name: string;
  unit_symbol: string;
  description?: string;
}

export interface AssetTypeUpdate {
  name?: string;
  unit_name?: string;
  unit_symbol?: string;
  description?: string;
}

export interface PhysicalAssetCreate {
  name: string;
  asset_type_id: number;
  notes?: string;
}

export interface PhysicalAssetUpdate {
  name?: string;
  asset_type_id?: number;
  notes?: string;
}

export interface PhysicalAssetPriceUpdate {
  latest_price_per_unit: number;
}

export interface AssetTransactionCreate {
  physical_asset_id: number;
  transaction_type: "buy" | "sell";
  quantity: number;
  price_per_unit: number;
  account_id: number;
  transaction_date: string;
  notes?: string;
}

// Analytics types
export interface PhysicalAssetSummary {
  total_assets: number;
  total_value: number;
  total_unrealized_pnl: number;
  total_unrealized_pnl_percentage: number;
}

export interface AssetTypeSummary {
  asset_type_id: number;
  name: string;
  unit_name: string;
  unit_symbol: string;
  total_quantity: number;
  average_cost_per_unit: number;
  latest_price_per_unit: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percentage: number;
}

// Component prop types
export interface PhysicalAssetsMainProps {
  onAddTransaction?: () => void;
}


export interface BuySellAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: PhysicalAsset;
  onTransactionCompleted: () => void;
}

export interface CreateAssetTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onAssetTypeCreated: (_assetType: AssetType) => void;
}

export interface CreatePhysicalAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onAssetCreated: (_asset: PhysicalAsset) => void;
  assetTypeId?: number;
}

export interface UpdatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: PhysicalAsset;
  // eslint-disable-next-line no-unused-vars
  onPriceUpdated: (_asset: PhysicalAsset) => void;
}

export interface AssetTransactionHistoryProps {
  assetTypes: AssetType[];
  physicalAssets: PhysicalAsset[];
  transactions?: AssetTransaction[];
  onDataChange: () => void;
  initialAssetFilter?: string;
}

// Utility types
export type TransactionType = "buy" | "sell";
export type AccountType = "asset" | "liability";