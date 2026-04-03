from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

ACCOUNT_SUBTYPE_VALUES = Literal[
    "current_account", "savings_account", "isa", "fixed_deposit", "recurring_deposit",
    "pension", "gift_card", "cash", "fixed_asset", "depreciating_asset",
    "insurance", "savings_scheme",
    "credit_card", "loan", "other",
]

ACCOUNT_SUBTYPES = {
    "current_account": {"label": "Current Accounts", "types": ["asset"]},
    "savings_account": {"label": "Savings Accounts", "types": ["asset"]},
    "isa": {"label": "ISA Accounts", "types": ["asset"]},
    "fixed_deposit": {"label": "Fixed Deposits", "types": ["asset"]},
    "recurring_deposit": {"label": "Recurring Deposits", "types": ["asset"]},
    "pension": {"label": "Pension Accounts", "types": ["asset"]},
    "gift_card": {"label": "Gift Cards", "types": ["asset"]},
    "cash": {"label": "Cash", "types": ["asset"]},
    "fixed_asset": {"label": "Fixed Assets", "types": ["asset"]},
    "depreciating_asset": {"label": "Depreciating Assets", "types": ["asset"]},
    "insurance": {"label": "Insurance", "types": ["asset"]},
    "savings_scheme": {"label": "Savings Schemes", "types": ["asset"]},
    "credit_card": {"label": "Credit Cards", "types": ["liability"]},
    "loan": {"label": "Loans & Mortgages", "types": ["liability"]},
    "other": {"label": "Other Accounts", "types": ["asset", "liability"]},
}


class AccountBase(BaseModel, str_strip_whitespace=True):
    account_id: int
    name: str


class AccountCreate(BaseModel, str_strip_whitespace=True):
    name: str
    type: Literal["asset", "liability"]
    subtype: ACCOUNT_SUBTYPE_VALUES
    owner: Optional[str] = Field(None, max_length=100)
    opening_balance: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class AccountUpdate(BaseModel, str_strip_whitespace=True):
    name: Optional[str] = None
    subtype: Optional[ACCOUNT_SUBTYPE_VALUES] = None
    owner: Optional[str] = Field(None, max_length=100)
    opening_balance: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class Account(BaseModel, str_strip_whitespace=True):
    account_id: int
    ledger_id: int
    name: str
    type: Literal["asset", "liability"]
    subtype: ACCOUNT_SUBTYPE_VALUES
    owner: Optional[str] = None
    opening_balance: Optional[float] = None
    balance: float
    net_balance: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    last_transaction_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountSummary(BaseModel):
    total_credit: float
    total_debit: float
    transaction_count: int
    first_transaction_date: Optional[datetime] = None
    last_transaction_date: Optional[datetime] = None


class AccountTrendItem(BaseModel):
    period: str
    income: float
    expense: float


class AccountCategoryItem(BaseModel):
    name: str
    amount: float
    percentage: float


class AccountInsights(BaseModel):
    trend_data: list[AccountTrendItem]
    top_categories: list[AccountCategoryItem]
    summary: dict
