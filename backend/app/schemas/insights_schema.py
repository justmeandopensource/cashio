from app.schemas import JsonDecimal as Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel


class TrendDataPoint(BaseModel):
    period: str
    income: Decimal
    expense: Decimal


class HighestAmount(BaseModel):
    period: Optional[str]
    amount: Decimal


class CategorySummary(BaseModel):
    total: Decimal
    highest: HighestAmount
    average: Decimal


class IncomeExpenseTrendResponse(BaseModel):
    trend_data: List[TrendDataPoint]
    summary: dict[Literal["income", "expense"], CategorySummary]


class CategoryBreakdown(BaseModel):
    category_id: int
    name: str
    value: Decimal
    children: Optional[List["CategoryBreakdown"]] = None


class MonthOverviewResponse(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    prev_month_total_income: Decimal
    prev_month_total_expense: Decimal
    income_categories_breakdown: List[CategoryBreakdown]
    expense_categories_breakdown: List[CategoryBreakdown]
