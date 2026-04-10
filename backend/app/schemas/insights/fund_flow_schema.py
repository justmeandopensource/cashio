from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel


class FundFlowNode(BaseModel):
    account_id: int
    account_name: str
    ledger_id: int
    ledger_name: str
    currency_symbol: str
    account_type: str
    account_subtype: str
    total_outflow: Decimal
    total_inflow: Decimal
    total_volume: Decimal


class FundFlowLink(BaseModel):
    source_account_id: int
    source_account_name: str
    source_ledger_name: str
    target_account_id: int
    target_account_name: str
    target_ledger_name: str
    total_amount: Decimal
    transfer_count: int
    is_cross_ledger: bool
    target_amount: Optional[Decimal] = None
    source_currency: str
    target_currency: str


class FundFlowSummary(BaseModel):
    total_transfer_volume: Decimal
    total_transfer_count: int
    cross_ledger_count: int
    unique_corridors: int
    most_active_corridor_source: Optional[str] = None
    most_active_corridor_target: Optional[str] = None
    most_active_corridor_amount: Optional[Decimal] = None


class FundFlowResponse(BaseModel):
    nodes: List[FundFlowNode]
    links: List[FundFlowLink]
    summary: FundFlowSummary
    period_type: Literal["last_12_months", "last_month", "current_month"]
