from datetime import datetime
from app.schemas import JsonDecimal as Decimal
from typing import List, Literal

from pydantic import BaseModel, field_validator


class BudgetCreate(BaseModel):
    category_id: int
    period: Literal["monthly", "yearly"]
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class BudgetUpdate(BaseModel):
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class Budget(BaseModel):
    budget_id: int
    user_id: int
    ledger_id: int
    category_id: int
    category_name: str
    period: str
    amount: Decimal
    actual_spend: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BudgetSummary(BaseModel):
    period: str
    period_label: str
    total_budgeted: Decimal
    total_spent: Decimal
    budgets: List[Budget]
