from app.schemas import JsonDecimal as Decimal
from typing import List

from pydantic import BaseModel


class AccountNetWorthItem(BaseModel):
    account_id: int
    name: str
    type: str
    net_balance: Decimal

    class Config:
        from_attributes = True


class MutualFundNetWorthItem(BaseModel):
    mutual_fund_id: int
    name: str
    current_value: Decimal
    total_invested_cash: Decimal
    unrealized_gain: Decimal

    class Config:
        from_attributes = True


class PhysicalAssetNetWorthItem(BaseModel):
    physical_asset_id: int
    name: str
    asset_type_name: str
    current_value: Decimal

    class Config:
        from_attributes = True


class AssetAllocationItem(BaseModel):
    label: str
    value: Decimal
    percentage: Decimal


class NetWorthResponse(BaseModel):
    net_worth: Decimal
    total_assets: Decimal
    total_liabilities: Decimal
    accounts_assets_total: Decimal
    accounts_liabilities_total: Decimal
    mutual_funds_total: Decimal
    physical_assets_total: Decimal
    mutual_funds_total_invested: Decimal
    mutual_funds_unrealized_gain: Decimal
    asset_accounts: List[AccountNetWorthItem]
    liability_accounts: List[AccountNetWorthItem]
    mutual_funds: List[MutualFundNetWorthItem]
    physical_assets: List[PhysicalAssetNetWorthItem]
    asset_allocation: List[AssetAllocationItem]
